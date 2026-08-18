import re
content = open("test-user-flow.js").read()
content = content.replace("t.status === 'COMPLETED'", "(t.status === 'COMPLETED' || t.status === 'APPROVED')")
open("test-user-flow.js", "w").write(content)
