import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { LoadingState } from '../../components/ui/LoadingState';
import { ErrorState } from '../../components/ui/ErrorState';
import { useToast } from '../../components/ui/Toast';
import { 
  CreditCard, 
  Plus, 
  Edit3, 
  Trash2, 
  CheckCircle2, 
  XCircle, 
  RefreshCw, 
  QrCode, 
  ArrowDownToLine, 
  ArrowUpFromLine, 
  ArrowLeftRight, 
  Copy, 
  Check, 
  AlertCircle,
  AlertTriangle,
  ToggleLeft,
  ToggleRight,
  Sparkles,
  Info
} from 'lucide-react';
import { PaymentMethod } from '../../types/models';
import { api } from '../../lib/api';
import { formatCurrency, cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

export default function AdminPaymentMethods() {
  const toast = useToast();
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal / Form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMethod, setEditingMethod] = useState<PaymentMethod | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  // Custom in-app Confirmation Dialog state for Delete
  const [methodToDelete, setMethodToDelete] = useState<PaymentMethod | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Form Fields
  const [formData, setFormData] = useState({
    name: '',
    type: 'BOTH' as 'DEPOSIT' | 'WITHDRAWAL' | 'BOTH',
    walletAddressOrAccount: '',
    network: '',
    qrCodeUrl: '',
    minLimit: 1,
    maxLimit: 50000,
    networkFee: 0,
    instructions: '',
    isActive: true,
  });

  useEffect(() => {
    fetchMethods();
  }, []);

  const fetchMethods = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.admin.getPaymentMethods();
      setMethods(res.paymentMethods || []);
    } catch (err: any) {
      setError(err.message || 'فشل في تحميل وسائل الدفع');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreateModal = () => {
    setEditingMethod(null);
    setFormData({
      name: '',
      type: 'BOTH',
      walletAddressOrAccount: '',
      network: '',
      qrCodeUrl: '',
      minLimit: 10,
      maxLimit: 50000,
      networkFee: 0,
      instructions: '',
      isActive: true,
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (method: PaymentMethod) => {
    setEditingMethod(method);
    setFormData({
      name: method.name || '',
      type: method.type || 'BOTH',
      walletAddressOrAccount: method.walletAddressOrAccount || '',
      network: method.network || '',
      qrCodeUrl: method.qrCodeUrl || '',
      minLimit: Number(method.minLimit) || 0,
      maxLimit: Number(method.maxLimit) || 0,
      networkFee: Number(method.networkFee) || 0,
      instructions: method.instructions || '',
      isActive: method.isActive ?? true,
    });
    setIsModalOpen(true);
  };

  const handleSaveMethod = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.walletAddressOrAccount.trim()) {
      toast.warning('يرجى ملء اسم الوسيلة وعنوان المحفظة/رقم الحساب');
      return;
    }

    setIsSaving(true);
    try {
      if (editingMethod) {
        await api.admin.updatePaymentMethod(editingMethod.id, formData);
        toast.success('تم تحديث وسيلة الدفع بنجاح');
      } else {
        await api.admin.createPaymentMethod(formData);
        toast.success('تم إنشاء وسيلة دفع جديدة بنجاح');
      }
      setIsModalOpen(false);
      setEditingMethod(null);
      await fetchMethods();
    } catch (err: any) {
      toast.error('حدث خطأ أثناء حفظ وسيلة الدفع', err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleStatus = async (method: PaymentMethod) => {
    try {
      const res = await api.admin.togglePaymentMethod(method.id);
      setMethods(prev =>
        prev.map(m => (m.id === method.id ? { ...m, isActive: res.isActive } : m))
      );
      toast.success(res.message || 'تم تحديث حالة الوسيلة');
    } catch (err: any) {
      toast.error('فشل في تغيير الحالة', err.message);
    }
  };

  const handleConfirmDelete = async () => {
    if (!methodToDelete) return;

    setIsDeleting(true);
    try {
      await api.admin.deletePaymentMethod(methodToDelete.id);
      setMethods(prev => prev.filter(m => m.id !== methodToDelete.id));
      toast.success('تم حذف وسيلة الدفع بنجاح', `تم حذف "${methodToDelete.name}" من النظام`);
      setMethodToDelete(null);
    } catch (err: any) {
      toast.error('فشل في حذف وسيلة الدفع', err.message || 'حدث خطأ غير متوقع');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCopyAddress = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success('تم نسخ العنوان بنجاح');
    setTimeout(() => setCopiedId(null), 2500);
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'DEPOSIT':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <ArrowDownToLine className="w-3 h-3" /> إيداع فقط
          </span>
        );
      case 'WITHDRAWAL':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <ArrowUpFromLine className="w-3 h-3" /> سحب فقط
          </span>
        );
      case 'BOTH':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
            <ArrowLeftRight className="w-3 h-3" /> إيداع وسحب
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-neutral-900 via-neutral-900 to-neutral-900/90 p-6 rounded-2xl border border-neutral-800 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center text-yellow-500 shrink-0">
            <CreditCard className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              إدارة وسائل الإيداع والسحب
              <span className="text-xs bg-neutral-800 text-neutral-300 px-2.5 py-0.5 rounded-full font-normal border border-neutral-700">
                {methods.length} طريقة
              </span>
            </h1>
            <p className="text-neutral-400 text-xs sm:text-sm mt-0.5">
              تحكم كامل في بوابات الدفع (USDT, Sham Cash, Payeer, فودافون كاش وغيرها) مع عناوين الاستقبال والحدود المالية
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchMethods}
            className="border-neutral-800 text-neutral-300 hover:text-white"
          >
            <RefreshCw className="w-4 h-4 ml-2" />
            تحديث
          </Button>
          <Button 
            id="btn-add-payment-method"
            variant="primary" 
            onClick={handleOpenCreateModal}
            className="bg-yellow-500 hover:bg-yellow-400 text-neutral-950 font-bold"
          >
            <Plus className="w-4 h-4 ml-1.5" />
            إضافة طريقة دفع جديدة
          </Button>
        </div>
      </div>

      {/* Main Content List / Cards */}
      {loading ? (
        <LoadingState message="جاري تحميل وسائل الدفع الحالية..." />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchMethods} />
      ) : methods.length === 0 ? (
        <Card className="border-neutral-800 bg-neutral-900/40 text-center p-12">
          <CreditCard className="w-12 h-12 text-neutral-600 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-white mb-1">لا توجد وسائل دفع مضافة حالياً</h3>
          <p className="text-sm text-neutral-400 mb-6 max-w-md mx-auto">
            قم بإضافة أول وسيلة دفع أو محفظة لاستقبال وتسيير مدفوعات وسحوبات المستخدمين.
          </p>
          <Button onClick={handleOpenCreateModal} className="bg-yellow-500 text-neutral-950 font-bold">
            <Plus className="w-4 h-4 ml-2" /> إضافة وسيلة الآن
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {methods.map((method) => {
            const isCopied = copiedId === method.id;

            return (
              <Card 
                key={method.id}
                id={`payment-method-card-${method.id}`}
                className={cn(
                  "border transition-all duration-200 relative overflow-hidden flex flex-col justify-between",
                  method.isActive 
                    ? "border-neutral-800 bg-neutral-900/60 hover:border-yellow-500/40 shadow-lg" 
                    : "border-neutral-800/40 bg-neutral-950/40 opacity-70"
                )}
              >
                <div>
                  {/* Card Top Header */}
                  <div className="p-4 border-b border-neutral-800/60 flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-white text-base truncate">{method.name}</h3>
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                        {getTypeBadge(method.type)}
                        {method.network && (
                          <span className="text-[11px] font-mono text-neutral-400 bg-neutral-800/80 px-2 py-0.5 rounded border border-neutral-700/50">
                            {method.network}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Active Toggle Status Button */}
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(method)}
                      title={method.isActive ? 'تعطيل الوسيلة' : 'تفعيل الوسيلة'}
                      className={cn(
                        "p-1 rounded-lg transition-colors flex items-center gap-1 text-xs font-semibold",
                        method.isActive 
                          ? "text-emerald-400 hover:bg-emerald-500/10" 
                          : "text-neutral-500 hover:bg-neutral-800"
                      )}
                    >
                      {method.isActive ? (
                        <span className="flex items-center gap-1 text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-lg border border-emerald-500/20 text-[11px]">
                          <CheckCircle2 className="w-3.5 h-3.5" /> مفعلة
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-neutral-400 bg-neutral-800 px-2 py-1 rounded-lg border border-neutral-700 text-[11px]">
                          <XCircle className="w-3.5 h-3.5" /> معطلة
                        </span>
                      )}
                    </button>
                  </div>

                  {/* Card Body Details */}
                  <div className="p-4 space-y-3 text-xs">
                    {/* Wallet Address Box */}
                    <div className="space-y-1">
                      <span className="text-neutral-400 text-[11px] block">عنوان المحفظة / رقم الحساب المعتمد:</span>
                      <div className="flex items-center gap-1.5 p-2 bg-neutral-950 rounded-lg border border-neutral-800 font-mono text-yellow-400 text-xs">
                        <span className="truncate flex-1" dir="ltr">{method.walletAddressOrAccount}</span>
                        <button
                          type="button"
                          onClick={() => handleCopyAddress(method.walletAddressOrAccount, method.id)}
                          className="p-1 text-neutral-400 hover:text-white rounded transition-colors"
                          title="نسخ"
                        >
                          {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    {/* Limits & Fee Grid */}
                    <div className="grid grid-cols-3 gap-2 py-1.5 px-2.5 bg-neutral-950/60 rounded-xl border border-neutral-800/80 text-center">
                      <div>
                        <span className="text-[10px] text-neutral-500 block">الحد الأدنى</span>
                        <span className="font-bold text-white font-mono">{formatCurrency(method.minLimit)}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-neutral-500 block">الحد الأقصى</span>
                        <span className="font-bold text-white font-mono">{formatCurrency(method.maxLimit)}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-neutral-500 block">رسوم التحويل</span>
                        <span className="font-bold text-yellow-400 font-mono">
                          {method.networkFee > 0 ? formatCurrency(method.networkFee) : 'مجاني'}
                        </span>
                      </div>
                    </div>

                    {/* Instructions preview */}
                    {method.instructions && (
                      <div className="p-2 bg-neutral-950/40 rounded-lg border border-neutral-800/60 text-neutral-400 text-[11px] line-clamp-2">
                        <span className="font-semibold text-neutral-300 ml-1">تعليمات:</span>
                        {method.instructions}
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Footer Actions */}
                <div className="p-3 bg-neutral-950/80 border-t border-neutral-800/80 flex items-center justify-end gap-2">
                  <Button
                    id={`btn-edit-method-${method.id}`}
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenEditModal(method)}
                    className="text-xs border-neutral-700 text-neutral-300 hover:text-white flex items-center gap-1 py-1.5"
                  >
                    <Edit3 className="w-3.5 h-3.5 ml-1" />
                    تعديل
                  </Button>
                  <Button
                    id={`btn-delete-method-${method.id}`}
                    variant="ghost"
                    size="sm"
                    onClick={() => setMethodToDelete(method)}
                    className="text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 py-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5 ml-1" />
                    حذف
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Confirmation Modal for Delete (Custom Modal for smooth operation inside iframe) */}
      {methodToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-md bg-neutral-900 border border-neutral-700 rounded-2xl shadow-2xl overflow-hidden p-6 text-right">
            <div className="flex items-center gap-3 text-rose-500 mb-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white">تأكيد حذف طريقة الدفع</h3>
            </div>
            
            <p className="text-neutral-300 text-sm mb-4 leading-relaxed">
              هل أنت متأكد من رغبتك في حذف وسيلة الدفع <strong className="text-yellow-400">"{methodToDelete.name}"</strong> نهائياً؟ 
              لن تظهر هذه الوسيلة مجدداً للمستخدمين في صفحات الإيداع والسحب.
            </p>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-800">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setMethodToDelete(null)}
                disabled={isDeleting}
              >
                إلغاء
              </Button>
              <Button
                id="btn-confirm-delete-method"
                variant="danger"
                size="sm"
                onClick={handleConfirmDelete}
                isLoading={isDeleting}
                className="bg-rose-600 hover:bg-rose-500 text-white font-bold"
              >
                <Trash2 className="w-4 h-4 ml-1.5" />
                تأكيد الحذف
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal / Dialog for Add & Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-xl bg-neutral-900 border border-neutral-700 rounded-2xl shadow-2xl overflow-hidden my-8">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-neutral-800 bg-neutral-950">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-yellow-500/10 text-yellow-500 flex items-center justify-center font-bold">
                  <CreditCard className="w-4 h-4" />
                </div>
                <h2 className="text-lg font-bold text-white">
                  {editingMethod ? 'تعديل وسيلة الدفع' : 'إضافة وسيلة دفع جديدة'}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-neutral-400 hover:text-white p-1 rounded-lg hover:bg-neutral-800 transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveMethod} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Method Name */}
                <div className="md:col-span-2">
                  <Input
                    label="اسم وسيلة الدفع (Name)"
                    placeholder="مثال: USDT (TRC20) أو Sham Cash أو Payeer"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                {/* Operation Type */}
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                    نوع الاستخدام (Type)
                  </label>
                  <select
                    className="w-full bg-neutral-950 border border-neutral-800 text-white rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500/50"
                    value={formData.type}
                    onChange={e => setFormData({ ...formData, type: e.target.value as any })}
                  >
                    <option value="BOTH">إيداع وسحب (Both)</option>
                    <option value="DEPOSIT">إيداع فقط (Deposit Only)</option>
                    <option value="WITHDRAWAL">سحب فقط (Withdrawal Only)</option>
                  </select>
                </div>

                {/* Network Name */}
                <div>
                  <Input
                    label="الشبكة أو نوع الحساب (Network)"
                    placeholder="مثال: TRON (TRC20) أو BEP20"
                    value={formData.network}
                    onChange={e => setFormData({ ...formData, network: e.target.value })}
                  />
                </div>

                {/* Wallet Address / Account */}
                <div className="md:col-span-2">
                  <Input
                    label="عنوان المحفظة أو رقم الحساب لاستقبال التحويلات"
                    placeholder="أدخل عنوان المحفظة أو رقم الحساب المعتمد..."
                    value={formData.walletAddressOrAccount}
                    onChange={e => setFormData({ ...formData, walletAddressOrAccount: e.target.value })}
                    required
                    dir="ltr"
                    className="font-mono text-xs"
                  />
                </div>

                {/* Min Limit */}
                <div>
                  <Input
                    label="الحد الأدنى للعملية (Min Limit $)"
                    type="number"
                    min="0.1"
                    step="0.01"
                    value={formData.minLimit}
                    onChange={e => setFormData({ ...formData, minLimit: parseFloat(e.target.value) || 0 })}
                    required
                    dir="ltr"
                  />
                </div>

                {/* Max Limit */}
                <div>
                  <Input
                    label="الحد الأقصى للعملية (Max Limit $)"
                    type="number"
                    min="1"
                    step="1"
                    value={formData.maxLimit}
                    onChange={e => setFormData({ ...formData, maxLimit: parseFloat(e.target.value) || 0 })}
                    required
                    dir="ltr"
                  />
                </div>

                {/* Network Fee */}
                <div>
                  <Input
                    label="رسوم التحويل / الشبكة إن وجدت ($)"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.networkFee}
                    onChange={e => setFormData({ ...formData, networkFee: parseFloat(e.target.value) || 0 })}
                    dir="ltr"
                  />
                </div>

                {/* Status Toggle */}
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                    حالة التفعيل (Status)
                  </label>
                  <select
                    className="w-full bg-neutral-950 border border-neutral-800 text-white rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500/50"
                    value={formData.isActive ? 'ACTIVE' : 'INACTIVE'}
                    onChange={e => setFormData({ ...formData, isActive: e.target.value === 'ACTIVE' })}
                  >
                    <option value="ACTIVE">مفعلة وتظهر للمستخدمين</option>
                    <option value="INACTIVE">معطلة مؤقتاً</option>
                  </select>
                </div>

                {/* QR Code URL (optional) */}
                <div className="md:col-span-2">
                  <Input
                    label="رابط صورة رمز QR (اختياري)"
                    placeholder="https://... أو اتركه فارغاً لإنشاء الرمز تلقائياً"
                    value={formData.qrCodeUrl}
                    onChange={e => setFormData({ ...formData, qrCodeUrl: e.target.value })}
                    dir="ltr"
                  />
                </div>

                {/* Instructions */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                    تعليمات خاصة تظهر للمستخدم أثناء التحويل
                  </label>
                  <textarea
                    rows={3}
                    className="w-full bg-neutral-950 border border-neutral-800 text-white rounded-xl p-3 text-xs focus:outline-none focus:ring-2 focus:ring-yellow-500/50 resize-none leading-relaxed"
                    placeholder="مثال: يرجى إرسال عملة USDT عبر شبكة TRON فقط، وإدخال رقم المعاملة TXID بعد التحويل..."
                    value={formData.instructions}
                    onChange={e => setFormData({ ...formData, instructions: e.target.value })}
                  />
                </div>
              </div>

              {/* Form Buttons */}
              <div className="flex items-center gap-3 pt-4 border-t border-neutral-800">
                <Button
                  type="submit"
                  variant="primary"
                  className="flex-1 bg-yellow-500 hover:bg-yellow-400 text-neutral-950 font-bold py-2.5"
                  isLoading={isSaving}
                >
                  {editingMethod ? 'حفظ التعديلات' : 'إضافة وسيلة الدفع'}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSaving}
                >
                  إلغاء
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
