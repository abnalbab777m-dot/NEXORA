import { useState, useEffect, useRef } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { Notification } from '../types/models';
import CustomerSupportFloating from '../components/CustomerSupportFloating';
import { 
  LayoutDashboard, 
  CheckSquare, 
  PlaySquare, 
  WalletCards, 
  Star, 
  User, 
  LogOut,
  Wallet,
  ShieldAlert,
  Bell,
  CheckCircle2,
  AlertCircle,
  Info,
  XCircle,
  CheckCheck,
  X,
  ExternalLink
} from 'lucide-react';
import { cn } from '../lib/utils';
import { Button } from '../components/ui/Button';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'الرئيسية', end: true },
  { to: '/dashboard/tasks', icon: CheckSquare, label: 'المهام' },
  { to: '/dashboard/ads', icon: PlaySquare, label: 'الإعلانات' },
  { to: '/dashboard/vip', icon: Star, label: 'VIP' },
  { to: '/dashboard/wallet', icon: WalletCards, label: 'المحفظة' },
  { to: '/dashboard/profile', icon: User, label: 'الملف الشخصي' },
];

export default function DashboardLayout() {
  const { logout, isAdmin, profile } = useAuth();
  const navigate = useNavigate();
  
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [activeToast, setActiveToast] = useState<Notification | null>(null);
  const knownNotifIdsRef = useRef<Set<string>>(new Set());
  const isFirstLoadRef = useRef(true);

  // Play subtle pleasant chime for in-app alert
  const playChime = () => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.36);
    } catch (e) {
      // Audio autoplay policy fallback
    }
  };

  const fetchNotifs = async () => {
    if (!profile) return;
    try {
      const data = await api.getNotifications();
      const fetched: Notification[] = data.notifications || [];
      
      // Detect newly arrived notifications to trigger live in-app toast
      if (!isFirstLoadRef.current) {
        const brandNew = fetched.find(n => !n.read && !knownNotifIdsRef.current.has(n.id || n.notificationId || ''));
        if (brandNew) {
          setActiveToast(brandNew);
          playChime();
        }
      } else {
        isFirstLoadRef.current = false;
      }

      fetched.forEach(n => {
        const id = n.id || n.notificationId;
        if (id) knownNotifIdsRef.current.add(id);
      });
      setNotifications(fetched);
    } catch(err) {}
  };

  useEffect(() => {
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 10000);
    return () => clearInterval(interval);
  }, [profile]);

  // Auto-dismiss active live toast after 6 seconds
  useEffect(() => {
    if (!activeToast) return;
    const t = setTimeout(() => {
      setActiveToast(null);
    }, 6000);
    return () => clearTimeout(t);
  }, [activeToast]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = async (notifId: string) => {
    if (!notifId) return;
    try {
      await api.markNotificationRead(notifId);
      setNotifications(prev => prev.map(n => (n.id === notifId || n.notificationId === notifId) ? { ...n, read: true } : n));
    } catch (err) {
      console.error(err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (err) {
      console.error(err);
    }
  };

  const handleNotificationClick = (notif: Notification) => {
    const notifId = notif.id || notif.notificationId;
    if (!notif.read && notifId) {
      markAsRead(notifId);
    }
    setShowNotifications(false);
    setActiveToast(null);

    // Smart routing based on notification content
    const text = (notif.title + ' ' + notif.message).toLowerCase();
    if (text.includes('مهمة') || text.includes('إثبات') || text.includes('task')) {
      navigate('/dashboard/tasks');
    } else if (text.includes('إعلان') || text.includes('مشاهدة') || text.includes('ad')) {
      navigate('/dashboard/ads');
    } else if (text.includes('سحب') || text.includes('إيداع') || text.includes('محفظ') || text.includes('رصيد')) {
      navigate('/dashboard/wallet');
    } else if (text.includes('vip') || text.includes('باقة')) {
      navigate('/dashboard/vip');
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'SUCCESS': return <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />;
      case 'ERROR': return <XCircle className="w-5 h-5 text-rose-400 shrink-0" />;
      case 'WARNING': return <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />;
      default: return <Info className="w-5 h-5 text-sky-400 shrink-0" />;
    }
  };

  return (
    <div className="flex h-screen bg-neutral-950 text-neutral-50 font-sans">
      {/* Real-time In-app Floating Toast Alert */}
      {activeToast && (
        <div 
          id="in-app-notification-toast"
          className="fixed top-4 right-4 md:right-8 z-50 max-w-md w-[calc(100%-2rem)] bg-neutral-900/95 border border-amber-500/40 rounded-2xl p-4 shadow-2xl backdrop-blur-md animate-in slide-in-from-top-4 duration-300 flex items-start gap-3 cursor-pointer hover:border-amber-500/80 transition-all ring-1 ring-amber-500/20"
          onClick={() => handleNotificationClick(activeToast)}
        >
          <div className="p-2 rounded-xl bg-neutral-800/80 mt-0.5">
            {getIcon(activeToast.type)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <h4 className="text-sm font-bold text-white truncate">{activeToast.title}</h4>
              <button 
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveToast(null);
                }}
                className="text-neutral-400 hover:text-white p-1 rounded-lg hover:bg-neutral-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-neutral-300 mt-1 line-clamp-2 leading-relaxed">
              {activeToast.message}
            </p>
            <div className="flex items-center justify-between mt-2 text-[10px] text-amber-400 font-medium">
              <span>انقر للعرض</span>
              <span className="text-neutral-500">الآن</span>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar */}
      <aside className="w-64 border-l border-neutral-800 bg-neutral-900/30 flex flex-col hidden md:flex">
        <div className="h-16 flex items-center px-6 border-b border-neutral-800">
          <div className="flex items-center gap-2 text-xl font-bold text-yellow-500">
            <Wallet className="w-6 h-6" />
            Nexora
          </div>
        </div>
        
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => cn(
                'flex items-center gap-3 px-4 py-3 rounded-xl transition-colors',
                isActive 
                  ? 'bg-yellow-500/10 text-yellow-500 font-medium' 
                  : 'text-neutral-400 hover:bg-neutral-800/50 hover:text-neutral-200'
              )}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </NavLink>
          ))}

          {isAdmin && (
            <div className="pt-4 mt-4 border-t border-neutral-800">
              <NavLink
                to="/admin"
                className={({ isActive }) => cn(
                  'flex items-center gap-3 px-4 py-3 rounded-xl transition-colors text-red-400 hover:bg-red-500/10',
                  isActive && 'bg-red-500/10 font-medium'
                )}
              >
                <ShieldAlert className="w-5 h-5" />
                لوحة الإدارة
              </NavLink>
            </div>
          )}
        </nav>

        <div className="p-4 border-t border-neutral-800">
          <Button variant="ghost" className="w-full justify-start text-neutral-400 hover:text-red-400 hover:bg-red-500/10" onClick={handleLogout}>
            <LogOut className="w-5 h-5 ml-3" />
            تسجيل الخروج
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Mobile & Desktop Header */}
        <header className="h-16 flex items-center justify-between px-4 md:px-8 border-b border-neutral-800 bg-neutral-900/50">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-lg font-bold text-yellow-500 md:hidden">
              <Wallet className="w-5 h-5" />
              Nexora
            </div>
            <div className="hidden md:block">
               <h2 className="text-xl font-bold">لوحة التحكم</h2>
            </div>
          </div>

          <div className="flex items-center gap-3 relative">
            {isAdmin && (
              <NavLink
                to="/admin"
                id="header-admin-panel-link"
                className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-red-600/20 to-orange-600/20 border border-red-500/30 text-red-400 hover:text-white hover:bg-red-600/30 text-xs font-bold transition-all shadow-sm group"
              >
                <ShieldAlert className="w-4 h-4 text-red-400 group-hover:scale-110 transition-transform" />
                <span>لوحة الإدارة</span>
                <span className="px-1.5 py-0.2 rounded text-[9px] bg-red-500/30 text-red-300 font-mono">ADMIN</span>
              </NavLink>
            )}

            {/* Notification Bell Button */}
            <div className="relative">
              <button 
                id="notification-bell-btn"
                onClick={() => setShowNotifications(!showNotifications)}
                className={cn(
                  "relative p-2 rounded-full transition-all",
                  showNotifications ? "bg-neutral-800 text-yellow-400" : "hover:bg-neutral-800 text-neutral-400"
                )}
                title="الإشعارات والتنبيهات"
              >
                <Bell className="w-6 h-6" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-rose-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-neutral-950 animate-pulse">
                    {unreadCount > 9 ? '+9' : unreadCount}
                  </span>
                )}
              </button>
              
              {showNotifications && (
                <div className="absolute top-12 left-0 w-84 md:w-96 bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl z-50 overflow-hidden ring-1 ring-white/10">
                  <div className="p-3.5 border-b border-neutral-800 flex justify-between items-center bg-neutral-950">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-sm text-white">مركز الإشعارات</h3>
                      {unreadCount > 0 && (
                        <span className="text-[11px] font-semibold bg-rose-500/20 text-rose-400 border border-rose-500/30 px-2 py-0.5 rounded-full">
                          {unreadCount} غير مقروء
                        </span>
                      )}
                    </div>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllAsRead}
                        className="text-xs text-neutral-400 hover:text-yellow-400 flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-neutral-800/60 transition"
                      >
                        <CheckCheck className="w-3.5 h-3.5" />
                        <span>تحديد الكل كمقروء</span>
                      </button>
                    )}
                  </div>
                  
                  <div className="max-h-[60vh] overflow-y-auto divide-y divide-neutral-800/40">
                    {notifications.length === 0 ? (
                      <div className="p-8 text-center text-neutral-500 text-sm space-y-2">
                        <Bell className="w-8 h-8 text-neutral-700 mx-auto" />
                        <p>لا توجد إشعارات حالياً.</p>
                      </div>
                    ) : (
                      notifications.map(notif => (
                        <div 
                          key={notif.id || notif.notificationId} 
                          className={cn(
                            "p-3.5 hover:bg-neutral-800/60 transition-colors cursor-pointer flex gap-3 items-start",
                            !notif.read ? "bg-neutral-800/30 border-r-2 border-r-yellow-500" : "opacity-80"
                          )}
                          onClick={() => handleNotificationClick(notif)}
                        >
                          <div className="p-1.5 rounded-xl bg-neutral-800/80 mt-0.5">
                            {getIcon(notif.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <p className={cn("text-xs font-semibold truncate", !notif.read ? "text-white" : "text-neutral-300")}>
                                {notif.title}
                              </p>
                              {!notif.read && (
                                <span className="w-2 h-2 rounded-full bg-yellow-500 shrink-0"></span>
                              )}
                            </div>
                            <p className="text-xs text-neutral-400 mt-1 leading-relaxed line-clamp-2">
                              {notif.message}
                            </p>
                            <p className="text-[10px] text-neutral-500 mt-1.5 font-mono">
                              {new Date(notif.createdAt).toLocaleString('ar-EG')}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-8" onClick={() => setShowNotifications(false)}>
          <div className="max-w-6xl mx-auto">
            <Outlet />
          </div>
        </main>

        {/* Customer Support Floating Button */}
        <CustomerSupportFloating />
        
        {/* Mobile Nav */}
        <nav className="md:hidden flex items-center justify-around p-2 border-t border-neutral-800 bg-neutral-900/90 backdrop-blur-md pb-safe">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => cn(
                'flex flex-col items-center gap-1 p-1.5 rounded-lg transition-colors',
                isActive ? 'text-yellow-500 font-bold' : 'text-neutral-400 hover:text-neutral-200'
              )}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-[10px]">{item.label}</span>
            </NavLink>
          ))}
          {isAdmin && (
            <NavLink
              to="/admin"
              className={({ isActive }) => cn(
                'flex flex-col items-center gap-1 p-1.5 rounded-lg transition-colors text-red-400 font-bold',
                isActive && 'text-red-300'
              )}
            >
              <ShieldAlert className="w-5 h-5 text-red-500" />
              <span className="text-[10px]">الإدارة</span>
            </NavLink>
          )}
        </nav>
      </div>
    </div>
  );
}
