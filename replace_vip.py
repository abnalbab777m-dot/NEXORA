import re

content = open("src/pages/dashboard/VIPPage.tsx").read()
content = re.sub(r"import \{.*?\} from 'firebase/firestore';\n", "", content)
content = re.sub(r"import \{ db \} from '../../lib/firebase';\n", "", content)
content = re.sub(r"import \{ useAuth \} from '../../context/AuthContext';", "import { useAuth } from '../../context/AuthContext';\nimport { api } from '../../lib/api';", content)

fetch_vip_new = """  const fetchPlans = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getVipPlans();
      setPlans(data.plans || []);
    } catch (err: any) {
      console.error('Error fetching VIP plans', err);
      setError('حدث خطأ أثناء جلب باقات VIP.');
    } finally {
      setLoading(false);
    }
  };"""
content = re.sub(r"  const fetchPlans = async \(\) => \{.*?\n  \};", fetch_vip_new, content, flags=re.DOTALL)

handle_subscribe_new = """  const handleSubscribe = async (plan: VipPlan) => {
    if (!profile) return;
    setSubscribingId(plan.planId || plan.id);
    
    try {
      await api.subscribeVip(plan.planId || plan.id);
      await refreshUser();
      alert('تم الاشتراك في باقة VIP بنجاح!');
    } catch (error: any) {
      console.error('Error subscribing to VIP', error);
      alert(error.message || 'حدث خطأ أثناء الاشتراك. تأكد من وجود رصيد كافٍ.');
    } finally {
      setSubscribingId(null);
    }
  };"""
content = re.sub(r"  const handleSubscribe = async \(plan: VipPlan\) => \{.*?\n  \};", handle_subscribe_new, content, flags=re.DOTALL)
open("src/pages/dashboard/VIPPage.tsx", "w").write(content)
