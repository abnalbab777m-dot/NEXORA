const fs = require('fs');
let index = fs.readFileSync('src/db/index.ts', 'utf-8');
index = "import 'dotenv/config';\n" + index;
fs.writeFileSync('src/db/index.ts', index);
