import re

content = open("src/lib/api.ts").read()
# Find all occurrences of: if (!res.ok) throw new Error(await res.text());
# Replace with a safer error throw
safe_error = """if (!res.ok) {
      const text = await res.text();
      let msg = text;
      try { msg = JSON.parse(text).error || text; } catch (e) {}
      throw new Error(msg);
    }"""
content = re.sub(r'if \(!res\.ok\) throw new Error\(await res\.text\(\)\);', safe_error, content)

open("src/lib/api.ts", "w").write(content)
