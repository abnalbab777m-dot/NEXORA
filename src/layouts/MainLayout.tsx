import { Outlet, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Wallet, LogIn, UserPlus } from 'lucide-react';

export default function MainLayout() {
  const { user } = useAuth();
  
  return (
    <div className="min-h-screen bg-neutral-950 flex flex-col font-sans text-neutral-50">
      <header className="border-b border-neutral-800 bg-neutral-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-xl font-bold text-yellow-500">
            <Wallet className="w-6 h-6" />
            Nexora
          </Link>
          <nav className="flex items-center gap-4">
            {user ? (
              <Link to="/dashboard">
                <Button variant="primary" size="sm">لوحة التحكم</Button>
              </Link>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="ghost" size="sm" className="hidden sm:flex">
                    <LogIn className="w-4 h-4 ml-2" />
                    تسجيل الدخول
                  </Button>
                </Link>
                <Link to="/register">
                  <Button variant="primary" size="sm">
                    <UserPlus className="w-4 h-4 ml-2" />
                    إنشاء حساب
                  </Button>
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>
      <main className="flex-1 flex flex-col">
        <Outlet />
      </main>
      <footer className="border-t border-neutral-800 bg-neutral-900 py-8 text-center text-sm text-neutral-500">
        <p>© {new Date().getFullYear()} Nexora. جميع الحقوق محفوظة.</p>
      </footer>
    </div>
  );
}
