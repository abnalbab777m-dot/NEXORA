import re
content = open("src/pages/auth/LoginPage.tsx").read()
content = content.replace("await refreshUser();\n      navigate('/dashboard');", "await refreshUser();")
open("src/pages/auth/LoginPage.tsx", "w").write(content)
