import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { dashboardApi } from "@/api/endpoints";
import { Icon } from "@/components/Icon";
import { PageLoader } from "@/components/Spinner";
import { StatusBadge } from "@/components/StatusBadge";
import { EmptyState } from "@/components/EmptyState";
import { formatCompactCurrency, formatCurrency, formatDate, formatNumber } from "@/lib/format";

interface StatCardProps {
  label: string;
  value: string;
  icon: string;
  hint: string;
  alert?: boolean;
}

function StatCard({ label, value, icon, hint, alert }: StatCardProps) {
  return (
    <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-lg shadow-sm flex flex-col">
      <div className="flex justify-between items-start mb-4">
        <p className="font-label-md text-label-md text-on-surface-variant">{label}</p>
        <span
          className={`material-symbols-outlined p-1 rounded ${
            alert ? "text-error bg-error-container" : "text-primary bg-primary-container/10"
          }`}
        >
          {icon}
        </span>
      </div>
      <h3 className="font-stats-number text-stats-number text-on-surface mb-2">{value}</h3>
      <div className={`flex items-center mt-auto ${alert ? "text-error" : "text-secondary"}`}>
        <Icon name={alert ? "priority_high" : "trending_up"} className="text-sm mr-1" />
        <span className="font-label-sm text-label-sm">{hint}</span>
      </div>
    </div>
  );
}

export function DashboardPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["dashboard"],
    queryFn: dashboardApi.summary,
  });

  if (isLoading) return <PageLoader />;
  if (isError || !data)
    return <EmptyState icon="cloud_off" title="Could not load dashboard" description="Please try again." />;

  const { stats, recent_orders, top_products, low_stock_products } = data;

  return (
    <>
      <div className="flex justify-between items-end">
        <div>
          <h2 className="font-headline-lg text-headline-lg text-on-surface">Overview</h2>
          <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
            Today's snapshot of your business operations.
          </p>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-gutter">
        <StatCard
          label="Total Products"
          value={formatNumber(stats.total_products)}
          icon="inventory_2"
          hint={`${formatCompactCurrency(stats.total_inventory_value)} inventory value`}
        />
        <StatCard
          label="Total Customers"
          value={formatNumber(stats.total_customers)}
          icon="groups"
          hint="Active customer base"
        />
        <StatCard
          label="Total Orders"
          value={formatNumber(stats.total_orders)}
          icon="shopping_cart"
          hint={`${formatCompactCurrency(stats.total_revenue)} revenue`}
        />
        <StatCard
          label="Low Stock Products"
          value={formatNumber(stats.low_stock_count)}
          icon="warning"
          hint="Requires attention"
          alert={stats.low_stock_count > 0}
        />
      </div>

      {/* Workspace row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-gutter">
        {/* Top products */}
        <div className="lg:col-span-2 bg-surface-container-lowest border border-outline-variant rounded-lg p-lg shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-headline-sm text-headline-sm text-on-surface">Top Products</h3>
            <Link to="/products" className="font-label-sm text-label-sm text-primary hover:underline">
              View All
            </Link>
          </div>
          {top_products.length === 0 ? (
            <EmptyState icon="trending_up" title="No sales yet" description="Create an order to see top products." />
          ) : (
            <div className="flex flex-col gap-3">
              {top_products.map((p) => (
                <div key={p.id} className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-surface-container flex items-center justify-center text-on-surface-variant">
                      <Icon name="inventory_2" className="text-sm" />
                    </div>
                    <div>
                      <p className="font-label-md text-label-md text-on-surface">{p.name}</p>
                      <p className="font-label-sm text-label-sm text-on-surface-variant">
                        {p.units_sold} units sold
                      </p>
                    </div>
                  </div>
                  <span className="font-label-md text-label-md text-primary">
                    {formatCompactCurrency(p.revenue)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Low stock */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-lg shadow-sm">
          <h3 className="font-headline-sm text-headline-sm text-on-surface mb-4">Low Stock Alerts</h3>
          {low_stock_products.length === 0 ? (
            <EmptyState icon="check_circle" title="All stocked up" />
          ) : (
            <div className="flex flex-col gap-3">
              {low_stock_products.slice(0, 6).map((p) => (
                <div key={p.id} className="flex justify-between items-center">
                  <div className="min-w-0">
                    <p className="font-label-md text-label-md text-on-surface truncate">{p.name}</p>
                    <p className="font-label-sm text-label-sm text-on-surface-variant">{p.sku}</p>
                  </div>
                  <span className="font-label-md text-label-md text-error shrink-0">
                    {p.quantity_in_stock} left
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent orders */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-lg shadow-sm overflow-hidden">
        <div className="p-lg border-b border-outline-variant flex justify-between items-center">
          <h3 className="font-headline-sm text-headline-sm text-on-surface">Recent Orders</h3>
          <Link to="/orders" className="font-label-sm text-label-sm text-primary hover:underline">
            View All
          </Link>
        </div>
        {recent_orders.length === 0 ? (
          <EmptyState icon="receipt_long" title="No orders yet" />
        ) : (
          <div className="w-full overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface text-on-surface-variant font-label-sm text-label-sm uppercase tracking-wider border-b border-outline-variant">
                  <th className="py-3 px-6 font-medium">Order ID</th>
                  <th className="py-3 px-6 font-medium">Customer</th>
                  <th className="py-3 px-6 font-medium">Date</th>
                  <th className="py-3 px-6 font-medium text-right">Amount</th>
                  <th className="py-3 px-6 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="font-body-md text-body-md text-on-surface">
                {recent_orders.map((o) => (
                  <tr key={o.id} className="border-b border-outline-variant/50 hover:bg-surface transition-colors">
                    <td className="py-3 px-6 font-medium">
                      <Link to={`/orders/${o.id}`} className="text-primary hover:underline">
                        #{o.order_number}
                      </Link>
                    </td>
                    <td className="py-3 px-6">{o.customer?.full_name ?? "—"}</td>
                    <td className="py-3 px-6 text-on-surface-variant">{formatDate(o.created_at)}</td>
                    <td className="py-3 px-6 text-right font-medium">{formatCurrency(o.total_amount)}</td>
                    <td className="py-3 px-6">
                      <StatusBadge status={o.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
