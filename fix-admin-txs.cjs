const fs = require('fs');

// 1. Update routes
let routes = fs.readFileSync('server/routes.ts', 'utf-8');
routes = routes.replace(
  `router.get('/admin/transactions', adminController.getTransactions);`,
  `router.get('/admin/financial-requests', adminController.getFinancialRequests);`
);
fs.writeFileSync('server/routes.ts', routes);

// 2. Update admin controller
let adminCtrl = fs.readFileSync('server/controllers/admin.controller.ts', 'utf-8');
adminCtrl = adminCtrl.replace(
  `  async getTransactions(req: any, res: Response, next: NextFunction) {
    try {
      const allTransactions = db.select().from(transactions).orderBy(desc(transactions.createdAt)).all();
      res.json({ transactions: allTransactions });
    } catch (error) {
      next(error);
    }
  },`,
  `  async getFinancialRequests(req: any, res: Response, next: NextFunction) {
    try {
      const allDeposits = db.select().from(deposits).orderBy(desc(deposits.createdAt)).all();
      const allWithdrawals = db.select().from(withdrawals).orderBy(desc(withdrawals.createdAt)).all();
      res.json({ deposits: allDeposits, withdrawals: allWithdrawals });
    } catch (error) {
      next(error);
    }
  },`
);
fs.writeFileSync('server/controllers/admin.controller.ts', adminCtrl);

// 3. Update api.ts
let api = fs.readFileSync('src/lib/api.ts', 'utf-8');
api = api.replace(
  `    async getAdminTransactions() {
      const res = await fetch(\`\${API_BASE}/admin/transactions\`, { credentials: "include" });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },`,
  `    async getFinancialRequests() {
      const res = await fetch(\`\${API_BASE}/admin/financial-requests\`, { credentials: "include" });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },`
);
fs.writeFileSync('src/lib/api.ts', api);

