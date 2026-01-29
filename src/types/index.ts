import type { ObjectId } from "mongodb";
import type { DefaultSession } from "next-auth";

// Extend next-auth session types
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "customer" | "seller" | "admin" | "rider";
    } & DefaultSession["user"];
  }

  interface User {
    role?: "customer" | "seller" | "admin" | "rider";
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    sub: string;
    role?: "customer" | "seller" | "admin" | "rider";
    picture?: string;
  }
}

// Global type declarations
declare global {
  var _mongoClientPromise: Promise<import("mongodb").MongoClient> | undefined;
}

// Product types
export interface Product {
  _id: ObjectId | string;
  name: string;
  slug: string;
  sku?: string;
  description?: string;
  image?: string;
  gallery?: string[];
  is_hidden?: boolean;
  category?: string;
  subcategory?: string;
  price: number | string;
  has_discount_price?: boolean;
  discount_price?: number | string;
  current_stock: number;
  product_rating?: number;
  product_max_rating?: number;
  product_rating_count?: number;
  specifications?: Record<string, string>;
  variants?: ProductVariant[];
  markets?: ProductMarket[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ProductVariant {
  name: string;
  price?: number;
  stock?: number;
}

export interface ProductMarket {
  name: string;
  url: string;
  price?: number;
}

// Cart types
export interface CartItem {
  id: string;
  name: string;
  price: number;
  image?: string | null;
  qty: number;
}

// Order types
export interface OrderAmounts {
  total?: number;
  subtotal?: number;
  shipping?: number;
  discount?: number | { amount?: number; value?: number; type?: string; percent?: number };
  refunded?: number;
  originalTotal?: number;
}

export interface OrderContact {
  fullName?: string;
  phone?: string;
  email?: string;
}

export interface OrderPayment {
  method?: string;
  status?: string;
  ref?: string;
}

export interface Order {
  _id: string;
  orderNumber?: string;
  orderId?: string;
  userId?: string;
  items: OrderItem[];
  itemsCount?: number;
  amounts?: OrderAmounts;
  total?: number;
  subtotal?: number;
  shippingCost?: number;
  discount?: number;
  status: OrderStatus;
  contact?: OrderContact;
  payment?: OrderPayment;
  paymentMethod?: string;
  paymentStatus?: string;
  shippingAddress?: Address;
  billingAddress?: Address;
  notes?: string;
  trackingNumber?: string;
  tracking?: Record<string, unknown>;
  rider?: { name?: string };
  createdAt?: Date;
  updatedAt?: Date;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "refunded";

export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

// Address types
export interface Address {
  name?: string;
  phone?: string;
  email?: string;
  street?: string;
  address?: string;
  city?: string;
  district?: string;
  division?: string;
  postalCode?: string;
  country?: string;
}

// User types
export interface User {
  _id: ObjectId | string;
  name?: string;
  email: string;
  hashedPassword?: string;
  image?: string;
  role: "customer" | "seller" | "admin" | "rider";
  phone?: string;
  addresses?: Address[];
  createdAt?: Date;
  lastLoginAt?: Date;
}

// Filter/query types
export interface ProductFilters {
  q?: string;
  search?: string;
  category?: string;
  subcategory?: string;
  minPrice?: string | number;
  maxPrice?: string | number;
  inStock?: boolean | string;
  hasDiscount?: boolean | string;
  from?: string;
  to?: string;
  sort?: string;
  page?: string | number;
  pageSize?: string | number;
  cols?: string;
}

export interface OrderFilters {
  q?: string;
  search?: string;
  status?: string;
  paymentStatus?: string;
  from?: string;
  to?: string;
  sort?: string;
  page?: string | number;
  pageSize?: string | number;
}

// Pagination types
export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Platform settings
export interface PlatformSettings {
  siteName?: string;
  siteDescription?: string;
  logo?: string;
  favicon?: string;
  theme?: ThemeSettings;
  navigation?: NavigationItem[];
  footer?: FooterSettings;
}

export interface ThemeSettings {
  primaryColor?: string;
  accentColor?: string;
  borderRadius?: "sm" | "md" | "lg" | "xl";
}

export interface NavigationItem {
  label: string;
  href: string;
  children?: NavigationItem[];
}

export interface FooterSettings {
  copyright?: string;
  links?: NavigationItem[];
  socialLinks?: SocialLink[];
}

export interface SocialLink {
  platform: string;
  url: string;
}

// Issue types
export interface Issue {
  _id: ObjectId | string;
  orderId: string;
  userId: string;
  type: string;
  subject: string;
  description: string;
  status: "open" | "in-progress" | "resolved" | "closed";
  messages?: IssueMessage[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IssueMessage {
  id: string;
  userId: string;
  message: string;
  createdAt: Date;
}

// API response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Component prop types
export interface ChildrenProps {
  children: React.ReactNode;
}

export interface ClassNameProps {
  className?: string;
}

export type PropsWithClassName<P = unknown> = P & ClassNameProps;
