import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import AdminProviders from '../contexts/AdminProviders';
import { useAdminAuth } from '../contexts/AdminAuthContext';

const adminNav = [
  { to: '/admin', label: 'Tổng quan', end: true },
  { to: '/admin/doanh-thu', label: 'Doanh thu' },
  { to: '/admin/phong', label: 'Phòng' },
  { to: '/admin/gia', label: 'Giá giờ' },
  { to: '/admin/san-pham', label: 'Sản phẩm' },
  { to: '/admin/voucher', label: 'Voucher' },
  { to: '/admin/combo', label: 'Combo' },
];

export default function AdminLayout() {
  const { logout } = useAdminAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/admin/login', { replace: true });
  };

  return (
    <AdminProviders>
      <div className="flex min-h-[100dvh] bg-slate-50">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-slate-200 bg-white lg:flex">
        <div className="border-b border-slate-100 px-6 py-5">
          <p className="font-display text-xl font-semibold text-espresso">Sao Dem Holtel</p>
          <p className="text-xs text-slate-500">Bảng quản trị</p>
        </div>
        <nav className="flex-1 space-y-1 p-4">
          {adminNav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `block rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                  isActive ? 'bg-espresso text-white' : 'text-slate-600 hover:bg-slate-100'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="space-y-2 border-t border-slate-100 p-4">
          <NavLink to="/" className="block text-sm text-slate-500 hover:text-espresso">
            ← Về trang công khai
          </NavLink>
          <button
            type="button"
            onClick={handleLogout}
            className="block text-sm text-rose-600 hover:text-rose-700"
          >
            Đăng xuất
          </button>
        </div>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="border-b border-slate-200 bg-white px-4 py-4 lg:hidden">
          <p className="font-display text-lg font-semibold">Quản trị</p>
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
            {adminNav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `shrink-0 rounded-full px-3 py-1.5 text-xs font-medium ${
                    isActive ? 'bg-espresso text-white' : 'bg-slate-100 text-slate-600'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </div>
        </header>
        <main className="flex-1 p-4 md:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
      </div>
    </AdminProviders>
  );
}
