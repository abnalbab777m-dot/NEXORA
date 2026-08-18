const { Client } = require('pg');
require('dotenv').config();

async function run() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });
  await client.connect();
  
  const createTables = `
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT NOT NULL UNIQUE,
      email TEXT NOT NULL UNIQUE,
      phone TEXT UNIQUE,
      display_name TEXT,
      password_hash TEXT NOT NULL,
      role TEXT DEFAULT 'USER' NOT NULL,
      status TEXT DEFAULT 'ACTIVE' NOT NULL,
      vip_level INTEGER DEFAULT 0 NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
    );

    CREATE TABLE IF NOT EXISTS wallets (
      user_id TEXT PRIMARY KEY REFERENCES users(id),
      available_balance REAL DEFAULT 0 NOT NULL,
      pending_balance REAL DEFAULT 0 NOT NULL,
      total_earnings REAL DEFAULT 0 NOT NULL,
      total_deposits REAL DEFAULT 0 NOT NULL,
      total_withdrawals REAL DEFAULT 0 NOT NULL,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      type TEXT NOT NULL,
      amount REAL NOT NULL,
      currency TEXT DEFAULT 'USD' NOT NULL,
      status TEXT DEFAULT 'PENDING' NOT NULL,
      description TEXT,
      balance_before REAL,
      balance_after REAL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
      processed_at TIMESTAMP,
      processed_by TEXT REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS deposits (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      amount REAL NOT NULL,
      status TEXT DEFAULT 'PENDING' NOT NULL,
      payment_method TEXT,
      reference TEXT,
      admin_action TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
    );

    CREATE TABLE IF NOT EXISTS withdrawals (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      amount REAL NOT NULL,
      status TEXT DEFAULT 'PENDING' NOT NULL,
      payment_method TEXT,
      reference TEXT,
      admin_action TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
    );

    CREATE TABLE IF NOT EXISTS vip_plans (
      id TEXT PRIMARY KEY,
      level INTEGER NOT NULL UNIQUE,
      name TEXT NOT NULL,
      price REAL NOT NULL,
      duration_days INTEGER NOT NULL,
      daily_tasks INTEGER NOT NULL,
      daily_ads INTEGER NOT NULL,
      status TEXT DEFAULT 'ACTIVE' NOT NULL
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      reward REAL NOT NULL,
      required_vip_level INTEGER DEFAULT 0 NOT NULL,
      status TEXT DEFAULT 'ACTIVE' NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
    );

    CREATE TABLE IF NOT EXISTS task_completions (
      id TEXT PRIMARY KEY,
      task_id TEXT NOT NULL REFERENCES tasks(id),
      user_id TEXT NOT NULL REFERENCES users(id),
      reward REAL NOT NULL,
      status TEXT DEFAULT 'PENDING' NOT NULL,
      completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
    );

    CREATE TABLE IF NOT EXISTS ads (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      reward REAL NOT NULL,
      duration_seconds INTEGER NOT NULL,
      required_vip_level INTEGER DEFAULT 0 NOT NULL,
      status TEXT DEFAULT 'ACTIVE' NOT NULL
    );

    CREATE TABLE IF NOT EXISTS ad_completions (
      id TEXT PRIMARY KEY,
      ad_id TEXT NOT NULL REFERENCES ads(id),
      user_id TEXT NOT NULL REFERENCES users(id),
      reward REAL NOT NULL,
      status TEXT DEFAULT 'PENDING' NOT NULL,
      completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT NOT NULL,
      read BOOLEAN DEFAULT false NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
    );

    CREATE TABLE IF NOT EXISTS admin_logs (
      id TEXT PRIMARY KEY,
      admin_id TEXT NOT NULL REFERENCES users(id),
      action TEXT NOT NULL,
      details TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
    );
  `;
  
  await client.query(createTables);
  await client.end();
  console.log('Tables created successfully');
}

run().catch(err => {
  console.error('Migration failed', err);
  process.exit(1);
});
