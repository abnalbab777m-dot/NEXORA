import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  await page.goto('http://localhost:3000/login');
  
  // Register a user first to be sure
  await page.goto('http://localhost:3000/register');
  await page.fill('input[type="email"]', 'u123@example.com');
  await page.fill('input[type="password"]', 'password123');
  await page.fill('input[placeholder="name@example.com"]', 'u123@example.com'); // wait, the placeholders are overlapping
  
  // Let's just use API to register
  await page.evaluate(async () => {
    await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ displayName: 'u', username: 'u123', email: 'u123@example.com', password: 'password123' })
    });
  });

  await page.goto('http://localhost:3000/login');
  
  // Listen for console logs
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('response', res => {
    if (res.url().includes('/api/auth/')) {
       console.log('API RESPONSE:', res.url(), res.status());
    }
  });

  await page.fill('input[type="email"]', 'u123@example.com');
  await page.fill('input[type="password"]', 'password123');
  
  console.log("Clicking login...");
  await page.click('button[type="submit"]');
  
  await page.waitForTimeout(3000);
  console.log("Current URL after 3s:", page.url());
  
  await browser.close();
})();
