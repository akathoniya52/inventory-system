import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { productsApi } from "@/api/endpoints";
import { extractError } from "@/api/client";
import { Icon } from "@/components/Icon";
import { PageHeader } from "@/components/PageHeader";
import { PageLoader } from "@/components/Spinner";
import { EmptyState } from "@/components/EmptyState";
import { StockBadge } from "@/components/StatusBadge";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { useToast } from "@/context/ToastContext";
import { formatCurrency } from "@/lib/format";
import type { Product } from "@/types";
import { ProductFormModal } from "@/components/ProductFormModal";

export function ProductsPage() {
  const { notify } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState<Product | null>(null);

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["products"],
    queryFn: () => productsApi.list(),
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return products;
    return products.filter(
      (p) => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q),
    );
  }, [products, search]);

  const deleteMutation = useMutation({
    mutationFn: (id: number) => productsApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      notify("Product deleted", "success");
      setDeleting(null);
    },
    onError: (err) => notify(extractError(err), "error"),
  });

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };
  const openEdit = (p: Product) => {
    setEditing(p);
    setFormOpen(true);
  };

  return (
    <>
      <PageHeader
        title="Products"
        subtitle="Manage your product catalog, pricing, and stock levels."
        action={
          <button
            onClick={openCreate}
            className="bg-primary-container text-on-primary font-label-md text-label-md px-4 py-2.5 rounded-lg shadow-sm hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <Icon name="add" className="text-[20px]" />
            Add Product
          </button>
        }
      />

      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm flex flex-col overflow-hidden">
        <div className="p-lg border-b border-outline-variant">
          <div className="relative max-w-sm">
            <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[20px]" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or SKU..."
              className="w-full bg-surface-container-low border border-outline-variant rounded-lg pl-10 pr-4 py-2 text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 font-body-sm text-body-sm"
            />
          </div>
        </div>

        {isLoading ? (
          <PageLoader />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon="inventory_2"
            title="No products found"
            description={search ? "Try a different search." : "Add your first product to get started."}
          />
        ) : (
          <div className="w-full overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface text-on-surface-variant font-label-sm text-label-sm uppercase tracking-wider border-b border-outline-variant">
                  <th className="py-3 px-6 font-medium">Product</th>
                  <th className="py-3 px-6 font-medium">SKU</th>
                  <th className="py-3 px-6 font-medium">Category</th>
                  <th className="py-3 px-6 font-medium text-right">Price</th>
                  <th className="py-3 px-6 font-medium text-right">Stock</th>
                  <th className="py-3 px-6 font-medium">Status</th>
                  <th className="py-3 px-6 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="font-body-md text-body-md text-on-surface">
                {filtered.map((p) => (
                  <tr key={p.id} className="border-b border-outline-variant/50 hover:bg-surface transition-colors">
                    <td className="py-3 px-6 font-medium">{p.name}</td>
                    <td className="py-3 px-6 text-on-surface-variant font-mono text-sm">{p.sku}</td>
                    <td className="py-3 px-6 text-on-surface-variant">{p.category ?? "—"}</td>
                    <td className="py-3 px-6 text-right font-medium">{formatCurrency(p.price)}</td>
                    <td className="py-3 px-6 text-right">{p.quantity_in_stock}</td>
                    <td className="py-3 px-6">
                      <StockBadge qty={p.quantity_in_stock} threshold={p.low_stock_threshold} />
                    </td>
                    <td className="py-3 px-6">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => openEdit(p)}
                          className="p-1.5 rounded hover:bg-surface-container text-on-surface-variant transition-colors"
                          aria-label="Edit"
                        >
                          <Icon name="edit" className="text-[20px]" />
                        </button>
                        <button
                          onClick={() => setDeleting(p)}
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

      <ProductFormModal
        open={formOpen}
        product={editing}
        onClose={() => setFormOpen(false)}
      />

      <ConfirmDialog
        open={!!deleting}
        title="Delete product"
        message={`Are you sure you want to delete "${deleting?.name}"? This action cannot be undone.`}
        loading={deleteMutation.isPending}
        onConfirm={() => deleting && deleteMutation.mutate(deleting.id)}
        onCancel={() => setDeleting(null)}
      />
    </>
  );
}
