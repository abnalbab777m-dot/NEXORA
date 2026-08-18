const fs = require('fs');
let code = fs.readFileSync('src/lib/api.ts', 'utf-8');

code = code.replace(
  /async getAdminAdCompletions\(\) \{[\s\S]*?async approveCompletion/,
  `async getAdminCompletions(type: 'AD' | 'TASK') {
      const endpoint = type === 'AD' ? 'ad-completions' : 'task-completions';
      const res = await fetch(\`\${API_BASE}/admin/\${endpoint}\`, { credentials: "include" });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    async approveCompletion`
).replace(
  /async getAdminTaskCompletions\(\) \{[\s\S]*?async getAdminLogs\(\) \{/,
  `async getAdminLogs() {`
);

fs.writeFileSync('src/lib/api.ts', code);
