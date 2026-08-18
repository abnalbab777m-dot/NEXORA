import fetch from 'node-fetch';
const BASE_URL = 'http://localhost:3000/api';
async function run() {
  const loginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: "flowuser73849@example.com", password: "password123" })
  });
  console.log("Login Status:", loginRes.status);
  console.log("Login Cookies:", loginRes.headers.raw()['set-cookie']);
}
run();
