import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { Icon } from "@/components/Icon";

type ToastType = "success" | "error" | "info";

interface Toast {
  id: number;
  type: ToastType;
  message: string;
}

interface ToastContextValue {
  notify: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

let nextId = 1;

const STYLES: Record<ToastType, { bg: string; text: string; icon: string }> = {
  success: { bg: "bg-secondary-container", text: "text-on-secondary-container", icon: "check_circle" },
  error: { bg: "bg-error-container", text: "text-on-error-container", icon: "error" },
  info: { bg: "bg-surface-container-high", text: "text-on-surface", icon: "info" },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const notify = useCallback((message: string, type: ToastType = "info") => {
    const id = nextId++;
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  return (
    <ToastContext.Provider value={{ notify }}>
      {children}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 max-w-sm">
        {toasts.map((t) => {
          const s = STYLES[t.type];
          return (
            <div
              key={t.id}
              className={`${s.bg} ${s.text} flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border border-outline-variant/30 animate-in`}
              role="alert"
            >
              <Icon name={s.icon} className="text-[20px]" filled />
              <span className="font-body-sm text-body-sm">{t.message}</span>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
