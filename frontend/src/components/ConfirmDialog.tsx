import { useEffect } from 'react';
import type { RoomStatus } from '../types';
import { roomStatusLabel } from '../utils/format';

export type ConfirmVariant = 'checkout' | 'checkin' | 'delete' | 'default';

export type ConfirmOptions = {
  title: string;
  description: string;
  roomNumber?: string;
  actionLabel?: string;
  targetStatus?: RoomStatus;
  details?: { label: string; value: string }[];
  variant?: ConfirmVariant;
  confirmText?: string;
  cancelText?: string;
};

type ConfirmDialogProps = ConfirmOptions & {
  open: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

const variantStyle: Record<ConfirmVariant, { accent: string; icon: string; confirmBtn: string }> = {
  checkout: {
    accent: 'bg-rose-50 border-rose-200 text-rose-800',
    icon: '💳',
    confirmBtn: 'bg-terracotta hover:bg-terracotta-dark text-white',
  },
  checkin: {
    accent: 'bg-emerald-50 border-emerald-200 text-emerald-800',
    icon: '🔑',
    confirmBtn: 'bg-espresso hover:bg-espresso/90 text-white',
  },
  delete: {
    accent: 'bg-rose-50 border-rose-200 text-rose-800',
    icon: '🗑',
    confirmBtn: 'bg-rose-600 hover:bg-rose-700 text-white',
  },
  default: {
    accent: 'bg-slate-50 border-slate-200 text-slate-700',
    icon: '↔',
    confirmBtn: 'bg-espresso hover:bg-espresso/90 text-white',
  },
};

export default function ConfirmDialog({
  open,
  title,
  description,
  roomNumber,
  actionLabel,
  targetStatus,
  details,
  variant = 'default',
  confirmText = 'Xác nhận',
  cancelText = 'Hủy',
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const style = variantStyle[variant];

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onCancel]);

  if (!open) return null;

  const metaItems: { label: string; value: string }[] = details ?? [];
  if (actionLabel) metaItems.unshift({ label: 'Thao tác', value: actionLabel });
  if (targetStatus) metaItems.push({ label: 'Chuyển sang', value: roomStatusLabel[targetStatus] });

  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center bg-espresso/40 p-4 backdrop-blur-sm"
      onClick={onCancel}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl shadow-black/20"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 pt-6 pb-4">
          <div className="flex items-start gap-4">
            <span
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border text-xl ${style.accent}`}
            >
              {style.icon}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold tracking-widest text-slate-400 uppercase">Xác nhận</p>
              <h2 id="confirm-title" className="font-display mt-1 text-xl font-semibold text-espresso">
                {title}
              </h2>
              {roomNumber && (
                <p className="mt-1 text-sm font-medium text-terracotta">Phòng {roomNumber}</p>
              )}
            </div>
          </div>

          <p className="mt-4 text-sm leading-relaxed text-slate-600">{description}</p>

          {metaItems.length > 0 && (
            <div className="mt-4 space-y-1.5 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm">
              {metaItems.map((item) => (
                <p key={item.label}>
                  <span className="text-slate-500">{item.label}:</span>{' '}
                  <strong className="text-espresso">{item.value}</strong>
                </p>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-3 border-t border-slate-100 bg-slate-50/80 px-6 py-4">
          <button
            type="button"
            disabled={loading}
            onClick={onCancel}
            className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={onConfirm}
            className={`flex-1 rounded-xl px-4 py-3 text-sm font-semibold transition disabled:opacity-50 ${style.confirmBtn}`}
          >
            {loading ? 'Đang xử lý...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
