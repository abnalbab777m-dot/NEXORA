const fs = require('fs');

let schema = fs.readFileSync('src/db/schema.ts', 'utf-8');
schema = schema.replace(
  /createdAt: integer\("created_at", \{ mode: 'timestamp' \}\)\.notNull\(\)/g,
  `createdAt: integer("created_at", { mode: 'timestamp' }).$defaultFn(() => new Date()).notNull()`
).replace(
  /updatedAt: integer\("updated_at", \{ mode: 'timestamp' \}\)\.notNull\(\)/g,
  `updatedAt: integer("updated_at", { mode: 'timestamp' }).$defaultFn(() => new Date()).$onUpdateFn(() => new Date()).notNull()`
).replace(
  /completedAt: integer\("completed_at", \{ mode: 'timestamp' \}\)\.notNull\(\)/g,
  `completedAt: integer("completed_at", { mode: 'timestamp' }).$defaultFn(() => new Date()).notNull()`
);

fs.writeFileSync('src/db/schema.ts', schema);

