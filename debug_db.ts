import { db } from './src/db/index.ts';
import { users } from './src/db/schema.ts';
async function test() {
  const all = await db.select().from(users).limit(1);
  console.log(all);
  process.exit(0);
}
test();
