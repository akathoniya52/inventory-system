import { Modal } from "./Modal";
import { Icon } from "./Icon";
import { Spinner } from "./Spinner";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Delete",
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Modal open={open} title={title} onClose={onCancel} maxWidth="max-w-md">
      <div className="flex flex-col gap-6">
        <div className="flex gap-4 items-start">
          <div className="w-10 h-10 rounded-full bg-error-container flex items-center justify-center shrink-0">
            <Icon name="warning" className="text-on-error-container" filled />
          </div>
          <p className="font-body-md text-body-md text-on-surface-variant">{message}</p>
        </div>
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 rounded-lg border border-outline-variant text-on-surface font-label-md text-label-md hover:bg-surface-container transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="px-4 py-2 rounded-lg bg-error text-on-error font-label-md text-label-md hover:opacity-90 transition-opacity flex items-center gap-2 disabled:opacity-50"
          >
            {loading && <Spinner className="h-4 w-4" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}
