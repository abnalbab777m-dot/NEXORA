const fs = require('fs');

let routes = fs.readFileSync('server/routes.ts', 'utf-8');
routes = routes.replace(
  `router.post('/admin/users/:id/wallet-adjustment', adminController.adjustWallet);`,
  `router.post('/admin/users/:id/wallet-adjustment', adminController.adjustWallet);\nrouter.get('/admin/transactions', adminController.getTransactions);`
);
fs.writeFileSync('server/routes.ts', routes);

let adminCtrl = fs.readFileSync('server/controllers/admin.controller.ts', 'utf-8');
adminCtrl = adminCtrl.replace(
  `  async adjustWallet(req: any, res: Response, next: NextFunction) {`,
  `  async getTransactions(req: any, res: Response, next: NextFunction) {
    try {
      const allTransactions = db.select().from(transactions).orderBy(desc(transactions.createdAt)).all();
      res.json({ transactions: allTransactions });
    } catch (error) {
      next(error);
    }
  },

  async adjustWallet(req: any, res: Response, next: NextFunction) {`
);
// Import desc if needed
if (!adminCtrl.includes('desc')) {
  adminCtrl = adminCtrl.replace(`import { eq, sql } from 'drizzle-orm';`, `import { eq, sql, desc } from 'drizzle-orm';`);
}
fs.writeFileSync('server/controllers/admin.controller.ts', adminCtrl);

let api = fs.readFileSync('src/lib/api.ts', 'utf-8');
api = api.replace(
  `    async getAdminTransactions() {
      // Not implemented in backend?
      return [];
    },`,
  `    async getAdminTransactions() {
      const res = await fetch(\`\${API_BASE}/admin/transactions\`, { credentials: "include" });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },`
);
fs.writeFileSync('src/lib/api.ts', api);

