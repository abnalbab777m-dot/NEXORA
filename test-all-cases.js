import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3000/api';
let cookie = '';

async function run() {
  const rand = Math.floor(Math.random() * 1000000);
  const email = `testall${rand}@example.com`;
  const password = 'password123';
  
  // Create user
  await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ displayName: 'Test', username: `testall${rand}`, email, password })
  });

  console.log("TEST 1: Wrong credentials");
  const badLogin = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: 'wrong' })
  });
  console.log("-> Status (should be 401):", badLogin.status);

  console.log("\nTEST 2: Correct credentials");
  const goodLogin = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  console.log("-> Status (should be 200):", goodLogin.status);
  
  const setCookie = goodLogin.headers.raw()['set-cookie'];
  cookie = setCookie ? setCookie[0] : '';
  console.log("-> Cookie saved:", cookie.split(';')[0]);

  console.log("\nTEST 4: /api/auth/me after login");
  const meCheck = await fetch(`${BASE_URL}/auth/me`, {
    headers: { 'cookie': cookie }
  });
  console.log("-> Status (should be 200):", meCheck.status);
  
  console.log("\nTEST 5: Logout");
  const logoutRes = await fetch(`${BASE_URL}/auth/logout`, {
    method: 'POST',
    headers: { 'cookie': cookie }
  });
  console.log("-> Status (should be 200):", logoutRes.status);
  const logoutCookie = logoutRes.headers.raw()['set-cookie'];
  console.log("-> Cookie cleared:", logoutCookie[0].split(';')[0]);

  const afterLogout = await fetch(`${BASE_URL}/auth/me`, {
    headers: { 'cookie': logoutCookie[0] } // Send the cleared cookie
  });
  console.log("-> /me Status after logout (should be 401/404):", afterLogout.status);

}
run();
