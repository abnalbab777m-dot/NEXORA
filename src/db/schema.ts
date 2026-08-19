import { pgTable, text, integer, real, boolean, timestamp } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: text("id").primaryKey(), 
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  phone: text("phone").unique(),
  displayName: text("display_name"),
  passwordHash: text("password_hash").notNull(),
  transactionPin: text("transaction_pin"),
  role: text("role").default("USER").notNull(),
  status: text("status").default("ACTIVE").notNull(),
  vipLevel: integer("vip_level").default(0).notNull(),
  createdAt: timestamp("created_at").$defaultFn(() => new Date()).notNull(),
  updatedAt: timestamp("updated_at").$defaultFn(() => new Date()).$onUpdateFn(() => new Date()).notNull(),
});

export const wallets = pgTable("wallets", {
  userId: text("user_id").primaryKey().references(() => users.id),
  availableBalance: real("available_balance").default(0).notNull(),
  pendingBalance: real("pending_balance").default(0).notNull(),
  totalEarnings: real("total_earnings").default(0).notNull(),
  totalDeposits: real("total_deposits").default(0).notNull(),
  totalWithdrawals: real("total_withdrawals").default(0).notNull(),
  updatedAt: timestamp("updated_at").$defaultFn(() => new Date()).$onUpdateFn(() => new Date()).notNull(),
});

export const transactions = pgTable("transactions", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  type: text("type").notNull(),
  amount: real("amount").notNull(),
  currency: text("currency").default("USD").notNull(),
  status: text("status").default("PENDING").notNull(),
  description: text("description"),
  balanceBefore: real("balance_before"),
  balanceAfter: real("balance_after"),
  createdAt: timestamp("created_at").$defaultFn(() => new Date()).notNull(),
  processedAt: timestamp("processed_at"),
  processedBy: text("processed_by").references(() => users.id), 
});

export const deposits = pgTable("deposits", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  amount: real("amount").notNull(),
  status: text("status").default("PENDING").notNull(),
  paymentMethod: text("payment_method"),
  reference: text("reference"),
  adminAction: text("admin_action"),
  createdAt: timestamp("created_at").$defaultFn(() => new Date()).notNull(),
  updatedAt: timestamp("updated_at").$defaultFn(() => new Date()).$onUpdateFn(() => new Date()).notNull(),
});

export const withdrawals = pgTable("withdrawals", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  amount: real("amount").notNull(),
  status: text("status").default("PENDING").notNull(),
  paymentMethod: text("payment_method"),
  reference: text("reference"),
  adminAction: text("admin_action"),
  createdAt: timestamp("created_at").$defaultFn(() => new Date()).notNull(),
  updatedAt: timestamp("updated_at").$defaultFn(() => new Date()).$onUpdateFn(() => new Date()).notNull(),
});

export const vipPlans = pgTable("vip_plans", {
  id: text("id").primaryKey(),
  level: integer("level").notNull().unique(),
  name: text("name").notNull(),
  price: real("price").notNull(),
  durationDays: integer("duration_days").notNull(),
  dailyTasks: integer("daily_tasks").notNull(),
  dailyAds: integer("daily_ads").notNull(),
  status: text("status").default("ACTIVE").notNull(),
});

export const tasks = pgTable("tasks", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  reward: real("reward").notNull(),
  durationSeconds: integer("duration_seconds").default(30).notNull(),
  url: text("url"),
  category: text("category").default("TELEGRAM"), // TELEGRAM, REGISTRATION, SOCIAL, APP_REVIEW, OTHER
  taskType: text("task_type").default("PROOF_REQUIRED"), // PROOF_REQUIRED, DIRECT
  proofInstructions: text("proof_instructions"),
  requiredVipLevel: integer("required_vip_level").default(0).notNull(),
  status: text("status").default("ACTIVE").notNull(),
  createdAt: timestamp("created_at").$defaultFn(() => new Date()).notNull(),
});

export const taskCompletions = pgTable("task_completions", {
  id: text("id").primaryKey(),
  taskId: text("task_id").notNull().references(() => tasks.id),
  userId: text("user_id").notNull().references(() => users.id),
  reward: real("reward").notNull(),
  status: text("status").default("PENDING").notNull(), // PENDING, COMPLETED, REJECTED
  proofImage: text("proof_image"), // base64 or URL
  proofAccount: text("proof_account"), // username / account ID used by member
  rejectionReason: text("rejection_reason"),
  completedAt: timestamp("completed_at").$defaultFn(() => new Date()).notNull(),
  reviewedAt: timestamp("reviewed_at"),
  reviewedBy: text("reviewed_by").references(() => users.id),
});

export const ads = pgTable("ads", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  reward: real("reward").notNull(),
  durationSeconds: integer("duration_seconds").notNull(),
  url: text("url"),
  requiredVipLevel: integer("required_vip_level").default(0).notNull(),
  status: text("status").default("ACTIVE").notNull(),
  createdAt: timestamp("created_at").$defaultFn(() => new Date()).notNull(),
});

export const adCompletions = pgTable("ad_completions", {
  id: text("id").primaryKey(),
  adId: text("ad_id").notNull().references(() => ads.id),
  userId: text("user_id").notNull().references(() => users.id),
  reward: real("reward").notNull(),
  status: text("status").default("PENDING").notNull(),
  completedAt: timestamp("completed_at").$defaultFn(() => new Date()).notNull(),
});

export const notifications = pgTable("notifications", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: text("type").notNull(),
  read: boolean("read").default(false).notNull(),
  createdAt: timestamp("created_at").$defaultFn(() => new Date()).notNull(),
});

export const adminLogs = pgTable("admin_logs", {
  id: text("id").primaryKey(),
  adminId: text("admin_id").notNull().references(() => users.id),
  action: text("action").notNull(),
  details: text("details"),
  createdAt: timestamp("created_at").$defaultFn(() => new Date()).notNull(),
});

export const systemSettings = pgTable("system_settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  description: text("description"),
  updatedAt: timestamp("updated_at").$defaultFn(() => new Date()).notNull(),
});

export const paymentMethods = pgTable("payment_methods", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").default("BOTH").notNull(), // DEPOSIT, WITHDRAWAL, BOTH
  walletAddressOrAccount: text("wallet_address_or_account").notNull(),
  network: text("network"), // e.g. TRC20, BEP20, ERC20, Internal, etc.
  qrCodeUrl: text("qr_code_url"),
  minLimit: real("min_limit").default(1).notNull(),
  maxLimit: real("max_limit").default(100000).notNull(),
  networkFee: real("network_fee").default(0).notNull(),
  instructions: text("instructions"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").$defaultFn(() => new Date()).notNull(),
  updatedAt: timestamp("updated_at").$defaultFn(() => new Date()).$onUpdateFn(() => new Date()).notNull(),
});
