const fs = require('fs');
let code = fs.readFileSync('src/lib/api.ts', 'utf-8');

code = code.replace('/admin/ads/completions', '/admin/ad-completions');
code = code.replace('/admin/tasks/completions', '/admin/task-completions');
code = code.replace('/admin/${endpoint}/completions/${id}/approve', '/admin/${type === "AD" ? "ad-completions" : "task-completions"}/${id}/approve');

fs.writeFileSync('src/lib/api.ts', code);
