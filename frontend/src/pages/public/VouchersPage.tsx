import { useEffect, useState } from 'react';
import { api } from '../../api/client';
import type { Voucher } from '../../types';
import { formatCurrency } from '../../utils/format';

export default function VouchersPage() {
  const [vouchers, setVouchers] = useState<Voucher[]>([]);

  useEffect(() => {
    api.vouchers.getAll(true).then(setVouchers).catch(console.error);
  }, []);

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 md:px-6 md:py-16">
      <p className="text-xs font-semibold tracking-widest text-terracotta uppercase">Ưu đãi</p>
      <h1 className="font-display mt-2 text-4xl font-semibold text-espresso md:text-5xl">Voucher khuyến mãi</h1>
      <p className="mt-3 max-w-2xl text-espresso-muted">
        Nhập mã khi check-in để được giảm giá. Mỗi mã có điều kiện áp dụng riêng.
      </p>

      <div className="mt-12 grid gap-6 md:grid-cols-2">
        {vouchers.map((v) => (
          <article
            key={v.id}
            className="relative overflow-hidden rounded-2xl border border-dashed border-terracotta/40 bg-gradient-to-br from-cream to-cream-dark p-6"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-mono text-2xl font-bold tracking-wider text-terracotta">{v.code}</p>
                <h2 className="font-display mt-2 text-2xl font-semibold">{v.name}</h2>
                {v.description && <p className="mt-2 text-sm text-espresso-muted">{v.description}</p>}
              </div>
              <div className="shrink-0 rounded-xl bg-terracotta px-4 py-3 text-center text-white">
                <p className="text-2xl font-bold">
                  {v.discountType === 'Percentage' ? `-${v.discountValue}%` : formatCurrency(v.discountValue)}
                </p>
                <p className="text-[10px] tracking-wider uppercase opacity-80">Giảm</p>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-3 text-xs text-espresso-muted">
              {v.minDurationHours && <span>Thuê từ {v.minDurationHours} giờ</span>}
              <span>HSD: {new Date(v.validTo).toLocaleDateString('vi-VN')}</span>
              <span>Còn {v.usageLimit - v.usedCount} lượt</span>
            </div>
          </article>
        ))}
      </div>

      {vouchers.length === 0 && (
        <p className="mt-12 text-center text-espresso-muted">Hiện chưa có voucher đang hoạt động.</p>
      )}
    </div>
  );
}
