import * as fs from 'fs';
import * as readline from 'readline';
import * as path from 'path';

import { pool, initDb } from './db';

// Уровни логирования из syslog — соответствуют маркерам из примера в строках app[4000]
type EventLevel = 'INFO' | 'WARN' | 'ERROR';

// Бизнес-типы событий которые мы выделяем из сообщений VPN-агента
type EventType = 'LOGIN' | 'LOGOUT' | 'WARN' | 'ERROR';

// Нормализованное событие — то что уходит в БД после парсинга
interface VpnEvent {
  timestamp: Date;
  level: EventLevel;
  eventType: EventType;
  username: string | null;  // null для системных событий без пользователя
  ipAddress: string | null; // присутствует только в LOGIN
  message: string;
}

// Пытаемся распарсить одну строку лога.
// Возвращает null если строка не от VPN-агента (app[]).
function parseLine(line: string): VpnEvent | null {
  // Быстрая проверка до regex — отсекаем 99% строк от других процессов
  if (!line.includes('app[')) return null;

  // Формат syslog: <дата> <хост> <процесс>[<pid>]: <уровень> <сообщение>
  // Пример: Jan 12 08:50:10 vpn-gateway app[4000]: INFO User user4 logged in from 192.168.1.50
  const syslogRegex = /^(\w+\s+\d+\s+\d+:\d+:\d+)\s+\S+\s+app\[\d+\]:\s+(INFO|WARN|ERROR)\s+(.+)$/;
  const match = line.match(syslogRegex);

  if (!match) return null;

  const rawDate = match[1];
  const level = match[2];
  const message = match[3] ?? '';

  // syslog не содержит год — вместо хардкода 2026 определяем год динамически
  const year = resolveYear(rawDate);
  const timestamp = new Date(`${rawDate} ${year}`);

  let eventType: EventType;
  let username: string | null = null;
  let ipAddress: string | null = null;

  if (message.includes('logged in')) {
    // Пользователь подключился к VPN
    // Пример: "User user4 logged in from 192.168.1.50"
    eventType = 'LOGIN';
    const loginMatch = message.match(/User (\S+) logged in from ([\d.]+)/);
    if (loginMatch) {
      username = loginMatch[1] ?? null;
      ipAddress = loginMatch[2] ?? null;
    }
  } else if (message.includes('logged out')) {
    // Пользователь отключился от VPN
    // Пример: "User user4 logged out"
    eventType = 'LOGOUT';
    const logoutMatch = message.match(/User (\S+) logged out/);
    if (logoutMatch) {
      username = logoutMatch[1] ?? null;
    }
  } else if (level === 'WARN') {
    // Предупреждения — подозрительная активность, невалидные токены и т.д.
    // Username может быть упомянут в тексте, пробуем вытащить
    eventType = 'WARN';
    const userMatch = message.match(/user (\S+)/i);
    if (userMatch) username = userMatch[1] ?? null;
  } else {
    // Всё остальное от app[] с уровнем ERROR
    eventType = 'ERROR';
  }

  return {
    timestamp,
    level: level as EventLevel,
    eventType,
    username,
    ipAddress,
    message,
  };
}

// Читаем файл построчно через stream — не грузим весь лог в память сразу.
// Важно для больших файлов в реальных условиях (например логи VPN-агента).
async function parseLogFile(filePath: string): Promise<VpnEvent[]> {
  const events: VpnEvent[] = [];

  const fileStream = fs.createReadStream(filePath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity, // корректно обрабатываем CRLF (Windows-переносы строк)
  });

  for await (const line of rl) {
    const event = parseLine(line);
    if (event) {
      events.push(event);
      console.log(`✓ Parsed [${event.eventType}] ${event.username ?? 'system'} — ${event.message}`);
    }
  }

  return events;
}

// Определяем год для парсинга timestamp.
// Syslog не содержит год в строке, поэтому берём текущий.
// Краевой случай: если событие в декабре, а парсим в январе следующего года —
// откатываем год на 1 назад.
function resolveYear(rawDate: string): number {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth(); // 0 = январь

  // Вытаскиваем месяц из строки типа "Jan 12 08:50:10"
  const monthStr = rawDate.split(' ')[0];
  const eventMonth = new Date(`${monthStr} 1 2000`).getMonth();

  // Если сейчас январь/февраль, а событие в ноябре/декабре — это прошлый год
  if (currentMonth <= 1 && eventMonth >= 10) {
    return currentYear - 1;
  }

  return currentYear;
}

///////////////////// Сохранение в БД ////////////////////////

// Сохраняем события в БД
async function saveEvents(events: VpnEvent[]): Promise<void> {
  const client = await pool.connect();

  try {
    for (const event of events) {
      // Upsert пользователя если есть username
      let userId: number | null = null;

      if (event.username) {
        const userRes = await client.query(
          `INSERT INTO users (username)
           VALUES ($1)
           ON CONFLICT (username) DO UPDATE SET username = EXCLUDED.username
           RETURNING id`,
          [event.username]
        );
        userId = userRes.rows[0].id;
      }

      // Записываем событие
      await client.query(
        `INSERT INTO events (user_id, event_type, level, ip_address, message, timestamp)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [userId, event.eventType, event.level, event.ipAddress, event.message, event.timestamp]
      );
    }

    console.log('✓ Events saved to DB');

    // Вычисляем сессии — находим пары LOGIN/LOGOUT по каждому пользователю
    await client.query(`
      INSERT INTO sessions (user_id, ip_address, login_at, logout_at, duration_sec)
      SELECT
        l.user_id,
        l.ip_address,
        l.timestamp AS login_at,
        o.timestamp AS logout_at,
        EXTRACT(EPOCH FROM (o.timestamp - l.timestamp))::INTEGER AS duration_sec
      FROM events l
      JOIN LATERAL (
        SELECT timestamp FROM events
        WHERE user_id = l.user_id
          AND event_type = 'LOGOUT'
          AND timestamp > l.timestamp
        ORDER BY timestamp ASC
        LIMIT 1
      ) o ON true
      WHERE l.event_type = 'LOGIN'
      ON CONFLICT DO NOTHING;
    `);

    console.log('✓ Sessions calculated');
  } finally {
    client.release();
  }
}


///////////////// Запуск парсинга ////////////////////

const logPath = path.join(process.cwd(), 'system.log');

parseLogFile(logPath).then(async (events) => {
  console.log(`\n=== Распарсено событий: ${events.length} ===`);
  await initDb();
  await saveEvents(events);
  await pool.end();
  console.log('✓ Done');
});
