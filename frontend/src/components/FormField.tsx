import type { ReactNode } from "react";

interface FormFieldProps {
  label: string;
  htmlFor?: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
}

export function FormField({ label, htmlFor, error, required, children }: FormFieldProps) {
  return (
    <div>
      <label htmlFor={htmlFor} className="block font-label-md text-label-md text-on-surface mb-1.5">
        {label}
        {required && <span className="text-error ml-0.5">*</span>}
      </label>
      {children}
      {error && <p className="mt-1 font-label-sm text-label-sm text-error">{error}</p>}
    </div>
  );
}

export const inputClass =
  "w-full px-3 py-2.5 rounded-lg border border-outline-variant bg-surface-container-lowest text-on-surface placeholder:text-outline-variant focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-body-sm text-body-sm";
