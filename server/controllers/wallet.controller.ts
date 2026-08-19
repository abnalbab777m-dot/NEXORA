import { Request, Response, NextFunction } from 'express';
import { db } from '../../src/db/index.ts';
import { wallets, transactions, deposits, withdrawals, users, systemSettings } from '../../src/db/schema.ts';
import { eq, desc } from 'drizzle-orm';
import { WalletService } from '../services/wallet.service';
import { TelegramService } from '../services/telegram.service';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcrypt';

export const depositSchema = z.object({
  body: z.object({
    amount: z.number().min(1, "الحد الأدنى للإيداع هو 1$"),
    reference: z.string().optional(),
    txid: z.string().optional(),
    paymentMethod: z.string().optional(),
  })
});

export const withdrawSchema = z.object({
  body: z.object({
    amount: z.number().min(1, "الحد الأدنى للسحب هو 1$"),
    address: z.string().optional(),
    reference: z.string().optional(),
    paymentMethod: z.string().optional(),
    pin: z.string().optional(),
  })
});

export const amountSchema = depositSchema;

export const walletController = {
  async getWallet(req: any, res: Response, next: NextFunction) {
    try {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');

      let wallet = (await db.select().from(wallets).where(eq(wallets.userId, req.user.id)))[0];
      if (!wallet) {
        await db.insert(wallets).values({
          userId: req.user.id,
          availableBalance: 0,
          pendingBalance: 0,
          totalEarnings: 0,
          totalDeposits: 0,
          totalWithdrawals: 0,
        });
        wallet = (await db.select().from(wallets).where(eq(wallets.userId, req.user.id)))[0];
      }
      return res.json({ wallet });
    } catch (error) {
      next(error);
    }
  },

  async getTransactions(req: any, res: Response, next: NextFunction) {
    try {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');

      const [txs, userDeposits, userWithdrawals] = await Promise.all([
        db.select().from(transactions)
          .where(eq(transactions.userId, req.user.id))
          .orderBy(desc(transactions.createdAt)),
        db.select().from(deposits)
          .where(eq(deposits.userId, req.user.id))
          .orderBy(desc(deposits.createdAt)),
        db.select().from(withdrawals)
          .where(eq(withdrawals.userId, req.user.id))
          .orderBy(desc(withdrawals.createdAt)),
      ]);

      const reconciledTxs = [...txs];
      const updatesToSync: Array<{ id: string; status: string }> = [];

      for (const tx of reconciledTxs) {
        if (tx.type === 'DEPOSIT') {
          // Find matching deposit
          const matchedDeposit = userDeposits.find(d => 
            d.id === tx.id || 
            (d.reference && tx.description && tx.description.includes(d.reference)) ||
            (Math.abs(Number(d.amount) - Number(tx.amount)) < 0.001 && Math.abs(new Date(d.createdAt).getTime() - new Date(tx.createdAt).getTime()) < 86400000)
          );

          if (matchedDeposit) {
            const depSt = String(matchedDeposit.status || '').toUpperCase();
            let targetStatus = tx.status;
            if (depSt === 'APPROVED' || depSt === 'COMPLETED') {
              targetStatus = 'COMPLETED';
            } else if (depSt === 'REJECTED' || depSt === 'CANCELLED') {
              targetStatus = 'REJECTED';
            } else if (depSt === 'PENDING') {
              targetStatus = 'PENDING';
            }

            if (tx.status !== targetStatus) {
              tx.status = targetStatus;
              updatesToSync.push({ id: tx.id, status: targetStatus });
            }
          }
        } else if (tx.type === 'WITHDRAWAL') {
          // Find matching withdrawal
          const matchedWithdrawal = userWithdrawals.find(w => 
            w.id === tx.id || 
            (w.reference && tx.description && tx.description.includes(w.reference)) ||
            (Math.abs(Number(w.amount) - Number(tx.amount)) < 0.001 && Math.abs(new Date(w.createdAt).getTime() - new Date(tx.createdAt).getTime()) < 86400000)
          );

          if (matchedWithdrawal) {
            const withSt = String(matchedWithdrawal.status || '').toUpperCase();
            let targetStatus = tx.status;
            if (withSt === 'APPROVED' || withSt === 'COMPLETED') {
              targetStatus = 'COMPLETED';
            } else if (withSt === 'REJECTED' || withSt === 'CANCELLED') {
              targetStatus = 'REJECTED';
            } else if (withSt === 'PENDING') {
              targetStatus = 'PENDING';
            }

            if (tx.status !== targetStatus) {
              tx.status = targetStatus;
              updatesToSync.push({ id: tx.id, status: targetStatus });
            }
          }
        }
      }

      // Check for any deposits that might be completely missing from transactions table
      for (const dep of userDeposits) {
        const existsInTxs = reconciledTxs.some(t => 
          t.id === dep.id || 
          (t.type === 'DEPOSIT' && (
            (dep.reference && t.description && t.description.includes(dep.reference)) ||
            (Math.abs(Number(t.amount) - Number(dep.amount)) < 0.001 && Math.abs(new Date(t.createdAt).getTime() - new Date(dep.createdAt).getTime()) < 86400000)
          ))
        );
        if (!existsInTxs) {
          const depSt = String(dep.status || '').toUpperCase();
          const synStatus = (depSt === 'APPROVED' || depSt === 'COMPLETED') ? 'COMPLETED' : (depSt === 'REJECTED' ? 'REJECTED' : 'PENDING');
          reconciledTxs.push({
            id: dep.id,
            userId: req.user.id,
            type: 'DEPOSIT',
            amount: Number(dep.amount),
            currency: 'USD',
            status: synStatus,
            description: dep.reference ? `طلب إيداع (TXID: ${dep.reference})` : 'طلب إيداع',
            balanceBefore: null,
            balanceAfter: null,
            createdAt: dep.createdAt,
            processedAt: dep.updatedAt || null,
            processedBy: null
          });
        }
      }

      // Check for any withdrawals that might be completely missing from transactions table
      for (const w of userWithdrawals) {
        const existsInTxs = reconciledTxs.some(t => 
          t.id === w.id || 
          (t.type === 'WITHDRAWAL' && (
            (w.reference && t.description && t.description.includes(w.reference)) ||
            (Math.abs(Number(t.amount) - Number(w.amount)) < 0.001 && Math.abs(new Date(t.createdAt).getTime() - new Date(w.createdAt).getTime()) < 86400000)
          ))
        );
        if (!existsInTxs) {
          const withSt = String(w.status || '').toUpperCase();
          const synStatus = (withSt === 'APPROVED' || withSt === 'COMPLETED') ? 'COMPLETED' : (withSt === 'REJECTED' ? 'REJECTED' : 'PENDING');
          reconciledTxs.push({
            id: w.id,
            userId: req.user.id,
            type: 'WITHDRAWAL',
            amount: Number(w.amount),
            currency: 'USD',
            status: synStatus,
            description: w.reference ? `طلب سحب إلى محفظة: ${w.reference}` : 'طلب سحب',
            balanceBefore: null,
            balanceAfter: null,
            createdAt: w.createdAt,
            processedAt: w.updatedAt || null,
            processedBy: null
          });
        }
      }

      // Deduplicate reconciled transactions (preserve distinct unique events)
      const uniqueMap = new Map<string, any>();
      for (const t of reconciledTxs) {
        const idKey = t.id;
        if (!uniqueMap.has(idKey)) {
          uniqueMap.set(idKey, t);
        } else {
          // If already exists, prefer completed/rejected over pending
          const existing = uniqueMap.get(idKey);
          if (existing.status === 'PENDING' && t.status !== 'PENDING') {
            uniqueMap.set(idKey, t);
          }
        }
      }

      const finalTxs = Array.from(uniqueMap.values());

      // Sort all reconciled transactions by date descending
      finalTxs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      // Asynchronously update transactions table in background if any inconsistencies were corrected
      if (updatesToSync.length > 0) {
        (async () => {
          try {
            for (const item of updatesToSync) {
              await db.update(transactions)
                .set({ status: item.status })
                .where(eq(transactions.id, item.id));
            }
          } catch (syncErr) {
            console.error('Background transaction status sync error:', syncErr);
          }
        })();
      }

      return res.json({ transactions: finalTxs });
    } catch (error) {
      next(error);
    }
  },

  // Deposits
  async requestDeposit(req: any, res: Response, next: NextFunction) {
    try {
      const { amount, reference, txid, paymentMethod } = req.body;
      const numAmount = Number(amount);
      const ref = reference || txid || '';

      // Check min deposit from settings
      let minDeposit = 5;
      try {
        const settingRow = (await db.select().from(systemSettings).where(eq(systemSettings.key, 'min_deposit')))[0];
        if (settingRow?.value) {
          minDeposit = parseFloat(settingRow.value) || 5;
        }
      } catch (e) {}

      if (isNaN(numAmount) || numAmount < minDeposit) {
        return res.status(400).json({ error: `الحد الأدنى للإيداع هو ${minDeposit}$` });
      }

      const depositId = uuidv4();
      
      await db.transaction(async (tx) => {
        await tx.insert(deposits).values({
          id: depositId,
          userId: req.user.id,
          amount: numAmount,
          reference: ref || null,
          paymentMethod: paymentMethod || 'USDT TRC20',
          status: 'PENDING',
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        // Insert pending transaction record into ledger
        await tx.insert(transactions).values({
          id: depositId,
          userId: req.user.id,
          type: 'DEPOSIT',
          amount: numAmount,
          currency: 'USD',
          status: 'PENDING',
          description: ref ? `طلب إيداع USDT (TXID: ${ref})` : 'طلب إيداع USDT TRC20',
          createdAt: new Date(),
        });
      });

      // Dispatch Telegram notification to Admin in background
      (async () => {
        try {
          const userRec = (await db.select().from(users).where(eq(users.id, req.user.id)))[0];
          await TelegramService.notifyNewDeposit({
            username: userRec?.displayName || userRec?.username || req.user.id,
            email: userRec?.email || undefined,
            amount: numAmount,
            txid: ref || undefined,
            paymentMethod: paymentMethod || 'USDT TRC20',
            depositId,
          });
        } catch (err) {
          console.error('Error dispatching telegram deposit alert:', err);
        }
      })();
      
      return res.status(201).json({ 
        message: 'تم إرسال طلب الإيداع بنجاح وهو قيد المراجعة', 
        depositId 
      });
    } catch (error) {
      next(error);
    }
  },

  async getDeposits(req: any, res: Response, next: NextFunction) {
    try {
      const userDeposits = await db.select().from(deposits)
        .where(eq(deposits.userId, req.user.id))
        .orderBy(desc(deposits.createdAt));
      return res.json({ deposits: userDeposits });
    } catch (error) {
      next(error);
    }
  },

  // Withdrawals
  async requestWithdrawal(req: any, res: Response, next: NextFunction) {
    try {
      const { amount, address, reference, paymentMethod, pin } = req.body;
      const numAmount = Number(amount);
      const recipientAddress = address || reference || '';

      // Check min withdrawal from settings (Default 5.00$)
      let minWithdrawal = 5;
      try {
        const settingRow = (await db.select().from(systemSettings).where(eq(systemSettings.key, 'min_withdrawal')))[0];
        if (settingRow?.value) {
          minWithdrawal = parseFloat(settingRow.value) || 5;
        }
      } catch (e) {}

      if (isNaN(numAmount) || numAmount < minWithdrawal) {
        return res.status(400).json({ error: `الحد الأدنى للسحب هو ${minWithdrawal.toFixed(2)}$` });
      }

      if (!recipientAddress || recipientAddress.trim().length < 10) {
        return res.status(400).json({ error: 'يرجى إدخال عنوان محفظة USDT TRC20 صحيح' });
      }

      // Check user Transaction PIN
      const user = (await db.select().from(users).where(eq(users.id, req.user.id)))[0];
      if (!user) return res.status(404).json({ error: 'المستخدم غير موجود' });

      if (user.transactionPin) {
        if (!pin) {
          return res.status(400).json({ error: 'يرجى إدخال الرقم السري للعمليات (PIN) لتأكيد السحب' });
        }
        let isPinValid = false;
        try {
          isPinValid = await bcrypt.compare(String(pin), user.transactionPin);
        } catch (e) {
          isPinValid = false;
        }
        if (!isPinValid && String(pin) === user.transactionPin) {
          isPinValid = true;
        }
        if (!isPinValid) {
          return res.status(400).json({ error: 'الرقم السري للعمليات (PIN) غير صحيح' });
        }
      }

      const withdrawalId = uuidv4();

      await db.transaction(async (tx) => {
        const wallet = (await tx.select().from(wallets).where(eq(wallets.userId, req.user.id)))[0];
        if (!wallet) throw new Error('المحفظة غير موجودة');

        const available = Number(wallet.availableBalance) || 0;
        const pending = Number(wallet.pendingBalance) || 0;
        if (available < numAmount) {
          throw new Error('رصيد غير كافٍ');
        }

        // Deduct from available and add to pending
        await tx.update(wallets).set({
          availableBalance: available - numAmount,
          pendingBalance: pending + numAmount,
          updatedAt: new Date(),
        }).where(eq(wallets.userId, req.user.id));

        await tx.insert(withdrawals).values({
          id: withdrawalId,
          userId: req.user.id,
          amount: numAmount,
          reference: recipientAddress.trim(),
          paymentMethod: paymentMethod || 'USDT TRC20',
          status: 'PENDING',
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        // Insert pending transaction record into ledger
        await tx.insert(transactions).values({
          id: withdrawalId,
          userId: req.user.id,
          type: 'WITHDRAWAL',
          amount: numAmount,
          currency: 'USD',
          status: 'PENDING',
          description: `طلب سحب إلى محفظة: ${recipientAddress.trim()}`,
          balanceBefore: available,
          balanceAfter: available - numAmount,
          createdAt: new Date(),
        });
      });

      // Dispatch Telegram notification to Admin in background
      (async () => {
        try {
          const userRec = (await db.select().from(users).where(eq(users.id, req.user.id)))[0];
          await TelegramService.notifyNewWithdrawal({
            username: userRec?.displayName || userRec?.username || req.user.id,
            email: userRec?.email || undefined,
            amount: numAmount,
            address: recipientAddress.trim(),
            paymentMethod: paymentMethod || 'USDT TRC20',
            withdrawalId,
          });
        } catch (err) {
          console.error('Error dispatching telegram withdrawal alert:', err);
        }
      })();

      return res.status(201).json({ 
        message: 'تم إرسال طلب السحب بنجاح وتم خصمه من الرصيد المتاح بانتظار التحويل', 
        withdrawalId 
      });
    } catch (error: any) {
      if (error.message === 'رصيد غير كافٍ' || error.message.includes('الحد الأدنى')) {
        return res.status(400).json({ error: error.message });
      }
      next(error);
    }
  },

  async getWithdrawals(req: any, res: Response, next: NextFunction) {
    try {
      const userWithdrawals = await db.select().from(withdrawals)
        .where(eq(withdrawals.userId, req.user.id))
        .orderBy(desc(withdrawals.createdAt));
      return res.json({ withdrawals: userWithdrawals });
    } catch (error) {
      next(error);
    }
  }
};
