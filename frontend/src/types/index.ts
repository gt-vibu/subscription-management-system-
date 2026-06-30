export type UserRole = 'USER' | 'ADMIN' | 'SUPER_ADMIN';

export interface User {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Plan {
  _id: string;
  name: string;
  description: string;
  price: number; // In cents
  billingCycle: 'MONTHLY' | 'ANNUAL';
  features: string[];
  status: 'ACTIVE' | 'ARCHIVED';
  createdAt: string;
  updatedAt: string;
}

export interface Subscription {
  _id: string;
  user: string | User;
  plan: Plan;
  status: 'ACTIVE' | 'CANCELLED' | 'EXPIRED';
  startDate: string;
  endDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface PricingLog {
  _id: string;
  plan: string;
  planName: string;
  oldPrice: number;
  newPrice: number;
  changedBy: User;
  changedAt: string;
}

export interface UserStats {
  total: number;
  roles: Record<UserRole, number>;
}

export interface SubscriptionStats {
  active: number;
  total: number;
  mrr: number; // in cents
}

export interface PlanStatsItem {
  id: string;
  name: string;
  price: number;
  billingCycle: 'MONTHLY' | 'ANNUAL';
  status: 'ACTIVE' | 'ARCHIVED';
  activeSubscribers: number;
  monthlyRevenue: number;
}

export interface PlatformStats {
  users: UserStats;
  subscriptions: SubscriptionStats;
  plans: PlanStatsItem[];
}
