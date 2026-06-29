import { useState } from 'react';
import type { Room, RoomStatus } from '../types';
import { formatCurrency, formatDateTime, roomStatusLabel } from '../utils/format';

const statusAccent: Record<RoomStatus, string> = {
  Available: 'border-emerald-500 bg-emerald-50/30',
  Occupied: 'border-rose-500 bg-rose-50/40',
  Cleaning: 'border-amber-500 bg-amber-50/30',
  Maintenance: 'border-slate-400 bg-slate-50',
};

const statusDot: Record<RoomStatus, string> = {
  Available: 'bg-emerald-500',
  Occupied: 'bg-rose-500',
  Cleaning: 'bg-amber-500',
  Maintenance: 'bg-slate-400',
};

type RoomActionCardProps = {
  room: Room;
  loading: boolean;
  onAction: (room: Room, newStatus: RoomStatus, label: string) => void;
  onPreview?: (room: Room) => void;
};

function ActionButton({
  label,
  variant = 'default',
  disabled,
  onClick,
}: {
  label: string;
  variant?: 'primary' | 'danger' | 'default' | 'ghost';
  disabled?: boolean;
  onClick: () => void;
}) {
  const styles = {
    primary: 'bg-espresso text-white hover:bg-espresso/90',
    danger: 'bg-terracotta text-white hover:bg-terracotta-dark',
    default: 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50',
    ghost: 'text-slate-500 hover:bg-slate-100',
  };
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`flex-1 rounded-lg px-3 py-2.5 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${styles[variant]}`}
    >
      {label}
    </button>
  );
}

export default function RoomActionCard({ room, loading, onAction, onPreview }: RoomActionCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <article
      className={`overflow-hidden rounded-xl border-l-4 border border-slate-200 shadow-sm transition hover:shadow-md ${statusAccent[room.status]}`}
    >
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <span className={`h-2.5 w-2.5 rounded-full ${statusDot[room.status]}`} />
              <p className="text-lg font-bold tracking-tight text-espresso">{room.roomNumber}</p>
            </div>
            <p className="mt-0.5 text-xs text-slate-500">{room.name}</p>
            <p className="text-[11px] text-slate-400">{room.roomType} · Tầng {room.floor}</p>
          </div>
          <span className="shrink-0 rounded-full bg-white/80 px-2.5 py-1 text-[11px] font-semibold text-espresso shadow-sm">
            {roomStatusLabel[room.status]}
          </span>
        </div>

        {room.status === 'Occupied' && (
          <div className="mt-3 rounded-lg border border-rose-200/60 bg-white/70 p-3">
            {room.activeSession ? (
              <>
                <p className="text-[11px] font-medium uppercase tracking-wide text-rose-600">Đang thuê</p>
                <p className="mt-1 text-sm font-medium text-espresso">
                  Vào: {formatDateTime(room.activeSession.checkInLocal)}
                </p>
                {room.activeSession.estimatedTotal != null && (
                  <p className="mt-1 text-sm text-slate-600">
                    Ước tính:{' '}
                    <strong className="text-terracotta">{formatCurrency(room.activeSession.estimatedTotal)}</strong>
                  </p>
                )}
                {onPreview && (
                  <button
                    type="button"
                    onClick={() => onPreview(room)}
                    className="mt-2 text-xs font-medium text-terracotta hover:underline"
                  >
                    Xem trước hóa đơn →
                  </button>
                )}
              </>
            ) : (
              <p className="text-xs text-amber-700">
                ⚠ Phòng đang thuê nhưng chưa có phiên — checkout sẽ không tính tiền.
              </p>
            )}
          </div>
        )}

        {/* Primary actions by state */}
        <div className="mt-4 flex gap-2">
          {room.status === 'Available' && (
            <>
              <ActionButton
                label="Nhận khách"
                variant="primary"
                disabled={loading}
                onClick={() => onAction(room, 'Occupied', 'Nhận khách')}
              />
              <ActionButton
                label="Bảo trì"
                variant="default"
                disabled={loading}
                onClick={() => onAction(room, 'Maintenance', 'Bảo trì')}
              />
            </>
          )}

          {room.status === 'Occupied' && (
            <>
              <ActionButton
                label="Checkout & Thu tiền"
                variant="danger"
                disabled={loading}
                onClick={() => onAction(room, 'Cleaning', 'Checkout')}
              />
              <ActionButton
                label="Checkout → Trống"
                variant="default"
                disabled={loading}
                onClick={() => onAction(room, 'Available', 'Checkout trực tiếp')}
              />
            </>
          )}

          {room.status === 'Cleaning' && (
            <>
              <ActionButton
                label="Sẵn sàng phòng"
                variant="primary"
                disabled={loading}
                onClick={() => onAction(room, 'Available', 'Sẵn sàng')}
              />
              <ActionButton
                label="Nhận khách mới"
                variant="default"
                disabled={loading}
                onClick={() => onAction(room, 'Occupied', 'Nhận khách')}
              />
            </>
          )}

          {room.status === 'Maintenance' && (
            <ActionButton
              label="Hoàn tất bảo trì"
              variant="primary"
              disabled={loading}
              onClick={() => onAction(room, 'Available', 'Hoàn tất bảo trì')}
            />
          )}
        </div>

        {/* Secondary / manual override */}
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="mt-3 w-full text-center text-[11px] text-slate-400 hover:text-slate-600"
        >
          {expanded ? '▲ Ẩn tùy chọn' : '▼ Tùy chọn khác'}
        </button>

        {expanded && (
          <div className="mt-2 grid grid-cols-2 gap-1.5 border-t border-slate-200/60 pt-3">
            {(['Available', 'Occupied', 'Cleaning', 'Maintenance'] as RoomStatus[])
              .filter((s) => s !== room.status)
              .map((s) => (
                <button
                  key={s}
                  type="button"
                  disabled={loading}
                  onClick={() => onAction(room, s, roomStatusLabel[s])}
                  className="rounded-md border border-slate-200 bg-white px-2 py-1.5 text-[11px] font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                >
                  → {roomStatusLabel[s]}
                </button>
              ))}
          </div>
        )}
      </div>
    </article>
  );
}
