import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { LoadingState } from '../../components/ui/LoadingState';
import { useToast } from '../../components/ui/Toast';
import { 
  Users, 
  WalletCards, 
  ArrowDownToLine, 
  ArrowUpFromLine, 
  TrendingUp, 
  Clock, 
  Settings, 
  ShieldCheck, 
  ExternalLink,
  RefreshCw,
  Sparkles,
  Layers,
  Award,
  AlertCircle,
  CreditCard
} from 'lucide-react';
import { formatCurrency, cn } from '../../lib/utils';
import { api } from '../../lib/api';
import { Link } from 'react-router-dom';

export default function AdminDashboard() {
  const toast = useToast();

  const [stats, setStats] = useState<any>({
    totalUsers: 0,
    activeUsers: 0,
    totalDeposits: 0,
    totalWithdrawals: 0,
    totalEarnings: 0,
    pendingDepositsCount: 0,
    pendingWithdrawalsCount: 0,
    pendingTransactionsCount: 0
  });

  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [statsRes, reqsRes] = await Promise.all([
        api.admin.getStats().catch(() => null),
        api.admin.getFinancialRequests().catch(() => null),
      ]);

      if (statsRes?.stats) {
        setStats(statsRes.stats);
      }

      if (reqsRes) {
        const pendingDeps = (reqsRes.deposits || []).filter((d: any) => d.status === 'PENDING').map((d: any) => ({ ...d, kind: 'DEPOSIT' }));
        const pendingWiths = (reqsRes.withdrawals || []).filter((w: any) => w.status === 'PENDING').map((w: any) => ({ ...w, kind: 'WITHDRAWAL' }));
        setPendingRequests([...pendingDeps, ...pendingWiths].slice(0, 5));
      }
    } catch (err: any) {
      toast.error('فشل في جلب إحصائيات لوحة التحكم', err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingState message="جاري إعداد بيانات لوحة التحكم الإدارية..." />;
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-7 h-7 text-yellow-500" />
            <h1 className="text-2xl font-bold text-white">لوحة الإدارة والتحكم الشاملة</h1>
          </div>
          <p className="text-neutral-400 text-sm mt-1">
            نظرة عامة ومباشرة على أداء المنصة المالي، نشاط المستخدمين، والطلبات المعلقة.
          </p>
        </div>

        <Button 
          variant="outline" 
          size="sm" 
          onClick={fetchDashboardData}
          className="self-start border-neutral-800 text-neutral-300 hover:text-white"
        >
          <RefreshCw className="w-4 h-4 ml-2" />
          تحديث الإحصائيات
        </Button>
      </div>

      {/* Primary KPI Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Users */}
        <Card className="border-neutral-800 bg-neutral-900/40">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-neutral-400">إجمالي المستخدمين</CardTitle>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/20">
              <Users className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-white">{stats.totalUsers}</div>
            <p className="text-xs text-neutral-500 mt-1">
              النشطين: <span className="text-emerald-400 font-bold">{stats.activeUsers || stats.totalUsers}</span> حساب
            </p>
          </CardContent>
        </Card>

        {/* Pending Financial Requests */}
        <Link to="/admin/transactions" className="block">
          <Card className={cn(
            "border transition-all hover:border-amber-500/50",
            (stats.pendingTransactionsCount > 0 || stats.pendingDepositsCount > 0 || stats.pendingWithdrawalsCount > 0)
              ? "bg-amber-500/5 border-amber-500/30"
              : "border-neutral-800 bg-neutral-900/40"
          )}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-semibold text-neutral-400">الطلبات المعلقة (مراجعة)</CardTitle>
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
                <Clock className="w-4 h-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-black text-amber-400">
                {stats.pendingTransactionsCount || (stats.pendingDepositsCount + stats.pendingWithdrawalsCount)}
              </div>
              <p className="text-xs text-neutral-400 mt-1 flex items-center gap-1">
                <span>{stats.pendingDepositsCount || 0} إيداع</span> • <span>{stats.pendingWithdrawalsCount || 0} سحب</span>
              </p>
            </CardContent>
          </Card>
        </Link>

        {/* Total Deposits */}
        <Card className="border-neutral-800 bg-neutral-900/40">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-neutral-400">إجمالي الإيداعات المقبولة</CardTitle>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
              <ArrowDownToLine className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-emerald-400 font-mono">
              {formatCurrency(stats.totalDeposits || 0)}
            </div>
            <p className="text-xs text-neutral-500 mt-1 font-mono">USDT TRC20</p>
          </CardContent>
        </Card>

        {/* Total Withdrawals */}
        <Card className="border-neutral-800 bg-neutral-900/40">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-neutral-400">إجمالي السحوبات المكتملة</CardTitle>
            <div className="w-8 h-8 rounded-lg bg-red-500/10 text-red-400 flex items-center justify-center border border-red-500/20">
              <ArrowUpFromLine className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-white font-mono">
              {formatCurrency(stats.totalWithdrawals || 0)}
            </div>
            <p className="text-xs text-neutral-500 mt-1 font-mono">تم تحويلها للعملاء</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Action Navigation Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link to="/admin/payment-methods" className="group">
          <div className="p-5 rounded-2xl bg-neutral-900/40 border border-neutral-800 group-hover:border-yellow-500/50 group-hover:bg-neutral-900/80 transition-all space-y-2 h-full flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-yellow-500/10 text-yellow-500 flex items-center justify-center border border-yellow-500/20">
                  <CreditCard className="w-5 h-5" />
                </div>
                <ExternalLink className="w-4 h-4 text-neutral-600 group-hover:text-yellow-500 transition-colors" />
              </div>
              <h3 className="font-bold text-white text-base">وسائل وطرق الدفع</h3>
              <p className="text-xs text-neutral-400">
                إضافة وتعديل وسائل الإيداع والسحب (USDT, Sham Cash, Payeer وغيرها) والحدود المالية.
              </p>
            </div>
          </div>
        </Link>

        <Link to="/admin/transactions" className="group">
          <div className="p-5 rounded-2xl bg-neutral-900/40 border border-neutral-800 group-hover:border-yellow-500/50 group-hover:bg-neutral-900/80 transition-all space-y-2 h-full flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-yellow-500/10 text-yellow-500 flex items-center justify-center border border-yellow-500/20">
                  <WalletCards className="w-5 h-5" />
                </div>
                <ExternalLink className="w-4 h-4 text-neutral-600 group-hover:text-yellow-500 transition-colors" />
              </div>
              <h3 className="font-bold text-white text-base">مراجعة الإيداعات والسحوبات</h3>
              <p className="text-xs text-neutral-400">
                قبول أو رفض الإيداعات عبر TXID، ومراجعة طلبات السحب مع إعادة الرصيد التلقائي عند الرفض.
              </p>
            </div>
          </div>
        </Link>

        <Link to="/admin/settings" className="group">
          <div className="p-5 rounded-2xl bg-neutral-900/40 border border-neutral-800 group-hover:border-yellow-500/50 group-hover:bg-neutral-900/80 transition-all space-y-2 h-full flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/20">
                  <Settings className="w-5 h-5" />
                </div>
                <ExternalLink className="w-4 h-4 text-neutral-600 group-hover:text-blue-400 transition-colors" />
              </div>
              <h3 className="font-bold text-white text-base">إعدادات النظام والمحفظة</h3>
              <p className="text-xs text-neutral-400">
                تغيير عنوان محفظة USDT الرسمية، تعيين الحدود العامة، ونشر التنبيهات.
              </p>
            </div>
          </div>
        </Link>

        <Link to="/admin/users" className="group">
          <div className="p-5 rounded-2xl bg-neutral-900/40 border border-neutral-800 group-hover:border-yellow-500/50 group-hover:bg-neutral-900/80 transition-all space-y-2 h-full flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
                  <Users className="w-5 h-5" />
                </div>
                <ExternalLink className="w-4 h-4 text-neutral-600 group-hover:text-emerald-400 transition-colors" />
              </div>
              <h3 className="font-bold text-white text-base">إدارة المستخدمين والأرصدة</h3>
              <p className="text-xs text-neutral-400">
                تعديل أرصدة المشتركين يدوياً، ترقية باقات VIP الفورية، وحظر أو تفعيل الحسابات.
              </p>
            </div>
          </div>
        </Link>
      </div>

      {/* Pending Transactions Quick Review Section */}
      {pendingRequests.length > 0 && (
        <Card className="border-neutral-800 bg-neutral-900/40">
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-400" />
              <CardTitle className="text-base text-white">طلبات معلقة حديثة بانتظار المراجعة</CardTitle>
            </div>
            <Link to="/admin/transactions">
              <Button variant="ghost" size="sm" className="text-xs text-yellow-400 hover:text-yellow-300">
                عرض جميع الطلبات ({stats.pendingTransactionsCount || pendingRequests.length}) ←
              </Button>
            </Link>
          </CardHeader>

          <CardContent className="p-0">
            <div className="divide-y divide-neutral-800">
              {pendingRequests.map((req) => {
                const isDep = req.kind === 'DEPOSIT';
                const userName = req.displayName || req.username || 'مستخدم';
                const amount = Number(req.amount) || 0;

                return (
                  <div key={req.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-neutral-950/40 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs border shrink-0",
                        isDep ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                      )}>
                        {isDep ? <ArrowDownToLine className="w-4 h-4" /> : <ArrowUpFromLine className="w-4 h-4" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-sm">{userName}</span>
                          <span className="text-xs text-neutral-400">طلب {isDep ? 'إيداع' : 'سحب'}</span>
                        </div>
                        <span className="font-mono text-xs text-neutral-500 block truncate max-w-xs" dir="ltr">
                          {req.reference || req.txid || req.address || '—'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-4">
                      <span className={cn(
                        "font-mono font-bold text-base",
                        isDep ? "text-emerald-400" : "text-amber-400"
                      )}>
                        {formatCurrency(amount)}
                      </span>

                      <Link to="/admin/transactions">
                        <Button size="sm" variant="outline" className="text-xs border-neutral-800 text-neutral-300 hover:text-white">
                          مراجعة الطلب
                        </Button>
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
