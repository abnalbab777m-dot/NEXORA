import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3000/api';

async function test() {
  const res = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      displayName: 'Test User 3',
      username: 'testuser3',
      email: 'test3@example.com',
      phone: '1234567891',
      password: 'password123'
    })
  });
  
  const text = await res.text();
  console.log("Status:", res.status);
  console.log("Body:", text);
}
test();
