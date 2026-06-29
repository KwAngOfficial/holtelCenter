import { type FormEvent, useEffect, useState } from 'react';
import { api } from '../../api/client';
import { deleteConfirm, useConfirm, useToast } from '../../contexts/AdminProviders';
import type { Product } from '../../types';
import { formatCurrency } from '../../utils/format';

const emptyForm = { name: '', category: 'Nước uống', price: 15000, stock: 0, imageUrl: '' };

export default function AdminProductsPage() {
  const confirm = useConfirm();
  const showToast = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);

  const load = () => api.products.getAll().then(setProducts);

  useEffect(() => { load().catch(console.error); }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (editingId) await api.products.update(editingId, form);
    else await api.products.create(form);
    setForm(emptyForm); setEditingId(null); setShowForm(false); load();
  };

  const handleDelete = async (product: Product) => {
    const ok = await deleteConfirm(confirm, product.name);
    if (!ok) return;
    try {
      await api.products.delete(product.id);
      showToast(`Đã xóa "${product.name}"`, 'success');
      load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Không thể xóa sản phẩm', 'error');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl font-semibold">Quản lý sản phẩm</h1>
        <button type="button" onClick={() => { setShowForm(true); setEditingId(null); setForm(emptyForm); }} className="rounded-lg bg-espresso px-4 py-2 text-sm text-white">+ Thêm sản phẩm</button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mt-6 grid gap-4 rounded-xl border bg-white p-6 sm:grid-cols-2">
          <label className="text-sm"><span className="font-medium">Tên</span><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-1 w-full rounded-lg border px-3 py-2" required /></label>
          <label className="text-sm"><span className="font-medium">Danh mục</span><input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="mt-1 w-full rounded-lg border px-3 py-2" /></label>
          <label className="text-sm"><span className="font-medium">Giá</span><input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: +e.target.value })} className="mt-1 w-full rounded-lg border px-3 py-2" /></label>
          <label className="text-sm"><span className="font-medium">Tồn kho</span><input type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: +e.target.value })} className="mt-1 w-full rounded-lg border px-3 py-2" /></label>
          <div className="flex gap-2 sm:col-span-2">
            <button type="submit" className="rounded-lg bg-terracotta px-4 py-2 text-sm text-white">{editingId ? 'Cập nhật' : 'Tạo'}</button>
            <button type="button" onClick={() => setShowForm(false)} className="rounded-lg border px-4 py-2 text-sm">Hủy</button>
          </div>
        </form>
      )}

      <div className="mt-6 overflow-x-auto rounded-xl border bg-white">
        <table className="w-full text-sm">
          <thead className="border-b bg-slate-50 text-xs uppercase text-slate-500">
            <tr><th className="px-4 py-3 text-left">Tên</th><th className="px-4 py-3 text-left">Danh mục</th><th className="px-4 py-3 text-right">Giá</th><th className="px-4 py-3 text-right">Tồn</th><th className="px-4 py-3">Active</th><th className="px-4 py-3">Thao tác</th></tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} className="border-b">
                <td className="px-4 py-3 font-medium">{p.name}</td>
                <td className="px-4 py-3">{p.category}</td>
                <td className="px-4 py-3 text-right">{formatCurrency(p.price)}</td>
                <td className="px-4 py-3 text-right">{p.stock}</td>
                <td className="px-4 py-3 text-center">{p.isActive ? '✓' : '—'}</td>
                <td className="px-4 py-3">
                  <button type="button" onClick={() => { setForm({ name: p.name, category: p.category, price: p.price, stock: p.stock, imageUrl: p.imageUrl ?? '' }); setEditingId(p.id); setShowForm(true); }} className="mr-2 text-terracotta">Sửa</button>
                  <button type="button" onClick={() => api.products.toggle(p.id).then(load)} className="mr-2 text-slate-600">Toggle</button>
                  <button type="button" onClick={() => handleDelete(p)} className="text-rose-600">Xóa</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
