import re

for filename, endpoint in [("src/pages/admin/AdminTasks.tsx", "tasks"), ("src/pages/admin/AdminAds.tsx", "ads"), ("src/pages/admin/AdminVIP.tsx", "vip")]:
  content = open(filename).read()
  content = re.sub(r"import \{.*?\} from 'firebase/firestore';\n", "", content)
  content = re.sub(r"import \{ db \} from '../../lib/firebase';\n", "", content)
  content = content.replace("import { formatCurrency, cn } from '../../lib/utils';", "import { formatCurrency, cn } from '../../lib/utils';\nimport { api } from '../../lib/api';")
  
  fetch_new = f"""  const fetchData = async () => {{
    setLoading(true);
    try {{
      const res = await fetch('/api/admin/{endpoint}');
      const data = await res.json();
      setItems(data.{endpoint} || []);
    }} catch (err) {{
      console.error(err);
    }} finally {{
      setLoading(false);
    }}
  }};"""
  
  if "fetchTasks" in content:
      content = re.sub(r"  const fetchTasks = async \(\) => \{.*?\n  \};", fetch_new.replace("fetchData", "fetchTasks").replace("setItems", "setTasks"), content, flags=re.DOTALL)
  if "fetchAds" in content:
      content = re.sub(r"  const fetchAds = async \(\) => \{.*?\n  \};", fetch_new.replace("fetchData", "fetchAds").replace("setItems", "setAds"), content, flags=re.DOTALL)
  if "fetchPlans" in content:
      content = re.sub(r"  const fetchPlans = async \(\) => \{.*?\n  \};", fetch_new.replace("fetchData", "fetchPlans").replace("setItems", "setPlans"), content, flags=re.DOTALL)

  open(filename, "w").write(content)
