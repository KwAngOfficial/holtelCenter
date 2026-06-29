import { Link, NavLink } from 'react-router-dom';
import { MAPS_DIRECTIONS_URL, SITE } from '../constants/site';
import LocationMap from '../components/LocationMap';

const navLinks = [
  { to: '/', label: 'Trang chủ' },
  { to: '/phong', label: 'Phòng' },
  { to: '/gia', label: 'Bảng giá' },
  { to: '/combo', label: 'Combo' },
  { to: '/uu-dai', label: 'Ưu đãi' },
  { to: '/#ban-do', label: 'Chỉ đường' },
];

function scrollToMap() {
  document.getElementById('ban-do')?.scrollIntoView({ behavior: 'smooth' });
}

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[100dvh] bg-cream">
      <header className="sticky top-0 z-50 border-b border-cream-dark/80 bg-cream/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 md:px-6">
          <Link to="/" className="group flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-terracotta text-sm font-semibold text-white transition-transform group-hover:scale-105">
              SD
            </span>
            <div>
              <p className="font-display text-xl font-semibold leading-none text-espresso">Sao Dem Holtel</p>
              <p className="text-[11px] tracking-[0.15em] text-espresso-muted uppercase">Nhà nghỉ Sao Đêm</p>
            </div>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {navLinks.map((link) =>
              link.to === '/#ban-do' ? (
                <a
                  key={link.to}
                  href="#ban-do"
                  onClick={(e) => {
                    e.preventDefault();
                    scrollToMap();
                  }}
                  className="rounded-full px-4 py-2 text-sm font-medium text-espresso-muted transition-colors hover:bg-cream-dark hover:text-espresso"
                >
                  {link.label}
                </a>
              ) : (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className={({ isActive }) =>
                    `rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                      isActive ? 'bg-espresso text-cream' : 'text-espresso-muted hover:bg-cream-dark hover:text-espresso'
                    }`
                  }
                >
                  {link.label}
                </NavLink>
              ),
            )}
          </nav>

          <div className="flex items-center gap-2">
            <a
              href={`tel:${SITE.phone}`}
              className="hidden rounded-full bg-terracotta px-4 py-2 text-sm font-semibold text-white transition hover:bg-terracotta-dark sm:inline-flex"
            >
              Gọi ngay
            </a>
            <Link
              to="/admin"
              className="rounded-full border border-espresso/10 px-4 py-2 text-sm font-medium text-espresso-muted transition hover:border-espresso/20 hover:text-espresso"
            >
              Quản trị
            </Link>
          </div>
        </div>
      </header>

      <main>{children}</main>

      <LocationMap />

      <footer className="border-t border-cream-dark bg-cream-dark/50">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 md:grid-cols-3 md:px-6">
          <div>
            <p className="font-display text-2xl font-semibold text-espresso">Sao Dem Holtel</p>
            <p className="mt-2 max-w-xs text-sm leading-relaxed text-espresso-muted">
              Không gian nghỉ ngơi gần gũi, sạch sẽ và riêng tư. Giá theo giờ linh hoạt, phù hợp mọi nhu cầu.
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold tracking-widest text-espresso-muted uppercase">Liên hệ</p>
            <ul className="mt-3 space-y-2 text-sm text-espresso-muted">
              <li>
                <a
                  href={MAPS_DIRECTIONS_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition hover:text-terracotta"
                >
                  📍 {SITE.placeName}
                </a>
              </li>
              <li>
                <a href={`tel:${SITE.phone}`} className="transition hover:text-terracotta">
                  📞 {SITE.phoneDisplay}
                </a>
              </li>
              <li>🕐 Mở cửa 24/7</li>
            </ul>
          </div>
          <div>
            <p className="text-xs font-semibold tracking-widest text-espresso-muted uppercase">Tiện ích</p>
            <ul className="mt-3 space-y-2 text-sm text-espresso-muted">
              <li>WiFi miễn phí</li>
              <li>Điều hòa, TV</li>
              <li>Bãi xe riêng</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-cream-dark py-4 text-center text-xs text-espresso-muted">
          © {new Date().getFullYear()} Sao Dem Holtel. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
