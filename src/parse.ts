import * as fs from 'fs';
import * as readline from 'readline';
import * as path from 'path';

import { parseLine, VpnEvent } from './parseUtils';
import { pool, initDb } from './db';

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
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT DO NOTHING`,
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
