const { Client } = require('pg');
require('dotenv').config();

async function run() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });
  await client.connect();
  const res = await client.query("SELECT tablename FROM pg_tables WHERE schemaname = 'public'");
  console.log(res.rows);
  const users = await client.query("SELECT * FROM users LIMIT 1");
  console.log('users schema:', users.fields.map(f => f.name));
  await client.end();
}

run().catch(console.error);
