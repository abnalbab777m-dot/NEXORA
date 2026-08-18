const fs = require('fs');
let schema = fs.readFileSync('src/db/schema.ts', 'utf-8');

schema = schema.replace(/import \{ sqliteTable, text, integer, real \} from "drizzle-orm\/sqlite-core";/, `import { pgTable, text, integer, real, boolean, timestamp } from "drizzle-orm/pg-core";`);

schema = schema.replace(/sqliteTable\(/g, `pgTable(`);

schema = schema.replace(/integer\("created_at", \{ mode: 'timestamp' \}\)/g, `timestamp("created_at")`);
schema = schema.replace(/integer\("updated_at", \{ mode: 'timestamp' \}\)/g, `timestamp("updated_at")`);
schema = schema.replace(/integer\("completed_at", \{ mode: 'timestamp' \}\)/g, `timestamp("completed_at")`);
schema = schema.replace(/integer\("processed_at", \{ mode: 'timestamp' \}\)/g, `timestamp("processed_at")`);
schema = schema.replace(/integer\("read", \{ mode: "boolean" \}\)/g, `boolean("read")`);

fs.writeFileSync('src/db/schema.ts', schema);
