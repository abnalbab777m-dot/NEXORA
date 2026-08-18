import fetch from 'node-fetch';
const BASE_URL = 'http://localhost:3000/api';
async function run() {
  const email = `test6@example.com`;
  const password = 'password123';
  
  const regRes = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ displayName: 'T', username: 'tlogin6', email, password })
  });
  console.log("Reg Status:", regRes.status);
  console.log("Reg Body:", await regRes.text());
  console.log("Reg Cookies:", regRes.headers.raw()['set-cookie']);

  const loginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  console.log("Login Status:", loginRes.status);
  console.log("Login Body:", await loginRes.text());
  console.log("Login Cookies:", loginRes.headers.raw()['set-cookie']);
}
run();
