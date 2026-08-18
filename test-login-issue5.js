import fetch from 'node-fetch';
const BASE_URL = 'http://localhost:3000/api';
async function run() {
  const loginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: "flowuser54868@example.com", password: "password123" })
  });
  console.log("Status:", loginRes.status);
  console.log("Body:", await loginRes.text());
}
run();
