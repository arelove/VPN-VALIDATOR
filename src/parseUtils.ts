// Уровни логирования из syslog — соответствуют маркерам из примера в строках app[4000]
type EventLevel = 'INFO' | 'WARN' | 'ERROR';

// Бизнес-типы событий которые мы выделяем из сообщений VPN-агента
type EventType = 'LOGIN' | 'LOGOUT' | 'WARN' | 'ERROR';

// Нормализованное событие — то что уходит в БД после парсинга
export interface VpnEvent {
  timestamp: Date;
  level: EventLevel;
  eventType: EventType;
  username: string | null;  // null для системных событий без пользователя
  ipAddress: string | null; // присутствует только в LOGIN
  message: string;
}

// Определяем год для парсинга timestamp.
// Syslog не содержит год в строке, поэтому берём текущий.
// Краевой случай: если событие в декабре, а парсим в январе следующего года —
// откатываем год на 1 назад.
export function resolveYear(rawDate: string): number {
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

// Пытаемся распарсить одну строку лога.
// Возвращает null если строка не от VPN-агента (app[]).
export function parseLine(line: string): VpnEvent | null {
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
    const userMatch = message.match(/for\s+(\S+)$/i);
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