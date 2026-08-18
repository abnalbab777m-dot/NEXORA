const fs = require('fs');
const path = require('path');

function replaceFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');
  let original = content;

  // Replace .all() -> nothing (it already awaits)
  content = content.replace(/\.all\(\)/g, '');

  // Replace .get() -> [0]
  content = content.replace(/\.get\(\)/g, '[0]');

  // Replace .run() -> nothing (it already awaits)
  content = content.replace(/\.run\(\)/g, '');

  // Replace db.transaction((tx) => { ... }) to db.transaction(async (tx) => { ... })
  content = content.replace(/db\.transaction\(\(tx\)\s*=>\s*\{/g, 'await db.transaction(async (tx) => {');

  // Any tx.update, tx.insert, tx.select needs await if missing
  // This is tricky because we might have tx.update(...) without await.
  // We'll replace tx.update, tx.insert, tx.select with await tx.update, etc.
  content = content.replace(/(\s)(tx\.insert|tx\.update|tx\.select)/g, (match, space, txMethod) => {
    return space + 'await ' + txMethod;
  });
  content = content.replace(/await await/g, 'await'); // cleanup double awaits

  // WalletService.processTransactionWithTx is sync in sqlite. Let's make it async.
  // In files calling WalletService.processTransactionWithTx, add await
  content = content.replace(/WalletService\.processTransactionWithTx/g, 'await WalletService.processTransactionWithTx');
  content = content.replace(/await await WalletService/g, 'await WalletService');

  if (content !== original) {
    fs.writeFileSync(filePath, content);
    console.log('Fixed', filePath);
  }
}

function walk(dir) {
  fs.readdirSync(dir).forEach(file => {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walk(fullPath);
    } else if (fullPath.endsWith('.ts')) {
      replaceFile(fullPath);
    }
  });
}

walk('server/controllers');
walk('server/services');
