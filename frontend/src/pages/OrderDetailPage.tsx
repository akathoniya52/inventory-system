import { Link, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ordersApi } from "@/api/endpoints";
import { extractError } from "@/api/client";
import { Icon } from "@/components/Icon";
import { PageLoader } from "@/components/Spinner";
import { EmptyState } from "@/components/EmptyState";
import { StatusBadge } from "@/components/StatusBadge";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { useToast } from "@/context/ToastContext";
import { formatCurrency, formatDate } from "@/lib/format";

export function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const orderId = Number(id);
  const { notify } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [confirmDelete, setConfirmDelete] = useState(false);

  const { data: order, isLoading, isError } = useQuery({
    queryKey: ["orders", orderId],
    queryFn: () => ordersApi.get(orderId),
    enabled: !Number.isNaN(orderId),
  });

  const deleteMutation = useMutation({
    mutationFn: () => ordersApi.remove(orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      notify("Order deleted and stock restored", "success");
      navigate("/orders");
    },
    onError: (err) => notify(extractError(err), "error"),
  });

  if (isLoading) return <PageLoader />;
  if (isError || !order)
    return (
      <EmptyState icon="receipt_long" title="Order not found" description="It may have been deleted." />
    );

  return (
    <>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            to="/orders"
            className="p-2 rounded-lg border border-outline-variant text-on-surface-variant hover:bg-surface-container transition-colors"
          >
            <Icon name="arrow_back" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="font-headline-lg text-headline-lg text-on-surface">
                #{order.order_number}
              </h2>
              <StatusBadge status={order.status} />
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              Placed {formatDate(order.created_at)}
            </p>
          </div>
        </div>
        <button
          onClick={() => setConfirmDelete(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-error/40 text-error font-label-md text-label-md hover:bg-error-container transition-colors"
        >
          <Icon name="delete" className="text-[20px]" />
          Delete
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-gutter">
        {/* Items */}
        <div className="lg:col-span-2 bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm overflow-hidden">
          <div className="p-lg border-b border-outline-variant">
            <h3 className="font-headline-sm text-headline-sm text-on-surface">Order Items</h3>
          </div>
          <div className="w-full overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface text-on-surface-variant font-label-sm text-label-sm uppercase tracking-wider border-b border-outline-variant">
                  <th className="py-3 px-6 font-medium">Product</th>
                  <th className="py-3 px-6 font-medium text-right">Unit Price</th>
                  <th className="py-3 px-6 font-medium text-right">Qty</th>
                  <th className="py-3 px-6 font-medium text-right">Total</th>
                </tr>
              </thead>
              <tbody className="font-body-md text-body-md text-on-surface">
                {order.items.map((item) => (
                  <tr key={item.id} className="border-b border-outline-variant/50">
                    <td className="py-3 px-6 font-medium">{item.product_name}</td>
                    <td className="py-3 px-6 text-right text-on-surface-variant">
                      {formatCurrency(item.unit_price)}
                    </td>
                    <td className="py-3 px-6 text-right">{item.quantity}</td>
                    <td className="py-3 px-6 text-right font-medium">{formatCurrency(item.line_total)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-surface">
                  <td className="py-4 px-6 font-label-md text-label-md text-on-surface-variant" colSpan={3}>
                    Total amount
                  </td>
                  <td className="py-4 px-6 text-right font-stats-number text-headline-sm text-on-surface">
                    {formatCurrency(order.total_amount)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Customer + meta */}
        <div className="lg:col-span-1 flex flex-col gap-gutter">
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-lg shadow-sm">
            <h3 className="font-headline-sm text-headline-sm text-on-surface mb-4">Customer</h3>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary-container text-on-primary flex items-center justify-center font-label-md text-label-md">
                {(order.customer?.full_name ?? "?").slice(0, 1).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="font-label-md text-label-md text-on-surface truncate">
                  {order.customer?.full_name ?? "Unknown"}
                </p>
                <p className="font-label-sm text-label-sm text-on-surface-variant truncate">
                  {order.customer?.email ?? "—"}
                </p>
              </div>
            </div>
          </div>

          {order.notes && (
            <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-lg shadow-sm">
              <h3 className="font-headline-sm text-headline-sm text-on-surface mb-2">Notes</h3>
              <p className="font-body-sm text-body-sm text-on-surface-variant">{order.notes}</p>
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        title="Delete order"
        message={`Delete order #${order.order_number}? Stock will be returned to inventory.`}
        loading={deleteMutation.isPending}
        onConfirm={() => deleteMutation.mutate()}
        onCancel={() => setConfirmDelete(false)}
      />
    </>
  );
}
