import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3000/api';
async function run() {
  const email = 'realtest@example.com';
  const password = 'password123';
  
  await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ displayName: 'Real', username: 'real', email, password })
  });

  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  console.log("Login HTTP", res.status);
  const cookies = res.headers.raw()['set-cookie'];
  console.log("Cookies:", cookies);
}
run();
