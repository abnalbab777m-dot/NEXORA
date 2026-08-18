import React from "react";
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Wallet } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      await api.login({ email, password });
      await refreshUser();
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'البريد الإلكتروني أو كلمة المرور غير صحيحة.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-4">
      <div className="w-full max-w-md p-8 rounded-3xl bg-neutral-900 border border-neutral-800">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center justify-center gap-2 text-yellow-500 mb-6">
            <Wallet className="w-8 h-8" />
          </Link>
          <h1 className="text-2xl font-bold mb-2">مرحباً بك مجدداً</h1>
          <p className="text-neutral-400 text-sm">سجل دخولك لمتابعة أرباحك وإنجاز مهامك.</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <Input 
            label="البريد الإلكتروني"
            type="email" 
            placeholder="name@example.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            dir="ltr"
          />
          <Input 
            label="كلمة المرور"
            type="password" 
            placeholder="••••••••"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            dir="ltr"
          />
          
          {error && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm text-center">
              {error}
            </div>
          )}

          <Button type="submit" className="w-full mt-4" isLoading={isLoading}>
            تسجيل الدخول
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-neutral-400">
          ليس لديك حساب؟{' '}
          <Link to="/register" className="text-yellow-500 hover:underline">
            أنشئ حسابك الآن
          </Link>
        </p>
      </div>
    </div>
  );
}
