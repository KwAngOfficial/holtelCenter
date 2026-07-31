import { useState } from 'react';
import type { Room, RoomStatus } from '../types';
import { formatCurrency, formatDateTime, roomStatusLabel } from '../utils/format';

const statusAccent: Record<RoomStatus, string> = {
  Available: 'border-emerald-700 bg-emerald-300',
  Occupied: 'border-red-950 bg-red-700',
  Cleaning: 'border-amber-500 bg-amber-50/30',
  Maintenance: 'border-slate-400 bg-slate-50',
};

const statusDot: Record<RoomStatus, string> = {
  Available: 'bg-emerald-700',
  Occupied: 'bg-red-950',
  Cleaning: 'bg-amber-500',
  Maintenance: 'bg-slate-400',
};

const isOccupiedStyle = (status: RoomStatus) => status === 'Occupied';
const isAvailableStyle = (status: RoomStatus) => status === 'Available';


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

export default function RoomActionCard({ room, loading, onAction, onPreview, onEditCheckIn }: RoomActionCardProps) {
  const [expanded, setExpanded] = useState(false);
  const occupied = isOccupiedStyle(room.status);
  const available = isAvailableStyle(room.status);

  return (
    <article
      className={`overflow-hidden rounded-xl border-l-4 border border-slate-200 shadow-sm transition hover:shadow-md ${statusAccent[room.status]}`}
    >
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <span className={`h-2.5 w-2.5 rounded-full ${statusDot[room.status]} ${occupied ? 'ring-2 ring-white/50' : ''}`} />
              <p className={`text-lg font-bold tracking-tight ${occupied ? 'text-white' : available ? 'text-emerald-950' : 'text-espresso'}`}>
                {room.roomNumber}
              </p>
            </div>
            <p className={`mt-0.5 text-xs ${occupied ? 'text-red-100' : available ? 'text-emerald-900' : 'text-slate-500'}`}>
              {room.name}
            </p>
            <p className={`text-[11px] ${occupied ? 'text-red-200' : available ? 'text-emerald-800/80' : 'text-slate-400'}`}>
              {room.roomType} · Tầng {room.floor}
            </p>
          </div>
          <span
            className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold shadow-sm ${
              occupied
                ? 'bg-red-950 text-white'
                : available
                  ? 'bg-emerald-800 text-white'
                  : 'bg-white/80 text-espresso'
            }`}
          >
            {roomStatusLabel[room.status]}
          </span>
        </div>

        {room.status === 'Occupied' && (
          <div className="mt-3 rounded-lg border border-red-900/40 bg-red-950/40 p-3">
            {room.activeSession ? (
              <>
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-red-200">Đang thuê</p>
                  {onEditCheckIn && (
                    <button
                      type="button"
                      title="Chỉnh giờ vào"
                      disabled={loading}
                      onClick={() => onEditCheckIn(room)}
                      className="rounded-md p-1 text-red-100 transition hover:bg-red-950/50 hover:text-white disabled:opacity-50"
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
                <p className="mt-1 text-sm font-medium text-white">
                  Vào: {formatDateTime(room.activeSession.checkInLocal)}
                </p>
                {room.activeSession.estimatedTotal != null && (
                  <p className="mt-1 text-sm text-red-100">
                    Ước tính:{' '}
                    <strong className="text-white">{formatCurrency(room.activeSession.estimatedTotal)}</strong>
                  </p>
                )}
                {onPreview && (
                  <button
                    type="button"
                    onClick={() => onPreview(room)}
                    className="mt-2 text-xs font-medium text-white underline decoration-red-200 underline-offset-2 hover:text-red-100"
                  >
                    Xem trước hóa đơn →
                  </button>
                )}
              </>
            ) : (
              <p className="text-xs text-amber-200">
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
          className={`mt-3 w-full text-center text-[11px] hover:underline ${
            occupied ? 'text-red-200 hover:text-white' : available ? 'text-emerald-800 hover:text-emerald-950' : 'text-slate-400 hover:text-slate-600'
          }`}
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
