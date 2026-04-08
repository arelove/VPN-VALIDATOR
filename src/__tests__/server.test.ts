import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../db', () => ({
  pool: { query: vi.fn() },
  initDb: vi.fn(),
}));

import { pool } from '../db';
import { buildApp } from '../server';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('GET /api/stats', () => {
  it('возвращает корректную структуру и статус 200', async () => {
    (pool.query as any)
      .mockResolvedValueOnce({ rows: [{ count: '5' }] })
      .mockResolvedValueOnce({ rows: [{ count: '12' }] })
      .mockResolvedValueOnce({ rows: [{ count: '3' }] })
      .mockResolvedValueOnce({ rows: [{ avg_sec: '720' }] });

    const app = buildApp();
    const res = await app.inject({ method: 'GET', url: '/api/stats' });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.totalUsers).toBe(5);
    expect(body.totalEvents).toBe(12);
    expect(body.totalErrors).toBe(3);
    expect(body.avgSessionSec).toBe(720);
  });
});

describe('GET /api/sessions', () => {
  it('возвращает массив сессий', async () => {
    (pool.query as any).mockResolvedValueOnce({
      rows: [
        { id: 1, username: 'user4', ip_address: '192.168.1.50',
          login_at: '2026-01-12T08:50:10Z', logout_at: '2026-01-12T09:10:22Z',
          duration_sec: 1212 }
      ]
    });

    const app = buildApp();
    const res = await app.inject({ method: 'GET', url: '/api/sessions' });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(Array.isArray(body)).toBe(true);
    expect(body[0].username).toBe('user4');
    expect(body[0].duration_sec).toBe(1212);
  });
});

describe('GET /api/events', () => {
  it('возвращает массив событий', async () => {
    (pool.query as any).mockResolvedValueOnce({
      rows: [
        { id: 1, username: 'user4', event_type: 'LOGIN',
          level: 'INFO', ip_address: '192.168.1.50',
          message: 'User user4 logged in from 192.168.1.50',
          timestamp: '2026-01-12T08:50:10Z' }
      ]
    });

    const app = buildApp();
    const res = await app.inject({ method: 'GET', url: '/api/events' });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body[0].event_type).toBe('LOGIN');
    expect(body[0].level).toBe('INFO');
  });
});

describe('обработка ошибок БД', () => {
  it('GET /api/stats возвращает 500 при ошибке БД', async () => {
    (pool.query as any).mockRejectedValueOnce(new Error('DB connection lost'));

    const app = buildApp();
    const res = await app.inject({ method: 'GET', url: '/api/stats' });

    expect(res.statusCode).toBe(500);
    expect(res.json().error).toBe('Database error');
  });

  it('GET /api/sessions возвращает 500 при ошибке БД', async () => {
    (pool.query as any).mockRejectedValueOnce(new Error('DB connection lost'));

    const app = buildApp();
    const res = await app.inject({ method: 'GET', url: '/api/sessions' });

    expect(res.statusCode).toBe(500);
  });

  it('GET /api/events возвращает 500 при ошибке БД', async () => {
    (pool.query as any).mockRejectedValueOnce(new Error('DB connection lost'));

    const app = buildApp();
    const res = await app.inject({ method: 'GET', url: '/api/events' });

    expect(res.statusCode).toBe(500);
  });
});