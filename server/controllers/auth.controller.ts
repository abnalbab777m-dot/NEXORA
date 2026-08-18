import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { db } from '../../src/db/index.ts';
import { users, wallets } from '../../src/db/schema.ts';
import { eq, or } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';

const JWT_SECRET = process.env.JWT_SECRET || 'dev_jwt_secret_fallback_1234567890';

export const registerSchema = z.object({
  body: z.object({
    displayName: z.string().min(2, "الاسم الكامل مطلوب"),
    username: z.string().min(3).regex(/^[a-zA-Z0-9_]+$/, "أحرف إنجليزية وأرقام و _ فقط"),
    email: z.string().email("بريد إلكتروني غير صالح"),
    phone: z.string().optional(),
    password: z.string().min(6, "كلمة المرور يجب أن تكون 6 أحرف على الأقل"),
  })
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email("بريد إلكتروني غير صالح"),
    password: z.string().min(1, "كلمة المرور مطلوبة"),
  })
});

export const authController = {
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const { displayName, username, email, phone, password } = req.body;

      let uniqueCheck;
      if (phone) {
          uniqueCheck = or(eq(users.username, username), eq(users.email, email), eq(users.phone, phone));
      } else {
          uniqueCheck = or(eq(users.username, username), eq(users.email, email));
      }
      
      const existingUser = await db.select().from(users).where(uniqueCheck);

      if (existingUser.length > 0) {
        return res.status(400).json({ error: 'البريد الإلكتروني، اسم المستخدم، أو رقم الهاتف مستخدم بالفعل' });
      }

      const passwordHash = await bcrypt.hash(password, 12);
      const userId = uuidv4();

      await db.transaction(async (tx) => {
        await tx.insert(users).values({
          id: userId,
          username,
          email,
          phone: phone || null,
          displayName,
          passwordHash,
          role: 'USER',
          status: 'ACTIVE',
        });

        await tx.insert(wallets).values({
          userId,
        });
      });

      const token = jwt.sign({ userId, role: 'USER' }, JWT_SECRET, { expiresIn: '7d' });

      res.cookie('token', token, {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        maxAge: 7 * 24 * 60 * 60 * 1000,
        partitioned: true
      } as any);

      return res.status(201).json({ message: 'تم إنشاء الحساب بنجاح', token, user: { id: userId, username, email, role: 'USER' } });
    } catch (error) {
      next(error);
    }
  },

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;

      const user = (await db.select().from(users).where(eq(users.email, email)))[0];

      if (!user) {
        return res.status(401).json({ error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' });
      }

      if (user.status !== 'ACTIVE') {
        return res.status(403).json({ error: 'تم تجميد أو حظر هذا الحساب' });
      }

      const isValid = await bcrypt.compare(password, user.passwordHash);

      if (!isValid) {
        return res.status(401).json({ error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' });
      }

      const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

      res.cookie('token', token, {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        maxAge: 7 * 24 * 60 * 60 * 1000,
        partitioned: true
      } as any);

      return res.json({ message: 'تم تسجيل الدخول بنجاح', token, user: { id: user.id, username: user.username, email: user.email, role: user.role } });
    } catch (error) {
      next(error);
    }
  },

  async logout(req: Request, res: Response) {
    res.clearCookie('token', {
      httpOnly: true,
      secure: true,
        sameSite: 'none',
      partitioned: true
    } as any);
    return res.json({ message: 'تم تسجيل الخروج بنجاح' });
  },

  async getMe(req: any, res: Response, next: NextFunction) {
    try {
      const userId = req.user.id;
      const user = (await db.select({
        id: users.id,
        username: users.username,
        email: users.email,
        phone: users.phone,
        displayName: users.displayName,
        role: users.role,
        status: users.status,
        vipLevel: users.vipLevel,
      }).from(users).where(eq(users.id, userId)))[0];

      if (!user) return res.status(404).json({ error: 'المستخدم غير موجود' });

      return res.json({ user });
    } catch (error) {
      next(error);
    }
  }
};
