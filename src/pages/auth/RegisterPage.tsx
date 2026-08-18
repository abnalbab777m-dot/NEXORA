import React from "react";
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Wallet } from 'lucide-react';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    displayName: '',
    username: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { refreshUser } = useAuth();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('كلمتا المرور غير متطابقتين.');
      setIsLoading(false);
      return;
    }

    try {
      await api.register(formData);
      await refreshUser();
      navigate('/dashboard');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'حدث خطأ أثناء التسجيل. قد يكون البريد الإلكتروني مستخدماً بالفعل.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-4 py-12">
      <div className="w-full max-w-lg p-8 rounded-3xl bg-neutral-900 border border-neutral-800">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center justify-center gap-2 text-yellow-500 mb-6">
            <Wallet className="w-8 h-8" />
          </Link>
          <h1 className="text-2xl font-bold mb-2">إنشاء حساب جديد</h1>
          <p className="text-neutral-400 text-sm">انضم إلى Nexora وابدأ بربح المكافآت.</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
          <Input label="الاسم الكامل" name="displayName" value={formData.displayName} onChange={handleChange} required />
          <div className="grid grid-cols-2 gap-4">
            <Input label="اسم المستخدم" name="username" value={formData.username} onChange={handleChange} required dir="ltr" pattern="^[a-zA-Z0-9_]+$" title="أحرف إنجليزية وأرقام و _ فقط" />
            <Input label="رقم الهاتف" name="phone" value={formData.phone} onChange={handleChange} required dir="ltr" />
          </div>
          <Input label="البريد الإلكتروني" type="email" name="email" value={formData.email} onChange={handleChange} required dir="ltr" />
          <div className="grid grid-cols-2 gap-4">
            <Input label="كلمة المرور" type="password" name="password" value={formData.password} onChange={handleChange} required dir="ltr" minLength={6} />
            <Input label="تأكيد كلمة المرور" type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} required dir="ltr" minLength={6} />
          </div>
          
          {error && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm text-center">
              {error}
            </div>
          )}

          <Button type="submit" className="w-full mt-6" isLoading={isLoading}>
            إنشاء الحساب
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-neutral-400">
          لديك حساب بالفعل؟{' '}
          <Link to="/login" className="text-yellow-500 hover:underline">
            تسجيل الدخول
          </Link>
        </p>
      </div>
    </div>
  );
}
