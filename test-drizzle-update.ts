import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
const testTable = sqliteTable('test', {
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()).$onUpdateFn(() => new Date()),
});
console.log('Success update');
