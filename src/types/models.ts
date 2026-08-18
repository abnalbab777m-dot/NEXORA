// Firestore Data Models

export interface User {
  id?: string;
  userId?: string;
  displayName?: string;
  username: string;
  email: string;
  phone?: string;
  role: 'USER' | 'ADMIN';
  status: 'ACTIVE' | 'FROZEN' | 'BANNED';
  vipLevel: number;
  hasPin?: boolean;
  createdAt?: any;
  updatedAt?: any;
}

export interface Wallet {
  userId: string;
  availableBalance: number;
  pendingBalance: number;
  totalEarnings: number;
  totalDeposits: number;
  totalWithdrawals: number;
  updatedAt: any;
}

export interface Transaction {
  id?: string;
  transactionId?: string;
  userId: string;
  type: string;
  amount: number;
  currency: 'USD';
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'COMPLETED' | 'CANCELLED';
  description?: string;
  createdAt: any;
  metadata?: any;
}

export interface Task {
  id?: string;
  taskId?: string;
  title: string;
  description?: string;
  reward: number;
  durationSeconds?: number;
  url?: string;
  category?: 'TELEGRAM' | 'REGISTRATION' | 'SOCIAL' | 'APP_REVIEW' | 'OTHER' | string;
  taskType?: 'PROOF_REQUIRED' | 'DIRECT';
  proofInstructions?: string;
  requiredVipLevel: number;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt?: any;
}

export interface TaskCompletion {
  id?: string;
  completionId?: string;
  taskId: string;
  userId: string;
  reward: number;
  status: 'PENDING' | 'COMPLETED' | 'REJECTED';
  proofImage?: string;
  proofAccount?: string;
  rejectionReason?: string;
  completedAt: any;
  taskTitle?: string;
  taskCategory?: string;
  userEmail?: string;
  userPhone?: string;
}

export interface Ad {
  id?: string;
  adId?: string;
  title: string;
  description?: string;
  reward: number;
  durationSeconds: number;
  url?: string;
  requiredVipLevel: number;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt?: any;
}

export interface AdCompletion {
  completionId: string;
  adId: string;
  userId: string;
  reward: number;
  status: 'PENDING' | 'COMPLETED' | 'REJECTED';
  completedAt: number;
}

export interface VipPlan {
  id?: string;
  planId?: string;
  level: number;
  name: string;
  price: number;
  durationDays: number;
  dailyTasks: number;
  dailyAds: number;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface Notification {
  id?: string;
  notificationId?: string;
  userId: string;
  title: string;
  message: string;
  type: 'SUCCESS' | 'WARNING' | 'INFO' | 'ERROR';
  read: boolean;
  createdAt: any;
}

export interface PaymentMethod {
  id: string;
  name: string;
  type: 'DEPOSIT' | 'WITHDRAWAL' | 'BOTH';
  walletAddressOrAccount: string;
  network?: string;
  qrCodeUrl?: string;
  minLimit: number;
  maxLimit: number;
  networkFee: number;
  instructions?: string;
  isActive: boolean;
  createdAt?: any;
  updatedAt?: any;
}
