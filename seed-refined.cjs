const { Client } = require("pg");
const { v4: uuidv4 } = require("uuid");
require("dotenv").config();

async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  await client.query("DELETE FROM ad_completions");
  await client.query("DELETE FROM task_completions");
  await client.query("DELETE FROM ads");
  await client.query("DELETE FROM tasks");

  const sampleAds = [
    { id: uuidv4(), title: "مشاهدة إعلان ترويجي لتطبيق التداول الذكي", reward: 0.50, duration_seconds: 5, required_vip_level: 0, status: "ACTIVE" },
    { id: uuidv4(), title: "عرض إعلان منصة التجارة الإلكترونية العالمية", reward: 1.00, duration_seconds: 5, required_vip_level: 1, status: "ACTIVE" },
    { id: uuidv4(), title: "إعلان فيديو حصري لأحدث الهواتف الذكية", reward: 1.80, duration_seconds: 5, required_vip_level: 1, status: "ACTIVE" },
    { id: uuidv4(), title: "إعلان فيديو تفاعلي لخدمات الحوسبة السحابية VIP", reward: 3.50, duration_seconds: 5, required_vip_level: 2, status: "ACTIVE" },
    { id: uuidv4(), title: "إعلان باقة الاستثمار المميزة والنخبة", reward: 8.00, duration_seconds: 5, required_vip_level: 3, status: "ACTIVE" },
    { id: uuidv4(), title: "إعلان الشركاء الذهبيين لكبار المستثمرين VIP 4", reward: 15.00, duration_seconds: 5, required_vip_level: 4, status: "ACTIVE" },
  ];

  for (const a of sampleAds) {
    await client.query(
      "INSERT INTO ads (id, title, reward, duration_seconds, required_vip_level, status) VALUES ($1, $2, $3, $4, $5, $6)",
      [a.id, a.title, a.reward, a.duration_seconds, a.required_vip_level, a.status]
    );
  }

  const sampleTasks = [
    { id: uuidv4(), title: "متابعة قناة التلغرام الرسمية وتفعيل الإشعارات", description: "قم بالاشتراك في القناة الرسمية للمنصة للحصول على أخبار وتحديثات الأرباح اليومية.", reward: 1.00, required_vip_level: 0, status: "ACTIVE" },
    { id: uuidv4(), title: "تقييم المنصة بـ 5 نجوم على متجر التطبيقات", description: "أضف تقييماً إيجابياً واكتب رأيك بتجربة سحب الأرباح السريعة.", reward: 2.50, required_vip_level: 1, status: "ACTIVE" },
    { id: uuidv4(), title: "مشاركة رابط الإحالة مع 3 أصدقاء", description: "انسخ كود الإحالة وشاركه مع الأصدقاء لربح مكافآت الإحالة الإضافية.", reward: 5.00, required_vip_level: 1, status: "ACTIVE" },
    { id: uuidv4(), title: "تأكيد واستلام تقرير الأرباح الأسبوعي VIP 2", description: "مراجعة تقرير الأرباح والمهام المنجزة وتأكيد المحفظة.", reward: 10.00, required_vip_level: 2, status: "ACTIVE" },
    { id: uuidv4(), title: "استبيان رضا كبار المستثمرين VIP 3", description: "إكمال استبيان الخدمات المميزة واقتراح تحسينات للمنصة.", reward: 25.00, required_vip_level: 3, status: "ACTIVE" },
  ];

  for (const t of sampleTasks) {
    await client.query(
      "INSERT INTO tasks (id, title, description, reward, required_vip_level, status) VALUES ($1, $2, $3, $4, $5, $6)",
      [t.id, t.title, t.description, t.reward, t.required_vip_level, t.status]
    );
  }

  console.log("Seeded refined ads & tasks successfully!");
  await client.end();
}
main().catch(console.error);
