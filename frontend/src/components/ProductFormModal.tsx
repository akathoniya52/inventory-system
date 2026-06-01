import { useEffect, useState, type FormEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { productsApi } from "@/api/endpoints";
import { extractError } from "@/api/client";
import { Modal } from "./Modal";
import { Spinner } from "./Spinner";
import { FormField, inputClass } from "./FormField";
import { useToast } from "@/context/ToastContext";
import type { Product, ProductInput } from "@/types";

interface Props {
  open: boolean;
  product: Product | null;
  onClose: () => void;
}

type FormState = {
  name: string;
  sku: string;
  category: string;
  description: string;
  price: string;
  quantity_in_stock: string;
  low_stock_threshold: string;
};

const EMPTY: FormState = {
  name: "",
  sku: "",
  category: "",
  description: "",
  price: "",
  quantity_in_stock: "",
  low_stock_threshold: "10",
};

export function ProductFormModal({ open, product, onClose }: Props) {
  const { notify } = useToast();
  const queryClient = useQueryClient();
  const isEdit = !!product;
  const [form, setForm] = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});

  useEffect(() => {
    if (open) {
      setErrors({});
      setForm(
        product
          ? {
              name: product.name,
              sku: product.sku,
              category: product.category ?? "",
              description: product.description ?? "",
              price: String(product.price),
              quantity_in_stock: String(product.quantity_in_stock),
              low_stock_threshold: String(product.low_stock_threshold),
            }
          : EMPTY,
      );
    }
  }, [open, product]);

  const mutation = useMutation({
    mutationFn: (payload: ProductInput) =>
      isEdit ? productsApi.update(product!.id, payload) : productsApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      notify(isEdit ? "Product updated" : "Product created", "success");
      onClose();
    },
    onError: (err) => notify(extractError(err), "error"),
  });

  const set = (key: keyof FormState, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const validate = (): boolean => {
    const e: Partial<Record<keyof FormState, string>> = {};
    if (!form.name.trim()) e.name = "Name is required";
    if (!form.sku.trim()) e.sku = "SKU is required";
    const price = parseFloat(form.price);
    if (form.price === "" || Number.isNaN(price) || price < 0) e.price = "Enter a valid price (≥ 0)";
    const qty = parseInt(form.quantity_in_stock, 10);
    if (form.quantity_in_stock === "" || Number.isNaN(qty) || qty < 0)
      e.quantity_in_stock = "Enter a valid quantity (≥ 0)";
    const threshold = parseInt(form.low_stock_threshold, 10);
    if (Number.isNaN(threshold) || threshold < 0) e.low_stock_threshold = "Enter a valid threshold";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (ev: FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    mutation.mutate({
      name: form.name.trim(),
      sku: form.sku.trim(),
      category: form.category.trim() || null,
      description: form.description.trim() || null,
      price: parseFloat(form.price),
      quantity_in_stock: parseInt(form.quantity_in_stock, 10),
      low_stock_threshold: parseInt(form.low_stock_threshold, 10),
    });
  };

  return (
    <Modal open={open} title={isEdit ? "Edit Product" : "Add Product"} onClose={onClose}>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <FormField label="Product name" htmlFor="name" required error={errors.name}>
          <input id="name" className={inputClass} value={form.name} onChange={(e) => set("name", e.target.value)} />
        </FormField>

        <div className="grid grid-cols-2 gap-4">
          <FormField label="SKU / Code" htmlFor="sku" required error={errors.sku}>
            <input id="sku" className={inputClass} value={form.sku} onChange={(e) => set("sku", e.target.value)} />
          </FormField>
          <FormField label="Category" htmlFor="category">
            <input id="category" className={inputClass} value={form.category} onChange={(e) => set("category", e.target.value)} />
          </FormField>
        </div>

        <FormField label="Description" htmlFor="description">
          <textarea
            id="description"
            rows={2}
            className={inputClass}
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
          />
        </FormField>

        <div className="grid grid-cols-3 gap-4">
          <FormField label="Price ($)" htmlFor="price" required error={errors.price}>
            <input
              id="price"
              type="number"
              min="0"
              step="0.01"
              className={inputClass}
              value={form.price}
              onChange={(e) => set("price", e.target.value)}
            />
          </FormField>
          <FormField label="Stock qty" htmlFor="qty" required error={errors.quantity_in_stock}>
            <input
              id="qty"
              type="number"
              min="0"
              className={inputClass}
              value={form.quantity_in_stock}
              onChange={(e) => set("quantity_in_stock", e.target.value)}
            />
          </FormField>
          <FormField label="Low stock at" htmlFor="threshold" error={errors.low_stock_threshold}>
            <input
              id="threshold"
              type="number"
              min="0"
              className={inputClass}
              value={form.low_stock_threshold}
              onChange={(e) => set("low_stock_threshold", e.target.value)}
            />
          </FormField>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-outline-variant text-on-surface font-label-md text-label-md hover:bg-surface-container transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={mutation.isPending}
            className="px-4 py-2 rounded-lg bg-primary text-on-primary font-label-md text-label-md hover:opacity-90 transition-opacity flex items-center gap-2 disabled:opacity-60"
          >
            {mutation.isPending && <Spinner className="h-4 w-4" />}
            {isEdit ? "Save changes" : "Create product"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
