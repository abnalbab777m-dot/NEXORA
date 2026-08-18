const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
  connectionString: process.env.DATABASE_URL
});

client.connect()
  .then(() => {
    return client.query(`
      DROP TABLE IF EXISTS admin_logs CASCADE;
      DROP TABLE IF EXISTS notifications CASCADE;
      DROP TABLE IF EXISTS ad_completions CASCADE;
      DROP TABLE IF EXISTS ads CASCADE;
      DROP TABLE IF EXISTS task_completions CASCADE;
      DROP TABLE IF EXISTS tasks CASCADE;
      DROP TABLE IF EXISTS vip_plans CASCADE;
      DROP TABLE IF EXISTS withdrawals CASCADE;
      DROP TABLE IF EXISTS deposits CASCADE;
      DROP TABLE IF EXISTS transactions CASCADE;
      DROP TABLE IF EXISTS wallets CASCADE;
      DROP TABLE IF EXISTS users CASCADE;
    `);
  })
  .then(() => {
    console.log('Tables dropped.');
    client.end();
  })
  .catch(err => {
    console.error('Failed to drop tables:', err.message);
    client.end();
  });
