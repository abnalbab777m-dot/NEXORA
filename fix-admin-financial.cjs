const fs = require('fs');
let content = fs.readFileSync('server/controllers/admin.controller.ts', 'utf-8');
content = content.replace(
  'const allDeposits = await db.select().from(deposits).orderBy(desc(deposits.createdAt));',
  'const allDeposits = await db.select().from(deposits).orderBy(desc(deposits.createdAt)).execute();'
);
content = content.replace(
  'const allWithdrawals = await db.select().from(withdrawals).orderBy(desc(withdrawals.createdAt));',
  'const allWithdrawals = await db.select().from(withdrawals).orderBy(desc(withdrawals.createdAt)).execute();'
);
fs.writeFileSync('server/controllers/admin.controller.ts', content);
