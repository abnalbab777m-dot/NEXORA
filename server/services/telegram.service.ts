import { SettingsService } from './settings.service';

export interface TelegramTestResult {
  success: boolean;
  botName?: string;
  username?: string;
  message: string;
}

export class TelegramService {
  /**
   * Send a raw message using Telegram Bot API
   */
  static async sendRawMessage(
    botToken: string,
    chatId: string,
    text: string,
    parseMode: 'HTML' | 'Markdown' = 'HTML'
  ): Promise<{ ok: boolean; description?: string; result?: any }> {
    if (!botToken || !chatId) {
      return { ok: false, description: 'Telegram Bot Token or Chat ID is missing' };
    }

    const cleanToken = botToken.trim();
    const cleanChatId = chatId.trim();

    const url = `https://api.telegram.org/bot${cleanToken}/sendMessage`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: cleanChatId,
        text,
        parse_mode: parseMode,
        disable_web_page_preview: true,
      }),
    });

    const data = await response.json();
    return data;
  }

  /**
   * Get Bot profile information from Telegram
   */
  static async getBotInfo(botToken: string): Promise<{ ok: boolean; result?: any; description?: string }> {
    const cleanToken = botToken.trim();
    const url = `https://api.telegram.org/bot${cleanToken}/getMe`;

    const response = await fetch(url, { method: 'GET' });
    return await response.json();
  }

  /**
   * Test connection with Telegram credentials
   */
  static async testConnection(customToken?: string, customChatId?: string): Promise<TelegramTestResult> {
    try {
      const token = customToken || (await SettingsService.get('telegram_bot_token')) || process.env.TELEGRAM_BOT_TOKEN || '';
      const chatId = customChatId || (await SettingsService.get('telegram_admin_chat_id')) || process.env.TELEGRAM_ADMIN_CHAT_ID || '';

      if (!token) {
        return {
          success: false,
          message: 'رمز البوت (Telegram Bot Token) غير مدخل. يرجى الحصول عليه من @BotFather.',
        };
      }

      if (!chatId) {
        return {
          success: false,
          message: 'معرف الدردشة (Chat ID) غير مدخل. يرجى إدخال معرف الشات الخاص بالإدارة.',
        };
      }

      // First check if token is valid via getMe
      const botInfo = await this.getBotInfo(token);
      if (!botInfo.ok) {
        return {
          success: false,
          message: `رمز البوت غير صالح: ${botInfo.description || 'فشل التحقق من Telegram API'}`,
        };
      }

      const botName = botInfo.result?.first_name || 'Nexora Bot';
      const botUsername = botInfo.result?.username ? `@${botInfo.result.username}` : '';

      // Send a test message
      const timeStr = new Date().toLocaleString('ar-EG', {
        timeZone: 'UTC',
        dateStyle: 'full',
        timeStyle: 'medium',
      });

      const testMsg = `
🤖 <b>اختبار اتصال بوت إشعارات المنصة (Nexora)</b> ✅
━━━━━━━━━━━━━━━━━━
👋 مرحباً بك! هذا إشعار تجريبي لتأكيد نجاح ربط نظام الإشعارات الفوري للإدارة.

🔹 <b>اسم البوت:</b> ${botName} (${botUsername})
🔹 <b>معرف الدردشة (Chat ID):</b> <code>${chatId}</code>
🕒 <b>وقت الاختبار:</b> ${timeStr} UTC
━━━━━━━━━━━━━━━━━━
🚀 <i>النظام جاهز الآن لاستقبال تنبيهات الإيداع، السحب، وترقيات VIP الفورية.</i>
      `.trim();

      const sendRes = await this.sendRawMessage(token, chatId, testMsg, 'HTML');

      if (!sendRes.ok) {
        return {
          success: false,
          botName,
          username: botUsername,
          message: `تم التحقق من البوت ولكن فشل إرسال الرسالة إلى Chat ID: ${sendRes.description || 'تأكد من بدء المحادثة مع البوت أولاً (/start)'}`,
        };
      }

      return {
        success: true,
        botName,
        username: botUsername,
        message: `تم الاتصال بنجاح بالبوت (${botName}) وإرسال رسالة الاختبار إلى الشات (${chatId})!`,
      };
    } catch (error: any) {
      return {
        success: false,
        message: `حدث خطأ أثناء فحص الاتصال: ${error.message || 'تعذر الوصول لخدمة Telegram API'}`,
      };
    }
  }

  /**
   * Send notification to Admin Telegram chat (safe, non-blocking)
   */
  static async sendAdminNotification(messageHtml: string): Promise<boolean> {
    try {
      const token = (await SettingsService.get('telegram_bot_token')) || process.env.TELEGRAM_BOT_TOKEN || '';
      const chatId = (await SettingsService.get('telegram_admin_chat_id')) || process.env.TELEGRAM_ADMIN_CHAT_ID || '';

      if (!token || !chatId) {
        // Telegram not configured yet, skip silently
        return false;
      }

      const res = await this.sendRawMessage(token, chatId, messageHtml, 'HTML');
      if (!res.ok) {
        console.warn('Telegram Notification Warning:', res.description);
        return false;
      }
      return true;
    } catch (error) {
      console.error('Error sending Telegram notification:', error);
      return false;
    }
  }

  /**
   * Trigger: New Deposit Request
   */
  static async notifyNewDeposit(data: {
    username: string;
    email?: string;
    amount: number;
    txid?: string;
    paymentMethod?: string;
    depositId: string;
  }): Promise<void> {
    try {
      const timeStr = new Date().toLocaleString('ar-EG', { timeZone: 'UTC' });
      const msg = `
🔔 <b>طلب إيداع جديد (New Deposit)</b> 💰
━━━━━━━━━━━━━━━━━━
👤 <b>المستخدم:</b> <code>${data.username}</code> ${data.email ? `(${data.email})` : ''}
💵 <b>المبلغ:</b> <b>$${Number(data.amount).toFixed(2)} USD</b>
🌐 <b>طريقة الدفع:</b> ${data.paymentMethod || 'USDT TRC20'}
🔗 <b>رقم المعاملة (TXID):</b>
<code>${data.txid || 'غير متوفر / تحويل يدوي'}</code>
🆔 <b>معرف الإيداع:</b> <code>${data.depositId}</code>
🕒 <b>الوقت:</b> ${timeStr} UTC
━━━━━━━━━━━━━━━━━━
⚡ <i>يرجى مراجعة المعاملة واعتمادها من لوحة التحكم للإدارة (/admin)</i>
      `.trim();

      // Fire asynchronously without blocking caller
      this.sendAdminNotification(msg).catch((err) => {
        console.error('Failed to dispatch deposit notification:', err);
      });
    } catch (e) {
      console.error('Error in notifyNewDeposit:', e);
    }
  }

  /**
   * Trigger: New Withdrawal Request
   */
  static async notifyNewWithdrawal(data: {
    username: string;
    email?: string;
    amount: number;
    address: string;
    paymentMethod?: string;
    withdrawalId: string;
  }): Promise<void> {
    try {
      const timeStr = new Date().toLocaleString('ar-EG', { timeZone: 'UTC' });
      const msg = `
🚨 <b>طلب سحب رصيد جديد (New Withdrawal)</b> 💸
━━━━━━━━━━━━━━━━━━
👤 <b>المستخدم:</b> <code>${data.username}</code> ${data.email ? `(${data.email})` : ''}
💵 <b>المبلغ المطلوب:</b> <b>$${Number(data.amount).toFixed(2)} USD</b>
💼 <b>عنوان المحفظة المستلمة:</b>
<code>${data.address}</code>
🌐 <b>الشبكة:</b> ${data.paymentMethod || 'USDT TRC20'}
🆔 <b>معرف السحب:</b> <code>${data.withdrawalId}</code>
🕒 <b>الوقت:</b> ${timeStr} UTC
━━━━━━━━━━━━━━━━━━
⚠️ <i>يرجى مراجعة الرصيد وإرسال التحويل واعتماد الطلب في لوحة الإدارة (/admin)</i>
      `.trim();

      this.sendAdminNotification(msg).catch((err) => {
        console.error('Failed to dispatch withdrawal notification:', err);
      });
    } catch (e) {
      console.error('Error in notifyNewWithdrawal:', e);
    }
  }

  /**
   * Trigger: VIP Tier Upgrade
   */
  static async notifyVipUpgrade(data: {
    username: string;
    email?: string;
    vipLevel: number;
    planName: string;
    price: number;
  }): Promise<void> {
    try {
      const timeStr = new Date().toLocaleString('ar-EG', { timeZone: 'UTC' });
      const msg = `
👑 <b>ترقية باقة VIP جديدة (VIP Upgrade)</b> 🌟
━━━━━━━━━━━━━━━━━━
👤 <b>المستخدم:</b> <code>${data.username}</code> ${data.email ? `(${data.email})` : ''}
🏆 <b>الباقة:</b> <b>${data.planName} (VIP ${data.vipLevel})</b>
💰 <b>المبلغ المدفوع:</b> <b>$${Number(data.price).toFixed(2)} USD</b>
🕒 <b>الوقت:</b> ${timeStr} UTC
━━━━━━━━━━━━━━━━━━
✨ <i>تم خصم المبلغ وترقية حساب المستخدم وتفعيل المهام والإعلانات تلقائياً.</i>
      `.trim();

      this.sendAdminNotification(msg).catch((err) => {
        console.error('Failed to dispatch VIP upgrade notification:', err);
      });
    } catch (e) {
      console.error('Error in notifyVipUpgrade:', e);
    }
  }
}
