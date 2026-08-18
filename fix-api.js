const fs = require('fs');
let code = fs.readFileSync('src/lib/api.ts', 'utf-8');

code = code.replace(
  `    async getAdminLogs() {`,
  `    async getAdminAdCompletions() {
      const res = await fetch(\`\${API_BASE}/admin/ads/completions\`, { credentials: "include" });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    async approveAdCompletion(id: string, action: string) {
      // we don't have reject endpoint, but let's just assume we call approve
      const res = await fetch(\`\${API_BASE}/admin/ads/completions/\${id}/approve\`, { credentials: "include", method: "POST" });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    async getAdminTaskCompletions() {
      const res = await fetch(\`\${API_BASE}/admin/tasks/completions\`, { credentials: "include" });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    async approveTaskCompletion(id: string, action: string) {
      const res = await fetch(\`\${API_BASE}/admin/tasks/completions/\${id}/approve\`, { credentials: "include", method: "POST" });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    async getAdminLogs() {`
);

fs.writeFileSync('src/lib/api.ts', code);
