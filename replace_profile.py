import re

content = open("src/pages/dashboard/ProfilePage.tsx").read()
content = re.sub(r"import \{.*?\} from 'firebase/firestore';\n", "", content)
content = re.sub(r"import \{ db \} from '../../lib/firebase';\n", "", content)
content = re.sub(r"import \{ useAuth \} from '../../context/AuthContext';", "import { useAuth } from '../../context/AuthContext';\nimport { api } from '../../lib/api';", content)

handle_save_new = """  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setSaving(true);
    try {
      await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ displayName: name })
      });
      alert('تم حفظ التغييرات بنجاح');
    } catch (err) {
      alert('حدث خطأ أثناء الحفظ');
    } finally {
      setSaving(false);
    }
  };"""
content = re.sub(r"  const handleSaveProfile = async \(e: React.FormEvent\) => \{.*?\n  \};", handle_save_new, content, flags=re.DOTALL)
content = content.replace("profile?.name", "profile?.displayName")
content = content.replace("profile?.email", "profile?.email")

open("src/pages/dashboard/ProfilePage.tsx", "w").write(content)
