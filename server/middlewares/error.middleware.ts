import { Request, Response, NextFunction } from 'express';

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('[Error Handler]:', err);
  const status = err.status || 500;
  const message = err.message || 'حدث خطأ غير متوقع';
  res.status(status).json({ error: message });
};
