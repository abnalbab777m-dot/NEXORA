import re
import os

def read(f): return open(f).read()
def write(f, c): open(f, "w").write(c)

def fix_admin_ads():
    path = "src/pages/admin/AdminAds.tsx"
    c = read(path)
    if "return (" not in c: return
    ui = "  return (" + c.split("  return (", 1)[1]
    logic = """import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { LoadingState } from '../../components/ui/LoadingState';
import { ErrorState } from '../../components/ui/ErrorState';
import { formatCurrency } from '../../lib/utils';
import { Plus, Edit, Check, X } from 'lucide-react';
import { Ad, AdCompletion } from '../../types/models';
import { api } from '../../lib/api';

export default function AdminAds() {
  const [ads, setAds] = useState<Ad[]>([]);
  const [completions, setCompletions] = useState<AdCompletion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingAd, setEditingAd] = useState<any>(null);

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
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingAd.adId || editingAd.id) await api.admin.updateAd(editingAd.adId || editingAd.id, editingAd);
      else await api.admin.createAd(editingAd);
      setEditingAd(null);
      fetchData();
    } catch (err: any) {
      alert('خطأ: ' + err.message);
    }
  };

  const handleAction = async (completionId: string, userId: string, reward: number, action: string) => {
    try {
      await api.admin.approveCompletion('AD', completionId, action);
      alert('تم المعالجة بنجاح');
      fetchData();
    } catch (err: any) {
      alert('خطأ: ' + err.message);
    }
  };

"""
    write(path, logic + ui)

def fix_admin_tasks():
    path = "src/pages/admin/AdminTasks.tsx"
    c = read(path)
    if "return (" not in c: return
    ui = "  return (" + c.split("  return (", 1)[1]
    logic = """import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { LoadingState } from '../../components/ui/LoadingState';
import { ErrorState } from '../../components/ui/ErrorState';
import { formatCurrency } from '../../lib/utils';
import { Plus, Edit, Check, X } from 'lucide-react';
import { Task, TaskCompletion } from '../../types/models';
import { api } from '../../lib/api';

export default function AdminTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [completions, setCompletions] = useState<TaskCompletion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingTask, setEditingTask] = useState<any>(null);

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
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTask = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingTask.taskId || editingTask.id) await api.admin.updateTask(editingTask.taskId || editingTask.id, editingTask);
      else await api.admin.createTask(editingTask);
      setEditingTask(null);
      fetchData();
    } catch (err: any) {
      alert('خطأ: ' + err.message);
    }
  };

  const handleAction = async (completionId: string, userId: string, reward: number, action: string) => {
    try {
      await api.admin.approveCompletion('TASK', completionId, action);
      alert('تم المعالجة بنجاح');
      fetchData();
    } catch (err: any) {
      alert('خطأ: ' + err.message);
    }
  };

"""
    write(path, logic + ui)

def fix_admin_transactions():
    path = "src/pages/admin/AdminTransactions.tsx"
    c = read(path)
    if "return (" not in c: return
    ui = "  return (" + c.split("  return (", 1)[1]
    logic = """import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { LoadingState } from '../../components/ui/LoadingState';
import { ErrorState } from '../../components/ui/ErrorState';
import { formatCurrency } from '../../lib/utils';
import { Check, X } from 'lucide-react';
import { Transaction } from '../../types/models';
import { api } from '../../lib/api';

export default function AdminTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const snap = await api.admin.getAdminTransactions();
      setTransactions(snap.transactions || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (txId: string, userId: string, amount: number, type: string, action: 'APPROVE' | 'REJECT') => {
    try {
      if (type === 'DEPOSIT') await api.admin.approveDeposit(txId);
      else await api.admin.approveWithdrawal(txId);
      alert('تمت المعالجة');
      fetchData();
    } catch (err: any) {
      alert('خطأ: ' + err.message);
    }
  };

"""
    write(path, logic + ui)

def fix_admin_users():
    path = "src/pages/admin/AdminUsers.tsx"
    c = read(path)
    if "return (" not in c: return
    ui = "  return (" + c.split("  return (", 1)[1]
    logic = """import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { LoadingState } from '../../components/ui/LoadingState';
import { ErrorState } from '../../components/ui/ErrorState';
import { User } from '../../types/models';
import { api } from '../../lib/api';

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await api.admin.getUsers();
      setUsers(data.users || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleToggleBan = async (userId: string, currentStatus: string) => {
    try {
      await api.admin.updateUserStatus(userId, currentStatus === 'ACTIVE' ? 'BANNED' : 'ACTIVE');
      setUsers(users.map(u => (u.userId || u.id) === userId ? { ...u, status: currentStatus === 'ACTIVE' ? 'BANNED' : 'ACTIVE' } : u));
    } catch (err: any) {
      alert('خطأ: ' + err.message);
    }
  };

"""
    write(path, logic + ui)

def fix_admin_vip():
    path = "src/pages/admin/AdminVIP.tsx"
    c = read(path)
    if "return (" not in c: return
    ui = "  return (" + c.split("  return (", 1)[1]
    logic = """import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { LoadingState } from '../../components/ui/LoadingState';
import { ErrorState } from '../../components/ui/ErrorState';
import { formatCurrency } from '../../lib/utils';
import { Plus, Edit } from 'lucide-react';
import { VipPlan } from '../../types/models';
import { api } from '../../lib/api';

export default function AdminVIP() {
  const [plans, setPlans] = useState<VipPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingPlan, setEditingPlan] = useState<any>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const snap = await api.getVipPlans();
      setPlans(snap.plans || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingPlan.planId || editingPlan.id) await api.admin.updateVipPlan(editingPlan.planId || editingPlan.id, editingPlan);
      else await api.admin.createVipPlan(editingPlan);
      setEditingPlan(null);
      fetchData();
    } catch (err: any) {
      alert('خطأ: ' + err.message);
    }
  };

"""
    write(path, logic + ui)

def fix_dashboard_ads():
    path = "src/pages/dashboard/AdsPage.tsx"
    c = read(path)
    if "return (" not in c: return
    ui = "  return (" + c.split("  return (", 1)[1]
    logic = """import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { LoadingState } from '../../components/ui/LoadingState';
import { Play, CheckCircle, Clock } from 'lucide-react';
import { Ad } from '../../types/models';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency } from '../../lib/utils';
import { api } from '../../lib/api';

export default function AdsPage() {
  const { user } = useAuth();
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeAd, setActiveAd] = useState<Ad | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [hasCompleted, setHasCompleted] = useState(false);

  useEffect(() => {
    const fetchAds = async () => {
      try {
        const snap = await api.getAds();
        setAds(snap.ads || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAds();
  }, []);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (activeAd && timeLeft > 0 && !hasCompleted) {
      timer = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && activeAd && !hasCompleted) {
      handleVerifyAd();
    }
    return () => clearInterval(timer);
  }, [activeAd, timeLeft, hasCompleted]);

  const handleVerifyAd = async () => {
    try {
      await api.completeAd((activeAd as any).adId || (activeAd as any).id);
      setHasCompleted(true);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleStartAd = (ad: Ad) => {
    if ((user?.vipLevel || 0) < ad.requiredVipLevel) {
      alert(`هذا الإعلان يتطلب مستوى VIP ${ad.requiredVipLevel} أو أعلى`);
      return;
    }
    setActiveAd(ad);
    setTimeLeft(ad.durationSeconds);
    setHasCompleted(false);
  };

"""
    write(path, logic + ui)

def fix_dashboard_tasks():
    path = "src/pages/dashboard/TasksPage.tsx"
    c = read(path)
    if "return (" not in c: return
    ui = "  return (" + c.split("  return (", 1)[1]
    logic = """import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { LoadingState } from '../../components/ui/LoadingState';
import { CheckCircle, Clock } from 'lucide-react';
import { Task } from '../../types/models';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency } from '../../lib/utils';
import { api } from '../../lib/api';

export default function TasksPage() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [hasCompleted, setHasCompleted] = useState(false);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const snap = await api.getTasks();
        setTasks(snap.tasks || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchTasks();
  }, []);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (activeTask && timeLeft > 0 && !hasCompleted) {
      timer = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && activeTask && !hasCompleted) {
      handleVerifyTask();
    }
    return () => clearInterval(timer);
  }, [activeTask, timeLeft, hasCompleted]);

  const handleVerifyTask = async () => {
    try {
      await api.completeTask((activeTask as any).taskId || (activeTask as any).id);
      setHasCompleted(true);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleStartTask = (task: Task) => {
    if ((user?.vipLevel || 0) < task.requiredVipLevel) {
      alert(`هذه المهمة تتطلب مستوى VIP ${task.requiredVipLevel} أو أعلى`);
      return;
    }
    setActiveTask(task);
    setTimeLeft(5); // Simulated task duration
    setHasCompleted(false);
  };

"""
    # Fix the missing `id` issues in UI
    ui = ui.replace("activeTask?.id", "activeTask?.taskId")
    ui = ui.replace("t.id", "t.taskId")
    ui = ui.replace("t.taskId === id", "t.taskId === (id || t.taskId)")
    write(path, logic + ui)

def fix_dashboard_vip():
    path = "src/pages/dashboard/VIPPage.tsx"
    c = read(path)
    if "return (" not in c: return
    ui = "  return (" + c.split("  return (", 1)[1]
    logic = """import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { LoadingState } from '../../components/ui/LoadingState';
import { Check, Star, AlertCircle } from 'lucide-react';
import { VipPlan } from '../../types/models';
import { formatCurrency } from '../../lib/utils';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';

export default function VIPPage() {
  const { user, refreshUser } = useAuth();
  const [plans, setPlans] = useState<VipPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showConfirm, setShowConfirm] = useState<VipPlan | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successPlan, setSuccessPlan] = useState<string | null>(null);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const snap = await api.getVipPlans();
        setPlans(snap.plans || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchPlans();
  }, []);

  const handleSubscribe = async (plan: VipPlan) => {
    setError(null);
    try {
      await api.subscribeVip((plan as any).planId || (plan as any).id);
      await refreshUser();
      setSuccessPlan(plan.name);
      setShowConfirm(false);
    } catch (err: any) {
      setError(err.message);
    }
  };

"""
    write(path, logic + ui)

def fix_dashboard_wallet():
    path = "src/pages/dashboard/WalletPage.tsx"
    c = read(path)
    if "return (" not in c: return
    ui = "  return (" + c.split("  return (", 1)[1]
    logic = """import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { LoadingState } from '../../components/ui/LoadingState';
import { Wallet as WalletIcon, ArrowUpRight, ArrowDownRight, History, CheckCircle, XCircle, Clock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency } from '../../lib/utils';
import { Transaction } from '../../types/models';
import { api } from '../../lib/api';

export default function WalletPage() {
  const { user, refreshUser } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loadingTxs, setLoadingTxs] = useState(true);
  const [actionType, setActionType] = useState<'DEPOSIT' | 'WITHDRAW' | null>(null);
  const [amount, setAmount] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoadingTxs(true);
    try {
      await refreshUser();
      const txSnap = await api.getTransactions();
      setTransactions(txSnap.transactions || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingTxs(false);
    }
  };

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.deposit(Number(amount));
      setActionType(null);
      setAmount('');
      fetchData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.withdraw(Number(amount));
      setActionType(null);
      setAmount('');
      fetchData();
    } catch (err: any) {
      alert(err.message);
    }
  };

"""
    write(path, logic + ui)

fix_admin_ads()
fix_admin_tasks()
fix_admin_transactions()
fix_admin_users()
fix_admin_vip()
fix_dashboard_ads()
fix_dashboard_tasks()
fix_dashboard_vip()
fix_dashboard_wallet()

