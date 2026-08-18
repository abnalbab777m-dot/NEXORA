import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3000/api';

async function run() {
  const email = `testlogin@example.com`;
  const password = 'password123';
  
  // register
  await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ displayName: 'T', username: 'tlogin', email, password })
  });

  // login
  const loginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  
  const cookies = loginRes.headers.raw()['set-cookie'];
  console.log("Cookies from login:", cookies);
  
  if (cookies) {
    const meRes = await fetch(`${BASE_URL}/auth/me`, {
      headers: { 'cookie': cookies[0] }
    });
    console.log("Me status:", meRes.status);
    console.log("Me body:", await meRes.text());
  } else {
    console.log("NO COOKIE RECEIVED!");
  }
}
run();
