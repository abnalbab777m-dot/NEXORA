import fetch from 'node-fetch';
const BASE_URL = 'http://localhost:3000/api';
async function run() {
  const email = `test7@example.com`;
  const password = 'password123';
  
  const regRes = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ displayName: 'T', username: 'tlogin7', email, password })
  });
  console.log("Reg Status:", regRes.status);
  console.log("Reg Body:", await regRes.text());
}
run();
