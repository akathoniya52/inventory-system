import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ordersApi } from "@/api/endpoints";
import { extractError } from "@/api/client";
import { Icon } from "@/components/Icon";
import { PageHeader } from "@/components/PageHeader";
import { PageLoader } from "@/components/Spinner";
import { EmptyState } from "@/components/EmptyState";
import { StatusBadge } from "@/components/StatusBadge";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { useToast } from "@/context/ToastContext";
import { useSearchQuery } from "@/hooks/useSearchQuery";
import { formatCurrency, formatDate } from "@/lib/format";
import type { OrderListItem } from "@/types";

export function OrdersPage() {
  const { notify } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useSearchQuery();
  const [deleting, setDeleting] = useState<OrderListItem | null>(null);

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["orders"],
    queryFn: ordersApi.list,
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return orders;
    return orders.filter(
      (o) =>
        o.order_number.toLowerCase().includes(q) ||
        (o.customer?.full_name ?? "").toLowerCase().includes(q) ||
        (o.customer?.email ?? "").toLowerCase().includes(q),
    );
  }, [orders, search]);

  const deleteMutation = useMutation({
    mutationFn: (id: number) => ordersApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      notify("Order deleted and stock restored", "success");
      setDeleting(null);
    },
    onError: (err) => notify(extractError(err), "error"),
  });

  return (
    <>
      <PageHeader
        title="Orders"
        subtitle="Track and manage customer orders."
        action={
          <button
            onClick={() => navigate("/orders/new")}
            className="bg-primary-container text-on-primary font-label-md text-label-md px-4 py-2.5 rounded-lg shadow-sm hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <Icon name="add" className="text-[20px]" />
            Create Order
          </button>
        }
      />

      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm overflow-hidden">
        <div className="p-lg border-b border-outline-variant">
          <div className="relative max-w-sm">
            <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[20px]" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by order # or customer..."
              className="w-full bg-surface-container-low border border-outline-variant rounded-lg pl-10 pr-4 py-2 text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 font-body-sm text-body-sm"
            />
          </div>
        </div>

        {isLoading ? (
          <PageLoader />
        ) : orders.length === 0 ? (
          <EmptyState
            icon="receipt_long"
            title="No orders yet"
            description="Create your first order to get started."
          />
        ) : filtered.length === 0 ? (
          <EmptyState icon="search_off" title="No matching orders" description="Try a different search." />
        ) : (
          <div className="w-full overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface text-on-surface-variant font-label-sm text-label-sm uppercase tracking-wider border-b border-outline-variant">
                  <th className="py-3 px-6 font-medium">Order ID</th>
                  <th className="py-3 px-6 font-medium">Customer</th>
                  <th className="py-3 px-6 font-medium">Items</th>
                  <th className="py-3 px-6 font-medium">Date</th>
                  <th className="py-3 px-6 font-medium text-right">Amount</th>
                  <th className="py-3 px-6 font-medium">Status</th>
                  <th className="py-3 px-6 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="font-body-md text-body-md text-on-surface">
                {filtered.map((o) => (
                  <tr key={o.id} className="border-b border-outline-variant/50 hover:bg-surface transition-colors">
                    <td className="py-3 px-6 font-medium">
                      <Link to={`/orders/${o.id}`} className="text-primary hover:underline">
                        #{o.order_number}
                      </Link>
                    </td>
                    <td className="py-3 px-6">{o.customer?.full_name ?? "—"}</td>
                    <td className="py-3 px-6 text-on-surface-variant">{o.item_count}</td>
                    <td className="py-3 px-6 text-on-surface-variant">{formatDate(o.created_at)}</td>
                    <td className="py-3 px-6 text-right font-medium">{formatCurrency(o.total_amount)}</td>
                    <td className="py-3 px-6">
                      <StatusBadge status={o.status} />
                    </td>
                    <td className="py-3 px-6">
                      <div className="flex justify-end gap-1">
                        <Link
                          to={`/orders/${o.id}`}
                          className="p-1.5 rounded hover:bg-surface-container text-on-surface-variant transition-colors"
                          aria-label="View"
                        >
                          <Icon name="visibility" className="text-[20px]" />
                        </Link>
                        <button
                          onClick={() => setDeleting(o)}
                          className="p-1.5 rounded hover:bg-error-container text-error transition-colors"
                          aria-label="Delete"
                        >
                          <Icon name="delete" className="text-[20px]" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={!!deleting}
        title="Delete order"
        message={`Delete order #${deleting?.order_number}? Stock from this order will be returned to inventory.`}
        loading={deleteMutation.isPending}
        onConfirm={() => deleting && deleteMutation.mutate(deleting.id)}
        onCancel={() => setDeleting(null)}
      />
    </>
  );
}
