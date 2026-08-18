import { Outlet, NavLink, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  Users, 
  CheckSquare, 
  PlaySquare, 
  ArrowDownToLine, 
  ArrowUpFromLine, 
  ListOrdered,
  LogOut,
  ShieldAlert,
  Home,
  Star,
  Settings,
  WalletCards,
  CreditCard
} from 'lucide-react';
import { cn } from '../lib/utils';
import { Button } from '../components/ui/Button';

const navItems = [
  { to: '/admin', icon: LayoutDashboard, label: 'لوحة التحكم', end: true },
  { to: '/admin/transactions', icon: WalletCards, label: 'العمليات المالية' },
  { to: '/admin/payment-methods', icon: CreditCard, label: 'وسائل وطرق الدفع' },
  { to: '/admin/users', icon: Users, label: 'المستخدمين والأرصدة' },
  { to: '/admin/settings', icon: Settings, label: 'إعدادات النظام' },
  { to: '/admin/vip', icon: Star, label: 'باقات VIP' },
  { to: '/admin/tasks', icon: CheckSquare, label: 'المهام' },
  { to: '/admin/ads', icon: PlaySquare, label: 'الإعلانات' },
];

export default function AdminLayout() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-neutral-950 text-neutral-50 font-sans">
      {/* Sidebar */}
      <aside className="w-64 border-l border-neutral-800 bg-neutral-900/30 flex flex-col hidden md:flex">
        <div className="h-16 flex items-center px-6 border-b border-neutral-800 bg-red-500/5">
          <div className="flex items-center gap-2 text-xl font-bold text-red-500">
            <ShieldAlert className="w-6 h-6" />
            الإدارة
          </div>
        </div>
        
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <div className="mb-4 pb-4 border-b border-neutral-800">
            <Link
              to="/dashboard"
              className="flex items-center gap-3 px-4 py-3 rounded-xl transition-colors text-neutral-400 hover:bg-neutral-800/50 hover:text-neutral-200"
            >
              <Home className="w-5 h-5" />
              العودة للتطبيق
            </Link>
          </div>

          <div className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2 px-4">أقسام الإدارة</div>
          
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => cn(
                'flex items-center gap-3 px-4 py-3 rounded-xl transition-colors',
                isActive 
                  ? 'bg-red-500/10 text-red-400 font-medium' 
                  : 'text-neutral-400 hover:bg-neutral-800/50 hover:text-neutral-200'
              )}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-neutral-800">
          <Button variant="ghost" className="w-full justify-start text-neutral-400 hover:text-red-400 hover:bg-red-500/10" onClick={handleLogout}>
            <LogOut className="w-5 h-5 ml-3" />
            تسجيل الخروج
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile Header */}
        <header className="h-16 md:hidden flex items-center justify-between px-4 border-b border-neutral-800 bg-neutral-900/50">
          <div className="flex items-center gap-2 text-lg font-bold text-red-500">
            <ShieldAlert className="w-5 h-5" />
            الإدارة
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-6xl mx-auto">
            <Outlet />
          </div>
        </main>
        
        {/* Mobile Nav */}
        <nav className="md:hidden flex items-center justify-around p-3 border-t border-neutral-800 bg-neutral-900/80 backdrop-blur-md pb-safe">
          {navItems.slice(0, 4).map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => cn(
                'flex flex-col items-center gap-1 p-2 rounded-lg transition-colors',
                isActive ? 'text-red-500' : 'text-neutral-500'
              )}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-[10px] whitespace-nowrap">{item.label}</span>
            </NavLink>
          ))}
          <Button variant="ghost" size="sm" className="flex flex-col items-center gap-1 p-1 h-auto hover:bg-transparent rounded-lg text-neutral-500" onClick={handleLogout}>
            <LogOut className="w-5 h-5" />
            <span className="text-[10px]">خروج</span>
          </Button>
        </nav>
      </div>
    </div>
  );
}
