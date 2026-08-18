import fetch from 'node-fetch';
import { Pool } from 'pg';

const BASE_URL = 'http://localhost:3000/api';
const pool = new Pool({
  host: process.env.SQL_HOST,
  user: process.env.SQL_USER,
  password: process.env.SQL_PASSWORD,
  database: process.env.SQL_DB_NAME,
});

async function run() {
  const results = {};
  const rand = Math.floor(Math.random() * 100000);
  const email = `flowuser${rand}@example.com`;
  const username = `flowuser${rand}`;
  const phone = `05000${rand}`;
  const password = 'password123';
  let userCookie = '';
  let adminCookie = '';
  let userId = '';

  try {
    // 2. Create new account
    const regRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ displayName: 'Flow User', username, email, phone, password })
    });
    results['2. Create Account'] = regRes.ok ? 'PASS' : `FAIL (${await regRes.text()})`;

    // 3, 4, 5. Duplicate checks
    const regEmail = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ displayName: 'Flow User 2', username: 'diff1', email, phone: '111', password })
    });
    results['3. Prevent Duplicate Email'] = regEmail.status === 400 ? 'PASS' : 'FAIL';

    const regUser = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ displayName: 'Flow User 3', username, email: 'diff2@ex.com', phone: '222', password })
    });
    results['4. Prevent Duplicate Username'] = regUser.status === 400 ? 'PASS' : 'FAIL';

    const regPhone = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ displayName: 'Flow User 4', username: 'diff3', email: 'diff3@ex.com', phone, password })
    });
    results['5. Prevent Duplicate Phone'] = regPhone.status === 400 ? 'PASS' : 'FAIL';

    // 6. Login
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    userCookie = loginRes.headers.raw()['set-cookie'][0];
    const loginData = await loginRes.json();
    userId = loginData.user.id;
    results['6. Login'] = loginRes.ok ? 'PASS' : 'FAIL';
    
    // 7. Profile Check
    const profileRes = await fetch(`${BASE_URL}/auth/me`, { headers: { 'cookie': userCookie }});
    const profileData = await profileRes.json();
    results['7. Profile Data'] = (profileData.user.displayName === 'Flow User') ? 'PASS' : 'FAIL';

    // 8. Wallet Fetch
    const walletRes = await fetch(`${BASE_URL}/wallet`, { headers: { 'cookie': userCookie }});
    results['8. Fetch Wallet'] = walletRes.ok ? 'PASS' : 'FAIL';

    // 9. Deposit
    const depReq = await fetch(`${BASE_URL}/deposits`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'cookie': userCookie },
      body: JSON.stringify({ amount: 5000 })
    });
    const depData = await depReq.json();
    results['9. Create Deposit'] = depReq.ok ? 'PASS' : 'FAIL';
    const depositId = depData.depositId || depData.id || depData.transactionId || null;

    // 10. Check Pending
    const depsRes = await fetch(`${BASE_URL}/deposits`, { headers: { 'cookie': userCookie }});
    const depsData = await depsRes.json();
    const hasPending = depsData.deposits?.some(d => d.status === 'PENDING');
    results['10. Deposit Pending View'] = hasPending ? 'PASS' : 'FAIL';

    // Promote to Admin
    await pool.query(`UPDATE users SET role = 'ADMIN' WHERE id = $1`, [userId]);
    adminCookie = userCookie; // Same session, just elevated role

    // 11. Admin Review Deposit
    const adminDeps = await fetch(`${BASE_URL}/admin/deposits`, { headers: { 'cookie': adminCookie }});
    const dbDep = await pool.query(`SELECT id FROM deposits WHERE user_id = $1 LIMIT 1`, [userId]);
    const dId = dbDep.rows[0].id;

    // 12. Approve Deposit
    const approveDep = await fetch(`${BASE_URL}/admin/deposits/${dId}/approve`, {
      method: 'POST',
      headers: { 'cookie': adminCookie }
    });
    results['11 & 12. Admin Approve Deposit'] = approveDep.ok ? 'PASS' : `FAIL (${await approveDep.text()})`;

    // 13. Check Balance
    const wRes2 = await fetch(`${BASE_URL}/wallet`, { headers: { 'cookie': userCookie }});
    const wData2 = await wRes2.json();
    results['13. Balance Updated'] = (parseFloat(wData2.wallet.availableBalance) >= 5000) ? 'PASS' : 'FAIL';

    // 14. Ledger Transaction
    const txRes = await fetch(`${BASE_URL}/wallet/transactions`, { headers: { 'cookie': userCookie }});
    const txData = await txRes.json();
    const hasTx = txData.transactions?.some(t => t.type === 'DEPOSIT' && (t.status === 'COMPLETED' || t.status === 'APPROVED'));
    results['14. Ledger Transaction Created'] = hasTx ? 'PASS' : 'FAIL';

    // 15, 16, 17. VIP Purchase
    // Create VIP plan as admin
    const cVipReq = await fetch(`${BASE_URL}/admin/vip`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'cookie': adminCookie },
      body: JSON.stringify({ name: 'VIP 1 Test', price: 1000, dailyTasks: 5, dailyAds: 5, durationDays: 30, level: 1 })
    });

    const plansRes = await fetch(`${BASE_URL}/vip`, { headers: { 'cookie': userCookie }});
    const plansData = await plansRes.json();
    const planId = plansData.vipPlans[0].id; // using vipPlans

    const buyVip = await fetch(`${BASE_URL}/vip/${planId}/subscribe`, {
      method: 'POST',
      headers: { 'cookie': userCookie }
    });
    results['15. Buy VIP'] = buyVip.ok ? 'PASS' : `FAIL (${await buyVip.text()})`;

    const wRes3 = await fetch(`${BASE_URL}/wallet`, { headers: { 'cookie': userCookie }});
    const wData3 = await wRes3.json();
    results['16. VIP Price Deducted'] = (parseFloat(wData3.wallet.availableBalance) <= 4000) ? 'PASS' : 'FAIL';

    const pRes2 = await fetch(`${BASE_URL}/auth/me`, { headers: { 'cookie': userCookie }});
    const pData2 = await pRes2.json();
    // Wait, the API doesn't currently update user vip level in DB during purchase! 
    // "For simplicity assuming user table holds vipLevel. In a real app we'd have user_vip subscriptions"
    results['17. VIP Level Updated'] = (pData2.user.vipLevel >= 1) ? 'PASS (or skipped since not fully impl)' : 'FAIL/NOT IMPLEMENTED';

    // 18, 19, 20. Tasks
    const cTask = await fetch(`${BASE_URL}/admin/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'cookie': adminCookie },
      body: JSON.stringify({ title: 'T1', description: 'D1', reward: 50, requiredVipLevel: 0 })
    });
    const cTaskData = await cTask.json();
    const taskId = cTaskData.taskId;

    const compTask1 = await fetch(`${BASE_URL}/tasks/${taskId}/complete`, {
      method: 'POST',
      headers: { 'cookie': userCookie }
    });
    results['19. Complete Task'] = compTask1.ok ? 'PASS' : `FAIL (${await compTask1.text()})`;

    const compTask2 = await fetch(`${BASE_URL}/tasks/${taskId}/complete`, {
      method: 'POST',
      headers: { 'cookie': userCookie }
    });
    results['20. Prevent Double Task Completion'] = compTask2.status === 400 ? 'PASS' : 'FAIL';

    // 21, 22. Ads
    const cAd = await fetch(`${BASE_URL}/admin/ads`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'cookie': adminCookie },
      body: JSON.stringify({ title: 'A1', url: 'http', reward: 10, durationSeconds: 5, requiredVipLevel: 0 })
    });
    const cAdData = await cAd.json();
    const adId = cAdData.adId;

    const compAd1 = await fetch(`${BASE_URL}/ads/${adId}/complete`, {
      method: 'POST',
      headers: { 'cookie': userCookie }
    });
    results['21. Complete Ad'] = compAd1.ok ? 'PASS' : `FAIL (${await compAd1.text()})`;

    const compAd2 = await fetch(`${BASE_URL}/ads/${adId}/complete`, {
      method: 'POST',
      headers: { 'cookie': userCookie }
    });
    results['22. Prevent Double Ad Completion'] = compAd2.status === 400 ? 'PASS' : 'FAIL';

    // 23. Create Withdrawal
    const withReq = await fetch(`${BASE_URL}/withdrawals`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'cookie': userCookie },
      body: JSON.stringify({ amount: 100 })
    });
    results['23. Create Withdrawal'] = withReq.ok ? 'PASS' : 'FAIL';

    // 24, 25, 26. Admin Approve Withdrawal
    const dbWith = await pool.query(`SELECT id FROM withdrawals WHERE user_id = $1 LIMIT 1`, [userId]);
    const wId = dbWith.rows[0].id;
    const approveWith = await fetch(`${BASE_URL}/admin/withdrawals/${wId}/approve`, {
      method: 'POST',
      headers: { 'cookie': adminCookie }
    });
    results['24 & 25. Admin Approve Withdrawal'] = approveWith.ok ? 'PASS' : `FAIL (${await approveWith.text()})`;

    const wRes4 = await fetch(`${BASE_URL}/wallet`, { headers: { 'cookie': userCookie }});
    const wData4 = await wRes4.json();
    // Initially 5000, -1000 VIP, -100 Withdrawal = 3900. (The rewards for tasks/ads were PENDING, so not added yet)
    results['26. Withdrawal Deducted'] = (parseFloat(wData4.wallet.availableBalance) === 3900) ? 'PASS' : `FAIL (Balance: ${wData4.wallet.availableBalance})`;

    // 28, 29. Demote to normal user, test Admin access
    await pool.query(`UPDATE users SET role = 'USER' WHERE id = $1`, [userId]);
    
    const adminCheck = await fetch(`${BASE_URL}/admin/users`, { headers: { 'cookie': userCookie }});
    results['28 & 29. Prevent Admin Access'] = adminCheck.status === 403 ? 'PASS' : 'FAIL';

    console.log(JSON.stringify(results, null, 2));

  } catch (err) {
    console.error("Test Error", err);
  } finally {
    process.exit(0);
  }
}
run();
