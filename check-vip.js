import fetch from 'node-fetch';
import { Pool } from 'pg';

const pool = new Pool({
  host: process.env.SQL_HOST,
  user: process.env.SQL_USER,
  password: process.env.SQL_PASSWORD,
  database: process.env.SQL_DB_NAME,
});

async function check() {
  const res = await pool.query("SELECT * FROM vip_plans");
  console.log(res.rows);
  process.exit(0);
}
check();
