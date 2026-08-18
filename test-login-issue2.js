import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3000/api';

async function run() {
  const email = `testlogin2@example.com`;
  const password = 'password123';
  
  // register
  const regRes = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ displayName: 'T', username: 'tlogin2', email, password })
  });
  console.log("Cookies from register:", regRes.headers.raw()['set-cookie']);

  // login
  const loginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  
  const cookies = loginRes.headers.raw()['set-cookie'];
  console.log("Cookies from login:", cookies);
}
run();
