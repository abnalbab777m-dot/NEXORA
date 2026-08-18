const fs = require('fs');

let index = fs.readFileSync('src/db/index.ts', 'utf-8');
index = `import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema.ts';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is missing");
}

const client = postgres(connectionString, { prepare: false });
export const db = drizzle(client, { schema });
`;
fs.writeFileSync('src/db/index.ts', index);

let config = fs.readFileSync('drizzle.config.ts', 'utf-8');
config = `import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  }
});
`;
fs.writeFileSync('drizzle.config.ts', config);

