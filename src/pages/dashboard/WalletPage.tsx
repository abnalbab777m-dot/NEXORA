import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { LoadingState } from '../../components/ui/LoadingState';
import { ErrorState } from '../../components/ui/ErrorState';
import { 
  History, 
  ArrowDownToLine, 
  ArrowUpFromLine, 
  Copy, 
  Check, 
  AlertCircle, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Wallet, 
  ShieldCheck, 
  QrCode, 
  Sparkles,
  Zap,
  TrendingUp,
  CreditCard,
  Hash,
  Send,
  Filter,
  CheckCheck,
  ChevronDown,
  Info
} from 'lucide-react';
import { api } from '../../lib/api';
import { formatCurrency, cn } from '../../lib/utils';
import { useAuth } from '../../context/AuthContext';
import { useWallet } from '../../context/WalletContext';
import { useToast } from '../../components/ui/Toast';
import { PaymentMethod } from '../../types/models';
import { motion, AnimatePresence } from 'motion/react';

export default function WalletPage() {
  const { user } = useAuth();
  const { wallet, refreshWallet } = useWallet();
  const toast = useToast();

  const [transactions, setTransactions] = useState<any[]>([]);
  const [loadingTx, setLoadingTx] = useState(true);
  const [errorTx, setErrorTx] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'deposit' | 'withdraw'>('overview');
  const [filterType, setFilterType] = useState<string>('ALL');

  // Dynamic Payment Methods State
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loadingMethods, setLoadingMethods] = useState(true);

  // Selected Payment Method for Deposit
  const [selectedDepositMethod, setSelectedDepositMethod] = useState<PaymentMethod | null>(null);
  const [depositAmount, setDepositAmount] = useState('');
  const [depositTxid, setDepositTxid] = useState('');
  const [copied, setCopied] = useState(false);
  const [isDepositSubmitting, setIsDepositSubmitting] = useState(false);

  // Selected Payment Method for Withdrawal
  const [selectedWithdrawMethod, setSelectedWithdrawMethod] = useState<PaymentMethod | null>(null);
  const [withdrawAddress, setWithdrawAddress] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawPin, setWithdrawPin] = useState('');
  const [isWithdrawSubmitting, setIsWithdrawSubmitting] = useState(false);

  useEffect(() => {
    fetchTransactions();
    fetchPaymentMethods();
    refreshWallet();
  }, []);

  const fetchPaymentMethods = async () => {
    setLoadingMethods(true);
    try {
      const res = await api.getPaymentMethods();
      const methods: PaymentMethod[] = res.paymentMethods || [];
      setPaymentMethods(methods);

      // Default selection for Deposit
      const depositAvailable = methods.filter(m => m.type === 'DEPOSIT' || m.type === 'BOTH');
      if (depositAvailable.length > 0) {
        setSelectedDepositMethod(depositAvailable[0]);
      }

      // Default selection for Withdrawal
      const withdrawAvailable = methods.filter(m => m.type === 'WITHDRAWAL' || m.type === 'BOTH');
      if (withdrawAvailable.length > 0) {
        setSelectedWithdrawMethod(withdrawAvailable[0]);
      }
    } catch (err: any) {
      console.error('Failed to load payment methods:', err);
    } finally {
      setLoadingMethods(false);
    }
  };

  const fetchTransactions = async () => {
    setLoadingTx(true);
    setErrorTx(null);
    try {
      const data = await api.getTransactions();
      setTransactions(data.transactions || []);
    } catch (err: any) {
      setErrorTx(err.message || 'فشل في تحميل سجل العمليات');
    } finally {
      setLoadingTx(false);
    }
  };

  // Copy Address to clipboard
  const handleCopyAddress = (textToCopy: string) => {
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    toast.success('تم نسخ عنوان المحفظة بنجاح!', 'يمكنك الآن لصق العنوان في تطبيق محفظتك للتحويل.');
    setTimeout(() => setCopied(false), 3000);
  };

  // Submit Deposit Request
  const handleDepositSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDepositMethod) {
      toast.warning('يرجى اختيار طريقة الإيداع أولاً');
      return;
    }

    const amountNum = parseFloat(depositAmount);
    const minLimit = Number(selectedDepositMethod.minLimit) || 1;
    const maxLimit = Number(selectedDepositMethod.maxLimit) || 100000;

    if (isNaN(amountNum) || amountNum < minLimit) {
      toast.warning(`الحد الأدنى للإيداع عبر ${selectedDepositMethod.name} هو ${formatCurrency(minLimit)}`);
      return;
    }

    if (amountNum > maxLimit) {
      toast.warning(`الحد الأقصى للإيداع عبر ${selectedDepositMethod.name} هو ${formatCurrency(maxLimit)}`);
      return;
    }

    if (!depositTxid.trim()) {
      toast.warning('يرجى إدخال رقم العملية (TXID / Hash / رقم الإشعار) للتحقق من التحويل');
      return;
    }

    setIsDepositSubmitting(true);
    try {
      await api.requestDeposit(amountNum, {
        reference: depositTxid.trim(),
        txid: depositTxid.trim(),
        paymentMethod: selectedDepositMethod.name
      });

      toast.success(
        'تم إرسال طلب الإيداع بنجاح!',
        `تم تسجيل طلب إيداع بقيمة ${formatCurrency(amountNum)} عبر (${selectedDepositMethod.name}) وهو قيد المراجعة.`
      );

      setDepositAmount('');
      setDepositTxid('');
      setActiveTab('overview');
      await Promise.all([refreshWallet(), fetchTransactions()]);
    } catch (error: any) {
      toast.error('فشل في إرسال طلب الإيداع', error.message || 'حدث خطأ أثناء معالجة الطلب');
    } finally {
      setIsDepositSubmitting(false);
    }
  };

  // Submit Withdrawal Request
  const handleWithdrawSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWithdrawMethod) {
      toast.warning('يرجى اختيار طريقة السحب أولاً');
      return;
    }

    const amountNum = parseFloat(withdrawAmount);
    const available = Number(wallet?.availableBalance || 0);
    const minLimit = Number(selectedWithdrawMethod.minLimit) || 10;
    const maxLimit = Number(selectedWithdrawMethod.maxLimit) || 50000;

    if (isNaN(amountNum) || amountNum < minLimit) {
      toast.warning(`الحد الأدنى للسحب عبر ${selectedWithdrawMethod.name} هو ${formatCurrency(minLimit)}`);
      return;
    }

    if (amountNum > maxLimit) {
      toast.warning(`الحد الأقصى للسحب عبر ${selectedWithdrawMethod.name} هو ${formatCurrency(maxLimit)}`);
      return;
    }

    if (amountNum > available) {
      toast.error('رصيد غير كافٍ', `الرصيد المتاح للسحب هو ${formatCurrency(available)} فقط.`);
      return;
    }

    if (!withdrawAddress.trim() || withdrawAddress.trim().length < 5) {
      toast.warning('يرجى إدخال عنوان محفظة أو رقم حساب استلام صحيح');
      return;
    }

    if (!withdrawPin.trim() || withdrawPin.trim().length < 4) {
      toast.warning('يرجى إدخال الرقم السري للعمليات (PIN) المكون من 4 إلى 6 أرقام لتأكيد السحب');
      return;
    }

    setIsWithdrawSubmitting(true);
    try {
      await api.requestWithdrawal(amountNum, {
        address: withdrawAddress.trim(),
        reference: withdrawAddress.trim(),
        paymentMethod: selectedWithdrawMethod.name,
        pin: withdrawPin.trim()
      });

      toast.success(
        'تم تقديم طلب السحب بنجاح!',
        `تم خصم ${formatCurrency(amountNum)} من رصيدك المتاح ونقلها للرصيد المعلق بانتظار إتمام التحويل عبر (${selectedWithdrawMethod.name}).`
      );

      setWithdrawAmount('');
      setWithdrawAddress('');
      setWithdrawPin('');
      setActiveTab('overview');
      await Promise.all([refreshWallet(), fetchTransactions()]);
    } catch (error: any) {
      toast.error('فشل في طلب السحب', error.message || 'حدث خطأ أثناء معالجة السحب');
    } finally {
      setIsWithdrawSubmitting(false);
    }
  };

  // Quick Max Button for Withdrawal
  const handleSetMaxWithdraw = () => {
    const available = Number(wallet?.availableBalance || 0);
    if (available > 0) {
      setWithdrawAmount(available.toFixed(2));
    } else {
      toast.info('لا يوجد رصيد متاح للسحب حالياً');
    }
  };

  // Active methods filters
  const depositMethods = paymentMethods.filter(m => (m.type === 'DEPOSIT' || m.type === 'BOTH') && m.isActive);
  const withdrawMethods = paymentMethods.filter(m => (m.type === 'WITHDRAWAL' || m.type === 'BOTH') && m.isActive);

  // Transaction Status Helpers
  const getStatusBadge = (status: string) => {
    const s = String(status || '').toLowerCase().trim();
    
    // Completed / Approved / Success / مكتمل
    if (
      s.includes('complete') || 
      s.includes('approved') || 
      s.includes('success') || 
      s.includes('مكتمل') || 
      s.includes('موافق') ||
      s.includes('مؤكد')
    ) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          <CheckCircle2 className="w-3.5 h-3.5" /> مكتمل
        </span>
      );
    }
    
    // Rejected / Failed / Cancelled / Declined / مرفوض
    if (
      s.includes('reject') || 
      s.includes('fail') || 
      s.includes('cancel') || 
      s.includes('decline') || 
      s.includes('مرفوض') ||
      s.includes('ملغي')
    ) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
          <XCircle className="w-3.5 h-3.5" /> مرفوض
        </span>
      );
    }
    
    // Default Pending
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
        <Clock className="w-3.5 h-3.5 animate-pulse" /> قيد المراجعة
      </span>
    );
  };

  const getDynamicDescription = (tx: any) => {
    const s = String(tx.status || '').toLowerCase().trim();
    let baseText = tx.description || `عملية ${tx.type}`;
    
    const isCompleted = s.includes('complete') || s.includes('approved') || s.includes('success') || s.includes('مكتمل') || s.includes('مؤكد');
    const isRejected = s.includes('reject') || s.includes('fail') || s.includes('cancel') || s.includes('decline') || s.includes('مرفوض');

    if (tx.type === 'DEPOSIT') {
      if (isCompleted) baseText = "إيداع مؤكد";
      else if (isRejected) baseText = "طلب إيداع مرفوض";
      else baseText = "طلب إيداع قيد المراجعة";
    } else if (tx.type === 'WITHDRAWAL') {
      if (isCompleted) baseText = "سحب مؤكد";
      else if (isRejected) baseText = "طلب سحب مرفوض";
      else baseText = "طلب سحب قيد المراجعة";
    }
    
    // Extract TXID or Hash or wallet reference if it exists in the original description to keep context
    if (tx.description) {
      const match = tx.description.match(/\(TXID:[^)]+\)/i) || tx.description.match(/\(Hash:[^)]+\)/i) || tx.description.match(/إلى محفظة:[^)]+/i);
      if (match) {
        return `${baseText} ${match[0]}`;
      }
    }
    return baseText;
  };

  const getTransactionTypeDetails = (type: string) => {
    switch (type) {
      case 'DEPOSIT':
        return {
          title: 'إيداع رصيد',
          icon: <ArrowDownToLine className="w-4 h-4" />,
          isPositive: true,
          color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
        };
      case 'WITHDRAWAL':
        return {
          title: 'سحب أرباح',
          icon: <ArrowUpFromLine className="w-4 h-4" />,
          isPositive: false,
          color: 'text-amber-400 bg-amber-500/10 border-amber-500/20'
        };
      case 'TASK_REWARD':
        return {
          title: 'مكافأة إنجاز مهمة',
          icon: <Sparkles className="w-4 h-4" />,
          isPositive: true,
          color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
        };
      case 'AD_REWARD':
        return {
          title: 'مكافأة مشاهدة إعلان',
          icon: <Zap className="w-4 h-4" />,
          isPositive: true,
          color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
        };
      case 'VIP_UPGRADE':
        return {
          title: 'ترقية باقة VIP',
          icon: <CreditCard className="w-4 h-4" />,
          isPositive: false,
          color: 'text-purple-400 bg-purple-500/10 border-purple-500/20'
        };
      case 'ADMIN_ADJUSTMENT':
        return {
          title: 'تسوية رصيد إدارية',
          icon: <Wallet className="w-4 h-4" />,
          isPositive: true,
          color: 'text-blue-400 bg-blue-500/10 border-blue-500/20'
        };
      default:
        return {
          title: type,
          icon: <History className="w-4 h-4" />,
          isPositive: true,
          color: 'text-neutral-400 bg-neutral-800 border-neutral-700'
        };
    }
  };

  // Filtered transactions
  const filteredTransactions = transactions.filter(tx => {
    if (filterType === 'ALL') return true;
    if (filterType === 'DEPOSITS') return tx.type === 'DEPOSIT';
    if (filterType === 'WITHDRAWALS') return tx.type === 'WITHDRAWAL';
    if (filterType === 'EARNINGS') return tx.type === 'TASK_REWARD' || tx.type === 'AD_REWARD';
    return true;
  });

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-neutral-900 via-neutral-900 to-neutral-900/80 border border-neutral-800 p-6 rounded-2xl shadow-lg">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Wallet className="w-6 h-6 text-yellow-500" />
            <h1 className="text-2xl font-bold text-white">المحفظة الرقمية والأرصدة</h1>
          </div>
          <p className="text-neutral-400 text-sm">
            إدارة فورية للأرصدة، شحن الحساب، وسحب الأرباح عبر وسائل دفع متعددة معتمدة.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            id="btn-quick-deposit"
            variant={activeTab === 'deposit' ? 'primary' : 'outline'}
            onClick={() => setActiveTab('deposit')}
            className="flex items-center gap-2"
          >
            <ArrowDownToLine className="w-4 h-4" />
            إيداع جديد
          </Button>
          <Button
            id="btn-quick-withdraw"
            variant={activeTab === 'withdraw' ? 'primary' : 'secondary'}
            onClick={() => setActiveTab('withdraw')}
            className="flex items-center gap-2"
          >
            <ArrowUpFromLine className="w-4 h-4" />
            طلب سحب
          </Button>
        </div>
      </div>

      {/* Synchronized Financial Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Available Balance */}
        <Card className="bg-gradient-to-br from-neutral-900 via-neutral-900 to-neutral-950 border-yellow-500/30 relative overflow-hidden shadow-lg">
          <div className="absolute top-0 right-0 p-24 bg-yellow-500/10 rounded-full blur-3xl -mr-12 -mt-12 pointer-events-none" />
          <CardContent className="p-5 relative">
            <div className="flex items-center justify-between text-neutral-400 mb-2">
              <span className="text-xs font-semibold">الرصيد المتاح (للسحب والشراء)</span>
              <div className="w-8 h-8 rounded-lg bg-yellow-500/10 flex items-center justify-center text-yellow-500">
                <Wallet className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-yellow-400 mb-1">
              {formatCurrency(wallet?.availableBalance || 0)}
            </div>
            <p className="text-[11px] text-neutral-500">جاهز للسحب الفوري إلى محفظتك</p>
          </CardContent>
        </Card>

        {/* Total Earnings */}
        <Card className="bg-neutral-900/60 border-neutral-800 relative overflow-hidden">
          <CardContent className="p-5">
            <div className="flex items-center justify-between text-neutral-400 mb-2">
              <span className="text-xs font-semibold">إجمالي الأرباح المكتسبة</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-emerald-400 mb-1">
              {formatCurrency(wallet?.totalEarnings || 0)}
            </div>
            <p className="text-[11px] text-neutral-500">أرباح الإعلانات والمهام المنجزة</p>
          </CardContent>
        </Card>

        {/* Pending Balance */}
        <Card className="bg-neutral-900/60 border-neutral-800 relative overflow-hidden">
          <CardContent className="p-5">
            <div className="flex items-center justify-between text-neutral-400 mb-2">
              <span className="text-xs font-semibold">الرصيد المعلق</span>
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-amber-400 mb-1">
              {formatCurrency(wallet?.pendingBalance || 0)}
            </div>
            <p className="text-[11px] text-neutral-500">سحوبات وإيداعات بانتظار التأكيد</p>
          </CardContent>
        </Card>

        {/* Total Withdrawals */}
        <Card className="bg-neutral-900/60 border-neutral-800 relative overflow-hidden">
          <CardContent className="p-5">
            <div className="flex items-center justify-between text-neutral-400 mb-2">
              <span className="text-xs font-semibold">إجمالي السحوبات</span>
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-white mb-1">
              {formatCurrency(wallet?.totalWithdrawals || 0)}
            </div>
            <p className="text-[11px] text-neutral-500">المبالغ المحولة بنجاح</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs Navigation Bar */}
      <div className="bg-neutral-900/80 rounded-2xl border border-neutral-800 p-1.5 backdrop-blur-md">
        <div className="flex gap-1.5">
          <button 
            id="tab-history"
            onClick={() => setActiveTab('overview')}
            className={cn(
              "flex-1 py-3 px-4 text-sm font-bold rounded-xl transition-all duration-200 flex items-center justify-center gap-2",
              activeTab === 'overview' 
                ? "bg-neutral-800 text-yellow-400 shadow-md border border-neutral-700" 
                : "text-neutral-400 hover:text-white hover:bg-neutral-800/40"
            )}
          >
            <History className="w-4 h-4" />
            سجل العمليات والمعاملات
          </button>
          <button 
            id="tab-deposit"
            onClick={() => setActiveTab('deposit')}
            className={cn(
              "flex-1 py-3 px-4 text-sm font-bold rounded-xl transition-all duration-200 flex items-center justify-center gap-2",
              activeTab === 'deposit' 
                ? "bg-yellow-500 text-neutral-950 shadow-md font-extrabold" 
                : "text-neutral-400 hover:text-white hover:bg-neutral-800/40"
            )}
          >
            <ArrowDownToLine className="w-4 h-4" />
            إيداع جديد
          </button>
          <button 
            id="tab-withdraw"
            onClick={() => setActiveTab('withdraw')}
            className={cn(
              "flex-1 py-3 px-4 text-sm font-bold rounded-xl transition-all duration-200 flex items-center justify-center gap-2",
              activeTab === 'withdraw' 
                ? "bg-neutral-800 text-yellow-400 shadow-md border border-neutral-700" 
                : "text-neutral-400 hover:text-white hover:bg-neutral-800/40"
            )}
          >
            <ArrowUpFromLine className="w-4 h-4" />
            طلب سحب أرباح
          </button>
        </div>
      </div>

      {/* Main Tab Content */}
      <div className="min-h-[420px]">
        {/* ================= TAB 1: TRANSACTION HISTORY ================= */}
        {activeTab === 'overview' && (
          <Card className="border-neutral-800">
            <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-800/60 pb-4">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-yellow-500" />
                <CardTitle className="text-lg text-white">سجل العمليات المالية والتحويلات</CardTitle>
              </div>

              {/* Filter Pills */}
              <div className="flex items-center gap-1.5 bg-neutral-950 p-1 rounded-xl border border-neutral-800 text-xs">
                <button
                  onClick={() => setFilterType('ALL')}
                  className={cn(
                    "px-3 py-1.5 rounded-lg font-medium transition-colors",
                    filterType === 'ALL' ? "bg-neutral-800 text-white font-bold" : "text-neutral-400 hover:text-white"
                  )}
                >
                  الكل
                </button>
                <button
                  onClick={() => setFilterType('DEPOSITS')}
                  className={cn(
                    "px-3 py-1.5 rounded-lg font-medium transition-colors",
                    filterType === 'DEPOSITS' ? "bg-neutral-800 text-emerald-400 font-bold" : "text-neutral-400 hover:text-white"
                  )}
                >
                  الإيداعات
                </button>
                <button
                  onClick={() => setFilterType('WITHDRAWALS')}
                  className={cn(
                    "px-3 py-1.5 rounded-lg font-medium transition-colors",
                    filterType === 'WITHDRAWALS' ? "bg-neutral-800 text-amber-400 font-bold" : "text-neutral-400 hover:text-white"
                  )}
                >
                  السحوبات
                </button>
                <button
                  onClick={() => setFilterType('EARNINGS')}
                  className={cn(
                    "px-3 py-1.5 rounded-lg font-medium transition-colors",
                    filterType === 'EARNINGS' ? "bg-neutral-800 text-yellow-400 font-bold" : "text-neutral-400 hover:text-white"
                  )}
                >
                  الأرباح
                </button>
              </div>
            </CardHeader>

            <CardContent className="p-6">
              {loadingTx ? (
                <LoadingState message="جاري جلب سجل العمليات المالية..." />
              ) : errorTx ? (
                <ErrorState message={errorTx} onRetry={fetchTransactions} />
              ) : filteredTransactions.length === 0 ? (
                <div className="py-16 text-center text-neutral-500 bg-neutral-950/40 rounded-2xl border border-neutral-800/80 p-8">
                  <History className="w-12 h-12 text-neutral-600 mx-auto mb-3" />
                  <h3 className="text-base font-bold text-neutral-300 mb-1">لا توجد عمليات مسجلة في هذا القسم</h3>
                  <p className="text-xs text-neutral-500">ستظهر هنا أي عمليات إيداع، سحب، أو مكافآت مهام بمجرد تنفيذها.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredTransactions.map((tx) => {
                    const txId = tx.id || tx.transactionId;
                    const typeInfo = getTransactionTypeDetails(tx.type);
                    const isPositive = tx.type === 'DEPOSIT' || tx.type === 'TASK_REWARD' || tx.type === 'AD_REWARD' || (tx.type === 'ADMIN_ADJUSTMENT' && tx.amount > 0);

                    return (
                      <div 
                        key={txId}
                        id={`tx-row-${txId}`}
                        className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-neutral-800/80 bg-neutral-950/50 hover:border-neutral-700 transition-all gap-4"
                      >
                        {/* Right / Start Details */}
                        <div className="flex items-start sm:items-center gap-3.5">
                          <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border", typeInfo.color)}>
                            {typeInfo.icon}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-white text-sm">{typeInfo.title}</h4>
                              <span className="sm:hidden">{getStatusBadge(tx.status)}</span>
                            </div>
                            <p className="text-xs text-neutral-400 mt-0.5 max-w-md line-clamp-1">
                              {getDynamicDescription(tx)}
                            </p>
                            <span className="text-[11px] text-neutral-500 font-mono block mt-1">
                              {tx.createdAt ? new Date(tx.createdAt).toLocaleString('ar-EG', { dateStyle: 'medium', timeStyle: 'short' }) : ''}
                            </span>
                          </div>
                        </div>

                        {/* Left / End Amount & Status */}
                        <div className="flex sm:flex-col items-center sm:items-end justify-between border-t sm:border-t-0 pt-2 sm:pt-0 border-neutral-800">
                          <span className={cn(
                            "text-base font-extrabold font-mono",
                            isPositive ? "text-emerald-400" : "text-amber-400"
                          )}>
                            {isPositive ? '+' : '-'}{formatCurrency(tx.amount)}
                          </span>
                          <div className="hidden sm:block mt-1.5">
                            {getStatusBadge(tx.status)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* ================= TAB 2: NEW DEPOSIT ================= */}
        {activeTab === 'deposit' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left/Main Deposit Form */}
            <Card className="lg:col-span-7 border-neutral-800">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <ArrowDownToLine className="w-5 h-5 text-yellow-500" />
                  <CardTitle className="text-lg text-white">إيداع رصيد جديد في الحساب</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* 1. Payment Method Selector */}
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-neutral-300">
                    اختر وسيلة الإيداع (Payment Method)
                  </label>
                  {depositMethods.length === 0 ? (
                    <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs">
                      لا توجد وسائل إيداع مفعلة حالياً في النظام. يرجى التواصل مع الإدارة.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {depositMethods.map((m) => {
                        const isSelected = selectedDepositMethod?.id === m.id;
                        return (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => setSelectedDepositMethod(m)}
                            className={cn(
                              "p-3 rounded-xl border text-right transition-all flex flex-col justify-between gap-2 relative overflow-hidden",
                              isSelected 
                                ? "border-yellow-500 bg-yellow-500/10 text-white shadow-md ring-1 ring-yellow-500/50" 
                                : "border-neutral-800 bg-neutral-950/60 text-neutral-400 hover:border-neutral-700 hover:text-white"
                            )}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-bold text-xs text-white truncate">{m.name}</span>
                              {isSelected && <CheckCircle2 className="w-4 h-4 text-yellow-500 shrink-0" />}
                            </div>
                            <div className="flex items-center justify-between text-[10px] text-neutral-400">
                              <span>{m.network || 'دفع رقمي'}</span>
                              <span className="font-mono text-yellow-400">الحد الأدنى: ${m.minLimit}</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {selectedDepositMethod && (
                  <>
                    {/* Notice / Instructions Alert */}
                    <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs flex items-start gap-3 leading-relaxed">
                      <ShieldCheck className="w-5 h-5 shrink-0 text-blue-400 mt-0.5" />
                      <div>
                        <strong className="block font-bold text-blue-200 mb-0.5">
                          تعليمات التحويل عبر {selectedDepositMethod.name}:
                        </strong>
                        {selectedDepositMethod.instructions || (
                          <>يرجى تحويل المبلغ المطلوب إلى العنوان الموضح أدناه، ثم إدخال رقم العملية (TXID / Hash) للتأكيد الفوري.</>
                        )}
                      </div>
                    </div>

                    {/* Deposit Address Box with Copy Button */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-xs text-neutral-400">
                        <span className="font-semibold text-neutral-300">
                          عنوان المحفظة أو رقم الحساب لاستقبال الأموال:
                        </span>
                        {selectedDepositMethod.network && (
                          <span className="text-[11px] text-yellow-500 font-bold bg-yellow-500/10 px-2 py-0.5 rounded border border-yellow-500/20 font-mono">
                            {selectedDepositMethod.network}
                          </span>
                        )}
                      </div>

                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-3 bg-neutral-950 rounded-xl border border-neutral-800">
                        <div className="font-mono text-xs text-yellow-400 break-all select-all flex-1 text-center sm:text-right px-2 py-1">
                          {selectedDepositMethod.walletAddressOrAccount}
                        </div>

                        <Button
                          id="btn-copy-address"
                          type="button"
                          variant={copied ? "primary" : "secondary"}
                          size="sm"
                          onClick={() => handleCopyAddress(selectedDepositMethod.walletAddressOrAccount)}
                          className={cn(
                            "shrink-0 font-bold text-xs flex items-center justify-center gap-1.5 py-2",
                            copied ? "bg-emerald-500 hover:bg-emerald-400 text-neutral-950" : "bg-neutral-800 hover:bg-neutral-700 text-white"
                          )}
                        >
                          {copied ? (
                            <>
                              <Check className="w-4 h-4 text-neutral-950" />
                              تم النسخ
                            </>
                          ) : (
                            <>
                              <Copy className="w-4 h-4" />
                              نسخ العنوان
                            </>
                          )}
                        </Button>
                      </div>
                    </div>

                    {/* Deposit Confirmation Form */}
                    <form onSubmit={handleDepositSubmit} className="space-y-4 pt-2 border-t border-neutral-800/80">
                      <div>
                        <Input 
                          id="input-deposit-amount"
                          label={`المبلغ المحول بالدولار ($) - الحد الأدنى: ${formatCurrency(selectedDepositMethod.minLimit)}`}
                          type="number"
                          min={selectedDepositMethod.minLimit}
                          max={selectedDepositMethod.maxLimit}
                          step="0.01"
                          placeholder={`مثال: ${selectedDepositMethod.minLimit}`}
                          value={depositAmount}
                          onChange={e => setDepositAmount(e.target.value)}
                          required
                          dir="ltr"
                        />
                        <div className="flex justify-between items-center text-[11px] text-neutral-500 mt-1 px-1">
                          <span>الحد الأقصى للإيداع: {formatCurrency(selectedDepositMethod.maxLimit)}</span>
                          <span>رسوم الإيداع: {selectedDepositMethod.networkFee > 0 ? formatCurrency(selectedDepositMethod.networkFee) : 'مجاني'}</span>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                          رقم العملية أو كود المعاملة (TXID / Hash / رقم الحوالة)
                        </label>
                        <div className="relative">
                          <Input 
                            id="input-deposit-txid"
                            placeholder="أدخل كود المعاملة أو رقم إشعار التحويل..."
                            value={depositTxid}
                            onChange={e => setDepositTxid(e.target.value)}
                            required
                            dir="ltr"
                            className="font-mono text-xs"
                          />
                          <Hash className="w-4 h-4 text-neutral-500 absolute left-3 top-3.5 pointer-events-none" />
                        </div>
                        <p className="text-[11px] text-neutral-500 mt-1">
                          قم بنسخ رمز المعاملة أو رقم الإشعار من تطبيق محفظتك بعد إتمام التحويل مباشرة.
                        </p>
                      </div>

                      <Button 
                        id="btn-submit-deposit"
                        type="submit" 
                        variant="primary"
                        className="w-full bg-yellow-500 hover:bg-yellow-400 text-neutral-950 font-bold py-3 text-base shadow-lg shadow-yellow-500/10 transition-transform active:scale-[0.99]" 
                        isLoading={isDepositSubmitting}
                      >
                        <Send className="w-4 h-4 ml-2" />
                        تأكيد إرسال طلب الإيداع
                      </Button>
                    </form>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Right Information & QR Code Panel */}
            <div className="lg:col-span-5 space-y-4">
              <Card className="border-neutral-800 bg-neutral-950/60 text-center p-6 flex flex-col items-center">
                <div className="w-12 h-12 rounded-2xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center text-yellow-500 mb-3">
                  <QrCode className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-white text-base mb-1">
                  رمز التحويل السريع (QR)
                </h3>
                <p className="text-xs text-neutral-400 mb-4">
                  {selectedDepositMethod?.name || 'اختر وسيلة الدفع لعرض الكود'}
                </p>

                {/* Styled Visual QR */}
                {selectedDepositMethod?.qrCodeUrl ? (
                  <div className="p-3 bg-white rounded-2xl shadow-xl border-4 border-yellow-500/30 mb-3">
                    <img 
                      src={selectedDepositMethod.qrCodeUrl} 
                      alt="QR Code" 
                      className="w-40 h-40 object-contain rounded-lg"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                ) : (
                  <div className="p-4 bg-white rounded-2xl shadow-xl border-4 border-yellow-500/30 mb-3">
                    <div className="w-40 h-40 bg-neutral-950 rounded-xl p-3 flex flex-col items-center justify-center relative overflow-hidden">
                      <div className="grid grid-cols-5 gap-1.5 w-full h-full opacity-90">
                        {Array.from({ length: 25 }).map((_, i) => (
                          <div 
                            key={i} 
                            className={cn(
                              "rounded-[2px]",
                              (i % 2 === 0 || i % 3 === 0) ? "bg-white" : "bg-neutral-800"
                            )} 
                          />
                        ))}
                      </div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="px-2 py-1 rounded-lg bg-yellow-500 flex items-center justify-center font-bold text-neutral-950 text-[11px] shadow-md border-2 border-white">
                          {selectedDepositMethod?.network || 'NEXORA'}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <span className="text-xs text-neutral-400 font-mono font-medium">
                  {selectedDepositMethod?.name || 'SECURE TRANSACTION'}
                </span>
              </Card>

              {/* Safety Rules */}
              <div className="p-4 rounded-xl border border-neutral-800 bg-neutral-900/40 text-xs space-y-2 text-neutral-400">
                <div className="flex items-center gap-2 text-yellow-500 font-semibold">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>شروط وتنبيهات الأمان</span>
                </div>
                <ul className="list-disc list-inside space-y-1.5 text-neutral-400 text-[11px]">
                  <li>تأكد من مطابقة الشبكة واسم الوسيلة بدقة قبل إرسال الأموال.</li>
                  <li>يجب ألا يقل المبلغ عن الحد الأدنى المحدد لكل طريقة.</li>
                  <li>تتم مراجعة الطلبات وتحديث الرصيد في حسابك خلال 5-15 دقيقة.</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 3: WITHDRAWAL REQUEST ================= */}
        {activeTab === 'withdraw' && (
          <div className="max-w-2xl mx-auto">
            <Card className="border-neutral-800">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ArrowUpFromLine className="w-5 h-5 text-yellow-500" />
                    <CardTitle className="text-lg text-white">طلب سحب الأرباح إلى محفظتك</CardTitle>
                  </div>
                  <div className="bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 px-3 py-1 rounded-full text-xs font-bold">
                    الرصيد المتاح: {formatCurrency(wallet?.availableBalance || 0)}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Balance Summary Box */}
                <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-neutral-400 block mb-0.5">الرصيد القابل للسحب الفوري:</span>
                    <span className="text-2xl font-black text-yellow-400">
                      {formatCurrency(wallet?.availableBalance || 0)}
                    </span>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleSetMaxWithdraw}
                    className="border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10 text-xs font-bold"
                  >
                    سحب كامل الرصيد (MAX)
                  </Button>
                </div>

                {/* 1. Payment Method Selector for Withdrawal */}
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-neutral-300">
                    اختر وسيلة استلام السحب (Withdrawal Method)
                  </label>
                  {withdrawMethods.length === 0 ? (
                    <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs">
                      لا توجد وسائل سحب مفعلة حالياً في النظام. يرجى مراجعة الدعم.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {withdrawMethods.map((m) => {
                        const isSelected = selectedWithdrawMethod?.id === m.id;
                        return (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => setSelectedWithdrawMethod(m)}
                            className={cn(
                              "p-3 rounded-xl border text-right transition-all flex flex-col justify-between gap-2 relative overflow-hidden",
                              isSelected 
                                ? "border-yellow-500 bg-yellow-500/10 text-white shadow-md ring-1 ring-yellow-500/50" 
                                : "border-neutral-800 bg-neutral-950/60 text-neutral-400 hover:border-neutral-700 hover:text-white"
                            )}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-bold text-xs text-white truncate">{m.name}</span>
                              {isSelected && <CheckCircle2 className="w-4 h-4 text-yellow-500 shrink-0" />}
                            </div>
                            <div className="flex items-center justify-between text-[10px] text-neutral-400">
                              <span>{m.network || 'سحب رقمي'}</span>
                              <span className="font-mono text-yellow-400">الحد الأدنى: ${m.minLimit}</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {selectedWithdrawMethod && (
                  <form onSubmit={handleWithdrawSubmit} className="space-y-4 pt-2 border-t border-neutral-800/80">
                    {/* Recipient Address */}
                    <div>
                      <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                        عنوان محفظة أو حساب الاستلام ({selectedWithdrawMethod.name})
                      </label>
                      <Input 
                        id="input-withdraw-address"
                        placeholder={`أدخل عنوان محفظة أو رقم حساب ${selectedWithdrawMethod.name}...`}
                        value={withdrawAddress}
                        onChange={e => setWithdrawAddress(e.target.value)}
                        required
                        dir="ltr"
                        className="font-mono text-xs"
                      />
                      <p className="text-[11px] text-neutral-500 mt-1">
                        تأكد من صحة العنوان أو رقم الحساب بدقة لتجنب إلغاء الطلب.
                      </p>
                    </div>

                    {/* Withdrawal Amount */}
                    <div>
                      <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                        المبلغ المراد سحبه بالدولار ($)
                      </label>
                      <div className="relative">
                        <Input 
                          id="input-withdraw-amount"
                          type="number"
                          min={selectedWithdrawMethod.minLimit}
                          max={Math.min(selectedWithdrawMethod.maxLimit, Number(wallet?.availableBalance || 0))}
                          step="0.01"
                          placeholder={`الحد الأدنى: ${selectedWithdrawMethod.minLimit.toFixed(2)} $`}
                          value={withdrawAmount}
                          onChange={e => setWithdrawAmount(e.target.value)}
                          required
                          dir="ltr"
                        />
                      </div>
                      <div className="flex justify-between items-center text-[11px] text-neutral-500 mt-1 px-1">
                        <span>الحد الأدنى للسحب: {formatCurrency(selectedWithdrawMethod.minLimit)}</span>
                        <span>
                          رسوم التحويل: {selectedWithdrawMethod.networkFee > 0 ? formatCurrency(selectedWithdrawMethod.networkFee) : '0.00 $ (مجاناً)'}
                        </span>
                      </div>
                    </div>

                    {/* Withdrawal PIN */}
                    <div>
                      <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                        الرقم السري للعمليات (PIN) للتأكيد
                      </label>
                      <Input 
                        id="input-withdraw-pin"
                        type="password"
                        maxLength={6}
                        placeholder="أدخل الرقم السري للعمليات (مثال: 123456)..."
                        value={withdrawPin}
                        onChange={e => setWithdrawPin(e.target.value)}
                        required
                        dir="ltr"
                        className="font-mono text-xs"
                      />
                      <p className="text-[11px] text-neutral-500 mt-1">
                        الرقم السري الافتراضي للحسابات هو 123456 (يمكنك تعيينه أو تغييره من الملف الشخصي).
                      </p>
                    </div>

                    {/* Info Notice */}
                    <div className="p-3.5 rounded-xl bg-neutral-900/50 border border-neutral-800 text-xs text-neutral-400 space-y-1">
                      <p className="flex items-center gap-1.5 text-neutral-300 font-semibold">
                        <Clock className="w-3.5 h-3.5 text-yellow-500" />
                        معالجة طلب السحب:
                      </p>
                      <p className="text-[11px] leading-relaxed">
                        عند تأكيد الطلب، يتم خصم المبلغ فوراً من رصيدك المتاح ونقله إلى الرصيد المعلق حتى يتم إرسال الأموال بنجاح إلى حسابك.
                      </p>
                    </div>

                    {/* Submit Button */}
                    <Button 
                      id="btn-submit-withdraw"
                      type="submit" 
                      variant="primary"
                      className="w-full bg-yellow-500 hover:bg-yellow-400 text-neutral-950 font-bold py-3 text-base shadow-lg shadow-yellow-500/10 transition-transform active:scale-[0.99]" 
                      isLoading={isWithdrawSubmitting}
                      disabled={Number(wallet?.availableBalance || 0) < selectedWithdrawMethod.minLimit}
                    >
                      <ArrowUpFromLine className="w-4 h-4 ml-2" />
                      {Number(wallet?.availableBalance || 0) < selectedWithdrawMethod.minLimit 
                        ? `الرصيد المتاح أقل من الحد الأدنى (${selectedWithdrawMethod.minLimit}$)` 
                        : 'تأكيد طلب السحب'}
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
