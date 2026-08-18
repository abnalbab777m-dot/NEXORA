import re
import os

def read(f): return open(f).read()
def write(f, c): open(f, "w").write(c)

def replace_logic(path, new_logic):
    c = read(path)
    # Find the last occurrence of "  return ("
    # which usually is the main return
    parts = c.rsplit("  return (", 1)
    if len(parts) == 2:
        ui = "  return (" + parts[1]
        write(path, new_logic + ui)

def fix_admin_ads():
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

  if (loading) return <LoadingState message="جاري التحميل..." />;
  if (error) return <ErrorState message={error} onRetry={fetchData} />;

"""
    replace_logic("src/pages/admin/AdminAds.tsx", logic)

def fix_dashboard_ads():
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
      alert('تم إكمال الإعلان بنجاح!');
      setActiveAd(null);
    } catch (err: any) {
      alert(err.message);
      setActiveAd(null);
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

  if (loading) return <LoadingState />;

"""
    replace_logic("src/pages/dashboard/AdsPage.tsx", logic)

def fix_dashboard_tasks():
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
      alert('تم إكمال المهمة بنجاح!');
      setActiveTask(null);
    } catch (err: any) {
      alert(err.message);
      setActiveTask(null);
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

  if (loading) return <LoadingState />;

"""
    replace_logic("src/pages/dashboard/TasksPage.tsx", logic)

fix_admin_ads()
fix_dashboard_ads()
fix_dashboard_tasks()

