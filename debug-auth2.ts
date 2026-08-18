import { db } from './src/db/index.ts';
import { users } from './src/db/schema.ts';

async function test() {
  const allUsers = await db.select().from(users);
  console.log("Users:", allUsers.map(u => u.email));
  process.exit(0);
}
test();
