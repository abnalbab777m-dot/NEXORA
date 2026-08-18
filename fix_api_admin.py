import re
content = open("src/lib/api.ts").read()

new_admin_methods = """
    async getAdminAds() {
      const res = await fetch(`${API_BASE}/admin/ads`, { credentials: "include" });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    async createAd(data: any) {
      const res = await fetch(`${API_BASE}/admin/ads`, { credentials: "include", method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify(data) });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    async updateAd(id: string, data: any) {
      const res = await fetch(`${API_BASE}/admin/ads/${id}`, { credentials: "include", method: "PATCH", headers: {"Content-Type": "application/json"}, body: JSON.stringify(data) });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    async getAdminTasks() {
      const res = await fetch(`${API_BASE}/admin/tasks`, { credentials: "include" });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    async createTask(data: any) {
      const res = await fetch(`${API_BASE}/admin/tasks`, { credentials: "include", method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify(data) });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    async updateTask(id: string, data: any) {
      const res = await fetch(`${API_BASE}/admin/tasks/${id}`, { credentials: "include", method: "PATCH", headers: {"Content-Type": "application/json"}, body: JSON.stringify(data) });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    async createVipPlan(data: any) {
      const res = await fetch(`${API_BASE}/admin/vip`, { credentials: "include", method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify(data) });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    async updateVipPlan(id: string, data: any) {
      const res = await fetch(`${API_BASE}/admin/vip/${id}`, { credentials: "include", method: "PATCH", headers: {"Content-Type": "application/json"}, body: JSON.stringify(data) });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    async getAdminTransactions() {
      // Not implemented in backend?
      return [];
    },
"""

content = content.replace("async getAdminLogs() {", new_admin_methods + "\n    async getAdminLogs() {")
open("src/lib/api.ts", "w").write(content)
