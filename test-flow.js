import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3000/api';

async function run() {
  console.log("1. Registering user...");
  const rand = Math.floor(Math.random() * 100000);
  const email = `finaluser${rand}@example.com`;
  const username = `finaluser${rand}`;
  const password = 'password123';

  // We omit phone to test the 500 error fix
  const regRes = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ displayName: 'Final User', username, email, password })
  });
  console.log("Register Status:", regRes.status);
  
  console.log("\n2. Login with bad password...");
  const badLoginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: 'wrongpassword' })
  });
  console.log("Bad Login Status:", badLoginRes.status);
  console.log("Bad Login Body:", await badLoginRes.text());

  console.log("\n3. Login with correct password...");
  const goodLoginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  console.log("Good Login Status:", goodLoginRes.status);
  
  const cookies = goodLoginRes.headers.raw()['set-cookie'];
  console.log("Set-Cookie header:", cookies);

  console.log("\n4. GET /api/auth/me");
  const meRes = await fetch(`${BASE_URL}/auth/me`, {
    headers: { 'cookie': cookies[0] }
  });
  console.log("Me Status:", meRes.status);
  const meBody = await meRes.json();
  console.log("Me User:", meBody.user.email);
}
run();
