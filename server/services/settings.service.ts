import { db } from '../../src/db/index.ts';
import { systemSettings } from '../../src/db/schema.ts';
import { eq } from 'drizzle-orm';

export interface SystemSettingsMap {
  usdt_address: string;
  min_withdrawal: string;
  min_deposit: string;
  network_name: string;
  qr_code_url?: string;
  platform_name?: string;
  announcement?: string;
}

const DEFAULT_SETTINGS: Record<string, { value: string; description: string }> = {
  usdt_address: {
    value: 'TYDZSxdvcr7x557yU7wT34C7yM7yT6k7Wb',
    description: 'عنوان محفظة USDT (TRC20) الرسمية للمنصة لاستلام الإيداعات',
  },
  min_withdrawal: {
    value: '50.00',
    description: 'الحد الأدنى لمبلغ السحب بالدولار',
  },
  min_deposit: {
    value: '5.00',
    description: 'الحد الأدنى لمبلغ الإيداع بالدولار',
  },
  network_name: {
    value: 'TRON / TRC20',
    description: 'اسم شبكة التحويل المعتمدة',
  },
  qr_code_url: {
    value: '',
    description: 'رابط صورة رمز الاستجابة السريعة (QR Code) للمحفظة',
  },
  announcement: {
    value: 'مرحباً بكم في منصة Nexora. الدفع والسحب متاحان على مدار الساعة.',
    description: 'شريط الإعلانات العام في واجهة المستخدم',
  },
  telegram_bot_token: {
    value: '',
    description: 'رمز البوت (Telegram Bot Token) الخاص بإرسال إشعارات الإدارة',
  },
  telegram_admin_chat_id: {
    value: '',
    description: 'معرف الدردشة أو القناة للإدارة (Admin Chat ID) لاستلام الإشعارات الفورية',
  },
};

let cachedSettings: Record<string, string> = {};
let isInitialized = false;

export class SettingsService {
  private static async ensureTableAndDefaults() {
    try {
      // Auto-create table if not exists
      await (db as any).$client?.query?.(`
        CREATE TABLE IF NOT EXISTS system_settings (
          key text PRIMARY KEY,
          value text NOT NULL,
          description text,
          updated_at timestamp DEFAULT now() NOT NULL
        );
      `).catch(() => {});
    } catch (e) {
      // ignore
    }

    try {
      const existing = await db.select().from(systemSettings);
      const map: Record<string, string> = {};
      for (const row of existing) {
        map[row.key] = row.value;
      }

      // Insert missing defaults
      for (const [key, item] of Object.entries(DEFAULT_SETTINGS)) {
        if (!map[key]) {
          try {
            await db.insert(systemSettings).values({
              key,
              value: item.value,
              description: item.description,
              updatedAt: new Date(),
            }).onConflictDoNothing();
            map[key] = item.value;
          } catch (err) {
            map[key] = item.value;
          }
        }
      }

      cachedSettings = map;
      isInitialized = true;
    } catch (err) {
      // Fallback to defaults in case of any DB issue
      for (const [key, item] of Object.entries(DEFAULT_SETTINGS)) {
        if (!cachedSettings[key]) {
          cachedSettings[key] = item.value;
        }
      }
      isInitialized = true;
    }
  }

  static async getAll(): Promise<Record<string, string>> {
    if (!isInitialized) {
      await this.ensureTableAndDefaults();
    }
    try {
      const rows = await db.select().from(systemSettings);
      const res: Record<string, string> = {};
      for (const row of rows) {
        res[row.key] = row.value;
      }
      for (const [k, v] of Object.entries(DEFAULT_SETTINGS)) {
        if (!res[k]) res[k] = v.value;
      }
      cachedSettings = res;
      return res;
    } catch (e) {
      return { ...cachedSettings };
    }
  }

  static async get(key: string, defaultValue = ''): Promise<string> {
    const all = await this.getAll();
    return all[key] || defaultValue || (DEFAULT_SETTINGS[key]?.value ?? '');
  }

  static async updateAll(updates: Record<string, string>, adminId?: string): Promise<Record<string, string>> {
    await this.ensureTableAndDefaults();

    for (const [key, val] of Object.entries(updates)) {
      if (typeof val === 'string' || typeof val === 'number') {
        const strVal = String(val).trim();
        cachedSettings[key] = strVal;

        try {
          const existing = (await db.select().from(systemSettings).where(eq(systemSettings.key, key)))[0];
          if (existing) {
            await db.update(systemSettings).set({
              value: strVal,
              updatedAt: new Date(),
            }).where(eq(systemSettings.key, key));
          } else {
            await db.insert(systemSettings).values({
              key,
              value: strVal,
              description: DEFAULT_SETTINGS[key]?.description || '',
              updatedAt: new Date(),
            });
          }
        } catch (err) {
          console.error(`Error updating setting ${key}:`, err);
        }
      }
    }

    return await this.getAll();
  }
}
