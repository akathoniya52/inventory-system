import { useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { customersApi, ordersApi, productsApi } from "@/api/endpoints";
import { extractError } from "@/api/client";
import { Icon } from "@/components/Icon";
import { PageLoader, Spinner } from "@/components/Spinner";
import { FormField, inputClass } from "@/components/FormField";
import { useToast } from "@/context/ToastContext";
import { formatCurrency } from "@/lib/format";

interface Line {
  product_id: number | "";
  quantity: number;
}

export function CreateOrderPage() {
  const { notify } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: customers = [], isLoading: loadingCustomers } = useQuery({
    queryKey: ["customers"],
    queryFn: () => customersApi.list(),
  });
  const { data: products = [], isLoading: loadingProducts } = useQuery({
    queryKey: ["products"],
    queryFn: () => productsApi.list(),
  });

  const [customerId, setCustomerId] = useState<number | "">("");
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<Line[]>([{ product_id: "", quantity: 1 }]);
  const [error, setError] = useState<string | null>(null);

  const productMap = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);

  const estimatedTotal = useMemo(() => {
    return lines.reduce((sum, line) => {
      if (line.product_id === "") return sum;
      const product = productMap.get(line.product_id);
      if (!product) return sum;
      return sum + parseFloat(product.price) * line.quantity;
    }, 0);
  }, [lines, productMap]);

  const mutation = useMutation({
    mutationFn: () =>
      ordersApi.create({
        customer_id: customerId as number,
        notes: notes.trim() || null,
        items: lines
          .filter((l) => l.product_id !== "")
          .map((l) => ({ product_id: l.product_id as number, quantity: l.quantity })),
      }),
    onSuccess: (order) => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      notify("Order created successfully", "success");
      navigate(`/orders/${order.id}`);
    },
    onError: (err) => {
      setError(extractError(err));
      notify(extractError(err), "error");
    },
  });

  const updateLine = (index: number, patch: Partial<Line>) =>
    setLines((prev) => prev.map((l, i) => (i === index ? { ...l, ...patch } : l)));
  const addLine = () => setLines((prev) => [...prev, { product_id: "", quantity: 1 }]);
  const removeLine = (index: number) =>
    setLines((prev) => (prev.length === 1 ? prev : prev.filter((_, i) => i !== index)));

  const validate = (): string | null => {
    if (customerId === "") return "Please select a customer.";
    const valid = lines.filter((l) => l.product_id !== "");
    if (valid.length === 0) return "Add at least one product.";
    for (const line of valid) {
      if (line.quantity < 1) return "Quantities must be at least 1.";
      const product = productMap.get(line.product_id as number);
      if (product && line.quantity > product.quantity_in_stock) {
        return `Only ${product.quantity_in_stock} units of "${product.name}" in stock.`;
      }
    }
    return null;
  };

  const handleSubmit = () => {
    const msg = validate();
    if (msg) {
      setError(msg);
      return;
    }
    setError(null);
    mutation.mutate();
  };

  if (loadingCustomers || loadingProducts) return <PageLoader />;

  return (
    <>
      <div className="flex items-center gap-3">
        <Link
          to="/orders"
          className="p-2 rounded-lg border border-outline-variant text-on-surface-variant hover:bg-surface-container transition-colors"
        >
          <Icon name="arrow_back" />
        </Link>
        <div>
          <h2 className="font-headline-lg text-headline-lg text-on-surface">Create Order</h2>
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            Select a customer and products. Totals are calculated automatically.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-gutter">
        <div className="lg:col-span-2 flex flex-col gap-gutter">
          {/* Customer */}
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-lg shadow-sm">
            <FormField label="Customer" htmlFor="customer" required>
              <select
                id="customer"
                className={inputClass}
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value ? Number(e.target.value) : "")}
              >
                <option value="">Select a customer…</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.full_name} ({c.email})
                  </option>
                ))}
              </select>
            </FormField>
          </div>

          {/* Line items */}
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-lg shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-headline-sm text-headline-sm text-on-surface">Products</h3>
              <button
                onClick={addLine}
                className="text-primary font-label-md text-label-md flex items-center gap-1 hover:underline"
              >
                <Icon name="add" className="text-[20px]" />
                Add item
              </button>
            </div>

            <div className="flex flex-col gap-3">
              {lines.map((line, i) => {
                const product = line.product_id !== "" ? productMap.get(line.product_id) : undefined;
                return (
                  <div key={i} className="flex gap-3 items-start">
                    <div className="flex-1">
                      <select
                        className={inputClass}
                        value={line.product_id}
                        onChange={(e) =>
                          updateLine(i, {
                            product_id: e.target.value ? Number(e.target.value) : "",
                          })
                        }
                      >
                        <option value="">Select a product…</option>
                        {products.map((p) => (
                          <option key={p.id} value={p.id} disabled={p.quantity_in_stock <= 0}>
                            {p.name} — {formatCurrency(p.price)} ({p.quantity_in_stock} in stock)
                          </option>
                        ))}
                      </select>
                      {product && (
                        <p className="mt-1 font-label-sm text-label-sm text-on-surface-variant">
                          {product.quantity_in_stock} available · line {formatCurrency(parseFloat(product.price) * line.quantity)}
                        </p>
                      )}
                    </div>
                    <input
                      type="number"
                      min={1}
                      max={product?.quantity_in_stock ?? undefined}
                      className={`${inputClass} w-24`}
                      value={line.quantity}
                      onChange={(e) => updateLine(i, { quantity: Math.max(1, Number(e.target.value)) })}
                    />
                    <button
                      onClick={() => removeLine(i)}
                      disabled={lines.length === 1}
                      className="p-2.5 rounded-lg text-error hover:bg-error-container transition-colors disabled:opacity-30"
                      aria-label="Remove item"
                    >
                      <Icon name="close" className="text-[20px]" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          <FormField label="Notes (optional)" htmlFor="notes">
            <textarea
              id="notes"
              rows={2}
              className={inputClass}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any special instructions…"
            />
          </FormField>
        </div>

        {/* Summary */}
        <div className="lg:col-span-1">
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-lg shadow-sm sticky top-20">
            <h3 className="font-headline-sm text-headline-sm text-on-surface mb-4">Summary</h3>
            <div className="flex flex-col gap-2 mb-4">
              {lines
                .filter((l) => l.product_id !== "")
                .map((line, i) => {
                  const product = productMap.get(line.product_id as number);
                  if (!product) return null;
                  return (
                    <div key={i} className="flex justify-between font-body-sm text-body-sm">
                      <span className="text-on-surface-variant truncate mr-2">
                        {product.name} × {line.quantity}
                      </span>
                      <span className="text-on-surface font-medium shrink-0">
                        {formatCurrency(parseFloat(product.price) * line.quantity)}
                      </span>
                    </div>
                  );
                })}
            </div>
            <div className="flex justify-between items-center border-t border-outline-variant pt-4 mb-4">
              <span className="font-label-md text-label-md text-on-surface-variant">Total</span>
              <span className="font-stats-number text-stats-number text-on-surface">
                {formatCurrency(estimatedTotal)}
              </span>
            </div>

            {error && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-error-container text-on-error-container font-label-sm text-label-sm mb-4">
                <Icon name="error" className="text-[18px]" filled />
                {error}
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={mutation.isPending}
              className="w-full py-3 rounded-lg bg-primary text-on-primary font-label-md text-label-md hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {mutation.isPending && <Spinner className="h-4 w-4" />}
              Place Order
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
