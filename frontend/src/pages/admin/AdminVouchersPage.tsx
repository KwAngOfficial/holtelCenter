import { type FormEvent, useEffect, useState } from 'react';
import { api } from '../../api/client';
import { deleteConfirm, useConfirm, useToast } from '../../contexts/AdminProviders';
import type { Voucher } from '../../types';
import { formatCurrency } from '../../utils/format';

const emptyForm = {
  code: '',
  name: '',
  description: '',
  discountType: 'Percentage' as const,
  discountValue: 10,
  minDurationHours: undefined as number | undefined,
  applicableRoomTypes: '',
  validFrom: new Date().toISOString().slice(0, 10),
  validTo: new Date(Date.now() + 90 * 86400000).toISOString().slice(0, 10),
  usageLimit: 100,
};

export default function AdminVouchersPage() {
  const confirm = useConfirm();
  const showToast = useToast();
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);

  const load = () => api.vouchers.getAll().then(setVouchers);
  useEffect(() => { load().catch(console.error); }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const payload = {
      ...form,
      validFrom: new Date(form.validFrom).toISOString(),
      validTo: new Date(form.validTo).toISOString(),
      minDurationHours: form.minDurationHours || null,
    };
    if (editingId) await api.vouchers.update(editingId, payload);
    else await api.vouchers.create(payload);
    setForm(emptyForm); setEditingId(null); setShowForm(false); load();
  };

  const handleDelete = async (voucher: Voucher) => {
    const ok = await deleteConfirm(confirm, voucher.code);
    if (!ok) return;
    try {
      await api.vouchers.delete(voucher.id);
      showToast(`Đã xóa voucher ${voucher.code}`, 'success');
      load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Không thể xóa voucher', 'error');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl font-semibold">Quản lý voucher</h1>
        <button type="button" onClick={() => { setShowForm(true); setEditingId(null); setForm(emptyForm); }} className="rounded-lg bg-espresso px-4 py-2 text-sm text-white">+ Thêm voucher</button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mt-6 grid gap-4 rounded-xl border bg-white p-6 sm:grid-cols-2">
          <label className="text-sm"><span className="font-medium">Mã</span><input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} className="mt-1 w-full rounded-lg border px-3 py-2 font-mono" required /></label>
          <label className="text-sm"><span className="font-medium">Tên</span><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-1 w-full rounded-lg border px-3 py-2" required /></label>
          <label className="text-sm sm:col-span-2"><span className="font-medium">Mô tả</span><input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="mt-1 w-full rounded-lg border px-3 py-2" /></label>
          <label className="text-sm"><span className="font-medium">Loại giảm</span>
            <select value={form.discountType} onChange={(e) => setForm({ ...form, discountType: e.target.value as typeof form.discountType })} className="mt-1 w-full rounded-lg border px-3 py-2">
              <option value="Percentage">Phần trăm (%)</option>
              <option value="FixedAmount">Số tiền cố định</option>
            </select>
          </label>
          <label className="text-sm"><span className="font-medium">Giá trị giảm</span><input type="number" value={form.discountValue} onChange={(e) => setForm({ ...form, discountValue: +e.target.value })} className="mt-1 w-full rounded-lg border px-3 py-2" /></label>
          <label className="text-sm"><span className="font-medium">Từ ngày</span><input type="date" value={form.validFrom} onChange={(e) => setForm({ ...form, validFrom: e.target.value })} className="mt-1 w-full rounded-lg border px-3 py-2" /></label>
          <label className="text-sm"><span className="font-medium">Đến ngày</span><input type="date" value={form.validTo} onChange={(e) => setForm({ ...form, validTo: e.target.value })} className="mt-1 w-full rounded-lg border px-3 py-2" /></label>
          <label className="text-sm"><span className="font-medium">Giới hạn lượt</span><input type="number" value={form.usageLimit} onChange={(e) => setForm({ ...form, usageLimit: +e.target.value })} className="mt-1 w-full rounded-lg border px-3 py-2" /></label>
          <div className="flex gap-2 sm:col-span-2">
            <button type="submit" className="rounded-lg bg-terracotta px-4 py-2 text-sm text-white">{editingId ? 'Cập nhật' : 'Tạo'}</button>
            <button type="button" onClick={() => setShowForm(false)} className="rounded-lg border px-4 py-2 text-sm">Hủy</button>
          </div>
        </form>
      )}

      <div className="mt-6 overflow-x-auto rounded-xl border bg-white">
        <table className="w-full text-sm">
          <thead className="border-b bg-slate-50 text-xs uppercase text-slate-500">
            <tr><th className="px-4 py-3 text-left">Mã</th><th className="px-4 py-3 text-left">Tên</th><th className="px-4 py-3">Giảm</th><th className="px-4 py-3">Đã dùng</th><th className="px-4 py-3">Active</th><th className="px-4 py-3">Thao tác</th></tr>
          </thead>
          <tbody>
            {vouchers.map((v) => (
              <tr key={v.id} className="border-b">
                <td className="px-4 py-3 font-mono font-bold text-terracotta">{v.code}</td>
                <td className="px-4 py-3">{v.name}</td>
                <td className="px-4 py-3 text-center">{v.discountType === 'Percentage' ? `${v.discountValue}%` : formatCurrency(v.discountValue)}</td>
                <td className="px-4 py-3 text-center">{v.usedCount}/{v.usageLimit}</td>
                <td className="px-4 py-3 text-center">{v.isActive ? '✓' : '—'}</td>
                <td className="px-4 py-3">
                  <button type="button" onClick={() => api.vouchers.toggle(v.id).then(load)} className="mr-2 text-slate-600">Toggle</button>
                  <button type="button" onClick={() => handleDelete(v)} className="text-rose-600">Xóa</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
