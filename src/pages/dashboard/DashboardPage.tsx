import { useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useWallet } from '../../context/WalletContext';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { formatCurrency } from '../../lib/utils';
import { Wallet, CheckSquare, PlaySquare, ArrowUpRight, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../../components/ui/Button';

export default function DashboardPage() {
  const { profile } = useAuth();
  const { wallet, refreshWallet } = useWallet();

  useEffect(() => {
    refreshWallet();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">مرحباً، {profile?.displayName}</h1>
          <p className="text-neutral-400 mt-1">إليك نظرة عامة على حسابك اليوم.</p>
        </div>
        <div className="hidden sm:block">
          <Link to="/dashboard/wallet">
            <Button variant="outline" size="sm">
              إيداع الرصيد
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-yellow-500/10 to-transparent border-yellow-500/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-neutral-400">الرصيد المتاح</CardTitle>
            <Wallet className="w-4 h-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-500">
              {formatCurrency(wallet?.availableBalance || 0)}
            </div>
            <p className="text-xs text-neutral-500 mt-1">رصيد قابل للسحب</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-neutral-400">إجمالي الأرباح</CardTitle>
            <ArrowUpRight className="w-4 h-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(wallet?.totalEarnings || 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-neutral-400">إجمالي السحوبات</CardTitle>
            <CheckSquare className="w-4 h-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(wallet?.totalWithdrawals || 0)}</div>
            <p className="text-xs text-neutral-500 mt-1">المبالغ المسحوبة بنجاح</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-neutral-400">الرصيد المعلق</CardTitle>
            <Clock className="w-4 h-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(wallet?.pendingBalance || 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions & Info */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <Card>
          <CardHeader>
            <CardTitle>اشتراك VIP</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between bg-neutral-900/50 p-4 rounded-xl border border-neutral-800">
              <div>
                <p className="font-semibold">المستوى الحالي: VIP {profile?.vipLevel || 0}</p>
                <p className="text-sm text-neutral-400 mt-1">قم بترقية حسابك لزيادة أرباحك اليومية.</p>
              </div>
              <Link to="/dashboard/vip">
                <Button variant="primary" size="sm">ترقية</Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>ابدأ الربح الآن</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <Link to="/dashboard/tasks" className="flex flex-col items-center justify-center p-6 bg-neutral-900/50 rounded-xl border border-neutral-800 hover:border-yellow-500/50 transition-colors group">
                <CheckSquare className="w-8 h-8 text-neutral-500 group-hover:text-yellow-500 mb-3 transition-colors" />
                <span className="font-medium">إنجاز المهام</span>
              </Link>
              <Link to="/dashboard/ads" className="flex flex-col items-center justify-center p-6 bg-neutral-900/50 rounded-xl border border-neutral-800 hover:border-yellow-500/50 transition-colors group">
                <PlaySquare className="w-8 h-8 text-neutral-500 group-hover:text-yellow-500 mb-3 transition-colors" />
                <span className="font-medium">مشاهدة الإعلانات</span>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
