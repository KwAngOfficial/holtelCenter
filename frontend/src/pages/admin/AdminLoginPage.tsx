import { type FormEvent, useState } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { useAdminAuth } from '../../contexts/AdminAuthContext';

export default function AdminLoginPage() {
  const { isAuthenticated, loading, login } = useAdminAuth();
  const location = useLocation();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const from = (location.state as { from?: string } | null)?.from ?? '/admin';

  if (!loading && isAuthenticated) {
    return <Navigate to={from} replace />;
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login(password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Đăng nhập thất bại');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-black/5">
        <div className="border-b border-slate-100 bg-espresso px-6 py-8 text-center text-white">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-terracotta text-lg font-semibold">
            SD
          </span>
          <h1 className="font-display mt-4 text-2xl font-semibold">Sao Dem Holtel</h1>
          <p className="mt-1 text-sm text-white/70">Đăng nhập khu vực quản trị</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 p-6">
          <label className="block text-sm">
            <span className="font-medium text-espresso">Mật khẩu quản trị</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              autoFocus
              required
              placeholder="Nhập mật khẩu"
              className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-espresso outline-none transition focus:border-espresso focus:ring-2 focus:ring-espresso/10"
            />
          </label>

          {error && (
            <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting || !password}
            className="w-full rounded-xl bg-espresso py-3 text-sm font-semibold text-white transition hover:bg-espresso/90 disabled:opacity-50"
          >
            {submitting ? 'Đang đăng nhập...' : 'Vào quản trị'}
          </button>

          <p className="text-center text-xs text-slate-400">
            Phiên đăng nhập được lưu trên thiết bị này — không cần nhập lại mỗi lần mở trình duyệt.
          </p>

          <Link
            to="/"
            className="block text-center text-sm text-slate-500 transition hover:text-espresso"
          >
            ← Về trang công khai
          </Link>
        </form>
      </div>
    </div>
  );
}
