import re
content = open("server/controllers/auth.controller.ts").read()
content = content.replace("sameSite: 'strict',", "sameSite: req.secure ? 'none' : 'lax',")
open("server/controllers/auth.controller.ts", "w").write(content)
