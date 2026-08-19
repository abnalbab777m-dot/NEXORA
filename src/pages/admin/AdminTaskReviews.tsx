import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { LoadingState } from '../../components/ui/LoadingState';
import { ErrorState } from '../../components/ui/ErrorState';
import { formatCurrency } from '../../lib/utils';
import { useToast } from '../../components/ui/Toast';
import { 
  CheckSquare, 
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
  Filter,
  RefreshCw,
  AlertCircle,
  FileText,
  Image,
  UserCheck,
  CheckCircle2,
  XCircle,
  Eye,
  FileCheck
} from 'lucide-react';
import { Task, TaskCompletion } from '../../types/models';
import { api } from '../../lib/api';

export default function AdminTasks() {
  const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState<'TASKS' | 'COMPLETIONS'>(
    tabParam === 'COMPLETIONS' ? 'COMPLETIONS' : 'TASKS'
  );

  useEffect(() => {
    if (tabParam === 'COMPLETIONS' && activeTab !== 'COMPLETIONS') {
      setActiveTab('COMPLETIONS');
    } else if (tabParam !== 'COMPLETIONS' && activeTab !== 'TASKS') {
      setActiveTab('TASKS');
    }
  }, [tabParam]);

  const handleTabChange = (tab: 'TASKS' | 'COMPLETIONS') => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  const [tasks, setTasks] = useState<Task[]>([]);
  const [completions, setCompletions] = useState<TaskCompletion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Modal / Form states
  const [editingTask, setEditingTask] = useState<any | null>(null);
  const [isNewTask, setIsNewTask] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [reviewingCompletion, setReviewingCompletion] = useState<TaskCompletion | null>(null);
  const [proofImageBlob, setProofImageBlob] = useState<string | null>(null);
  const [loadingProof, setLoadingProof] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isProcessingAction, setIsProcessingAction] = useState(false);
  const [deleteConfirmModal, setDeleteConfirmModal] = useState<{ id: string; title: string } | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const snap = await api.admin.getAdminTasks();
      setTasks(snap.tasks || []);
      const compSnap = await api.admin.getAdminCompletions('TASK');
      setCompletions(compSnap.completions || []);
    } catch (err: any) {
      setError(err.message);
      toast.error('فشل في جلب البيانات', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setIsNewTask(true);
    setEditingTask({
      title: '',
      description: '',
      reward: 2.5,
      url: '',
      category: 'TELEGRAM',
      taskType: 'PROOF_REQUIRED',
      proofInstructions: 'قم بالانضمام للقناة ثم أرسل اسم المستخدم الخاص بك أو لقطة شاشة توضح اشتراكك.',
      durationSeconds: 30,
      requiredVipLevel: 1,
      status: 'ACTIVE'
    });
  };

  const handleOpenEdit = (task: Task) => {
    setIsNewTask(false);
    setEditingTask({
      id: task.id || task.taskId,
      title: task.title,
      description: task.description || '',
      reward: task.reward,
      url: task.url || (task as any).link || '',
      category: task.category || 'TELEGRAM',
      taskType: task.taskType || 'PROOF_REQUIRED',
      proofInstructions: task.proofInstructions || '',
      durationSeconds: task.durationSeconds || 30,
      requiredVipLevel: task.requiredVipLevel || 0,
      status: task.status || 'ACTIVE'
    });
  };

  const handleSaveTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask.title.trim()) {
      toast.warning('يرجى إدخال عنوان المهمة');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        title: editingTask.title.trim(),
        description: editingTask.description?.trim() || '',
        reward: Number(editingTask.reward) || 0,
        url: editingTask.url?.trim() || '',
        category: editingTask.category || 'TELEGRAM',
        taskType: editingTask.taskType || 'PROOF_REQUIRED',
        proofInstructions: editingTask.proofInstructions?.trim() || '',
        durationSeconds: Number(editingTask.durationSeconds) || 30,
        requiredVipLevel: Number(editingTask.requiredVipLevel) || 0,
        status: editingTask.status || 'ACTIVE'
      };

      if (isNewTask) {
        await api.admin.createTask(payload);
        toast.success('تم إنشاء المهمة بنجاح');
      } else {
        await api.admin.updateTask(editingTask.id, payload);
        toast.success('تم تحديث المهمة بنجاح');
      }

      setEditingTask(null);
      fetchData();
    } catch (err: any) {
      toast.error('حدث خطأ أثناء حفظ المهمة', err.message);
    } finally {
      setSaving(false);
    }
  };

  const confirmDeleteTask = async () => {
    if (!deleteConfirmModal) return;
    const id = deleteConfirmModal.id;

    setDeletingId(id);
    try {
      await api.admin.deleteTask(id);
      toast.success('تم حذف المهمة بنجاح');
      setTasks(prev => prev.filter(t => (t.id || t.taskId) !== id));
      setDeleteConfirmModal(null);
    } catch (err: any) {
      toast.error('فشل في حذف المهمة', err.message);
    } finally {
      setDeletingId(null);
    }
  };

  const handleReviewClick = async (comp: TaskCompletion) => {
    setReviewingCompletion(comp);
    setRejectionReason('');
    
    if (comp.proofImage === 'AVAILABLE') {
      setLoadingProof(true);
      setProofImageBlob(null);
      try {
        const compId = (comp as any).id || comp.completionId;
        const res = await api.admin.getCompletionProof(compId);
        setProofImageBlob(res.proofImage);
      } catch (err: any) {
        toast.error('فشل في جلب صورة الإثبات', err.message);
      } finally {
        setLoadingProof(false);
      }
    } else {
      setProofImageBlob(comp.proofImage || null);
    }
  };

  const handleAction = async (completionId: string, action: 'APPROVE' | 'REJECT', reason?: string) => {
    setIsProcessingAction(true);
    try {
      await api.admin.approveCompletion('TASK', completionId, action, reason);
      toast.success(action === 'APPROVE' ? 'تم اعتماد المكافأة وصرف الرصيد للمستخدم بنجاح' : 'تم رفض إنجاز المهمة وإشعار المستخدم');
      setReviewingCompletion(null);
      setRejectionReason('');
      fetchData();
    } catch (err: any) {
      toast.error('خطأ في معالجة الطلب', err.message);
    } finally {
      setIsProcessingAction(false);
    }
  };

  const filteredTasks = tasks.filter(t => 
    t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (t.description && t.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const pendingCompletionsCount = completions.filter(c => c.status === 'PENDING').length;

  if (loading && tasks.length === 0) {
    return <LoadingState message="جاري تحميل بيانات المهام والمراجعات..." />;
  }

  if (error && tasks.length === 0) {
    return <ErrorState message={error} onRetry={fetchData} />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <CheckSquare className="w-6 h-6 text-yellow-500" />
            <h1 className="text-2xl font-bold text-white">إدارة المهام والتحقق من الإثباتات</h1>
          </div>
          <p className="text-neutral-400 text-sm mt-1">
            إضافة وتعديل وحذف المهام المتاحة، ومراجعة إثباتات ولقطات الشاشة المرسلة من المستخدمين للموافقة عليها أو رفضها.
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
            إضافة مهمة جديدة
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-neutral-800">
        <button
          onClick={() => handleTabChange('TASKS')}
          className={`pb-3 px-4 text-sm font-semibold transition-colors relative ${
            activeTab === 'TASKS' 
              ? 'text-yellow-500 border-b-2 border-yellow-500' 
              : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          قائمة المهام المتاحة ({tasks.length})
        </button>

        <button
          onClick={() => handleTabChange('COMPLETIONS')}
          className={`pb-3 px-4 text-sm font-semibold transition-colors relative flex items-center gap-2 ${
            activeTab === 'COMPLETIONS' 
              ? 'text-yellow-500 border-b-2 border-yellow-500' 
              : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <span>مراجعة إثباتات الإنجاز ({completions.length})</span>
          {pendingCompletionsCount > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-yellow-500 text-neutral-950 font-bold text-xs">
              {pendingCompletionsCount} جديد
            </span>
          )}
        </button>
      </div>

      {/* TAB 1: Tasks List */}
      {activeTab === 'TASKS' && (
        <div className="space-y-4">
          {/* Search bar */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute right-3.5 top-3 text-neutral-500" />
              <Input
                id="search-tasks"
                placeholder="ابحث عن مهمة بالعنوان أو الوصف..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pr-10 bg-neutral-900/60 border-neutral-800 text-xs"
              />
            </div>
          </div>

          {/* Tasks Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTasks.map(task => {
              const taskId = task.id || task.taskId || '';
              return (
                <Card 
                  key={taskId} 
                  className="border-neutral-800 bg-neutral-900/40 hover:border-neutral-700 transition-all flex flex-col justify-between"
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border ${
                            task.status === 'ACTIVE'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                              : 'bg-neutral-800 text-neutral-400 border-neutral-700'
                          }`}>
                            {task.status === 'ACTIVE' ? 'نشط ومتاح' : 'معطل'}
                          </span>

                          <span className="text-[10px] px-2 py-0.5 rounded bg-neutral-800 text-neutral-300 border border-neutral-700 font-medium">
                            {task.category || 'TELEGRAM'}
                          </span>

                          {task.taskType === 'PROOF_REQUIRED' ? (
                            <span className="text-[10px] px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20 font-medium">
                              يتطلب إثبات
                            </span>
                          ) : (
                            <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 font-medium">
                              مباشر
                            </span>
                          )}
                        </div>

                        <CardTitle className="text-base text-white leading-snug pt-1">
                          {task.title}
                        </CardTitle>
                      </div>

                      <span className="px-2.5 py-1 rounded-lg bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 font-bold text-sm shrink-0">
                        {formatCurrency(task.reward)}
                      </span>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {task.description && (
                      <p className="text-xs text-neutral-400 line-clamp-2">
                        {task.description}
                      </p>
                    )}

                    {task.proofInstructions && (
                      <div className="bg-neutral-950/80 p-2 rounded-lg border border-neutral-800 text-[11px] text-yellow-300/80">
                        <span className="font-semibold block text-neutral-400 mb-0.5">تعليمات الإثبات المطلوبة:</span>
                        {task.proofInstructions}
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-2 text-xs text-neutral-300 py-2 border-y border-neutral-800/60">
                      <div className="flex items-center gap-1.5">
                        <Crown className="w-3.5 h-3.5 text-yellow-500" />
                        <span>VIP المطلوب:</span>
                        <span className="font-bold text-white">VIP {task.requiredVipLevel}</span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-neutral-400" />
                        <span>المؤقت:</span>
                        <span className="font-bold text-white">{task.durationSeconds || 30} ثانية</span>
                      </div>
                    </div>

                    {task.url && (
                      <div className="flex items-center gap-1 text-[11px] text-blue-400 truncate bg-neutral-950 p-2 rounded-lg border border-neutral-800/80">
                        <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate font-mono" dir="ltr">{task.url}</span>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-2 pt-1">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleOpenEdit(task)}
                        className="text-xs border-neutral-800 bg-neutral-800 hover:bg-neutral-700 text-white"
                      >
                        <Edit className="w-3.5 h-3.5 ml-1" />
                        تعديل
                      </Button>

                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setDeleteConfirmModal({ id: taskId, title: task.title })}
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

            {filteredTasks.length === 0 && (
              <div className="col-span-full text-center py-12 bg-neutral-900/20 border border-dashed border-neutral-800 rounded-2xl">
                <CheckSquare className="w-10 h-10 text-neutral-600 mx-auto mb-3" />
                <h3 className="text-white font-bold mb-1">لا توجد مهام مطابقة</h3>
                <p className="text-xs text-neutral-400 mb-4">قم بإنشاء مهام جديدة ليتمكن المستخدمون من تنفيذها وكسب الأرباح.</p>
                <Button size="sm" onClick={handleOpenCreate} className="bg-yellow-500 text-neutral-950 font-bold">
                  <Plus className="w-4 h-4 ml-1" /> إضافة أول مهمة
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: Task Completions & Proofs Review Table */}
      {activeTab === 'COMPLETIONS' && (
        <Card className="border-neutral-800 bg-neutral-900/40">
          <CardHeader>
            <CardTitle className="text-base text-white flex items-center justify-between">
              <span>سجل إثباتات تنفيذ المهام ومراجعتها</span>
              <span className="text-xs text-neutral-400 font-normal">
                إجمالي الطلبات: {completions.length} | قيد المراجعة: {pendingCompletionsCount}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-right">
                <thead className="text-xs text-neutral-400 uppercase bg-neutral-950/60 border-b border-neutral-800">
                  <tr>
                    <th className="px-5 py-3.5">التاريخ والوقت</th>
                    <th className="px-5 py-3.5">المستخدم</th>
                    <th className="px-5 py-3.5">المهمة</th>
                    <th className="px-5 py-3.5">إثبات التنفيذ (الحساب / الصورة)</th>
                    <th className="px-5 py-3.5">قيمة المكافأة</th>
                    <th className="px-5 py-3.5">الحالة</th>
                    <th className="px-5 py-3.5 text-center">الإجراء / القرار</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800/80 font-sans">
                  {completions.map(comp => {
                    const compId = (comp as any).id || comp.completionId;
                    return (
                      <tr key={compId} className="hover:bg-neutral-900/50 transition-colors">
                        <td className="px-5 py-4 text-xs font-mono text-neutral-300">
                          {comp.completedAt ? new Date(comp.completedAt).toLocaleString('ar-EG') : '-'}
                        </td>
                        <td className="px-5 py-4">
                          <div className="text-xs text-white font-medium">
                            {comp.userEmail || comp.userId}
                          </div>
                          {comp.userPhone && (
                            <span className="text-[10px] font-mono text-neutral-400">{comp.userPhone}</span>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          <span className="text-xs font-semibold text-white block max-w-xs truncate">
                            {comp.taskTitle || comp.taskId}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            {comp.proofAccount && (
                              <span className="px-2 py-1 bg-neutral-950 border border-neutral-800 text-yellow-400 font-mono text-xs rounded">
                                {comp.proofAccount}
                              </span>
                            )}
                            {comp.proofImage && (
                              <button
                                onClick={() => handleReviewClick(comp)}
                                className="px-2 py-1 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded text-xs flex items-center gap-1"
                              >
                                <Image className="w-3.5 h-3.5" />
                                عرض الصورة
                              </button>
                            )}
                            {!comp.proofAccount && !comp.proofImage && (
                              <span className="text-xs text-neutral-500">إنجاز مباشر</span>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-4 font-bold text-yellow-500">
                          {formatCurrency(comp.reward)}
                        </td>
                        <td className="px-5 py-4">
                          <span className={`px-2.5 py-1 rounded text-xs font-bold ${
                            comp.status === 'COMPLETED' 
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                              : comp.status === 'REJECTED' 
                              ? 'bg-red-500/10 text-red-400 border border-red-500/20' 
                              : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                          }`}>
                            {comp.status === 'COMPLETED' ? 'معتمد ومكتمل' : comp.status === 'REJECTED' ? 'مرفوض' : 'قيد المراجعة'}
                          </span>
                          {comp.rejectionReason && (
                            <span className="text-[11px] text-red-400/80 block mt-1">
                              السبب: {comp.rejectionReason}
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-4 text-center">
                          {comp.status === 'PENDING' ? (
                            <div className="flex items-center justify-center gap-1.5">
                              <Button 
                                size="sm" 
                                onClick={() => handleAction(compId, 'APPROVE')} 
                                className="bg-emerald-500 hover:bg-emerald-600 text-neutral-950 font-bold px-3 text-xs"
                              >
                                <Check className="w-3.5 h-3.5 ml-1" />
                                موافقة وصرف
                              </Button>
                              <Button 
                                size="sm" 
                                onClick={() => handleReviewClick(comp)} 
                                variant="destructive"
                                className="text-xs px-2.5"
                              >
                                <X className="w-3.5 h-3.5 ml-1" />
                                فحص / رفض
                              </Button>
                            </div>
                          ) : (
                            <span className="text-xs text-neutral-500">تم البت بالطلب</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}

                  {completions.length === 0 && (
                    <tr>
                      <td colSpan={7} className="text-center py-10 text-xs text-neutral-500">
                        لا توجد إثباتات مهام مرسلة حتى الآن.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* REVIEW & PROOF MODAL */}
      {reviewingCompletion && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <Card className="w-full max-w-lg border-neutral-800 bg-neutral-900 shadow-2xl animate-in fade-in zoom-in-95">
            <CardHeader className="flex flex-row items-center justify-between border-b border-neutral-800 pb-4">
              <CardTitle className="text-base text-white flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-yellow-500" />
                فحص إثبات المهمة واتخاذ القرار
              </CardTitle>
              <button 
                onClick={() => setReviewingCompletion(null)}
                className="text-neutral-400 hover:text-white p-1 rounded-lg hover:bg-neutral-800"
              >
                <X className="w-5 h-5" />
              </button>
            </CardHeader>

            <CardContent className="pt-5 space-y-4">
              <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-neutral-400">المهمة:</span>
                  <span className="text-white font-bold">{reviewingCompletion.taskTitle}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-400">المستخدم:</span>
                  <span className="text-white font-mono">{reviewingCompletion.userEmail || reviewingCompletion.userId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-400">المكافأة:</span>
                  <span className="text-yellow-400 font-bold">{formatCurrency(reviewingCompletion.reward)}</span>
                </div>
                {reviewingCompletion.proofAccount && (
                  <div className="flex justify-between pt-1 border-t border-neutral-800">
                    <span className="text-neutral-400">اسم المستخدم/الحساب المنفذ:</span>
                    <span className="text-yellow-500 font-mono font-bold">{reviewingCompletion.proofAccount}</span>
                  </div>
                )}
              </div>

              {/* Proof Image */}
              {(reviewingCompletion.proofImage || proofImageBlob) && (
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                    صورة لقطة الشاشة المرسلة من العضو:
                  </label>
                  <div className="rounded-xl border border-neutral-800 overflow-hidden bg-black p-2 flex justify-center min-h-[150px] items-center">
                    {loadingProof ? (
                      <LoadingState message="جاري تحميل الصورة..." />
                    ) : proofImageBlob ? (
                      <img 
                        src={proofImageBlob} 
                        alt="Proof Attachment" 
                        className="max-h-72 w-auto object-contain rounded-lg"
                        referrerPolicy="no-referrer"
                      />
                    ) : null}
                  </div>
                </div>
              )}

              {/* Rejection Reason Input */}
              {reviewingCompletion.status === 'PENDING' && (
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                    سبب الرفض (في حال عدم مطابقة الإثبات للشروط):
                  </label>
                  <Input
                    id="rejection-reason"
                    placeholder="مثال: لقطة الشاشة غير واضحة، أو الحساب لم ينضم للقناة بعد..."
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    className="bg-neutral-950 border-neutral-800 text-xs"
                  />
                </div>
              )}

              {/* Decision Buttons */}
              {reviewingCompletion.status === 'PENDING' && (
                <div className="flex items-center justify-between gap-3 pt-3 border-t border-neutral-800">
                  <Button
                    type="button"
                    variant="destructive"
                    disabled={isProcessingAction}
                    onClick={() => handleAction((reviewingCompletion as any).id || reviewingCompletion.completionId!, 'REJECT', rejectionReason)}
                    className="flex-1 text-xs"
                  >
                    <XCircle className="w-4 h-4 ml-1.5" />
                    رفض الإثبات
                  </Button>

                  <Button
                    type="button"
                    disabled={isProcessingAction}
                    onClick={() => handleAction((reviewingCompletion as any).id || reviewingCompletion.completionId!, 'APPROVE')}
                    className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-neutral-950 font-bold text-xs"
                  >
                    <CheckCircle2 className="w-4 h-4 ml-1.5" />
                    موافقة وصرف {formatCurrency(reviewingCompletion.reward)}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* CREATE / EDIT TASK MODAL */}
      {editingTask && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <Card className="w-full max-w-xl border-neutral-800 bg-neutral-900 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <CardHeader className="flex flex-row items-center justify-between border-b border-neutral-800 pb-4">
              <CardTitle className="text-lg text-white flex items-center gap-2">
                <CheckSquare className="w-5 h-5 text-yellow-500" />
                {isNewTask ? 'إضافة مهمة جديدة' : 'تعديل بيانات المهمة'}
              </CardTitle>
              <button 
                onClick={() => setEditingTask(null)}
                className="text-neutral-400 hover:text-white p-1 rounded-lg hover:bg-neutral-800"
              >
                <X className="w-5 h-5" />
              </button>
            </CardHeader>

            <CardContent className="pt-5">
              <form onSubmit={handleSaveTask} className="space-y-4">
                {/* Title */}
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                    عنوان المهمة *
                  </label>
                  <Input
                    id="task-title"
                    value={editingTask.title}
                    onChange={e => setEditingTask({...editingTask, title: e.target.value})}
                    placeholder="مثال: متابعة قناة التلغرام الرسمية وتفعيل الإشعارات..."
                    required
                    className="bg-neutral-950 border-neutral-800 text-sm"
                  />
                </div>

                {/* Category & Task Type */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                      تصنيف المهمة
                    </label>
                    <select
                      id="task-category"
                      value={editingTask.category}
                      onChange={e => setEditingTask({...editingTask, category: e.target.value})}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2.5 text-sm text-neutral-200 focus:outline-none focus:border-yellow-500/50"
                    >
                      <option value="TELEGRAM">تيليجرام (Telegram)</option>
                      <option value="REGISTRATION">تسجيل وتفعيل حساب (Registration)</option>
                      <option value="SOCIAL">مواقع التواصل الاجتماعي (Social Media)</option>
                      <option value="APP_REVIEW">تقييم تطبيق أو منصة (App Review)</option>
                      <option value="OTHER">مهمة أخرى</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                      نوع التنفيذ والتحقق
                    </label>
                    <select
                      id="task-type"
                      value={editingTask.taskType}
                      onChange={e => setEditingTask({...editingTask, taskType: e.target.value})}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2.5 text-sm text-neutral-200 focus:outline-none focus:border-yellow-500/50"
                    >
                      <option value="PROOF_REQUIRED">يتطلب إرسال إثبات ومراجعة الإدارة</option>
                      <option value="DIRECT">مباشر وفوري (Direct Complete)</option>
                    </select>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                    وصف وشروط المهمة
                  </label>
                  <textarea
                    id="task-description"
                    rows={2}
                    value={editingTask.description}
                    onChange={e => setEditingTask({...editingTask, description: e.target.value})}
                    placeholder="اشرح للمستخدمين الخطوات المطلوبة لتنفيذ المهمة..."
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-sm text-neutral-200 focus:outline-none focus:border-yellow-500/50"
                  />
                </div>

                {/* Proof Instructions */}
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                    تعليمات الإثبات المطلوب من العضو
                  </label>
                  <Input
                    id="task-proof-instructions"
                    value={editingTask.proofInstructions}
                    onChange={e => setEditingTask({...editingTask, proofInstructions: e.target.value})}
                    placeholder="مثال: يرجى إرفاق لقطة شاشة تظهر انضمامك للقناة مع كتابة اسم المستخدم الخاص بك."
                    className="bg-neutral-950 border-neutral-800 text-xs"
                  />
                </div>

                {/* URL / Link */}
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                    رابط المهمة المستهدف (URL / Channel / Webpage)
                  </label>
                  <Input
                    id="task-url"
                    value={editingTask.url}
                    onChange={e => setEditingTask({...editingTask, url: e.target.value})}
                    placeholder="https://t.me/example أو https://example.com"
                    dir="ltr"
                    className="bg-neutral-950 border-neutral-800 text-xs font-mono"
                  />
                </div>

                {/* Reward & Duration */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                      قيمة المكافأة ($ USD) *
                    </label>
                    <Input
                      id="task-reward"
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={editingTask.reward}
                      onChange={e => setEditingTask({...editingTask, reward: e.target.value})}
                      required
                      dir="ltr"
                      className="bg-neutral-950 border-neutral-800"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                      مستوى VIP المطلوب *
                    </label>
                    <select
                      id="task-vip"
                      value={editingTask.requiredVipLevel}
                      onChange={e => setEditingTask({...editingTask, requiredVipLevel: Number(e.target.value)})}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2.5 text-sm text-neutral-200 focus:outline-none focus:border-yellow-500/50"
                    >
                      <option value={1}>VIP 1 (باقة 30$ فما فوق)</option>
                      <option value={2}>VIP 2 (باقة 50$ فما فوق)</option>
                      <option value={3}>VIP 3 (باقة 100$ فما فوق)</option>
                      <option value={4}>VIP 4 (باقة 300$ فما فوق)</option>
                      <option value={5}>VIP 5 (باقة 800$)</option>
                    </select>
                  </div>
                </div>

                {/* Status */}
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                    حالة المهمة
                  </label>
                  <select
                    id="task-status"
                    value={editingTask.status}
                    onChange={e => setEditingTask({...editingTask, status: e.target.value})}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2.5 text-sm text-neutral-200 focus:outline-none focus:border-yellow-500/50"
                  >
                    <option value="ACTIVE">نشط (يظهر للمستخدمين)</option>
                    <option value="INACTIVE">معطل (مخفي مؤقتاً)</option>
                  </select>
                </div>

                {/* Buttons */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-800">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setEditingTask(null)}
                    className="border-neutral-800 text-neutral-300"
                  >
                    إلغاء
                  </Button>

                  <Button
                    type="submit"
                    isLoading={saving}
                    className="bg-yellow-500 hover:bg-yellow-400 text-neutral-950 font-bold px-6"
                  >
                    {isNewTask ? 'إنشاء المهمة' : 'حفظ التعديلات'}
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
                تأكيد حذف المهمة
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <p className="text-sm text-neutral-300">
                هل أنت متأكد من رغبتك في حذف مهمة <strong className="text-white">"{deleteConfirmModal.title}"</strong> نهائياً؟ سيتم مسح أي سجلات مرتبطة بها.
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
                  onClick={confirmDeleteTask}
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
