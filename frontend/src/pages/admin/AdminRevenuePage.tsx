import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '../../api/client';
import type { RevenueReport } from '../../types';
import { formatCurrency, formatDateTime } from '../../utils/format';

type Preset = '7d' | '30d' | 'month' | 'custom';

function toInputDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function getPresetRange(preset: Preset): { from: string; to: string } {
  const to = new Date();
  const from = new Date();
  if (preset === '7d') from.setDate(to.getDate() - 6);
  else if (preset === '30d') from.setDate(to.getDate() - 29);
  else if (preset === 'month') from.setDate(1);
  return { from: toInputDate(from), to: toInputDate(to) };
}

export default function AdminRevenuePage() {
  const [preset, setPreset] = useState<Preset>('30d');
  const [from, setFrom] = useState(() => getPresetRange('30d').from);
  const [to, setTo] = useState(() => getPresetRange('30d').to);
  const [report, setReport] = useState<RevenueReport | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.reports.revenue(from, to);
      setReport(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [from, to]);

  useEffect(() => {
    load();
  }, [load]);

  const applyPreset = (p: Preset) => {
    setPreset(p);
    if (p !== 'custom') {
      const range = getPresetRange(p);
      setFrom(range.from);
      setTo(range.to);
    }
  };

  const maxDaily = useMemo(
    () => Math.max(...(report?.dailyBreakdown.map((d) => d.amount) ?? [0]), 1),
    [report],
  );

  if (loading && !report) {
    return <div className="text-slate-500">Đang tải báo cáo...</div>;
  }

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold text-espresso">Báo cáo doanh thu</h1>
          <p className="mt-1 text-sm text-slate-500">Thống kê theo ngày checkout · múi giờ Việt Nam</p>
        </div>
        <button
          type="button"
          onClick={() => load()}
          className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium hover:bg-slate-50"
        >
          Làm mới
        </button>
      </div>

      {/* Presets & date range */}
      <div className="mt-6 flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex flex-wrap gap-2">
          {([
            ['7d', '7 ngày'],
            ['30d', '30 ngày'],
            ['month', 'Tháng này'],
            ['custom', 'Tùy chọn'],
          ] as const).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => applyPreset(key)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                preset === key ? 'bg-espresso text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="text-sm">
            <span className="text-slate-500">Từ</span>
            <input
              type="date"
              value={from}
              onChange={(e) => { setFrom(e.target.value); setPreset('custom'); }}
              className="ml-2 rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
            />
          </label>
          <label className="text-sm">
            <span className="text-slate-500">Đến</span>
            <input
              type="date"
              value={to}
              onChange={(e) => { setTo(e.target.value); setPreset('custom'); }}
              className="ml-2 rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
            />
          </label>
        </div>
      </div>

      {report && (
        <>
          {/* Summary cards */}
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl bg-espresso p-5 text-white">
              <p className="text-xs tracking-widest uppercase opacity-70">Tổng kỳ báo cáo</p>
              <p className="font-display mt-2 text-3xl font-semibold">{formatCurrency(report.totalRevenue)}</p>
              <p className="mt-1 text-xs opacity-70">{report.totalTransactions} giao dịch</p>
            </div>
            <div className="rounded-xl bg-terracotta/10 p-5">
              <p className="text-xs font-medium tracking-wide text-terracotta uppercase">Hôm nay</p>
              <p className="font-display mt-2 text-2xl font-semibold text-espresso">{formatCurrency(report.todayRevenue)}</p>
            </div>
            <div className="rounded-xl bg-slate-100 p-5">
              <p className="text-xs font-medium tracking-wide text-slate-500 uppercase">Tuần này</p>
              <p className="font-display mt-2 text-2xl font-semibold text-espresso">{formatCurrency(report.weekRevenue)}</p>
            </div>
            <div className="rounded-xl bg-sage-light p-5">
              <p className="text-xs font-medium tracking-wide text-sage uppercase">Tháng này</p>
              <p className="font-display mt-2 text-2xl font-semibold text-espresso">{formatCurrency(report.monthRevenue)}</p>
            </div>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <p className="text-sm text-slate-500">Trung bình / giao dịch</p>
              <p className="font-display mt-1 text-2xl font-semibold">{formatCurrency(report.averageTransaction)}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <p className="text-sm text-slate-500">Kỳ báo cáo</p>
              <p className="mt-1 font-medium">{from.split('-').reverse().join('/')} – {to.split('-').reverse().join('/')}</p>
            </div>
          </div>

          {/* Daily chart */}
          <section className="mt-8 rounded-xl border border-slate-200 bg-white p-6">
            <h2 className="text-lg font-semibold text-espresso">Doanh thu theo ngày</h2>
            <div className="mt-6 flex items-end gap-1 overflow-x-auto pb-2 sm:gap-2" style={{ minHeight: 180 }}>
              {report.dailyBreakdown.map((day) => (
                <div key={day.date} className="flex min-w-[36px] flex-1 flex-col items-center gap-2">
                  <div className="flex h-36 w-full items-end justify-center">
                    <div
                      className="w-full max-w-[48px] rounded-t-md bg-terracotta transition-all hover:bg-terracotta-dark"
                      style={{ height: `${Math.max((day.amount / maxDaily) * 100, day.amount > 0 ? 4 : 0)}%` }}
                      title={`${day.label}: ${formatCurrency(day.amount)} (${day.count} GD)`}
                    />
                  </div>
                  <span className="text-[10px] text-slate-500 sm:text-xs">{day.label}</span>
                  {day.amount > 0 && (
                    <span className="hidden text-[10px] font-medium text-terracotta sm:block">
                      {(day.amount / 1000).toFixed(0)}k
                    </span>
                  )}
                </div>
              ))}
            </div>
          </section>

          <div className="mt-8 grid gap-8 lg:grid-cols-2">
            {/* By room */}
            <section className="rounded-xl border border-slate-200 bg-white p-6">
              <h2 className="text-lg font-semibold text-espresso">Theo phòng</h2>
              {report.byRoom.length === 0 ? (
                <p className="mt-4 text-sm text-slate-500">Chưa có dữ liệu trong kỳ này.</p>
              ) : (
                <ul className="mt-4 space-y-3">
                  {report.byRoom.map((room) => {
                    const pct = report.totalRevenue > 0 ? (room.amount / report.totalRevenue) * 100 : 0;
                    return (
                      <li key={room.roomId}>
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium">
                            #{room.roomNumber} · {room.roomName}
                            <span className="ml-1 text-slate-400">({room.count} lượt)</span>
                          </span>
                          <span className="font-semibold text-terracotta">{formatCurrency(room.amount)}</span>
                        </div>
                        <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-100">
                          <div className="h-full rounded-full bg-terracotta/70" style={{ width: `${pct}%` }} />
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>

            {/* Quick stats pie-like list */}
            <section className="rounded-xl border border-slate-200 bg-white p-6">
              <h2 className="text-lg font-semibold text-espresso">Theo loại phòng</h2>
              <ul className="mt-4 space-y-3">
                {Object.entries(
                  report.byRoom.reduce<Record<string, { amount: number; count: number }>>((acc, r) => {
                    if (!acc[r.roomType]) acc[r.roomType] = { amount: 0, count: 0 };
                    acc[r.roomType].amount += r.amount;
                    acc[r.roomType].count += r.count;
                    return acc;
                  }, {}),
                )
                  .sort((a, b) => b[1].amount - a[1].amount)
                  .map(([type, data]) => (
                    <li key={type} className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3 text-sm">
                      <div>
                        <p className="font-medium">{type}</p>
                        <p className="text-xs text-slate-500">{data.count} giao dịch</p>
                      </div>
                      <p className="font-semibold">{formatCurrency(data.amount)}</p>
                    </li>
                  ))}
                {report.byRoom.length === 0 && (
                  <p className="text-sm text-slate-500">Chưa có dữ liệu.</p>
                )}
              </ul>
            </section>
          </div>

          {/* Transactions table */}
          <section className="mt-8 overflow-hidden rounded-xl border border-slate-200 bg-white">
            <div className="border-b border-slate-100 px-6 py-4">
              <h2 className="text-lg font-semibold text-espresso">Chi tiết giao dịch</h2>
              <p className="text-sm text-slate-500">{report.transactions.length} giao dịch</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b bg-slate-50 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Phòng</th>
                    <th className="px-4 py-3">Giờ vào</th>
                    <th className="px-4 py-3">Giờ ra</th>
                    <th className="px-4 py-3 text-center">Giờ thuê</th>
                    <th className="px-4 py-3 text-right">Số tiền</th>
                  </tr>
                </thead>
                <tbody>
                  {report.transactions.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                        Chưa có giao dịch checkout trong kỳ đã chọn.
                      </td>
                    </tr>
                  ) : (
                    report.transactions.map((tx) => (
                      <tr key={tx.id} className="border-b last:border-0 hover:bg-slate-50/50">
                        <td className="px-4 py-3">
                          <p className="font-medium">#{tx.roomNumber}</p>
                          <p className="text-xs text-slate-500">{tx.roomType}</p>
                        </td>
                        <td className="px-4 py-3 text-slate-600">{formatDateTime(tx.checkInLocal)}</td>
                        <td className="px-4 py-3 text-slate-600">{formatDateTime(tx.checkOutLocal)}</td>
                        <td className="px-4 py-3 text-center">{tx.durationHours}h</td>
                        <td className="px-4 py-3 text-right font-semibold text-terracotta">
                          {formatCurrency(tx.totalAmount)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
