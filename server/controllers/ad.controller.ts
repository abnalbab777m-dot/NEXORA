import { Request, Response, NextFunction } from 'express';
import { db } from '../../src/db/index.ts';
import { ads, adCompletions, adminLogs, notifications, users } from '../../src/db/schema.ts';
import { eq, and } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { WalletService } from '../services/wallet.service';

export const adController = {
  // --- USER ENDPOINTS ---
  async getAds(req: any, res: Response, next: NextFunction) {
    try {
      const allAds = await db.select().from(ads).where(eq(ads.status, 'ACTIVE'));
      return res.json({ ads: allAds });
    } catch (error) {
      next(error);
    }
  },

  async getCompletions(req: any, res: Response, next: NextFunction) {
    try {
      const completions = await db.select().from(adCompletions).where(eq(adCompletions.userId, req.user.id));
      return res.json({ completions });
    } catch (error) {
      next(error);
    }
  },

  async completeAd(req: any, res: Response, next: NextFunction) {
    try {
      const { id: adId } = req.params;
      const ad = (await db.select().from(ads).where(eq(ads.id, adId)))[0];
      if (!ad || ad.status !== 'ACTIVE') return res.status(404).json({ error: 'الإعلان غير متوفر أو غير نشط' });
      
      const userVipLevel = req.user?.vipLevel || 0;
      if (userVipLevel < ad.requiredVipLevel) {
        return res.status(403).json({ error: `هذا الإعلان يتطلب مستوى VIP ${ad.requiredVipLevel} أو أعلى (مستواك الحالي: VIP ${userVipLevel})` });
      }

      // Check if already completed today (in user's local day or last 24h/calendar day)
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const existing = await db.select().from(adCompletions).where(
        and(
          eq(adCompletions.adId, adId),
          eq(adCompletions.userId, req.user.id)
        )
      );
      
      const completedToday = existing.some(c => c.status === 'COMPLETED' && new Date(c.completedAt) >= todayStart);
      if (completedToday) {
        return res.status(400).json({ error: 'لقد قمت بمشاهدة هذا الإعلان اليوم بالفعل' });
      }

      const completionId = uuidv4();
      const rewardAmount = Number(ad.reward) || 0;

      let walletResult: any;

      // Process transaction and add to wallet immediately
      await db.transaction(async (tx) => {
        // Insert completion as COMPLETED
        await tx.insert(adCompletions).values({
          id: completionId,
          adId,
          userId: req.user.id,
          reward: rewardAmount,
          status: 'COMPLETED',
          completedAt: new Date(),
        });

        // Credit to wallet & update availableBalance and totalEarnings immediately
        walletResult = await WalletService.processTransactionWithTx(
          tx,
          req.user.id,
          rewardAmount,
          'AD_REWARD',
          'COMPLETED',
          `مكافأة مشاهدة إعلان: ${ad.title}`
        );

        // Add a notification for user
        await tx.insert(notifications).values({
          id: uuidv4(),
          userId: req.user.id,
          title: '🎉 تمت إضافة مكافأة الإعلان!',
          message: `تمت إضافة مكافأة مشاهدة إعلان "${ad.title}" بقيمة +${rewardAmount} $ بنجاح إلى رصيدك المتاح.`,
          type: 'SUCCESS',
          read: false,
          createdAt: new Date(),
        });
      });
      
      return res.json({ 
        success: true,
        message: `تم إكمال الإعلان بنجاح وتمت إضافة ${rewardAmount} $ إلى رصيدك المتاح!`,
        reward: rewardAmount,
        adId,
        availableBalance: walletResult?.newAvailable
      });
    } catch (error) {
      next(error);
    }
  },

  // --- ADMIN ENDPOINTS ---
  async createAd(req: Request, res: Response, next: NextFunction) {
    try {
      const { title, description, reward, durationSeconds, requiredVipLevel, url, status } = req.body;
      const adId = uuidv4();
      
      await db.insert(ads).values({
        id: adId,
        title: title?.trim(),
        description: description?.trim() || null,
        reward: Number(reward) || 0,
        durationSeconds: Number(durationSeconds) || 5,
        url: url?.trim() || null,
        requiredVipLevel: requiredVipLevel ? Number(requiredVipLevel) : 0,
        status: status || 'ACTIVE',
        createdAt: new Date(),
      });

      // Broadcast in-app notification to all active users if ad is active
      if (status !== 'INACTIVE') {
        (async () => {
          try {
            const activeUsers = await db.select({ id: users.id }).from(users).where(eq(users.status, 'ACTIVE'));
            if (activeUsers.length > 0) {
              const notifEntries = activeUsers.map(u => ({
                id: uuidv4(),
                userId: u.id,
                title: '📢 تم إضافة إعلان جديد!',
                message: `تمت إضافة إعلان جديد: "${title?.trim()}" بمكافأة +${Number(reward) || 0} $. شاهده الآن لزيادة أرباحك.`,
                type: 'INFO',
                read: false,
                createdAt: new Date(),
              }));
              await db.insert(notifications).values(notifEntries);
            }
          } catch (nErr) {
            console.error('Failed to broadcast ad notification:', nErr);
          }
        })();
      }

      return res.status(201).json({ message: 'تم إنشاء الإعلان بنجاح', adId });
    } catch (error) {
      next(error);
    }
  },

  async updateAd(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const { title, description, reward, durationSeconds, status, requiredVipLevel, url } = req.body;
      
      const updateData: any = {};
      if (title !== undefined) updateData.title = title.trim();
      if (description !== undefined) updateData.description = description.trim();
      if (reward !== undefined) updateData.reward = Number(reward);
      if (durationSeconds !== undefined) updateData.durationSeconds = Number(durationSeconds);
      if (status !== undefined) updateData.status = status;
      if (requiredVipLevel !== undefined) updateData.requiredVipLevel = Number(requiredVipLevel);
      if (url !== undefined) updateData.url = url ? url.trim() : null;
      
      await db.update(ads).set(updateData).where(eq(ads.id, id));
      return res.json({ message: 'تم تحديث الإعلان بنجاح' });
    } catch (error) {
      next(error);
    }
  },

  async deleteAd(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      // Delete any completions first to prevent foreign key constraint issues
      await db.delete(adCompletions).where(eq(adCompletions.adId, id));
      await db.delete(ads).where(eq(ads.id, id));
      return res.json({ message: 'تم حذف الإعلان بنجاح' });
    } catch (error) {
      next(error);
    }
  },
  
  async getAdminAds(req: Request, res: Response, next: NextFunction) {
    try {
      const allAds = await db.select().from(ads).orderBy(ads.createdAt);
      return res.json({ ads: allAds });
    } catch (error) {
      next(error);
    }
  },

  async getAdminCompletions(req: Request, res: Response, next: NextFunction) {
    try {
      const completions = await db.select().from(adCompletions);
      return res.json({ completions });
    } catch (error) {
      next(error);
    }
  },

  async approveCompletion(req: any, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const { action } = req.body || {};

      await db.transaction(async (tx) => {
        const completion = (await tx.select().from(adCompletions).where(eq(adCompletions.id, id)))[0];
        if (!completion) throw new Error('إنجاز الإعلان غير موجود');
        if (completion.status !== 'PENDING') throw new Error('العملية تمت معالجتها مسبقاً');

        if (action !== 'REJECT') {
          await WalletService.processTransactionWithTx(
            tx,
            completion.userId,
            Number(completion.reward) || 0,
            'AD_REWARD',
            'COMPLETED',
            `مكافأة الإعلان ${completion.adId}`,
            req.user.id
          );
        }

        await tx.update(adCompletions).set({
          status: action === 'REJECT' ? 'REJECTED' : 'COMPLETED',
        }).where(eq(adCompletions.id, id));

        await tx.insert(adminLogs).values({
          id: uuidv4(),
          adminId: req.user.id,
          action: action === 'REJECT' ? 'REJECT_AD_COMPLETION' : 'APPROVE_AD_COMPLETION',
          details: `Processed ad completion ${id} with status ${action === 'REJECT' ? 'REJECTED' : 'COMPLETED'}`,
        });
      });

      return res.json({ message: action === 'REJECT' ? 'تم رفض إنجاز الإعلان' : 'تمت الموافقة على الإعلان وإضافة المكافأة' });
    } catch (error: any) {
       if (error.message === 'العملية تمت معالجتها مسبقاً' || error.message === 'إنجاز الإعلان غير موجود') {
        return res.status(400).json({ error: error.message });
      }
      next(error);
    }
  }
};
