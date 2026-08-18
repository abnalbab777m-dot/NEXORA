import re

content = open("src/lib/api.ts").read()

# Replace all fetch(..., { with fetch(..., { credentials: 'include',
content = re.sub(r'fetch\((.*?),\s*\{', r'fetch(\1, {\n      credentials: "include",', content)

# For fetch calls that don't have a second argument, add it
content = re.sub(r'fetch\(([^,]+?)\)(?!\s*\{)', r'fetch(\1, { credentials: "include" })', content)

open("src/lib/api.ts", "w").write(content)
