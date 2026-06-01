import { useEffect, useState, type FormEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { customersApi } from "@/api/endpoints";
import { extractError } from "@/api/client";
import { Modal } from "./Modal";
import { Spinner } from "./Spinner";
import { FormField, inputClass } from "./FormField";
import { useToast } from "@/context/ToastContext";

interface Props {
  open: boolean;
  onClose: () => void;
}

type FormState = { full_name: string; email: string; phone: string; company: string };
const EMPTY: FormState = { full_name: "", email: "", phone: "", company: "" };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function CustomerFormModal({ open, onClose }: Props) {
  const { notify } = useToast();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});

  useEffect(() => {
    if (open) {
      setForm(EMPTY);
      setErrors({});
    }
  }, [open]);

  const mutation = useMutation({
    mutationFn: () =>
      customersApi.create({
        full_name: form.full_name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || null,
        company: form.company.trim() || null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      notify("Customer created", "success");
      onClose();
    },
    onError: (err) => notify(extractError(err), "error"),
  });

  const set = (key: keyof FormState, value: string) => setForm((f) => ({ ...f, [key]: value }));

  const validate = (): boolean => {
    const e: Partial<Record<keyof FormState, string>> = {};
    if (!form.full_name.trim()) e.full_name = "Full name is required";
    if (!form.email.trim()) e.email = "Email is required";
    else if (!EMAIL_RE.test(form.email.trim())) e.email = "Enter a valid email address";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (ev: FormEvent) => {
    ev.preventDefault();
    if (validate()) mutation.mutate();
  };

  return (
    <Modal open={open} title="Add Customer" onClose={onClose}>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <FormField label="Full name" htmlFor="full_name" required error={errors.full_name}>
          <input id="full_name" className={inputClass} value={form.full_name} onChange={(e) => set("full_name", e.target.value)} />
        </FormField>
        <FormField label="Email address" htmlFor="email" required error={errors.email}>
          <input id="email" type="email" className={inputClass} value={form.email} onChange={(e) => set("email", e.target.value)} />
        </FormField>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Phone" htmlFor="phone">
            <input id="phone" className={inputClass} value={form.phone} onChange={(e) => set("phone", e.target.value)} />
          </FormField>
          <FormField label="Company" htmlFor="company">
            <input id="company" className={inputClass} value={form.company} onChange={(e) => set("company", e.target.value)} />
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
            Create customer
          </button>
        </div>
      </form>
    </Modal>
  );
}
