import React, { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { LoadingState } from '../../components/ui/LoadingState';
import { ErrorState } from '../../components/ui/ErrorState';
import { useToast } from '../../components/ui/Toast';
import { formatCurrency, cn } from '../../lib/utils';
import { 
  Users, 
  Search, 
  ShieldCheck, 
  ShieldAlert, 
  Star, 
  Wallet, 
  DollarSign, 
  PlusCircle, 
  MinusCircle, 
  Ban, 
  CheckCircle2, 
  RefreshCw,
  Phone,
  Mail,
  Calendar,
  Lock,
  ArrowUpRight,
  TrendingUp,
  UserCheck
} from 'lucide-react';
import { api } from '../../lib/api';

export default function AdminUsers() {
  const toast = useToast();

  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [vipFilter, setVipFilter] = useState('ALL');

  // Modals state
  const [adjustModal, setAdjustModal] = useState<{
    open: boolean;
    userId: string;
    userName: string;
    currentBalance: number;
    amount: string;
    reason: string;
    type: 'ADD' | 'DEDUCT';
  } | null>(null);

  const [vipModal, setVipModal] = useState<{
    open: boolean;
    userId: string;
    userName: string;
    currentVip: number;
    newVip: number;
  } | null>(null);

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.admin.getUsers();
      setUsers(data.users || []);
    } catch (err: any) {
      setError(err.message || 'فشل في تحميل قائمة المستخدمين');
    } finally {
      setLoading(false);
    }
  };

  // Filtered list
  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const fullStr = `${u.displayName || ''} ${u.username || ''} ${u.email || ''} ${u.phone || ''} ${u.id || ''}`.toLowerCase();
        if (!fullStr.includes(q)) return false;
      }

      // Status
      if (statusFilter !== 'ALL' && u.status !== statusFilter) return false;

      // VIP
      if (vipFilter !== 'ALL' && u.vipLevel !== parseInt(vipFilter, 10)) return false;

      return true;
    });
  }, [users, searchQuery, statusFilter, vipFilter]);

  // Toggle Ban / Activate
  const handleToggleStatus = async (userId: string, currentStatus: string, userName: string) => {
    const newStatus = currentStatus === 'ACTIVE' ? 'BANNED' : 'ACTIVE';
    const actionName = newStatus === 'BANNED' ? 'حظر' : 'إلغاء حظر وتفعيل';

    if (!confirm(`هل أنت متأكد من ${actionName} حساب المستخدم (${userName})؟`)) return;

    try {
      await api.admin.updateUserStatus(userId, newStatus);
      toast.success(`تم ${actionName} المستخدم بنجاح`);
      setUsers(prev => prev.map(u => (u.id || u.userId) === userId ? { ...u, status: newStatus } : u));
    } catch (err: any) {
      toast.error('فشل في تعديل حالة المستخدم', err.message);
    }
  };

  // Submit Wallet Adjustment
  const handleConfirmAdjust = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustModal) return;

    const amountNum = parseFloat(adjustModal.amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      toast.warning('يرجى إدخال مبلغ صحيح أكبر من 0$');
      return;
    }

    if (!adjustModal.reason.trim()) {
      toast.warning('يرجى كتابة سبب التعديل');
      return;
    }

    setSubmitting(true);
    try {
      await api.admin.adjustWallet(
        adjustModal.userId,
        amountNum,
        adjustModal.reason.trim(),
        adjustModal.type
      );

      toast.success(
        'تم تعديل رصيد المستخدم بنجاح!',
        `تم ${adjustModal.type === 'ADD' ? 'إضافة' : 'خصم'} ${formatCurrency(amountNum)} من محفظة ${adjustModal.userName}.`
      );

      setAdjustModal(null);
      await fetchUsers();
    } catch (err: any) {
      toast.error('فشل في تعديل الرصيد', err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Submit VIP change
  const handleConfirmVipChange = async () => {
    if (!vipModal) return;

    setSubmitting(true);
    try {
      await api.admin.updateUserVip(vipModal.userId, vipModal.newVip);
      toast.success(
        'تم تحديث باقة VIP بنجاح!',
        `تمت ترقية ${vipModal.userName} إلى VIP ${vipModal.newVip}.`
      );
      setVipModal(null);
      await fetchUsers();
    } catch (err: any) {
      toast.error('فشل في ترقية الباقة', err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-6 h-6 text-yellow-500" />
            <h1 className="text-2xl font-bold text-white">إدارة المستخدمين والأرصدة</h1>
          </div>
          <p className="text-neutral-400 text-sm mt-1">
            عرض بيانات المشتركين، ضبط الأرصدة يدوياً، ترقية باقات VIP، وإدارة حالات الحسابات.
          </p>
        </div>

        <Button 
          variant="outline" 
          size="sm" 
          onClick={fetchUsers}
          className="self-start border-neutral-800 text-neutral-300 hover:text-white"
        >
          <RefreshCw className={cn("w-4 h-4 ml-2", loading && "animate-spin")} />
          تحديث
        </Button>
      </div>

      {/* Main Table Card */}
      <Card className="border-neutral-800 bg-neutral-900/40">
        <CardHeader className="p-4 sm:p-6 border-b border-neutral-800 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Input
                placeholder="بحث بالاسم، اسم المستخدم، البريد، أو الهاتف..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="text-xs bg-neutral-950 border-neutral-800 pr-9"
              />
              <Search className="w-4 h-4 text-neutral-500 absolute right-3 top-3 pointer-events-none" />
            </div>

            {/* Filters */}
            <div className="flex items-center gap-2 overflow-x-auto">
              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-300 focus:outline-none focus:border-yellow-500/50"
              >
                <option value="ALL">جميع الحالات</option>
                <option value="ACTIVE">نشط (Active)</option>
                <option value="BANNED">محظور (Banned)</option>
              </select>

              {/* VIP Filter */}
              <select
                value={vipFilter}
                onChange={e => setVipFilter(e.target.value)}
                className="bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-300 focus:outline-none focus:border-yellow-500/50"
              >
                <option value="ALL">جميع الباقات (VIP)</option>
                <option value="0">VIP 0 (مجاني)</option>
                <option value="1">VIP 1</option>
                <option value="2">VIP 2</option>
                <option value="3">VIP 3</option>
                <option value="4">VIP 4</option>
                <option value="5">VIP 5</option>
              </select>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {loading ? (
            <div className="p-12">
              <LoadingState message="جاري جلب قائمة المستخدمين والأرصدة..." />
            </div>
          ) : error ? (
            <div className="p-8">
              <ErrorState message={error} onRetry={fetchUsers} />
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-16 text-center text-neutral-500">
              <Users className="w-12 h-12 text-neutral-600 mx-auto mb-3" />
              <h3 className="text-base font-bold text-neutral-300 mb-1">لا يوجد مستخدمين مطابقين</h3>
              <p className="text-xs text-neutral-500">جرّب تغيير كلمات البحث أو خيارات الفلترة.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-right">
                <thead className="text-xs text-neutral-400 uppercase bg-neutral-950/80 border-b border-neutral-800">
                  <tr>
                    <th className="px-6 py-4 font-bold">المستخدم</th>
                    <th className="px-6 py-4 font-bold">باقة VIP</th>
                    <th className="px-6 py-4 font-bold">الرصيد المتاح</th>
                    <th className="px-6 py-4 font-bold">الرصيد المعلق</th>
                    <th className="px-6 py-4 font-bold">إجمالي الأرباح</th>
                    <th className="px-6 py-4 font-bold">الحالة</th>
                    <th className="px-6 py-4 font-bold text-center">إجراءات الإدارة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800/80">
                  {filteredUsers.map((u) => {
                    const userId = u.id || u.userId;
                    const userName = u.displayName || u.username || 'مستخدم';
                    const available = Number(u.availableBalance) || 0;
                    const pending = Number(u.pendingBalance) || 0;
                    const earnings = Number(u.totalEarnings) || 0;
                    const isBanned = u.status === 'BANNED';
                    const isAdmin = u.role === 'ADMIN';

                    return (
                      <tr key={userId} className="bg-neutral-950/30 hover:bg-neutral-900/60 transition-colors">
                        {/* User info */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-neutral-800 border border-neutral-700 flex items-center justify-center text-yellow-500 font-bold text-sm shrink-0">
                              {userName.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-white text-sm truncate">{userName}</span>
                                {isAdmin && (
                                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-500/10 text-red-400 border border-red-500/20">
                                    ADMIN
                                  </span>
                                )}
                              </div>
                              <span className="text-xs text-neutral-400 font-mono block truncate" dir="ltr">
                                {u.email}
                              </span>
                              {u.phone && (
                                <span className="text-[11px] text-neutral-500 font-mono block" dir="ltr">
                                  {u.phone}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* VIP Level */}
                        <td className="px-6 py-4">
                          <button
                            onClick={() => setVipModal({
                              open: true,
                              userId,
                              userName,
                              currentVip: u.vipLevel ?? 0,
                              newVip: u.vipLevel ?? 0,
                            })}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30 hover:bg-amber-500/20 transition-colors"
                            title="اضغط لتغيير الباقة"
                          >
                            <Star className="w-3.5 h-3.5 fill-amber-400" />
                            VIP {u.vipLevel ?? 0}
                          </button>
                        </td>

                        {/* Available Balance */}
                        <td className="px-6 py-4">
                          <span className="font-bold font-mono text-white text-sm">
                            {formatCurrency(available)}
                          </span>
                        </td>

                        {/* Pending Balance */}
                        <td className="px-6 py-4">
                          <span className={cn(
                            "font-mono text-xs",
                            pending > 0 ? "text-amber-400 font-bold" : "text-neutral-500"
                          )}>
                            {formatCurrency(pending)}
                          </span>
                        </td>

                        {/* Total Earnings */}
                        <td className="px-6 py-4">
                          <span className="font-bold font-mono text-emerald-400 text-xs">
                            {formatCurrency(earnings)}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="px-6 py-4">
                          <span className={cn(
                            "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border",
                            isBanned ? "bg-red-500/10 text-red-400 border-red-500/20" : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                          )}>
                            {isBanned ? <Ban className="w-3 h-3" /> : <CheckCircle2 className="w-3 h-3" />}
                            {isBanned ? 'محظور' : 'نشط'}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            {/* Adjust Wallet */}
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => setAdjustModal({
                                open: true,
                                userId,
                                userName,
                                currentBalance: available,
                                amount: '',
                                reason: '',
                                type: 'ADD'
                              })}
                              className="text-xs bg-neutral-800 hover:bg-neutral-700 text-yellow-400 flex items-center gap-1 px-2.5 py-1"
                              title="تعديل الرصيد (إضافة / خصم)"
                            >
                              <Wallet className="w-3.5 h-3.5" />
                              تعديل الرصيد
                            </Button>

                            {/* Ban / Activate Toggle */}
                            <Button
                              size="sm"
                              variant={isBanned ? "outline" : "ghost"}
                              onClick={() => handleToggleStatus(userId, u.status, userName)}
                              className={cn(
                                "text-xs px-2.5 py-1",
                                isBanned ? "border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10" : "text-neutral-400 hover:text-red-400 hover:bg-red-500/10"
                              )}
                            >
                              {isBanned ? 'تفعيل' : 'حظر'}
                            </Button>
                          </div>
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

      {/* Adjust Wallet Modal */}
      {adjustModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-yellow-500/10 flex items-center justify-center border border-yellow-500/20 text-yellow-500">
                <Wallet className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-white">تعديل رصيد المحفظة</h3>
                <span className="text-xs text-neutral-400">
                  المستخدم: {adjustModal.userName} | الرصيد الحالي: {formatCurrency(adjustModal.currentBalance)}
                </span>
              </div>
            </div>

            <form onSubmit={handleConfirmAdjust} className="space-y-4">
              {/* Type Switcher */}
              <div className="grid grid-cols-2 gap-2 p-1 bg-neutral-950 rounded-xl border border-neutral-800">
                <button
                  type="button"
                  onClick={() => setAdjustModal({ ...adjustModal, type: 'ADD' })}
                  className={cn(
                    "py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors",
                    adjustModal.type === 'ADD' ? "bg-emerald-500 text-neutral-950 shadow" : "text-neutral-400 hover:text-white"
                  )}
                >
                  <PlusCircle className="w-4 h-4" />
                  إضافة رصيد (Bonus/Deposit)
                </button>
                <button
                  type="button"
                  onClick={() => setAdjustModal({ ...adjustModal, type: 'DEDUCT' })}
                  className={cn(
                    "py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors",
                    adjustModal.type === 'DEDUCT' ? "bg-red-500 text-white shadow" : "text-neutral-400 hover:text-white"
                  )}
                >
                  <MinusCircle className="w-4 h-4" />
                  خصم رصيد (Deduct)
                </button>
              </div>

              {/* Amount */}
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  المبلغ بالدولار ($ USD)
                </label>
                <div className="relative">
                  <Input
                    type="number"
                    min="0.01"
                    step="0.01"
                    placeholder="مثال: 50.00"
                    value={adjustModal.amount}
                    onChange={e => setAdjustModal({ ...adjustModal, amount: e.target.value })}
                    required
                    dir="ltr"
                    className="bg-neutral-950 border-neutral-800 font-mono text-sm"
                  />
                  <span className="absolute left-3 top-2.5 text-xs text-neutral-500 font-bold">$</span>
                </div>
              </div>

              {/* Reason */}
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  سبب التعديل والبيان
                </label>
                <Input
                  placeholder="مثال: مكافأة ترقية، تسوية خطأ تحويل، جائزة نشاط..."
                  value={adjustModal.reason}
                  onChange={e => setAdjustModal({ ...adjustModal, reason: e.target.value })}
                  required
                  className="bg-neutral-950 border-neutral-800 text-xs"
                />
                <p className="text-[11px] text-neutral-500 mt-1">
                  سيتم توثيق هذا البيان في سجل معاملات العميل وإرسال إشعار فوري له.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setAdjustModal(null)}
                >
                  إلغاء
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  isLoading={submitting}
                  className={cn(
                    "font-bold text-white",
                    adjustModal.type === 'ADD' ? "bg-emerald-500 hover:bg-emerald-600" : "bg-red-500 hover:bg-red-600"
                  )}
                >
                  تأكيد {adjustModal.type === 'ADD' ? 'الإضافة' : 'الخصم'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Change VIP Modal */}
      {vipModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20 text-amber-400">
                <Star className="w-5 h-5 fill-amber-400" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-white">ترقية باقة VIP</h3>
                <span className="text-xs text-neutral-400">
                  المستخدم: {vipModal.userName} (حالياً VIP {vipModal.currentVip})
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-semibold text-neutral-300">
                اختر المستوى الجديد:
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[0, 1, 2, 3, 4, 5].map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setVipModal({ ...vipModal, newVip: lvl })}
                    className={cn(
                      "p-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all",
                      vipModal.newVip === lvl 
                        ? "bg-amber-500/20 border-amber-500 text-amber-400" 
                        : "bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-700"
                    )}
                  >
                    <Star className={cn("w-4 h-4", vipModal.newVip === lvl && "fill-amber-400")} />
                    VIP {lvl}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setVipModal(null)}
              >
                إلغاء
              </Button>
              <Button
                size="sm"
                isLoading={submitting}
                onClick={handleConfirmVipChange}
                className="bg-amber-500 hover:bg-amber-600 text-neutral-950 font-bold"
              >
                تطبيق الترقية
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
