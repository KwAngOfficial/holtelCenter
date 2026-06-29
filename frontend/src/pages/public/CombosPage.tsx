import { useEffect, useState } from 'react';
import { api } from '../../api/client';
import type { Combo } from '../../types';
import { formatCurrency } from '../../utils/format';

export default function CombosPage() {
  const [combos, setCombos] = useState<Combo[]>([]);

  useEffect(() => {
    api.combos.getAll(true).then(setCombos).catch(console.error);
  }, []);

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 md:px-6 md:py-16">
      <p className="text-xs font-semibold tracking-widest text-terracotta uppercase">Combo</p>
      <h1 className="font-display mt-2 text-4xl font-semibold text-espresso md:text-5xl">Gói tiết kiệm</h1>
      <p className="mt-3 max-w-2xl text-espresso-muted">
        Phòng + đồ uống/snack — giá ưu đãi hơn mua lẻ.
      </p>

      <div className="mt-12 grid gap-8 md:grid-cols-2">
        {combos.map((combo) => {
          const itemsValue = combo.items.reduce((sum, i) => sum + i.productPrice * i.quantity, 0);
          return (
            <article key={combo.id} className="overflow-hidden rounded-2xl border border-cream-dark bg-white shadow-sm">
              <img
                src={combo.imageUrl ?? 'https://picsum.photos/seed/combo/800/400'}
                alt={combo.name}
                className="aspect-[2/1] w-full object-cover"
              />
              <div className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-medium text-sage">{combo.roomType} · {combo.durationHours} giờ</p>
                    <h2 className="font-display mt-1 text-3xl font-semibold">{combo.name}</h2>
                  </div>
                  <p className="font-display shrink-0 text-3xl font-semibold text-terracotta">{formatCurrency(combo.comboPrice)}</p>
                </div>
                <p className="mt-3 text-sm text-espresso-muted">{combo.description}</p>
                <ul className="mt-4 space-y-2 border-t border-cream-dark pt-4">
                  {combo.items.map((item) => (
                    <li key={item.id} className="flex justify-between text-sm">
                      <span>{item.quantity}x {item.productName}</span>
                      <span className="text-espresso-muted">{formatCurrency(item.productPrice * item.quantity)}</span>
                    </li>
                  ))}
                </ul>
                {itemsValue > 0 && (
                  <p className="mt-3 text-xs text-sage">
                    Tiết kiệm so với mua lẻ sản phẩm
                  </p>
                )}
              </div>
            </article>
          );
        })}
      </div>

      {combos.length === 0 && (
        <p className="mt-12 text-center text-espresso-muted">Chưa có combo nào. Quay lại sau nhé!</p>
      )}
    </div>
  );
}
