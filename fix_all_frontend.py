import re
import os

def read(f): return open(f).read()
def write(f, c): open(f, "w").write(c)

# 1. src/pages/admin/AdminAds.tsx
if os.path.exists("src/pages/admin/AdminAds.tsx"):
    c = read("src/pages/admin/AdminAds.tsx")
    c = c.replace("import { Ad, AdCompletion } from '../../types/models';", "import { Ad, AdCompletion } from '../../types/models';\nimport { api } from '../../lib/api';")
    c = c.replace("const snap = await getDocs(collection(db, 'ads'));", "const snap = await api.getAdminAds();")
    c = c.replace("setAds(snap.docs.map(d => d.data() as Ad));", "setAds(snap.ads || []);")
    c = c.replace("const compSnap = await getDocs(collection(db, 'adCompletions'));", "const compSnap = await api.getAdminCompletions('AD');")
    c = c.replace("setCompletions(compSnap.docs.map(d => ({ id: d.id, ...d.data() } as any)).sort((a: any, b: any) => b.completedAt - a.completedAt));", "setCompletions(compSnap.completions || []);")
    c = c.replace("""await setDoc(doc(db, 'ads', adId), {
        ...editingAd,
        adId,
        createdAt: Date.now()
      });""", "await api.createAd({...editingAd});")
    c = c.replace("""await runTransaction(db, async (transaction) => {
        const adRef = doc(db, 'ads', editingAd.adId);
        transaction.set(adRef, editingAd, { merge: true });
      });""", "await api.updateAd(editingAd.adId || editingAd.id, editingAd);")
    c = c.replace("""await runTransaction(db, async (transaction) => {
      const compRef = doc(db, 'adCompletions', completionId);
      const userRef = doc(db, 'users', userId);
      
      transaction.update(compRef, { status: action, processedAt: Date.now() });
      
      if (action === 'APPROVE') {
        // ... (this logic should be in backend)
      }
    });""", "await api.approveCompletion('AD', completionId, action);")
    c = c.replace("const handleAction = async (completionId: string, userId: string, reward: number, action: string) => {", "const handleAction = async (completionId: string, userId: string, reward: number, action: string) => { try { await api.approveCompletion('AD', completionId, action); fetchData(); } catch(e) {} return;")
    # Also fix the create/update logic inside handleSaveAd
    c = c.replace("const handleSaveAd = async (e: React.FormEvent) => {", "const handleSaveAd = async (e: React.FormEvent) => { e.preventDefault(); try { if (editingAd.adId || editingAd.id) await api.updateAd(editingAd.adId || editingAd.id, editingAd); else await api.createAd(editingAd); setEditingAd(null); fetchData(); } catch(e) {} return;")
    write("src/pages/admin/AdminAds.tsx", c)

# 2. src/pages/admin/AdminTasks.tsx
if os.path.exists("src/pages/admin/AdminTasks.tsx"):
    c = read("src/pages/admin/AdminTasks.tsx")
    c = c.replace("import { Task, TaskCompletion } from '../../types/models';", "import { Task, TaskCompletion } from '../../types/models';\nimport { api } from '../../lib/api';")
    c = c.replace("const snap = await getDocs(query(collection(db, 'tasks')));", "const snap = await api.getAdminTasks();")
    c = c.replace("setTasks(snap.docs.map(d => d.data() as Task));", "setTasks(snap.tasks || []);")
    c = c.replace("const compSnap = await getDocs(collection(db, 'taskCompletions'));", "const compSnap = await api.getAdminCompletions('TASK');")
    c = c.replace("setCompletions(compSnap.docs.map(d => ({ id: d.id, ...d.data() } as any)).sort((a: any, b: any) => b.completedAt - a.completedAt));", "setCompletions(compSnap.completions || []);")
    c = c.replace("const handleAction = async (completionId: string, userId: string, reward: number, action: string) => {", "const handleAction = async (completionId: string, userId: string, reward: number, action: string) => { try { await api.approveCompletion('TASK', completionId, action); fetchData(); } catch(e) {} return;")
    c = c.replace("const handleSaveTask = async (e: React.FormEvent) => {", "const handleSaveTask = async (e: React.FormEvent) => { e.preventDefault(); try { if (editingTask.taskId || editingTask.id) await api.updateTask(editingTask.taskId || editingTask.id, editingTask); else await api.createTask(editingTask); setEditingTask(null); fetchData(); } catch(e) {} return;")
    write("src/pages/admin/AdminTasks.tsx", c)

# 3. AdminTransactions
if os.path.exists("src/pages/admin/AdminTransactions.tsx"):
    c = read("src/pages/admin/AdminTransactions.tsx")
    c = c.replace("import { Transaction } from '../../types/models';", "import { Transaction } from '../../types/models';\nimport { api } from '../../lib/api';")
    c = c.replace("const snap = await getDocs(query(collection(db, 'transactions')));", "const snap = await api.getTransactions();") # Or admin get all
    c = c.replace("setTransactions(snap.docs.map(d => ({ id: d.id, ...d.data() } as Transaction)).sort((a,b) => b.createdAt - a.createdAt));", "setTransactions(snap.transactions || []);")
    c = c.replace("const handleAction = async (txId: string, userId: string, amount: number, type: string, action: 'APPROVE' | 'REJECT') => {", "const handleAction = async (txId: string, userId: string, amount: number, type: string, action: 'APPROVE' | 'REJECT') => { try { if (type === 'DEPOSIT') await api.approveDeposit(txId, action); else await api.approveWithdrawal(txId, action); fetchData(); } catch(e) {} return;")
    write("src/pages/admin/AdminTransactions.tsx", c)

# 4. AdminUsers
if os.path.exists("src/pages/admin/AdminUsers.tsx"):
    c = read("src/pages/admin/AdminUsers.tsx")
    c = c.replace("import { User } from '../../types/models';", "import { User } from '../../types/models';\nimport { api } from '../../lib/api';")
    c = c.replace("await api.admin.getUsers();", "await api.getUsers();")
    c = c.replace("const handleToggleBan = async (userId: string, currentStatus: string) => {", "const handleToggleBan = async (userId: string, currentStatus: string) => { try { await api.updateUserStatus(userId, currentStatus === 'ACTIVE' ? 'BANNED' : 'ACTIVE'); setUsers(users.map(u => u.userId === userId ? { ...u, status: currentStatus === 'ACTIVE' ? 'BANNED' : 'ACTIVE' } : u)); } catch(e) {} return;")
    write("src/pages/admin/AdminUsers.tsx", c)

# 5. AdminVIP
if os.path.exists("src/pages/admin/AdminVIP.tsx"):
    c = read("src/pages/admin/AdminVIP.tsx")
    c = c.replace("import { VipPlan } from '../../types/models';", "import { VipPlan } from '../../types/models';\nimport { api } from '../../lib/api';")
    c = c.replace("const snap = await getDocs(collection(db, 'vipPlans'));", "const snap = await api.getVipPlans();")
    c = c.replace("setPlans(snap.docs.map(d => d.data() as VipPlan).sort((a, b) => a.level - b.level));", "setPlans(snap.plans || []);")
    c = c.replace("const handleSavePlan = async (e: React.FormEvent) => {", "const handleSavePlan = async (e: React.FormEvent) => { e.preventDefault(); try { if (editingPlan.planId || editingPlan.id) await api.updateVipPlan(editingPlan.planId || editingPlan.id, editingPlan); else await api.createVipPlan(editingPlan); setEditingPlan(null); fetchData(); } catch(e) {} return;")
    write("src/pages/admin/AdminVIP.tsx", c)

# 6. AdsPage
if os.path.exists("src/pages/dashboard/AdsPage.tsx"):
    c = read("src/pages/dashboard/AdsPage.tsx")
    c = c.replace("const snap = await getDocs(collection(db, 'ads'));", "const snap = await api.getAds();")
    c = c.replace("setAds(snap.docs.map(d => d.data() as Ad).filter(ad => ad.status === 'ACTIVE'));", "setAds(snap.ads || []);")
    c = c.replace("const handleVerifyAd = async () => {", "const handleVerifyAd = async () => { try { await api.completeAd(activeAd!.adId || activeAd!.id); setHasCompleted(true); } catch(e) {} return;")
    write("src/pages/dashboard/AdsPage.tsx", c)

# 7. TasksPage
if os.path.exists("src/pages/dashboard/TasksPage.tsx"):
    c = read("src/pages/dashboard/TasksPage.tsx")
    c = c.replace("const snap = await getDocs(collection(db, 'tasks'));", "const snap = await api.getTasks();")
    c = c.replace("setTasks(snap.docs.map(d => d.data() as Task).filter(t => t.status === 'ACTIVE'));", "setTasks(snap.tasks || []);")
    c = c.replace("const handleVerifyTask = async () => {", "const handleVerifyTask = async () => { try { await api.completeTask(activeTask!.taskId || activeTask!.id); setHasCompleted(true); } catch(e) {} return;")
    c = c.replace("activeTask?.id", "activeTask?.taskId")
    c = c.replace("t.id", "t.taskId")
    c = c.replace("t.taskId === id", "t.taskId === (id || t.id)")
    write("src/pages/dashboard/TasksPage.tsx", c)

# 8. VIPPage
if os.path.exists("src/pages/dashboard/VIPPage.tsx"):
    c = read("src/pages/dashboard/VIPPage.tsx")
    c = c.replace("const snap = await getDocs(collection(db, 'vipPlans'));", "const snap = await api.getVipPlans();")
    c = c.replace("setPlans(snap.docs.map(d => d.data() as VipPlan).sort((a,b) => a.level - b.level));", "setPlans(snap.plans || []);")
    c = c.replace("const handleSubscribe = async (plan: VipPlan) => {", "const handleSubscribe = async (plan: VipPlan) => { try { await api.subscribeVip(plan.planId || plan.id); await refreshUser(); setSuccessPlan(plan.name); setShowConfirm(false); } catch(e:any) { setError(e.message); } return;")
    write("src/pages/dashboard/VIPPage.tsx", c)

# 9. WalletPage
if os.path.exists("src/pages/dashboard/WalletPage.tsx"):
    c = read("src/pages/dashboard/WalletPage.tsx")
    c = c.replace("const txSnap = await getDocs(query(collection(db, 'transactions'), where('userId', '==', user?.userId)));", "const txSnap = await api.getTransactions();")
    c = c.replace("setTransactions(txSnap.docs.map(d => ({ id: d.id, ...d.data() } as Transaction)).sort((a,b) => b.createdAt - a.createdAt));", "setTransactions(txSnap.transactions || []);")
    c = c.replace("const handleDeposit = async (e: React.FormEvent) => {", "const handleDeposit = async (e: React.FormEvent) => { e.preventDefault(); try { await api.deposit(Number(amount)); setActionType(null); setAmount(''); fetchData(); } catch(e:any) { alert(e.message); } return;")
    c = c.replace("const handleWithdraw = async (e: React.FormEvent) => {", "const handleWithdraw = async (e: React.FormEvent) => { e.preventDefault(); try { await api.withdraw(Number(amount)); setActionType(null); setAmount(''); fetchData(); } catch(e:any) { alert(e.message); } return;")
    write("src/pages/dashboard/WalletPage.tsx", c)

