import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { useToast } from '../../components/ui/Toast';
import { 
  User, 
  Lock, 
  Save, 
  KeyRound, 
  ShieldCheck, 
  ShieldAlert, 
  Phone, 
  Mail, 
  Crown, 
  CheckCircle2,
  AlertTriangle,
  Eye,
  EyeOff,
  LogOut
} from 'lucide-react';

export default function ProfilePage() {
  const { profile, user, refreshProfile, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  
  // Profile form state
  const [displayName, setDisplayName] = useState(profile?.displayName || user?.displayName || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [savingProfile, setSavingProfile] = useState(false);

  // Password change state
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  // Transaction PIN state
  const [hasPin, setHasPin] = useState(false);
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [currentPin, setCurrentPin] = useState('');
  const [pinAuthPassword, setPinAuthPassword] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [savingPin, setSavingPin] = useState(false);

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const data = await api.getProfile();
      if (data?.user) {
        setDisplayName(data.user.displayName || '');
        setPhone(data.user.phone || '');
        setHasPin(!!data.user.hasPin);
      }
    } catch (err) {
      console.error('Failed to fetch profile', err);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      await api.updateProfile({
        displayName: displayName.trim(),
        phone: phone.trim()
      });
      toast.success('تم حفظ البيانات الشخصية بنجاح');
      if (refreshProfile) refreshProfile();
    } catch (err: any) {
      toast.error('حدث خطأ أثناء حفظ الملف الشخصي', err.message);
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      toast.warning('كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.warning('كلمة المرور الجديدة غير متطابقة مع التأكيد');
      return;
    }

    setChangingPassword(true);
    try {
      await api.changePassword({
        oldPassword,
        newPassword
      });
      toast.success('تم تغيير كلمة المرور بنجاح');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      toast.error('فشل تغيير كلمة المرور', err.message);
    } finally {
      setChangingPassword(false);
    }
  };

  const handleSetTransactionPin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{4,6}$/.test(pin)) {
      toast.warning('رمز الأمان يجب أن يتكون من 4 إلى 6 أرقام فقط');
      return;
    }
    if (pin !== confirmPin) {
      toast.warning('رمز الأمان غير متطابق مع التأكيد');
      return;
    }

    setSavingPin(true);
    try {
      await api.setTransactionPin({
        pin,
        currentPin: hasPin ? currentPin : undefined,
        currentPassword: pinAuthPassword || undefined
      });

      toast.success(
        hasPin ? 'تم تحديث رمز أمان المعاملات (PIN) بنجاح' : 'تم تفعيل رمز أمان المعاملات (PIN) بنجاح',
        'سيُطلب هذا الرمز الآن لتأكيد أي عملية سحب أموال من محفظتك.'
      );

      setHasPin(true);
      setPin('');
      setConfirmPin('');
      setCurrentPin('');
      setPinAuthPassword('');
      fetchUserProfile();
    } catch (err: any) {
      toast.error('فشل تعيين رمز الأمان', err.message);
    } finally {
      setSavingPin(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Top Banner / Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-neutral-900 via-neutral-900 to-yellow-950/20 p-6 rounded-2xl border border-neutral-800">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 flex items-center justify-center font-bold text-2xl shadow-inner">
            {(displayName || profile?.email || 'U')[0].toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-white">{displayName || 'عضو Nexora'}</h1>
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 flex items-center gap-1">
                <Crown className="w-3 h-3" />
                VIP {profile?.vipLevel || 0}
              </span>
              {isAdmin && (
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-red-500/20 text-red-400 border border-red-500/30 flex items-center gap-1">
                  <ShieldAlert className="w-3 h-3" />
                  مسؤول النظام (ADMIN)
                </span>
              )}
            </div>
            <p className="text-xs text-neutral-400 mt-1 font-mono" dir="ltr">
              {profile?.email || user?.email}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3.5 py-2 rounded-xl bg-neutral-950/80 border border-neutral-800 text-xs">
            <span className="text-neutral-400 block text-[11px]">حالة الحساب</span>
            <span className="font-bold text-emerald-400 flex items-center gap-1 mt-0.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              مفعل وموثق
            </span>
          </div>

          <div className="px-3.5 py-2 rounded-xl bg-neutral-950/80 border border-neutral-800 text-xs">
            <span className="text-neutral-400 block text-[11px]">رمز PIN للسحب</span>
            <span className={`font-bold flex items-center gap-1 mt-0.5 ${hasPin ? 'text-emerald-400' : 'text-orange-400'}`}>
              {hasPin ? <ShieldCheck className="w-3.5 h-3.5" /> : <ShieldAlert className="w-3.5 h-3.5" />}
              {hasPin ? 'مفعل ومحمي' : 'غير معين'}
            </span>
          </div>
        </div>
      </div>

      {/* Admin Panel Quick Access Banner (Only for Admins) */}
      {isAdmin && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-red-950/40 via-neutral-900 to-red-950/20 border border-red-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-500/20 border border-red-500/30 flex items-center justify-center text-red-400 shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-red-200">صلاحيات الإدارة والتحكم الكامل</h3>
              <p className="text-xs text-neutral-400 mt-0.5">
                حسابك يمتلك صلاحية المشرف العام لإدارة الأعضاء، مراجعة طلبات الإيداع والسحب، وضبط إعدادات المنصة.
              </p>
            </div>
          </div>
          <Link
            to="/admin"
            id="profile-admin-panel-btn"
            className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs flex items-center gap-2 transition-colors shrink-0 shadow-lg shadow-red-900/30"
          >
            <ShieldAlert className="w-4 h-4" />
            الانتقال إلى لوحة الإدارة
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CARD 1: Basic Profile Info */}
        <Card className="border-neutral-800 bg-neutral-900/40">
          <CardHeader>
            <CardTitle className="text-base text-white flex items-center gap-2">
              <User className="w-4 h-4 text-yellow-500" />
              البيانات الشخصية والحساب
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                  الاسم الكامل / الاسم المستعار
                </label>
                <Input 
                  id="profile-name"
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  placeholder="أدخل اسمك الكامل..."
                  required
                  className="bg-neutral-950 border-neutral-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                  رقم الهاتف / الواتساب (اختياري)
                </label>
                <Input 
                  id="profile-phone"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="+966xxxxxxxxx أو +20xxxxxxxxxx"
                  dir="ltr"
                  className="bg-neutral-950 border-neutral-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                  البريد الإلكتروني المسجل
                </label>
                <Input 
                  id="profile-email"
                  value={profile?.email || user?.email || ''}
                  disabled
                  dir="ltr"
                  className="bg-neutral-950/50 border-neutral-800/80 text-neutral-500 font-mono text-xs"
                />
                <p className="text-[11px] text-neutral-500 mt-1">
                  البريد الإلكتروني مرتبط بحسابك ولا يمكن تعديله.
                </p>
              </div>

              <div className="pt-2">
                <Button 
                  type="submit" 
                  isLoading={savingProfile}
                  className="w-full bg-yellow-500 hover:bg-yellow-400 text-neutral-950 font-bold"
                >
                  <Save className="w-4 h-4 ml-2" />
                  حفظ البيانات الشخصية
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* CARD 2: Security & Transaction PIN */}
        <Card className="border-neutral-800 bg-neutral-900/40">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base text-white flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-yellow-500" />
                رمز أمان المعاملات والسحب (PIN)
              </CardTitle>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                hasPin 
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                  : 'bg-orange-500/10 text-orange-400 border-orange-500/20'
              }`}>
                {hasPin ? 'مفعل' : 'مطلوب تعيينه'}
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSetTransactionPin} className="space-y-4">
              <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800/80 text-xs text-neutral-400 leading-relaxed">
                <p className="font-semibold text-neutral-300 flex items-center gap-1.5 mb-1">
                  <ShieldCheck className="w-4 h-4 text-yellow-500" />
                  حماية إضافية لمحفظتك المالية:
                </p>
                رمز PIN مكون من 4 إلى 6 أرقام سرية يُطلب دائماً عند إجراء أي عملية سحب نقدي لضمان عدم تمكن أي شخص من سحب أموالك حتى لو وصل لحسابك.
              </div>

              {hasPin ? (
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                    الرمز السري الحالي (PIN الحالي) أو كلمة مرور الحساب
                  </label>
                  <Input 
                    id="current-pin"
                    type={showPin ? "text" : "password"}
                    maxLength={6}
                    value={currentPin}
                    onChange={e => setCurrentPin(e.target.value)}
                    placeholder="أدخل الرمز الحالي أو كلمة المرور..."
                    dir="ltr"
                    className="bg-neutral-950 border-neutral-800 font-mono tracking-widest"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                    كلمة مرور حسابك لتأكيد الهوية *
                  </label>
                  <Input 
                    id="pin-auth-password"
                    type="password"
                    value={pinAuthPassword}
                    onChange={e => setPinAuthPassword(e.target.value)}
                    placeholder="أدخل كلمة مرور تسجيل الدخول..."
                    required
                    dir="ltr"
                    className="bg-neutral-950 border-neutral-800 text-xs"
                  />
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                    {hasPin ? 'رمز PIN الجديد (4-6 أرقام)' : 'رمز PIN المالي (4-6 أرقام)'} *
                  </label>
                  <Input 
                    id="new-pin"
                    type={showPin ? "text" : "password"}
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    value={pin}
                    onChange={e => setPin(e.target.value.replace(/\D/g, ''))}
                    placeholder="مثال: 1234"
                    required
                    dir="ltr"
                    className="bg-neutral-950 border-neutral-800 font-mono tracking-widest text-center text-lg"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                    تأكيد رمز PIN *
                  </label>
                  <Input 
                    id="confirm-pin"
                    type={showPin ? "text" : "password"}
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    value={confirmPin}
                    onChange={e => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                    placeholder="أعد إدخال الرمز"
                    required
                    dir="ltr"
                    className="bg-neutral-950 border-neutral-800 font-mono tracking-widest text-center text-lg"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  className="text-xs text-neutral-400 hover:text-white flex items-center gap-1 transition-colors"
                >
                  {showPin ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  {showPin ? 'إخفاء الأرقام' : 'إظهار الأرقام'}
                </button>
              </div>

              <Button 
                type="submit" 
                isLoading={savingPin}
                className="w-full bg-neutral-800 hover:bg-neutral-700 text-white font-bold border border-neutral-700"
              >
                <ShieldCheck className="w-4 h-4 ml-2 text-yellow-500" />
                {hasPin ? 'تحديث رمز أمان المعاملات (PIN)' : 'تفعيل وتعيين رمز الأمان (PIN)'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* CARD 3: Change Password */}
        <Card className="border-neutral-800 bg-neutral-900/40 lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base text-white flex items-center gap-2">
              <Lock className="w-4 h-4 text-yellow-500" />
              تغيير كلمة المرور
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleChangePassword} className="space-y-4 max-w-xl">
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                  كلمة المرور الحالية *
                </label>
                <Input 
                  id="old-password"
                  type={showPassword ? "text" : "password"}
                  value={oldPassword}
                  onChange={e => setOldPassword(e.target.value)}
                  placeholder="أدخل كلمة المرور الحالية..."
                  required
                  dir="ltr"
                  className="bg-neutral-950 border-neutral-800"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                    كلمة المرور الجديدة *
                  </label>
                  <Input 
                    id="new-password"
                    type={showPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="6 أحرف على الأقل..."
                    required
                    dir="ltr"
                    className="bg-neutral-950 border-neutral-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                    تأكيد كلمة المرور الجديدة *
                  </label>
                  <Input 
                    id="confirm-password"
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="أعد إدخال كلمة المرور..."
                    required
                    dir="ltr"
                    className="bg-neutral-950 border-neutral-800"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-xs text-neutral-400 hover:text-white flex items-center gap-1 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  {showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                </button>
              </div>

              <div className="pt-2">
                <Button 
                  type="submit" 
                  isLoading={changingPassword}
                  className="bg-neutral-800 hover:bg-neutral-700 text-white font-bold border border-neutral-700 px-6"
                >
                  <Lock className="w-4 h-4 ml-2 text-yellow-500" />
                  تحديث كلمة المرور
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* CARD 4: Logout */}
        <Card className="border-red-950 bg-red-950/10 lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base text-red-400 flex items-center gap-2">
              <LogOut className="w-4 h-4 text-red-500" />
              جلسة الحساب وتسجيل الخروج
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-xs text-neutral-400">
              يمكنك تسجيل الخروج من حسابك الحالي بأمان. سيتطلب منك إدخال بيانات الدخول مرة أخرى عند العودة.
            </p>
            <Button 
              type="button" 
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700 text-white font-bold border border-red-500 px-6"
            >
              <LogOut className="w-4 h-4 ml-2" />
              تسجيل الخروج من الحساب
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
