import { db } from '../../src/db/index.ts';
import { deposits, withdrawals, transactions, systemSettings, paymentMethods } from '../../src/db/schema.ts';
import { eq, and, desc, sql } from 'drizzle-orm';

export async function runDatabaseCleanup() {
  try {
    console.log('[DB Cleanup] Starting automatic transaction synchronization & cleanup...');

    // 0. Ensure min_withdrawal in system_settings is updated to 5.00
    try {
      const minWithSetting = (await db.select().from(systemSettings).where(eq(systemSettings.key, 'min_withdrawal')))[0];
      if (minWithSetting && (minWithSetting.value === '10' || minWithSetting.value === '10.00' || minWithSetting.value === '10.0')) {
        await db.update(systemSettings).set({ value: '5.00', updatedAt: new Date() }).where(eq(systemSettings.key, 'min_withdrawal'));
        console.log('[DB Cleanup] Updated system min_withdrawal to 5.00$');
      }
    } catch (e) {}

    // 0.1 Ensure payment methods with minLimit 10 are adjusted to 5
    try {
      const allPms = await db.select().from(paymentMethods);
      for (const pm of allPms) {
        if (Number(pm.minLimit) === 10) {
          await db.update(paymentMethods).set({ minLimit: 5, updatedAt: new Date() }).where(eq(paymentMethods.id, pm.id));
          console.log(`[DB Cleanup] Updated payment method ${pm.name} minLimit to 5$`);
        }
      }
    } catch (e) {}

    // 1. Fetch all deposits, withdrawals, and transactions
    const allDeposits = await db.select().from(deposits);
    const allWithdrawals = await db.select().from(withdrawals);
    const allTransactions = await db.select().from(transactions);

    let fixedCount = 0;
    let dedupCount = 0;

    // 2. Reconcile Rejected Deposits with Pending Transactions
    for (const dep of allDeposits) {
      const depStatus = String(dep.status || '').toUpperCase();
      const numAmount = Number(dep.amount) || 0;

      if (depStatus === 'REJECTED' || depStatus === 'CANCELLED') {
        // Find any transaction row that remained PENDING for this deposit
        const pendingTxs = allTransactions.filter(t => 
          (t.id === dep.id && t.status === 'PENDING') ||
          (t.userId === dep.userId && t.type === 'DEPOSIT' && Math.abs(Number(t.amount) - numAmount) < 0.001 && t.status === 'PENDING')
        );

        for (const pTx of pendingTxs) {
          await db.update(transactions)
            .set({ 
              status: 'REJECTED',
              processedAt: new Date()
            })
            .where(eq(transactions.id, pTx.id));
          fixedCount++;
        }
      } else if (depStatus === 'APPROVED' || depStatus === 'COMPLETED') {
        // Find any transaction row that remained PENDING for this approved deposit
        const pendingTxs = allTransactions.filter(t => 
          (t.id === dep.id && t.status === 'PENDING') ||
          (t.userId === dep.userId && t.type === 'DEPOSIT' && Math.abs(Number(t.amount) - numAmount) < 0.001 && t.status === 'PENDING')
        );

        for (const pTx of pendingTxs) {
          await db.update(transactions)
            .set({ 
              status: 'COMPLETED',
              processedAt: new Date()
            })
            .where(eq(transactions.id, pTx.id));
          fixedCount++;
        }
      }
    }

    // 3. Reconcile Rejected / Approved Withdrawals with Pending Transactions
    for (const w of allWithdrawals) {
      const wStatus = String(w.status || '').toUpperCase();
      const numAmount = Number(w.amount) || 0;

      if (wStatus === 'REJECTED' || wStatus === 'CANCELLED') {
        const pendingTxs = allTransactions.filter(t => 
          (t.id === w.id && t.status === 'PENDING') ||
          (t.userId === w.userId && t.type === 'WITHDRAWAL' && Math.abs(Number(t.amount) - numAmount) < 0.001 && t.status === 'PENDING')
        );

        for (const pTx of pendingTxs) {
          await db.update(transactions)
            .set({ 
              status: 'REJECTED',
              processedAt: new Date()
            })
            .where(eq(transactions.id, pTx.id));
          fixedCount++;
        }
      } else if (wStatus === 'APPROVED' || wStatus === 'COMPLETED') {
        const pendingTxs = allTransactions.filter(t => 
          (t.id === w.id && t.status === 'PENDING') ||
          (t.userId === w.userId && t.type === 'WITHDRAWAL' && Math.abs(Number(t.amount) - numAmount) < 0.001 && t.status === 'PENDING')
        );

        for (const pTx of pendingTxs) {
          await db.update(transactions)
            .set({ 
              status: 'COMPLETED',
              processedAt: new Date()
            })
            .where(eq(transactions.id, pTx.id));
          fixedCount++;
        }
      }
    }

    // 4. Remove duplicate pending transactions if a completed/rejected one exists for the same user and deposit reference
    const latestTxs = await db.select().from(transactions).orderBy(desc(transactions.createdAt));
    const seenMap = new Set<string>();

    for (const tx of latestTxs) {
      // Key based on userId, type, rounded amount, and minute of creation
      const createdMin = new Date(tx.createdAt).toISOString().substring(0, 16);
      const key = `${tx.userId}_${tx.type}_${Number(tx.amount).toFixed(2)}_${createdMin}`;

      if (seenMap.has(key)) {
        // If this duplicate is PENDING while another was already recorded, clean it up
        if (tx.status === 'PENDING') {
          await db.delete(transactions).where(eq(transactions.id, tx.id));
          dedupCount++;
        }
      } else {
        seenMap.add(key);
      }
    }

    console.log(`[DB Cleanup] Completed successfully. Reconciled: ${fixedCount} transactions, Deduplicated: ${dedupCount} stale rows.`);
  } catch (error) {
    console.error('[DB Cleanup] Error running transaction synchronization:', error);
  }
}
