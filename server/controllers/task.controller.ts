import { Request, Response, NextFunction } from 'express';
import { db } from '../../src/db/index.ts';
import { tasks, taskCompletions, users, adminLogs, notifications } from '../../src/db/schema.ts';
import { eq, and, desc, sql } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { WalletService } from '../services/wallet.service';
import { EmailService } from '../services/email.service';

export const taskController = {
  // --- USER ENDPOINTS ---
  async getTasks(req: any, res: Response, next: NextFunction) {
    try {
      const allTasks = await db.select().from(tasks).where(eq(tasks.status, 'ACTIVE'));
      return res.json({ tasks: allTasks });
    } catch (error) {
      next(error);
    }
  },

  async getCompletions(req: any, res: Response, next: NextFunction) {
    try {
      const completions = await db.select().from(taskCompletions).where(eq(taskCompletions.userId, req.user.id));
      return res.json({ completions });
    } catch (error) {
      next(error);
    }
  },

  // Submit proof or complete direct task
  async completeTask(req: any, res: Response, next: NextFunction) {
    try {
      const { id: taskId } = req.params;
      const { proofAccount, proofImage } = req.body || {};

      const task = (await db.select().from(tasks).where(eq(tasks.id, taskId)))[0];
      if (!task || task.status !== 'ACTIVE') {
        return res.status(404).json({ error: 'المهمة غير متوفرة أو تم إيقافها' });
      }

      const userVipLevel = req.user.vipLevel || 0;
      if (userVipLevel < task.requiredVipLevel) {
        return res.status(403).json({ error: `هذه المهمة تتطلب مستوى VIP ${task.requiredVipLevel} أو أعلى` });
      }

      // Check if already completed today or pending review
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const existing = await db.select().from(taskCompletions).where(
        and(
          eq(taskCompletions.taskId, taskId),
          eq(taskCompletions.userId, req.user.id)
        )
      );
      
      const pendingExisting = existing.some(c => c.status === 'PENDING');
      if (pendingExisting) {
        return res.status(400).json({ error: 'إثبات هذه المهمة قيد المراجعة حالياً من قبل الإدارة' });
      }

      const completedToday = existing.some(c => c.status === 'COMPLETED' && new Date(c.completedAt) >= todayStart);
      if (completedToday) {
        return res.status(400).json({ error: 'لقد قمت بإنجاز هذه المهمة اليوم بالفعل' });
      }

      const isProofRequired = task.taskType !== 'DIRECT';

      if (isProofRequired && !proofAccount && !proofImage) {
        return res.status(400).json({ error: 'يرجى تقديم إثبات التنفيذ (اسم المستخدم المنفذ أو لقطة الشاشة)' });
      }

      const completionId = uuidv4();
      const rewardAmount = Number(task.reward) || 0;

      if (isProofRequired) {
        // Submit for admin review (PENDING)
        await db.insert(taskCompletions).values({
          id: completionId,
          taskId,
          userId: req.user.id,
          reward: rewardAmount,
          status: 'PENDING',
          proofAccount: proofAccount ? String(proofAccount).trim() : null,
          proofImage: proofImage || null,
          completedAt: new Date(),
        });

        // Notify user
        await db.insert(notifications).values({
          id: uuidv4(),
          userId: req.user.id,
          title: 'تم إرسال إثبات المهمة للمراجعة',
          message: `تم استلام إثبات تنفيذ مهمة "${task.title}". سيتم فحص الإثبات وإضافة مكافأة ${rewardAmount} $ لمحفظتك فور الموافقة.`,
          type: 'INFO',
          read: false,
          createdAt: new Date(),
        });

        return res.json({
          status: 'PENDING',
          message: 'تم إرسال إثبات تنفيذ المهمة بنجاح وهو الآن قيد مراجعة الإدارة!',
          reward: rewardAmount,
          taskId,
          completionId
        });
      } else {
        // Instant direct reward
        await db.transaction(async (tx) => {
          await tx.insert(taskCompletions).values({
            id: completionId,
            taskId,
            userId: req.user.id,
            reward: rewardAmount,
            status: 'COMPLETED',
            proofAccount: proofAccount ? String(proofAccount).trim() : 'مباشر',
            proofImage: proofImage || null,
            completedAt: new Date(),
          });

          await WalletService.processTransactionWithTx(
            tx,
            req.user.id,
            rewardAmount,
            'TASK_REWARD',
            'COMPLETED',
            `مكافأة إنجاز مهمة: ${task.title}`
          );
        });

        return res.json({ 
          status: 'COMPLETED',
          message: `تم إنجاز المهمة بنجاح وتمت إضافة ${rewardAmount} $ إلى رصيدك!`,
          reward: rewardAmount,
          taskId
        });
      }
    } catch (error) {
      next(error);
    }
  },

  // --- ADMIN ENDPOINTS ---
  async createTask(req: Request, res: Response, next: NextFunction) {
    try {
      const { 
        title, 
        description, 
        reward, 
        requiredVipLevel, 
        url, 
        durationSeconds, 
        status,
        category,
        taskType,
        proofInstructions
      } = req.body;
      const taskId = uuidv4();
      
      await db.insert(tasks).values({
        id: taskId,
        title: title?.trim(),
        description: description?.trim() || null,
        reward: Number(reward) || 0,
        url: url?.trim() || null,
        category: category || 'TELEGRAM',
        taskType: taskType || 'PROOF_REQUIRED',
        proofInstructions: proofInstructions?.trim() || null,
        durationSeconds: durationSeconds ? Number(durationSeconds) : 30,
        requiredVipLevel: requiredVipLevel ? Number(requiredVipLevel) : 0,
        status: status || 'ACTIVE',
        createdAt: new Date(),
      });

      // Broadcast notification to all active users if task is active
      if (status !== 'INACTIVE') {
        (async () => {
          try {
            const activeUsers = await db.select({ id: users.id }).from(users).where(eq(users.status, 'ACTIVE'));
            if (activeUsers.length > 0) {
              const notifEntries = activeUsers.map(u => ({
                id: uuidv4(),
                userId: u.id,
                title: '🎯 تم إضافة مهمة جديدة!',
                message: `تمت إضافة مهمة جديدة: "${title?.trim()}" بمكافأة +${Number(reward) || 0} $. أنجزها الآن لربح رصيدك.`,
                type: 'INFO',
                read: false,
                createdAt: new Date(),
              }));
              await db.insert(notifications).values(notifEntries);
            }
          } catch (nErr) {
            console.error('Failed to broadcast task notification:', nErr);
          }
        })();
      }

      return res.status(201).json({ message: 'تم إنشاء المهمة بنجاح', taskId });
    } catch (error) {
      next(error);
    }
  },

  async updateTask(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const { 
        title, 
        description, 
        reward, 
        status, 
        requiredVipLevel, 
        url, 
        durationSeconds,
        category,
        taskType,
        proofInstructions
      } = req.body;
      
      const updateData: any = {};
      if (title !== undefined) updateData.title = title.trim();
      if (description !== undefined) updateData.description = description.trim();
      if (reward !== undefined) updateData.reward = Number(reward);
      if (status !== undefined) updateData.status = status;
      if (requiredVipLevel !== undefined) updateData.requiredVipLevel = Number(requiredVipLevel);
      if (url !== undefined) updateData.url = url ? url.trim() : null;
      if (durationSeconds !== undefined) updateData.durationSeconds = Number(durationSeconds);
      if (category !== undefined) updateData.category = category;
      if (taskType !== undefined) updateData.taskType = taskType;
      if (proofInstructions !== undefined) updateData.proofInstructions = proofInstructions ? proofInstructions.trim() : null;
      
      await db.update(tasks).set(updateData).where(eq(tasks.id, id));
      return res.json({ message: 'تم تحديث المهمة بنجاح' });
    } catch (error) {
      next(error);
    }
  },

  async deleteTask(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      // Delete any completions first to prevent foreign key issues
      await db.delete(taskCompletions).where(eq(taskCompletions.taskId, id));
      await db.delete(tasks).where(eq(tasks.id, id));
      return res.json({ message: 'تم حذف المهمة بنجاح' });
    } catch (error) {
      next(error);
    }
  },
  
  async getAdminTasks(req: Request, res: Response, next: NextFunction) {
    try {
      const allTasks = await db.select().from(tasks).orderBy(desc(tasks.createdAt));
      return res.json({ tasks: allTasks });
    } catch (error) {
      next(error);
    }
  },

  async getAdminCompletions(req: Request, res: Response, next: NextFunction) {
    try {
      const { status } = req.query as { status?: string };

      let query = db
        .select({
          id: taskCompletions.id,
          taskId: taskCompletions.taskId,
          userId: taskCompletions.userId,
          reward: taskCompletions.reward,
          status: taskCompletions.status,
          proofImage: sql<string | null>`CASE WHEN ${taskCompletions.proofImage} IS NOT NULL THEN 'AVAILABLE' ELSE NULL END`,
          proofAccount: taskCompletions.proofAccount,
          rejectionReason: taskCompletions.rejectionReason,
          completedAt: taskCompletions.completedAt,
          reviewedAt: taskCompletions.reviewedAt,
          reviewedBy: taskCompletions.reviewedBy,
          taskTitle: tasks.title,
          taskCategory: tasks.category,
          taskDescription: tasks.description,
          taskProofInstructions: tasks.proofInstructions,
          taskReward: tasks.reward,
          userDisplayName: users.displayName,
          userUsername: users.username,
          userEmail: users.email,
          userPhone: users.phone,
          userVipLevel: users.vipLevel,
        })
        .from(taskCompletions)
        .leftJoin(tasks, eq(taskCompletions.taskId, tasks.id))
        .leftJoin(users, eq(taskCompletions.userId, users.id))
        .orderBy(desc(taskCompletions.completedAt));

      const allCompletions = await query;
      
      let filtered = allCompletions;
      if (status && status !== 'all') {
        const normalized = status.toUpperCase();
        if (normalized === 'APPROVED') {
          filtered = allCompletions.filter(c => c.status === 'COMPLETED' || c.status === 'APPROVED');
        } else {
          filtered = allCompletions.filter(c => c.status === normalized);
        }
      }

      return res.json({ completions: filtered, submissions: filtered });
    } catch (error) {
      next(error);
    }
  },

  async getCompletionProof(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const completion = (await db.select({ proofImage: taskCompletions.proofImage }).from(taskCompletions).where(eq(taskCompletions.id, id)))[0];
      if (!completion) return res.status(404).json({ error: 'طلب إنجاز المهمة غير موجود' });
      return res.json({ proofImage: completion.proofImage });
    } catch (error) {
      next(error);
    }
  },

  async approveSubmission(req: any, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const adminId = req.user?.id;

      await db.transaction(async (tx) => {
        const completion = (await tx.select().from(taskCompletions).where(eq(taskCompletions.id, id)))[0];
        if (!completion) throw new Error('إنجاز المهمة غير موجود');
        if (completion.status !== 'PENDING') throw new Error('العملية تمت معالجتها مسبقاً');

        const task = (await tx.select().from(tasks).where(eq(tasks.id, completion.taskId)))[0];
        const taskName = task?.title || 'المهمة';
        const rewardAmount = Number(completion.reward) || 0;

        // Atomically process transaction and credit user's wallet
        await WalletService.processTransactionWithTx(
          tx,
          completion.userId,
          rewardAmount,
          'TASK_REWARD',
          'COMPLETED',
          `مكافأة إنجاز مهمة: ${taskName}`,
          adminId
        );

        // Update completion status
        await tx.update(taskCompletions).set({
          status: 'COMPLETED',
          reviewedAt: new Date(),
          reviewedBy: adminId || null,
        }).where(eq(taskCompletions.id, id));

        // Notify user
        await tx.insert(notifications).values({
          id: uuidv4(),
          userId: completion.userId,
          title: '🎉 تمت الموافقة على إثبات المهمة!',
          message: `تمت مراجعة إثباتك لمهمة "${taskName}" والموافقة عليها، وتمت إضافة مكافأة بقيمة ${rewardAmount.toFixed(2)} $ إلى محفظتك بنجاح.`,
          type: 'SUCCESS',
          read: false,
          createdAt: new Date(),
        });

        // Insert Admin Log
        await tx.insert(adminLogs).values({
          id: uuidv4(),
          adminId: adminId || 'admin',
          action: 'APPROVE_TASK_COMPLETION',
          details: `Approved task completion ${id} (${taskName}) for user ${completion.userId}, reward: $${rewardAmount}`,
          createdAt: new Date(),
        });

        // Send Email notification asynchronously
        const targetUser = (await tx.select().from(users).where(eq(users.id, completion.userId)))[0];
        if (targetUser?.email) {
          EmailService.sendStatusUpdateEmail({
            userEmail: targetUser.email,
            userName: targetUser.displayName || targetUser.username,
            requestType: 'TASK',
            status: 'APPROVED',
            amount: rewardAmount,
            reference: taskName,
            date: new Date(),
          }).catch(err => console.error('[Email] Failed to send task approval email:', err));
        }
      });

      return res.json({ 
        success: true,
        message: 'تمت الموافقة على إثبات المهمة وصرف المكافأة بنجاح إلى محفظة المستخدم' 
      });
    } catch (error: any) {
      if (error.message === 'العملية تمت معالجتها مسبقاً' || error.message === 'إنجاز المهمة غير موجود') {
        return res.status(400).json({ error: error.message });
      }
      next(error);
    }
  },

  async rejectSubmission(req: any, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const { reason } = req.body || {};
      const adminId = req.user?.id;
      const rejectReason = reason && String(reason).trim().length > 0 
        ? String(reason).trim() 
        : 'إثبات غير مكتمل أو لقطة الشاشة غير مطابقة لشروط المهمة';

      await db.transaction(async (tx) => {
        const completion = (await tx.select().from(taskCompletions).where(eq(taskCompletions.id, id)))[0];
        if (!completion) throw new Error('إنجاز المهمة غير موجود');
        if (completion.status !== 'PENDING') throw new Error('العملية تمت معالجتها مسبقاً');

        const task = (await tx.select().from(tasks).where(eq(tasks.id, completion.taskId)))[0];
        const taskName = task?.title || 'المهمة';

        // Update status to REJECTED
        await tx.update(taskCompletions).set({
          status: 'REJECTED',
          rejectionReason: rejectReason,
          reviewedAt: new Date(),
          reviewedBy: adminId || null,
        }).where(eq(taskCompletions.id, id));

        // Notify user
        await tx.insert(notifications).values({
          id: uuidv4(),
          userId: completion.userId,
          title: '❌ تم رفض إثبات المهمة',
          message: `تم رفض إثبات تنفيذ مهمة "${taskName}". السبب: ${rejectReason}. يمكنك إعادة إنجاز المهمة وإرسال إثبات صحيح.`,
          type: 'WARNING',
          read: false,
          createdAt: new Date(),
        });

        // Log Admin Action
        await tx.insert(adminLogs).values({
          id: uuidv4(),
          adminId: adminId || 'admin',
          action: 'REJECT_TASK_COMPLETION',
          details: `Rejected task completion ${id} (${taskName}) for user ${completion.userId}. Reason: ${rejectReason}`,
          createdAt: new Date(),
        });

        // Send Email notification asynchronously
        const targetUser = (await tx.select().from(users).where(eq(users.id, completion.userId)))[0];
        if (targetUser?.email) {
          EmailService.sendStatusUpdateEmail({
            userEmail: targetUser.email,
            userName: targetUser.displayName || targetUser.username,
            requestType: 'TASK',
            status: 'REJECTED',
            amount: completion.reward,
            reference: taskName,
            reason: rejectReason,
            date: new Date(),
          }).catch(err => console.error('[Email] Failed to send task rejection email:', err));
        }
      });

      return res.json({ 
        success: true,
        message: 'تم رفض إنجاز المهمة وحفظ سبب الرفض وإشعار المستخدم' 
      });
    } catch (error: any) {
      if (error.message === 'العملية تمت معالجتها مسبقاً' || error.message === 'إنجاز المهمة غير موجود') {
        return res.status(400).json({ error: error.message });
      }
      next(error);
    }
  },

  async approveCompletion(req: any, res: Response, next: NextFunction) {
    const { action, reason } = req.body || {};
    if (action === 'REJECT') {
      return taskController.rejectSubmission(req, res, next);
    } else {
      return taskController.approveSubmission(req, res, next);
    }
  }
};
