import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

export const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

export async function initDb(): Promise<void> {
  const client = await pool.connect();

  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id        SERIAL PRIMARY KEY,
        username  VARCHAR(100) UNIQUE NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS events (
        id          SERIAL PRIMARY KEY,
        user_id     INTEGER REFERENCES users(id) ON DELETE SET NULL,
        event_type  VARCHAR(20) NOT NULL,
        level       VARCHAR(10) NOT NULL,
        ip_address  VARCHAR(45),
        message     TEXT NOT NULL,
        timestamp   TIMESTAMPTZ NOT NULL
      );
    `);

    await client.query(`
        CREATE UNIQUE INDEX IF NOT EXISTS idx_events_unique
        ON events (user_id, event_type, timestamp)
        WHERE user_id IS NOT NULL;
    `);

    await client.query(`
        CREATE UNIQUE INDEX IF NOT EXISTS idx_events_system_unique
        ON events (event_type, timestamp, message)
        WHERE user_id IS NULL;
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS sessions (
        id           SERIAL PRIMARY KEY,
        user_id      INTEGER REFERENCES users(id) ON DELETE CASCADE,
        ip_address   VARCHAR(45),
        login_at     TIMESTAMPTZ NOT NULL,
        logout_at    TIMESTAMPTZ,
        duration_sec INTEGER,
        UNIQUE (user_id, login_at)
      );
    `);

    console.log('OK: Database tables ready');
  } finally {
    client.release();
  }
}
