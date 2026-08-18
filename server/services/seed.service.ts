import bcrypt from 'bcrypt';
import { db } from '../../src/db/index.ts';
import {
  users,
  wallets,
  vipPlans,
  tasks,
  ads,
  systemSettings,
  withdrawals,
  deposits,
  transactions,
  notifications,
  paymentMethods
} from '../../src/db/schema.ts';
import { eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

export async function runDatabaseSeed() {
  try {
    console.log('[Seed Service]: Checking database seed state...');

    // 1. Seed VIP Plans (Strictly ordered: 30, 50, 100, 300, 800 only)
    const targetPlans = [
      {
        level: 1,
        name: 'VIP 1 - المبتدئ',
        price: 30,
        durationDays: 30,
        dailyTasks: 5,
        dailyAds: 5,
        status: 'ACTIVE',
      },
      {
        level: 2,
        name: 'VIP 2 - المتقدم',
        price: 50,
        durationDays: 30,
        dailyTasks: 8,
        dailyAds: 7,
        status: 'ACTIVE',
      },
      {
        level: 3,
        name: 'VIP 3 - الفضي',
        price: 100,
        durationDays: 30,
        dailyTasks: 12,
        dailyAds: 10,
        status: 'ACTIVE',
      },
      {
        level: 4,
        name: 'VIP 4 - الذهبي',
        price: 300,
        durationDays: 30,
        dailyTasks: 20,
        dailyAds: 20,
        status: 'ACTIVE',
      },
      {
        level: 5,
        name: 'VIP 5 - البلاتيني',
        price: 800,
        durationDays: 30,
        dailyTasks: 35,
        dailyAds: 30,
        status: 'ACTIVE',
      },
    ];

    const existingVip = await db.select().from(vipPlans);
    const existingPrices = existingVip.map(p => Number(p.price)).sort((a, b) => a - b);
    const targetPrices = [30, 50, 100, 300, 800];
    const isMatching = existingVip.length === 5 && JSON.stringify(existingPrices) === JSON.stringify(targetPrices);

    if (!isMatching) {
      console.log('[Seed Service]: Resetting VIP Plans to exact 5 tiers (30, 50, 100, 300, 800)...');
      await db.delete(vipPlans);
      for (const p of targetPlans) {
        await db.insert(vipPlans).values({
          id: uuidv4(),
          ...p,
        });
      }
      console.log('[Seed Service]: VIP Plans synchronized successfully.');
    }

    // 2. Seed System Settings
    const defaultSettings = [
      { key: 'min_deposit', value: '5', description: 'الحد الأدنى للإيداع (USD)' },
      { key: 'min_withdrawal', value: '50', description: 'الحد الأدنى للسحب (USD)' },
      { key: 'withdrawal_fee_percent', value: '2', description: 'نسبة عمولة السحب (%)' },
      { key: 'usdt_trc20_address', value: 'TXk7UqP99s2LmW5eL89fGHkJqZaN48vQrP', description: 'عنوان محفظة الإيداع USDT TRC20' },
      { key: 'usdt_bep20_address', value: '0x71C...B29F4a1', description: 'عنوان محفظة الإيداع USDT BEP20' },
      { key: 'telegram_support_link', value: 'https://t.me/NexoraSupport', description: 'رابط الدعم الفني تيليجرام' },
      { key: 'whatsapp_support_link', value: '+1234567890', description: 'رقم دعم واتساب' },
      { key: 'platform_name', value: 'Nexora Financial Matrix', description: 'اسم المنصة' },
      { key: 'referral_bonus_percent', value: '10', description: 'نسبة أرباح الإحالة (%)' },
    ];

    for (const setting of defaultSettings) {
      const exists = (await db.select().from(systemSettings).where(eq(systemSettings.key, setting.key)))[0];
      if (!exists) {
        await db.insert(systemSettings).values({
          key: setting.key,
          value: setting.value,
          description: setting.description,
          updatedAt: new Date(),
        });
      }
    }

    // 2.5 Seed Payment Methods
    const defaultPaymentMethodsList = [
      {
        id: 'pm-usdt-trc20',
        name: 'USDT (TRC20)',
        type: 'BOTH',
        walletAddressOrAccount: 'TYDZSxdvcr7x557yU7wT34C7yM7yT6k7Wb',
        network: 'TRON / TRC20',
        qrCodeUrl: '',
        minLimit: 10,
        maxLimit: 50000,
        networkFee: 1,
        instructions: 'يرجى إرسال عملة USDT عبر شبكة Tron (TRC20) فقط. التحويل عبر شبكة خاطئة يؤدي لفقدان الأموال.',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'pm-usdt-bep20',
        name: 'USDT (BEP20 / BSC)',
        type: 'BOTH',
        walletAddressOrAccount: '0x71C8395B28b849202F23175B83B9272B29F4a1D8',
        network: 'BNB Smart Chain (BEP20)',
        qrCodeUrl: '',
        minLimit: 10,
        maxLimit: 25000,
        networkFee: 0.5,
        instructions: 'يرجى إرسال عملة USDT عبر شبكة BNB Smart Chain (BEP-20) مع التأكد من مطابقة العنوان بدقة.',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'pm-sham-cash',
        name: 'شام كاش (Sham Cash)',
        type: 'BOTH',
        walletAddressOrAccount: '963988123456',
        network: 'محفظة شام كاش الإلكترونية',
        qrCodeUrl: '',
        minLimit: 5,
        maxLimit: 10000,
        networkFee: 0,
        instructions: 'التحويل عبر تطبيق شام كاش إلى رقم الحساب المحدد. يرجى إرفاق رقم إشعار التحويل وصورة الإشعار.',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'pm-payeer',
        name: 'باير (Payeer USD)',
        type: 'BOTH',
        walletAddressOrAccount: 'P1098765432',
        network: 'Payeer Account (USD)',
        qrCodeUrl: '',
        minLimit: 5,
        maxLimit: 15000,
        networkFee: 0.5,
        instructions: 'التحويل المباشر من حساب Payeer الخاص بك إلى حساب المنصة P1098765432 وإدخال رقم العملية (Batch ID).',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'pm-vodafone-cash',
        name: 'فودافون كاش / إنستاباي (Vodafone Cash / InstaPay)',
        type: 'DEPOSIT',
        walletAddressOrAccount: '01012345678',
        network: 'محافظ إلكترونية / إنستاباي',
        qrCodeUrl: '',
        minLimit: 10,
        maxLimit: 5000,
        networkFee: 0,
        instructions: 'التحويل بالجنيه المصري بما يعادل قيمة الإيداع بالدولار بسعر الصرف اليومي. يرجى كتابة رقم العملية.',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    ];

    for (const pm of defaultPaymentMethodsList) {
      const exists = (await db.select().from(paymentMethods).where(eq(paymentMethods.id, pm.id)))[0];
      if (!exists) {
        await db.insert(paymentMethods).values(pm);
      }
    }

    // 3. Seed Tasks
    const existingTasks = await db.select().from(tasks);
    if (existingTasks.length === 0) {
      console.log('[Seed Service]: Seeding Tasks...');
      await db.insert(tasks).values([
        {
          id: uuidv4(),
          title: 'الانضمام إلى قناة التلغرام الرسمية وتفعيل التنبيهات',
          description: 'انضم إلى القناة الرسمية لمنصة Nexora لمتابعة إشعارات السحب والإيداع والتحديثات اليومية.',
          reward: 2.5,
          durationSeconds: 30,
          url: 'https://t.me/telegram',
          category: 'TELEGRAM',
          taskType: 'PROOF_REQUIRED',
          proofInstructions: 'قم بالانضمام للقناة ثم أرسل اسم المستخدم الخاص بك على تيليجرام (مثل: @username) مع لقطة شاشة توضح عضويتك في القناة.',
          requiredVipLevel: 0,
          status: 'ACTIVE',
        },
        {
          id: uuidv4(),
          title: 'تقييم المنصة الإيجابي على موقع Trustpilot',
          description: 'قم بكتابة تقييم ومراجعة 5 نجوم للمنصة على منصة التقييمات العالمية لدعم الموثوقية.',
          reward: 5.0,
          durationSeconds: 45,
          url: 'https://www.trustpilot.com',
          category: 'APP_REVIEW',
          taskType: 'PROOF_REQUIRED',
          proofInstructions: 'قم بوضع التقييم ثم التقط صورة للشاشة تظهر تقييمك المنشور مع كتابة اسم الحساب المستخدم في التقييم.',
          requiredVipLevel: 1,
          status: 'ACTIVE',
        },
        {
          id: uuidv4(),
          title: 'متابعة الحساب الرسمي على منصة X (تويتر) وإعادة التغريد',
          description: 'قم بمتابعة الحساب وإعادة تغريد أحدث منشور مثبت للمنصة.',
          reward: 7.5,
          durationSeconds: 40,
          url: 'https://twitter.com',
          category: 'SOCIAL',
          taskType: 'PROOF_REQUIRED',
          proofInstructions: 'أدخل رابط أو اسم حسابك على منصة X ولقطة شاشة تثبت المتابعة وإعادة التغريد.',
          requiredVipLevel: 1,
          status: 'ACTIVE',
        },
        {
          id: uuidv4(),
          title: 'التسجيل في منصة الشريك التجاري وتفعيل الحساب',
          description: 'قم بالتسجيل في منصة التداول الشريكة وتأكيد البريد الإلكتروني.',
          reward: 15.0,
          durationSeconds: 60,
          url: 'https://accounts.binance.com',
          category: 'REGISTRATION',
          taskType: 'PROOF_REQUIRED',
          proofInstructions: 'أدخل البريد الإلكتروني أو معرف الحساب (User ID) المستخدم في التسجيل مع لقطة شاشة للوحة التحكم.',
          requiredVipLevel: 2,
          status: 'ACTIVE',
        },
        {
          id: uuidv4(),
          title: 'الاشتراك في قناة يوتيوب وتفعيل جرس الإشعارات',
          description: 'اشترك في القناة التعليمية الرسمية وشاهد الفيديو التعريفي الأخير.',
          reward: 25.0,
          durationSeconds: 60,
          url: 'https://www.youtube.com',
          category: 'SOCIAL',
          taskType: 'PROOF_REQUIRED',
          proofInstructions: 'أرسل لقطة شاشة تظهر زر الاشتراك مفعلاً مع اسم حسابك على يوتيوب.',
          requiredVipLevel: 3,
          status: 'ACTIVE',
        },
      ]);
    }

    // 4. Seed Ads
    const existingAds = await db.select().from(ads);
    if (existingAds.length === 0) {
      console.log('[Seed Service]: Seeding Ads...');
      await db.insert(ads).values([
        {
          id: uuidv4(),
          title: 'فيديو ترويجي: مقدمة حول التداول الآلي والذكاء المالي',
          description: 'شاهد فيديو الإعلان الترويجي عبر YouTube لمدة 15 ثانية للحصول على المكافأة فوراً.',
          reward: 1.5,
          durationSeconds: 15,
          url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
          requiredVipLevel: 0,
          status: 'ACTIVE',
        },
        {
          id: uuidv4(),
          title: 'زيارة موقع الشريك الاستثماري العالمي (PTC Ad)',
          description: 'تصفح موقع الشريك المعتمد لمدة 15 ثانية واستلم مكافأة التصفح المباشرة.',
          reward: 3.5,
          durationSeconds: 15,
          url: 'https://www.google.com',
          requiredVipLevel: 1,
          status: 'ACTIVE',
        },
        {
          id: uuidv4(),
          title: 'فيديو توضيحي: استراتيجيات الأرباح اليومية وسحب الأرباح',
          description: 'شاهد الشرح التوضيحي السريع لكيفية تعظيم العوائد وسحب الأرباح.',
          reward: 8.0,
          durationSeconds: 20,
          url: 'https://www.youtube.com/watch?v=L_LUpnjgPso',
          requiredVipLevel: 2,
          status: 'ACTIVE',
        },
        {
          id: uuidv4(),
          title: 'زيارة منصة التداول اللامركزي Web3 للشركاء',
          description: 'تصفح بروتوكول التداول اللامركزي الخاص بالمستثمرين واستلم المكافأة.',
          reward: 20.0,
          durationSeconds: 25,
          url: 'https://coinmarketcap.com',
          requiredVipLevel: 3,
          status: 'ACTIVE',
        },
      ]);
    }

    // 5. Seed Admin User (admin@nexora.com / Admin@123456)
    const adminEmail = 'admin@nexora.com';
    const existingAdmin = (await db.select().from(users).where(eq(users.email, adminEmail)))[0];

    const adminHash = await bcrypt.hash('Admin@123456', 12);
    const pinHash = await bcrypt.hash('123456', 10);
    let adminId = existingAdmin?.id || uuidv4();

    if (!existingAdmin) {
      console.log('[Seed Service]: Creating Admin Account (admin@nexora.com)...');
      await db.insert(users).values({
        id: adminId,
        username: 'admin',
        email: adminEmail,
        phone: '05365487200',
        displayName: 'المشرف العام (Nexora Admin)',
        passwordHash: adminHash,
        transactionPin: pinHash,
        role: 'ADMIN',
        status: 'ACTIVE',
        vipLevel: 3, // VIP 3
      });

      // Wallet with requested exact balances:
      // Available: 1450, Pending: 200, Total Earnings: 5850, Total Withdrawals: 4200, Total Deposits: 1500
      await db.insert(wallets).values({
        userId: adminId,
        availableBalance: 1450.0,
        pendingBalance: 200.0,
        totalEarnings: 5850.0,
        totalWithdrawals: 4200.0,
        totalDeposits: 1500.0,
      });

      // Seed Withdrawal history: $1,200, $1,500, $1,500 (completed) + $200 (pending)
      await db.insert(withdrawals).values([
        {
          id: uuidv4(),
          userId: adminId,
          amount: 1200.0,
          status: 'COMPLETED',
          paymentMethod: 'USDT TRC20',
          reference: 'TH5wK8bJn7V3aP4qX91eLm2Zs9fGhJkL01',
          adminAction: 'تمت المعالجة بنجاح عبر شبكة TRON TRC20 - TXID: 9a7b3c2d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b',
          createdAt: new Date(Date.now() - 14 * 24 * 3600 * 1000),
          updatedAt: new Date(Date.now() - 14 * 24 * 3600 * 1000),
        },
        {
          id: uuidv4(),
          userId: adminId,
          amount: 1500.0,
          status: 'COMPLETED',
          paymentMethod: 'USDT TRC20',
          reference: 'TP9xL1mQ4vN7yZ8sR2kH3eF6bW5tG9jK22',
          adminAction: 'تم التحويل الفوري بنجاح - TXID: 4f5e6d7c8b9a0f1e2d3c4b5a6f7e8d9c0b1a2f3e4d5c6b7a8f9e0d1c2b3a4f5e',
          createdAt: new Date(Date.now() - 7 * 24 * 3600 * 1000),
          updatedAt: new Date(Date.now() - 7 * 24 * 3600 * 1000),
        },
        {
          id: uuidv4(),
          userId: adminId,
          amount: 1500.0,
          status: 'COMPLETED',
          paymentMethod: 'USDT TRC20',
          reference: 'TX8kR2mN5vP9yZ3sQ1hL4eF7bW6tG0jM33',
          adminAction: 'تم الدفع والتحقق من البلوكتشين - TXID: 1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b',
          createdAt: new Date(Date.now() - 2 * 24 * 3600 * 1000),
          updatedAt: new Date(Date.now() - 2 * 24 * 3600 * 1000),
        },
        {
          id: uuidv4(),
          userId: adminId,
          amount: 200.0,
          status: 'PENDING',
          paymentMethod: 'USDT TRC20',
          reference: 'TL5vM9nQ2xP7yZ8sR1kH4eF6bW3tG8jK44',
          adminAction: 'طلب السحب قيد المراجعة والتحقق الأمني من الإدارة المالية',
          createdAt: new Date(Date.now() - 3 * 3600 * 1000),
          updatedAt: new Date(Date.now() - 3 * 3600 * 1000),
        }
      ]);

      // Seed Deposit history: $1,000, $500
      await db.insert(deposits).values([
        {
          id: uuidv4(),
          userId: adminId,
          amount: 1000.0,
          status: 'COMPLETED',
          paymentMethod: 'USDT TRC20',
          reference: 'TXID: 88f7e6d5c4b3a2f1e0d9c8b7a6f5e4d3c2b1a0f9e8d7c6b5a4f3e2d1c0b9a8f7',
          adminAction: 'تم التحقق من تأكيدات شبكة TRON وقبول الإيداع تلقائياً',
          createdAt: new Date(Date.now() - 20 * 24 * 3600 * 1000),
          updatedAt: new Date(Date.now() - 20 * 24 * 3600 * 1000),
        },
        {
          id: uuidv4(),
          userId: adminId,
          amount: 500.0,
          status: 'COMPLETED',
          paymentMethod: 'USDT TRC20',
          reference: 'TXID: 33a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b7c6d5e4f3a2',
          adminAction: 'تم شحن رصيد المحفظة بنجاح',
          createdAt: new Date(Date.now() - 10 * 24 * 3600 * 1000),
          updatedAt: new Date(Date.now() - 10 * 24 * 3600 * 1000),
        }
      ]);

      // Seed Transactions ledger
      await db.insert(transactions).values([
        {
          id: uuidv4(),
          userId: adminId,
          type: 'DEPOSIT',
          amount: 1000.0,
          currency: 'USD',
          status: 'COMPLETED',
          description: 'إيداع رصيد أولي عبر USDT (TRC20)',
          balanceBefore: 0.0,
          balanceAfter: 1000.0,
          createdAt: new Date(Date.now() - 20 * 24 * 3600 * 1000),
          processedAt: new Date(Date.now() - 20 * 24 * 3600 * 1000),
        },
        {
          id: uuidv4(),
          userId: adminId,
          type: 'TASK_REWARD',
          amount: 850.0,
          currency: 'USD',
          status: 'COMPLETED',
          description: 'عائد إنجاز مهام التداول الذكي وتفاعل الإعلانات VIP 3',
          balanceBefore: 1000.0,
          balanceAfter: 1850.0,
          createdAt: new Date(Date.now() - 16 * 24 * 3600 * 1000),
          processedAt: new Date(Date.now() - 16 * 24 * 3600 * 1000),
        },
        {
          id: uuidv4(),
          userId: adminId,
          type: 'WITHDRAWAL',
          amount: 1200.0,
          currency: 'USD',
          status: 'COMPLETED',
          description: 'سحب أرباح إلى محفظة USDT TRC20 الخارجية',
          balanceBefore: 1850.0,
          balanceAfter: 650.0,
          createdAt: new Date(Date.now() - 14 * 24 * 3600 * 1000),
          processedAt: new Date(Date.now() - 14 * 24 * 3600 * 1000),
        },
        {
          id: uuidv4(),
          userId: adminId,
          type: 'DEPOSIT',
          amount: 500.0,
          currency: 'USD',
          status: 'COMPLETED',
          description: 'إيداع إضافي لترقية عوائد التداول',
          balanceBefore: 650.0,
          balanceAfter: 1150.0,
          createdAt: new Date(Date.now() - 10 * 24 * 3600 * 1000),
          processedAt: new Date(Date.now() - 10 * 24 * 3600 * 1000),
        },
        {
          id: uuidv4(),
          userId: adminId,
          type: 'TASK_REWARD',
          amount: 2500.0,
          currency: 'USD',
          status: 'COMPLETED',
          description: 'مكافآت استثمار أسبوعية وأرباح شركاء النخبة VIP 3',
          balanceBefore: 1150.0,
          balanceAfter: 3650.0,
          createdAt: new Date(Date.now() - 8 * 24 * 3600 * 1000),
          processedAt: new Date(Date.now() - 8 * 24 * 3600 * 1000),
        },
        {
          id: uuidv4(),
          userId: adminId,
          type: 'WITHDRAWAL',
          amount: 1500.0,
          currency: 'USD',
          status: 'COMPLETED',
          description: 'سحب أرباح نصف شهرية معتمد عبر البلوكتشين',
          balanceBefore: 3650.0,
          balanceAfter: 2150.0,
          createdAt: new Date(Date.now() - 7 * 24 * 3600 * 1000),
          processedAt: new Date(Date.now() - 7 * 24 * 3600 * 1000),
        },
        {
          id: uuidv4(),
          userId: adminId,
          type: 'TASK_REWARD',
          amount: 2500.0,
          currency: 'USD',
          status: 'COMPLETED',
          description: 'عوائد مهام تقارير الذكاء الاصطناعي والاستبيانات المؤسسية',
          balanceBefore: 2150.0,
          balanceAfter: 4650.0,
          createdAt: new Date(Date.now() - 3 * 24 * 3600 * 1000),
          processedAt: new Date(Date.now() - 3 * 24 * 3600 * 1000),
        },
        {
          id: uuidv4(),
          userId: adminId,
          type: 'WITHDRAWAL',
          amount: 1500.0,
          currency: 'USD',
          status: 'COMPLETED',
          description: 'سحب أرباح دوري مكتمل ومؤكد',
          balanceBefore: 4650.0,
          balanceAfter: 3150.0,
          createdAt: new Date(Date.now() - 2 * 24 * 3600 * 1000),
          processedAt: new Date(Date.now() - 2 * 24 * 3600 * 1000),
        },
        {
          id: uuidv4(),
          userId: adminId,
          type: 'WITHDRAWAL',
          amount: 200.0,
          currency: 'USD',
          status: 'PENDING',
          description: 'طلب سحب قيد المعالجة الإدارية',
          balanceBefore: 1650.0,
          balanceAfter: 1450.0,
          createdAt: new Date(Date.now() - 3 * 3600 * 1000),
        }
      ]);

      // Seed Notifications
      await db.insert(notifications).values([
        {
          id: uuidv4(),
          userId: adminId,
          title: 'مرحباً بك في لوحة الإشراف العام',
          message: 'تم تفعيل حساب المشرف العام بنجاح بجميع الصلاحيات الإدارية والمالية.',
          type: 'SUCCESS',
          read: false,
          createdAt: new Date(),
        },
        {
          id: uuidv4(),
          userId: adminId,
          title: 'تم اعتماد خطة VIP 3 الذهبية',
          message: 'تم تفعيل أعلى عوائد المهام اليومية والإعلانات الحصرية على حسابك.',
          type: 'INFO',
          read: true,
          createdAt: new Date(Date.now() - 24 * 3600 * 1000),
        }
      ]);
    } else {
      // Update password hash & role & vip level to ensure login always works
      await db.update(users).set({
        passwordHash: adminHash,
        role: 'ADMIN',
        status: 'ACTIVE',
        vipLevel: 3,
        displayName: 'المشرف العام (Nexora Admin)',
        transactionPin: pinHash,
      }).where(eq(users.id, existingAdmin.id));

      const adminWallet = (await db.select().from(wallets).where(eq(wallets.userId, existingAdmin.id)))[0];
      if (!adminWallet) {
        await db.insert(wallets).values({
          userId: existingAdmin.id,
          availableBalance: 1450.0,
          pendingBalance: 200.0,
          totalEarnings: 5850.0,
          totalWithdrawals: 4200.0,
          totalDeposits: 1500.0,
        });
      } else {
        await db.update(wallets).set({
          availableBalance: 1450.0,
          pendingBalance: 200.0,
          totalEarnings: 5850.0,
          totalWithdrawals: 4200.0,
          totalDeposits: 1500.0,
        }).where(eq(wallets.userId, existingAdmin.id));
      }
    }

    console.log('[Seed Service]: Database seeded successfully!');
  } catch (error) {
    console.error('[Seed Service Error]:', error);
  }
}
