import { db } from './src/db/index.ts';
import { taskCompletions } from './src/db/schema.ts';
import { v4 as uuidv4 } from 'uuid';

async function test() {
  const all = await db.select().from(taskCompletions);
  console.log('completions:', all);
}
test();
