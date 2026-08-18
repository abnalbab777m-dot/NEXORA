import { db } from './src/db/index.ts';
import { users } from './src/db/schema.ts';
import { eq, or } from 'drizzle-orm';

async function test() {
  try {
    const uniqueCheck = or(eq(users.username, 'tlogin9'), eq(users.email, 'test9@example.com'), eq(users.phone, '0987654321'));
    const existingUser = await db.select().from(users).where(uniqueCheck);
    console.log("Existing:", existingUser);
  } catch (err) {
    console.error("DB Error:", err);
  }
  process.exit(0);
}
test();
