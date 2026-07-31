import { useState } from 'react';
import type { Room } from '../types';
import { formatDateTime } from '../utils/format';

type EditCheckInModalProps = {
  room: Room;
  saving: boolean;
  onSave: (checkInLocal: string) => void;
  onClose: () => void;
};

/** Convert API local datetime to `datetime-local` value (yyyy-MM-ddTHH:mm). */
export function toDatetimeLocalValue(isoOrLocal: string): string {
  const m = isoOrLocal.match(/^(\d{4}-\d{2}-\d{2})[T ](\d{2}:\d{2})/);
  if (m) return `${m[1]}T${m[2]}`;

  const d = new Date(isoOrLocal);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function EditCheckInModal({ room, saving, onSave, onClose }: EditCheckInModalProps) {
  const session = room.activeSession;
  const [value, setValue] = useState(() =>
    session ? toDatetimeLocalValue(session.checkInLocal) : '',
  );

  if (!session) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
        <div className="border-b border-slate-100 px-6 py-5">
          <p className="text-xs font-semibold tracking-widest text-terracotta uppercase">Chỉnh giờ thuê</p>
          <h2 className="font-display mt-1 text-2xl font-semibold text-espresso">
            Phòng {room.roomNumber}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Hiện tại: {formatDateTime(session.checkInLocal)}
          </p>
        </div>

        <form
          className="space-y-4 px-6 py-5"
          onSubmit={(e) => {
            e.preventDefault();
            if (!value) return;
            onSave(value.length === 16 ? `${value}:00` : value);
          }}
        >
          <label className="block">
            <span className="text-xs font-medium tracking-wide text-slate-500 uppercase">Giờ vào (VN)</span>
            <input
              type="datetime-local"
              required
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-espresso outline-none focus:border-espresso"
            />
          </label>

          <p className="text-xs text-slate-500">
            Đổi giờ vào sẽ cập nhật ước tính tiền khi checkout. Không chọn giờ sau thời điểm hiện tại.
          </p>

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={saving || !value}
              className="flex-1 rounded-xl bg-espresso px-4 py-3 text-sm font-semibold text-white hover:bg-espresso/90 disabled:opacity-50"
            >
              {saving ? 'Đang lưu…' : 'Lưu giờ vào'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
