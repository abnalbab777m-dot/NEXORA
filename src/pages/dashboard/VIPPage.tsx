import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { LoadingState } from '../../components/ui/LoadingState';
import { 
  Check, 
  Star, 
  Crown, 
  Zap, 
  ShieldCheck, 
  ArrowUpRight, 
  Wallet as WalletIcon, 
  TrendingUp, 
  Layers, 
  Tv, 
  AlertCircle, 
  CheckCircle2, 
  X,
  Sparkles,
  ChevronRight
} from 'lucide-react';
import { VipPlan, Wallet } from '../../types/models';
import { formatCurrency } from '../../lib/utils';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import { Link } from 'react-router-dom';

// Expected profit calculation helper based on plan level & stats
const getPlanProfitEstimates = (plan: VipPlan) => {
  switch (plan.level) {
    case 1: // $30
      return { dailyProfit: 4.0, monthlyProfit: 120.0, taskRate: 0.60, adRate: 0.20, badge: 'الأكثر شيوعاً للمبتدئين' };
    case 2: // $50
      return { dailyProfit: 7.5, monthlyProfit: 225.0, taskRate: 0.75, adRate: 0.22, badge: 'قيمة ممتازة' };
    case 3: // $100
      return { dailyProfit: 16.0, monthlyProfit: 480.0, taskRate: 1.10, adRate: 0.28, badge: 'الأكثر طلباً' };
    case 4: // $300
      return { dailyProfit: 55.0, monthlyProfit: 1650.0, taskRate: 2.20, adRate: 0.55, badge: 'أرباح متقدمة' };
    case 5: // $800
      return { dailyProfit: 160.0, monthlyProfit: 4800.0, taskRate: 3.80, adRate: 0.90, badge: 'الباقة البلاتينية' };
    default: {
      const daily = Number((plan.dailyTasks * 0.75 + plan.dailyAds * 0.25).toFixed(2));
      return {
        dailyProfit: daily,
        monthlyProfit: Number((daily * plan.durationDays).toFixed(2)),
        taskRate: 0.75,
        adRate: 0.25,
        badge: `VIP ${plan.level}`
      };
    }
  }
};

export default function VIPPage() {
  const { user, refreshUser } = useAuth();
  const [plans, setPlans] = useState<VipPlan[]>([]);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [loading, setLoading] = useState(true);
  const [submittingPlanId, setSubmittingPlanId] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<VipPlan | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [plansRes, walletRes] = await Promise.all([
        api.getVipPlans().catch(() => ({ plans: [], vipPlans: [] })),
        api.getWallet().catch(() => ({ wallet: null }))
      ]);

      const planList: VipPlan[] = plansRes.vipPlans || plansRes.plans || [];
      // Sort plans by level ascending
      planList.sort((a, b) => a.level - b.level);
      setPlans(planList);

      if (walletRes && walletRes.wallet) {
        setWallet(walletRes.wallet);
      }
    } catch (err) {
      console.error('Error loading VIP data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenConfirm = (plan: VipPlan) => {
    setError(null);
    setSelectedPlan(plan);
  };

  const handleSubscribe = async () => {
    if (!selectedPlan) return;
    
    const planId = selectedPlan.id || selectedPlan.planId;
    if (!planId) return;

    setError(null);
    setSubmittingPlanId(planId);

    try {
      const res = await api.subscribeVip(planId);
      await refreshUser();
      
      // Reload wallet to reflect updated balance
      try {
        const walletRes = await api.getWallet();
        if (walletRes && walletRes.wallet) {
          setWallet(walletRes.wallet);
        }
      } catch (wErr) {
        console.error('Wallet reload error:', wErr);
      }

      setSuccessMessage(res.message || `تهانينا! تمت الترقية إلى ${selectedPlan.name} بنجاح.`);
      setSelectedPlan(null);
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء ترقية الباقة. يرجى المحاولة مرة أخرى.');
    } finally {
      setSubmittingPlanId(null);
    }
  };

  if (loading) {
    return <LoadingState message="جاري تحميل باقات VIP المتوفرة..." />;
  }

  const currentVipLevel = user?.vipLevel || 0;
  const availableBalance = wallet ? Number(wallet.availableBalance || 0) : 0;

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-amber-500/10 via-neutral-900 to-neutral-950 border border-amber-500/20 p-6 md:p-10 text-center">
        <div className="absolute -top-24 -left-24 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-yellow-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-sm font-medium">
            <Crown className="w-4 h-4 text-amber-400" />
            <span>نظام عضويات VIP المتقدم</span>
          </div>

          <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
            ارتقِ بمستوى أرباحك مع باقات <span className="text-amber-400">VIP</span>
          </h1>
          
          <p className="text-neutral-400 text-sm md:text-base leading-relaxed">
            اشترك في إحدى باقات VIP لتتمتع بمهام يومية أكبر، عوائد إعلانية أعلى، وسحب أرباح فوري بدون تأخير، يتم خصم قيمة الباقة مباشرة من رصيدك المتاح.
          </p>

          {/* Current VIP Status & Wallet Bar */}
          <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
            <div className="flex items-center gap-3 bg-neutral-900/90 border border-neutral-800 px-5 py-2.5 rounded-xl shadow-inner">
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-400">
                <Star className="w-4 h-4 fill-amber-400" />
              </div>
              <div className="text-right">
                <span className="text-xs text-neutral-400 block">مستواك الحالي</span>
                <span className="text-sm font-bold text-white">
                  {currentVipLevel === 0 ? 'المستوى المجاني (VIP 0)' : `باقة VIP ${currentVipLevel}`}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-neutral-900/90 border border-neutral-800 px-5 py-2.5 rounded-xl shadow-inner">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                <WalletIcon className="w-4 h-4" />
              </div>
              <div className="text-right">
                <span className="text-xs text-neutral-400 block">الرصيد المتاح للشراء</span>
                <span className="text-sm font-bold text-emerald-400">
                  {formatCurrency(availableBalance)}
                </span>
              </div>
            </div>

            <Link
              to="/dashboard/deposit"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold border border-neutral-700 transition"
            >
              <span>شحن الرصيد</span>
              <ChevronRight className="w-4 h-4 rotate-180" />
            </Link>
          </div>
        </div>
      </div>

      {/* Success Notification Alert */}
      {successMessage && (
        <div className="bg-emerald-950/60 border border-emerald-500/40 rounded-xl p-4 flex items-center justify-between gap-3 text-emerald-200 animate-in fade-in">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
            <span className="text-sm font-medium">{successMessage}</span>
          </div>
          <button 
            onClick={() => setSuccessMessage(null)}
            className="text-emerald-400 hover:text-emerald-300 p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* VIP Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {plans.map((plan) => {
          const isCurrent = currentVipLevel === plan.level;
          const isPassed = currentVipLevel > plan.level;
          const canUpgrade = currentVipLevel < plan.level;
          const hasEnoughBalance = availableBalance >= plan.price;
          const { dailyProfit, monthlyProfit, badge } = getPlanProfitEstimates(plan);

          return (
            <Card 
              key={plan.id || plan.planId || plan.level} 
              className={`relative overflow-hidden rounded-2xl transition-all duration-300 flex flex-col justify-between border ${
                isCurrent 
                  ? 'border-amber-500 bg-neutral-900/90 shadow-lg shadow-amber-500/10 ring-1 ring-amber-500' 
                  : plan.level === 3 
                    ? 'border-amber-500/40 bg-neutral-900/60 hover:border-amber-500/70 hover:shadow-md' 
                    : 'border-neutral-800 bg-neutral-900/40 hover:border-neutral-700'
              }`}
            >
              {/* Top Badge */}
              <div className="flex items-center justify-between px-6 pt-5">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <Crown className="w-3.5 h-3.5" />
                  {plan.name}
                </span>

                {isCurrent ? (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500 text-neutral-950">
                    مستواك الحالي
                  </span>
                ) : (
                  <span className="text-xs text-neutral-400">
                    {badge}
                  </span>
                )}
              </div>

              <CardHeader className="pt-4 pb-2 text-center">
                <div className="flex items-baseline justify-center gap-1.5">
                  <span className="text-4xl font-black text-white tracking-tight">
                    {formatCurrency(plan.price)}
                  </span>
                  <span className="text-xs text-neutral-400 font-medium">
                    / {plan.durationDays} يوم
                  </span>
                </div>
              </CardHeader>

              <CardContent className="space-y-6 flex-1 flex flex-col justify-between pb-6">
                {/* Stats / Expected Profit Highlights */}
                <div className="grid grid-cols-2 gap-2.5 bg-neutral-950/60 p-3 rounded-xl border border-neutral-800/80">
                  <div className="p-2 text-center rounded-lg bg-neutral-900/50">
                    <span className="text-[11px] text-neutral-400 block mb-0.5">الربح اليومي المتوقع</span>
                    <span className="text-sm font-bold text-emerald-400">
                      +{formatCurrency(dailyProfit)}
                    </span>
                  </div>
                  <div className="p-2 text-center rounded-lg bg-neutral-900/50">
                    <span className="text-[11px] text-neutral-400 block mb-0.5">العائد الإجمالي (30 يوم)</span>
                    <span className="text-sm font-bold text-amber-400">
                      +{formatCurrency(monthlyProfit)}
                    </span>
                  </div>
                </div>

                {/* Features & Daily Limits List */}
                <ul className="space-y-3 text-xs text-neutral-300">
                  <li className="flex items-center gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0 text-emerald-400">
                      <Layers className="w-3 h-3" />
                    </div>
                    <span className="font-medium text-white">{plan.dailyTasks} مهام يومية</span>
                    <span className="text-neutral-500 text-[11px] mr-auto">(معدل ربح أعلى)</span>
                  </li>

                  <li className="flex items-center gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0 text-emerald-400">
                      <Tv className="w-3 h-3" />
                    </div>
                    <span className="font-medium text-white">{plan.dailyAds} إعلانات يومية</span>
                    <span className="text-neutral-500 text-[11px] mr-auto">(أرباح فورية)</span>
                  </li>

                  <li className="flex items-center gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-amber-500/10 flex items-center justify-center shrink-0 text-amber-400">
                      <Zap className="w-3 h-3" />
                    </div>
                    <span>أولوية قصوى في معالجة السحوبات</span>
                  </li>

                  <li className="flex items-center gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-amber-500/10 flex items-center justify-center shrink-0 text-amber-400">
                      <ShieldCheck className="w-3 h-3" />
                    </div>
                    <span>دعم فني VIP مخصص وسريع</span>
                  </li>
                </ul>

                {/* Action / Purchase Button */}
                <div className="pt-2">
                  {isCurrent ? (
                    <Button 
                      variant="outline" 
                      className="w-full border-amber-500/40 text-amber-400 bg-amber-500/5 cursor-default hover:bg-amber-500/5" 
                      disabled
                    >
                      <Check className="w-4 h-4 ml-1.5" />
                      باقة نشطة حالياً
                    </Button>
                  ) : isPassed ? (
                    <Button 
                      variant="outline" 
                      className="w-full text-neutral-500 border-neutral-800 bg-neutral-900/40 cursor-default" 
                      disabled
                    >
                      مستوى تم اجتيازه
                    </Button>
                  ) : (
                    <Button 
                      variant="primary" 
                      className={`w-full font-bold shadow-md transition-all ${
                        hasEnoughBalance 
                          ? 'bg-amber-500 hover:bg-amber-400 text-neutral-950 shadow-amber-500/10' 
                          : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700'
                      }`}
                      onClick={() => handleOpenConfirm(plan)}
                    >
                      <Sparkles className="w-4 h-4 ml-1.5" />
                      {hasEnoughBalance ? 'ترقية واشتراك الآن' : 'شراء الباقة (شحن رصيد)'}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}

        {plans.length === 0 && (
          <div className="col-span-full py-16 text-center text-neutral-400 bg-neutral-900/30 rounded-2xl border border-neutral-800">
            <AlertCircle className="w-10 h-10 text-neutral-500 mx-auto mb-3" />
            <p className="text-base font-semibold text-white mb-1">لا توجد باقات VIP متاحة حالياً</p>
            <p className="text-xs text-neutral-500">سيتم إضافة باقات جديدة قريباً من قبل إدارة المنصة.</p>
          </div>
        )}
      </div>

      {/* Confirmation & Purchase Modal */}
      {selectedPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5 text-right relative">
            <button 
              onClick={() => setSelectedPlan(null)}
              className="absolute top-4 left-4 text-neutral-400 hover:text-white p-1 rounded-lg hover:bg-neutral-800 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                <Crown className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">تأكيد ترقية {selectedPlan.name}</h3>
                <p className="text-xs text-neutral-400">سيتم خصم قيمة الاشتراك مباشرة من رصيدك المتاح</p>
              </div>
            </div>

            {error && (
              <div className="bg-rose-950/50 border border-rose-500/40 rounded-xl p-3 text-xs text-rose-200 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Financial Summary */}
            <div className="space-y-2.5 bg-neutral-950/80 p-4 rounded-xl border border-neutral-800/80 text-xs">
              <div className="flex justify-between items-center text-neutral-400">
                <span>سعر الباقة ({selectedPlan.durationDays} يوم):</span>
                <span className="font-bold text-white text-sm">{formatCurrency(selectedPlan.price)}</span>
              </div>

              <div className="flex justify-between items-center text-neutral-400">
                <span>رصيدك المتاح حالياً:</span>
                <span className={`font-bold text-sm ${availableBalance >= selectedPlan.price ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {formatCurrency(availableBalance)}
                </span>
              </div>

              <div className="border-t border-neutral-800 pt-2 flex justify-between items-center">
                <span className="text-neutral-300">الرصيد المتبقي بعد الترقية:</span>
                <span className="font-bold text-white text-sm">
                  {availableBalance >= selectedPlan.price 
                    ? formatCurrency(availableBalance - selectedPlan.price) 
                    : 'غير كافٍ'}
                </span>
              </div>
            </div>

            {/* Insufficient Funds Action or Confirm Button */}
            {availableBalance < selectedPlan.price ? (
              <div className="space-y-3">
                <div className="text-xs text-amber-400/90 bg-amber-500/10 border border-amber-500/20 p-3 rounded-xl flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>
                    رصيدك الحالي أقل من سعر الباقة. يرجى شحن الرصيد بمبلغ {formatCurrency(selectedPlan.price - availableBalance)} على الأقل لإتمام الترقية.
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Button 
                    variant="outline" 
                    onClick={() => setSelectedPlan(null)}
                    className="w-full text-xs"
                  >
                    إلغاء
                  </Button>
                  <Link to="/dashboard/deposit" className="w-full">
                    <Button 
                      variant="primary" 
                      className="w-full text-xs bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold"
                    >
                      شحن الرصيد الآن
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 pt-2">
                <Button 
                  variant="outline" 
                  onClick={() => setSelectedPlan(null)}
                  disabled={Boolean(submittingPlanId)}
                  className="w-full text-xs"
                >
                  إلغاء
                </Button>
                <Button 
                  variant="primary" 
                  onClick={handleSubscribe}
                  isLoading={Boolean(submittingPlanId)}
                  className="w-full text-xs bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold"
                >
                  تأكيد الخصم والترقية
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
