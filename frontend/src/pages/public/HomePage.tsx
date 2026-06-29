import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api/client';
import type { Combo, Room } from '../../types';
import { SITE } from '../../constants/site';
import { formatCurrency, roomStatusColor, roomStatusLabel } from '../../utils/format';

export default function HomePage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [combos, setCombos] = useState<Combo[]>([]);

  useEffect(() => {
    api.rooms.getAvailability().then(setRooms).catch(console.error);
    api.combos.getAll(true).then(setCombos).catch(console.error);
  }, []);

  const availableCount = rooms.filter((r) => r.status === 'Available').length;

  return (
    <>
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: 'url(https://picsum.photos/seed/holtel-hero/1920/1080)' }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-espresso/85 via-espresso/60 to-espresso/30" />
        <div className="relative mx-auto flex min-h-[85dvh] max-w-6xl flex-col justify-end px-4 pb-16 pt-32 md:px-6 md:pb-24">
          <span className="mb-4 inline-flex w-fit rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[10px] font-medium tracking-[0.2em] text-white/90 uppercase backdrop-blur-sm">
            Chào mừng bạn
          </span>
          <h1 className="font-display max-w-3xl text-5xl leading-[1.05] font-semibold text-white md:text-7xl text-balance">
            Nghỉ ngơi thoải mái, giá theo giờ linh hoạt
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-white/80 md:text-lg">
            Sao Dem Holtel — không gian riêng tư, sạch sẽ và gần gũi. Hiện có{' '}
            <strong className="text-white">{availableCount} phòng trống</strong> sẵn sàng phục vụ bạn.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href={`tel:${SITE.phone}`}
              className="inline-flex items-center gap-2 rounded-full bg-terracotta px-6 py-3 text-sm font-semibold text-white transition hover:bg-terracotta-dark"
            >
              Gọi đặt phòng
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15">→</span>
            </a>
            <Link
              to="/phong"
              className="inline-flex items-center rounded-full border border-white/30 bg-white/10 px-6 py-3 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/20"
            >
              Xem phòng trống
            </Link>
          </div>
        </div>
      </section>

      <section className="border-b border-cream-dark bg-white">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-4 px-4 py-8 md:grid-cols-4 md:px-6">
          {[
            { label: 'Mở cửa', value: '24/7' },
            { label: 'WiFi', value: 'Miễn phí' },
            { label: 'Bãi xe', value: 'Riêng tư' },
            { label: 'Thanh toán', value: 'Linh hoạt' },
          ].map((item) => (
            <div key={item.label} className="text-center md:text-left">
              <p className="text-xs tracking-widest text-espresso-muted uppercase">{item.label}</p>
              <p className="font-display mt-1 text-2xl font-semibold text-espresso">{item.value}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-20 md:px-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold tracking-widest text-terracotta uppercase">Phòng nổi bật</p>
            <h2 className="font-display mt-2 text-4xl font-semibold text-espresso md:text-5xl">Không gian dành cho bạn</h2>
          </div>
          <Link to="/phong" className="text-sm font-semibold text-terracotta hover:text-terracotta-dark">
            Xem tất cả phòng →
          </Link>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {rooms.slice(0, 3).map((room) => (
            <article key={room.id} className="group overflow-hidden rounded-2xl border border-cream-dark bg-white shadow-sm transition hover:shadow-md">
              <div className="relative aspect-[4/3] overflow-hidden">
                <img
                  src={room.imageUrl ?? 'https://picsum.photos/seed/default/800/600'}
                  alt={room.name}
                  className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                />
                <span className={`absolute top-3 right-3 rounded-full border px-3 py-1 text-xs font-medium ${roomStatusColor[room.status]}`}>
                  {roomStatusLabel[room.status]}
                </span>
              </div>
              <div className="p-5">
                <p className="text-xs font-medium text-terracotta">{room.roomType}</p>
                <h3 className="font-display mt-1 text-2xl font-semibold text-espresso">{room.name}</h3>
                <p className="mt-2 line-clamp-2 text-sm text-espresso-muted">{room.description}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      {combos.length > 0 && (
        <section className="bg-cream-dark/60 py-20">
          <div className="mx-auto max-w-6xl px-4 md:px-6">
            <p className="text-xs font-semibold tracking-widest text-sage uppercase">Combo tiết kiệm</p>
            <h2 className="font-display mt-2 text-4xl font-semibold text-espresso">Gói ưu đãi hấp dẫn</h2>
            <div className="mt-10 grid gap-6 md:grid-cols-2">
              {combos.map((combo) => (
                <div key={combo.id} className="flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm md:flex-row">
                  <img
                    src={combo.imageUrl ?? 'https://picsum.photos/seed/combo/600/400'}
                    alt={combo.name}
                    className="aspect-[4/3] w-full object-cover md:w-2/5 md:aspect-auto"
                  />
                  <div className="flex flex-1 flex-col p-6">
                    <h3 className="font-display text-2xl font-semibold text-espresso">{combo.name}</h3>
                    <p className="mt-2 flex-1 text-sm text-espresso-muted">{combo.description}</p>
                    <p className="mt-4 font-display text-3xl font-semibold text-terracotta">{formatCurrency(combo.comboPrice)}</p>
                  </div>
                </div>
              ))}
            </div>
            <Link to="/combo" className="mt-8 inline-block text-sm font-semibold text-terracotta">
              Xem tất cả combo →
            </Link>
          </div>
        </section>
      )}

      <section className="mx-auto max-w-6xl px-4 py-20 text-center md:px-6">
        <h2 className="font-display text-4xl font-semibold text-espresso md:text-5xl text-balance">
          Sẵn sàng nghỉ ngơi?
        </h2>
        <p className="mx-auto mt-4 max-w-lg text-espresso-muted">
          Gọi ngay hoặc ghé thăm — chúng tôi luôn sẵn sàng chào đón bạn.
        </p>
        <a
          href="tel:0866642875"
          className="mt-8 inline-flex rounded-full bg-espresso px-8 py-3.5 text-sm font-semibold text-cream transition hover:bg-espresso/90"
        >
          📞 {SITE.phoneDisplay}
        </a>
      </section>
    </>
  );
}
