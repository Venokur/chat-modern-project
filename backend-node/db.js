import pg from 'pg';
const { Pool } = pg;

export const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'chatdb',
  password: process.env.DB_PASSWORD || 'password123',
  port: Number(process.env.DB_PORT) || 5432,
  max: 20,
  idleTimeoutMillis: 30000,
});

export const query = (text, params) => pool.query(text, params);
