import { Request, Response, NextFunction } from 'express';
import { db } from '../../src/db/index.ts';
import { users } from '../../src/db/schema.ts';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcrypt';
import { z } from 'zod';

export const userController = {
  async getProfile(req: any, res: Response, next: NextFunction) {
    try {
      const user = (await db.select({
        id: users.id,
        username: users.username,
        email: users.email,
        phone: users.phone,
        displayName: users.displayName,
        role: users.role,
        status: users.status,
        vipLevel: users.vipLevel,
        transactionPin: users.transactionPin,
      }).from(users).where(eq(users.id, req.user.id)))[0];
      
      if (!user) return res.status(404).json({ error: 'المستخدم غير موجود' });
      return res.json({ 
        user: {
          ...user,
          transactionPin: undefined,
          hasPin: !!user.transactionPin,
        }
      });
    } catch (error) {
      next(error);
    }
  },

  async updateProfile(req: any, res: Response, next: NextFunction) {
    try {
      // Allowed fields only
      const { displayName, phone } = req.body;
      
      await db.update(users).set({
        displayName,
        phone,
        updatedAt: new Date(),
      }).where(eq(users.id, req.user.id));

      return res.json({ message: 'تم تحديث الملف الشخصي بنجاح' });
    } catch (error) {
      next(error);
    }
  },

  async changePassword(req: any, res: Response, next: NextFunction) {
    try {
      const { oldPassword, newPassword } = req.body;
      if (!oldPassword || !newPassword) {
        return res.status(400).json({ error: 'يرجى إدخال كلمة المرور الحالية والجديدة' });
      }
      
      const user = (await db.select().from(users).where(eq(users.id, req.user.id)))[0];
      if (!user) return res.status(404).json({ error: 'المستخدم غير موجود' });

      const isValid = await bcrypt.compare(oldPassword, user.passwordHash);
      if (!isValid) return res.status(400).json({ error: 'كلمة المرور الحالية غير صحيحة' });

      if (newPassword.length < 6) return res.status(400).json({ error: 'كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل' });

      const newHash = await bcrypt.hash(newPassword, 12);
      await db.update(users).set({ passwordHash: newHash, updatedAt: new Date() }).where(eq(users.id, req.user.id));

      return res.json({ message: 'تم تغيير كلمة المرور بنجاح' });
    } catch (error) {
      next(error);
    }
  },

  async setTransactionPin(req: any, res: Response, next: NextFunction) {
    try {
      const { pin, currentPassword, currentPin } = req.body;

      if (!pin || typeof pin !== 'string' || !/^\d{4,6}$/.test(pin)) {
        return res.status(400).json({ error: 'الرقم السري للعمليات (PIN) يجب أن يتكون من 4 إلى 6 أرقام فقط' });
      }

      const user = (await db.select().from(users).where(eq(users.id, req.user.id)))[0];
      if (!user) return res.status(404).json({ error: 'المستخدم غير موجود' });

      // If user already has a PIN, verify either currentPin or currentPassword
      if (user.transactionPin) {
        let isAuthorized = false;
        if (currentPin) {
          isAuthorized = await bcrypt.compare(currentPin, user.transactionPin);
        }
        if (!isAuthorized && currentPassword) {
          isAuthorized = await bcrypt.compare(currentPassword, user.passwordHash);
        }
        if (!isAuthorized) {
          return res.status(400).json({ error: 'الرقم السري الحالي أو كلمة المرور غير صحيحة' });
        }
      } else {
        // If first time setting PIN, verify password for security
        if (!currentPassword) {
          return res.status(400).json({ error: 'يرجى إدخال كلمة مرور حسابك لتأكيد تعيين الرقم السري' });
        }
        const isPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
        if (!isPasswordValid) {
          return res.status(400).json({ error: 'كلمة المرور غير صحيحة' });
        }
      }

      const hashedPin = await bcrypt.hash(pin, 10);
      await db.update(users).set({ transactionPin: hashedPin, updatedAt: new Date() }).where(eq(users.id, req.user.id));

      return res.json({ 
        message: user.transactionPin ? 'تم تحديث الرقم السري للعمليات (PIN) بنجاح' : 'تم تعيين الرقم السري للعمليات (PIN) بنجاح',
        hasPin: true 
      });
    } catch (error) {
      next(error);
    }
  }
};
