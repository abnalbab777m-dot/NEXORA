const fs = require('fs');
let content = fs.readFileSync('server/controllers/admin.controller.ts', 'utf-8');
content = content.replace('const allDeposits = db.select()', 'const allDeposits = await db.select()');
content = content.replace('const allWithdrawals = db.select()', 'const allWithdrawals = await db.select()');
fs.writeFileSync('server/controllers/admin.controller.ts', content);
