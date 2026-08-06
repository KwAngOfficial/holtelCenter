import { useState } from 'react';
import { api } from '../api/client';
import type { CheckoutBilling } from '../types';
import { formatCurrency, formatDateTime } from '../utils/format';

type CheckoutModalProps = {
  billing: CheckoutBilling;
  onClose: () => void;
  preview?: boolean;
  onPaymentUpdated?: () => void;
};

export default function CheckoutModal({
  billing,
  onClose,
  preview = false,
  onPaymentUpdated,
}: CheckoutModalProps) {
  const [marking, setMarking] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState(billing.paymentStatus ?? 'Unpaid');
  const bank = billing.bankTransfer;
  const transferContent = bank?.transferContent ?? billing.transferContent;

  const handleMarkCash = async () => {
    if (preview) return;
    setMarking(true);
    try {
      await api.bank.markPaid(billing.bookingId);
      setPaymentStatus('Manual');
      onPaymentUpdated?.();
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : 'Không đánh dấu được');
    } finally {
      setMarking(false);
    }
  };

  const paid = paymentStatus === 'Paid' || paymentStatus === 'Manual';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 sm:p-4">
      <div className="max-h-[92dvh] w-full max-w-lg overflow-y-auto overscroll-contain rounded-2xl bg-white shadow-xl">
        <div className="border-b border-slate-100 px-5 py-4 sm:px-6 sm:py-5">
          <p className="text-xs font-semibold tracking-widest text-terracotta uppercase">
            {preview ? 'Xem trước hóa đơn' : 'Thanh toán phòng'}
          </p>
          <h2 className="font-display mt-1 text-xl font-semibold text-espresso sm:text-2xl">
            Phòng {billing.roomNumber} — {billing.roomName}
          </h2>
          <p className="mt-1 text-xs text-slate-500">Booking #{billing.bookingId}</p>
        </div>

        <div className="space-y-4 px-5 py-4 sm:px-6 sm:py-5">
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
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-xs tracking-widest uppercase opacity-80">Tổng thanh toán</p>
                <p className="font-display mt-1 text-3xl font-semibold sm:text-4xl">
                  {formatCurrency(billing.totalAmount)}
                </p>
              </div>
              <span
                className={`shrink-0 rounded-md px-2 py-1 text-[10px] font-bold uppercase ${
                  paid ? 'bg-emerald-400/20 text-emerald-100' : 'bg-white/15 text-white/90'
                }`}
              >
                {paid ? (paymentStatus === 'Manual' ? 'Đã thu' : 'CK OK') : 'Chưa TT'}
              </span>
            </div>
            {billing.overnightNights > 0 && (
              <p className="mt-2 text-xs opacity-80">
                Gồm {billing.overnightNights} đêm qua đêm · {billing.totalBillableHours} giờ tính theo giờ (nếu có)
              </p>
            )}
          </div>

          {bank && (
            <div className="rounded-xl border border-slate-200 p-4">
              <p className="text-sm font-semibold text-espresso">Chuyển khoản / VietQR</p>
              <div className="mt-3 flex flex-col items-center gap-4 sm:flex-row sm:items-start">
                <img
                  src={bank.qrImageUrl}
                  alt="VietQR thanh toán"
                  className="h-44 w-44 shrink-0 rounded-xl border border-slate-100 bg-white object-contain"
                />
                <div className="min-w-0 flex-1 space-y-2 text-sm">
                  <p>
                    <span className="text-xs text-slate-500">Ngân hàng</span>
                    <br />
                    <span className="font-medium text-espresso">{bank.bankName || bank.bankBin}</span>
                  </p>
                  <p>
                    <span className="text-xs text-slate-500">Số TK</span>
                    <br />
                    <span className="font-mono font-semibold tracking-wide text-espresso">
                      {bank.accountNumber}
                    </span>
                  </p>
                  <p>
                    <span className="text-xs text-slate-500">Chủ TK</span>
                    <br />
                    <span className="font-medium uppercase text-espresso">{bank.accountName}</span>
                  </p>
                  {transferContent && (
                    <p>
                      <span className="text-xs text-slate-500">Nội dung CK (bắt buộc)</span>
                      <br />
                      <span className="rounded bg-amber-50 px-2 py-0.5 font-mono text-base font-bold tracking-wider text-amber-950 ring-1 ring-amber-100">
                        {transferContent}
                      </span>
                    </p>
                  )}
                  <p className="text-[11px] leading-relaxed text-slate-500">
                    Webhook sẽ khớp booking theo nội dung CK. Không sửa nội dung khi chuyển.
                  </p>
                </div>
              </div>
            </div>
          )}

          {!bank && transferContent && (
            <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
              Nội dung CK gợi ý: <strong className="font-mono text-espresso">{transferContent}</strong>
              <span className="mt-1 block text-slate-400">
                Bật CK tại mục Ngân hàng để hiện QR tự động
              </span>
            </div>
          )}

          <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-3 text-xs text-slate-500">
            <p className="font-medium text-slate-700">Quy tắc tính tiền</p>
            <ul className="mt-2 list-inside list-disc space-y-1">
              <li>Giờ đầu: 80.000đ · mỗi giờ tiếp: +10.000đ (làm tròn lên 1 giờ)</li>
              <li>Qua đêm (20:00 – 06:00): 180.000đ/đêm</li>
              <li>Thời gian vượt sau qua đêm: +10.000đ/giờ</li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col gap-2 border-t border-slate-100 px-5 py-4 sm:px-6">
          {!preview && !paid && (
            <button
              type="button"
              disabled={marking}
              onClick={handleMarkCash}
              className="w-full rounded-xl border border-slate-200 bg-white py-3 text-sm font-semibold text-espresso hover:bg-slate-50 disabled:opacity-50"
            >
              {marking ? 'Đang ghi…' : 'Đã thu tiền mặt'}
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-xl bg-terracotta py-3 text-sm font-semibold text-white hover:bg-terracotta-dark"
          >
            {preview ? 'Đóng' : paid ? 'Đóng' : 'Đóng (chưa đánh dấu TT)'}
          </button>
        </div>
      </div>
    </div>
  );
}
