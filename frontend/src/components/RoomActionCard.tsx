import { useState } from 'react';
import type { Room, RoomStatus } from '../types';
import { formatCurrency, formatDateTime, roomStatusLabel } from '../utils/format';

const statusStripe: Record<RoomStatus, string> = {
  Available: 'bg-emerald-600',
  Occupied: 'bg-red-700',
  Cleaning: 'bg-amber-500',
  Maintenance: 'bg-slate-400',
};

const statusBadge: Record<RoomStatus, string> = {
  Available: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
  Occupied: 'bg-red-50 text-red-800 ring-red-200',
  Cleaning: 'bg-amber-50 text-amber-900 ring-amber-200',
  Maintenance: 'bg-slate-100 text-slate-700 ring-slate-200',
};

const statusDot: Record<RoomStatus, string> = {
  Available: 'bg-emerald-600',
  Occupied: 'bg-red-700',
  Cleaning: 'bg-amber-500',
  Maintenance: 'bg-slate-400',
};

type RoomActionCardProps = {
  room: Room;
  loading: boolean;
  onAction: (room: Room, newStatus: RoomStatus, label: string) => void;
  onPreview?: (room: Room) => void;
  onEditCheckIn?: (room: Room) => void;
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
    primary: 'bg-espresso text-white hover:bg-espresso/90 shadow-sm',
    danger: 'bg-terracotta text-white hover:bg-terracotta-dark shadow-sm',
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

export default function RoomActionCard({ room, loading, onAction, onPreview, onEditCheckIn }: RoomActionCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-[0_1px_2px_rgba(44,36,32,0.04)] transition hover:border-slate-300 hover:shadow-[0_8px_24px_rgba(44,36,32,0.08)]">
      <div className={`h-1 w-full shrink-0 ${statusStripe[room.status]}`} aria-hidden />

      <div className="flex flex-1 flex-col p-3.5 sm:p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className={`h-2 w-2 shrink-0 rounded-full ${statusDot[room.status]}`} aria-hidden />
              <p className="text-2xl font-bold tracking-tight text-espresso tabular-nums leading-none">
                {room.roomNumber}
              </p>
            </div>
            <p className="mt-1.5 truncate text-sm font-medium text-espresso" title={room.name}>
              {room.name}
            </p>
            <p className="mt-0.5 text-[11px] text-slate-400">{room.roomType}</p>
          </div>
          <span
            className={`shrink-0 rounded-md px-2 py-1 text-[10px] font-bold tracking-wide uppercase ring-1 ring-inset ${statusBadge[room.status]}`}
          >
            {roomStatusLabel[room.status]}
          </span>
        </div>

        {room.status === 'Occupied' && (
          <div className="mt-3 rounded-lg border border-red-100 bg-red-50/60 p-3">
            {room.activeSession ? (
              <>
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[10px] font-semibold tracking-wide text-red-700/80 uppercase">
                    Phiên thuê
                  </p>
                  {onEditCheckIn && (
                    <button
                      type="button"
                      title="Chỉnh giờ vào"
                      disabled={loading}
                      onClick={() => onEditCheckIn(room)}
                      className="rounded-md p-1 text-red-700/70 transition hover:bg-red-100 hover:text-red-900 disabled:opacity-50"
                      aria-label="Chỉnh giờ thuê"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
                        <path
                          fillRule="evenodd"
                          d="M7.84 1.804A1 1 0 018.82 1h2.36a1 1 0 01.98.804l.331 1.652a6.993 6.993 0 011.929 1.115l1.598-.54a1 1 0 011.186.447l1.18 2.044a1 1 0 01-.205 1.251l-1.267 1.113a7.047 7.047 0 010 2.228l1.267 1.113a1 1 0 01.206 1.25l-1.18 2.045a1 1 0 01-1.187.447l-1.598-.54a6.993 6.993 0 01-1.929 1.115l-.33 1.652a1 1 0 01-.98.804H8.82a1 1 0 01-.98-.804l-.331-1.652a6.993 6.993 0 01-1.929-1.115l-1.598.54a1 1 0 01-1.186-.447l-1.18-2.044a1 1 0 01.205-1.251l1.267-1.114a7.05 7.05 0 010-2.227L1.821 7.773a1 1 0 01-.206-1.25l1.18-2.045a1 1 0 011.187-.447l1.598.54A6.993 6.993 0 017.51 3.456l.33-1.652zM10 13a3 3 0 100-6 3 3 0 000 6z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                  )}
                </div>
                <p className="mt-1 text-sm font-medium text-espresso">
                  Vào: {formatDateTime(room.activeSession.checkInLocal)}
                </p>
                {room.activeSession.estimatedTotal != null && (
                  <p className="mt-1 text-sm text-slate-600">
                    Ước tính:{' '}
                    <strong className="font-semibold text-espresso">
                      {formatCurrency(room.activeSession.estimatedTotal)}
                    </strong>
                  </p>
                )}
                {onPreview && (
                  <button
                    type="button"
                    onClick={() => onPreview(room)}
                    className="mt-2 text-xs font-semibold text-terracotta hover:underline"
                  >
                    Xem trước hóa đơn →
                  </button>
                )}
              </>
            ) : (
              <p className="text-xs text-amber-800">
                Phòng đang thuê nhưng chưa có phiên — checkout sẽ không tính tiền.
              </p>
            )}
          </div>
        )}

        <div className="mt-auto flex flex-col pt-3">
          <div className="flex gap-2">
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
                  label="→ Trống"
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

          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="mt-2 w-full rounded-md py-1 text-center text-[11px] font-medium text-slate-400 transition hover:bg-slate-50 hover:text-slate-600"
          >
            {expanded ? 'Ẩn tùy chọn' : 'Tùy chọn khác'}
          </button>

          {expanded && (
            <div className="mt-1 grid grid-cols-2 gap-1.5 border-t border-slate-100 pt-2">
              {(['Available', 'Occupied', 'Cleaning', 'Maintenance'] as RoomStatus[])
                .filter((s) => s !== room.status)
                .map((s) => (
                  <button
                    key={s}
                    type="button"
                    disabled={loading}
                    onClick={() => onAction(room, s, roomStatusLabel[s])}
                    className="rounded-md border border-slate-200 bg-slate-50/80 px-2 py-1.5 text-[11px] font-medium text-slate-600 hover:bg-white disabled:opacity-50"
                  >
                    → {roomStatusLabel[s]}
                  </button>
                ))}
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
