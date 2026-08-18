const fs = require('fs');
let content = fs.readFileSync('server/controllers/notification.controller.ts', 'utf-8');
content = content.replace(
  'const notification = await db.select().from(notifications)\n        .where(eq(notifications.id, id))[0];',
  'const notification = (await db.select().from(notifications).where(eq(notifications.id, id)))[0];'
);
fs.writeFileSync('server/controllers/notification.controller.ts', content);
