import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { 
  Headphones, 
  MessageCircle, 
  Send, 
  X, 
  ExternalLink, 
  ShieldCheck, 
  HelpCircle,
  Clock
} from 'lucide-react';

export default function CustomerSupportFloating() {
  const [isOpen, setIsOpen] = useState(false);
  const [settings, setSettings] = useState<{
    telegram_support?: string;
    whatsapp_support?: string;
    site_name?: string;
  }>({});

  useEffect(() => {
    fetchSupportSettings();
  }, []);

  const fetchSupportSettings = async () => {
    try {
      const data = await api.getSettings();
      if (data?.settings) {
        setSettings(data.settings);
      }
    } catch (err) {
      console.error('Failed to load support settings', err);
    }
  };

  const telegramUrl = settings.telegram_support?.trim() || 'https://t.me/NexoraSupport';
  const whatsappUrl = settings.whatsapp_support?.trim() || '';

  // Format whatsapp URL if it's a raw number
  const formattedWhatsappUrl = whatsappUrl
    ? whatsappUrl.startsWith('http') 
      ? whatsappUrl 
      : `https://wa.me/${whatsappUrl.replace(/[^0-9]/g, '')}`
    : '';

  return (
    <div className="fixed bottom-20 md:bottom-6 left-6 z-40" dir="rtl">
      {/* Support Popover Menu */}
      {isOpen && (
        <div className="mb-3 w-80 bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200">
          {/* Header */}
          <div className="bg-gradient-to-r from-yellow-950/40 via-neutral-900 to-neutral-900 p-4 border-b border-neutral-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center text-yellow-500">
                <Headphones className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">الدعم الفني المباشر</h4>
                <p className="text-[11px] text-neutral-400 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  فريق الخدمة متصل 24/7
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="text-neutral-400 hover:text-white p-1 rounded-lg hover:bg-neutral-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <div className="p-4 space-y-3">
            <p className="text-xs text-neutral-300 leading-relaxed">
              هل تواجه أي مشكلة في الإيداع، السحب، أو ترقية باقات VIP؟ تواصل مباشرة مع مسؤولي خدمة العملاء:
            </p>

            {/* Telegram Support Button */}
            {telegramUrl && (
              <a
                href={telegramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-3 rounded-xl bg-[#229ED9]/10 hover:bg-[#229ED9]/20 border border-[#229ED9]/30 text-white transition-all group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#229ED9] text-white flex items-center justify-center">
                    <Send className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold block text-white">دعم تليجرام (Telegram)</span>
                    <span className="text-[10px] text-neutral-400">استجابة سريعة وفورية</span>
                  </div>
                </div>
                <ExternalLink className="w-4 h-4 text-neutral-400 group-hover:text-white transition-colors" />
              </a>
            )}

            {/* WhatsApp Support Button */}
            {formattedWhatsappUrl && (
              <a
                href={formattedWhatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-3 rounded-xl bg-[#25D366]/10 hover:bg-[#25D366]/20 border border-[#25D366]/30 text-white transition-all group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#25D366] text-white flex items-center justify-center">
                    <MessageCircle className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold block text-white">دعم واتساب (WhatsApp)</span>
                    <span className="text-[10px] text-neutral-400">محادثة فورية مع الممثل</span>
                  </div>
                </div>
                <ExternalLink className="w-4 h-4 text-neutral-400 group-hover:text-white transition-colors" />
              </a>
            )}

            <div className="pt-2 border-t border-neutral-800/80 flex items-center justify-between text-[11px] text-neutral-500">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-yellow-500" />
                قنوات معتمدة رسمياً
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                رد خلال دقائق
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Floating Toggle Button */}
      <button
        id="floating-support-button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2.5 bg-yellow-500 hover:bg-yellow-400 text-neutral-950 px-4 py-3 rounded-full font-bold shadow-lg shadow-yellow-500/20 hover:shadow-yellow-500/30 transition-all transform hover:scale-105 active:scale-95 border-2 border-yellow-400/40"
      >
        <div className="relative">
          <Headphones className="w-5 h-5" />
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-yellow-500" />
        </div>
        <span className="text-xs tracking-wide">الدعم الفني</span>
      </button>
    </div>
  );
}
