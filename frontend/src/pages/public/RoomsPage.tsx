import { useEffect, useState } from 'react';
import { api } from '../../api/client';
import type { Room } from '../../types';
import { roomStatusColor, roomStatusLabel } from '../../utils/format';

export default function RoomsPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    api.rooms.getAvailability().then(setRooms).catch(console.error);
  }, []);

  const types = [...new Set(rooms.map((r) => r.roomType))];
  const filtered = filter === 'all' ? rooms : rooms.filter((r) => r.roomType === filter);

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 md:px-6 md:py-16">
      <p className="text-xs font-semibold tracking-widest text-terracotta uppercase">Danh sách phòng</p>
      <h1 className="font-display mt-2 text-4xl font-semibold text-espresso md:text-5xl">Phòng & tình trạng</h1>
      <p className="mt-3 max-w-2xl text-espresso-muted">
        Cập nhật trực tiếp — bạn có thể xem phòng nào đang trống trước khi liên hệ đặt.
      </p>

      <div className="mt-8 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setFilter('all')}
          className={`rounded-full px-4 py-2 text-sm font-medium transition ${
            filter === 'all' ? 'bg-espresso text-white' : 'bg-cream-dark text-espresso-muted hover:text-espresso'
          }`}
        >
          Tất cả
        </button>
        {types.map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => setFilter(type)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              filter === type ? 'bg-espresso text-white' : 'bg-cream-dark text-espresso-muted hover:text-espresso'
            }`}
          >
            {type}
          </button>
        ))}
      </div>

      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((room) => (
          <article key={room.id} className="overflow-hidden rounded-2xl border border-cream-dark bg-white">
            <div className="relative aspect-[4/3]">
              <img src={room.imageUrl ?? 'https://picsum.photos/seed/room/800/600'} alt={room.name} className="h-full w-full object-cover" />
              <span className={`absolute top-3 right-3 rounded-full border px-3 py-1 text-xs font-medium ${roomStatusColor[room.status]}`}>
                {roomStatusLabel[room.status]}
              </span>
            </div>
            <div className="p-5">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-terracotta">{room.roomType} · Tầng {room.floor}</p>
                <p className="text-xs text-espresso-muted">#{room.roomNumber}</p>
              </div>
              <h2 className="font-display mt-1 text-2xl font-semibold">{room.name}</h2>
              <p className="mt-2 text-sm text-espresso-muted">{room.description}</p>
              {room.amenities && (
                <p className="mt-3 text-xs text-sage">{room.amenities.split(',').join(' · ')}</p>
              )}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
