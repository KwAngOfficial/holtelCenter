import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '../../api/client';
import CheckoutModal from '../../components/CheckoutModal';
import RoomActionCard from '../../components/RoomActionCard';
import { useConfirm, useToast } from '../../contexts/AdminProviders';
import type { CheckoutBilling, Dashboard, Room, RoomStatus } from '../../types';
import { formatCurrency, roomStatusLabel } from '../../utils/format';

type StatusFilter = 'all' | RoomStatus;

export default function AdminDashboard() {
  const confirm = useConfirm();
  const showToast = useToast();

  const [stats, setStats] = useState<Dashboard | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [checkoutResult, setCheckoutResult] = useState<CheckoutBilling | null>(null);
  const [checkoutPreview, setCheckoutPreview] = useState(false);
  const [loadingRoomId, setLoadingRoomId] = useState<number | null>(null);
  const [filter, setFilter] = useState<StatusFilter>('all');

  const load = useCallback(async () => {
    const [dash, roomList] = await Promise.all([api.dashboard.get(), api.rooms.getAll()]);
    setStats(dash);
    setRooms(roomList);
  }, []);

  useEffect(() => {
    load().catch(console.error);
    const interval = setInterval(() => load().catch(console.error), 30000);
    return () => clearInterval(interval);
  }, [load]);

  const filteredRooms = useMemo(
    () => (filter === 'all' ? rooms : rooms.filter((r) => r.status === filter)),
    [rooms, filter],
  );

  const executeAction = async (room: Room, newStatus: RoomStatus, actionLabel: string) => {
    setLoadingRoomId(room.id);
    try {
      const result = await api.rooms.updateStatus(room.id, newStatus);

      if (result.checkIn) {
        showToast(result.checkIn.message, 'success');
      } else if (result.checkout) {
        setCheckoutPreview(false);
        setCheckoutResult(result.checkout);
      } else if (result.message) {
        showToast(result.message, 'warning');
      } else {
        showToast(`Phòng ${room.roomNumber}: ${actionLabel} thành công`, 'success');
      }

      await load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Thao tác thất bại', 'error');
    } finally {
      setLoadingRoomId(null);
    }
  };

  const handleAction = async (room: Room, newStatus: RoomStatus, actionLabel: string) => {
    if (room.status === newStatus) return;

    const isCheckout = room.status === 'Occupied' && newStatus !== 'Occupied';
    const isCheckin = newStatus === 'Occupied' && room.status !== 'Occupied';

    if (isCheckout) {
      const ok = await confirm({
        title: actionLabel,
        description: 'Hệ thống sẽ tính tiền từ giờ vào đến thời điểm hiện tại, sau đó chuyển phòng sang trạng thái mới.',
        roomNumber: room.roomNumber,
        actionLabel,
        targetStatus: newStatus,
        variant: 'checkout',
        confirmText: 'Checkout & Thu tiền',
      });
      if (!ok) return;
    } else if (isCheckin) {
      const ok = await confirm({
        title: 'Nhận khách',
        description: 'Giờ vào sẽ được ghi nhận ngay bây giờ. Bạn có thể checkout sau để tính tiền tự động.',
        roomNumber: room.roomNumber,
        actionLabel,
        targetStatus: newStatus,
        variant: 'checkin',
        confirmText: 'Xác nhận nhận khách',
      });
      if (!ok) return;
    }

    await executeAction(room, newStatus, actionLabel);
  };

  const handlePreview = async (room: Room) => {
    try {
      const preview = await api.rooms.billingPreview(room.id);
      setCheckoutPreview(true);
      setCheckoutResult(preview);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Không thể xem trước hóa đơn', 'error');
    }
  };

  if (!stats) {
    return <div className="text-slate-500">Đang tải...</div>;
  }

  const statCards = [
    { label: 'Tổng phòng', value: stats.totalRooms, filter: 'all' as const, color: 'bg-slate-100' },
    { label: 'Trống', value: stats.availableRooms, filter: 'Available' as const, color: 'bg-emerald-50 text-emerald-800 ring-emerald-200' },
    { label: 'Đang thuê', value: stats.occupiedRooms, filter: 'Occupied' as const, color: 'bg-rose-50 text-rose-800 ring-rose-200' },
    { label: 'Dọn dẹp', value: stats.cleaningRooms, filter: 'Cleaning' as const, color: 'bg-amber-50 text-amber-800 ring-amber-200' },
    { label: 'Bảo trì', value: stats.maintenanceRooms, filter: 'Maintenance' as const, color: 'bg-slate-100 text-slate-700' },
    { label: 'Doanh thu hôm nay', value: formatCurrency(stats.todayRevenue), filter: null, color: 'bg-terracotta/10 text-terracotta' },
  ];

  return (
    <div>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold text-espresso">Sơ đồ phòng</h1>
          <p className="mt-1 text-sm text-slate-500">
            Chọn thao tác trên từng phòng — không cần dùng menu dropdown
          </p>
        </div>
        <button
          type="button"
          onClick={() => load()}
          className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium hover:bg-slate-50"
        >
          ↻ Làm mới
        </button>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {statCards.map((card) => (
          <button
            key={card.label}
            type="button"
            disabled={card.filter === null}
            onClick={() => card.filter && setFilter(card.filter === filter ? 'all' : card.filter)}
            className={`rounded-xl p-4 text-left transition ${
              card.color
            } ${card.filter && filter === card.filter ? 'ring-2 ring-espresso ring-offset-1' : ''} ${
              card.filter ? 'cursor-pointer hover:opacity-90' : 'cursor-default'
            }`}
          >
            <p className="text-[10px] font-semibold tracking-wide uppercase opacity-70">{card.label}</p>
            <p className="mt-1 text-xl font-bold">{card.value}</p>
          </button>
        ))}
      </div>

      <div className="mt-6 flex flex-wrap gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs text-slate-600">
        <span className="font-semibold text-espresso">Quy trình:</span>
        <span>🟢 Trống → <strong>Nhận khách</strong> → 🔴 Đang thuê</span>
        <span>→ <strong>Checkout</strong> → 🟡 Dọn dẹp → <strong>Sẵn sàng</strong> → 🟢 Trống</span>
      </div>

      <section className="mt-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-espresso">
            {filter === 'all' ? 'Tất cả phòng' : roomStatusLabel[filter]}
            <span className="ml-2 text-sm font-normal text-slate-400">({filteredRooms.length})</span>
          </h2>
          {filter !== 'all' && (
            <button type="button" onClick={() => setFilter('all')} className="text-sm text-terracotta hover:underline">
              Xem tất cả
            </button>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredRooms.map((room) => (
            <RoomActionCard
              key={room.id}
              room={room}
              loading={loadingRoomId === room.id}
              onAction={handleAction}
              onPreview={room.activeSession ? handlePreview : undefined}
            />
          ))}
        </div>

        {filteredRooms.length === 0 && (
          <p className="py-12 text-center text-slate-500">Không có phòng nào ở trạng thái này.</p>
        )}
      </section>

      {checkoutResult && (
        <CheckoutModal
          billing={checkoutResult}
          preview={checkoutPreview}
          onClose={() => { setCheckoutResult(null); setCheckoutPreview(false); }}
        />
      )}
    </div>
  );
}
