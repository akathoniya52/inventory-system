import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { customersApi } from "@/api/endpoints";
import { extractError } from "@/api/client";
import { Icon } from "@/components/Icon";
import { PageHeader } from "@/components/PageHeader";
import { PageLoader } from "@/components/Spinner";
import { EmptyState } from "@/components/EmptyState";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { useToast } from "@/context/ToastContext";
import { useSearchQuery } from "@/hooks/useSearchQuery";
import { formatDateShort } from "@/lib/format";
import type { Customer } from "@/types";
import { CustomerFormModal } from "@/components/CustomerFormModal";

export function CustomersPage() {
  const { notify } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useSearchQuery();
  const [formOpen, setFormOpen] = useState(false);
  const [deleting, setDeleting] = useState<Customer | null>(null);

  const { data: customers = [], isLoading } = useQuery({
    queryKey: ["customers"],
    queryFn: () => customersApi.list(),
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter(
      (c) => c.full_name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q),
    );
  }, [customers, search]);

  const deleteMutation = useMutation({
    mutationFn: (id: number) => customersApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      notify("Customer deleted", "success");
      setDeleting(null);
    },
    onError: (err) => notify(extractError(err), "error"),
  });

  return (
    <>
      <PageHeader
        title="Customers"
        subtitle="Manage your customer directory and contact details."
        action={
          <button
            onClick={() => setFormOpen(true)}
            className="bg-primary-container text-on-primary font-label-md text-label-md px-4 py-2.5 rounded-lg shadow-sm hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <Icon name="person_add" className="text-[20px]" />
            Add Customer
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
              placeholder="Search by name or email..."
              className="w-full bg-surface-container-low border border-outline-variant rounded-lg pl-10 pr-4 py-2 text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 font-body-sm text-body-sm"
            />
          </div>
        </div>

        {isLoading ? (
          <PageLoader />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon="groups"
            title="No customers found"
            description={search ? "Try a different search." : "Add your first customer to get started."}
          />
        ) : (
          <div className="w-full overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface text-on-surface-variant font-label-sm text-label-sm uppercase tracking-wider border-b border-outline-variant">
                  <th className="py-3 px-6 font-medium">Name</th>
                  <th className="py-3 px-6 font-medium">Email</th>
                  <th className="py-3 px-6 font-medium">Phone</th>
                  <th className="py-3 px-6 font-medium">Company</th>
                  <th className="py-3 px-6 font-medium">Joined</th>
                  <th className="py-3 px-6 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="font-body-md text-body-md text-on-surface">
                {filtered.map((c) => (
                  <tr key={c.id} className="border-b border-outline-variant/50 hover:bg-surface transition-colors">
                    <td className="py-3 px-6 font-medium">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary-container text-on-primary flex items-center justify-center font-label-sm text-label-sm">
                          {c.full_name.slice(0, 1).toUpperCase()}
                        </div>
                        {c.full_name}
                      </div>
                    </td>
                    <td className="py-3 px-6 text-on-surface-variant">{c.email}</td>
                    <td className="py-3 px-6 text-on-surface-variant">{c.phone ?? "—"}</td>
                    <td className="py-3 px-6 text-on-surface-variant">{c.company ?? "—"}</td>
                    <td className="py-3 px-6 text-on-surface-variant">{formatDateShort(c.created_at)}</td>
                    <td className="py-3 px-6">
                      <div className="flex justify-end">
                        <button
                          onClick={() => setDeleting(c)}
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

      <CustomerFormModal open={formOpen} onClose={() => setFormOpen(false)} />

      <ConfirmDialog
        open={!!deleting}
        title="Delete customer"
        message={`Are you sure you want to delete "${deleting?.full_name}"? This cannot be undone.`}
        loading={deleteMutation.isPending}
        onConfirm={() => deleting && deleteMutation.mutate(deleting.id)}
        onCancel={() => setDeleting(null)}
      />
    </>
  );
}
