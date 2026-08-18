import re
content = open("server/controllers/auth.controller.ts").read()
old = "res.clearCookie('token');"
new = """res.clearCookie('token', {
      httpOnly: true,
      secure: req.secure,
      sameSite: req.secure ? 'none' : 'lax',
    });"""
content = content.replace(old, new)
open("server/controllers/auth.controller.ts", "w").write(content)
