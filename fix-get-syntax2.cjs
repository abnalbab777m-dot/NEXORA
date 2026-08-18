const fs = require('fs');
const path = require('path');

function replaceFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');
  let original = content;

  // Replace `await db.select().from(X).where(Y)[0]` 
  // We can just use a simple string replacement because the structure is mostly standard.
  content = content.replace(/await\s+(db|tx)\.select\(\)\.from\(([^)]+)\)\.where\((.+?)\)\[0\]/g, '(await $1.select().from($2).where($3))[0]');
  
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
