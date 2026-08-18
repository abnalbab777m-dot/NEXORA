import re

content = open("src/pages/admin/AdminUsers.tsx").read()
content = re.sub(r"import \{.*?\} from 'firebase/firestore';\n", "", content)
content = re.sub(r"import \{ db \} from '../../lib/firebase';\n", "", content)
content = content.replace("import { formatCurrency, cn } from '../../lib/utils';", "import { formatCurrency, cn } from '../../lib/utils';\nimport { api } from '../../lib/api';")

fetch_users_new = """  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await api.admin.getUsers();
      setUsers(data.users || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };"""
content = re.sub(r"  const fetchUsers = async \(\) => \{.*?\n  \};", fetch_users_new, content, flags=re.DOTALL)

toggle_status_new = """  const toggleUserStatus = async (userId: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'ACTIVE' ? 'BANNED' : 'ACTIVE';
      await fetch(`/api/admin/users/${userId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      fetchUsers();
    } catch (err) {
      alert('خطأ أثناء تغيير حالة المستخدم');
    }
  };"""
content = re.sub(r"  const toggleUserStatus = async \(userId: string, currentStatus: string\) => \{.*?\n  \};", toggle_status_new, content, flags=re.DOTALL)

open("src/pages/admin/AdminUsers.tsx", "w").write(content)
