const fs = require('fs');
let code = fs.readFileSync('src/lib/api.ts', 'utf-8');

code = code.replace(
  `{ credentials: "include", method: "POST" }`,
  `{ credentials: "include", method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action }) }`
);

fs.writeFileSync('src/lib/api.ts', code);
