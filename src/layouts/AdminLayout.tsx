import { useEffect, useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  Users, 
  CheckSquare, 
  PlaySquare, 
  LogOut,
  ShieldCheck,
  Home,
  Star,
  Settings,
  WalletCards,
  CreditCard,
  FileCheck,
  Bell
} from 'lucide-react';
import { cn } from '../lib/utils';
import { Button } from '../components/ui/Button';
import { api } from '../lib/api';

export default function AdminLayout() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [pendingTasksCount, setPendingTasksCount] = useState<number>(0);

  useEffect(() => {
    fetchPendingCount();
    const interval = setInterval(fetchPendingCount, 30000); // 30s polling
    return () => clearInterval(interval);
  }, []);

  const fetchPendingCount = async () => {
    try {
      const res = await api.admin.getTaskSubmissions('PENDING');
      const list = res.submissions || res.completions || [];
      const pending = list.filter((s: any) => s.status === 'PENDING').length;
      setPendingTasksCount(pending);
    } catch {
      // ignore
    }
  };

  const navItems = [
    { to: '/admin', icon: LayoutDashboard, label: 'لوحة التحكم', end: true },
    { to: '/admin/transactions', icon: WalletCards, label: 'العمليات المالية' },
    { to: '/admin/payment-methods', icon: CreditCard, label: 'وسائل وطرق الدفع' },
    { to: '/admin/users', icon: Users, label: 'المستخدمين والأرصدة' },
    { to: '/admin/settings', icon: Settings, label: 'إعدادات النظام' },
    { to: '/admin/vip', icon: Star, label: 'باقات VIP' },
    { to: '/admin/tasks', icon: CheckSquare, label: 'قائمة المهام', end: true },
    { 
      to: '/admin/task-submissions', 
      icon: FileCheck, 
      label: 'مراجعة إثباتات المهام',
      badge: pendingTasksCount > 0 ? pendingTasksCount : null
    },
    { to: '/admin/ads', icon: PlaySquare, label: 'إدارة الإعلانات', end: true },
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-neutral-950 text-neutral-50 font-sans">
      {/* Sidebar */}
      <aside className="w-64 border-l border-neutral-800 bg-neutral-900/40 flex flex-col hidden md:flex">
        <div className="h-16 flex items-center px-6 border-b border-neutral-800 bg-yellow-500/5">
          <div className="flex items-center gap-2 text-lg font-bold text-yellow-500">
            <ShieldCheck className="w-6 h-6" />
            <span>لوحة إدارة Nexora</span>
          </div>
        </div>
        
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <div className="mb-4 pb-4 border-b border-neutral-800">
            <Link
              to="/dashboard"
              className="flex items-center gap-3 px-4 py-2.5 rounded-xl transition-colors text-neutral-400 hover:bg-neutral-800/60 hover:text-neutral-200 text-sm font-medium"
            >
              <Home className="w-4 h-4 text-neutral-400" />
              العودة للتطبيق الرئيسي
            </Link>
          </div>

          <div className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2 px-4">أقسام الإدارة</div>
          
          {navItems.map((item) => {
            const currentPath = location.pathname + location.search;
            const isActive = item.to === '/admin' 
              ? currentPath === '/admin' 
              : location.pathname === item.to || (item.to.includes('?') && currentPath === item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  'flex items-center justify-between px-4 py-2.5 rounded-xl transition-colors text-sm',
                  isActive 
                    ? 'bg-yellow-500/10 text-yellow-400 font-bold border border-yellow-500/20' 
                    : 'text-neutral-400 hover:bg-neutral-800/50 hover:text-neutral-200 font-medium'
                )}
              >
                <div className="flex items-center gap-3">
                  <item.icon className={cn("w-4 h-4", isActive ? "text-yellow-500" : "text-neutral-400")} />
                  <span>{item.label}</span>
                </div>
                {item.badge !== null && item.badge !== undefined && (
                  <span className="px-2 py-0.5 rounded-full bg-yellow-500 text-neutral-950 font-black text-xs animate-pulse">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-neutral-800">
          <Button variant="ghost" className="w-full justify-start text-neutral-400 hover:text-red-400 hover:bg-red-500/10 text-sm" onClick={handleLogout}>
            <LogOut className="w-4 h-4 ml-3" />
            تسجيل الخروج
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile Header */}
        <header className="h-16 md:hidden flex items-center justify-between px-4 border-b border-neutral-800 bg-neutral-900/80">
          <div className="flex items-center gap-2 text-base font-bold text-yellow-500">
            <ShieldCheck className="w-5 h-5" />
            لوحة الإدارة
          </div>
          <Link to="/admin/task-submissions" className="relative p-2 text-neutral-400 hover:text-yellow-400">
            <FileCheck className="w-5 h-5" />
            {pendingTasksCount > 0 && (
              <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-yellow-500 ring-2 ring-neutral-950" />
            )}
          </Link>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-6xl mx-auto">
            <Outlet />
          </div>
        </main>
        
        {/* Mobile Nav */}
        <nav className="md:hidden flex items-center justify-around p-2 border-t border-neutral-800 bg-neutral-900/90 backdrop-blur-md pb-safe">
          {navItems.slice(0, 5).map((item) => {
            const currentPath = location.pathname;
            const isActive = item.to === '/admin' ? currentPath === '/admin' : currentPath === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  'flex flex-col items-center gap-1 p-1.5 rounded-lg transition-colors relative',
                  isActive ? 'text-yellow-500' : 'text-neutral-400'
                )}
              >
                <item.icon className="w-4 h-4" />
                <span className="text-[10px] whitespace-nowrap">{item.label}</span>
                {item.badge !== null && item.badge !== undefined && (
                  <span className="absolute -top-1 right-2 px-1 rounded-full bg-yellow-500 text-neutral-950 font-bold text-[9px]">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
          <Button variant="ghost" size="sm" className="flex flex-col items-center gap-1 p-1 h-auto hover:bg-transparent rounded-lg text-neutral-500" onClick={handleLogout}>
            <LogOut className="w-4 h-4" />
            <span className="text-[10px]">خروج</span>
          </Button>
        </nav>
      </div>
    </div>
  );
}
