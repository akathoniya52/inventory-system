import { type ReactNode, useEffect } from "react";
import { Icon } from "./Icon";

interface ModalProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  maxWidth?: string;
}

export function Modal({ open, title, onClose, children, maxWidth = "max-w-lg" }: ModalProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (open) document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-on-surface/40 backdrop-blur-sm" onClick={onClose} />
      <div
        className={`relative z-10 w-full ${maxWidth} bg-surface-container-lowest rounded-xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.25)] border border-outline-variant/40 max-h-[90vh] flex flex-col`}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between px-lg py-4 border-b border-outline-variant">
          <h3 className="font-headline-sm text-headline-sm text-on-surface">{title}</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-on-surface-variant hover:bg-surface-container transition-colors"
            aria-label="Close"
          >
            <Icon name="close" />
          </button>
        </div>
        <div className="p-lg overflow-y-auto custom-scrollbar">{children}</div>
      </div>
    </div>
  );
}
