import { Request, Response, NextFunction } from 'express';
import { db } from '../../src/db/index.ts';
import { users, deposits, withdrawals, adminLogs, wallets, transactions, notifications, taskCompletions } from '../../src/db/schema.ts';
import { eq, desc, sql } from 'drizzle-orm';
import { WalletService } from '../services/wallet.service';
import { SettingsService } from '../services/settings.service';
import { TelegramService } from '../services/telegram.service';
import { v4 as uuidv4 } from 'uuid';

export const adminController = {
  async getAdminLogs(req: Request, res: Response, next: NextFunction) {
    try {
      const logs = await db.select().from(adminLogs).orderBy(desc(adminLogs.createdAt));
      return res.json({ logs });
    } catch (error) {
      next(error);
    }
  },

  // Stats
  async getStats(req: Request, res: Response, next: NextFunction) {
    try {
      const allUsers = await db.select().from(users);
      const allWallets = await db.select().from(wallets);
      const allDeposits = await db.select().from(deposits);
      const allWithdrawals = await db.select().from(withdrawals);
      const allTaskCompletions = await db.select().from(taskCompletions);

      const totalUsers = allUsers.length;
      const activeUsers = allUsers.filter(u => u.status === 'ACTIVE').length;
      const bannedUsers = allUsers.filter(u => u.status === 'BANNED').length;

      const pendingDeposits = allDeposits.filter(d => d.status === 'PENDING');
      const approvedDeposits = allDeposits.filter(d => d.status === 'APPROVED' || d.status === 'COMPLETED');
      const totalDeposits = approvedDeposits.reduce((acc, d) => acc + (Number(d.amount) || 0), 0);

      const pendingWithdrawals = allWithdrawals.filter(w => w.status === 'PENDING');
      const approvedWithdrawals = allWithdrawals.filter(w => w.status === 'APPROVED' || w.status === 'COMPLETED');
      const totalWithdrawals = approvedWithdrawals.reduce((acc, w) => acc + (Number(w.amount) || 0), 0);

      const totalEarningsDistributed = allWallets.reduce((acc, w) => acc + (Number(w.totalEarnings) || 0), 0);
      const totalAvailableBalance = allWallets.reduce((acc, w) => acc + (Number(w.availableBalance) || 0), 0);

      const completedTasksCount = allTaskCompletions.filter(t => t.status === 'COMPLETED').length;
      const pendingTasksCount = allTaskCompletions.filter(t => t.status === 'PENDING').length;
      const rejectedTasksCount = allTaskCompletions.filter(t => t.status === 'REJECTED').length;

      return res.json({
        stats: {
          totalUsers,
          activeUsers,
          bannedUsers,
          totalDeposits,
          totalWithdrawals,
          totalEarningsDistributed,
          totalAvailableBalance,
          pendingDepositsCount: pendingDeposits.length,
          pendingWithdrawalsCount: pendingWithdrawals.length,
          pendingTransactions: pendingDeposits.length + pendingWithdrawals.length,
          tasks: {
            completed: completedTasksCount,
            pending: pendingTasksCount,
            rejected: rejectedTasksCount
          }
        }
      });
    } catch (error) {
      next(error);
    }
  },

  // Manage Users
  async getUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const allUsers = await db.select({
        id: users.id,
        username: users.username,
        email: users.email,
        phone: users.phone,
        displayName: users.displayName,
        role: users.role,
        status: users.status,
        vipLevel: users.vipLevel,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      }).from(users).orderBy(desc(users.createdAt));

      const allWallets = await db.select().from(wallets);
      const walletMap = new Map<string, any>();
      for (const w of allWallets) {
        walletMap.set(w.userId, w);
      }

      const usersWithWallets = allUsers.map(u => {
        const w = walletMap.get(u.id);
        return {
          ...u,
          availableBalance: w ? Number(w.availableBalance) || 0 : 0,
          pendingBalance: w ? Number(w.pendingBalance) || 0 : 0,
          totalEarnings: w ? Number(w.totalEarnings) || 0 : 0,
          totalDeposits: w ? Number(w.totalDeposits) || 0 : 0,
          totalWithdrawals: w ? Number(w.totalWithdrawals) || 0 : 0,
        };
      });

      return res.json({ users: usersWithWallets });
    } catch (error) {
      next(error);
    }
  },

  async updateUserStatus(req: any, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { status } = req.body; // 'ACTIVE', 'FROZEN', 'BANNED'

      if (!['ACTIVE', 'FROZEN', 'BANNED'].includes(status)) {
        return res.status(400).json({ error: 'حالة غير صالحة' });
      }

      await db.update(users).set({ status, updatedAt: new Date() }).where(eq(users.id, id));
      
      // Log admin action
      await db.insert(adminLogs).values({
        id: uuidv4(),
        adminId: req.user.id,
        action: 'UPDATE_USER_STATUS',
        details: `Updated user ${id} status to ${status}`,
        createdAt: new Date(),
      });

      return res.json({ message: 'تم تحديث حالة المستخدم بنجاح' });
    } catch (error) {
      next(error);
    }
  },

  async updateUserVip(req: any, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { vipLevel } = req.body;
      const numLevel = parseInt(vipLevel, 10);

      if (isNaN(numLevel) || numLevel < 0 || numLevel > 10) {
        return res.status(400).json({ error: 'مستوى VIP غير صالح (0-10)' });
      }

      await db.update(users).set({ vipLevel: numLevel, updatedAt: new Date() }).where(eq(users.id, id));

      // Add Notification
      await db.insert(notifications).values({
        id: uuidv4(),
        userId: id,
        title: 'ترقية باقة VIP 🌟',
        message: `تم تحديث مستوى باقتك إلى VIP ${numLevel} بواسطة إدارة المنصة.`,
        type: 'SUCCESS',
        read: false,
        createdAt: new Date(),
      });

      // Log admin action
      await db.insert(adminLogs).values({
        id: uuidv4(),
        adminId: req.user.id,
        action: 'UPDATE_USER_VIP',
        details: `Updated user ${id} VIP level to ${numLevel}`,
        createdAt: new Date(),
      });

      return res.json({ message: `تم تحديث باقة المستخدم إلى VIP ${numLevel} بنجاح` });
    } catch (error) {
      next(error);
    }
  },

  // Financial Requests (Deposits & Withdrawals with user details)
  async getFinancialRequests(req: any, res: Response, next: NextFunction) {
    try {
      const allUsers = await db.select({
        id: users.id,
        username: users.username,
        email: users.email,
        displayName: users.displayName,
        vipLevel: users.vipLevel,
      }).from(users);

      const userMap = new Map<string, any>();
      for (const u of allUsers) {
        userMap.set(u.id, u);
      }

      const rawDeposits = await db.select().from(deposits).orderBy(desc(deposits.createdAt));
      const rawWithdrawals = await db.select().from(withdrawals).orderBy(desc(withdrawals.createdAt));

      const enrichedDeposits = rawDeposits.map(d => {
        const u = userMap.get(d.userId);
        return {
          ...d,
          txType: 'DEPOSIT',
          user: u || { username: 'مستخدم', email: '' },
          username: u?.username || '',
          userEmail: u?.email || '',
          displayName: u?.displayName || u?.username || '',
        };
      });

      const enrichedWithdrawals = rawWithdrawals.map(w => {
        const u = userMap.get(w.userId);
        return {
          ...w,
          txType: 'WITHDRAWAL',
          user: u || { username: 'مستخدم', email: '' },
          username: u?.username || '',
          userEmail: u?.email || '',
          displayName: u?.displayName || u?.username || '',
        };
      });

      return res.json({ deposits: enrichedDeposits, withdrawals: enrichedWithdrawals });
    } catch (error) {
      next(error);
    }
  },

  // Approve Deposit
  async approveDeposit(req: any, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { note } = req.body || {};
      
      let depositUser: any = null;
      let depositAmount = 0;

      await db.transaction(async (tx) => {
        const deposit = (await tx.select().from(deposits).where(eq(deposits.id, id)))[0];
        if (!deposit) throw new Error('الإيداع غير موجود');
        if (deposit.status !== 'PENDING') throw new Error('العملية تمت معالجتها مسبقاً');

        depositUser = deposit.userId;
        depositAmount = Number(deposit.amount) || 0;

        // Process wallet transaction securely
        await WalletService.processTransactionWithTx(
          tx,
          deposit.userId, 
          depositAmount, 
          'DEPOSIT', 
          'APPROVED', 
          `إيداع مؤكد (TXID: ${deposit.reference || id})`, 
          req.user.id,
          id // existingTxId matches the depositId
        );

        // Update deposit status
        await tx.update(deposits).set({
          status: 'APPROVED',
          adminAction: note ? `تم القبول: ${note}` : `Approved by Admin`,
          updatedAt: new Date(),
        }).where(eq(deposits.id, id));

        // Create Notification for user
        await tx.insert(notifications).values({
          id: uuidv4(),
          userId: deposit.userId,
          title: 'تم قبول طلب الإيداع ✅',
          message: `تم التحقق من إيداعك بقيمة ${depositAmount.toFixed(2)}$ وإضافته إلى رصيدك المتاح بنجاح.`,
          type: 'SUCCESS',
          read: false,
          createdAt: new Date(),
        });
        
        // Log
        await tx.insert(adminLogs).values({
          id: uuidv4(),
          adminId: req.user.id,
          action: 'APPROVE_DEPOSIT',
          details: `Approved deposit ${id} of $${depositAmount} for user ${deposit.userId}`,
          createdAt: new Date(),
        });
      });

      return res.json({ message: `تمت الموافقة على الإيداع بنجاح وإضافة ${depositAmount.toFixed(2)}$ لرصيد العميل` });
    } catch (error: any) {
      if (error.message === 'العملية تمت معالجتها مسبقاً' || error.message === 'الإيداع غير موجود') {
        return res.status(400).json({ error: error.message });
      }
      next(error);
    }
  },

  // Reject Deposit
  async rejectDeposit(req: any, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { reason } = req.body || {};
      const rejectReason = reason || 'بيانات المعاملة غير متطابقة أو غير مكتملة على شبكة البلوكتشين';

      await db.transaction(async (tx) => {
        const deposit = (await tx.select().from(deposits).where(eq(deposits.id, id)))[0];
        if (!deposit) throw new Error('طلب الإيداع غير موجود');
        if (deposit.status !== 'PENDING') throw new Error('العملية تمت معالجتها مسبقاً');

        // Process wallet transaction securely (updates ledger to REJECTED)
        await WalletService.processTransactionWithTx(
          tx,
          deposit.userId, 
          Number(deposit.amount), 
          'DEPOSIT', 
          'REJECTED', 
          `طلب إيداع مرفوض (TXID: ${deposit.reference || id})`, 
          req.user.id,
          id // existingTxId
        );

        // Update status to REJECTED
        await tx.update(deposits).set({
          status: 'REJECTED',
          adminAction: `مرفوض: ${rejectReason}`,
          updatedAt: new Date(),
        }).where(eq(deposits.id, id));

        // Add Notification
        await tx.insert(notifications).values({
          id: uuidv4(),
          userId: deposit.userId,
          title: 'تم رفض طلب الإيداع ❌',
          message: `تم رفض طلب إيداع بقيمة ${deposit.amount}$. السبب: ${rejectReason}`,
          type: 'ERROR',
          read: false,
          createdAt: new Date(),
        });

        // Log
        await tx.insert(adminLogs).values({
          id: uuidv4(),
          adminId: req.user.id,
          action: 'REJECT_DEPOSIT',
          details: `Rejected deposit ${id} for user ${deposit.userId}. Reason: ${rejectReason}`,
          createdAt: new Date(),
        });
      });

      return res.json({ message: 'تم رفض طلب الإيداع بنجاح' });
    } catch (error: any) {
      if (error.message === 'العملية تمت معالجتها مسبقاً' || error.message === 'طلب الإيداع غير موجود') {
        return res.status(400).json({ error: error.message });
      }
      next(error);
    }
  },

  // Approve Withdrawal
  async approveWithdrawal(req: any, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { note, txHash } = req.body || {};
      let withdrawalAmount = 0;

      await db.transaction(async (tx) => {
        const withdrawal = (await tx.select().from(withdrawals).where(eq(withdrawals.id, id)))[0];
        if (!withdrawal) throw new Error('طلب السحب غير موجود');
        if (withdrawal.status !== 'PENDING') throw new Error('العملية تمت معالجتها مسبقاً');

        withdrawalAmount = Number(withdrawal.amount) || 0;

        // Process wallet securely (moves from pending to totalWithdrawals)
        await WalletService.processTransactionWithTx(
          tx,
          withdrawal.userId, 
          withdrawalAmount, 
          'WITHDRAWAL', 
          'APPROVED', 
          txHash ? `سحب مؤكد (Hash: ${txHash})` : `سحب مؤكد إلى محفظة: ${withdrawal.reference || ''}`, 
          req.user.id,
          id // existingTxId
        );

        // Update withdrawal status
        await tx.update(withdrawals).set({
          status: 'APPROVED',
          adminAction: txHash ? `تم التحويل Hash: ${txHash}` : (note || `Approved by Admin`),
          updatedAt: new Date(),
        }).where(eq(withdrawals.id, id));

        // Create Notification
        await tx.insert(notifications).values({
          id: uuidv4(),
          userId: withdrawal.userId,
          title: 'تم تحويل السحب بنجاح 💸',
          message: `تمت الموافقة على طلب سحب بقيمة ${withdrawalAmount.toFixed(2)}$ وإرساله إلى عنوان محفظتك.`,
          type: 'SUCCESS',
          read: false,
          createdAt: new Date(),
        });

        // Log
        await tx.insert(adminLogs).values({
          id: uuidv4(),
          adminId: req.user.id,
          action: 'APPROVE_WITHDRAWAL',
          details: `Approved withdrawal ${id} of $${withdrawalAmount} for user ${withdrawal.userId}`,
          createdAt: new Date(),
        });
      });

      return res.json({ message: `تمت الموافقة على طلب السحب بقيمة ${withdrawalAmount.toFixed(2)}$ بنجاح` });
    } catch (error: any) {
      if (error.message === 'العملية تمت معالجتها مسبقاً' || error.message === 'طلب السحب غير موجود') {
        return res.status(400).json({ error: error.message });
      }
      next(error);
    }
  },

  // Reject Withdrawal (Auto-refunds pending amount back to available balance)
  async rejectWithdrawal(req: any, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { reason } = req.body || {};
      const rejectReason = reason || 'عنوان المحفظة غير صالح أو شبكة التحويل غير متطابقة';
      let withdrawalAmount = 0;

      await db.transaction(async (tx) => {
        const withdrawal = (await tx.select().from(withdrawals).where(eq(withdrawals.id, id)))[0];
        if (!withdrawal) throw new Error('طلب السحب غير موجود');
        if (withdrawal.status !== 'PENDING') throw new Error('العملية تمت معالجتها مسبقاً');

        withdrawalAmount = Number(withdrawal.amount) || 0;

        // Process refund in wallet (REJECTED status automatically adds amount back to available and deducts from pending!)
        await WalletService.processTransactionWithTx(
          tx,
          withdrawal.userId, 
          withdrawalAmount, 
          'WITHDRAWAL', 
          'REJECTED', 
          `استرجاع سحب مرفوض (${rejectReason})`, 
          req.user.id,
          id // existingTxId
        );

        // Update status to REJECTED
        await tx.update(withdrawals).set({
          status: 'REJECTED',
          adminAction: `مرفوض: ${rejectReason}`,
          updatedAt: new Date(),
        }).where(eq(withdrawals.id, id));

        // Create Notification
        await tx.insert(notifications).values({
          id: uuidv4(),
          userId: withdrawal.userId,
          title: 'تم رفض طلب السحب وإعادة الرصيد ⚠️',
          message: `تم رفض طلب السحب بقيمة ${withdrawalAmount.toFixed(2)}$ وتمت إعادة المبلغ المحجوز تلقائياً إلى رصيدك المتاح. السبب: ${rejectReason}`,
          type: 'WARNING',
          read: false,
          createdAt: new Date(),
        });

        // Log
        await tx.insert(adminLogs).values({
          id: uuidv4(),
          adminId: req.user.id,
          action: 'REJECT_WITHDRAWAL',
          details: `Rejected withdrawal ${id} of $${withdrawalAmount} and refunded user ${withdrawal.userId}. Reason: ${rejectReason}`,
          createdAt: new Date(),
        });
      });

      return res.json({ message: `تم رفض طلب السحب وإعادة مبلغ ${withdrawalAmount.toFixed(2)}$ إلى رصيد العميل المتاح بنجاح` });
    } catch (error: any) {
      if (error.message === 'العملية تمت معالجتها مسبقاً' || error.message === 'طلب السحب غير موجود') {
        return res.status(400).json({ error: error.message });
      }
      next(error);
    }
  },

  // Wallet Adjustment (Manual Admin intervention)
  async adjustWallet(req: any, res: Response, next: NextFunction) {
    try {
      const { id: targetUserId } = req.params;
      const { amount, reason, type } = req.body;

      const numAmount = Number(amount);
      if (isNaN(numAmount) || numAmount === 0) return res.status(400).json({ error: 'مبلغ غير صالح' });
      if (!reason) return res.status(400).json({ error: 'سبب التعديل مطلوب' });

      const finalAmount = (type === 'DEDUCT' && numAmount > 0) ? -numAmount : numAmount;
      const absAmount = Math.abs(finalAmount);
      const isAddition = finalAmount > 0;

      await db.transaction(async (tx) => {
        const wallet = (await tx.select().from(wallets).where(eq(wallets.userId, targetUserId)))[0];
        if (!wallet) throw new Error('محفظة المستخدم غير موجودة');

        const currentAvailable = Number(wallet.availableBalance) || 0;
        const newAvailable = currentAvailable + finalAmount;

        if (newAvailable < 0) throw new Error('لا يمكن أن يكون الرصيد بالسالب');

        await tx.update(wallets).set({
          availableBalance: newAvailable,
          updatedAt: new Date(),
        }).where(eq(wallets.userId, targetUserId));

        // Ledger
        await tx.insert(transactions).values({
          id: uuidv4(),
          userId: targetUserId,
          type: 'ADMIN_ADJUSTMENT' as any,
          amount: absAmount,
          status: 'COMPLETED',
          description: `تسوية إدارية (${isAddition ? 'إضافة' : 'خصم'}): ${reason}`,
          balanceBefore: currentAvailable,
          balanceAfter: newAvailable,
          processedBy: req.user.id,
          processedAt: new Date(),
        });

        // Notify user
        await tx.insert(notifications).values({
          id: uuidv4(),
          userId: targetUserId,
          title: isAddition ? 'إضافة رصيد إداري 🎁' : 'خصم رصيد إداري ℹ️',
          message: `تم ${isAddition ? 'إضافة' : 'خصم'} ${absAmount.toFixed(2)}$ إلى رصيدك. البيان: ${reason}`,
          type: isAddition ? 'SUCCESS' : 'INFO',
          read: false,
          createdAt: new Date(),
        });

        // Admin log
        await tx.insert(adminLogs).values({
          id: uuidv4(),
          adminId: req.user.id,
          action: 'WALLET_ADJUSTMENT',
          details: `Adjusted user ${targetUserId} wallet by ${finalAmount}. Reason: ${reason}`,
          createdAt: new Date(),
        });
      });

      return res.json({ message: 'تم تعديل الرصيد بنجاح' });
    } catch (error: any) {
      if (error.message === 'لا يمكن أن يكون الرصيد بالسالب' || error.message === 'محفظة المستخدم غير موجودة') {
         return res.status(400).json({ error: error.message });
      }
      next(error);
    }
  },

  // System Settings
  async getSettings(req: Request, res: Response, next: NextFunction) {
    try {
      const settings = await SettingsService.getAll();
      return res.json({ settings });
    } catch (error) {
      next(error);
    }
  },

  async updateSettings(req: any, res: Response, next: NextFunction) {
    try {
      const updates = req.body;
      if (!updates || typeof updates !== 'object') {
        return res.status(400).json({ error: 'بيانات غير صالحة' });
      }

      const updated = await SettingsService.updateAll(updates, req.user?.id);

      // Log admin action
      await db.insert(adminLogs).values({
        id: uuidv4(),
        adminId: req.user.id,
        action: 'UPDATE_SYSTEM_SETTINGS',
        details: `Updated settings: ${Object.keys(updates).join(', ')}`,
        createdAt: new Date(),
      });

      return res.json({ message: 'تم تحديث إعدادات النظام بنجاح', settings: updated });
    } catch (error) {
      next(error);
    }
  },

  // Test Telegram Bot Connection
  async testTelegram(req: any, res: Response, next: NextFunction) {
    try {
      const { botToken, chatId } = req.body || {};
      const result = await TelegramService.testConnection(botToken, chatId);
      if (!result.success) {
        return res.status(400).json({ error: result.message, ...result });
      }
      return res.json({ message: result.message, ...result });
    } catch (error) {
      next(error);
    }
  }
};
