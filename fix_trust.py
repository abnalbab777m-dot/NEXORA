import re
content = open("server.ts").read()
content = content.replace("app.set('trust proxy', 1);", "app.set('trust proxy', true);")
open("server.ts", "w").write(content)
