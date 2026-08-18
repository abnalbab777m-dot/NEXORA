import re

content = open("server/controllers/vip.controller.ts").read()

updates_vip = """      // Atomically process payment
      await WalletService.processTransaction(
        req.user.id,
        parseFloat(plan.price as string),
        'VIP_UPGRADE',
        'COMPLETED',
        `ترقية إلى باقة ${plan.name}`
      );

      // Now we would typically update the user's VIP level and expiration
      await db.update(users).set({ vipLevel: plan.level }).where(eq(users.id, req.user.id));

      return res.json({ message: `تمت الترقية إلى ${plan.name} بنجاح` });"""

content = re.sub(r"      // Atomically process payment.*?return res\.json", updates_vip, content, flags=re.DOTALL)
content = "import { users } from '../../src/db/schema.ts';\n" + content
open("server/controllers/vip.controller.ts", "w").write(content)
