import fetch from 'node-fetch';
const BASE_URL = 'http://localhost:3000/api';
async function run() {
  const email = `test9@example.com`;
  const password = 'password123';
  
  const regRes = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ displayName: 'T', username: 'tlogin9', email, phone: '0987654321', password })
  });
  console.log("Reg Status:", regRes.status);

  const loginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  console.log("Login Status:", loginRes.status);
  
  const cookie = loginRes.headers.raw()['set-cookie'][0];
  console.log("Cookie:", cookie);

  const meRes = await fetch(`${BASE_URL}/auth/me`, {
    headers: { 'cookie': cookie }
  });
  console.log("Me Status:", meRes.status);
  console.log("Me Body:", await meRes.text());
}
run();
