import re

content = open("src/layouts/DashboardLayout.tsx").read()
content = re.sub(r"import \{.*?\} from 'firebase/firestore';\n", "", content)
content = re.sub(r"import \{ db \} from '../lib/firebase';\n", "", content)
content = re.sub(r"import \{ useAuth \} from '../context/AuthContext';", "import { useAuth } from '../context/AuthContext';\nimport { api } from '../lib/api';", content)

use_effect_new = """  const fetchNotifs = async () => {
    if (!profile) return;
    try {
      const data = await api.getNotifications();
      setNotifications(data.notifications || []);
    } catch(err) {}
  };

  useEffect(() => {
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 15000);
    return () => clearInterval(interval);
  }, [profile]);"""
content = re.sub(r"  useEffect\(\(\) => \{.*?\}, \[profile\]\);", use_effect_new, content, flags=re.DOTALL)

mark_read_new = """  const markAsRead = async (notifId: string) => {
    try {
      await api.markNotificationRead(notifId);
      setNotifications(prev => prev.map(n => n.id === notifId ? { ...n, read: true } : n));
    } catch (err) {
      console.error(err);
    }
  };"""
content = re.sub(r"  const markAsRead = async \(notifId: string\) => \{.*?\n  \};", mark_read_new, content, flags=re.DOTALL)
content = content.replace("notif.notificationId", "notif.id")

open("src/layouts/DashboardLayout.tsx", "w").write(content)
