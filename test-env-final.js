import fetch from 'node-fetch';
import { Pool } from 'pg';

const BASE_URL = 'http://localhost:3000/api';

async function run() {
  const rand = Math.floor(Math.random() * 1000000);
  const email = `env_check${rand}@example.com`;
  const username = `envcheck${rand}`;
  const password = 'password123';
  
  // 1. DB connection test - via DB directly just to be sure
  let dbConnected = false;
  try {
     const pool = new Pool({
        host: process.env.SQL_HOST,
        user: process.env.SQL_USER,
        password: process.env.SQL_PASSWORD,
        database: process.env.SQL_DB_NAME,
     });
     const res = await pool.query('SELECT 1 as val');
     if (res.rows[0].val === 1) dbConnected = true;
     await pool.end();
  } catch (e) {
     console.error("DB check failed", e);
  }

  // 2. Register
  await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ displayName: 'Env Check', username, email, password })
  });

  // 3. Login
  const loginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const loginPass = loginRes.status === 200;
  
  const cookies = loginRes.headers.raw()['set-cookie'];
  
  // 4. Me Check
  let mePass = false;
  if (cookies) {
     const meRes = await fetch(`${BASE_URL}/auth/me`, {
       headers: { 'cookie': cookies[0] }
     });
     mePass = meRes.status === 200;
  }
  
  // 5. Session after refresh (another me check without re-login)
  let sessionPass = false;
  if (cookies) {
     const meRes2 = await fetch(`${BASE_URL}/auth/me`, {
       headers: { 'cookie': cookies[0] }
     });
     sessionPass = meRes2.status === 200;
  }
  
  console.log(`DB_CONN=${dbConnected}`);
  console.log(`LOGIN=${loginPass}`);
  console.log(`ME_ROUTE=${mePass}`);
  console.log(`SESSION=${sessionPass}`);
}

run();
