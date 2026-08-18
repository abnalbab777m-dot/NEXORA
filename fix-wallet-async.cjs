const fs = require('fs');

let walletSvc = fs.readFileSync('server/services/wallet.service.ts', 'utf-8');
walletSvc = walletSvc.replace('static processTransactionWithTx(', 'static async processTransactionWithTx(');
walletSvc = walletSvc.replace('static processTransaction(', 'static async processTransaction(');
walletSvc = walletSvc.replace('return this.processTransactionWithTx', 'return await this.processTransactionWithTx');
fs.writeFileSync('server/services/wallet.service.ts', walletSvc);
