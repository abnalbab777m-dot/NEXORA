const { Client } = require('pg');
require('dotenv').config();

async function run() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });
  await client.connect();
  await client.query("UPDATE users SET role = 'ADMIN' WHERE username = 'pguser'");
  await client.end();
  console.log('Made admin');
}
run();
