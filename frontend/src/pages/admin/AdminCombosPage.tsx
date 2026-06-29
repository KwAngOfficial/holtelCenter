import { type FormEvent, useEffect, useState } from 'react';
import { api } from '../../api/client';
import { deleteConfirm, useConfirm, useToast } from '../../contexts/AdminProviders';
import type { Combo, Product } from '../../types';
import { formatCurrency } from '../../utils/format';

const emptyForm = {
  name: '',
  description: '',
  roomType: 'Standard',
  durationHours: 3,
  comboPrice: 185000,
  imageUrl: '',
  isPublic: true,
  items: [] as { productId: number; quantity: number }[],
};

export default function AdminCombosPage() {
  const confirm = useConfirm();
  const showToast = useToast();
  const [combos, setCombos] = useState<Combo[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [quantity, setQuantity] = useState(1);

  const load = async () => {
    const [c, p] = await Promise.all([api.combos.getAll(), api.products.getAll()]);
    setCombos(c);
    setProducts(p);
  };

  useEffect(() => { load().catch(console.error); }, []);

  const addItem = () => {
    if (!selectedProduct) return;
    const productId = +selectedProduct;
    const existing = form.items.find((i) => i.productId === productId);
    if (existing) {
      setForm({ ...form, items: form.items.map((i) => i.productId === productId ? { ...i, quantity: i.quantity + quantity } : i) });
    } else {
      setForm({ ...form, items: [...form.items, { productId, quantity }] });
    }
    setSelectedProduct('');
    setQuantity(1);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (editingId) await api.combos.update(editingId, form);
    else await api.combos.create(form);
    setForm(emptyForm); setEditingId(null); setShowForm(false); load();
  };

  const handleDelete = async (combo: Combo) => {
    const ok = await deleteConfirm(confirm, combo.name);
    if (!ok) return;
    try {
      await api.combos.delete(combo.id);
      showToast(`Đã xóa combo "${combo.name}"`, 'success');
      load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Không thể xóa combo', 'error');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl font-semibold">Quản lý combo</h1>
        <button type="button" onClick={() => { setShowForm(true); setEditingId(null); setForm(emptyForm); }} className="rounded-lg bg-espresso px-4 py-2 text-sm text-white">+ Thêm combo</button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mt-6 space-y-4 rounded-xl border bg-white p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm"><span className="font-medium">Tên combo</span><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-1 w-full rounded-lg border px-3 py-2" required /></label>
            <label className="text-sm"><span className="font-medium">Loại phòng</span><input value={form.roomType} onChange={(e) => setForm({ ...form, roomType: e.target.value })} className="mt-1 w-full rounded-lg border px-3 py-2" /></label>
            <label className="text-sm"><span className="font-medium">Số giờ</span><input type="number" value={form.durationHours} onChange={(e) => setForm({ ...form, durationHours: +e.target.value })} className="mt-1 w-full rounded-lg border px-3 py-2" /></label>
            <label className="text-sm"><span className="font-medium">Giá combo</span><input type="number" value={form.comboPrice} onChange={(e) => setForm({ ...form, comboPrice: +e.target.value })} className="mt-1 w-full rounded-lg border px-3 py-2" /></label>
            <label className="text-sm sm:col-span-2"><span className="font-medium">Mô tả</span><input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="mt-1 w-full rounded-lg border px-3 py-2" /></label>
          </div>

          <div className="rounded-lg border border-dashed p-4">
            <p className="text-sm font-medium">Thành phần sản phẩm</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <select value={selectedProduct} onChange={(e) => setSelectedProduct(e.target.value)} className="rounded-lg border px-3 py-2 text-sm">
                <option value="">Chọn sản phẩm</option>
                {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <input type="number" min={1} value={quantity} onChange={(e) => setQuantity(+e.target.value)} className="w-20 rounded-lg border px-2 py-2 text-sm" />
              <button type="button" onClick={addItem} className="rounded-lg bg-sage px-3 py-2 text-sm text-white">Thêm</button>
            </div>
            <ul className="mt-3 space-y-1 text-sm">
              {form.items.map((item) => {
                const p = products.find((x) => x.id === item.productId);
                return <li key={item.productId}>{item.quantity}x {p?.name ?? item.productId}</li>;
              })}
            </ul>
          </div>

          <div className="flex gap-2">
            <button type="submit" className="rounded-lg bg-terracotta px-4 py-2 text-sm text-white">{editingId ? 'Cập nhật' : 'Tạo'}</button>
            <button type="button" onClick={() => setShowForm(false)} className="rounded-lg border px-4 py-2 text-sm">Hủy</button>
          </div>
        </form>
      )}

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {combos.map((combo) => (
          <article key={combo.id} className="rounded-xl border bg-white p-5">
            <div className="flex justify-between">
              <div>
                <p className="text-xs text-sage">{combo.roomType} · {combo.durationHours}h</p>
                <h2 className="font-display text-xl font-semibold">{combo.name}</h2>
              </div>
              <p className="font-display text-xl font-semibold text-terracotta">{formatCurrency(combo.comboPrice)}</p>
            </div>
            <ul className="mt-3 text-sm text-slate-600">
              {combo.items.map((i) => <li key={i.id}>{i.quantity}x {i.productName}</li>)}
            </ul>
            <div className="mt-4 flex gap-2">
              <button type="button" onClick={() => { setForm({ name: combo.name, description: combo.description ?? '', roomType: combo.roomType, durationHours: combo.durationHours, comboPrice: combo.comboPrice, imageUrl: combo.imageUrl ?? '', isPublic: combo.isPublic, items: combo.items.map((i) => ({ productId: i.productId, quantity: i.quantity })) }); setEditingId(combo.id); setShowForm(true); }} className="text-sm text-terracotta">Sửa</button>
              <button type="button" onClick={() => api.combos.toggle(combo.id).then(load)} className="text-sm text-slate-600">Toggle</button>
              <button type="button" onClick={() => handleDelete(combo)} className="text-sm text-rose-600">Xóa</button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
