import re

content = open("server/controllers/auth.controller.ts").read()
# Replace cookie options for login, register and logout
old_opts = """{
        httpOnly: true,
        secure: req.secure,
        sameSite: req.secure ? 'none' : 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      }"""
new_opts = """{
        httpOnly: true,
        secure: req.secure,
        sameSite: req.secure ? 'none' : 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
        partitioned: true
      } as any"""
content = content.replace(old_opts, new_opts)

old_opts_reg = """{
        httpOnly: true,
        secure: req.secure,
        sameSite: req.secure ? 'none' : 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      }"""
new_opts_reg = """{
        httpOnly: true,
        secure: req.secure,
        sameSite: req.secure ? 'none' : 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        partitioned: true
      } as any"""
content = content.replace(old_opts_reg, new_opts_reg)

old_opts_out = """{
      httpOnly: true,
      secure: req.secure,
      sameSite: req.secure ? 'none' : 'lax',
    }"""
new_opts_out = """{
      httpOnly: true,
      secure: req.secure,
      sameSite: req.secure ? 'none' : 'lax',
      partitioned: true
    } as any"""
content = content.replace(old_opts_out, new_opts_out)

open("server/controllers/auth.controller.ts", "w").write(content)
