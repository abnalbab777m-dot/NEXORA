import re

content = open("src/pages/dashboard/AdsPage.tsx").read()
content = re.sub(r"import \{.*?\} from 'firebase/firestore';\n", "", content)
content = re.sub(r"import \{ db \} from '../../lib/firebase';\n", "", content)
content = re.sub(r"import \{ useAuth \} from '../../context/AuthContext';", "import { useAuth } from '../../context/AuthContext';\nimport { api } from '../../lib/api';", content)

fetch_ads_new = """  const fetchAds = async () => {
    if (!profile) return;
    setLoading(true);
    setError(null);
    try {
      const data = await api.getAds();
      const compData = await fetch('/api/ads/completions').then(res => res.json());
      setAds(data.ads || []);
      const compMap: Record<string, 'PENDING' | 'COMPLETED' | 'REJECTED'> = {};
      if (compData.completions) {
        compData.completions.forEach((comp: any) => {
          compMap[comp.adId] = comp.status;
        });
      }
      setCompletions(compMap);
    } catch (err: any) {
      console.error('Error fetching ads', err);
      setError('حدث خطأ أثناء جلب الإعلانات.');
    } finally {
      setLoading(false);
    }
  };"""
content = re.sub(r"  const fetchAds = async \(\) => \{.*?\n  \};", fetch_ads_new, content, flags=re.DOTALL)

complete_ad_new = """  const handleCompleteAd = async (ad: Ad) => {
    if (!profile) return;
    setSubmittingId(ad.adId || ad.id);
    
    try {
      await api.completeAd(ad.adId || ad.id);
      setCompletions(prev => ({ ...prev, [ad.adId || ad.id]: 'PENDING' }));
    } catch (error: any) {
      console.error('Error completing ad', error);
      alert(error.message || 'حدث خطأ أثناء إرسال الإعلان.');
    } finally {
      setSubmittingId(null);
    }
  };"""
content = re.sub(r"  const handleCompleteAd = async \(ad: Ad\) => \{.*?\n  \};", complete_ad_new, content, flags=re.DOTALL)

open("src/pages/dashboard/AdsPage.tsx", "w").write(content)
