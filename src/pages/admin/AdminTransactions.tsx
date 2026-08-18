import React, { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { LoadingState } from '../../components/ui/LoadingState';
import { ErrorState } from '../../components/ui/ErrorState';
import { useToast } from '../../components/ui/Toast';
import { formatCurrency, cn } from '../../lib/utils';
import { 
  Check, 
  X, 
  Copy, 
  Search, 
  ArrowDownToLine, 
  ArrowUpFromLine, 
  Clock, 
  ShieldCheck, 
  RefreshCw, 
  Filter, 
  AlertCircle, 
  ExternalLink,
  Wallet,
  CheckCircle2,
  XCircle,
  Hash,
  User,
  Star
} from 'lucide-react';
import { api } from '../../lib/api';

type TabType = 'PENDING_DEPOSITS' | 'PENDING_WITHDRAWALS' | 'ALL_HISTORY';

export default function AdminTransactions() {
  const toast = useToast();

  const [deposits, setDeposits] = useState<any[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [activeTab, setActiveTab] = useState<TabType>('PENDING_DEPOSITS');
  const [searchQuery, setSearchQuery] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Modals state
  const [rejectModal, setRejectModal] = useState<{
    open: boolean;
    id: string;
    type: 'DEPOSIT' | 'WITHDRAWAL';
    amount: number;
    userName: string;
    reason: string;
  } | null>(null);

  const [approveWithdrawalModal, setApproveWithdrawalModal] = useState<{
    open: boolean;
    id: string;
    amount: number;
    userName: string;
    userAddress: string;
    txHash: string;
    note: string;
  } | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const snap = await api.admin.getFinancialRequests();
      setDeposits(snap.deposits || []);
      setWithdrawals(snap.withdrawals || []);
    } catch (err: any) {
      setError(err.message || 'فشل في تحميل الطلبات المالية');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success('تم النسخ إلى الحافظة');
    setTimeout(() => setCopiedId(null), 2500);
  };

  // Pending counts
  const pendingDeposits = useMemo(() => deposits.filter(d => d.status === 'PENDING'), [deposits]);
  const pendingWithdrawals = useMemo(() => withdrawals.filter(w => w.status === 'PENDING'), [withdrawals]);

  // Combined History
  const historyList = useMemo(() => {
    const deps = deposits.map(d => ({ ...d, txType: 'DEPOSIT' }));
    const withs = withdrawals.map(w => ({ ...w, txType: 'WITHDRAWAL' }));
    return [...deps, ...withs].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [deposits, withdrawals]);

  // Filtered list based on current tab and search query
  const filteredList = useMemo(() => {
    let source: any[] = [];
    if (activeTab === 'PENDING_DEPOSITS') source = pendingDeposits;
    else if (activeTab === 'PENDING_WITHDRAWALS') source = pendingWithdrawals;
    else source = historyList;

    if (!searchQuery.trim()) return source;
    const q = searchQuery.toLowerCase().trim();

    return source.filter(item => {
      const userStr = `${item.username || ''} ${item.userEmail || ''} ${item.displayName || ''} ${item.userId || ''}`.toLowerCase();
      const txidStr = `${item.reference || ''} ${item.adminAction || ''} ${item.id || ''}`.toLowerCase();
      return userStr.includes(q) || txidStr.includes(q);
    });
  }, [activeTab, pendingDeposits, pendingWithdrawals, historyList, searchQuery]);

  // Approve Deposit Action
  const handleApproveDeposit = async (id: string, amount: number, userName: string) => {
    setProcessingId(id);
    try {
      await api.admin.approveDeposit(id);
      toast.success('تم قبول الإيداع بنجاح!', `تمت إضافة مبلغ ${formatCurrency(amount)} إلى رصيد المستخدم (${userName}).`);
      await fetchData();
    } catch (err: any) {
      toast.error('خطأ في قبول الإيداع', err.message);
    } finally {
      setProcessingId(null);
    }
  };

  // Submit Reject Action (For Deposit or Withdrawal)
  const handleConfirmReject = async () => {
    if (!rejectModal) return;
    const { id, type, reason, amount } = rejectModal;

    setProcessingId(id);
    try {
      if (type === 'DEPOSIT') {
        await api.admin.rejectDeposit(id, { reason: reason.trim() });
        toast.success('تم رفض طلب الإيداع');
      } else {
        await api.admin.rejectWithdrawal(id, { reason: reason.trim() });
        toast.success('تم رفض طلب السحب بنجاح!', `تمت إعادة مبلغ ${formatCurrency(amount)} تلقائياً إلى رصيد المستخدم المتاح.`);
      }
      setRejectModal(null);
      await fetchData();
    } catch (err: any) {
      toast.error('خطأ أثناء الرفض', err.message);
    } finally {
      setProcessingId(null);
    }
  };

  // Submit Approve Withdrawal Action
  const handleConfirmApproveWithdrawal = async () => {
    if (!approveWithdrawalModal) return;
    const { id, txHash, note, amount } = approveWithdrawalModal;

    setProcessingId(id);
    try {
      await api.admin.approveWithdrawal(id, { txHash: txHash.trim(), note: note.trim() });
      toast.success('تمت الموافقة على السحب بنجاح!', `تم تأكيد تحويل ${formatCurrency(amount)} للمستخدم.`);
      setApproveWithdrawalModal(null);
      await fetchData();
    } catch (err: any) {
      toast.error('خطأ في تأكيد السحب', err.message);
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-yellow-500" />
            <h1 className="text-2xl font-bold text-white">إدارة ومراجعة العمليات المالية</h1>
          </div>
          <p className="text-neutral-400 text-sm mt-1">
            مراجعة وتأكيد طلبات الإيداع والسحب المعلقة وإدارة العمليات المكتملة.
          </p>
        </div>

        <Button 
          variant="outline" 
          size="sm" 
          onClick={fetchData}
          className="self-start border-neutral-800 text-neutral-300 hover:text-white"
        >
          <RefreshCw className={cn("w-4 h-4 ml-2", loading && "animate-spin")} />
          تحديث البيانات
        </Button>
      </div>

      {/* Summary KPI Pills */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div 
          onClick={() => setActiveTab('PENDING_DEPOSITS')}
          className={cn(
            "p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between",
            activeTab === 'PENDING_DEPOSITS' 
              ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-400" 
              : "bg-neutral-900/40 border-neutral-800 hover:border-neutral-700 text-neutral-300"
          )}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400">
              <ArrowDownToLine className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs text-neutral-400 block font-medium">إيداعات معلقة</span>
              <span className="text-xl font-bold text-white">{pendingDeposits.length} طلب</span>
            </div>
          </div>
          {pendingDeposits.length > 0 && (
            <span className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></span>
          )}
        </div>

        <div 
          onClick={() => setActiveTab('PENDING_WITHDRAWALS')}
          className={cn(
            "p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between",
            activeTab === 'PENDING_WITHDRAWALS' 
              ? "bg-amber-500/10 border-amber-500/40 text-amber-400" 
              : "bg-neutral-900/40 border-neutral-800 hover:border-neutral-700 text-neutral-300"
          )}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-400">
              <ArrowUpFromLine className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs text-neutral-400 block font-medium">سحوبات معلقة</span>
              <span className="text-xl font-bold text-white">{pendingWithdrawals.length} طلب</span>
            </div>
          </div>
          {pendingWithdrawals.length > 0 && (
            <span className="w-3 h-3 bg-amber-500 rounded-full animate-pulse"></span>
          )}
        </div>

        <div 
          onClick={() => setActiveTab('ALL_HISTORY')}
          className={cn(
            "p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between",
            activeTab === 'ALL_HISTORY' 
              ? "bg-blue-500/10 border-blue-500/40 text-blue-400" 
              : "bg-neutral-900/40 border-neutral-800 hover:border-neutral-700 text-neutral-300"
          )}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs text-neutral-400 block font-medium">سجل العمليات بالكامل</span>
              <span className="text-xl font-bold text-white">{historyList.length} عملية</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Table Container */}
      <Card className="border-neutral-800 bg-neutral-900/40">
        <CardHeader className="p-4 sm:p-6 border-b border-neutral-800">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Tab Buttons */}
            <div className="flex items-center gap-1.5 p-1 bg-neutral-950 rounded-xl border border-neutral-800 overflow-x-auto">
              <button
                onClick={() => setActiveTab('PENDING_DEPOSITS')}
                className={cn(
                  "px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2",
                  activeTab === 'PENDING_DEPOSITS' 
                    ? "bg-emerald-500 text-neutral-950 shadow-md" 
                    : "text-neutral-400 hover:text-white"
                )}
              >
                <ArrowDownToLine className="w-3.5 h-3.5" />
                طلبات الإيداع المعلقة ({pendingDeposits.length})
              </button>

              <button
                onClick={() => setActiveTab('PENDING_WITHDRAWALS')}
                className={cn(
                  "px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2",
                  activeTab === 'PENDING_WITHDRAWALS' 
                    ? "bg-amber-500 text-neutral-950 shadow-md" 
                    : "text-neutral-400 hover:text-white"
                )}
              >
                <ArrowUpFromLine className="w-3.5 h-3.5" />
                طلبات السحب المعلقة ({pendingWithdrawals.length})
              </button>

              <button
                onClick={() => setActiveTab('ALL_HISTORY')}
                className={cn(
                  "px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2",
                  activeTab === 'ALL_HISTORY' 
                    ? "bg-neutral-800 text-white shadow-md" 
                    : "text-neutral-400 hover:text-white"
                )}
              >
                <Clock className="w-3.5 h-3.5" />
                السجل الكامل ({historyList.length})
              </button>
            </div>

            {/* Search Input */}
            <div className="relative w-full md:w-72">
              <Input
                placeholder="بحث بالمستخدم، البريد، أو كود TXID..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="text-xs bg-neutral-950 border-neutral-800 pr-9"
              />
              <Search className="w-4 h-4 text-neutral-500 absolute right-3 top-3 pointer-events-none" />
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {loading ? (
            <div className="p-12">
              <LoadingState message="جاري معالجة وجلب بيانات العمليات..." />
            </div>
          ) : error ? (
            <div className="p-8">
              <ErrorState message={error} onRetry={fetchData} />
            </div>
          ) : filteredList.length === 0 ? (
            <div className="p-16 text-center text-neutral-500">
              <ShieldCheck className="w-12 h-12 text-neutral-600 mx-auto mb-3" />
              <h3 className="text-base font-bold text-neutral-300 mb-1">لا توجد طلبات في هذا القسم</h3>
              <p className="text-xs text-neutral-500">جميع الطلبات معالجة أو لا توجد نتائج مطابقة للبحث.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-right">
                <thead className="text-xs text-neutral-400 uppercase bg-neutral-950/80 border-b border-neutral-800">
                  <tr>
                    <th className="px-6 py-4 font-bold">المستخدم</th>
                    <th className="px-6 py-4 font-bold">النوع والشبكة</th>
                    <th className="px-6 py-4 font-bold">المبلغ المطلوب</th>
                    <th className="px-6 py-4 font-bold">
                      {activeTab === 'PENDING_WITHDRAWALS' ? 'عنوان محفظة العميل (TRC20)' : 'كود المعاملة (TXID / Hash)'}
                    </th>
                    <th className="px-6 py-4 font-bold">التاريخ</th>
                    <th className="px-6 py-4 font-bold">الحالة</th>
                    <th className="px-6 py-4 font-bold text-center">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800/80">
                  {filteredList.map((tx) => {
                    const isDeposit = (tx.txType === 'DEPOSIT') || (!tx.txType && activeTab === 'PENDING_DEPOSITS');
                    const isPending = tx.status === 'PENDING';
                    const amount = Number(tx.amount) || 0;
                    const userName = tx.displayName || tx.username || 'مستخدم';
                    const userEmail = tx.userEmail || tx.email || '';
                    const vipLevel = tx.vipLevel ?? tx.user?.vipLevel ?? 0;
                    const refText = tx.reference || tx.txid || tx.address || '—';

                    return (
                      <tr key={tx.id} className="bg-neutral-950/30 hover:bg-neutral-900/60 transition-colors">
                        {/* User info */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-neutral-800 border border-neutral-700 flex items-center justify-center text-neutral-300 font-bold text-xs shrink-0">
                              {userName.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-white text-sm truncate">{userName}</span>
                                {vipLevel > 0 && (
                                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1">
                                    <Star className="w-2.5 h-2.5 fill-amber-400" />
                                    VIP {vipLevel}
                                  </span>
                                )}
                              </div>
                              <span className="text-xs text-neutral-400 font-mono block truncate" dir="ltr">
                                {userEmail || tx.userId?.substring(0, 10)}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Type & Network */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className={cn(
                              "w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border",
                              isDeposit ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                            )}>
                              {isDeposit ? <ArrowDownToLine className="w-3.5 h-3.5" /> : <ArrowUpFromLine className="w-3.5 h-3.5" />}
                            </div>
                            <div>
                              <span className="text-xs font-bold text-white block">
                                {isDeposit ? 'إيداع رصيد' : 'سحب أرباح'}
                              </span>
                              <span className="text-[10px] text-neutral-400 font-mono">
                                USDT TRC20
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Amount */}
                        <td className="px-6 py-4">
                          <span className={cn(
                            "text-base font-black font-mono",
                            isDeposit ? "text-emerald-400" : "text-amber-400"
                          )}>
                            {formatCurrency(amount)}
                          </span>
                        </td>

                        {/* TXID or Destination Address */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 max-w-xs">
                            <div 
                              className="font-mono text-xs text-neutral-300 truncate bg-neutral-900/90 px-2.5 py-1.5 rounded-lg border border-neutral-800 select-all cursor-pointer hover:border-neutral-700"
                              dir="ltr"
                              title={refText}
                              onClick={() => copyToClipboard(refText, tx.id)}
                            >
                              {refText}
                            </div>
                            <button
                              onClick={() => copyToClipboard(refText, tx.id)}
                              className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition-colors shrink-0"
                              title="نسخ"
                            >
                              {copiedId === tx.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </td>

                        {/* Date */}
                        <td className="px-6 py-4 text-xs text-neutral-400 font-mono">
                          {new Date(tx.createdAt).toLocaleDateString('ar-EG', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </td>

                        {/* Status */}
                        <td className="px-6 py-4">
                          <span className={cn(
                            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border",
                            tx.status === 'APPROVED' || tx.status === 'COMPLETED' ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                            tx.status === 'REJECTED' || tx.status === 'CANCELLED' ? "bg-red-500/10 text-red-400 border-red-500/20" :
                            "bg-amber-500/10 text-amber-400 border-amber-500/20 animate-pulse"
                          )}>
                            {tx.status === 'APPROVED' || tx.status === 'COMPLETED' ? <CheckCircle2 className="w-3.5 h-3.5" /> :
                             tx.status === 'REJECTED' || tx.status === 'CANCELLED' ? <XCircle className="w-3.5 h-3.5" /> :
                             <Clock className="w-3.5 h-3.5" />}
                            {tx.status === 'APPROVED' || tx.status === 'COMPLETED' ? 'مكتمل ومقبول' :
                             tx.status === 'REJECTED' || tx.status === 'CANCELLED' ? 'مرفوض' :
                             'قيد المراجعة'}
                          </span>
                          {tx.adminAction && (
                            <span className="text-[10px] text-neutral-500 block mt-1 truncate max-w-xs" title={tx.adminAction}>
                              {tx.adminAction}
                            </span>
                          )}
                        </td>

                        {/* Action Buttons */}
                        <td className="px-6 py-4 text-center">
                          {isPending ? (
                            <div className="flex items-center justify-center gap-2">
                              {/* Approve Button */}
                              <Button
                                size="sm"
                                disabled={processingId === tx.id}
                                onClick={() => {
                                  if (isDeposit) {
                                    handleApproveDeposit(tx.id, amount, userName);
                                  } else {
                                    setApproveWithdrawalModal({
                                      open: true,
                                      id: tx.id,
                                      amount,
                                      userName,
                                      userAddress: tx.reference || tx.address || '',
                                      txHash: '',
                                      note: ''
                                    });
                                  }
                                }}
                                className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs px-3 py-1.5 rounded-lg flex items-center gap-1 shadow-sm"
                              >
                                <Check className="w-3.5 h-3.5" />
                                قبول
                              </Button>

                              {/* Reject Button */}
                              <Button
                                size="sm"
                                variant="destructive"
                                disabled={processingId === tx.id}
                                onClick={() => {
                                  setRejectModal({
                                    open: true,
                                    id: tx.id,
                                    type: isDeposit ? 'DEPOSIT' : 'WITHDRAWAL',
                                    amount,
                                    userName,
                                    reason: isDeposit 
                                      ? 'كود المعاملة TXID غير متطابق أو غير موجود في شبكة البلوكتشين' 
                                      : 'عنوان المحفظة غير صحيح أو شبكة التحويل غير متطابقة'
                                  });
                                }}
                                className="text-xs px-3 py-1.5 rounded-lg flex items-center gap-1"
                              >
                                <X className="w-3.5 h-3.5" />
                                رفض
                              </Button>
                            </div>
                          ) : (
                            <span className="text-xs text-neutral-500 font-mono">تمت المعالجة</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reject Modal */}
      {rejectModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-red-400">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center border border-red-500/20">
                <AlertCircle className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-white">
                  رفض طلب {rejectModal.type === 'DEPOSIT' ? 'الإيداع' : 'السحب'}
                </h3>
                <span className="text-xs text-neutral-400">
                  المستخدم: {rejectModal.userName} | المبلغ: {formatCurrency(rejectModal.amount)}
                </span>
              </div>
            </div>

            {rejectModal.type === 'WITHDRAWAL' && (
              <div className="p-3 bg-amber-500/10 rounded-xl border border-amber-500/20 text-xs text-amber-300">
                ⚠️ <strong>ملاحظة أمان تلقائية:</strong> سيتم فك حجز المبلغ ({formatCurrency(rejectModal.amount)}) وإعادته فوراً إلى رصيد المستخدم المتاح في محفظته.
              </div>
            )}

            <div className="space-y-2">
              <label className="block text-xs font-semibold text-neutral-300">
                سبب الرفض (سيصل للمستخدم في قائمة الإشعارات)
              </label>
              <textarea
                rows={3}
                value={rejectModal.reason}
                onChange={e => setRejectModal({ ...rejectModal, reason: e.target.value })}
                placeholder="اكتب سبب الرفض هنا..."
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-red-500/50"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setRejectModal(null)}
              >
                إلغاء
              </Button>
              <Button
                variant="destructive"
                size="sm"
                isLoading={processingId === rejectModal.id}
                onClick={handleConfirmReject}
                className="font-bold"
              >
                تأكيد الرفض
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Approve Withdrawal Modal (With TX Hash) */}
      {approveWithdrawalModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-emerald-400">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-white">تأكيد تحويل طلب السحب</h3>
                <span className="text-xs text-neutral-400">
                  المستخدم: {approveWithdrawalModal.userName} | المبلغ: {formatCurrency(approveWithdrawalModal.amount)}
                </span>
              </div>
            </div>

            {/* Destination Address Info */}
            <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 space-y-1">
              <span className="text-[11px] text-neutral-400 block font-semibold">عنوان محفظة العميل للتحويل (TRC20):</span>
              <div className="font-mono text-xs text-yellow-400 break-all select-all flex items-center justify-between">
                <span>{approveWithdrawalModal.userAddress}</span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(approveWithdrawalModal.userAddress, 'modal-addr')}
                  className="p-1 text-neutral-400 hover:text-white"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  رقم عملية التحويل (TXID / Hash) - اختياري
                </label>
                <Input
                  placeholder="أدخل كود المعاملة بعد التحويل من محفظتك..."
                  value={approveWithdrawalModal.txHash}
                  onChange={e => setApproveWithdrawalModal({ ...approveWithdrawalModal, txHash: e.target.value })}
                  dir="ltr"
                  className="font-mono text-xs bg-neutral-950 border-neutral-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  ملاحظات إضافية (اختياري)
                </label>
                <Input
                  placeholder="ملاحظات تظهر للإدارة فقط..."
                  value={approveWithdrawalModal.note}
                  onChange={e => setApproveWithdrawalModal({ ...approveWithdrawalModal, note: e.target.value })}
                  className="text-xs bg-neutral-950 border-neutral-800"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setApproveWithdrawalModal(null)}
              >
                إلغاء
              </Button>
              <Button
                size="sm"
                isLoading={processingId === approveWithdrawalModal.id}
                onClick={handleConfirmApproveWithdrawal}
                className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold"
              >
                تأكيد التحويل والقبول
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
