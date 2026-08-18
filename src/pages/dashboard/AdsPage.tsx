import React, { useState, useEffect, useRef } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { LoadingState } from '../../components/ui/LoadingState';
import { 
  Play, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Award, 
  Zap, 
  Sparkles, 
  ShieldAlert, 
  ExternalLink,
  Video,
  Globe,
  X,
  Maximize2,
  Volume2,
  RefreshCw,
  Eye
} from 'lucide-react';
import { Ad } from '../../types/models';
import { useAuth } from '../../context/AuthContext';
import { useWallet } from '../../context/WalletContext';
import { useToast } from '../../components/ui/Toast';
import { formatCurrency, cn } from '../../lib/utils';
import { api } from '../../lib/api';
import { motion, AnimatePresence } from 'motion/react';

// Helper to extract YouTube video ID or embed URL
function getYouTubeEmbedUrl(url: string): string | null {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 
    ? `https://www.youtube.com/embed/${match[2]}?autoplay=1&enablejsapi=1&origin=${encodeURIComponent(window.location.origin)}` 
    : null;
}

function isDirectVideoUrl(url: string): boolean {
  if (!url) return false;
  return url.endsWith('.mp4') || url.endsWith('.webm') || url.endsWith('.ogg') || url.includes('/video/');
}

export default function AdsPage() {
  const { user, refreshUser } = useAuth();
  const { wallet, refreshWallet } = useWallet();
  const toast = useToast();

  const [ads, setAds] = useState<Ad[]>([]);
  const [completions, setCompletions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Active Ad Modal State
  const [modalAd, setModalAd] = useState<Ad | null>(null);
  const [isWatching, setIsWatching] = useState(false);
  const [countdown, setCountdown] = useState(15);
  const [totalDuration, setTotalDuration] = useState(15);
  const [isCompleted, setIsCompleted] = useState(false);
  const [earnedReward, setEarnedReward] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isMediaPlaying, setIsMediaPlaying] = useState(false);
  const [openedInNewTab, setOpenedInNewTab] = useState(false);

  const timerRef = useRef<any>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    fetchData();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [adsRes, compRes] = await Promise.all([
        api.getAds().catch(() => ({ ads: [] })),
        api.getAdCompletions().catch(() => ({ completions: [] }))
      ]);
      setAds(adsRes.ads || adsRes || []);
      setCompletions(compRes.completions || compRes || []);
    } catch (err) {
      console.error('Error loading ads data:', err);
    } finally {
      setLoading(false);
    }
  };

  const isAdCompletedToday = (adId: string) => {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    return completions.some((c: any) => {
      if (c.adId !== adId) return false;
      const completedDate = new Date(c.completedAt || c.createdAt);
      return completedDate >= todayStart;
    });
  };

  const todayCompletedCount = completions.filter((c: any) => {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const completedDate = new Date(c.completedAt || c.createdAt);
    return completedDate >= todayStart;
  }).length;

  const handleOpenAdModal = (ad: Ad) => {
    const currentVip = user?.vipLevel || 0;
    if (currentVip < ad.requiredVipLevel) {
      toast.warning(`هذا الإعلان يتطلب مستوى VIP ${ad.requiredVipLevel} أو أعلى`);
      return;
    }

    const adId = (ad as any).adId || (ad as any).id;
    if (isAdCompletedToday(adId)) {
      toast.info('لقد شاهدت هذا الإعلان اليوم بالفعل! تجدد الإعلانات يومياً.');
      return;
    }

    const duration = ad.durationSeconds && ad.durationSeconds >= 5 ? ad.durationSeconds : 15;
    setModalAd(ad);
    setTotalDuration(duration);
    setCountdown(duration);
    setIsWatching(true);
    setIsCompleted(false);
    setEarnedReward(null);
    setIsSubmitting(false);
    setOpenedInNewTab(false);

    const hasYoutube = getYouTubeEmbedUrl(ad.url || '');
    const hasDirectVideo = isDirectVideoUrl(ad.url || '');

    // For videos, wait until play starts or start countdown immediately for web/PTC
    if (hasYoutube || hasDirectVideo) {
      setIsMediaPlaying(true);
      startCountdownTimer(duration, ad);
    } else {
      setIsMediaPlaying(true);
      startCountdownTimer(duration, ad);
    }
  };

  const startCountdownTimer = (duration: number, ad: Ad) => {
    if (timerRef.current) clearInterval(timerRef.current);
    
    let currentSec = duration;
    timerRef.current = setInterval(() => {
      currentSec -= 1;
      setCountdown(currentSec);

      if (currentSec <= 0) {
        if (timerRef.current) clearInterval(timerRef.current);
        finishAndVerifyAd(ad);
      }
    }, 1000);
  };

  const finishAndVerifyAd = async (ad: Ad) => {
    if (isSubmitting) return;
    if (timerRef.current) clearInterval(timerRef.current);
    
    const adId = (ad as any).adId || (ad as any).id;
    setIsSubmitting(true);
    try {
      const response = await api.completeAd(adId);
      const reward = Number(response?.reward ?? ad.reward) || 0;
      setEarnedReward(reward);
      setIsCompleted(true);
      setIsWatching(false);

      toast.success(
        'تم إكمال مشاهدة الإعلان بنجاح!',
        `تمت إضافة +${formatCurrency(reward)} فوراً إلى محفظتك وسجل الأرباح.`
      );

      // Refresh states
      await Promise.all([
        refreshWallet(),
        refreshUser(),
        fetchData()
      ]);
    } catch (err: any) {
      console.error('Error completing ad:', err);
      toast.error('حدث خطأ أثناء تسجيل المكافأة', err.message || 'يرجى المحاولة مرة أخرى');
      setIsWatching(false);
      setModalAd(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const closeModal = () => {
    if (isWatching && countdown > 0) {
      toast.warning('يجب استكمال مشاهدة الإعلان حتى نهاية المؤقت للحصول على المكافأة!');
      return;
    }
    setModalAd(null);
    setIsWatching(false);
    setIsCompleted(false);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const handleOpenExternalTab = (url: string) => {
    setOpenedInNewTab(true);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  if (loading) return <LoadingState message="جاري تجهيز شبكة الإعلانات الذكية..." />;

  const currentVip = user?.vipLevel || 0;

  return (
    <div className="space-y-6">
      {/* Page Header & Stats */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-neutral-900 via-neutral-900 to-neutral-900/80 border border-neutral-800 p-6 rounded-2xl shadow-lg">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-5 h-5 text-yellow-500" />
            <h1 className="text-2xl font-bold text-white">إعلانات الفيديو والمواقع الممولة (PTC)</h1>
          </div>
          <p className="text-neutral-400 text-sm">
            شاهد الفيديوهات الترويجية الحقيقية أو تصفح مواقع الشركاء المعتمدين لكسب عوائد فورية في رصيدك
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-neutral-950/80 border border-neutral-800 px-4 py-2 rounded-xl text-center">
            <span className="text-xs text-neutral-500 block">مستواك الحالي</span>
            <span className="text-sm font-bold text-yellow-500">VIP {currentVip}</span>
          </div>
          <div className="bg-neutral-950/80 border border-neutral-800 px-4 py-2 rounded-xl text-center">
            <span className="text-xs text-neutral-500 block">إعلانات اليوم</span>
            <span className="text-sm font-bold text-emerald-400">{todayCompletedCount} مكتملة</span>
          </div>
          <div className="bg-yellow-500/10 border border-yellow-500/20 px-4 py-2 rounded-xl text-center">
            <span className="text-xs text-yellow-500/80 block">الرصيد المتاح</span>
            <span className="text-sm font-bold text-yellow-400">
              {formatCurrency(wallet?.availableBalance || 0)}
            </span>
          </div>
        </div>
      </div>

      {/* Ads Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {ads.map((ad) => {
          const adId = (ad as any).adId || (ad as any).id;
          const isCompletedToday = isAdCompletedToday(adId);
          const isVipEligible = currentVip >= ad.requiredVipLevel;
          const isVideo = getYouTubeEmbedUrl(ad.url || '') || isDirectVideoUrl(ad.url || '');

          return (
            <Card
              key={adId}
              id={`ad-card-${adId}`}
              className={cn(
                "relative overflow-hidden transition-all duration-300 border flex flex-col justify-between group",
                isCompletedToday 
                  ? "bg-emerald-950/10 border-emerald-500/30 opacity-90 shadow-sm" 
                  : isVipEligible 
                    ? "bg-neutral-900/60 border-neutral-800 hover:border-yellow-500/40 hover:shadow-yellow-500/5 shadow-md" 
                    : "bg-neutral-950/60 border-neutral-800/60 opacity-60 grayscale-[40%]"
              )}
            >
              {/* Top Badges & Type */}
              <div className="p-5 pb-3">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-1.5">
                    {ad.requiredVipLevel > 0 ? (
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 flex items-center gap-1">
                        <Zap className="w-3 h-3" /> VIP {ad.requiredVipLevel}
                      </span>
                    ) : (
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-neutral-800 text-neutral-300 border border-neutral-700">
                        متاح للجميع
                      </span>
                    )}

                    {isVideo ? (
                      <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 flex items-center gap-1">
                        <Video className="w-3 h-3" /> إعلان فيديو
                      </span>
                    ) : (
                      <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center gap-1">
                        <Globe className="w-3 h-3" /> زيارة موقع (PTC)
                      </span>
                    )}
                  </div>

                  {isCompletedToday ? (
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> مكتمل اليوم
                    </span>
                  ) : (
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {ad.durationSeconds || 15} ثانية
                    </span>
                  )}
                </div>

                <h3 className="font-bold text-lg text-white mb-2 line-clamp-1 group-hover:text-yellow-400 transition-colors">
                  {ad.title}
                </h3>
                
                <p className="text-neutral-400 text-xs line-clamp-2 min-h-[32px] leading-relaxed">
                  {ad.description || 'شاهد محتوى الإعلان بالكامل واستلم المكافأة فوراً في محفظتك.'}
                </p>
              </div>

              {/* Card Footer with Reward and CTA */}
              <div className="p-5 pt-0 mt-auto">
                <div className="flex items-center justify-between p-3 rounded-xl bg-neutral-950/60 border border-neutral-800/80 mb-4">
                  <span className="text-xs text-neutral-400">مكافأة المشاهدة:</span>
                  <span className="text-base font-bold text-yellow-400">
                    +{formatCurrency(ad.reward)}
                  </span>
                </div>

                {isCompletedToday ? (
                  <Button
                    id={`btn-completed-${adId}`}
                    variant="outline"
                    className="w-full bg-emerald-950/30 border-emerald-500/40 text-emerald-400 cursor-not-allowed py-2.5"
                    disabled
                  >
                    <CheckCircle2 className="w-4 h-4 ml-2 text-emerald-400" />
                    تمت المشاهدة اليوم
                  </Button>
                ) : !isVipEligible ? (
                  <Button
                    id={`btn-locked-${adId}`}
                    variant="secondary"
                    className="w-full bg-neutral-800 text-neutral-400 cursor-not-allowed py-2.5"
                    disabled
                  >
                    <ShieldAlert className="w-4 h-4 ml-2 text-yellow-500" />
                    يتطلب ترقية إلى VIP {ad.requiredVipLevel}
                  </Button>
                ) : (
                  <Button
                    id={`btn-watch-${adId}`}
                    variant="primary"
                    className="w-full bg-yellow-500 hover:bg-yellow-400 text-neutral-950 font-bold py-2.5 shadow-lg shadow-yellow-500/10 transition-transform active:scale-[0.98]"
                    onClick={() => handleOpenAdModal(ad)}
                  >
                    <Play className="w-4 h-4 ml-2 fill-neutral-950" />
                    بدء المشاهدة الآن ({formatCurrency(ad.reward)})
                  </Button>
                )}
              </div>
            </Card>
          );
        })}

        {ads.length === 0 && (
          <div className="col-span-full py-16 text-center text-neutral-400 bg-neutral-900/40 rounded-2xl border border-neutral-800 p-8">
            <AlertCircle className="w-12 h-12 text-yellow-500/50 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-white mb-1">لا توجد إعلانات متاحة حالياً</h3>
            <p className="text-sm text-neutral-400">يرجى العودة لاحقاً أو مراجعة لوحة الإدارة لإضافة إعلانات جديدة.</p>
          </div>
        )}
      </div>

      {/* REAL ADS ENGINE MODAL */}
      <AnimatePresence>
        {modalAd && (
          <div
            id="ad-watch-modal-overlay"
            className="fixed inset-0 z-[9990] flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md"
          >
            <motion.div
              id="ad-watch-modal-container"
              initial={{ scale: 0.92, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0, y: 20 }}
              className="bg-neutral-900 border border-neutral-700 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden relative flex flex-col max-h-[90vh]"
            >
              {/* Header Bar */}
              <div className="bg-neutral-950 px-5 py-3.5 border-b border-neutral-800 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-500 animate-ping" />
                  <div>
                    <h3 className="font-bold text-white text-sm line-clamp-1">{modalAd.title}</h3>
                    <span className="text-[11px] text-neutral-400">
                      {getYouTubeEmbedUrl(modalAd.url || '') || isDirectVideoUrl(modalAd.url || '') 
                        ? 'إعلان فيديو مباشر' 
                        : 'نافذة تصفح الموقع الممول (PTC)'}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <div className="bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 px-3 py-1 rounded-full text-xs font-bold">
                    المكافأة: {formatCurrency(modalAd.reward)}
                  </div>
                  {isCompleted && (
                    <button 
                      onClick={closeModal}
                      className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Ad Viewport / Player Body */}
              <div className="p-4 sm:p-6 overflow-y-auto flex-1 flex flex-col items-center justify-center space-y-4">
                {!isCompleted ? (
                  <>
                    {/* Media Display Container */}
                    <div className="w-full bg-black rounded-xl border border-neutral-800 overflow-hidden relative min-h-[220px] sm:min-h-[280px] flex items-center justify-center">
                      {/* YouTube Player */}
                      {getYouTubeEmbedUrl(modalAd.url || '') ? (
                        <iframe
                          src={getYouTubeEmbedUrl(modalAd.url || '')!}
                          title={modalAd.title}
                          className="w-full h-[220px] sm:h-[300px] border-0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                          allowFullScreen
                        />
                      ) : isDirectVideoUrl(modalAd.url || '') ? (
                        /* Direct MP4 Video Player */
                        <video
                          ref={videoRef}
                          src={modalAd.url}
                          controls
                          autoPlay
                          playsInline
                          className="w-full max-h-[300px] object-contain"
                          onPlay={() => setIsMediaPlaying(true)}
                        />
                      ) : (
                        /* PTC / Webpage Viewport */
                        <div className="w-full h-full min-h-[220px] sm:min-h-[280px] flex flex-col items-center justify-center p-6 text-center bg-gradient-to-b from-neutral-950 to-neutral-900">
                          <Globe className="w-12 h-12 text-yellow-500 mb-3 animate-pulse" />
                          <h4 className="text-base font-bold text-white mb-1.5">{modalAd.title}</h4>
                          <p className="text-xs text-neutral-400 max-w-md mb-4 leading-relaxed">
                            {modalAd.description || 'يتم احتساب وقت التصفح الحقيقي لرابط الإعلان الممول أدناه.'}
                          </p>
                          
                          {modalAd.url && (
                            <div className="flex flex-col sm:flex-row items-center gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleOpenExternalTab(modalAd.url!)}
                                className="bg-neutral-900 border-neutral-700 text-yellow-400 hover:text-yellow-300 text-xs flex items-center gap-1.5"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                                فتح موقع الإعلان في تبويب جديد
                              </Button>
                              {openedInNewTab && (
                                <span className="text-[11px] text-emerald-400 flex items-center gap-1">
                                  <CheckCircle2 className="w-3 h-3" /> تم فتح الرابط بنجاح
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Timer and Countdown */}
                    <div className="space-y-2.5 w-full">
                      <div className="flex items-center justify-between text-xs text-neutral-300">
                        <span className="flex items-center gap-1.5 font-medium">
                          <Clock className="w-4 h-4 text-yellow-500 animate-spin" />
                          الوقت المتبقي لاحتساب المكافأة:
                        </span>
                        <span className="text-2xl font-black font-mono text-yellow-400 tracking-wider">
                          {countdown > 9 ? countdown : `0${countdown}`} ثانية
                        </span>
                      </div>

                      {/* Animated Progress Bar */}
                      <div className="w-full bg-neutral-950 rounded-full h-3 p-0.5 border border-neutral-800 overflow-hidden shadow-inner">
                        <motion.div
                          className="bg-gradient-to-r from-yellow-500 to-amber-400 h-full rounded-full transition-all duration-1000 ease-linear shadow-[0_0_12px_rgba(234,179,8,0.5)]"
                          style={{ width: `${((totalDuration - countdown) / totalDuration) * 100}%` }}
                        />
                      </div>

                      <p className="text-[11px] text-neutral-400 text-center">
                        يرجى البقاء داخل النافذة حتى نهاية العداد ليتم قيد أرباح المشاهدة تلقائياً في حسابك.
                      </p>
                    </div>

                    {/* Locked Status Button */}
                    <div className="w-full pt-1">
                      <Button
                        variant="secondary"
                        className="w-full bg-neutral-950/80 text-neutral-400 cursor-not-allowed border border-neutral-800 text-xs py-2.5"
                        disabled
                      >
                        <Clock className="w-3.5 h-3.5 ml-2 animate-spin text-yellow-500" />
                        يُمنع الإغلاق حتى اكتمال المشاهدة ({countdown} ث متبقية)
                      </Button>
                    </div>
                  </>
                ) : (
                  /* Completion State */
                  <div className="py-6 space-y-5 flex flex-col items-center text-center w-full">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 200, damping: 15 }}
                      className="w-20 h-20 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center text-emerald-400 shadow-[0_0_25px_rgba(16,185,129,0.3)]"
                    >
                      <CheckCircle2 className="w-12 h-12" />
                    </motion.div>

                    <div className="space-y-1.5">
                      <h3 className="text-2xl font-black text-white">مبروك! تمت المشاهدة بنجاح</h3>
                      <p className="text-sm text-neutral-300">
                        تمت إضافة المكافأة فوراً إلى محفظتك وسجل الأرباح اليومية
                      </p>
                    </div>

                    {/* Reward Amount Badge */}
                    <div className="bg-emerald-950/60 border border-emerald-500/40 px-6 py-3 rounded-2xl flex items-center gap-3">
                      <Award className="w-6 h-6 text-emerald-400" />
                      <div className="text-right">
                        <span className="text-xs text-neutral-400 block">المبلغ المضاف للمحفظة:</span>
                        <span className="text-xl font-black text-emerald-400">
                          +{formatCurrency(earnedReward || modalAd.reward)}
                        </span>
                      </div>
                    </div>

                    <Button
                      id="btn-close-ad-modal"
                      variant="primary"
                      className="w-full bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold py-3 text-sm shadow-lg shadow-emerald-500/20"
                      onClick={closeModal}
                    >
                      استلام المكافأة والعودة للإعلانات
                    </Button>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
