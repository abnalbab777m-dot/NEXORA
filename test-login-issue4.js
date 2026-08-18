import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3000/api';

async function run() {
  const email = `testlogin4@example.com`;
  const password = 'password123';
  
  await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Forwarded-Proto': 'https' },
    body: JSON.stringify({ displayName: 'T', username: 'tlogin4', email, password })
  });
  
  const loginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Forwarded-Proto': 'https' },
    body: JSON.stringify({ email, password })
  });
  
  console.log("Cookies from login with X-Forwarded-Proto:", loginRes.headers.raw()['set-cookie']);
}
run();
