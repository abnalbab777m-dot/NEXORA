import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
const testTable = sqliteTable('test', {
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});
console.log('Success');
