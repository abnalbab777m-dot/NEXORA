const fs = require('fs');
const path = require('path');

function replaceFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');
  let original = content;

  // We need to replace `await something[0];` or `await db.select()...[0];`
  // Actually the previous script did `await tx.select().from(...).where(...)[0]`
  // We want `(await tx.select().from(...).where(...))[0]`
  content = content.replace(/(await\s+(?:db|tx)\.select\(\)\.from\([^)]+\)(?:\.where\([^)]+\))?)\[0\]/g, '($1)[0]');
  
  if (content !== original) {
    fs.writeFileSync(filePath, content);
    console.log('Fixed [0]', filePath);
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
