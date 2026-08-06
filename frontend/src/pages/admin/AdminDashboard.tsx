import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '../../api/client';
import CheckoutModal from '../../components/CheckoutModal';
import EditCheckInModal from '../../components/EditCheckInModal';
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
  const [editCheckInRoom, setEditCheckInRoom] = useState<Room | null>(null);
  const [savingCheckIn, setSavingCheckIn] = useState(false);
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

  const roomsByFloor = useMemo(() => {
    const map = new Map<number, Room[]>();
    for (const room of filteredRooms) {
      const list = map.get(room.floor) ?? [];
      list.push(room);
      map.set(room.floor, list);
    }

    return Array.from(map.entries())
      .sort(([a], [b]) => a - b)
      .map(([floor, floorRooms]) => {
        const sorted = [...floorRooms].sort((a, b) =>
          a.roomNumber.localeCompare(b.roomNumber, undefined, { numeric: true }),
        );
        const statusCount = (status: RoomStatus) => sorted.filter((r) => r.status === status).length;
        return {
          floor,
          rooms: sorted,
          counts: {
            available: statusCount('Available'),
            occupied: statusCount('Occupied'),
            cleaning: statusCount('Cleaning'),
            maintenance: statusCount('Maintenance'),
          },
        };
      });
  }, [filteredRooms]);

  const scrollToFloor = (floor: number) => {
    document.getElementById(`floor-${floor}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

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

  const handleSaveCheckIn = async (checkInLocal: string) => {
    if (!editCheckInRoom) return;
    setSavingCheckIn(true);
    try {
      await api.rooms.updateCheckIn(editCheckInRoom.id, checkInLocal);
      showToast(`Đã cập nhật giờ vào phòng ${editCheckInRoom.roomNumber}`, 'success');
      setEditCheckInRoom(null);
      await load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Không thể cập nhật giờ vào', 'error');
    } finally {
      setSavingCheckIn(false);
    }
  };

  if (!stats) {
    return <div className="text-slate-500">Đang tải...</div>;
  }

  const statCards = [
    { label: 'Tổng phòng', value: stats.totalRooms, filter: 'all' as const, color: 'bg-slate-100 text-espresso' },
    { label: 'Trống', value: stats.availableRooms, filter: 'Available' as const, color: 'bg-emerald-600 text-white ring-emerald-800' },
    { label: 'Đang thuê', value: stats.occupiedRooms, filter: 'Occupied' as const, color: 'bg-red-700 text-white ring-red-950' },
    { label: 'Dọn dẹp', value: stats.cleaningRooms, filter: 'Cleaning' as const, color: 'bg-amber-50 text-amber-900 ring-amber-200' },
    { label: 'Bảo trì', value: stats.maintenanceRooms, filter: 'Maintenance' as const, color: 'bg-slate-100 text-slate-700 ring-slate-200' },
    { label: 'Doanh thu hôm nay', value: formatCurrency(stats.todayRevenue), filter: null, color: 'bg-terracotta/10 text-terracotta' },
  ];

  return (
    <div className="min-w-0 max-w-full">
      <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="font-display text-2xl font-semibold text-espresso sm:text-3xl">Sơ đồ phòng</h1>
          <p className="mt-1 text-sm text-slate-500">
            Theo dõi theo tầng — thao tác trực tiếp trên từng phòng
          </p>
        </div>
        <button
          type="button"
          onClick={() => load()}
          className="shrink-0 self-start rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-espresso shadow-sm transition hover:bg-slate-50 sm:self-auto"
        >
          ↻ Làm mới
        </button>
      </div>

      {/* Stats: 2 mobile · 3 tablet · 6 desktop */}
      <div className="mt-5 grid grid-cols-2 gap-2.5 sm:gap-3 md:grid-cols-3 xl:grid-cols-6">
        {statCards.map((card) => (
          <button
            key={card.label}
            type="button"
            disabled={card.filter === null}
            onClick={() => card.filter && setFilter(card.filter === filter ? 'all' : card.filter)}
            className={`min-w-0 rounded-xl p-3 text-left transition sm:p-4 ${card.color} ${
              card.filter && filter === card.filter ? 'ring-2 ring-espresso ring-offset-1 sm:ring-offset-2' : ''
            } ${card.filter ? 'cursor-pointer hover:opacity-90' : 'cursor-default'}`}
          >
            <p className="truncate text-[10px] font-semibold tracking-wide uppercase opacity-70">{card.label}</p>
            <p className="mt-1 truncate text-lg font-bold tabular-nums sm:text-xl">{card.value}</p>
          </button>
        ))}
      </div>

      <div className="mt-5 rounded-xl border border-slate-200 bg-white px-3 py-3 text-xs text-slate-600 sm:px-4">
        <div className="flex flex-col gap-2 md:flex-row md:flex-wrap md:items-center md:gap-x-3 md:gap-y-2">
          <span className="shrink-0 font-semibold text-espresso">Quy trình</span>
          <span className="hidden h-3 w-px bg-slate-200 md:block" aria-hidden />
          <span className="inline-flex min-w-0 flex-wrap items-center gap-1.5">
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-600" />
            Trống
            <span className="text-slate-300">→</span>
            <strong className="font-semibold text-espresso">Nhận khách</strong>
            <span className="text-slate-300">→</span>
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-red-700" />
            Đang thuê
          </span>
          <span className="inline-flex min-w-0 flex-wrap items-center gap-1.5">
            <span className="text-slate-300 md:inline">→</span>
            <strong className="font-semibold text-espresso">Checkout</strong>
            <span className="text-slate-300">→</span>
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
            Dọn dẹp
            <span className="text-slate-300">→</span>
            <strong className="font-semibold text-espresso">Sẵn sàng</strong>
          </span>
        </div>
      </div>

      <section className="mt-6 min-w-0 sm:mt-8">
        <div className="mb-4 flex min-w-0 flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-espresso sm:text-lg">
              {filter === 'all' ? 'Tất cả phòng' : roomStatusLabel[filter]}
              <span className="ml-2 text-sm font-normal text-slate-400">
                {filteredRooms.length} phòng
                {roomsByFloor.length > 0 && <> · {roomsByFloor.length} tầng</>}
              </span>
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">Nhóm theo tầng — chạm nút tầng để nhảy nhanh</p>
          </div>
          {filter !== 'all' && (
            <button
              type="button"
              onClick={() => setFilter('all')}
              className="shrink-0 self-start rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-terracotta shadow-sm hover:bg-slate-50"
            >
              Xóa bộ lọc
            </button>
          )}
        </div>

        {/* Floor jump: single row, horizontal scroll — no nested sticky headers */}
        {roomsByFloor.length > 1 && (
          <div className="mb-4 min-w-0 rounded-xl border border-slate-200 bg-white p-2 shadow-sm sm:mb-5 sm:p-2.5">
            <div className="flex min-w-0 items-center gap-2">
              <span className="shrink-0 px-1 text-[11px] font-semibold tracking-wide text-slate-400 uppercase">
                Tầng
              </span>
              <div
                className="flex min-w-0 flex-1 gap-2 overflow-x-auto overscroll-x-contain pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                role="navigation"
                aria-label="Chọn tầng"
              >
                {roomsByFloor.map(({ floor, rooms: floorRooms, counts }) => (
                  <button
                    key={floor}
                    type="button"
                    onClick={() => scrollToFloor(floor)}
                    className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2 text-sm transition hover:border-espresso/30 hover:bg-white active:bg-white sm:px-3"
                  >
                    <span className="flex h-8 w-8 items-center justify-center rounded-md bg-espresso text-xs font-bold text-white tabular-nums sm:h-7 sm:w-7">
                      {floor}
                    </span>
                    <span className="text-xs text-slate-500 whitespace-nowrap">{floorRooms.length} phòng</span>
                    {counts.occupied > 0 && (
                      <span className="rounded bg-red-50 px-1.5 py-0.5 text-[10px] font-semibold text-red-800 ring-1 ring-red-100 whitespace-nowrap">
                        {counts.occupied} thuê
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {filteredRooms.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white py-14 text-center sm:py-16">
            <p className="text-slate-500">Không có phòng nào ở trạng thái này.</p>
            {filter !== 'all' && (
              <button
                type="button"
                onClick={() => setFilter('all')}
                className="mt-3 text-sm font-medium text-terracotta hover:underline"
              >
                Xem tất cả phòng
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4 sm:space-y-5">
            {roomsByFloor.map(({ floor, rooms: floorRooms, counts }) => (
              <section
                key={floor}
                id={`floor-${floor}`}
                className="scroll-mt-4 min-w-0 rounded-2xl border border-slate-200 bg-white shadow-sm"
              >
                {/* Non-sticky header — avoids overlap with floor jump / previous floors */}
                <header className="flex flex-col gap-3 border-b border-slate-100 px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5 sm:py-3.5">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-xl bg-espresso text-white sm:h-12 sm:w-12">
                      <span className="text-[9px] font-semibold tracking-wider uppercase opacity-60">Tầng</span>
                      <span className="text-lg font-bold leading-none tabular-nums sm:text-xl">{floor}</span>
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-base font-semibold text-espresso">Tầng {floor}</h3>
                      <p className="text-xs text-slate-500">
                        {floorRooms.length} phòng
                        {counts.occupied > 0 && (
                          <span className="text-red-700"> · {counts.occupied} đang thuê</span>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    {counts.available > 0 && (
                      <span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-800 ring-1 ring-emerald-100 sm:px-2.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                        Trống {counts.available}
                      </span>
                    )}
                    {counts.occupied > 0 && (
                      <span className="inline-flex items-center gap-1.5 rounded-md bg-red-50 px-2 py-1 text-[11px] font-semibold text-red-800 ring-1 ring-red-100 sm:px-2.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-red-700" />
                        Đang thuê {counts.occupied}
                      </span>
                    )}
                    {counts.cleaning > 0 && (
                      <span className="inline-flex items-center gap-1.5 rounded-md bg-amber-50 px-2 py-1 text-[11px] font-semibold text-amber-900 ring-1 ring-amber-100 sm:px-2.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                        Dọn {counts.cleaning}
                      </span>
                    )}
                    {counts.maintenance > 0 && (
                      <span className="inline-flex items-center gap-1.5 rounded-md bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-700 ring-1 ring-slate-200 sm:px-2.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                        Bảo trì {counts.maintenance}
                      </span>
                    )}
                  </div>
                </header>

                {/* 1 → 2 tablet → 3 desktop → 4 wide */}
                <div className="grid grid-cols-1 gap-3 bg-slate-50/50 p-3 sm:p-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                  {floorRooms.map((room) => (
                    <RoomActionCard
                      key={room.id}
                      room={room}
                      loading={loadingRoomId === room.id}
                      onAction={handleAction}
                      onPreview={room.activeSession ? handlePreview : undefined}
                      onEditCheckIn={room.activeSession ? setEditCheckInRoom : undefined}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </section>

      {editCheckInRoom && (
        <EditCheckInModal
          room={editCheckInRoom}
          saving={savingCheckIn}
          onSave={handleSaveCheckIn}
          onClose={() => !savingCheckIn && setEditCheckInRoom(null)}
        />
      )}

      {checkoutResult && (
        <CheckoutModal
          billing={checkoutResult}
          preview={checkoutPreview}
          onClose={() => {
            setCheckoutResult(null);
            setCheckoutPreview(false);
          }}
        />
      )}
    </div>
  );
}
