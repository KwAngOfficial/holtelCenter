import { useEffect, useState } from 'react';
import { api } from '../../api/client';
import type { HourlyRate } from '../../types';
import { dayTypeLabel, formatCurrency } from '../../utils/format';

export default function PricingPage() {
  const [rates, setRates] = useState<HourlyRate[]>([]);

  useEffect(() => {
    api.hourlyRates.getAll().then(setRates).catch(console.error);
  }, []);

  const grouped = rates.reduce<Record<string, HourlyRate[]>>((acc, rate) => {
    if (!acc[rate.roomType]) acc[rate.roomType] = [];
    acc[rate.roomType].push(rate);
    return acc;
  }, {});

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 md:px-6 md:py-16">
      <p className="text-xs font-semibold tracking-widest text-terracotta uppercase">Bảng giá</p>
      <h1 className="font-display mt-2 text-4xl font-semibold text-espresso md:text-5xl">Giá theo giờ</h1>
      <p className="mt-3 max-w-2xl text-espresso-muted">
        Minh bạch, không phí ẩn. Giá có thể thay đổi vào cuối tuần và ngày lễ.
      </p>

      <div className="mt-12 space-y-10">
        {Object.entries(grouped).map(([roomType, typeRates]) => (
          <section key={roomType}>
            <h2 className="font-display text-3xl font-semibold text-espresso">{roomType}</h2>
            <div className="mt-4 overflow-hidden rounded-2xl border border-cream-dark bg-white">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-cream-dark bg-cream-dark/40">
                  <tr>
                    <th className="px-5 py-3 font-semibold text-espresso">Khung giờ</th>
                    <th className="px-5 py-3 font-semibold text-espresso">Loại ngày</th>
                    <th className="px-5 py-3 text-right font-semibold text-espresso">Giá</th>
                  </tr>
                </thead>
                <tbody>
                  {typeRates.map((rate) => (
                    <tr key={rate.id} className="border-b border-cream-dark/60 last:border-0">
                      <td className="px-5 py-4 font-medium">{rate.label}</td>
                      <td className="px-5 py-4 text-espresso-muted">{dayTypeLabel[rate.dayType]}</td>
                      <td className="px-5 py-4 text-right font-display text-xl font-semibold text-terracotta">
                        {formatCurrency(rate.price)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
