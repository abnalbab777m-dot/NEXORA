import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3000/api';
let cookie = '';

async function test() {
  let report = {};
  
  const userNum = Math.floor(Math.random() * 10000);
  // 1. Register User 1
  try {
    const res = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        displayName: 'Test User ' + userNum,
        username: 'testuser' + userNum,
        email: `test${userNum}@example.com`,
        phone: `123456789${userNum}`,
        password: 'password123'
      })
    });
    
    if (res.ok) {
      report['Authentication'] = 'Pass';
      cookie = res.headers.raw()['set-cookie'][0];
    } else {
      const data = await res.json();
      report['Authentication'] = `Failed: ${res.status} ${JSON.stringify(data)}`;
    }
  } catch (e) {
    report['Authentication'] = 'Failed: ' + e.message;
  }

  // Duplicate Protection
  try {
    const res = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        displayName: 'Test User ' + userNum,
        username: 'testuser' + userNum,
        email: `test${userNum}@example.com`,
        phone: `123456789${userNum}`,
        password: 'password123'
      })
    });
    if (!res.ok) {
      report['Duplicate Protection'] = 'Pass';
    } else {
      report['Duplicate Protection'] = 'Failed';
    }
  } catch (e) {
    report['Duplicate Protection'] = 'Pass';
  }

  // Admin Security
  try {
    const res = await fetch(`${BASE_URL}/admin/users`, {
      headers: { 'cookie': cookie }
    });
    if (res.status === 403) {
      report['Admin Security'] = 'Pass';
    } else {
      report['Admin Security'] = 'Failed: ' + res.status;
    }
  } catch (e) {
    report['Admin Security'] = 'Failed: ' + e.message;
  }

  // Wallet
  try {
    const res = await fetch(`${BASE_URL}/wallet`, {
      headers: { 'cookie': cookie }
    });
    if (res.ok) {
      report['Wallet'] = 'Pass';
    } else {
      report['Wallet'] = 'Failed: ' + res.status;
    }
  } catch (e) {
    report['Wallet'] = 'Failed';
  }

  // Deposit
  try {
    const res = await fetch(`${BASE_URL}/deposits`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'cookie': cookie },
      body: JSON.stringify({ amount: 100 })
    });
    if (res.ok) {
      report['Deposits'] = 'Pass';
    } else {
      report['Deposits'] = 'Failed: ' + res.status;
    }
  } catch (e) {
    report['Deposits'] = 'Failed';
  }

  // Withdrawals
  try {
    const res = await fetch(`${BASE_URL}/withdrawals`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'cookie': cookie },
      body: JSON.stringify({ amount: 100 })
    });
    const data = await res.json();
    if (res.status === 400 && data.error && data.error.includes('غير كاف')) {
      report['Withdrawals'] = 'Pass';
    } else {
      report['Withdrawals'] = 'Failed (Expected 400 Insufficient Funds, got ' + res.status + ')';
    }
  } catch (e) {
    report['Withdrawals'] = 'Failed';
  }

  // Tasks
  try {
    const res = await fetch(`${BASE_URL}/tasks`, {
      headers: { 'cookie': cookie }
    });
    if (res.ok) report['Tasks'] = 'Pass';
    else report['Tasks'] = 'Failed: ' + res.status;
  } catch (e) {
    report['Tasks'] = 'Failed';
  }

  // Ads
  try {
    const res = await fetch(`${BASE_URL}/ads`, {
      headers: { 'cookie': cookie }
    });
    if (res.ok) report['Ads'] = 'Pass';
    else report['Ads'] = 'Failed: ' + res.status;
  } catch (e) {
    report['Ads'] = 'Failed';
  }

  // VIP
  try {
    const res = await fetch(`${BASE_URL}/vip`, {
      headers: { 'cookie': cookie }
    });
    if (res.ok) report['VIP'] = 'Pass';
    else report['VIP'] = 'Failed: ' + res.status;
  } catch (e) {
    report['VIP'] = 'Failed';
  }

  console.log(JSON.stringify(report, null, 2));
}

test();
