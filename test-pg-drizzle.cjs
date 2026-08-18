const { drizzle } = require('drizzle-orm/node-postgres');
const { Pool } = require('pg');
require('dotenv').config();

async function run() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });
  const db = drizzle(pool);
  const result = await db.execute('SELECT tablename FROM pg_tables WHERE schemaname = \'public\'');
  console.log(result.rows.map(r => r.tablename));
  await pool.end();
}
run();
