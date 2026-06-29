import { type FormEvent, useEffect, useState } from 'react';
import { api } from '../../api/client';
import { deleteConfirm, useConfirm, useToast } from '../../contexts/AdminProviders';
import type { Room } from '../../types';
import { roomStatusColor, roomStatusLabel } from '../../utils/format';

const emptyForm = {
  name: '',
  roomNumber: '',
  roomType: 'Standard',
  floor: 1,
  description: '',
  amenities: '',
  imageUrl: '',
  isPublic: true,
};

export default function AdminRoomsPage() {
  const confirm = useConfirm();
  const showToast = useToast();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);

  const load = () => api.rooms.getAll().then(setRooms);

  useEffect(() => {
    load().catch(console.error);
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.rooms.update(editingId, form);
        showToast('Đã cập nhật phòng', 'success');
      } else {
        await api.rooms.create(form);
        showToast('Đã thêm phòng mới', 'success');
      }
      setForm(emptyForm);
      setEditingId(null);
      setShowForm(false);
      load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Không thể lưu phòng', 'error');
    }
  };

  const startEdit = (room: Room) => {
    setForm({
      name: room.name,
      roomNumber: room.roomNumber,
      roomType: room.roomType,
      floor: room.floor,
      description: room.description ?? '',
      amenities: room.amenities ?? '',
      imageUrl: room.imageUrl ?? '',
      isPublic: room.isPublic,
    });
    setEditingId(room.id);
    setShowForm(true);
  };

  const handleDelete = async (room: Room) => {
    const ok = await deleteConfirm(confirm, `${room.name} (#${room.roomNumber})`, {
      description: `Phòng sẽ bị xóa vĩnh viễn cùng toàn bộ lịch sử thuê (nếu có). Thao tác này không thể hoàn tác.`,
    });
    if (!ok) return;
    try {
      await api.rooms.delete(room.id);
      showToast(`Đã xóa phòng ${room.roomNumber}`, 'success');
      load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Không thể xóa phòng', 'error');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold">Quản lý phòng</h1>
          <p className="text-sm text-slate-500">{rooms.length} phòng</p>
        </div>
        <button
          type="button"
          onClick={() => { setShowForm(true); setEditingId(null); setForm(emptyForm); }}
          className="rounded-lg bg-espresso px-4 py-2 text-sm font-medium text-white hover:bg-espresso/90"
        >
          + Thêm phòng
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mt-6 grid gap-4 rounded-xl border border-slate-200 bg-white p-6 sm:grid-cols-2">
          {(['name', 'roomNumber', 'roomType', 'description', 'amenities', 'imageUrl'] as const).map((field) => (
            <label key={field} className="block text-sm">
              <span className="font-medium capitalize">{field === 'roomNumber' ? 'Số phòng' : field === 'imageUrl' ? 'URL ảnh' : field === 'roomType' ? 'Loại phòng' : field === 'amenities' ? 'Tiện nghi' : field === 'description' ? 'Mô tả' : 'Tên phòng'}</span>
              <input
                value={form[field]}
                onChange={(e) => setForm({ ...form, [field]: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
                required={field === 'name' || field === 'roomNumber'}
              />
            </label>
          ))}
          <label className="block text-sm">
            <span className="font-medium">Tầng</span>
            <input type="number" value={form.floor} onChange={(e) => setForm({ ...form, floor: +e.target.value })} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2" />
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.isPublic} onChange={(e) => setForm({ ...form, isPublic: e.target.checked })} />
            Hiển thị công khai
          </label>
          <div className="flex gap-2 sm:col-span-2">
            <button type="submit" className="rounded-lg bg-terracotta px-4 py-2 text-sm font-medium text-white">{editingId ? 'Cập nhật' : 'Tạo mới'}</button>
            <button type="button" onClick={() => setShowForm(false)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm">Hủy</button>
          </div>
        </form>
      )}

      <div className="mt-6 overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Phòng</th>
              <th className="px-4 py-3">Loại</th>
              <th className="px-4 py-3">Trạng thái</th>
              <th className="px-4 py-3">Công khai</th>
              <th className="px-4 py-3">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {rooms.map((room) => (
              <tr key={room.id} className="border-b last:border-0">
                <td className="px-4 py-3">
                  <p className="font-medium">{room.name}</p>
                  <p className="text-xs text-slate-500">#{room.roomNumber}</p>
                </td>
                <td className="px-4 py-3">{room.roomType}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full border px-2 py-0.5 text-xs ${roomStatusColor[room.status]}`}>
                    {roomStatusLabel[room.status]}
                  </span>
                </td>
                <td className="px-4 py-3">{room.isPublic ? '✓' : '—'}</td>
                <td className="px-4 py-3">
                  <button type="button" onClick={() => startEdit(room)} className="mr-2 text-terracotta hover:underline">Sửa</button>
                  <button type="button" onClick={() => handleDelete(room)} className="text-rose-600 hover:underline">Xóa</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
