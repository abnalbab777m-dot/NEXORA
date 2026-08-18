import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { LoadingState } from '../../components/ui/LoadingState';
import { ErrorState } from '../../components/ui/ErrorState';
import { formatCurrency } from '../../lib/utils';
import { useToast } from '../../components/ui/Toast';
import { 
  Tv, 
  Plus, 
  Edit, 
  Trash2, 
  Check, 
  X, 
  ExternalLink, 
  Clock, 
  Crown, 
  Sparkles,
  Search,
  RefreshCw,
  Eye,
  Video,
  Globe,
  HelpCircle
} from 'lucide-react';
import { Ad, AdCompletion } from '../../types/models';
import { api } from '../../lib/api';

export default function AdminAds() {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<'ADS' | 'COMPLETIONS'>('ADS');
  const [ads, setAds] = useState<Ad[]>([]);
  const [completions, setCompletions] = useState<AdCompletion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal / Form states
  const [editingAd, setEditingAd] = useState<any | null>(null);
  const [isNewAd, setIsNewAd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteConfirmModal, setDeleteConfirmModal] = useState<{ id: string; title: string } | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const snap = await api.admin.getAdminAds();
      setAds(snap.ads || []);
      const compSnap = await api.admin.getAdminCompletions('AD');
      setCompletions(compSnap.completions || []);
    } catch (err: any) {
      setError(err.message);
      toast.error('فشل في جلب البيانات', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setIsNewAd(true);
    setEditingAd({
      title: '',
      description: '',
      reward: 1.5,
      url: '',
      durationSeconds: 15,
      requiredVipLevel: 0,
      status: 'ACTIVE'
    });
  };

  const handleOpenEdit = (ad: Ad) => {
    setIsNewAd(false);
    setEditingAd({
      id: ad.id || ad.adId,
      title: ad.title,
      description: ad.description || '',
      reward: ad.reward,
      url: ad.url || (ad as any).link || '',
      durationSeconds: ad.durationSeconds || 15,
      requiredVipLevel: ad.requiredVipLevel || 0,
      status: ad.status || 'ACTIVE'
    });
  };

  const handleSaveAd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAd.title.trim()) {
      toast.warning('يرجى إدخال عنوان الإعلان');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        title: editingAd.title.trim(),
        description: editingAd.description?.trim() || '',
        reward: Number(editingAd.reward) || 0,
        url: editingAd.url?.trim() || '',
        durationSeconds: Number(editingAd.durationSeconds) || 15,
        requiredVipLevel: Number(editingAd.requiredVipLevel) || 0,
        status: editingAd.status || 'ACTIVE'
      };

      if (isNewAd) {
        await api.admin.createAd(payload);
        toast.success('تم إنشاء الإعلان بنجاح');
      } else {
        await api.admin.updateAd(editingAd.id, payload);
        toast.success('تم تحديث الإعلان بنجاح');
      }

      setEditingAd(null);
      fetchData();
    } catch (err: any) {
      toast.error('حدث خطأ أثناء حفظ الإعلان', err.message);
    } finally {
      setSaving(false);
    }
  };

  const confirmDeleteAd = async () => {
    if (!deleteConfirmModal) return;
    const id = deleteConfirmModal.id;

    setDeletingId(id);
    try {
      await api.admin.deleteAd(id);
      toast.success('تم حذف الإعلان بنجاح');
      setAds(prev => prev.filter(a => (a.id || a.adId) !== id));
      setDeleteConfirmModal(null);
    } catch (err: any) {
      toast.error('فشل في حذف الإعلان', err.message);
    } finally {
      setDeletingId(null);
    }
  };

  const handleAction = async (completionId: string, action: 'APPROVE' | 'REJECT') => {
    try {
      await api.admin.approveCompletion('AD', completionId, action);
      toast.success(action === 'APPROVE' ? 'تم اعتماد مكافأة الإعلان للمستخدم بنجاح' : 'تم رفض مشاهدة الإعلان');
      fetchData();
    } catch (err: any) {
      toast.error('خطأ في معالجة الطلب', err.message);
    }
  };

  const filteredAds = ads.filter(a => 
    a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (a.description && a.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (loading && ads.length === 0) {
    return <LoadingState message="جاري تحميل بيانات الإعلانات والمشاهدات..." />;
  }

  if (error && ads.length === 0) {
    return <ErrorState message={error} onRetry={fetchData} />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Tv className="w-6 h-6 text-yellow-500" />
            <h1 className="text-2xl font-bold text-white">إدارة الإعلانات ومحرك العرض الحقيقي</h1>
          </div>
          <p className="text-neutral-400 text-sm mt-1">
            إضافة وتعديل وحذف إعلانات الفيديو (YouTube/MP4) ومواقع التصفح الممولة (PTC)، وتحديد مدة المؤقت وقيمة المكافأة.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchData}
            className="border-neutral-800 text-neutral-300 hover:text-white"
          >
            <RefreshCw className="w-4 h-4 ml-1.5" />
            تحديث
          </Button>

          <Button 
            onClick={handleOpenCreate}
            className="bg-yellow-500 hover:bg-yellow-400 text-neutral-950 font-bold"
          >
            <Plus className="w-4 h-4 ml-1.5" />
            إضافة إعلان جديد
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-neutral-800">
        <button
          onClick={() => setActiveTab('ADS')}
          className={`pb-3 px-4 text-sm font-semibold transition-colors relative ${
            activeTab === 'ADS' 
              ? 'text-yellow-500 border-b-2 border-yellow-500' 
              : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          قائمة الإعلانات المتاحة ({ads.length})
        </button>

        <button
          onClick={() => setActiveTab('COMPLETIONS')}
          className={`pb-3 px-4 text-sm font-semibold transition-colors relative flex items-center gap-2 ${
            activeTab === 'COMPLETIONS' 
              ? 'text-yellow-500 border-b-2 border-yellow-500' 
              : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <span>سجل المشاهدات ({completions.length})</span>
          {completions.filter(c => c.status === 'PENDING').length > 0 && (
            <span className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
          )}
        </button>
      </div>

      {/* TAB 1: Ads List */}
      {activeTab === 'ADS' && (
        <div className="space-y-4">
          {/* Search bar */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute right-3.5 top-3 text-neutral-500" />
              <Input
                id="search-ads"
                placeholder="ابحث عن إعلان بالعنوان أو الوصف..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pr-10 bg-neutral-900/60 border-neutral-800 text-xs"
              />
            </div>
          </div>

          {/* Ads Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAds.map(ad => {
              const adId = ad.id || ad.adId || '';
              const isVideo = ad.url && (ad.url.includes('youtube.com') || ad.url.includes('youtu.be') || ad.url.endsWith('.mp4'));
              return (
                <Card 
                  key={adId} 
                  className="border-neutral-800 bg-neutral-900/40 hover:border-neutral-700 transition-all flex flex-col justify-between"
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border ${
                            ad.status === 'ACTIVE'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                              : 'bg-neutral-800 text-neutral-400 border-neutral-700'
                          }`}>
                            {ad.status === 'ACTIVE' ? 'نشط ومتاح' : 'معطل'}
                          </span>

                          {isVideo ? (
                            <span className="text-[10px] px-2 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20 font-medium flex items-center gap-1">
                              <Video className="w-3 h-3" /> فيديو
                            </span>
                          ) : (
                            <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 font-medium flex items-center gap-1">
                              <Globe className="w-3 h-3" /> موقع PTC
                            </span>
                          )}
                        </div>

                        <CardTitle className="text-base text-white leading-snug pt-1">
                          {ad.title}
                        </CardTitle>
                      </div>

                      <span className="px-2.5 py-1 rounded-lg bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 font-bold text-sm shrink-0">
                        {formatCurrency(ad.reward)}
                      </span>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {ad.description && (
                      <p className="text-xs text-neutral-400 line-clamp-2">
                        {ad.description}
                      </p>
                    )}

                    <div className="grid grid-cols-2 gap-2 text-xs text-neutral-300 py-2 border-y border-neutral-800/60">
                      <div className="flex items-center gap-1.5">
                        <Crown className="w-3.5 h-3.5 text-yellow-500" />
                        <span>VIP المطلوب:</span>
                        <span className="font-bold text-white">VIP {ad.requiredVipLevel}</span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-neutral-400" />
                        <span>المؤقت:</span>
                        <span className="font-bold text-white">{ad.durationSeconds || 15} ثانية</span>
                      </div>
                    </div>

                    {ad.url && (
                      <div className="flex items-center gap-1 text-[11px] text-blue-400 truncate bg-neutral-950 p-2 rounded-lg border border-neutral-800/80">
                        <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate font-mono" dir="ltr">{ad.url}</span>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-2 pt-1">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleOpenEdit(ad)}
                        className="text-xs border-neutral-800 bg-neutral-800 hover:bg-neutral-700 text-white"
                      >
                        <Edit className="w-3.5 h-3.5 ml-1" />
                        تعديل
                      </Button>

                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setDeleteConfirmModal({ id: adId, title: ad.title })}
                        className="text-xs bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20"
                      >
                        <Trash2 className="w-3.5 h-3.5 ml-1" />
                        حذف
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            {filteredAds.length === 0 && (
              <div className="col-span-full text-center py-12 bg-neutral-900/20 border border-dashed border-neutral-800 rounded-2xl">
                <Tv className="w-10 h-10 text-neutral-600 mx-auto mb-3" />
                <h3 className="text-white font-bold mb-1">لا توجد إعلانات مطابقة</h3>
                <p className="text-xs text-neutral-400 mb-4">قم بإنشاء إعلانات جديدة ليتمكن الأعضاء من مشاهدتها وكسب الأرباح.</p>
                <Button size="sm" onClick={handleOpenCreate} className="bg-yellow-500 text-neutral-950 font-bold">
                  <Plus className="w-4 h-4 ml-1" /> إضافة أول إعلان
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: Ad Completions Table */}
      {activeTab === 'COMPLETIONS' && (
        <Card className="border-neutral-800 bg-neutral-900/40">
          <CardHeader>
            <CardTitle className="text-base text-white">سجل مشاهدات الإعلانات المكتملة</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-right">
                <thead className="text-xs text-neutral-400 uppercase bg-neutral-950/60 border-b border-neutral-800">
                  <tr>
                    <th className="px-6 py-3.5">التاريخ والوقت</th>
                    <th className="px-6 py-3.5">معرف المستخدم</th>
                    <th className="px-6 py-3.5">معرف الإعلان</th>
                    <th className="px-6 py-3.5">قيمة المكافأة</th>
                    <th className="px-6 py-3.5">الحالة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800/80 font-sans">
                  {completions.map(comp => {
                    const compId = (comp as any).id || comp.completionId;
                    return (
                      <tr key={compId} className="hover:bg-neutral-900/50 transition-colors">
                        <td className="px-6 py-4 text-xs font-mono text-neutral-300">
                          {comp.completedAt ? new Date(comp.completedAt).toLocaleString('ar-EG') : '-'}
                        </td>
                        <td className="px-6 py-4 font-mono text-xs text-neutral-300">
                          {comp.userId ? `${comp.userId.substring(0, 8)}...` : '-'}
                        </td>
                        <td className="px-6 py-4 font-mono text-xs text-neutral-400">
                          {comp.adId ? `${comp.adId.substring(0, 8)}...` : '-'}
                        </td>
                        <td className="px-6 py-4 font-bold text-yellow-500">
                          {formatCurrency(comp.reward)}
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-2.5 py-1 rounded text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            مكتمل ومعتمد
                          </span>
                        </td>
                      </tr>
                    );
                  })}

                  {completions.length === 0 && (
                    <tr>
                      <td colSpan={5} className="text-center py-10 text-xs text-neutral-500">
                        لا توجد مشاهدات إعلانات مسجلة حتى الآن.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* CREATE / EDIT AD MODAL */}
      {editingAd && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <Card className="w-full max-w-xl border-neutral-800 bg-neutral-900 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <CardHeader className="flex flex-row items-center justify-between border-b border-neutral-800 pb-4">
              <CardTitle className="text-lg text-white flex items-center gap-2">
                <Tv className="w-5 h-5 text-yellow-500" />
                {isNewAd ? 'إضافة إعلان جديد' : 'تعديل بيانات الإعلان'}
              </CardTitle>
              <button 
                onClick={() => setEditingAd(null)}
                className="text-neutral-400 hover:text-white p-1 rounded-lg hover:bg-neutral-800"
              >
                <X className="w-5 h-5" />
              </button>
            </CardHeader>

            <CardContent className="pt-5">
              <form onSubmit={handleSaveAd} className="space-y-4">
                {/* Title */}
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                    عنوان الإعلان *
                  </label>
                  <Input
                    id="ad-title"
                    value={editingAd.title}
                    onChange={e => setEditingAd({...editingAd, title: e.target.value})}
                    placeholder="مثال: فيديو ترويجي لتطبيق التداول الذكي أو زيارة موقع الشريك..."
                    required
                    className="bg-neutral-950 border-neutral-800 text-sm"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                    وصف الإعلان
                  </label>
                  <textarea
                    id="ad-description"
                    rows={3}
                    value={editingAd.description}
                    onChange={e => setEditingAd({...editingAd, description: e.target.value})}
                    placeholder="شرح موجز عن محتوى الإعلان أو الموقع المروج له..."
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-sm text-neutral-200 focus:outline-none focus:border-yellow-500/50"
                  />
                </div>

                {/* URL / Video / Website */}
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1.5 flex items-center justify-between">
                    <span>رابط الإعلان (YouTube / فيديو MP4 / رابط موقع PTC) *</span>
                    <span className="text-[10px] text-yellow-500 font-normal">يدعم YouTube أو MP4 أو المواقع الخارجية</span>
                  </label>
                  <Input
                    id="ad-url"
                    value={editingAd.url}
                    onChange={e => setEditingAd({...editingAd, url: e.target.value})}
                    placeholder="https://www.youtube.com/watch?v=... أو https://example.com"
                    dir="ltr"
                    className="bg-neutral-950 border-neutral-800 text-xs font-mono"
                  />
                  <p className="text-[11px] text-neutral-500 mt-1">
                    إذا كان الرابط YouTube أو MP4 فسيتم تشغيل الفيديو مباشرة داخل النافذة، وإذا كان رابط موقع فسيتم فتحه كنافذة تصفح مدفوعة (PTC).
                  </p>
                </div>

                {/* Reward & Duration */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                      قيمة المكافأة ($ USD) *
                    </label>
                    <Input
                      id="ad-reward"
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={editingAd.reward}
                      onChange={e => setEditingAd({...editingAd, reward: e.target.value})}
                      required
                      dir="ltr"
                      className="bg-neutral-950 border-neutral-800"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                      مدة المؤقت بالثواني (Timer) *
                    </label>
                    <Input
                      id="ad-duration"
                      type="number"
                      min="5"
                      step="1"
                      value={editingAd.durationSeconds}
                      onChange={e => setEditingAd({...editingAd, durationSeconds: e.target.value})}
                      required
                      dir="ltr"
                      className="bg-neutral-950 border-neutral-800"
                    />
                  </div>
                </div>

                {/* Required VIP & Status */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                      مستوى VIP المطلوب *
                    </label>
                    <select
                      id="ad-vip"
                      value={editingAd.requiredVipLevel}
                      onChange={e => setEditingAd({...editingAd, requiredVipLevel: Number(e.target.value)})}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2.5 text-sm text-neutral-200 focus:outline-none focus:border-yellow-500/50"
                    >
                      <option value={0}>VIP 0 (جميع المستخدمين مجاناً)</option>
                      <option value={1}>VIP 1 (باقة 30$ فما فوق)</option>
                      <option value={2}>VIP 2 (باقة 50$ فما فوق)</option>
                      <option value={3}>VIP 3 (باقة 100$ فما فوق)</option>
                      <option value={4}>VIP 4 (باقة 300$ فما فوق)</option>
                      <option value={5}>VIP 5 (باقة 800$)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                      حالة الإعلان
                    </label>
                    <select
                      id="ad-status"
                      value={editingAd.status}
                      onChange={e => setEditingAd({...editingAd, status: e.target.value})}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2.5 text-sm text-neutral-200 focus:outline-none focus:border-yellow-500/50"
                    >
                      <option value="ACTIVE">نشط (يظهر للمستخدمين)</option>
                      <option value="INACTIVE">معطل (مخفي مؤقتاً)</option>
                    </select>
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-800">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setEditingAd(null)}
                    className="border-neutral-800 text-neutral-300"
                  >
                    إلغاء
                  </Button>

                  <Button
                    type="submit"
                    isLoading={saving}
                    className="bg-yellow-500 hover:bg-yellow-400 text-neutral-950 font-bold px-6"
                  >
                    {isNewAd ? 'إنشاء الإعلان' : 'حفظ التعديلات'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* In-App Delete Confirmation Modal */}
      {deleteConfirmModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="w-full max-w-md border-neutral-800 bg-neutral-900 shadow-2xl animate-in fade-in zoom-in-95">
            <CardHeader className="pb-3 border-b border-neutral-800">
              <CardTitle className="text-base text-white flex items-center gap-2">
                <Trash2 className="w-5 h-5 text-red-500" />
                تأكيد حذف الإعلان
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <p className="text-sm text-neutral-300">
                هل أنت متأكد من رغبتك في حذف إعلان <strong className="text-white">"{deleteConfirmModal.title}"</strong> نهائياً؟
              </p>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-800">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setDeleteConfirmModal(null)}
                  className="border-neutral-800 text-neutral-300"
                >
                  إلغاء
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  isLoading={deletingId === deleteConfirmModal.id}
                  onClick={confirmDeleteAd}
                  className="bg-red-600 hover:bg-red-500 font-bold"
                >
                  تأكيد الحذف
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
