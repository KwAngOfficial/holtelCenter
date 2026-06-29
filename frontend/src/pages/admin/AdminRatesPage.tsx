import { type FormEvent, useEffect, useState } from 'react';
import { api } from '../../api/client';
import { deleteConfirm, useConfirm, useToast } from '../../contexts/AdminProviders';
import type { HourlyRate } from '../../types';
import { dayTypeLabel, formatCurrency } from '../../utils/format';

const emptyForm = {
  roomType: 'Standard',
  durationHours: 2,
  label: '2 giờ',
  price: 120000,
  dayType: 'Weekday' as 'Weekday' | 'Weekend' | 'Holiday',
};

export default function AdminRatesPage() {
  const confirm = useConfirm();
  const showToast = useToast();
  const [rates, setRates] = useState<HourlyRate[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);

  const load = () => api.hourlyRates.getAll().then(setRates);

  useEffect(() => {
    load().catch(console.error);
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (editingId) await api.hourlyRates.update(editingId, form);
    else await api.hourlyRates.create(form);
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(false);
    load();
  };

  const handleDelete = async (rate: HourlyRate) => {
    const ok = await deleteConfirm(confirm, `${rate.roomType} · ${rate.label}`);
    if (!ok) return;
    try {
      await api.hourlyRates.delete(rate.id);
      showToast('Đã xóa bảng giá', 'success');
      load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Không thể xóa bảng giá', 'error');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl font-semibold">Quản lý giá giờ</h1>
        <button type="button" onClick={() => { setShowForm(true); setEditingId(null); setForm(emptyForm); }} className="rounded-lg bg-espresso px-4 py-2 text-sm font-medium text-white">
          + Thêm bảng giá
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mt-6 grid gap-4 rounded-xl border bg-white p-6 sm:grid-cols-2 lg:grid-cols-3">
          <label className="text-sm"><span className="font-medium">Loại phòng</span>
            <input value={form.roomType} onChange={(e) => setForm({ ...form, roomType: e.target.value })} className="mt-1 w-full rounded-lg border px-3 py-2" />
          </label>
          <label className="text-sm"><span className="font-medium">Số giờ</span>
            <input type="number" value={form.durationHours} onChange={(e) => setForm({ ...form, durationHours: +e.target.value })} className="mt-1 w-full rounded-lg border px-3 py-2" />
          </label>
          <label className="text-sm"><span className="font-medium">Nhãn hiển thị</span>
            <input value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} className="mt-1 w-full rounded-lg border px-3 py-2" />
          </label>
          <label className="text-sm"><span className="font-medium">Giá (VND)</span>
            <input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: +e.target.value })} className="mt-1 w-full rounded-lg border px-3 py-2" />
          </label>
          <label className="text-sm"><span className="font-medium">Loại ngày</span>
            <select value={form.dayType} onChange={(e) => setForm({ ...form, dayType: e.target.value as typeof form.dayType })} className="mt-1 w-full rounded-lg border px-3 py-2">
              <option value="Weekday">Ngày thường</option>
              <option value="Weekend">Cuối tuần</option>
              <option value="Holiday">Ngày lễ</option>
            </select>
          </label>
          <div className="flex items-end gap-2">
            <button type="submit" className="rounded-lg bg-terracotta px-4 py-2 text-sm text-white">{editingId ? 'Cập nhật' : 'Tạo'}</button>
            <button type="button" onClick={() => setShowForm(false)} className="rounded-lg border px-4 py-2 text-sm">Hủy</button>
          </div>
        </form>
      )}

      <div className="mt-6 overflow-x-auto rounded-xl border bg-white">
        <table className="w-full text-sm">
          <thead className="border-b bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3 text-left">Loại phòng</th>
              <th className="px-4 py-3 text-left">Khung giờ</th>
              <th className="px-4 py-3 text-left">Ngày</th>
              <th className="px-4 py-3 text-right">Giá</th>
              <th className="px-4 py-3">Active</th>
              <th className="px-4 py-3">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {rates.map((rate) => (
              <tr key={rate.id} className="border-b">
                <td className="px-4 py-3">{rate.roomType}</td>
                <td className="px-4 py-3">{rate.label}</td>
                <td className="px-4 py-3">{dayTypeLabel[rate.dayType]}</td>
                <td className="px-4 py-3 text-right font-semibold">{formatCurrency(rate.price)}</td>
                <td className="px-4 py-3 text-center">{rate.isActive ? '✓' : '—'}</td>
                <td className="px-4 py-3">
                  <button type="button" onClick={() => { setForm({ roomType: rate.roomType, durationHours: rate.durationHours, label: rate.label, price: rate.price, dayType: rate.dayType }); setEditingId(rate.id); setShowForm(true); }} className="mr-2 text-terracotta">Sửa</button>
                  <button type="button" onClick={() => api.hourlyRates.toggle(rate.id).then(load)} className="mr-2 text-slate-600">Toggle</button>
                  <button type="button" onClick={() => handleDelete(rate)} className="text-rose-600">Xóa</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
