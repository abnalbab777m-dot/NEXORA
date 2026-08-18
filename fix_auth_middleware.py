import re
content = open("server/middlewares/auth.middleware.ts").read()
content = content.replace("process.env.JWT_SECRET as string", "process.env.JWT_SECRET || 'dev_jwt_secret_fallback_1234567890'")
open("server/middlewares/auth.middleware.ts", "w").write(content)
