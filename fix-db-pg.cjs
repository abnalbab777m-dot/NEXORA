const fs = require('fs');
let index = fs.readFileSync('src/db/index.ts', 'utf-8');
index = `import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema.ts';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is missing");
}

const pool = new Pool({
  connectionString,
});

export const db = drizzle(pool, { schema });
`;
fs.writeFileSync('src/db/index.ts', index);
