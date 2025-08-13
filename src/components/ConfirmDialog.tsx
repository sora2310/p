
import React from 'react';

type Props = {
  open: boolean;
  title?: string;
  description?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export default function ConfirmDialog({
  open,
  title = 'Confirmar acción',
  description,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  destructive = false,
  onConfirm,
  onCancel,
}: Props) {
  const dialogRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    dialogRef.current?.focus();
    return () => prev?.focus();
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-title"
      onKeyDown={(e) => { if (e.key === 'Escape') onCancel(); }}
      onClick={(e) => { if (e.currentTarget === e.target) onCancel(); }}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-white/10 bg-gray-900 p-6 shadow-xl outline-none"
        tabIndex={-1}
        ref={dialogRef}
      >
        <h2 id="confirm-title" className="text-lg font-semibold mb-2">{title}</h2>
        {description && <div className="text-sm text-gray-300 mb-4">{description}</div>}
        <div className="flex justify-end gap-2">
          <button onClick={onCancel} className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20">
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={`px-3 py-2 rounded-lg ${destructive ? 'bg-red-600 hover:bg-red-500' : 'bg-white/10 hover:bg-white/20'}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
