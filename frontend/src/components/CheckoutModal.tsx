import type { CheckoutBilling } from '../types';
import { formatCurrency, formatDateTime } from '../utils/format';

type CheckoutModalProps = {
  billing: CheckoutBilling;
  onClose: () => void;
  preview?: boolean;
};

export default function CheckoutModal({ billing, onClose, preview = false }: CheckoutModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-xl">
        <div className="border-b border-slate-100 px-6 py-5">
          <p className="text-xs font-semibold tracking-widest text-terracotta uppercase">
            {preview ? 'Xem trước hóa đơn' : 'Thanh toán phòng'}
          </p>
          <h2 className="font-display mt-1 text-2xl font-semibold text-espresso">
            Phòng {billing.roomNumber} — {billing.roomName}
          </h2>
        </div>

        <div className="space-y-4 px-6 py-5">
          <div className="grid gap-3 rounded-xl bg-slate-50 p-4 text-sm sm:grid-cols-2">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase">Giờ vào</p>
              <p className="mt-1 font-semibold text-espresso">{formatDateTime(billing.checkInLocal)}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase">Giờ ra</p>
              <p className="mt-1 font-semibold text-espresso">{formatDateTime(billing.checkOutLocal)}</p>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 p-4">
            <p className="text-sm font-semibold text-espresso">Chi tiết tính tiền</p>
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              {billing.breakdownLines.map((line) => (
                <li key={line} className="border-b border-slate-100 pb-2 last:border-0 last:pb-0">
                  {line}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-xl bg-espresso p-4 text-white">
            <p className="text-xs tracking-widest uppercase opacity-80">Tổng thanh toán</p>
            <p className="font-display mt-1 text-4xl font-semibold">{formatCurrency(billing.totalAmount)}</p>
            {billing.overnightNights > 0 && (
              <p className="mt-2 text-xs opacity-80">
                Gồm {billing.overnightNights} đêm qua đêm · {billing.totalBillableHours} giờ tính theo giờ (nếu có)
              </p>
            )}
          </div>

          <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-3 text-xs text-slate-500">
            <p className="font-medium text-slate-700">Quy tắc tính tiền</p>
            <ul className="mt-2 list-inside list-disc space-y-1">
              <li>Giờ đầu: 80.000đ · mỗi giờ tiếp: +10.000đ (làm tròn lên 1 giờ)</li>
              <li>Qua đêm (20:00 – 06:00): 180.000đ/đêm</li>
              <li>Thời gian vượt sau qua đêm: +10.000đ/giờ</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-100 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-xl bg-terracotta py-3 text-sm font-semibold text-white hover:bg-terracotta-dark"
          >
            {preview ? 'Đóng' : 'Đã thu tiền — Đóng'}
          </button>
        </div>
      </div>
    </div>
  );
}
