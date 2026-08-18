import { db } from '../../src/db/index.ts';
import { wallets, transactions } from '../../src/db/schema.ts';
import { eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

export class WalletService {
  static async processTransactionWithTx(
    tx: any,
    userId: string,
    amount: number,
    type: "DEPOSIT" | "WITHDRAWAL" | "TASK_REWARD" | "AD_REWARD" | "VIP_UPGRADE",
    status: "PENDING" | "APPROVED" | "REJECTED" | "COMPLETED" | "CANCELLED",
    description?: string,
    adminId?: string
  ) {
      // 1. Get the wallet row for this user
      let wallet = (await tx.select().from(wallets).where(eq(wallets.userId, userId)))[0];
      
      if (!wallet) {
        // Auto-create wallet if missing for user
        await tx.insert(wallets).values({
          userId: userId,
          availableBalance: 0,
          pendingBalance: 0,
          totalEarnings: 0,
          totalDeposits: 0,
          totalWithdrawals: 0,
        });
        wallet = (await tx.select().from(wallets).where(eq(wallets.userId, userId)))[0] || {
          userId,
          availableBalance: 0,
          pendingBalance: 0,
          totalEarnings: 0,
          totalDeposits: 0,
          totalWithdrawals: 0,
        };
      }
      
      const currentAvailable = Number(wallet.availableBalance) || 0;
      const currentPending = Number(wallet.pendingBalance) || 0;
      let newAvailable = currentAvailable;
      let newPending = currentPending;
      let newEarnings = Number(wallet.totalEarnings) || 0;
      let newDeposits = Number(wallet.totalDeposits) || 0;
      let newWithdrawals = Number(wallet.totalWithdrawals) || 0;
      const txId = uuidv4();

      // 2. Apply logic based on transaction type and status
      if (type === 'WITHDRAWAL') {
        if (status === 'PENDING') {
          if (currentAvailable < amount) throw new Error('Insufficient funds');
          newAvailable -= amount;
          newPending += amount;
        } else if (status === 'APPROVED' || status === 'COMPLETED') {
          newPending -= amount;
          newWithdrawals += amount;
        } else if (status === 'REJECTED' || status === 'CANCELLED') {
          newPending -= amount;
          newAvailable += amount;
        }
      } else if (type === 'DEPOSIT') {
        if (status === 'APPROVED' || status === 'COMPLETED') {
          newAvailable += amount;
          newDeposits += amount;
        }
      } else if (type === 'TASK_REWARD' || type === 'AD_REWARD') {
        if (status === 'COMPLETED' || status === 'APPROVED') {
          newAvailable += amount;
          newEarnings += amount;
        }
      } else if (type === 'VIP_UPGRADE') {
         if (status === 'COMPLETED' || status === 'APPROVED') {
             if (currentAvailable < amount) throw new Error('Insufficient funds for VIP upgrade');
             newAvailable -= amount;
         }
      }

      // Safe rounding to avoid float drift
      newAvailable = Math.round(newAvailable * 10000) / 10000;
      newPending = Math.round(newPending * 10000) / 10000;
      newEarnings = Math.round(newEarnings * 10000) / 10000;
      newDeposits = Math.round(newDeposits * 10000) / 10000;
      newWithdrawals = Math.round(newWithdrawals * 10000) / 10000;

      // 3. Update the wallet
      await tx.update(wallets).set({
        availableBalance: newAvailable,
        pendingBalance: newPending,
        totalEarnings: newEarnings,
        totalDeposits: newDeposits,
        totalWithdrawals: newWithdrawals,
        updatedAt: new Date(),
      }).where(eq(wallets.userId, userId));

      // 4. Create Ledger Record
      await tx.insert(transactions).values({
        id: txId,
        userId: userId,
        type: type as any,
        amount: amount,
        status: status as any,
        description: description || null,
        balanceBefore: currentAvailable,
        balanceAfter: newAvailable,
        processedBy: adminId || null,
        processedAt: (status === 'APPROVED' || status === 'COMPLETED' || status === 'REJECTED') ? new Date() : null,
      });

      return { txId, newAvailable, newEarnings };
  }

  static async processTransaction(
    userId: string,
    amount: number,
    type: "DEPOSIT" | "WITHDRAWAL" | "TASK_REWARD" | "AD_REWARD" | "VIP_UPGRADE",
    status: "PENDING" | "APPROVED" | "REJECTED" | "COMPLETED" | "CANCELLED",
    description?: string,
    adminId?: string
  ) {
    return await db.transaction(async (tx) => {
       return await this.processTransactionWithTx(tx, userId, amount, type, status, description, adminId);
    });
  }
}

