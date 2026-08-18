import re
content = open("server/middlewares/validate.middleware.ts").read()
content = content.replace("error.errors.map", "(error.issues || error.errors || []).map")
open("server/middlewares/validate.middleware.ts", "w").write(content)
