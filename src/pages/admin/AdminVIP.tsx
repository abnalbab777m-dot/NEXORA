import React, { useEffect, useState } from 'react';
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">إدارة باقات VIP</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchData}>تحديث</Button>
          <Button onClick={() => setEditingPlan({ name: '', level: 1, price: 10, durationDays: 30, dailyTasks: 5, dailyAds: 5, status: 'ACTIVE' })}>
            <Plus className="w-4 h-4 ml-2" /> باقة جديدة
          </Button>
        </div>
      </div>

      {editingPlan && (
        <Card className="bg-neutral-900 border-yellow-500/20">
          <CardHeader>
            <CardTitle>{editingPlan.planId ? 'تعديل الباقة' : 'إضافة باقة جديدة'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSavePlan} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="اسم الباقة" value={editingPlan.name} onChange={e => setEditingPlan({...editingPlan, name: e.target.value})} required />
              <Input label="المستوى (رقم)" type="number" min="0" value={editingPlan.level} onChange={e => setEditingPlan({...editingPlan, level: Number(e.target.value)})} required />
              <Input label="السعر (USD)" type="number" step="0.01" min="0" value={editingPlan.price} onChange={e => setEditingPlan({...editingPlan, price: Number(e.target.value)})} required />
              <Input label="المدة (أيام)" type="number" min="1" value={editingPlan.durationDays} onChange={e => setEditingPlan({...editingPlan, durationDays: Number(e.target.value)})} required />
              <Input label="المهام اليومية" type="number" min="0" value={editingPlan.dailyTasks} onChange={e => setEditingPlan({...editingPlan, dailyTasks: Number(e.target.value)})} required />
              <Input label="الإعلانات اليومية" type="number" min="0" value={editingPlan.dailyAds} onChange={e => setEditingPlan({...editingPlan, dailyAds: Number(e.target.value)})} required />
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-neutral-400">الحالة</label>
                <select 
                  className="bg-neutral-950 border border-neutral-800 text-white rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500/50"
                  value={editingPlan.status}
                  onChange={e => setEditingPlan({...editingPlan, status: e.target.value})}
                >
                  <option value="ACTIVE">نشط</option>
                  <option value="INACTIVE">غير نشط</option>
                </select>
              </div>
              <div className="col-span-full pt-2 flex gap-2">
                <Button type="submit" className="flex-1">حفظ الباقة</Button>
                <Button type="button" variant="secondary" onClick={() => setEditingPlan(null)}>إلغاء</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {plans.map(plan => (
          <Card key={plan.id || plan.planId || plan.level}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle>{plan.name} (مستوى {plan.level})</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setEditingPlan(plan)}>
                <Edit className="w-4 h-4 text-neutral-400" />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm text-neutral-400 mt-4">
                <div className="flex justify-between">
                  <span>السعر:</span>
                  <span className="font-bold text-white">{formatCurrency(plan.price)}</span>
                </div>
                <div className="flex justify-between">
                  <span>المدة:</span>
                  <span className="text-white">{plan.durationDays} يوم</span>
                </div>
                <div className="flex justify-between">
                  <span>مهام يومية:</span>
                  <span className="text-white">{plan.dailyTasks}</span>
                </div>
                <div className="flex justify-between">
                  <span>الحالة:</span>
                  <span className={plan.status === 'ACTIVE' ? 'text-emerald-500' : 'text-red-500'}>
                    {plan.status === 'ACTIVE' ? 'نشط' : 'غير نشط'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {plans.length === 0 && (
          <div className="col-span-full text-center text-neutral-500 py-12">
            لا توجد باقات VIP حالياً.
          </div>
        )}
      </div>
    </div>
  );
}
