import { MAPS_DIRECTIONS_URL, MAPS_EMBED_URL, SITE } from '../constants/site';

export default function LocationMap() {
  return (
    <section id="ban-do" className="bg-cream-dark/40 py-20">
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-semibold tracking-widest text-terracotta uppercase">Vị trí</p>
              <h2 className="font-display mt-2 text-4xl font-semibold text-espresso md:text-5xl">Tìm đường đến {SITE.name}</h2>
              <p className="mt-3 max-w-xl text-espresso-muted">
                {SITE.placeName} — mở Google Maps để xem chỉ đường chi tiết từ vị trí của bạn.
              </p>
            </div>
            <a
              href={MAPS_DIRECTIONS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex shrink-0 items-center gap-2 rounded-full bg-terracotta px-6 py-3 text-sm font-semibold text-white transition hover:bg-terracotta-dark"
            >
              Chỉ đường
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15">↗</span>
            </a>
          </div>

        <div className="overflow-hidden rounded-2xl border border-cream-dark bg-white shadow-sm">
          <iframe
            title={`Bản đồ ${SITE.name}`}
            src={MAPS_EMBED_URL}
            className="h-72 w-full border-0 md:h-96"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            allowFullScreen
          />
          <div className="flex flex-col gap-3 border-t border-cream-dark px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div>
              <p className="font-medium text-espresso">{SITE.placeName}</p>
              <p className="text-sm text-espresso-muted">Mở cửa 24/7 · Bãi xe tiện lợi</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <a
                href={MAPS_DIRECTIONS_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full bg-espresso px-4 py-2 text-sm font-medium text-cream transition hover:bg-espresso/90"
              >
                Chỉ đường
              </a>
              <a
                href={SITE.mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full border border-espresso/15 px-4 py-2 text-sm font-medium text-espresso-muted transition hover:border-espresso/25 hover:text-espresso"
              >
                Mở Google Maps
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
