import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import ConfirmDialog, { type ConfirmOptions, type ConfirmVariant } from '../components/ConfirmDialog';
import { ToastContainer, createToast, type ToastData, type ToastType } from '../components/Toast';

// --- Confirm ---

type ConfirmRequest = ConfirmOptions & {
  resolve: (value: boolean) => void;
};

const ConfirmContext = createContext<((options: ConfirmOptions) => Promise<boolean>) | null>(null);

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error('useConfirm must be used within AdminProviders');
  return ctx;
}

// --- Toast ---

const ToastContext = createContext<((message: string, type?: ToastType) => void) | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within AdminProviders');
  return ctx;
}

// --- Provider ---

export default function AdminProviders({ children }: { children: ReactNode }) {
  const [confirmState, setConfirmState] = useState<ConfirmRequest | null>(null);
  const [toast, setToast] = useState<ToastData | null>(null);

  const confirm = useCallback((options: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      setConfirmState({ ...options, resolve });
    });
  }, []);

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    setToast(createToast(message, type));
  }, []);

  const handleConfirmClose = (confirmed: boolean) => {
    if (confirmState) {
      confirmState.resolve(confirmed);
      setConfirmState(null);
    }
  };

  return (
    <ConfirmContext.Provider value={confirm}>
      <ToastContext.Provider value={showToast}>
        {children}
        <ConfirmDialog
          open={confirmState !== null}
          title={confirmState?.title ?? ''}
          description={confirmState?.description ?? ''}
          roomNumber={confirmState?.roomNumber}
          actionLabel={confirmState?.actionLabel}
          targetStatus={confirmState?.targetStatus}
          details={confirmState?.details}
          variant={confirmState?.variant}
          confirmText={confirmState?.confirmText}
          cancelText={confirmState?.cancelText}
          onConfirm={() => handleConfirmClose(true)}
          onCancel={() => handleConfirmClose(false)}
        />
        <ToastContainer toast={toast} onClose={() => setToast(null)} />
      </ToastContext.Provider>
    </ConfirmContext.Provider>
  );
}

/** Shorthand for delete confirmations */
export function deleteConfirm(
  confirm: (options: ConfirmOptions) => Promise<boolean>,
  itemName: string,
  extra?: Partial<ConfirmOptions>,
) {
  return confirm({
    title: 'Xóa mục này?',
    description: `"${itemName}" sẽ bị xóa vĩnh viễn. Thao tác này không thể hoàn tác.`,
    confirmText: 'Xóa',
    variant: 'delete',
    ...extra,
  });
}

export type { ConfirmOptions, ConfirmVariant };
