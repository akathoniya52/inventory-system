import type { OrderStatus } from "@/types";

const STYLES: Record<OrderStatus, string> = {
  completed: "bg-secondary-container text-on-secondary-container",
  processing: "bg-tertiary-fixed text-on-tertiary-fixed",
  pending: "bg-surface-container-high text-on-surface-variant",
  cancelled: "bg-error-container text-on-error-container",
};

export function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span
      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium capitalize ${STYLES[status]}`}
    >
      {status}
    </span>
  );
}

export function StockBadge({ qty, threshold }: { qty: number; threshold: number }) {
  let cls = "bg-secondary-container text-on-secondary-container";
  let label = "In stock";
  if (qty <= 0) {
    cls = "bg-error-container text-on-error-container";
    label = "Out of stock";
  } else if (qty <= threshold) {
    cls = "bg-tertiary-fixed text-on-tertiary-fixed";
    label = "Low stock";
  }
  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${cls}`}>
      {label}
    </span>
  );
}
