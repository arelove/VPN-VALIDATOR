import Fastify from 'fastify';
import fastifyStatic from '@fastify/static';
import path from 'path';
import { pool, initDb } from './db';

const app = Fastify({ logger: false });

// Раздаём фронтенд из public/
app.register(fastifyStatic, {
  root: path.join(process.cwd(), 'public'),
});

// Все сессии с именем пользователя
app.get('/api/sessions', async (_, reply) => {
  const result = await pool.query(`
    SELECT
      s.id,
      u.username,
      s.ip_address,
      s.login_at,
      s.logout_at,
      s.duration_sec
    FROM sessions s
    JOIN users u ON u.id = s.user_id
    ORDER BY s.login_at ASC
  `);
  return reply.send(result.rows);
});

// Все события с именем пользователя
app.get('/api/events', async (_, reply) => {
  const result = await pool.query(`
    SELECT
      e.id,
      COALESCE(u.username, 'system') AS username,
      e.event_type,
      e.level,
      e.ip_address,
      e.message,
      e.timestamp
    FROM events e
    LEFT JOIN users u ON u.id = e.user_id
    ORDER BY e.timestamp ASC
  `);
  return reply.send(result.rows);
});

// Сводная статистика
app.get('/api/stats', async (_, reply) => {
  const [users, events, errors, avgSession] = await Promise.all([
    pool.query(`SELECT COUNT(DISTINCT id) AS count FROM users`),
    pool.query(`SELECT COUNT(*) AS count FROM events`),
    pool.query(`SELECT COUNT(*) AS count FROM events WHERE level = 'ERROR'`),
    pool.query(`SELECT ROUND(AVG(duration_sec)) AS avg_sec FROM sessions`),
  ]);

  return reply.send({
    totalUsers:         Number(users.rows[0].count),
    totalEvents:        Number(events.rows[0].count),
    totalErrors:        Number(errors.rows[0].count),
    avgSessionSec:      Number(avgSession.rows[0].avg_sec),
  });
});

// Запуск
const start = async () => {
  await initDb();
  await app.listen({ port: 3000, host: '0.0.0.0' });
  console.log('Server running at http://localhost:3000');
};

start();