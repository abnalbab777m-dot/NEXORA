import re
# server.ts
content = open("server.ts").read()
content = content.replace("process.env.SESSION_SECRET as string", "process.env.SESSION_SECRET || 'dev_session_secret_fallback_1234567890'")
open("server.ts", "w").write(content)

# auth.controller.ts
auth_content = open("server/controllers/auth.controller.ts").read()
auth_content = auth_content.replace("process.env.JWT_SECRET as string", "process.env.JWT_SECRET || 'dev_jwt_secret_fallback_1234567890'")
open("server/controllers/auth.controller.ts", "w").write(auth_content)

# user.controller.ts or any other ?
