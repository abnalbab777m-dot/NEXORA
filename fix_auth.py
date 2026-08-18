import re
content = open("server/controllers/auth.controller.ts").read()

duplicate_check_old = """      // Check uniqueness
      const existingUser = await db.select().from(users).where(
        or(eq(users.username, username), eq(users.email, email))
      );"""

duplicate_check_new = """      // Check uniqueness
      let uniqueCheck;
      if (phone) {
          uniqueCheck = or(eq(users.username, username), eq(users.email, email), eq(users.phone, phone));
      } else {
          uniqueCheck = or(eq(users.username, username), eq(users.email, email));
      }
      
      const existingUser = await db.select().from(users).where(uniqueCheck);"""

content = content.replace(duplicate_check_old, duplicate_check_new)
open("server/controllers/auth.controller.ts", "w").write(content)
