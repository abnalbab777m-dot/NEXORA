import { db } from './src/db/index.ts';
import { taskCompletions, tasks, users } from './src/db/schema.ts';
import { eq, desc } from 'drizzle-orm';

async function test() {
  try {
    const allCompletions = await db
      .select({
        id: taskCompletions.id,
        taskId: taskCompletions.taskId,
        userId: taskCompletions.userId,
        reward: taskCompletions.reward,
        status: taskCompletions.status,
        proofImage: taskCompletions.proofImage,
        proofAccount: taskCompletions.proofAccount,
        rejectionReason: taskCompletions.rejectionReason,
        completedAt: taskCompletions.completedAt,
        taskTitle: tasks.title,
        taskCategory: tasks.category,
        userEmail: users.email,
        userPhone: users.phone,
      })
      .from(taskCompletions)
      .leftJoin(tasks, eq(taskCompletions.taskId, tasks.id))
      .leftJoin(users, eq(taskCompletions.userId, users.id))
      .orderBy(desc(taskCompletions.completedAt));
    console.log('Query success! Count:', allCompletions.length);
  } catch (e) {
    console.error('Query error:', e);
  }
}
test();
