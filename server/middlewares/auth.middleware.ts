import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { db } from '../../src/db/index.ts';
import { users } from '../../src/db/schema.ts';
import { eq } from 'drizzle-orm';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    role: string;
    vipLevel?: number;
    email?: string;
    username?: string;
  };
}

export const requireAuth = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    let token = req.cookies?.token || (req as any).signedCookies?.token;

    // Also check Authorization header: Bearer <token>
    if (!token && req.headers.authorization) {
      const parts = req.headers.authorization.split(' ');
      if (parts.length === 2 && parts[0].toLowerCase() === 'bearer') {
        token = parts[1];
      }
    }

    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev_jwt_secret_fallback_1234567890') as { userId: string };
    
    // Check if user exists and gets their full profile details
    const [user] = await db.select({ 
      id: users.id, 
      role: users.role, 
      status: users.status,
      vipLevel: users.vipLevel,
      email: users.email,
      username: users.username 
    }).from(users).where(eq(users.id, decoded.userId));
    
    if (!user) {
      res.clearCookie('token', {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        partitioned: true,
      } as any);
      return res.status(401).json({ error: 'User not found' });
    }

    if (user.status !== 'ACTIVE') {
      return res.status(403).json({ error: 'Account suspended or frozen' });
    }

    req.user = { 
      id: user.id, 
      role: user.role,
      vipLevel: user.vipLevel || 0,
      email: user.email,
      username: user.username
    };
    next();
  } catch (error) {
    res.clearCookie('token', {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      partitioned: true,
    } as any);
    return res.status(401).json({ error: 'Invalid token' });
  }
};

export const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user || req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Forbidden: Admin access required' });
  }
  next();
};
