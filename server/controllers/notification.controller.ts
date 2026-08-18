import { Request, Response, NextFunction } from 'express';
import { db } from '../../src/db/index.ts';
import { notifications } from '../../src/db/schema.ts';
import { eq, desc } from 'drizzle-orm';

export const notificationController = {
  async getNotifications(req: any, res: Response, next: NextFunction) {
    try {
      const userNotifications = await db.select().from(notifications)
        .where(eq(notifications.userId, req.user.id))
        .orderBy(desc(notifications.createdAt));
      return res.json({ notifications: userNotifications });
    } catch (error) {
      next(error);
    }
  },

  async markAsRead(req: any, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      
      const notification = (await db.select().from(notifications).where(eq(notifications.id, id)))[0];
        
      if (!notification || notification.userId !== req.user.id) {
        return res.status(404).json({ error: 'الإشعار غير موجود' });
      }

      await db.update(notifications)
        .set({ read: true })
        .where(eq(notifications.id, id));

      return res.json({ message: 'تم تحديث حالة الإشعار' });
    } catch (error) {
      next(error);
    }
  },

  async markAllAsRead(req: any, res: Response, next: NextFunction) {
    try {
      await db.update(notifications)
        .set({ read: true })
        .where(eq(notifications.userId, req.user.id));

      return res.json({ message: 'تم تحديث جميع الإشعارات كمقروءة' });
    } catch (error) {
      next(error);
    }
  }
};
