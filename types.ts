
export type UserRole = 'SUPER_ADMIN' | 'MERCHANT' | 'CUSTOMER' | 'Host' | 'Staff';

export interface Merchant {
  id: string;
  name: string;
  category: string;
  logo: string;
  sstEnabled: boolean;
  serviceCharge: number; // percentage
  joinedDate: number;
  websiteUrl?: string;
  accessCode: string; // 12-digit unique access code
}

export interface Product {
  id: string;
  merchantId: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image: string;
  isAvailable: boolean;
  stock: number;
}

export type OrderStatus = 'PENDING' | 'PAID' | 'PREPARING' | 'READY' | 'COMPLETED' | 'CANCELLED';

export interface OrderItem extends Product {
  quantity: number;
  isServed?: boolean; // 新增：是否已划掉（上菜）
}

export interface Order {
  id: string;
  merchantId: string;
  items: OrderItem[];
  subtotal: number;
  sst: number;
  serviceChargeAmount: number;
  total: number;
  status: OrderStatus;
  paymentMethod?: 'DUITNOW' | 'TNG' | 'CASH' | 'Card' | 'Cash' | 'Digital';
  timestamp: number;
  tableNumber?: string;
  staffName?: string;
}

export type Sale = Order;
export type CartItem = OrderItem;

export interface AIInsight {
  summary: string;
  recommendations: string[];
  trendAnalysis: string;
}

export interface UserSession {
  storeId: string;
  role: UserRole;
  userName: string;
}

export interface StaffActivity {
  id: string;
  timestamp: number;
  user: string;
  action: string;
}

export type View = 'POS' | 'Orders' | 'Inventory' | 'Analytics' | 'AI';
