import { Router } from 'express';
import { authController, registerSchema, loginSchema } from './controllers/auth.controller';
import { userController } from './controllers/user.controller';
import { walletController, depositSchema, withdrawSchema } from './controllers/wallet.controller';
import { adminController } from './controllers/admin.controller';
import { taskController } from './controllers/task.controller';
import { vipController } from './controllers/vip.controller';
import { adController } from './controllers/ad.controller';
import { notificationController } from './controllers/notification.controller';
import { paymentMethodController } from './controllers/payment-method.controller';

import { requireAuth, requireAdmin } from './middlewares/auth.middleware';
import { validate } from './middlewares/validate.middleware';
import { db } from '../src/db/index.ts';
import { deposits, transactions, withdrawals } from '../src/db/schema.ts';
import { desc } from 'drizzle-orm';

const router = Router();

// --- Live DB Debug Endpoint ---
router.get('/debug/db-status', async (req, res) => {
  try {
    const rawDeposits = await db.select({
      id: deposits.id,
      userId: deposits.userId,
      amount: deposits.amount,
      status: deposits.status,
      reference: deposits.reference,
      createdAt: deposits.createdAt,
      updatedAt: deposits.updatedAt,
    }).from(deposits).orderBy(desc(deposits.createdAt)).limit(50);

    const rawTransactions = await db.select({
      id: transactions.id,
      userId: transactions.userId,
      type: transactions.type,
      amount: transactions.amount,
      status: transactions.status,
      description: transactions.description,
      createdAt: transactions.createdAt,
      processedAt: transactions.processedAt,
    }).from(transactions).orderBy(desc(transactions.createdAt)).limit(50);

    const rawWithdrawals = await db.select({
      id: withdrawals.id,
      userId: withdrawals.userId,
      amount: withdrawals.amount,
      status: withdrawals.status,
      reference: withdrawals.reference,
      createdAt: withdrawals.createdAt,
      updatedAt: withdrawals.updatedAt,
    }).from(withdrawals).orderBy(desc(withdrawals.createdAt)).limit(50);

    return res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      depositsCount: rawDeposits.length,
      transactionsCount: rawTransactions.length,
      withdrawalsCount: rawWithdrawals.length,
      deposits: rawDeposits,
      transactions: rawTransactions,
      withdrawals: rawWithdrawals,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// --- Auth Routes ---
router.post('/auth/register', validate(registerSchema), authController.register);
router.post('/auth/login', validate(loginSchema), authController.login);
router.post('/auth/logout', authController.logout);
router.get('/auth/me', requireAuth, authController.getMe);

// --- User Routes ---
router.get('/user/profile', requireAuth, userController.getProfile);
router.patch('/user/profile', requireAuth, userController.updateProfile);
router.post('/user/change-password', requireAuth, userController.changePassword);
router.post('/user/pin', requireAuth, userController.setTransactionPin);

// --- Wallet Routes ---
router.get('/wallet', requireAuth, walletController.getWallet);
router.get('/wallet/transactions', requireAuth, walletController.getTransactions);
router.get('/transactions', requireAuth, walletController.getTransactions);
router.get('/wallet/history', requireAuth, walletController.getTransactions);
router.post('/deposits', requireAuth, validate(depositSchema), walletController.requestDeposit);
router.get('/deposits', requireAuth, walletController.getDeposits);
router.post('/withdrawals', requireAuth, validate(withdrawSchema), walletController.requestWithdrawal);
router.get('/withdrawals', requireAuth, walletController.getWithdrawals);

// --- Task Routes ---
router.get('/tasks', requireAuth, taskController.getTasks);
router.post('/tasks/:id/complete', requireAuth, taskController.completeTask);
router.get('/tasks/completions', requireAuth, taskController.getCompletions);

// --- VIP Routes ---
router.get('/vip', requireAuth, vipController.getPlans);
router.post('/vip/:id/subscribe', requireAuth, vipController.subscribe);

// --- Ad Routes ---
router.get('/ads', requireAuth, adController.getAds);
router.post('/ads/:id/complete', requireAuth, adController.completeAd);
router.get('/ads/completions', requireAuth, adController.getCompletions);

// --- Notification Routes ---
router.get('/notifications', requireAuth, notificationController.getNotifications);
router.patch('/notifications/:id/read', requireAuth, notificationController.markAsRead);
router.post('/notifications/read-all', requireAuth, notificationController.markAllAsRead);

// --- System Settings & Payment Methods (Public / Authenticated) ---
router.get('/settings', adminController.getSettings);
router.get('/payment-methods', paymentMethodController.getActivePaymentMethods);

// --- Admin Routes ---
router.use('/admin', requireAuth, requireAdmin); // Apply to all /admin/*

router.get('/admin/stats', adminController.getStats);
router.get('/admin/users', adminController.getUsers);
router.patch('/admin/users/:id/status', adminController.updateUserStatus);
router.patch('/admin/users/:id/vip', adminController.updateUserVip);
router.post('/admin/users/:id/wallet-adjustment', adminController.adjustWallet);
router.get('/admin/financial-requests', adminController.getFinancialRequests);

// Admin Payment Methods Management
router.get('/admin/payment-methods', paymentMethodController.getAdminPaymentMethods);
router.post('/admin/payment-methods', paymentMethodController.createPaymentMethod);
router.patch('/admin/payment-methods/:id', paymentMethodController.updatePaymentMethod);
router.patch('/admin/payment-methods/:id/toggle', paymentMethodController.togglePaymentMethodStatus);
router.delete('/admin/payment-methods/:id', paymentMethodController.deletePaymentMethod);

router.post('/admin/deposits/:id/approve', adminController.approveDeposit);
router.post('/admin/deposits/:id/reject', adminController.rejectDeposit);
router.post('/admin/withdrawals/:id/approve', adminController.approveWithdrawal);
router.post('/admin/withdrawals/:id/reject', adminController.rejectWithdrawal);

router.get('/admin/settings', adminController.getSettings);
router.post('/admin/settings', adminController.updateSettings);
router.patch('/admin/settings', adminController.updateSettings);
router.post('/admin/telegram/test', adminController.testTelegram);
router.post('/admin/email/test', adminController.testEmail);

router.get('/admin/tasks', taskController.getAdminTasks);
router.post('/admin/tasks', taskController.createTask);
router.patch('/admin/tasks/:id', taskController.updateTask);
router.delete('/admin/tasks/:id', taskController.deleteTask);
router.get('/admin/task-completions', taskController.getAdminCompletions);
router.get('/admin/task-completions/:id/proof', taskController.getCompletionProof);
router.post('/admin/task-completions/:id/approve', taskController.approveCompletion);

router.get('/admin/ads', adController.getAdminAds);
router.post('/admin/ads', adController.createAd);
router.patch('/admin/ads/:id', adController.updateAd);
router.delete('/admin/ads/:id', adController.deleteAd);
router.get('/admin/ad-completions', adController.getAdminCompletions);
router.post('/admin/ad-completions/:id/approve', adController.approveCompletion);

router.get('/admin/logs', adminController.getAdminLogs);

router.post('/admin/vip', vipController.createPlan);
router.patch('/admin/vip/:id', vipController.updatePlan);

export default router;
