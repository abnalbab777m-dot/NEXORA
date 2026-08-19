import { db } from './src/db/index.ts';
import { users } from './src/db/schema.ts';
import { eq } from 'drizzle-orm';
import jwt from 'jsonwebtoken';

async function run() {
  const admin = await db.select().from(users).where(eq(users.role, 'ADMIN')).limit(1);
  if (admin.length > 0) {
    const token = jwt.sign(
      { userId: admin[0].id, role: admin[0].role },
      process.env.JWT_SECRET || 'dev_jwt_secret_fallback_1234567890',
      { expiresIn: '1h' }
    );
    console.log('TOKEN=' + token);
  } else {
    console.log('No admin found');
  }
}
run();
