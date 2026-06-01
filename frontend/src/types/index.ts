export interface Product {
  id: number;
  name: string;
  sku: string;
  description: string | null;
  category: string | null;
  price: string; // Decimal serialized as string
  quantity_in_stock: number;
  low_stock_threshold: number;
  created_at: string;
  updated_at: string;
}

export interface ProductInput {
  name: string;
  sku: string;
  description?: string | null;
  category?: string | null;
  price: number;
  quantity_in_stock: number;
  low_stock_threshold: number;
}

export interface Customer {
  id: number;
  full_name: string;
  email: string;
  phone: string | null;
  company: string | null;
  created_at: string;
  updated_at: string;
}

export interface CustomerInput {
  full_name: string;
  email: string;
  phone?: string | null;
  company?: string | null;
}

export type OrderStatus = "pending" | "processing" | "completed" | "cancelled";

export interface CustomerSummary {
  id: number;
  full_name: string;
  email: string;
}

export interface OrderItem {
  id: number;
  product_id: number;
  product_name: string;
  quantity: number;
  unit_price: string;
  line_total: string;
}

export interface OrderListItem {
  id: number;
  order_number: string;
  status: OrderStatus;
  total_amount: string;
  created_at: string;
  customer: CustomerSummary | null;
  item_count: number;
}

export interface Order {
  id: number;
  order_number: string;
  customer_id: number;
  status: OrderStatus;
  total_amount: string;
  notes: string | null;
  created_at: string;
  customer: CustomerSummary | null;
  items: OrderItem[];
}

export interface OrderInput {
  customer_id: number;
  items: { product_id: number; quantity: number }[];
  notes?: string | null;
}

export interface DashboardStats {
  total_products: number;
  total_customers: number;
  total_orders: number;
  low_stock_count: number;
  total_inventory_value: string;
  total_revenue: string;
}

export interface TopProduct {
  id: number;
  name: string;
  units_sold: number;
  revenue: string;
}

export interface DashboardSummary {
  stats: DashboardStats;
  recent_orders: OrderListItem[];
  low_stock_products: Product[];
  top_products: TopProduct[];
}

export interface AuthUser {
  id: number;
  email: string;
  full_name: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user: AuthUser;
}
