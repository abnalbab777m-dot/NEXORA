import React, { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { LoadingState } from '../../components/ui/LoadingState';
import { 
  CheckCircle2, 
  AlertCircle, 
  ShieldAlert, 
  Sparkles, 
  Send, 
  ExternalLink,
  Upload,
  Camera,
  UserCheck,
  Clock,
  Check,
  X,
  FileCheck2,
  HelpCircle
} from 'lucide-react';
import { Task, TaskCompletion } from '../../types/models';
import { useAuth } from '../../context/AuthContext';
import { useWallet } from '../../context/WalletContext';
import { useToast } from '../../components/ui/Toast';
import { formatCurrency, cn } from '../../lib/utils';
import { api } from '../../lib/api';
import { motion, AnimatePresence } from 'motion/react';

export default function TasksPage() {
  const { user, refreshUser } = useAuth();
  const { wallet, refreshWallet } = useWallet();
  const toast = useToast();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [completions, setCompletions] = useState<TaskCompletion[]>([]);
  const [loading, setLoading] = useState(true);

  // Selected Task for Proof Submission Modal
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [proofAccount, setProofAccount] = useState('');
  const [proofImage, setProofImage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittingDirectId, setSubmittingDirectId] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [tasksRes, compRes] = await Promise.all([
        api.getTasks().catch(() => ({ tasks: [] })),
        api.getTaskCompletions().catch(() => ({ completions: [] }))
      ]);
      setTasks(tasksRes.tasks || tasksRes || []);
      setCompletions(compRes.completions || compRes || []);
    } catch (err) {
      console.error('Error fetching tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  // Check completion status of task
  const getTaskCompletionInfo = (taskId: string) => {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const userComps = completions.filter((c: any) => (c.taskId === taskId || c.id === taskId));
    const pendingComp = userComps.find((c: any) => c.status === 'PENDING');
    if (pendingComp) return { status: 'PENDING', completion: pendingComp };

    const completedToday = userComps.find((c: any) => {
      if (c.status !== 'COMPLETED') return false;
      const completedDate = new Date(c.completedAt || c.createdAt);
      return completedDate >= todayStart;
    });

    if (completedToday) return { status: 'COMPLETED', completion: completedToday };

    const rejectedComp = userComps.find((c: any) => c.status === 'REJECTED');
    if (rejectedComp) return { status: 'REJECTED', completion: rejectedComp };

    return { status: 'AVAILABLE', completion: null };
  };

  const getTaskStatus = (taskId: string) => {
    return getTaskCompletionInfo(taskId).status;
  };

  const todayCompletedCount = completions.filter((c: any) => {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const completedDate = new Date(c.completedAt || c.createdAt);
    return c.status === 'COMPLETED' && completedDate >= todayStart;
  }).length;

  const pendingCount = completions.filter((c: any) => c.status === 'PENDING').length;

  const handleOpenTaskAction = (task: Task) => {
    const currentVip = user?.vipLevel || 0;
    if (currentVip < task.requiredVipLevel) {
      toast.warning(`هذه المهمة تتطلب ترقية إلى مستوى VIP ${task.requiredVipLevel} أو أعلى`);
      return;
    }

    const taskId = (task as any).taskId || (task as any).id;
    const status = getTaskStatus(taskId);

    if (status === 'PENDING') {
      toast.info('إثبات هذه المهمة قيد المراجعة حالياً من قبل الإدارة وسيتم إضافة الرصيد فور الموافقة.');
      return;
    }

    if (status === 'COMPLETED') {
      toast.info('لقد قمت بإنجاز هذه المهمة اليوم بالفعل! تتجدد المهام يومياً.');
      return;
    }

    // Direct task execution without proof
    if (task.taskType === 'DIRECT') {
      handleDirectComplete(task);
      return;
    }

    // Proof submission required
    setSelectedTask(task);
    setProofAccount('');
    setProofImage(null);
  };

  const handleDirectComplete = async (task: Task) => {
    const taskId = (task as any).taskId || (task as any).id;
    setSubmittingDirectId(taskId);
    try {
      if (task.url) {
        window.open(task.url, '_blank', 'noopener,noreferrer');
      }

      await api.completeTask(taskId);
      const reward = Number(task.reward) || 0;

      toast.success(
        'تم إنجاز المهمة المباشرة بنجاح!',
        `تمت إضافة ${formatCurrency(reward)} فوراً إلى رصيدك المتاح وسجل الأرباح.`
      );

      await Promise.all([
        refreshWallet(),
        refreshUser(),
        fetchData()
      ]);
    } catch (err: any) {
      toast.error('خطأ في إنجاز المهمة', err.message || 'حدث خطأ غير متوقع');
    } finally {
      setSubmittingDirectId(null);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.warning('حجم الصورة يجب ألا يتجاوز 5 ميجابايت');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setProofImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmitProof = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask) return;

    if (!proofAccount.trim() && !proofImage) {
      toast.warning('يرجى كتابة اسم المستخدم/رقم الحساب أو إرفاق لقطة شاشة كإثبات');
      return;
    }

    const taskId = (selectedTask as any).taskId || (selectedTask as any).id;
    setIsSubmitting(true);
    try {
      await api.completeTask(taskId, {
        proofAccount: proofAccount.trim(),
        proofImage: proofImage || undefined
      });

      toast.success(
        'تم إرسال إثبات المهمة بنجاح!',
        'طلبك الآن قيد مراجعة المشرف، وسيتم إضافة المكافأة فور التحقق من الإثبات.'
      );

      setSelectedTask(null);
      setProofAccount('');
      setProofImage(null);

      await Promise.all([
        refreshWallet(),
        refreshUser(),
        fetchData()
      ]);
    } catch (err: any) {
      toast.error('فشل في إرسال الإثبات', err.message || 'يرجى المحاولة مرة أخرى');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <LoadingState message="جاري تجهيز قائمة المهام وإثباتات الإنجاز..." />;

  const currentVip = user?.vipLevel || 0;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-neutral-900 via-neutral-900 to-neutral-900/80 border border-neutral-800 p-6 rounded-2xl shadow-lg">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-5 h-5 text-yellow-500" />
            <h1 className="text-2xl font-bold text-white">المهام اليومية ونظام التحقق الحقيقي</h1>
          </div>
          <p className="text-neutral-400 text-sm">
            نفّذ المهام المطلوبة وأرسل إثبات الإنجاز (اسم المستخدم أو لقطة الشاشة) للحصول على المكافأة بعد مراجعة الإدارة
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-neutral-950/80 border border-neutral-800 px-4 py-2 rounded-xl text-center">
            <span className="text-xs text-neutral-500 block">مستواك الحالي</span>
            <span className="text-sm font-bold text-yellow-500">VIP {currentVip}</span>
          </div>
          <div className="bg-neutral-950/80 border border-neutral-800 px-4 py-2 rounded-xl text-center">
            <span className="text-xs text-neutral-500 block">مكتملة اليوم</span>
            <span className="text-sm font-bold text-emerald-400">{todayCompletedCount} مهمة</span>
          </div>
          {pendingCount > 0 && (
            <div className="bg-yellow-500/10 border border-yellow-500/30 px-4 py-2 rounded-xl text-center">
              <span className="text-xs text-yellow-500/80 block">قيد المراجعة</span>
              <span className="text-sm font-bold text-yellow-400">{pendingCount} مهمة</span>
            </div>
          )}
          <div className="bg-yellow-500/10 border border-yellow-500/20 px-4 py-2 rounded-xl text-center">
            <span className="text-xs text-yellow-500/80 block">الرصيد المتاح</span>
            <span className="text-sm font-bold text-yellow-400">
              {formatCurrency(wallet?.availableBalance || 0)}
            </span>
          </div>
        </div>
      </div>

      {/* Tasks Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {tasks.map((task) => {
          const taskId = (task as any).taskId || (task as any).id;
          const { status, completion } = getTaskCompletionInfo(taskId);
          const isVipEligible = currentVip >= task.requiredVipLevel;

          return (
            <Card
              key={taskId}
              id={`task-card-${taskId}`}
              className={cn(
                "relative overflow-hidden transition-all duration-300 border flex flex-col justify-between group",
                status === 'COMPLETED' 
                  ? "bg-emerald-950/10 border-emerald-500/30 opacity-90 shadow-sm" 
                  : status === 'PENDING'
                    ? "bg-yellow-950/10 border-yellow-500/30 shadow-md"
                    : status === 'REJECTED'
                      ? "bg-red-950/10 border-red-500/30 shadow-md"
                      : isVipEligible 
                        ? "bg-neutral-900/60 border-neutral-800 hover:border-yellow-500/40 shadow-md" 
                        : "bg-neutral-950/60 border-neutral-800/60 opacity-60 grayscale-[40%]"
              )}
            >
              <div className="p-5 pb-3">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {task.requiredVipLevel > 0 ? (
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
                        مستوى VIP {task.requiredVipLevel}
                      </span>
                    ) : (
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-neutral-800 text-neutral-300 border border-neutral-700">
                        متاح للجميع
                      </span>
                    )}

                    {task.taskType === 'PROOF_REQUIRED' ? (
                      <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center gap-1">
                        <FileCheck2 className="w-3 h-3" /> يتطلب إثبات
                      </span>
                    ) : (
                      <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center gap-1">
                        <Check className="w-3 h-3" /> فوري
                      </span>
                    )}
                  </div>

                  {status === 'COMPLETED' && (
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> معتمدة ومكتملة
                    </span>
                  )}

                  {status === 'PENDING' && (
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 flex items-center gap-1 animate-pulse">
                      <Clock className="w-3.5 h-3.5" /> قيد مراجعة الإدارة
                    </span>
                  )}

                  {status === 'REJECTED' && (
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 flex items-center gap-1">
                      <X className="w-3.5 h-3.5" /> تم رفض الإثبات
                    </span>
                  )}
                </div>

                <h3 className="font-bold text-lg text-white mb-2 line-clamp-1 group-hover:text-yellow-400 transition-colors">
                  {task.title}
                </h3>
                
                <p className="text-neutral-400 text-xs line-clamp-2 min-h-[32px] leading-relaxed mb-3">
                  {task.description || 'قم بإنجاز المهمة المطلوبة وإرسال الإثبات للحصول على المكافأة.'}
                </p>

                {task.proofInstructions && (
                  <div className="bg-neutral-950/80 border border-neutral-800/80 rounded-lg p-2.5 text-[11px] text-neutral-300 flex items-start gap-2 mb-2">
                    <HelpCircle className="w-4 h-4 text-yellow-500 shrink-0 mt-0.5" />
                    <span className="line-clamp-2 leading-relaxed">{task.proofInstructions}</span>
                  </div>
                )}

                {status === 'REJECTED' && completion?.rejectionReason && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-2.5 text-[11px] text-red-300 flex items-start gap-2 mb-2">
                    <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold block text-red-400 mb-0.5">سبب الرفض:</span>
                      <span>{completion.rejectionReason}</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-5 pt-0 mt-auto">
                <div className="flex items-center justify-between p-3 rounded-xl bg-neutral-950/60 border border-neutral-800/80 mb-4">
                  <span className="text-xs text-neutral-400">مكافأة المهمة:</span>
                  <span className="text-base font-bold text-yellow-400">
                    +{formatCurrency(task.reward)}
                  </span>
                </div>

                {status === 'COMPLETED' ? (
                  <Button
                    id={`btn-task-completed-${taskId}`}
                    variant="outline"
                    className="w-full bg-emerald-950/30 border-emerald-500/40 text-emerald-400 cursor-not-allowed py-2.5"
                    disabled
                  >
                    <Check className="w-4 h-4 ml-2 text-emerald-400" />
                    تم الإنجاز واستلام المكافأة
                  </Button>
                ) : status === 'PENDING' ? (
                  <Button
                    id={`btn-task-pending-${taskId}`}
                    variant="secondary"
                    className="w-full bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 cursor-not-allowed py-2.5"
                    disabled
                  >
                    <Clock className="w-4 h-4 ml-2 animate-spin text-yellow-400" />
                    الإثبات قيد مراجعة المشرف
                  </Button>
                ) : !isVipEligible ? (
                  <Button
                    id={`btn-task-locked-${taskId}`}
                    variant="secondary"
                    className="w-full bg-neutral-800 text-neutral-400 cursor-not-allowed py-2.5"
                    disabled
                  >
                    <ShieldAlert className="w-4 h-4 ml-2 text-yellow-500" />
                    يتطلب ترقية إلى VIP {task.requiredVipLevel}
                  </Button>
                ) : (
                  <Button
                    id={`btn-task-action-${taskId}`}
                    variant="primary"
                    className="w-full bg-yellow-500 hover:bg-yellow-400 text-neutral-950 font-bold py-2.5 shadow-lg shadow-yellow-500/10 transition-transform active:scale-[0.98]"
                    onClick={() => handleOpenTaskAction(task)}
                    isLoading={submittingDirectId === taskId}
                  >
                    {status === 'REJECTED' ? (
                      <>
                        <Upload className="w-4 h-4 ml-2" />
                        إعادة رفع إثبات جديد ({formatCurrency(task.reward)})
                      </>
                    ) : task.taskType === 'PROOF_REQUIRED' ? (
                      <>
                        <Upload className="w-4 h-4 ml-2" />
                        تنفيذ وإرسال الإثبات ({formatCurrency(task.reward)})
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 ml-2" />
                        تنفيذ واستلام فوري ({formatCurrency(task.reward)})
                      </>
                    )}
                  </Button>
                )}
              </div>
            </Card>
          );
        })}

        {tasks.length === 0 && (
          <div className="col-span-full py-16 text-center text-neutral-400 bg-neutral-900/40 rounded-2xl border border-neutral-800 p-8">
            <AlertCircle className="w-12 h-12 text-yellow-500/50 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-white mb-1">لا توجد مهام متاحة حالياً</h3>
            <p className="text-sm text-neutral-400">يرجى العودة لاحقاً للحصول على مهام جديدة.</p>
          </div>
        )}
      </div>

      {/* PROOF SUBMISSION MODAL */}
      <AnimatePresence>
        {selectedTask && (
          <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
            <motion.div
              initial={{ scale: 0.92, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0, y: 20 }}
              className="bg-neutral-900 border border-neutral-700 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden relative my-auto"
            >
              {/* Header */}
              <div className="bg-neutral-950 px-5 py-4 border-b border-neutral-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileCheck2 className="w-5 h-5 text-yellow-500" />
                  <h3 className="font-bold text-white text-base">إرسال إثبات إنجاز المهمة</h3>
                </div>
                <button
                  onClick={() => setSelectedTask(null)}
                  className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form Content */}
              <form onSubmit={handleSubmitProof} className="p-5 sm:p-6 space-y-5">
                {/* Task Details Header */}
                <div className="bg-neutral-950/80 border border-neutral-800 rounded-xl p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-bold text-white text-sm">{selectedTask.title}</h4>
                    <span className="text-xs font-bold text-yellow-400 px-2 py-0.5 rounded bg-yellow-500/10 border border-yellow-500/20 shrink-0">
                      +{formatCurrency(selectedTask.reward)}
                    </span>
                  </div>

                  {selectedTask.description && (
                    <p className="text-xs text-neutral-400">{selectedTask.description}</p>
                  )}

                  {selectedTask.proofInstructions && (
                    <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-lg p-2.5 text-xs text-yellow-200/90 flex items-start gap-2 mt-2">
                      <HelpCircle className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5" />
                      <span>{selectedTask.proofInstructions}</span>
                    </div>
                  )}

                  {selectedTask.url && (
                    <div className="pt-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(selectedTask.url, '_blank', 'noopener,noreferrer')}
                        className="w-full bg-neutral-900 border-neutral-700 text-yellow-400 hover:text-yellow-300 text-xs py-2 flex items-center justify-center gap-1.5"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        الانتقال إلى رابط المهمة للبدء في التنفيذ
                      </Button>
                    </div>
                  )}
                </div>

                {/* Proof Field 1: Username / Account ID */}
                <div>
                  <label className="block text-xs font-bold text-neutral-200 mb-1.5 flex items-center gap-1.5">
                    <UserCheck className="w-4 h-4 text-yellow-500" />
                    اسم المستخدم أو معرف الحساب المنفذ
                  </label>
                  <Input
                    id="proof-account-input"
                    value={proofAccount}
                    onChange={(e) => setProofAccount(e.target.value)}
                    placeholder="مثال: @username في تيليجرام، أو بريدك في التسجيل، أو معرفك"
                    className="bg-neutral-950 border-neutral-800 text-sm"
                  />
                  <p className="text-[11px] text-neutral-400 mt-1">
                    أدخل اسم حسابك الذي استخدمته لإتمام الخطوات حتى يتمكن المشرف من مطابقة إنجازك.
                  </p>
                </div>

                {/* Proof Field 2: Screenshot Image */}
                <div>
                  <label className="block text-xs font-bold text-neutral-200 mb-1.5 flex items-center gap-1.5">
                    <Camera className="w-4 h-4 text-yellow-500" />
                    صورة / لقطة شاشة تثبت الإنجاز (Screenshot Proof)
                  </label>
                  
                  {proofImage ? (
                    <div className="relative rounded-xl border border-neutral-700 overflow-hidden bg-black flex flex-col items-center">
                      <img 
                        src={proofImage} 
                        alt="Proof Preview" 
                        className="max-h-48 w-auto object-contain"
                        referrerPolicy="no-referrer"
                      />
                      <button
                        type="button"
                        onClick={() => setProofImage(null)}
                        className="absolute top-2 right-2 bg-red-600/90 text-white p-1 rounded-full hover:bg-red-500"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <label className="border-2 border-dashed border-neutral-700 hover:border-yellow-500/50 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer bg-neutral-950/60 transition-colors">
                      <Upload className="w-8 h-8 text-neutral-400 mb-2" />
                      <span className="text-xs font-semibold text-neutral-300 mb-1">
                        اضغط لرفع لقطة الشاشة أو اسحب الصورة هنا
                      </span>
                      <span className="text-[10px] text-neutral-400">
                        PNG, JPG, JPEG (الحد الأقصى 5MB)
                      </span>
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleImageUpload} 
                        className="hidden" 
                      />
                    </label>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-3 pt-2 border-t border-neutral-800">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setSelectedTask(null)}
                    className="border-neutral-800 text-neutral-300"
                  >
                    إلغاء
                  </Button>

                  <Button
                    type="submit"
                    isLoading={isSubmitting}
                    className="bg-yellow-500 hover:bg-yellow-400 text-neutral-950 font-bold px-6 shadow-lg shadow-yellow-500/10"
                  >
                    <Send className="w-4 h-4 ml-1.5" />
                    إرسال الإثبات للمراجعة
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
