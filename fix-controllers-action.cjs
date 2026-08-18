const fs = require('fs');

function updateController(path, entityName, type) {
  let code = fs.readFileSync(path, 'utf-8');
  code = code.replace(
    /      const \{ id \} = req\.params;\n      db\.transaction\(\(tx\) => \{/,
    `      const { id } = req.params;
      const { action } = req.body;
      db.transaction((tx) => {`
  ).replace(
    /        WalletService\.processTransactionWithTx\([\s\S]*?        \);\n        tx\.update/,
    `        if (action !== 'REJECT') {
          WalletService.processTransactionWithTx(
            tx,
            completion.userId,
            parseFloat(completion.reward as string),
            '${type}_REWARD',
            'COMPLETED',
            \`مكافأة ${entityName} \${completion.${type === 'AD' ? 'adId' : 'taskId'}}\`,
            req.user.id
          );
        }
        tx.update`
  ).replace(
    `status: 'COMPLETED',`,
    `status: action === 'REJECT' ? 'REJECTED' : 'COMPLETED',`
  ).replace(
    /action: 'APPROVE_${type}_COMPLETION',[\s\S]*?details: \`Approved [\s\S]*?\`,/,
    `action: action === 'REJECT' ? 'REJECT_${type}_COMPLETION' : 'APPROVE_${type}_COMPLETION',
          details: \`\${action === 'REJECT' ? 'Rejected' : 'Approved'} ${entityName.toLowerCase()} completion \${id}\`,`
  );
  fs.writeFileSync(path, code);
}

updateController('server/controllers/ad.controller.ts', 'الإعلان', 'AD');
updateController('server/controllers/task.controller.ts', 'المهمة', 'TASK');
