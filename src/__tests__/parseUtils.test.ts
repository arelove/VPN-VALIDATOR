import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { parseLine, resolveYear } from '../parseUtils';

// ─── parseLine ────────────────────────────────────────────────

describe('parseLine', () => {
  it('возвращает null для строк не от app[]', () => {
    const lines = [
      'Jan 12 08:00:01 vpn-gateway systemd[1]: Started Session Manager.',
      'Jan 12 08:01:12 vpn-gateway sshd[1001]: Accepted password for user1',
      'Jan 12 08:15:33 vpn-gateway kernel: [UFW BLOCK] IN=eth0',
      '',
      '   ',
    ];
    lines.forEach((line) => expect(parseLine(line)).toBeNull());
  });

  it('парсит LOGIN событие', () => {
    const line =
      'Jan 12 08:50:10 vpn-gateway app[4000]: INFO User user4 logged in from 192.168.1.50';
    const event = parseLine(line);

    expect(event).not.toBeNull();
    expect(event!.eventType).toBe('LOGIN');
    expect(event!.level).toBe('INFO');
    expect(event!.username).toBe('user4');
    expect(event!.ipAddress).toBe('192.168.1.50');
    expect(event!.message).toBe('User user4 logged in from 192.168.1.50');
  });

  it('парсит LOGOUT событие', () => {
    const line = 'Jan 12 09:10:22 vpn-gateway app[4000]: INFO User user4 logged out';
    const event = parseLine(line);

    expect(event).not.toBeNull();
    expect(event!.eventType).toBe('LOGOUT');
    expect(event!.level).toBe('INFO');
    expect(event!.username).toBe('user4');
    expect(event!.ipAddress).toBeNull();
  });

  it('парсит WARN событие с username', () => {
    const line = 'Jan 12 11:10:10 vpn-gateway app[4000]: WARN Invalid session token for user7';
    const event = parseLine(line);

    expect(event).not.toBeNull();
    expect(event!.eventType).toBe('WARN');
    expect(event!.level).toBe('WARN');
    expect(event!.username).toBe('user7');
  });

  it('парсит WARN без username', () => {
    const line = 'Jan 13 02:05:05 vpn-gateway app[4000]: WARN Memory usage high';
    const event = parseLine(line);

    expect(event).not.toBeNull();
    expect(event!.eventType).toBe('WARN');
    expect(event!.username).toBeNull();
  });

  it('парсит ERROR событие', () => {
    const line = 'Jan 12 10:30:00 vpn-gateway app[4000]: ERROR Database connection failed';
    const event = parseLine(line);

    expect(event).not.toBeNull();
    expect(event!.eventType).toBe('ERROR');
    expect(event!.level).toBe('ERROR');
    expect(event!.username).toBeNull();
    expect(event!.ipAddress).toBeNull();
    expect(event!.message).toBe('Database connection failed');
  });

  it('корректно парсит timestamp', () => {
    const line =
      'Jan 12 08:50:10 vpn-gateway app[4000]: INFO User user4 logged in from 192.168.1.50';
    const event = parseLine(line);
    expect(event!.timestamp).toBeInstanceOf(Date);
    expect(event!.timestamp.getMonth()).toBe(0); // январь = 0
    expect(event!.timestamp.getDate()).toBe(12);
    expect(event!.timestamp.getHours()).toBe(8);
    expect(event!.timestamp.getMinutes()).toBe(50);
  });

  it('возвращает null для app[] строки без корректного формата', () => {
    // Содержит app[] но без уровня INFO/WARN/ERROR
    const line = 'Jan 12 08:50:10 vpn-gateway app[4000]: DEBUG something';
    expect(parseLine(line)).toBeNull();
  });

  it('parses строки с разными PID у app', () => {
    const line =
      'Jan 12 09:56:10 vpn-gateway app[9999]: INFO User user4 logged in from 192.168.1.52';
    const event = parseLine(line);
    expect(event).not.toBeNull();
    expect(event!.username).toBe('user4');
    expect(event!.ipAddress).toBe('192.168.1.52');
  });
});

describe('parseLine — edge cases', () => {
  it('LOGIN без IP не падает', () => {
    const line = 'Jan 12 08:50:10 vpn-gateway app[4000]: INFO User user4 logged in';
    const event = parseLine(line);
    expect(event!.eventType).toBe('LOGIN');
    expect(event!.username).toBe('user4');
    expect(event!.ipAddress).toBeNull();
  });

  it('timestamp невалидный не крашит функцию', () => {
    const line = 'Jan 99 99:99:99 vpn-gateway app[4000]: ERROR Something failed';
    const event = parseLine(line);
    expect(event).not.toBeNull();
    expect(isNaN(event!.timestamp.getTime())).toBe(true);
  });

  it('очень длинное сообщение парсится корректно', () => {
    const msg = 'A'.repeat(1000);
    const line = `Jan 12 08:50:10 vpn-gateway app[4000]: ERROR ${msg}`;
    const event = parseLine(line);
    expect(event!.message).toBe(msg);
  });
});

// ─── resolveYear ─────────────────────────────────────────────

describe('resolveYear', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('возвращает текущий год в обычных условиях', () => {
    vi.setSystemTime(new Date('2026-04-09T10:00:00'));
    expect(resolveYear('Apr 9 10:00:00')).toBe(2026);
  });

  it('краевой случай: январь текущего года, лог от декабря прошлого', () => {
    vi.setSystemTime(new Date('2026-01-15T10:00:00'));
    expect(resolveYear('Dec 31 23:59:59')).toBe(2025);
  });

  it('краевой случай: февраль текущего года, лог от ноября прошлого', () => {
    vi.setSystemTime(new Date('2026-02-01T10:00:00'));
    expect(resolveYear('Nov 28 12:00:00')).toBe(2025);
  });

  it('март — ноябрьские логи НЕ откатываются', () => {
    vi.setSystemTime(new Date('2026-03-01T10:00:00'));
    // В марте currentMonth = 2, условие currentMonth <= 1 не выполняется
    expect(resolveYear('Nov 28 12:00:00')).toBe(2026);
  });

  it('декабрь не откатывает год назад', () => {
    vi.setSystemTime(new Date('2026-12-15T10:00:00'));
    expect(resolveYear('Dec 14 10:00:00')).toBe(2026);
  });
});
