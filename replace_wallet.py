import re

content = open("src/pages/dashboard/WalletPage.tsx").read()
content = re.sub(r"import \{.*?\} from 'firebase/firestore';\n", "", content)
content = re.sub(r"import \{ db \} from '../../lib/firebase';\n", "", content)
content = re.sub(r"import \{ useAuth \} from '../../context/AuthContext';", "import { useAuth } from '../../context/AuthContext';\nimport { api } from '../../lib/api';", content)

fetch_tx_new = """  const fetchTransactions = async () => {
    if (!profile) return;
    setLoadingTransactions(true);
    try {
      const data = await api.getTransactions();
      const allTx = data.transactions || [];
      // Optionally combine deposits and withdrawals if backend returns them separately, 
      // but assuming the backend returns all in `transactions`.
      setTransactions(allTx);
    } catch (err) {
      console.error('Error fetching transactions', err);
    } finally {
      setLoadingTransactions(false);
    }
  };"""
content = re.sub(r"  const fetchTransactions = async \(\) => \{.*?\n  \};", fetch_tx_new, content, flags=re.DOTALL)

handle_dep_new = """  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !depositAmount || isNaN(Number(depositAmount))) return;
    setIsSubmitting(true);
    
    try {
      await api.deposit(Number(depositAmount));
      setDepositAmount('');
      setShowDeposit(false);
      fetchTransactions();
      refreshWallet();
      alert('تم إرسال طلب الإيداع للمراجعة');
    } catch (error: any) {
      console.error('Error requesting deposit', error);
      alert(error.message || 'حدث خطأ أثناء تقديم الطلب.');
    } finally {
      setIsSubmitting(false);
    }
  };"""
content = re.sub(r"  const handleDeposit = async \(e: React.FormEvent\) => \{.*?\n  \};", handle_dep_new, content, flags=re.DOTALL)

handle_with_new = """  const handleWithdrawal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !withdrawAmount || isNaN(Number(withdrawAmount))) return;
    if (Number(withdrawAmount) > (wallet?.availableBalance || 0)) {
      alert('الرصيد المتوفر غير كافٍ');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await api.withdraw(Number(withdrawAmount));
      setWithdrawAmount('');
      setShowWithdraw(false);
      fetchTransactions();
      refreshWallet();
      alert('تم إرسال طلب السحب للمراجعة');
    } catch (error: any) {
      console.error('Error requesting withdrawal', error);
      alert(error.message || 'حدث خطأ أثناء تقديم الطلب.');
    } finally {
      setIsSubmitting(false);
    }
  };"""
content = re.sub(r"  const handleWithdrawal = async \(e: React.FormEvent\) => \{.*?\n  \};", handle_with_new, content, flags=re.DOTALL)

# Add refreshWallet to WalletContext uses
content = content.replace("const { wallet } = useWallet();", "const { wallet, refreshWallet } = useWallet();")

open("src/pages/dashboard/WalletPage.tsx", "w").write(content)
