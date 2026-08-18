const fs = require('fs');
let code = fs.readFileSync('server/services/wallet.service.ts', 'utf-8');

code = code.replace(
  `      // 1. Lock the wallet row for this user
      const result = tx.execute(
        sql\`SELECT available_balance, pending_balance, total_earnings, total_deposits, total_withdrawals 
            FROM wallets WHERE user_id = \${userId} \`
      );
      
      if (result.rows.length === 0) {
        throw new Error('Wallet not found for user');
      }
      
      const wallet = result.rows[0] as any;`,
  `      // 1. Get the wallet row for this user
      const wallet = tx.select().from(wallets).where(eq(wallets.userId, userId)).get();
      
      if (!wallet) {
        throw new Error('Wallet not found for user');
      }`
).replace(
  `      const currentAvailable = parseFloat(wallet.available_balance);`,
  `      const currentAvailable = parseFloat(wallet.availableBalance);`
).replace(
  `      const currentPending = parseFloat(wallet.pending_balance);`,
  `      const currentPending = parseFloat(wallet.pendingBalance);`
).replace(
  `      let newEarnings = parseFloat(wallet.total_earnings);`,
  `      let newEarnings = parseFloat(wallet.totalEarnings);`
).replace(
  `      let newDeposits = parseFloat(wallet.total_deposits);`,
  `      let newDeposits = parseFloat(wallet.totalDeposits);`
).replace(
  `      let newWithdrawals = parseFloat(wallet.total_withdrawals);`,
  `      let newWithdrawals = parseFloat(wallet.totalWithdrawals);`
);

fs.writeFileSync('server/services/wallet.service.ts', code);
