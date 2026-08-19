import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { LoadingState } from '../../components/ui/LoadingState';
import { useToast } from '../../components/ui/Toast';
import { 
  Settings, 
  Wallet, 
  Save, 
  DollarSign, 
  ShieldCheck, 
  Copy, 
  Check, 
  RefreshCw, 
  BellRing,
  QrCode,
  Sparkles,
  Headphones,
  Send,
  MessageCircle,
  Bot,
  KeyRound,
  Eye,
  EyeOff,
  Zap,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  HelpCircle,
  Mail,
  AtSign,
  Server
} from 'lucide-react';
import { api } from '../../lib/api';

export default function AdminSettings() {
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testingTelegram, setTestingTelegram] = useState(false);
  const [testingEmail, setTestingEmail] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showBotToken, setShowBotToken] = useState(false);
  const [showSmtpPass, setShowSmtpPass] = useState(false);

  // Settings state
  const [usdtAddress, setUsdtAddress] = useState('TYDZSxdvcr7x557yU7wT34C7yM7yT6k7Wb');
  const [minWithdrawal, setMinWithdrawal] = useState('5.00');
  const [minDeposit, setMinDeposit] = useState('5.00');
  const [networkName, setNetworkName] = useState('TRON / TRC20');
  const [announcement, setAnnouncement] = useState('مرحباً بكم في منصة Nexora. الدفع والسحب متاحان على مدار الساعة.');
  const [telegramSupport, setTelegramSupport] = useState('https://t.me/NexoraSupport');
  const [whatsappSupport, setWhatsappSupport] = useState('+1234567890');

  // Telegram Bot Notifications state
  const [telegramBotToken, setTelegramBotToken] = useState('');
  const [telegramAdminChatId, setTelegramAdminChatId] = useState('');
  const [telegramTestStatus, setTelegramTestStatus] = useState<{
    success: boolean;
    message: string;
    botName?: string;
    username?: string;
  } | null>(null);

  // Email / SMTP Notifications state
  const [smtpHost, setSmtpHost] = useState('');
  const [smtpPort, setSmtpPort] = useState('587');
  const [smtpUser, setSmtpUser] = useState('');
  const [smtpPass, setSmtpPass] = useState('');
  const [smtpFrom, setSmtpFrom] = useState('Nexora Platform <notifications@nexora.com>');
  const [smtpSecure, setSmtpSecure] = useState('false');
  const [testToEmail, setTestToEmail] = useState('');
  const [emailTestStatus, setEmailTestStatus] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const data = await api.admin.getSettings();
      if (data?.settings) {
        if (data.settings.usdt_address) setUsdtAddress(data.settings.usdt_address);
        if (data.settings.min_withdrawal) setMinWithdrawal(data.settings.min_withdrawal);
        if (data.settings.min_deposit) setMinDeposit(data.settings.min_deposit);
        if (data.settings.network_name) setNetworkName(data.settings.network_name);
        if (data.settings.announcement) setAnnouncement(data.settings.announcement);
        if (data.settings.telegram_support_url || data.settings.telegram_support) {
          setTelegramSupport(data.settings.telegram_support_url || data.settings.telegram_support);
        }
        if (data.settings.whatsapp_support_url || data.settings.whatsapp_support) {
          setWhatsappSupport(data.settings.whatsapp_support_url || data.settings.whatsapp_support);
        }
        if (data.settings.telegram_bot_token) {
          setTelegramBotToken(data.settings.telegram_bot_token);
        }
        if (data.settings.telegram_admin_chat_id) {
          setTelegramAdminChatId(data.settings.telegram_admin_chat_id);
        }
        if (data.settings.smtp_host) setSmtpHost(data.settings.smtp_host);
        if (data.settings.smtp_port) setSmtpPort(data.settings.smtp_port);
        if (data.settings.smtp_user) setSmtpUser(data.settings.smtp_user);
        if (data.settings.smtp_pass) setSmtpPass(data.settings.smtp_pass);
        if (data.settings.smtp_from) setSmtpFrom(data.settings.smtp_from);
        if (data.settings.smtp_secure) setSmtpSecure(data.settings.smtp_secure);
      }
    } catch (err: any) {
      toast.error('فشل في جلب الإعدادات', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(usdtAddress);
    setCopied(true);
    toast.success('تم نسخ العنوان بنجاح');
    setTimeout(() => setCopied(false), 2500);
  };

  const handleTestTelegram = async () => {
    if (!telegramBotToken.trim()) {
      toast.warning('يرجى إدخال رمز البوت (Telegram Bot Token) أولاً');
      return;
    }
    if (!telegramAdminChatId.trim()) {
      toast.warning('يرجى إدخال معرف الدردشة (Admin Chat ID) أولاً');
      return;
    }

    setTestingTelegram(true);
    setTelegramTestStatus(null);

    try {
      const res = await api.admin.testTelegram({
        botToken: telegramBotToken.trim(),
        chatId: telegramAdminChatId.trim(),
      });

      setTelegramTestStatus({
        success: true,
        message: res.message || 'تم إرسال رسالة الاختبار بنجاح إلى شات الإدارة!',
        botName: res.botName,
        username: res.username,
      });

      toast.success('نجح اختبار البوت!', 'تم إرسال إشعار تجريبي إلى حساب التيليجرام الخاص بك.');
    } catch (err: any) {
      setTelegramTestStatus({
        success: false,
        message: err.message || 'تعذر إرسال الإشعار. تأكد من صحة التوكن وبدء محادثة مع البوت (/start).',
      });
      toast.error('فشل اختبار الاتصال بالتيليجرام', err.message);
    } finally {
      setTestingTelegram(false);
    }
  };

  const handleTestEmail = async () => {
    if (!smtpHost.trim()) {
      toast.warning('يرجى إدخال اسم خادم البريد (SMTP Host) أولاً');
      return;
    }
    if (!smtpUser.trim()) {
      toast.warning('يرجى إدخال اسم المستخدم أو البريد (SMTP User) أولاً');
      return;
    }

    setTestingEmail(true);
    setEmailTestStatus(null);

    try {
      const res = await api.admin.testEmail({
        host: smtpHost.trim(),
        port: parseInt(smtpPort, 10) || 587,
        user: smtpUser.trim(),
        pass: smtpPass.trim(),
        secure: smtpSecure === 'true' || smtpPort === '465',
        toEmail: testToEmail.trim() || undefined,
      });

      setEmailTestStatus({
        success: true,
        message: res.message || 'تم التحقق من خادم SMTP وإرسال البريد التجريبي بنجاح!',
      });

      toast.success('نجح اختبار البريد!', 'تم الاتصال بخادم SMTP والتحقق من صلاحية الإرسال.');
    } catch (err: any) {
      setEmailTestStatus({
        success: false,
        message: err.message || 'فشل الاتصال بخادم البريد. تأكد من صحة بيانات الخادم وكلمة المرور.',
      });
      toast.error('فشل اختبار خدمة البريد', err.message);
    } finally {
      setTestingEmail(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!usdtAddress.trim() || usdtAddress.trim().length < 15) {
      toast.warning('يرجى إدخال عنوان محفظة USDT صحيح');
      return;
    }

    const minW = parseFloat(minWithdrawal);
    if (isNaN(minW) || minW < 1) {
      toast.warning('الحد الأدنى للسحب يجب أن يكون 1$ أو أكثر');
      return;
    }

    const minD = parseFloat(minDeposit);
    if (isNaN(minD) || minD <= 0) {
      toast.warning('الحد الأدنى للإيداع يجب أن يكون أكبر من 0$');
      return;
    }

    setSaving(true);
    try {
      await api.admin.updateSettings({
        usdt_address: usdtAddress.trim(),
        min_withdrawal: minW.toFixed(2),
        min_deposit: minD.toFixed(2),
        network_name: networkName.trim(),
        announcement: announcement.trim(),
        telegram_support_url: telegramSupport.trim(),
        telegram_support: telegramSupport.trim(),
        whatsapp_support_url: whatsappSupport.trim(),
        whatsapp_support: whatsappSupport.trim(),
        telegram_bot_token: telegramBotToken.trim(),
        telegram_admin_chat_id: telegramAdminChatId.trim(),
        smtp_host: smtpHost.trim(),
        smtp_port: smtpPort.trim(),
        smtp_user: smtpUser.trim(),
        smtp_pass: smtpPass.trim(),
        smtp_from: smtpFrom.trim(),
        smtp_secure: smtpSecure,
      });

      toast.success(
        'تم حفظ الإعدادات بنجاح!',
        'تم تحديث إعدادات النظام ومحفظة المنصة وبوت التيليجرام وخدمة البريد فوراً.'
      );
    } catch (err: any) {
      toast.error('فشل في حفظ الإعدادات', err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <LoadingState message="جاري تحميل إعدادات النظام والمحفظة..." />;
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Settings className="w-6 h-6 text-yellow-500" />
            <h1 className="text-2xl font-bold text-white">إعدادات النظام وإشعارات الإدارة</h1>
          </div>
          <p className="text-neutral-400 text-sm mt-1">
            إدارة عنوان محفظة المنصة، بوت إشعارات تيليجرام الفوري، حدود السحب والإيداع، وقنوات الدعم.
          </p>
        </div>

        <Button 
          variant="outline" 
          size="sm" 
          onClick={fetchSettings}
          className="self-start border-neutral-800 text-neutral-300 hover:text-white"
        >
          <RefreshCw className="w-4 h-4 ml-2" />
          تحديث
        </Button>
      </div>

      <form onSubmit={handleSaveSettings} className="space-y-6">
        {/* Telegram Admin Notifications Card */}
        <Card className="border-sky-500/30 bg-gradient-to-b from-sky-950/20 via-neutral-900/50 to-neutral-900/40 shadow-xl">
          <CardHeader className="border-b border-neutral-800/80 pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center border border-sky-500/30 shadow-inner">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-lg text-white">إشعارات تيليجرام الفورية للإدارة</CardTitle>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/10 text-sky-400 border border-sky-500/20">
                      Telegram Bot Alerts
                    </span>
                  </div>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    استقبال تنبيهات فورية ومباشرة على تيليجرام عند حدوث إيداع جديد، طلب سحب، أو ترقية VIP.
                  </p>
                </div>
              </div>

              {/* Status Badge */}
              <div className="flex items-center gap-2">
                {telegramBotToken && telegramAdminChatId ? (
                  <span className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    البوت متصل
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-neutral-800 text-neutral-400 border border-neutral-700">
                    غير مهيأ
                  </span>
                )}
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-5 pt-5">
            {/* Supported Triggers Notice */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 bg-neutral-950/80 rounded-xl border border-neutral-800/80">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
                  <DollarSign className="w-4 h-4" />
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-white block">طلبات الإيداع الجديدة</span>
                  <span className="text-[10px] text-neutral-400">المبلغ، اسم العميل، وTXID</span>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-yellow-500/10 text-yellow-400 flex items-center justify-center shrink-0">
                  <Wallet className="w-4 h-4" />
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-white block">طلبات سحب الرصيد</span>
                  <span className="text-[10px] text-neutral-400">المبلغ، عنوان المحفظة، والوقت</span>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center shrink-0">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-white block">اشتراكات وترقيات VIP</span>
                  <span className="text-[10px] text-neutral-400">اسم الباقة ومبلغ الاشتراك</span>
                </div>
              </div>
            </div>

            {/* Inputs Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Bot Token */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-neutral-300">
                    <KeyRound className="w-3.5 h-3.5 text-sky-400" />
                    رمز البوت (Telegram Bot Token)
                  </label>
                  <a
                    href="https://t.me/BotFather"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-sky-400 hover:text-sky-300 flex items-center gap-1 hover:underline"
                  >
                    الحصول من @BotFather
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <div className="relative">
                  <Input
                    id="admin-telegram-bot-token"
                    type={showBotToken ? 'text' : 'password'}
                    value={telegramBotToken}
                    onChange={e => setTelegramBotToken(e.target.value)}
                    placeholder="مثال: 123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ"
                    dir="ltr"
                    className="text-xs bg-neutral-950 border-neutral-800 font-mono text-sky-300 pl-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowBotToken(!showBotToken)}
                    className="absolute left-3 top-2.5 text-neutral-500 hover:text-neutral-300"
                    title={showBotToken ? 'إخفاء الرمز' : 'إظهار الرمز'}
                  >
                    {showBotToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[11px] text-neutral-500">
                  قم بإنشاء بوت عبر @BotFather في تلغرام وانسخ رمز API Token الممنوح لك.
                </p>
              </div>

              {/* Chat ID */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-neutral-300">
                    <Send className="w-3.5 h-3.5 text-sky-400" />
                    معرف الدردشة للإدارة (Admin Chat ID)
                  </label>
                  <a
                    href="https://t.me/userinfobot"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-sky-400 hover:text-sky-300 flex items-center gap-1 hover:underline"
                  >
                    معرفة الآيدي عبر @userinfobot
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <Input
                  id="admin-telegram-chat-id"
                  value={telegramAdminChatId}
                  onChange={e => setTelegramAdminChatId(e.target.value)}
                  placeholder="مثال: 987654321 أو -100123456789 (للقنوات/المجموعات)"
                  dir="ltr"
                  className="text-xs bg-neutral-950 border-neutral-800 font-mono text-sky-300"
                />
                <p className="text-[11px] text-neutral-500">
                  معرف حسابك الشخصي أو معرف القناة/المجموعة الخاصة بالإدارة (يجب أن يكون البوت مشرفاً فيها).
                </p>
              </div>
            </div>

            {/* Test Connection Button & Result */}
            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <Button
                id="test-telegram-connection-button"
                type="button"
                variant="outline"
                size="sm"
                onClick={handleTestTelegram}
                isLoading={testingTelegram}
                className="border-sky-500/40 text-sky-400 hover:bg-sky-500/10 hover:text-sky-300 font-semibold"
              >
                <Zap className="w-4 h-4 ml-2 text-sky-400" />
                اختبار الاتصال وإرسال إشعار تجريبي
              </Button>

              <p className="text-[11px] text-neutral-400 flex items-center gap-1">
                <HelpCircle className="w-3.5 h-3.5 text-neutral-500" />
                تأكد من الضغط على <b>/start</b> في محادثة البوت قبل إجراء الاختبار.
              </p>
            </div>

            {/* Test Status Feedback Banner */}
            {telegramTestStatus && (
              <div
                className={`p-3.5 rounded-xl border text-xs flex items-start gap-3 transition-all animate-in fade-in duration-200 ${
                  telegramTestStatus.success
                    ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-300'
                    : 'bg-rose-950/30 border-rose-500/30 text-rose-300'
                }`}
              >
                {telegramTestStatus.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                )}
                <div>
                  <span className="font-bold block">
                    {telegramTestStatus.success ? 'نجح الاتصال بالبوت!' : 'تعذر الاتصال بالبوت:'}
                  </span>
                  <p className="mt-0.5 text-[11px] leading-relaxed opacity-90">
                    {telegramTestStatus.message}
                  </p>
                  {telegramTestStatus.botName && (
                    <span className="text-[10px] text-emerald-400 font-mono mt-1 block">
                      اسم البوت: {telegramTestStatus.botName} {telegramTestStatus.username}
                    </span>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Email / SMTP Service Notifications Card */}
        <Card className="border-amber-500/30 bg-gradient-to-b from-amber-950/20 via-neutral-900/50 to-neutral-900/40 shadow-xl">
          <CardHeader className="border-b border-neutral-800/80 pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/30 shadow-inner">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-lg text-white">خدمة مراسلة البريد الإلكتروني التلقائي (SMTP / Email)</CardTitle>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      إشعارات فورية للعملاء
                    </span>
                  </div>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    إرسال بريد إلكتروني فوري للمستخدم عند قبول أو رفض طلب الإيداع، السحب، إثباتات المهام، أو ترقية الباقة.
                  </p>
                </div>
              </div>

              {/* Status indicator */}
              <div className="flex items-center gap-2 self-start sm:self-auto">
                {smtpHost && smtpUser ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    البريد مفعل ومربوط
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-neutral-800 text-neutral-400 border border-neutral-700">
                    <span className="w-2 h-2 rounded-full bg-neutral-500"></span>
                    وضع المحاكاة الافتراضي
                  </span>
                )}
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-5 pt-4">
            <div className="p-3.5 bg-amber-950/20 border border-amber-800/30 rounded-xl flex items-start gap-3">
              <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div className="text-xs text-neutral-300 leading-relaxed">
                <span className="font-bold text-amber-300">مراسلة فورية ذكية:</span> يقوم النظام آلياً بإنشاء رسائل HTML منسقة واحترافية للمستخدم عند تحديث حالة أي طلب تحتوي على تفاصيل العملية ورقم المعاملة (TXID) وبيان النتيجة وسبب الرفض إن وجد.
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* SMTP Host */}
              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-xs font-semibold text-neutral-300">
                  <Server className="w-3.5 h-3.5 text-amber-400" />
                  خادم البريد (SMTP Host)
                </label>
                <Input
                  id="admin-smtp-host"
                  value={smtpHost}
                  onChange={e => setSmtpHost(e.target.value)}
                  placeholder="smtp.gmail.com أو mail.domain.com"
                  dir="ltr"
                  className="font-mono text-xs bg-neutral-950 border-neutral-800 text-neutral-200"
                />
                <p className="text-[11px] text-neutral-500">
                  عنوان خادم إرسال البريد
                </p>
              </div>

              {/* SMTP Port */}
              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-xs font-semibold text-neutral-300">
                  <Settings className="w-3.5 h-3.5 text-neutral-400" />
                  منفذ الخادم (SMTP Port)
                </label>
                <Input
                  id="admin-smtp-port"
                  value={smtpPort}
                  onChange={e => setSmtpPort(e.target.value)}
                  placeholder="587 أو 465 أو 25"
                  dir="ltr"
                  className="font-mono text-xs bg-neutral-950 border-neutral-800 text-neutral-200"
                />
                <p className="text-[11px] text-neutral-500">
                  الافتراضي: 587 لـ TLS أو 465 لـ SSL
                </p>
              </div>

              {/* Secure SSL/TLS */}
              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-xs font-semibold text-neutral-300">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  تشفير الاتصال (SSL / TLS)
                </label>
                <select
                  id="admin-smtp-secure"
                  value={smtpSecure}
                  onChange={e => setSmtpSecure(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2 text-xs text-neutral-200 focus:outline-none focus:border-amber-500/50"
                >
                  <option value="false">تلقائي / STARTTLS (منفذ 587)</option>
                  <option value="true">تشفير كامل SSL/TLS (منفذ 465)</option>
                </select>
                <p className="text-[11px] text-neutral-500">
                  نوع تشفير قناة الاتصال
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* SMTP User */}
              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-xs font-semibold text-neutral-300">
                  <AtSign className="w-3.5 h-3.5 text-amber-400" />
                  اسم مستخدم البريد (SMTP User)
                </label>
                <Input
                  id="admin-smtp-user"
                  value={smtpUser}
                  onChange={e => setSmtpUser(e.target.value)}
                  placeholder="notifications@nexora.com"
                  dir="ltr"
                  className="font-mono text-xs bg-neutral-950 border-neutral-800 text-neutral-200"
                />
                <p className="text-[11px] text-neutral-500">
                  البريد الإلكتروني أو اسم الحساب لدى مزود الخدمة
                </p>
              </div>

              {/* SMTP Pass */}
              <div className="space-y-1.5">
                <label className="flex items-center justify-between text-xs font-semibold text-neutral-300">
                  <span className="flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-yellow-500" />
                    كلمة المرور (SMTP Password / App Password)
                  </span>
                </label>
                <div className="relative">
                  <Input
                    id="admin-smtp-pass"
                    type={showSmtpPass ? "text" : "password"}
                    value={smtpPass}
                    onChange={e => setSmtpPass(e.target.value)}
                    placeholder="كلمة مرور SMTP أو رمز التطبيق..."
                    dir="ltr"
                    className="font-mono text-xs bg-neutral-950 border-neutral-800 pr-10 text-neutral-200"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSmtpPass(!showSmtpPass)}
                    className="absolute left-3 top-2.5 text-neutral-500 hover:text-neutral-300"
                  >
                    {showSmtpPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[11px] text-neutral-500">
                  في Gmail استخدم "App Password" بدلاً من كلمة المرور العادية
                </p>
              </div>
            </div>

            {/* Sender Name & Email */}
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-xs font-semibold text-neutral-300">
                <Mail className="w-3.5 h-3.5 text-amber-400" />
                اسم وعنوان المرسل (Sender From)
              </label>
              <Input
                id="admin-smtp-from"
                value={smtpFrom}
                onChange={e => setSmtpFrom(e.target.value)}
                placeholder="Nexora Platform <notifications@nexora.com>"
                dir="ltr"
                className="font-mono text-xs bg-neutral-950 border-neutral-800 text-neutral-200"
              />
              <p className="text-[11px] text-neutral-500">
                الاسم والعنوان الذي يظهر في صندوق بريد العميل عند استلام الإشعار
              </p>
            </div>

            {/* Test Email Section */}
            <div className="pt-3 border-t border-neutral-800/80 space-y-3">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="flex-1">
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">
                    إرسال بريد تجريبي للتأكد من نجاح الإعدادات:
                  </label>
                  <Input
                    id="admin-test-to-email"
                    type="email"
                    value={testToEmail}
                    onChange={e => setTestToEmail(e.target.value)}
                    placeholder="أدخل بريدك الشخصي لاستلام رسالة التجربة (اختياري)..."
                    dir="ltr"
                    className="text-xs bg-neutral-950 border-neutral-800 text-neutral-200"
                  />
                </div>

                <Button
                  id="test-smtp-email-button"
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleTestEmail}
                  isLoading={testingEmail}
                  className="border-amber-600/40 text-amber-400 hover:bg-amber-500/10 shrink-0 self-end sm:self-auto"
                >
                  <Send className="w-4 h-4 ml-1.5 text-amber-400" />
                  اختبار إرسال بريد تجريبي
                </Button>
              </div>

              {/* Test Status Feedback Box */}
              {emailTestStatus && (
                <div className={`p-3.5 rounded-xl border text-xs flex items-start gap-3 transition-all animate-in fade-in duration-200 ${
                  emailTestStatus.success 
                    ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-300' 
                    : 'bg-rose-950/30 border-rose-500/30 text-rose-300'
                }`}>
                  {emailTestStatus.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <span className="font-bold block">
                      {emailTestStatus.success ? 'نجح اختبار خادم البريد!' : 'فشل اختبار خادم البريد:'}
                    </span>
                    <p className="mt-0.5 text-[11px] leading-relaxed opacity-90">
                      {emailTestStatus.message}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Customer Support Settings Card */}
        <Card className="border-neutral-800 bg-neutral-900/40">
          <CardHeader>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
                <Headphones className="w-4 h-4" />
              </div>
              <div>
                <CardTitle className="text-lg text-white">إعدادات الدعم الفني وخدمة العملاء</CardTitle>
                <p className="text-xs text-neutral-400 mt-0.5">
                  هذه الروابط ترتبط بالزر العائم للدعم الفني الظاهر لجميع المستخدمين.
                </p>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Telegram Support */}
              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-xs font-semibold text-neutral-300">
                  <Send className="w-3.5 h-3.5 text-sky-400" />
                  رابط دعم التلغرام (Telegram Support)
                </label>
                <Input
                  id="admin-telegram-support"
                  value={telegramSupport}
                  onChange={e => setTelegramSupport(e.target.value)}
                  placeholder="https://t.me/your_support_account أو @username"
                  dir="ltr"
                  className="text-xs bg-neutral-950 border-neutral-800 font-mono text-sky-400"
                />
                <p className="text-[11px] text-neutral-500">
                  رابط حساب أو بوت الدعم الفني المباشر للمستخدمين.
                </p>
              </div>

              {/* WhatsApp Support */}
              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-xs font-semibold text-neutral-300">
                  <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                  رابط أو رقم دعم الواتساب (WhatsApp Support)
                </label>
                <Input
                  id="admin-whatsapp-support"
                  value={whatsappSupport}
                  onChange={e => setWhatsappSupport(e.target.value)}
                  placeholder="https://wa.me/1234567890 أو +1234567890"
                  dir="ltr"
                  className="text-xs bg-neutral-950 border-neutral-800 font-mono text-emerald-400"
                />
                <p className="text-[11px] text-neutral-500">
                  رابط المحادثة المباشرة أو رقم هاتف الواتساب مع رمز الدولة.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Wallet & Payment Settings Card */}
        <Card className="border-neutral-800 bg-neutral-900/40">
          <CardHeader>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-yellow-500/10 text-yellow-500 flex items-center justify-center border border-yellow-500/20">
                <Wallet className="w-4 h-4" />
              </div>
              <CardTitle className="text-lg text-white">إعدادات المحفظة والتحويل المالي (USDT)</CardTitle>
            </div>
          </CardHeader>

          <CardContent className="space-y-5">
            {/* USDT Address */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-neutral-200">
                عنوان محفظة المنصة الرسمي لاستقبال الإيداعات (USDT TRC20)
              </label>
              <p className="text-xs text-neutral-400">
                هذا هو العنوان الذي سيظهر لجميع المستخدمين في صفحة المحفظة عند الضغط على "إيداع جديد".
              </p>
              
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <Input
                  id="admin-usdt-address"
                  value={usdtAddress}
                  onChange={e => setUsdtAddress(e.target.value)}
                  placeholder="أدخل عنوان المحفظة (مثال: TYDZSxdvcr7x557yU7wT34C7yM7yT6k7Wb)..."
                  required
                  dir="ltr"
                  className="font-mono text-xs flex-1 text-yellow-400 bg-neutral-950 border-neutral-800"
                />

                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={handleCopyAddress}
                  className="shrink-0 font-medium text-xs bg-neutral-800 hover:bg-neutral-700 text-white"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-400 ml-1.5" />
                      تم النسخ
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 ml-1.5" />
                      نسخ
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Network Name & Quick Preview */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                  اسم شبكة البلوكتشين المعتمدة
                </label>
                <Input
                  id="admin-network-name"
                  value={networkName}
                  onChange={e => setNetworkName(e.target.value)}
                  placeholder="مثال: TRON / TRC20"
                  required
                  dir="ltr"
                  className="text-xs bg-neutral-950 border-neutral-800"
                />
              </div>

              {/* QR / Visual indicator */}
              <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-neutral-900 border border-neutral-800 flex items-center justify-center text-yellow-500">
                    <QrCode className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block">رمز QR التلقائي</span>
                    <span className="text-[11px] text-neutral-400">يتم توليده تلقائياً من العنوان</span>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  مفعل
                </span>
              </div>
            </div>

            {/* Minimum Limits */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-neutral-800/80">
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                  الحد الأدنى لمبلغ السحب ($ USD)
                </label>
                <div className="relative">
                  <Input
                    id="admin-min-withdrawal"
                    type="number"
                    min="1"
                    step="0.01"
                    value={minWithdrawal}
                    onChange={e => setMinWithdrawal(e.target.value)}
                    required
                    dir="ltr"
                    className="bg-neutral-950 border-neutral-800"
                  />
                  <span className="absolute left-3 top-2.5 text-xs text-neutral-500 font-bold">$</span>
                </div>
                <p className="text-[11px] text-neutral-500 mt-1">
                  لن يتمكن المستخدم من تقديم طلب سحب بأقل من هذا المبلغ.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                  الحد الأدنى لمبلغ الإيداع ($ USD)
                </label>
                <div className="relative">
                  <Input
                    id="admin-min-deposit"
                    type="number"
                    min="0.1"
                    step="0.01"
                    value={minDeposit}
                    onChange={e => setMinDeposit(e.target.value)}
                    required
                    dir="ltr"
                    className="bg-neutral-950 border-neutral-800"
                  />
                  <span className="absolute left-3 top-2.5 text-xs text-neutral-500 font-bold">$</span>
                </div>
                <p className="text-[11px] text-neutral-500 mt-1">
                  الحد الأدنى الموصى به لإيداعات المستخدمين.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Announcement & System Notices Card */}
        <Card className="border-neutral-800 bg-neutral-900/40">
          <CardHeader>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/20">
                <BellRing className="w-4 h-4" />
              </div>
              <CardTitle className="text-lg text-white">إعلانات وشريط تنبيهات المنصة</CardTitle>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                نص الإعلان العام (Announcement)
              </label>
              <textarea
                id="admin-announcement"
                rows={3}
                value={announcement}
                onChange={e => setAnnouncement(e.target.value)}
                placeholder="أدخل رسالة أو إشعار يظهر لجميع المستخدمين في المنصة..."
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-sm text-neutral-200 focus:outline-none focus:border-yellow-500/50 transition-colors"
              />
            </div>
          </CardContent>
        </Card>

        {/* Action Button */}
        <div className="flex justify-end gap-3 pt-2">
          <Button
            id="save-admin-settings-button"
            type="submit"
            isLoading={saving}
            className="bg-yellow-500 hover:bg-yellow-400 text-neutral-950 font-bold px-8 py-2.5 rounded-xl shadow-lg shadow-yellow-500/20"
          >
            <Save className="w-4 h-4 ml-2" />
            حفظ جميع التغييرات
          </Button>
        </div>
      </form>
    </div>
  );
}
