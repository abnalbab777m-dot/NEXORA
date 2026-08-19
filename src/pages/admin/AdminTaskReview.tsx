import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { LoadingState } from '../../components/ui/LoadingState';
import { ErrorState } from '../../components/ui/ErrorState';
import { formatCurrency, cn } from '../../lib/utils';
import { useToast } from '../../components/ui/Toast';
import { 
  CheckSquare, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Eye, 
  Search, 
  Filter, 
  RefreshCw, 
  User, 
  Image as ImageIcon, 
  Crown, 
  ShieldCheck, 
  AlertTriangle, 
  ExternalLink,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Maximize2,
  X,
  FileCheck,
  Send,
  HelpCircle,
  Phone,
  Mail
} from 'lucide-react';
import { api } from '../../lib/api';

interface TaskSubmissionItem {
  id: string;
  taskId: string;
  userId: string;
  reward: number;
  status: 'PENDING' | 'COMPLETED' | 'APPROVED' | 'REJECTED';
  proofImage?: string | null;
  proofAccount?: string | null;
  rejectionReason?: string | null;
  completedAt: string;
  reviewedAt?: string | null;
  reviewedBy?: string | null;
  taskTitle?: string;
  taskCategory?: string;
  taskDescription?: string;
  taskProofInstructions?: string;
  taskReward?: number;
  userDisplayName?: string;
  userUsername?: string;
  userEmail?: string;
  userPhone?: string;
  userVipLevel?: number;
}

export default function AdminTaskReview() {
  const toast = useToast();

  const [submissions, setSubmissions] = useState<TaskSubmissionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Search
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'PENDING' | 'COMPLETED' | 'REJECTED'>('PENDING');
  const [searchQuery, setSearchQuery] = useState('');

  // Proof Modal
  const [selectedSubmission, setSelectedSubmission] = useState<TaskSubmissionItem | null>(null);
  const [proofImageBlob, setProofImageBlob] = useState<string | null>(null);
  const [loadingProof, setLoadingProof] = useState(false);
  const [imageZoom, setImageZoom] = useState(1);
  const [imageRotation, setImageRotation] = useState(0);

  // Rejection Modal / State
  const [rejectingSubmission, setRejectingSubmission] = useState<TaskSubmissionItem | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isProcessingAction, setIsProcessingAction] = useState(false);

  // Predefined rejection reasons for quick selection
  const quickReasons = [
    'لقطة الشاشة غير واضحة أو غير مكتملة',
    'الحساب المذكور لم يقم بالانضمام أو الاشتراك المطلوب',
    'لقطة الشاشة مكررة أو مستخدمة سابقاً',
    'لم يتم استيفاء جميع خطوات وشروط المهمة',
    'اسم المستخدم أو المعرف غير متطابق مع المنفذ الفعلي'
  ];

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const fetchSubmissions = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.admin.getTaskSubmissions();
      const list = res.submissions || res.completions || [];
      setSubmissions(list);
    } catch (err: any) {
      setError(err.message || 'فشل في جلب طلبات إنجاز المهام');
      toast.error('خطأ في جلب البيانات', err.message);
    } finally {
      setLoading(false);
    }
  };

  // Open Proof Viewer Modal
  const handleOpenProofModal = async (sub: TaskSubmissionItem) => {
    setSelectedSubmission(sub);
    setImageZoom(1);
    setImageRotation(0);

    if (sub.proofImage === 'AVAILABLE' || !sub.proofImage || sub.proofImage.length < 50) {
      setLoadingProof(true);
      setProofImageBlob(null);
      try {
        const res = await api.admin.getCompletionProof(sub.id);
        setProofImageBlob(res.proofImage || null);
      } catch (err: any) {
        toast.error('فشل في تحميل لقطة الشاشة', err.message);
      } finally {
        setLoadingProof(false);
      }
    } else {
      setProofImageBlob(sub.proofImage);
    }
  };

  // Direct Approval
  const handleApprove = async (sub: TaskSubmissionItem) => {
    setIsProcessingAction(true);
    try {
      await api.admin.approveTaskSubmission(sub.id);
      toast.success(
        'تمت الموافقة بنجاح!',
        `تم اعتماد الإثبات وصرف مكافأة ${formatCurrency(sub.reward)} فوراً لمحفظة المستخدم ${sub.userDisplayName || sub.userUsername || sub.userEmail}`
      );
      if (selectedSubmission?.id === sub.id) {
        setSelectedSubmission(null);
      }
      await fetchSubmissions();
    } catch (err: any) {
      toast.error('خطأ في اعتماد الطلب', err.message);
    } finally {
      setIsProcessingAction(false);
    }
  };

  // Open Rejection Dialog
  const handleOpenReject = (sub: TaskSubmissionItem) => {
    setRejectingSubmission(sub);
    setRejectionReason('');
  };

  // Confirm Rejection
  const handleConfirmReject = async () => {
    if (!rejectingSubmission) return;
    const reason = rejectionReason.trim() || 'إثبات غير مكتمل أو غير مطابق لشروط المهمة';

    setIsProcessingAction(true);
    try {
      await api.admin.rejectTaskSubmission(rejectingSubmission.id, reason);
      toast.success(
        'تم رفض الإثبات بنجاح',
        `تم إشعار المستخدم بسبب الرفض وإتاحة إعادة المحاولة.`
      );
      setRejectingSubmission(null);
      setRejectionReason('');
      if (selectedSubmission?.id === rejectingSubmission.id) {
        setSelectedSubmission(null);
      }
      await fetchSubmissions();
    } catch (err: any) {
      toast.error('فشل في معالجة الرفض', err.message);
    } finally {
      setIsProcessingAction(false);
    }
  };

  // KPI calculations
  const totalCount = submissions.length;
  const pendingList = submissions.filter(s => s.status === 'PENDING');
  const completedList = submissions.filter(s => s.status === 'COMPLETED' || s.status === 'APPROVED');
  const rejectedList = submissions.filter(s => s.status === 'REJECTED');
  const totalRewardedAmount = completedList.reduce((acc, s) => acc + (Number(s.reward) || 0), 0);

  // Filtered List
  const filteredSubmissions = submissions.filter(s => {
    // Tab filter
    if (activeFilter === 'PENDING' && s.status !== 'PENDING') return false;
    if (activeFilter === 'COMPLETED' && (s.status !== 'COMPLETED' && s.status !== 'APPROVED')) return false;
    if (activeFilter === 'REJECTED' && s.status !== 'REJECTED') return false;

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTask = s.taskTitle?.toLowerCase().includes(q) || false;
      const matchUser = s.userEmail?.toLowerCase().includes(q) || 
                        s.userDisplayName?.toLowerCase().includes(q) || 
                        s.userUsername?.toLowerCase().includes(q) || 
                        s.userId?.toLowerCase().includes(q) || false;
      const matchAccount = s.proofAccount?.toLowerCase().includes(q) || false;
      const matchPhone = s.userPhone?.toLowerCase().includes(q) || false;
      return matchTask || matchUser || matchAccount || matchPhone;
    }

    return true;
  });

  if (loading && submissions.length === 0) {
    return <LoadingState message="جاري تجهيز قسم مراجعة إثباتات المهام اليومية..." />;
  }

  if (error && submissions.length === 0) {
    return <ErrorState message={error} onRetry={fetchSubmissions} />;
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-l from-neutral-900 via-neutral-900/90 to-neutral-950 border border-neutral-800 p-6 rounded-2xl shadow-lg">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-7 h-7 text-yellow-500" />
            <h1 className="text-2xl font-bold text-white">قسم مراجعة إثباتات المهام (Task Review)</h1>
          </div>
          <p className="text-neutral-400 text-sm mt-1">
            مراجعة لقطات الشاشة والمعرفات المرسلة من المستخدمين كإثبات على تنفيذ المهام، والموافقة الفورية لصرف المكافآت أو الرفض مع توضيح السبب.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchSubmissions}
            disabled={loading}
            className="border-neutral-800 text-neutral-300 hover:text-white"
          >
            <RefreshCw className={cn("w-4 h-4 ml-1.5", loading && "animate-spin")} />
            تحديث القائمة
          </Button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Pending Card */}
        <Card 
          onClick={() => setActiveFilter('PENDING')}
          className={cn(
            "cursor-pointer transition-all border",
            activeFilter === 'PENDING' 
              ? "bg-amber-500/10 border-amber-500/50 shadow-md ring-1 ring-amber-500/20" 
              : "bg-neutral-900/40 border-neutral-800 hover:border-neutral-700"
          )}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-neutral-400">قيد المراجعة (معلقة)</CardTitle>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
              <Clock className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-amber-400 font-mono">
              {pendingList.length}
            </div>
            <p className="text-xs text-neutral-400 mt-1">
              {pendingList.length > 0 ? 'تتطلب فحص المشرف واعتماد المكافأة' : 'لا توجد طلبات معلقة حالياً'}
            </p>
          </CardContent>
        </Card>

        {/* Approved Card */}
        <Card 
          onClick={() => setActiveFilter('COMPLETED')}
          className={cn(
            "cursor-pointer transition-all border",
            activeFilter === 'COMPLETED' 
              ? "bg-emerald-500/10 border-emerald-500/50 shadow-md ring-1 ring-emerald-500/20" 
              : "bg-neutral-900/40 border-neutral-800 hover:border-neutral-700"
          )}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-neutral-400">المقبولة والمصروفة</CardTitle>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-emerald-400 font-mono">
              {completedList.length}
            </div>
            <p className="text-xs text-neutral-400 mt-1">
              إجمالي المكافآت: <span className="text-emerald-400 font-bold font-mono">{formatCurrency(totalRewardedAmount)}</span>
            </p>
          </CardContent>
        </Card>

        {/* Rejected Card */}
        <Card 
          onClick={() => setActiveFilter('REJECTED')}
          className={cn(
            "cursor-pointer transition-all border",
            activeFilter === 'REJECTED' 
              ? "bg-red-500/10 border-red-500/50 shadow-md ring-1 ring-red-500/20" 
              : "bg-neutral-900/40 border-neutral-800 hover:border-neutral-700"
          )}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-neutral-400">الإثباتات المرفوضة</CardTitle>
            <div className="w-8 h-8 rounded-lg bg-red-500/10 text-red-400 flex items-center justify-center border border-red-500/20">
              <XCircle className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-red-400 font-mono">
              {rejectedList.length}
            </div>
            <p className="text-xs text-neutral-400 mt-1">
              تم إشعار المستخدمين بسبب عدم القبول
            </p>
          </CardContent>
        </Card>

        {/* Total Submissions */}
        <Card 
          onClick={() => setActiveFilter('ALL')}
          className={cn(
            "cursor-pointer transition-all border",
            activeFilter === 'ALL' 
              ? "bg-yellow-500/10 border-yellow-500/50 shadow-md ring-1 ring-yellow-500/20" 
              : "bg-neutral-900/40 border-neutral-800 hover:border-neutral-700"
          )}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-neutral-400">إجمالي جميع الطلبات</CardTitle>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/20">
              <FileCheck className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-white font-mono">
              {totalCount}
            </div>
            <p className="text-xs text-neutral-400 mt-1">
              سجل كامل للطلبات منذ إطلاق المنصة
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filter Tabs & Search Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border-b border-neutral-800 pb-3">
        {/* Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setActiveFilter('PENDING')}
            className={cn(
              "px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap",
              activeFilter === 'PENDING'
                ? "bg-amber-500 text-neutral-950 shadow-md shadow-amber-500/20"
                : "bg-neutral-900 text-neutral-400 hover:text-white hover:bg-neutral-800"
            )}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>قيد المراجعة</span>
            <span className={cn(
              "px-1.5 py-0.2 rounded-full text-[10px]",
              activeFilter === 'PENDING' ? "bg-black/20 text-neutral-950" : "bg-neutral-800 text-neutral-300"
            )}>
              {pendingList.length}
            </span>
          </button>

          <button
            onClick={() => setActiveFilter('ALL')}
            className={cn(
              "px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap",
              activeFilter === 'ALL'
                ? "bg-yellow-500 text-neutral-950 shadow-md shadow-yellow-500/20"
                : "bg-neutral-900 text-neutral-400 hover:text-white hover:bg-neutral-800"
            )}
          >
            <span>جميع الطلبات</span>
            <span className={cn(
              "px-1.5 py-0.2 rounded-full text-[10px]",
              activeFilter === 'ALL' ? "bg-black/20 text-neutral-950" : "bg-neutral-800 text-neutral-300"
            )}>
              {totalCount}
            </span>
          </button>

          <button
            onClick={() => setActiveFilter('COMPLETED')}
            className={cn(
              "px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap",
              activeFilter === 'COMPLETED'
                ? "bg-emerald-500 text-neutral-950 shadow-md shadow-emerald-500/20"
                : "bg-neutral-900 text-neutral-400 hover:text-white hover:bg-neutral-800"
            )}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>المقبولة</span>
            <span className={cn(
              "px-1.5 py-0.2 rounded-full text-[10px]",
              activeFilter === 'COMPLETED' ? "bg-black/20 text-neutral-950" : "bg-neutral-800 text-neutral-300"
            )}>
              {completedList.length}
            </span>
          </button>

          <button
            onClick={() => setActiveFilter('REJECTED')}
            className={cn(
              "px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap",
              activeFilter === 'REJECTED'
                ? "bg-red-500 text-white shadow-md shadow-red-500/20"
                : "bg-neutral-900 text-neutral-400 hover:text-white hover:bg-neutral-800"
            )}
          >
            <XCircle className="w-3.5 h-3.5" />
            <span>المرفوضة</span>
            <span className={cn(
              "px-1.5 py-0.2 rounded-full text-[10px]",
              activeFilter === 'REJECTED' ? "bg-black/20 text-white" : "bg-neutral-800 text-neutral-300"
            )}>
              {rejectedList.length}
            </span>
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute right-3 top-3 text-neutral-500" />
          <Input 
            id="search-task-submissions"
            placeholder="بحث بالمستخدم، المهمة، أو الحساب..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pr-9 bg-neutral-900/80 border-neutral-800 text-xs"
          />
        </div>
      </div>

      {/* Main Table Card */}
      <Card className="border-neutral-800 bg-neutral-900/40 overflow-hidden shadow-xl">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-right">
              <thead className="text-xs text-neutral-400 uppercase bg-neutral-950/80 border-b border-neutral-800 font-semibold">
                <tr>
                  <th className="px-5 py-4">التاريخ والوقت</th>
                  <th className="px-5 py-4">المستخدم</th>
                  <th className="px-5 py-4">المهمة المطلوب إنجازها</th>
                  <th className="px-5 py-4">إثبات التنفيذ (الحساب / Screenshot)</th>
                  <th className="px-5 py-4">المكافأة</th>
                  <th className="px-5 py-4">حالة الطلب</th>
                  <th className="px-5 py-4 text-center">القرار والإجراء</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/60 font-sans">
                {filteredSubmissions.map((sub) => {
                  const isPending = sub.status === 'PENDING';
                  const isApproved = sub.status === 'COMPLETED' || sub.status === 'APPROVED';
                  const isRejected = sub.status === 'REJECTED';

                  return (
                    <tr 
                      key={sub.id} 
                      className={cn(
                        "transition-colors",
                        isPending ? "hover:bg-amber-500/5 bg-amber-500/[0.02]" : "hover:bg-neutral-900/60"
                      )}
                    >
                      {/* Date & Time */}
                      <td className="px-5 py-4 text-xs font-mono text-neutral-400 whitespace-nowrap">
                        <div>
                          {sub.completedAt ? new Date(sub.completedAt).toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric' }) : '-'}
                        </div>
                        <div className="text-[10px] text-neutral-500 mt-0.5">
                          {sub.completedAt ? new Date(sub.completedAt).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }) : ''}
                        </div>
                      </td>

                      {/* User Info */}
                      <td className="px-5 py-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-white text-xs">
                              {sub.userDisplayName || sub.userUsername || 'مستخدم'}
                            </span>
                            {sub.userVipLevel !== undefined && (
                              <span className="px-1.5 py-0.5 rounded bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 text-[10px] font-bold">
                                VIP {sub.userVipLevel}
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] font-mono text-neutral-400 truncate max-w-[180px]" dir="ltr">
                            {sub.userEmail || sub.userId}
                          </div>
                          {sub.userPhone && (
                            <div className="text-[10px] font-mono text-neutral-500" dir="ltr">
                              {sub.userPhone}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Task Info */}
                      <td className="px-5 py-4">
                        <div className="space-y-1 max-w-xs">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-300 font-medium">
                              {sub.taskCategory || 'TELEGRAM'}
                            </span>
                            <span className="font-bold text-white text-xs block truncate">
                              {sub.taskTitle || sub.taskId}
                            </span>
                          </div>
                          {sub.taskProofInstructions && (
                            <p className="text-[11px] text-yellow-500/80 line-clamp-1">
                              {sub.taskProofInstructions}
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Proof Data */}
                      <td className="px-5 py-4">
                        <div className="flex flex-col gap-1.5">
                          {sub.proofAccount && (
                            <div className="flex items-center gap-1">
                              <span className="text-[10px] text-neutral-500">الحساب:</span>
                              <span className="px-2 py-0.5 bg-neutral-950 border border-neutral-800 text-yellow-400 font-mono text-xs rounded font-bold" dir="ltr">
                                {sub.proofAccount}
                              </span>
                            </div>
                          )}

                          {sub.proofImage ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenProofModal(sub)}
                              className="self-start text-[11px] h-7 px-2.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border-blue-500/30 flex items-center gap-1"
                            >
                              <ImageIcon className="w-3.5 h-3.5" />
                              معاينة لقطة الشاشة
                            </Button>
                          ) : !sub.proofAccount ? (
                            <span className="text-xs text-neutral-500">إنجاز تلقائي مباشر</span>
                          ) : null}
                        </div>
                      </td>

                      {/* Reward */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className="font-mono font-bold text-base text-yellow-400">
                          {formatCurrency(sub.reward)}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        {isApproved && (
                          <div className="inline-flex flex-col">
                            <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              تمت الموافقة وصرف المكافأة
                            </span>
                            {sub.reviewedAt && (
                              <span className="text-[10px] text-neutral-500 mt-1 font-mono">
                                {new Date(sub.reviewedAt).toLocaleDateString('ar-EG')}
                              </span>
                            )}
                          </div>
                        )}

                        {isPending && (
                          <span className="px-2.5 py-1 rounded-lg bg-amber-500/15 text-amber-400 border border-amber-500/30 text-xs font-bold flex items-center gap-1.5 animate-pulse">
                            <Clock className="w-3.5 h-3.5" />
                            قيد مراجعة الإدارة
                          </span>
                        )}

                        {isRejected && (
                          <div className="space-y-1">
                            <span className="px-2.5 py-1 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 text-xs font-bold flex items-center gap-1">
                              <XCircle className="w-3.5 h-3.5" />
                              تم الرفض
                            </span>
                            {sub.rejectionReason && (
                              <p className="text-[10px] text-red-400/80 max-w-xs leading-relaxed">
                                {sub.rejectionReason}
                              </p>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4 text-center whitespace-nowrap">
                        {isPending ? (
                          <div className="flex items-center justify-center gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleApprove(sub)}
                              disabled={isProcessingAction}
                              className="bg-emerald-500 hover:bg-emerald-600 text-neutral-950 font-bold text-xs h-8 px-3 shadow-md shadow-emerald-500/20"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5 ml-1" />
                              قبول وصرف
                            </Button>

                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleOpenProofModal(sub)}
                              className="border-neutral-700 hover:border-yellow-500/50 text-neutral-300 hover:text-white text-xs h-8 px-2.5"
                            >
                              <Eye className="w-3.5 h-3.5 ml-1" />
                              فحص
                            </Button>

                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleOpenReject(sub)}
                              disabled={isProcessingAction}
                              className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-xs h-8 px-2.5"
                            >
                              <XCircle className="w-3.5 h-3.5 ml-1" />
                              رفض
                            </Button>
                          </div>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenProofModal(sub)}
                            className="text-xs text-neutral-400 hover:text-white"
                          >
                            <Eye className="w-3.5 h-3.5 ml-1" />
                            عرض التفاصيل
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })}

                {filteredSubmissions.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center py-16">
                      <FileCheck className="w-12 h-12 text-neutral-600 mx-auto mb-3" />
                      <h3 className="text-white font-bold text-base mb-1">لا توجد طلبات مطابقة</h3>
                      <p className="text-xs text-neutral-400">
                        {activeFilter === 'PENDING' 
                          ? 'رائع! لا توجد طلبات إثبات معلقة بانتظار المراجعة حالياً.'
                          : 'لم يتم العثور على أي طلبات تطابق الفلتر أو كلمة البحث.'}
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* COMPREHENSIVE PROOF & ACTION MODAL */}
      {selectedSubmission && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-neutral-900 border border-neutral-700 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden relative my-auto">
            {/* Modal Header */}
            <div className="bg-neutral-950 px-6 py-4 border-b border-neutral-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-yellow-500" />
                <h3 className="font-bold text-white text-base">
                  معاينة إثبات المهمة واتخاذ القرار
                </h3>
              </div>
              <button 
                onClick={() => setSelectedSubmission(null)}
                className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-5">
              {/* Top metadata grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-neutral-950 p-4 rounded-xl border border-neutral-800 text-xs">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-400">المهمة:</span>
                    <span className="text-white font-bold">{selectedSubmission.taskTitle}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-400">المكافأة:</span>
                    <span className="text-yellow-400 font-bold font-mono text-sm">{formatCurrency(selectedSubmission.reward)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-400">تاريخ الإرسال:</span>
                    <span className="text-neutral-300 font-mono">
                      {selectedSubmission.completedAt ? new Date(selectedSubmission.completedAt).toLocaleString('ar-EG') : '-'}
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5 sm:border-r sm:border-neutral-800 sm:pr-3">
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-400">المستخدم:</span>
                    <span className="text-white font-semibold">{selectedSubmission.userDisplayName || selectedSubmission.userUsername || 'مستخدم'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-400">البريد الإلكتروني:</span>
                    <span className="text-neutral-300 font-mono truncate max-w-[140px]" dir="ltr">{selectedSubmission.userEmail}</span>
                  </div>
                  {selectedSubmission.proofAccount && (
                    <div className="flex items-center justify-between pt-1 border-t border-neutral-800/60">
                      <span className="text-neutral-400">حساب المنفذ:</span>
                      <span className="text-yellow-400 font-bold font-mono" dir="ltr">{selectedSubmission.proofAccount}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Task Proof Instructions Reference */}
              {selectedSubmission.taskProofInstructions && (
                <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-xl p-3 text-xs text-yellow-200/90 flex items-start gap-2">
                  <HelpCircle className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-yellow-400 block mb-0.5">تعليمات الإثبات المطلوبة للمهمة:</span>
                    <p className="leading-relaxed">{selectedSubmission.taskProofInstructions}</p>
                  </div>
                </div>
              )}

              {/* High-res Screenshot Viewer with Controls */}
              {(selectedSubmission.proofImage || proofImageBlob) && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-neutral-300 flex items-center gap-1.5">
                      <ImageIcon className="w-4 h-4 text-yellow-500" />
                      لقطة الشاشة المرفقة (Screenshot Proof):
                    </span>

                    {/* Image Controls */}
                    <div className="flex items-center gap-1 bg-neutral-950 border border-neutral-800 rounded-lg p-1">
                      <button
                        onClick={() => setImageZoom(prev => Math.min(prev + 0.25, 3))}
                        className="p-1 text-neutral-400 hover:text-white rounded hover:bg-neutral-800"
                        title="تكبير"
                      >
                        <ZoomIn className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setImageZoom(prev => Math.max(prev - 0.25, 0.5))}
                        className="p-1 text-neutral-400 hover:text-white rounded hover:bg-neutral-800"
                        title="تصغير"
                      >
                        <ZoomOut className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setImageRotation(prev => (prev + 90) % 360)}
                        className="p-1 text-neutral-400 hover:text-white rounded hover:bg-neutral-800"
                        title="تدوير 90 درجة"
                      >
                        <RotateCw className="w-3.5 h-3.5" />
                      </button>
                      {proofImageBlob && (
                        <button
                          onClick={() => window.open(proofImageBlob, '_blank')}
                          className="p-1 text-neutral-400 hover:text-yellow-400 rounded hover:bg-neutral-800"
                          title="فتح الصورة في نافذة جديدة"
                        >
                          <Maximize2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="rounded-xl border border-neutral-800 overflow-hidden bg-black p-2 flex items-center justify-center min-h-[220px] max-h-[360px] overflow-auto">
                    {loadingProof ? (
                      <LoadingState message="جاري جلب لقطة الشاشة الأصلية..." />
                    ) : proofImageBlob ? (
                      <img 
                        src={proofImageBlob} 
                        alt="Proof screenshot" 
                        style={{
                          transform: `scale(${imageZoom}) rotate(${imageRotation}deg)`,
                          transition: 'transform 0.2s ease'
                        }}
                        className="max-h-[320px] w-auto object-contain rounded-lg shadow-lg"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <span className="text-xs text-neutral-500">لا توجد صورة مرفقة</span>
                    )}
                  </div>
                </div>
              )}

              {/* Status footer / Actions */}
              <div className="pt-3 border-t border-neutral-800">
                {selectedSubmission.status === 'PENDING' ? (
                  <div className="flex items-center justify-end gap-3">
                    <Button
                      variant="secondary"
                      onClick={() => setSelectedSubmission(null)}
                      className="border-neutral-800 text-neutral-300 text-xs"
                    >
                      إغلاق
                    </Button>

                    <Button
                      variant="destructive"
                      disabled={isProcessingAction}
                      onClick={() => handleOpenReject(selectedSubmission)}
                      className="bg-red-500/15 hover:bg-red-500/25 text-red-400 border border-red-500/30 text-xs font-bold px-4"
                    >
                      <XCircle className="w-4 h-4 ml-1.5" />
                      رفض الإثبات
                    </Button>

                    <Button
                      disabled={isProcessingAction}
                      onClick={() => handleApprove(selectedSubmission)}
                      className="bg-emerald-500 hover:bg-emerald-600 text-neutral-950 font-bold text-xs px-5 shadow-lg shadow-emerald-500/20"
                    >
                      <CheckCircle2 className="w-4 h-4 ml-1.5" />
                      موافقة وصرف {formatCurrency(selectedSubmission.reward)}
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="text-xs">
                      <span className="text-neutral-500">حالة الإثبات: </span>
                      <span className={cn(
                        "font-bold",
                        selectedSubmission.status === 'COMPLETED' ? "text-emerald-400" : "text-red-400"
                      )}>
                        {selectedSubmission.status === 'COMPLETED' ? 'تمت الموافقة وصرف المكافأة' : 'تم الرفض'}
                      </span>
                    </div>

                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setSelectedSubmission(null)}
                      className="border-neutral-800 text-neutral-300 text-xs"
                    >
                      إغلاق
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* REJECTION REASON DIALOG MODAL */}
      {rejectingSubmission && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <Card className="w-full max-w-lg border-neutral-800 bg-neutral-900 shadow-2xl animate-in fade-in zoom-in-95">
            <CardHeader className="flex flex-row items-center justify-between border-b border-neutral-800 pb-4">
              <CardTitle className="text-base text-white flex items-center gap-2">
                <XCircle className="w-5 h-5 text-red-500" />
                تأكيد رفض إثبات المهمة وتحديد السبب
              </CardTitle>
              <button 
                onClick={() => setRejectingSubmission(null)}
                className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800"
              >
                <X className="w-5 h-5" />
              </button>
            </CardHeader>

            <CardContent className="pt-5 space-y-4">
              <p className="text-xs text-neutral-300">
                سيتم إرسال إشعار فوري وتنبيه للمستخدم <strong className="text-white">{rejectingSubmission.userDisplayName || rejectingSubmission.userEmail}</strong> بسبب الرفض حتى يتمكن من إعادة المحاولة.
              </p>

              {/* Quick Reason Chips */}
              <div>
                <label className="block text-xs font-semibold text-neutral-400 mb-2">
                  اختر سبباً سريعاً أو اكتب سبباً مخصصاً:
                </label>
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {quickReasons.map((qr, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setRejectionReason(qr)}
                      className={cn(
                        "text-[11px] px-2.5 py-1 rounded-lg border transition-colors text-right",
                        rejectionReason === qr 
                          ? "bg-red-500/20 border-red-500 text-white font-bold" 
                          : "bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-neutral-200 hover:border-neutral-700"
                      )}
                    >
                      {qr}
                    </button>
                  ))}
                </div>

                <textarea
                  id="rejection-reason-textarea"
                  rows={3}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="اكتب سبب الرفض المفصل للمستخدم..."
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-red-500/50"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-800">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setRejectingSubmission(null)}
                  className="border-neutral-800 text-neutral-300 text-xs"
                >
                  إلغاء
                </Button>

                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  isLoading={isProcessingAction}
                  onClick={handleConfirmReject}
                  className="bg-red-600 hover:bg-red-500 text-white font-bold text-xs px-5 shadow-lg shadow-red-600/20"
                >
                  <XCircle className="w-4 h-4 ml-1.5" />
                  تأكيد رفض الإثبات
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
