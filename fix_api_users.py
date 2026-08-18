import re
content = open("src/lib/api.ts").read()
new_user_methods = """
    async updateUserStatus(userId: string, status: string) {
      const res = await fetch(`${API_BASE}/admin/users/${userId}/status`, { credentials: "include", method: "PATCH", headers: {"Content-Type": "application/json"}, body: JSON.stringify({status}) });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
"""
content = content.replace("async getAdminLogs() {", new_user_methods + "\n    async getAdminLogs() {")
open("src/lib/api.ts", "w").write(content)
