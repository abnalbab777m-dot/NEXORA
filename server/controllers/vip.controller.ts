import { users, notifications } from '../../src/db/schema.ts';
import { Request, Response, NextFunction } from 'express';
import { db } from '../../src/db/index.ts';
import { vipPlans } from '../../src/db/schema.ts';
import { eq, asc } from 'drizzle-orm';
import { WalletService } from '../services/wallet.service';
import { TelegramService } from '../services/telegram.service';
import { v4 as uuidv4 } from 'uuid';

export const vipController = {
  // USER
  async getPlans(req: Request, res: Response, next: NextFunction) {
    try {
      const plans = await db.select().from(vipPlans).where(eq(vipPlans.status, 'ACTIVE')).orderBy(asc(vipPlans.level));
      return res.json({ vipPlans: plans, plans });
    } catch (error) {
      next(error);
    }
  },

  async subscribe(req: any, res: Response, next: NextFunction) {
    try {
      const { id: planId } = req.params;
      
      const plan = (await db.select().from(vipPlans).where(eq(vipPlans.id, planId)))[0];
      if (!plan || plan.status !== 'ACTIVE') return res.status(404).json({ error: 'الباقة غير متاحة' });

      // Atomically process payment
      await WalletService.processTransaction(
        req.user.id,
        parseFloat(plan.price as any),
        'VIP_UPGRADE',
        'COMPLETED',
        `ترقية إلى باقة ${plan.name}`
      );

      // Update the user's VIP level
      await db.update(users).set({ vipLevel: plan.level, updatedAt: new Date() }).where(eq(users.id, req.user.id));
      
      // Send notification
      try {
        const notifId = uuidv4();
        await db.insert(notifications).values({
          id: notifId,
          userId: req.user.id,
          title: 'ترقية باقة VIP ناجحة',
          message: `تم ترقية حسابك بنجاح إلى مستوى ${plan.name}! أصبحت مهامك وإعلاناتك اليومية مفعلة.`,
          type: 'SUCCESS',
          read: false,
        });
      } catch (e) {
        console.error('Failed to create notification', e);
      }

      // Dispatch Telegram notification to Admin in background
      (async () => {
        try {
          const userRec = (await db.select().from(users).where(eq(users.id, req.user.id)))[0];
          await TelegramService.notifyVipUpgrade({
            username: userRec?.displayName || userRec?.username || req.user.id,
            email: userRec?.email || undefined,
            vipLevel: plan.level,
            planName: plan.name,
            price: parseFloat(plan.price as any),
          });
        } catch (err) {
          console.error('Error dispatching telegram VIP upgrade alert:', err);
        }
      })();

      return res.json({ message: `تمت الترقية إلى ${plan.name} بنجاح`, newVipLevel: plan.level });
    } catch (error: any) {
      if (error.message && (error.message.includes('Insufficient funds') || error.message.includes('رصيد غير كاف'))) {
        return res.status(400).json({ error: 'رصيدك المتاح غير كافٍ للاشتراك في هذه الباقة. يرجى شحن الرصيد أولاً.' });
      }
      next(error);
    }
  },

  // ADMIN
  async createPlan(req: Request, res: Response, next: NextFunction) {
    try {
      const { level, name, price, durationDays, dailyTasks, dailyAds } = req.body;
      const id = uuidv4();
      await db.insert(vipPlans).values({
        id,
        level,
        name,
        price: parseFloat(price.toString()),
        durationDays,
        dailyTasks,
        dailyAds,
      });
      return res.status(201).json({ message: 'تم إنشاء الباقة' });
    } catch (error) {
      next(error);
    }
  },
  
  async updatePlan(req: Request, res: Response, next: NextFunction) {
     try {
        const id = req.params.id as string;
        const updates = req.body;
        
        if (updates.price) updates.price = parseFloat(updates.price.toString());

        await db.update(vipPlans).set(updates).where(eq(vipPlans.id, id));
        return res.json({ message: 'تم التحديث بنجاح' });
     } catch (error) {
        next(error);
     }
  }
};

