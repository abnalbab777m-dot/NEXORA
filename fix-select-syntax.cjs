const fs = require('fs');

function fix(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');
  content = content.replace(/await\s+(db|tx)\.select\(\{([\s\S]*?)\}\)\.from\(([^)]+)\)\.where\(([^)]+\))\)\[0\]/g, '(await $1.select({$2}).from($3).where($4))[0]');
  fs.writeFileSync(filePath, content);
}

fix('server/controllers/auth.controller.ts');
fix('server/controllers/user.controller.ts');
fix('server/controllers/notification.controller.ts');
