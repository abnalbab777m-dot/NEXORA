import re
content = open("src/pages/admin/AdminTransactions.tsx").read()
content = re.sub(r"import \{.*?\} from 'firebase/firestore';\n", "", content)
content = re.sub(r"import \{ db \} from '../../lib/firebase';\n", "", content)
content = content.replace("import { formatCurrency, cn } from '../../lib/utils';", "import { formatCurrency, cn } from '../../lib/utils';\nimport { api } from '../../lib/api';")

fetch_tx_new = """  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const depRes = await fetch('/api/deposits').then(res => res.json());
      const withRes = await fetch('/api/withdrawals').then(res => res.json());
      const txs = [...(depRes.deposits||[]), ...(withRes.withdrawals||[])];
      setTransactions(txs as any[]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };"""
content = re.sub(r"  const fetchTransactions = async \(\) => \{.*?\n  \};", fetch_tx_new, content, flags=re.DOTALL)

handle_action_new = """  const handleAction = async (tx: Transaction, action: 'APPROVE' | 'REJECT') => {
    try {
      if (action === 'APPROVE') {
        if (tx.type === 'DEPOSIT') {
          await api.admin.approveDeposit(tx.id);
        } else {
          await api.admin.approveWithdrawal(tx.id);
        }
      }
      fetchTransactions();
      alert('تم المعالجة بنجاح');
    } catch (err) {
      alert('خطأ أثناء المعالجة');
    }
  };"""
content = re.sub(r"  const handleAction = async \(tx: Transaction, action: 'APPROVE' \| 'REJECT'\) => \{.*?\n  \};", handle_action_new, content, flags=re.DOTALL)
open("src/pages/admin/AdminTransactions.tsx", "w").write(content)
