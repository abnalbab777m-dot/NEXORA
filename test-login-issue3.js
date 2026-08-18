import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3000/api';

async function run() {
  const email = `testlogin3@example.com`;
  const password = 'password123';
  
  const regRes = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ displayName: 'T', username: 'tlogin3', email, password })
  });
  console.log("Register headers:", regRes.headers.raw());
}
run();
