import { db } from './src/db/index.ts';
import { users } from './src/db/schema.ts';
import { eq, or } from 'drizzle-orm';

async function test() {
  try {
    const username = 'tlogin8';
    const email = 'test8@example.com';
    const phone = undefined;
    
    let uniqueCheck;
    if (phone) {
        uniqueCheck = or(eq(users.username, username), eq(users.email, email), eq(users.phone, phone));
    } else {
        uniqueCheck = or(eq(users.username, username), eq(users.email, email));
    }
    
    const existingUser = await db.select().from(users).where(uniqueCheck);
    console.log(existingUser);
  } catch (err) {
    console.error(err);
  }
  process.exit(0);
}
test();
