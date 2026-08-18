import re
import os

def read(f): return open(f).read()
def write(f, c): open(f, "w").write(c)

def replace_all(f):
    if not os.path.exists(f): return
    c = read(f)
    # Fix the missing api.admin prefix for the ones we added
    c = c.replace("await api.getAdminAds(", "await api.admin.getAdminAds(")
    c = c.replace("await api.getAdminCompletions(", "await api.admin.getAdminCompletions(")
    c = c.replace("await api.createAd(", "await api.admin.createAd(")
    c = c.replace("await api.updateAd(", "await api.admin.updateAd(")
    c = c.replace("await api.approveCompletion(", "await api.admin.approveCompletion(")
    
    c = c.replace("await api.getAdminTasks(", "await api.admin.getAdminTasks(")
    c = c.replace("await api.createTask(", "await api.admin.createTask(")
    c = c.replace("await api.updateTask(", "await api.admin.updateTask(")

    c = c.replace("await api.getAdminTransactions(", "await api.admin.getAdminTransactions(")
    c = c.replace("await api.approveDeposit(", "await api.admin.approveDeposit(")
    c = c.replace("await api.approveWithdrawal(", "await api.admin.approveWithdrawal(")
    
    c = c.replace("await api.getUsers(", "await api.admin.getUsers(")
    c = c.replace("await api.updateUserStatus(", "await api.admin.updateUserStatus(")
    
    c = c.replace("await api.createVipPlan(", "await api.admin.createVipPlan(")
    c = c.replace("await api.updateVipPlan(", "await api.admin.updateVipPlan(")
    
    # Remove any lingering Firebase imports or usages
    c = re.sub(r"import \{.*?\} from 'firebase/firestore';", "", c)
    c = c.replace("import { db } from '../../lib/firebase';", "")
    
    # Just in case there are still db, doc, etc being used:
    c = re.sub(r"await setDoc\(doc\(db, 'ads', [^)]+\),", "await api.admin.createAd(", c)
    c = re.sub(r"await runTransaction\(db, async \(transaction\) => \{[\s\S]*?\}\);", "/* firebase transaction removed */", c)
    
    write(f, c)

for file in [
    "src/pages/admin/AdminAds.tsx",
    "src/pages/admin/AdminTasks.tsx",
    "src/pages/admin/AdminTransactions.tsx",
    "src/pages/admin/AdminUsers.tsx",
    "src/pages/admin/AdminVIP.tsx",
    "src/pages/dashboard/AdsPage.tsx",
    "src/pages/dashboard/TasksPage.tsx",
    "src/pages/dashboard/VIPPage.tsx",
    "src/pages/dashboard/WalletPage.tsx"
]:
    replace_all(file)

