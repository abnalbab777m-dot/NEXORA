import fetch from 'node-fetch';
import { Pool } from 'pg';

const BASE_URL = 'http://localhost:3000/api';
const pool = new Pool({
  host: process.env.SQL_HOST,
  user: process.env.SQL_USER,
  password: process.env.SQL_PASSWORD,
  database: process.env.SQL_DB_NAME,
});

async function run() {
  const userNum = Math.floor(Math.random() * 10000);
  const email = `test_double_${userNum}@example.com`;
  const password = 'password123';
  
  // 1. Register
  await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      displayName: 'Double Spender',
      username: 'doublespender' + userNum,
      email,
      phone: `999888${userNum}`,
      password
    })
  });

  // 2. Login
  const loginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const cookie = loginRes.headers.raw()['set-cookie'][0];
  const loginData = await loginRes.json();
  const userId = loginData.user.id;

  // 3. Fund wallet directly in DB for testing
  await pool.query(`UPDATE wallets SET available_balance = 100 WHERE user_id = $1`, [userId]);

  // 4. Concurrent Withdrawal Test (Try to withdraw $100 twice at the exact same time)
  const req1 = fetch(`${BASE_URL}/withdrawals`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'cookie': cookie },
    body: JSON.stringify({ amount: 100 })
  });
  const req2 = fetch(`${BASE_URL}/withdrawals`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'cookie': cookie },
    body: JSON.stringify({ amount: 100 })
  });
  
  const [res1, res2] = await Promise.all([req1, req2]);
  const text1 = await res1.text();
  const text2 = await res2.text();

  console.log("Withdraw 1:", res1.status, text1);
  console.log("Withdraw 2:", res2.status, text2);
  
  // Check final DB state
  const { rows } = await pool.query(`SELECT * FROM withdrawals WHERE user_id = $1`, [userId]);
  console.log("Total withdrawals inserted:", rows.length);
  
  const walletRes = await pool.query(`SELECT available_balance FROM wallets WHERE user_id = $1`, [userId]);
  console.log("Final balance:", walletRes.rows[0].available_balance);

  process.exit(0);
}
run();
