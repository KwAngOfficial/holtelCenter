import { type FormEvent, useCallback, useEffect, useState } from 'react';
import { api, getApiBase } from '../../api/client';
import { useToast } from '../../contexts/AdminProviders';
import type { BankPayment, BankSettings } from '../../types';
import { formatCurrency, formatDateTime } from '../../utils/format';

const emptyForm = {
  bankName: '',
  bankBin: '',
  accountNumber: '',
  accountName: '',
  transferContentPrefix: 'SD',
  webhookSecret: '',
  isEnabled: false,
  regenerateSecret: false,
};

export default function AdminBankPage() {
  const showToast = useToast();
  const [settings, setSettings] = useState<BankSettings | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [payments, setPayments] = useState<BankPayment[]>([]);
  const [saving, setSaving] = useState(false);
  const [showSecret, setShowSecret] = useState(false);

  const load = useCallback(async () => {
    const [s, p] = await Promise.all([api.bank.get(), api.bank.payments(50)]);
    setSettings(s);
    setForm({
      bankName: s.bankName,
      bankBin: s.bankBin,
      accountNumber: s.accountNumber,
      accountName: s.accountName,
      transferContentPrefix: s.transferContentPrefix || 'SD',
      webhookSecret: s.webhookSecret,
      isEnabled: s.isEnabled,
      regenerateSecret: false,
    });
    setPayments(p);
  }, []);

  useEffect(() => {
    load().catch((err) => console.error(err));
  }, [load]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updated = await api.bank.update({
        bankName: form.bankName,
        bankBin: form.bankBin,
        accountNumber: form.accountNumber,
        accountName: form.accountName,
        transferContentPrefix: form.transferContentPrefix,
        webhookSecret: form.webhookSecret || null,
        isEnabled: form.isEnabled,
        regenerateSecret: form.regenerateSecret,
      });
      setSettings(updated);
      setForm((f) => ({
        ...f,
        webhookSecret: updated.webhookSecret,
        regenerateSecret: false,
      }));
      showToast('Đã lưu cấu hình ngân hàng', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Lưu thất bại', 'error');
    } finally {
      setSaving(false);
    }
  };

  const copyText = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      showToast(`Đã copy ${label}`, 'success');
    } catch {
      showToast('Không copy được — hãy chọn và copy thủ công', 'warning');
    }
  };

  if (!settings) {
    return <div className="text-slate-500">Đang tải...</div>;
  }

  const webhookUrl = `${getApiBase().replace(/\/$/, '')}/webhooks/bank`;
  const sepayUrl = `${getApiBase().replace(/\/$/, '')}/webhooks/sepay`;

  return (
    <div className="min-w-0 max-w-4xl">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-espresso sm:text-3xl">Ngân hàng & Webhook</h1>
          <p className="mt-1 text-sm text-slate-500">
            Cấu hình STK nhận tiền, QR VietQR khi checkout, và webhook SePay
          </p>
        </div>
        <span
          className={`self-start rounded-full px-3 py-1 text-xs font-semibold ${
            settings.isEnabled
              ? 'bg-emerald-50 text-emerald-800 ring-1 ring-emerald-100'
              : 'bg-slate-100 text-slate-600 ring-1 ring-slate-200'
          }`}
        >
          {settings.isEnabled ? 'Đang bật CK' : 'Đang tắt'}
        </span>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm sm:col-span-2">
            <span className="font-medium text-espresso">Tên ngân hàng</span>
            <input
              value={form.bankName}
              onChange={(e) => setForm({ ...form, bankName: e.target.value })}
              placeholder="VD: MB Bank, Vietcombank"
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5"
            />
          </label>

          <label className="text-sm">
            <span className="font-medium text-espresso">Mã BIN / Bank code (VietQR)</span>
            <input
              value={form.bankBin}
              onChange={(e) => setForm({ ...form, bankBin: e.target.value })}
              placeholder="VD: 970422"
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5 font-mono"
              required={form.isEnabled}
            />
            <span className="mt-1 block text-[11px] text-slate-400">
              Tra mã tại trang VietQR / app ngân hàng — 6 số hoặc short code
            </span>
          </label>

          <label className="text-sm">
            <span className="font-medium text-espresso">Số tài khoản</span>
            <input
              value={form.accountNumber}
              onChange={(e) => setForm({ ...form, accountNumber: e.target.value })}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5 font-mono"
              required={form.isEnabled}
            />
          </label>

          <label className="text-sm sm:col-span-2">
            <span className="font-medium text-espresso">Tên chủ tài khoản</span>
            <input
              value={form.accountName}
              onChange={(e) => setForm({ ...form, accountName: e.target.value })}
              placeholder="VIẾT HOA KHÔNG DẤU"
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5 uppercase"
            />
          </label>

          <label className="text-sm">
            <span className="font-medium text-espresso">Prefix nội dung CK</span>
            <input
              value={form.transferContentPrefix}
              onChange={(e) => setForm({ ...form, transferContentPrefix: e.target.value })}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5 font-mono uppercase"
              maxLength={12}
            />
            <span className="mt-1 block text-[11px] text-slate-400">
              Ví dụ prefix <strong>SD</strong> → booking #42 có nội dung <strong>SD42</strong>
            </span>
          </label>

          <div className="text-sm">
            <span className="font-medium text-espresso">Webhook secret</span>
            <div className="mt-1 flex gap-2">
              <input
                type={showSecret ? 'text' : 'password'}
                value={form.webhookSecret}
                onChange={(e) => setForm({ ...form, webhookSecret: e.target.value, regenerateSecret: false })}
                className="min-w-0 flex-1 rounded-lg border border-slate-200 px-3 py-2.5 font-mono text-xs"
              />
              <button
                type="button"
                onClick={() => setShowSecret((v) => !v)}
                className="shrink-0 rounded-lg border border-slate-200 px-3 text-xs font-medium text-slate-600 hover:bg-slate-50"
              >
                {showSecret ? 'Ẩn' : 'Hiện'}
              </button>
            </div>
            <label className="mt-2 flex items-center gap-2 text-xs text-slate-600">
              <input
                type="checkbox"
                checked={form.regenerateSecret}
                onChange={(e) => setForm({ ...form, regenerateSecret: e.target.checked })}
              />
              Tạo secret mới khi lưu
            </label>
          </div>
        </div>

        <label className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm">
          <input
            type="checkbox"
            checked={form.isEnabled}
            onChange={(e) => setForm({ ...form, isEnabled: e.target.checked })}
            className="mt-0.5"
          />
          <span>
            <span className="font-semibold text-espresso">Bật nhận chuyển khoản &amp; hiện QR lúc checkout</span>
            <span className="mt-0.5 block text-xs text-slate-500">
              Khi tắt, webhook vẫn từ chối và hóa đơn không hiện QR
            </span>
          </span>
        </label>

        <div className="flex flex-wrap gap-2">
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-espresso px-5 py-2.5 text-sm font-semibold text-white hover:bg-espresso/90 disabled:opacity-50"
          >
            {saving ? 'Đang lưu…' : 'Lưu cấu hình'}
          </button>
          <button
            type="button"
            onClick={() => load().catch(console.error)}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium hover:bg-slate-50"
          >
            Tải lại
          </button>
        </div>
      </form>

      <section className="mt-6 space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <h2 className="text-base font-semibold text-espresso">URL webhook (dán vào SePay)</h2>
        <p className="text-xs text-slate-500">
          SePay gửi <strong>POST</strong> payload giao dịch. Endpoint trả{' '}
          <code className="rounded bg-slate-100 px-1">{`{"success": true}`}</code> (HTTP 200).
          URL phải là <strong>API backend</strong> (Render/VPS), không dùng domain Vercel.
          Auth API Key = Webhook secret → <code className="rounded bg-slate-100 px-1">Authorization: Apikey …</code>.
        </p>

        <div className="space-y-2">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <code className="min-w-0 flex-1 break-all rounded-lg bg-slate-50 px-3 py-2 text-xs text-espresso ring-1 ring-slate-100">
              {webhookUrl}
            </code>
            <button
              type="button"
              onClick={() => copyText(webhookUrl, 'URL webhook')}
              className="shrink-0 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-terracotta hover:bg-slate-50"
            >
              Copy
            </button>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <code className="min-w-0 flex-1 break-all rounded-lg bg-slate-50 px-3 py-2 text-xs text-espresso ring-1 ring-slate-100">
              {sepayUrl}
              <span className="ml-2 text-slate-400">(alias SePay)</span>
            </code>
            <button
              type="button"
              onClick={() => copyText(sepayUrl, 'URL SePay')}
              className="shrink-0 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-terracotta hover:bg-slate-50"
            >
              Copy
            </button>
          </div>
        </div>

        <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
          <p className="font-semibold text-slate-700">Header xác thực</p>
          <ul className="mt-1.5 list-inside list-disc space-y-1">
            <li>
              <code className="rounded bg-white px-1">Authorization: Apikey {'{secret}'}</code> (SePay)
            </li>
            <li>
              <code className="rounded bg-white px-1">Authorization: Bearer {'{secret}'}</code>
            </li>
            <li>
              <code className="rounded bg-white px-1">X-Api-Key: {'{secret}'}</code>
            </li>
          </ul>
        </div>
      </section>

      <section className="mt-6">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="text-base font-semibold text-espresso">Giao dịch webhook gần đây</h2>
          <button
            type="button"
            onClick={() => api.bank.payments(50).then(setPayments).catch(console.error)}
            className="text-sm font-medium text-terracotta hover:underline"
          >
            Làm mới
          </button>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="border-b bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-3 py-3 text-left">Thời gian</th>
                <th className="px-3 py-3 text-left">Số tiền</th>
                <th className="px-3 py-3 text-left">Nội dung</th>
                <th className="px-3 py-3 text-left">Booking</th>
                <th className="px-3 py-3 text-left">Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {payments.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-slate-400">
                    Chưa có giao dịch webhook
                  </td>
                </tr>
              ) : (
                payments.map((p) => (
                  <tr key={p.id} className="border-b border-slate-100 last:border-0">
                    <td className="px-3 py-3 whitespace-nowrap text-xs text-slate-600">
                      {formatDateTime(p.receivedAt)}
                    </td>
                    <td className="px-3 py-3 font-medium tabular-nums">{formatCurrency(p.amount)}</td>
                    <td className="max-w-[200px] truncate px-3 py-3 text-xs text-slate-600" title={p.content ?? ''}>
                      {p.content || '—'}
                    </td>
                    <td className="px-3 py-3 text-xs">
                      {p.bookingId != null ? (
                        <span>
                          #{p.bookingId}
                          {p.roomNumber ? ` · P.${p.roomNumber}` : ''}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="px-3 py-3">
                      <span
                        className={`inline-flex rounded-md px-2 py-0.5 text-[11px] font-semibold ${
                          p.status === 'Matched'
                            ? 'bg-emerald-50 text-emerald-800'
                            : p.status === 'Unmatched'
                              ? 'bg-amber-50 text-amber-900'
                              : p.status === 'Duplicate'
                                ? 'bg-slate-100 text-slate-600'
                                : 'bg-slate-50 text-slate-600'
                        }`}
                        title={p.matchNote ?? undefined}
                      >
                        {p.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
