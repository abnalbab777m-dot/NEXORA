import nodemailer from 'nodemailer';
import { SettingsService } from './settings.service.ts';

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface RequestStatusNotificationParams {
  userEmail: string;
  userName?: string;
  requestType: 'DEPOSIT' | 'WITHDRAWAL' | 'TASK' | 'VIP';
  status: 'APPROVED' | 'REJECTED';
  amount?: number | string;
  reference?: string;
  reason?: string;
  txHash?: string;
  date?: Date;
}

export class EmailService {
  private static transporter: nodemailer.Transporter | null = null;
  private static lastConfigHash: string = '';

  /**
   * Lazily initializes and caches the nodemailer transporter using settings from DB or env.
   */
  private static async getTransporter(): Promise<nodemailer.Transporter | null> {
    try {
      const settings = await SettingsService.getAll();

      const host = settings.smtp_host || process.env.SMTP_HOST || '';
      const portStr = settings.smtp_port || process.env.SMTP_PORT || '587';
      const port = parseInt(portStr, 10) || 587;
      const user = settings.smtp_user || process.env.SMTP_USER || '';
      const pass = settings.smtp_pass || process.env.SMTP_PASS || '';
      const secureSetting = settings.smtp_secure || process.env.SMTP_SECURE || 'false';
      const secure = secureSetting === 'true' || port === 465;

      const currentHash = `${host}:${port}:${user}:${pass}:${secure}`;

      if (this.transporter && this.lastConfigHash === currentHash) {
        return this.transporter;
      }

      if (!host || !user) {
        // SMTP not fully configured
        return null;
      }

      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure,
        auth: {
          user,
          pass,
        },
        tls: {
          rejectUnauthorized: false, // Prevents self-signed cert blocks in test environments
        },
      });

      this.lastConfigHash = currentHash;
      return this.transporter;
    } catch (err) {
      console.warn('[EmailService] Error initializing transporter:', err);
      return null;
    }
  }

  /**
   * Gets sender from address
   */
  private static async getSenderAddress(): Promise<string> {
    const settings = await SettingsService.getAll();
    return settings.smtp_from || process.env.SMTP_FROM || '"Nexora Platform" <notifications@nexora.com>';
  }

  /**
   * Send a general email
   */
  static async sendEmail(options: EmailOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      if (!options.to || !options.to.includes('@')) {
        return { success: false, error: 'عنوان البريد الإلكتروني غير صالح' };
      }

      const transporter = await this.getTransporter();
      const from = await this.getSenderAddress();

      if (!transporter) {
        console.info(`[EmailService - SIMULATED LOG] To: ${options.to} | Subject: ${options.subject} | Note: Configure SMTP in Admin Settings or .env to send real external emails.`);
        return { success: true, messageId: 'simulated-' + Date.now() };
      }

      const info = await transporter.sendMail({
        from,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text || options.html.replace(/<[^>]*>?/gm, ''),
      });

      return { success: true, messageId: info.messageId };
    } catch (error: any) {
      console.error('[EmailService] Failed to send email:', error);
      return { success: false, error: error.message || 'فشل إرسال البريد الإلكتروني' };
    }
  }

  /**
   * Test SMTP connection
   */
  static async testConnection(customConfig?: {
    host?: string;
    port?: number;
    user?: string;
    pass?: string;
    secure?: boolean;
    toEmail?: string;
  }): Promise<{ success: boolean; message: string }> {
    try {
      let transport: nodemailer.Transporter;

      if (customConfig && customConfig.host && customConfig.user) {
        transport = nodemailer.createTransport({
          host: customConfig.host,
          port: customConfig.port || 587,
          secure: customConfig.secure ?? (customConfig.port === 465),
          auth: {
            user: customConfig.user,
            pass: customConfig.pass || '',
          },
          tls: { rejectUnauthorized: false },
        });
      } else {
        const defaultTransporter = await this.getTransporter();
        if (!defaultTransporter) {
          return {
            success: false,
            message: 'بيانات SMTP غير مكتملة. يرجى إدخال اسم الخادم (Host) واسم المستخدم (User) وكلمة المرور.',
          };
        }
        transport = defaultTransporter;
      }

      await transport.verify();

      if (customConfig?.toEmail) {
        const from = await this.getSenderAddress();
        await transport.sendMail({
          from,
          to: customConfig.toEmail,
          subject: 'اختبار الاتصال بخدمة البريد - منصة Nexora ✅',
          html: `
            <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #333; border-radius: 12px; background-color: #121212; color: #ffffff;">
              <h2 style="color: #f59e0b; margin-top: 0;">منصة Nexora | اختبار خادم البريد</h2>
              <p style="font-size: 16px; line-height: 1.6; color: #e5e7eb;">
                تهانينا! خادم البريد الإلكتروني (SMTP) يعمل بنجاح وبشكل متكامل مع منصة Nexora لإرسال إشعارات تغيير حالة الطلبات والمعاملات المالية للمستخدمين.
              </p>
              <div style="background-color: #1e1e1e; padding: 12px 16px; border-radius: 8px; font-size: 13px; color: #9ca3af; margin-top: 15px;">
                وقت التجربة: ${new Date().toLocaleString('ar-EG')}
              </div>
            </div>
          `,
        });
      }

      return {
        success: true,
        message: 'تم التحقق من إعدادات خادم البريد (SMTP) بنجاح وإرسال رسالة الاختبار!',
      };
    } catch (err: any) {
      return {
        success: false,
        message: `فشل الاتصال بخادم البريد: ${err.message || 'خطأ في الاتصال بالسيرفر'}`,
      };
    }
  }

  /**
   * Helper to build styled HTML template for request status updates
   */
  static generateStatusEmailHtml(params: RequestStatusNotificationParams): { subject: string; html: string } {
    const isApproved = params.status === 'APPROVED';
    const accentColor = isApproved ? '#10b981' : '#ef4444';
    const statusBg = isApproved ? '#064e3b' : '#7f1d1d';
    const statusText = isApproved ? 'تمت الموافقة والقبول بنجاح ✅' : 'تم الرفض ❌';

    let requestLabel = '';
    let subject = '';
    let detailsHtml = '';

    const formattedAmount = params.amount !== undefined ? `${Number(params.amount).toFixed(2)}$` : '';

    switch (params.requestType) {
      case 'DEPOSIT':
        requestLabel = 'طلب إيداع مالي';
        subject = isApproved
          ? `تم قبول طلب إيداعك بنجاح (${formattedAmount}) - Nexora ✅`
          : `تحديث بخصوص طلب الإيداع (${formattedAmount}) - Nexora ❌`;
        detailsHtml = `
          <tr style="border-bottom: 1px solid #262626;">
            <td style="padding: 10px; color: #9ca3af; font-size: 14px;">المبلغ المودع:</td>
            <td style="padding: 10px; font-weight: bold; color: #ffffff; font-size: 15px;">${formattedAmount}</td>
          </tr>
          ${params.reference ? `
          <tr style="border-bottom: 1px solid #262626;">
            <td style="padding: 10px; color: #9ca3af; font-size: 14px;">رقم المعاملة (TXID):</td>
            <td style="padding: 10px; font-family: monospace; color: #d1d5db; font-size: 13px; word-break: break-all;">${params.reference}</td>
          </tr>` : ''}
          ${isApproved ? `
          <tr>
            <td style="padding: 10px; color: #9ca3af; font-size: 14px;">حالة الرصيد:</td>
            <td style="padding: 10px; color: #10b981; font-weight: bold; font-size: 14px;">تمت إضافة المبلغ إلى رصيدك المتاح فوراً ويمكنك استخدامه أو ترقية باقتك.</td>
          </tr>` : `
          <tr>
            <td style="padding: 10px; color: #9ca3af; font-size: 14px;">سبب الرفض:</td>
            <td style="padding: 10px; color: #f87171; font-size: 14px;">${params.reason || 'بيانات المعاملة غير مطابقة أو لم يتم العثور على تأكيد التحويل على شبكة البلوكتشين.'}</td>
          </tr>`}
        `;
        break;

      case 'WITHDRAWAL':
        requestLabel = 'طلب سحب أرباح';
        subject = isApproved
          ? `تم تحويل طلب السحب بنجاح (${formattedAmount}) - Nexora 💸`
          : `إشعار بخصوص طلب السحب واستعادة الرصيد (${formattedAmount}) - Nexora ⚠️`;
        detailsHtml = `
          <tr style="border-bottom: 1px solid #262626;">
            <td style="padding: 10px; color: #9ca3af; font-size: 14px;">مبلغ السحب:</td>
            <td style="padding: 10px; font-weight: bold; color: #ffffff; font-size: 15px;">${formattedAmount}</td>
          </tr>
          ${params.reference ? `
          <tr style="border-bottom: 1px solid #262626;">
            <td style="padding: 10px; color: #9ca3af; font-size: 14px;">عنوان محفظة الاستلام:</td>
            <td style="padding: 10px; font-family: monospace; color: #d1d5db; font-size: 13px; word-break: break-all;">${params.reference}</td>
          </tr>` : ''}
          ${params.txHash ? `
          <tr style="border-bottom: 1px solid #262626;">
            <td style="padding: 10px; color: #9ca3af; font-size: 14px;">معرّف التحويل (Hash):</td>
            <td style="padding: 10px; font-family: monospace; color: #60a5fa; font-size: 13px; word-break: break-all;">${params.txHash}</td>
          </tr>` : ''}
          ${isApproved ? `
          <tr>
            <td style="padding: 10px; color: #9ca3af; font-size: 14px;">النتيجة:</td>
            <td style="padding: 10px; color: #10b981; font-weight: bold; font-size: 14px;">تم إرسال العملات إلى عنوان محفظتك بنجاح.</td>
          </tr>` : `
          <tr>
            <td style="padding: 10px; color: #9ca3af; font-size: 14px;">النتيجة وسبب الرفض:</td>
            <td style="padding: 10px; color: #f87171; font-size: 14px;">
              تم استرجاع مبلغ ${formattedAmount} بالكامل إلى رصيدك المتاح.<br/>
              السبب: ${params.reason || 'عنوان المحفظة غير صالح أو شبكة التحويل غير متطابقة.'}
            </td>
          </tr>`}
        `;
        break;

      case 'TASK':
        requestLabel = 'إثبات المهمة اليومية';
        subject = isApproved
          ? `تم قبول إثبات المهمة وإيداع المكافأة - Nexora 🎯`
          : `تحديث بخصوص إثبات المهمة - Nexora ⚠️`;
        detailsHtml = `
          ${params.amount ? `
          <tr style="border-bottom: 1px solid #262626;">
            <td style="padding: 10px; color: #9ca3af; font-size: 14px;">مكافأة المهمة:</td>
            <td style="padding: 10px; font-weight: bold; color: #10b981; font-size: 15px;">+${formattedAmount}</td>
          </tr>` : ''}
          ${isApproved ? `
          <tr>
            <td style="padding: 10px; color: #9ca3af; font-size: 14px;">النتيجة:</td>
            <td style="padding: 10px; color: #10b981; font-weight: bold; font-size: 14px;">تمت مراجعة الإثبات وتأكيده بنجاح وإضافة الأرباح لمحفظتك.</td>
          </tr>` : `
          <tr>
            <td style="padding: 10px; color: #9ca3af; font-size: 14px;">السبب:</td>
            <td style="padding: 10px; color: #f87171; font-size: 14px;">${params.reason || 'صورة الإثبات غير واضحة أو اسم الحساب غير متطابق مع شروط المهمة.'}</td>
          </tr>`}
        `;
        break;

      case 'VIP':
        requestLabel = 'ترقية باقة VIP';
        subject = `تهانينا! تم تفعيل باقة VIP بنجاح - Nexora 🎉`;
        detailsHtml = `
          <tr>
            <td style="padding: 10px; color: #9ca3af; font-size: 14px;">تفاصيل الترقية:</td>
            <td style="padding: 10px; color: #fbbf24; font-weight: bold; font-size: 14px;">تمت ترقية حسابك وتفعيل المهام اليومية للباقة بنجاح.</td>
          </tr>
        `;
        break;
    }

    const html = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${subject}</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #0a0a0a; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #f3f4f6;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a0a0a; padding: 30px 10px;">
          <tr>
            <td align="center">
              <table width="100%" max-width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #141414; border: 1px solid #262626; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
                
                <!-- Header -->
                <tr>
                  <td style="padding: 24px 30px; background: linear-gradient(135deg, #1f1f1f 0%, #171717 100%); border-bottom: 1px solid #262626;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td align="right">
                          <h1 style="margin: 0; font-size: 22px; font-weight: 800; color: #f59e0b; letter-spacing: 0.5px;">Nexora</h1>
                          <p style="margin: 4px 0 0 0; font-size: 12px; color: #9ca3af;">منصة الاستثمار والمهام الذكية</p>
                        </td>
                        <td align="left">
                          <span style="background-color: #262626; color: #fbbf24; padding: 6px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; border: 1px solid #404040;">
                            ${requestLabel}
                          </span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Status Banner -->
                <tr>
                  <td style="padding: 24px 30px 10px 30px;">
                    <div style="background-color: ${statusBg}; border: 1px solid ${accentColor}; border-radius: 12px; padding: 16px 20px; text-align: center;">
                      <h2 style="margin: 0; font-size: 18px; font-weight: bold; color: #ffffff;">${statusText}</h2>
                    </div>
                  </td>
                </tr>

                <!-- Content Greeting & Info -->
                <tr>
                  <td style="padding: 15px 30px;">
                    <p style="margin: 0 0 16px 0; font-size: 15px; line-height: 1.6; color: #e5e7eb;">
                      مرحباً <strong>${params.userName || 'عزيزنا العميل'}</strong>،<br/>
                      نود إعلامك بأنه تم تحديث حالة طلبك من قِبل إدارة منصة <strong>Nexora</strong>:
                    </p>

                    <!-- Details Table -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #1a1a1a; border-radius: 10px; border: 1px solid #2d2d2d; margin-bottom: 20px;">
                      ${detailsHtml}
                      <tr>
                        <td style="padding: 10px; color: #9ca3af; font-size: 14px;">تاريخ ووقت المعالجة:</td>
                        <td style="padding: 10px; color: #9ca3af; font-size: 13px;">${(params.date || new Date()).toLocaleString('ar-EG')}</td>
                      </tr>
                    </table>

                    <!-- Call To Action Button -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin: 25px 0 10px 0;">
                      <tr>
                        <td align="center">
                          <a href="https://ais-dev-neps2qv4uvnbvcotx6qhf3-147671540010.europe-west2.run.app/dashboard/wallet" style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: #000000; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-weight: bold; font-size: 14px; display: inline-block; box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);">
                            فتح لوحة التحكم والمحفظة
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="padding: 20px 30px; background-color: #0f0f0f; border-top: 1px solid #262626; text-align: center;">
                    <p style="margin: 0 0 6px 0; font-size: 12px; color: #6b7280;">
                      هذه الرسالة تم إرسالها تلقائياً من نظام الإشعارات لمنصة Nexora.
                    </p>
                    <p style="margin: 0; font-size: 11px; color: #525252;">
                      إذا كان لديك أي استفسار، يرجى التواصل مع فريق الدعم الفني عبر تليجرام أو الدعم المباشر.
                    </p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    return { subject, html };
  }

  /**
   * Helper function to send status notification email asynchronously
   */
  static async sendStatusUpdateEmail(params: RequestStatusNotificationParams): Promise<void> {
    try {
      if (!params.userEmail || !params.userEmail.includes('@')) {
        return;
      }

      const { subject, html } = this.generateStatusEmailHtml(params);

      await this.sendEmail({
        to: params.userEmail,
        subject,
        html,
      });
    } catch (err) {
      console.error('[EmailService] sendStatusUpdateEmail failed:', err);
    }
  }
}
