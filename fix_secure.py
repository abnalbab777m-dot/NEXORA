import re
content = open("server/controllers/auth.controller.ts").read()
content = content.replace("secure: process.env.NODE_ENV === 'production'", "secure: req.secure")
open("server/controllers/auth.controller.ts", "w").write(content)
