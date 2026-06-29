import { useEffect, useState } from 'react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export type ToastData = {
  id: number;
  message: string;
  type: ToastType;
};

const config: Record<ToastType, { icon: string; bar: string; bg: string; border: string; title: string }> = {
  success: {
    icon: '✓',
    bar: 'bg-emerald-500',
    bg: 'bg-white',
    border: 'border-emerald-200',
    title: 'Thành công',
  },
  error: {
    icon: '✕',
    bar: 'bg-rose-500',
    bg: 'bg-white',
    border: 'border-rose-200',
    title: 'Lỗi',
  },
  warning: {
    icon: '!',
    bar: 'bg-amber-500',
    bg: 'bg-white',
    border: 'border-amber-200',
    title: 'Lưu ý',
  },
  info: {
    icon: 'i',
    bar: 'bg-terracotta',
    bg: 'bg-white',
    border: 'border-terracotta/30',
    title: 'Thông báo',
  },
};

type ToastProps = {
  toast: ToastData;
  duration?: number;
  onClose: () => void;
};

export default function Toast({ toast, duration = 4500, onClose }: ToastProps) {
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(100);
  const style = config[toast.type];

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));

    const start = Date.now();
    const tick = setInterval(() => {
      const elapsed = Date.now() - start;
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(remaining);
      if (remaining <= 0) clearInterval(tick);
    }, 30);

    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onClose, 280);
    }, duration);

    return () => {
      clearTimeout(timer);
      clearInterval(tick);
    };
  }, [toast.id, duration, onClose]);

  return (
    <div
      role="alert"
      className={`pointer-events-auto w-full max-w-sm overflow-hidden rounded-xl border shadow-lg shadow-black/10 transition-all duration-300 ease-out ${style.bg} ${style.border} ${
        visible ? 'translate-x-0 opacity-100' : 'translate-x-6 opacity-0'
      }`}
    >
      <div className="flex items-start gap-3 p-4">
        <span
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white ${style.bar}`}
        >
          {style.icon}
        </span>
        <div className="min-w-0 flex-1 pt-0.5">
          <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">{style.title}</p>
          <p className="mt-0.5 text-sm leading-relaxed text-espresso">{toast.message}</p>
        </div>
        <button
          type="button"
          onClick={() => {
            setVisible(false);
            setTimeout(onClose, 280);
          }}
          className="shrink-0 rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
          aria-label="Đóng"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div className="h-1 bg-slate-100">
        <div
          className={`h-full transition-[width] duration-100 ease-linear ${style.bar}`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

type ToastContainerProps = {
  toast: ToastData | null;
  onClose: () => void;
};

export function ToastContainer({ toast, onClose }: ToastContainerProps) {
  if (!toast) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 top-4 z-[100] flex justify-center px-4 sm:inset-x-auto sm:right-6 sm:left-auto sm:justify-end">
      <Toast key={toast.id} toast={toast} onClose={onClose} />
    </div>
  );
}

let toastId = 0;
export function createToast(message: string, type: ToastType = 'info'): ToastData {
  return { id: ++toastId, message, type };
}
