import { api } from "./client";
import type {
  Customer,
  CustomerInput,
  DashboardSummary,
  LoginResponse,
  Order,
  OrderInput,
  OrderListItem,
  Product,
  ProductInput,
} from "@/types";

// --- Auth ---
export const authApi = {
  login: (email: string, password: string) =>
    api.post<LoginResponse>("/auth/login", { email, password }).then((r) => r.data),
};

// --- Products ---
export const productsApi = {
  list: (params?: { search?: string; low_stock?: boolean }) =>
    api.get<Product[]>("/products", { params }).then((r) => r.data),
  get: (id: number) => api.get<Product>(`/products/${id}`).then((r) => r.data),
  create: (data: ProductInput) => api.post<Product>("/products", data).then((r) => r.data),
  update: (id: number, data: Partial<ProductInput>) =>
    api.put<Product>(`/products/${id}`, data).then((r) => r.data),
  remove: (id: number) => api.delete(`/products/${id}`).then((r) => r.data),
};

// --- Customers ---
export const customersApi = {
  list: (params?: { search?: string }) =>
    api.get<Customer[]>("/customers", { params }).then((r) => r.data),
  get: (id: number) => api.get<Customer>(`/customers/${id}`).then((r) => r.data),
  create: (data: CustomerInput) => api.post<Customer>("/customers", data).then((r) => r.data),
  remove: (id: number) => api.delete(`/customers/${id}`).then((r) => r.data),
};

// --- Orders ---
export const ordersApi = {
  list: () => api.get<OrderListItem[]>("/orders").then((r) => r.data),
  get: (id: number) => api.get<Order>(`/orders/${id}`).then((r) => r.data),
  create: (data: OrderInput) => api.post<Order>("/orders", data).then((r) => r.data),
  remove: (id: number) => api.delete(`/orders/${id}`).then((r) => r.data),
};

// --- Dashboard ---
export const dashboardApi = {
  summary: () => api.get<DashboardSummary>("/dashboard/summary").then((r) => r.data),
};
