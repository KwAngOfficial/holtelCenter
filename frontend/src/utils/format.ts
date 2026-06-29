export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount);
}

export const roomStatusLabel: Record<string, string> = {
  Available: 'Trống',
  Occupied: 'Đang thuê',
  Cleaning: 'Dọn dẹp',
  Maintenance: 'Bảo trì',
};

export const roomStatusColor: Record<string, string> = {
  Available: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  Occupied: 'bg-rose-100 text-rose-800 border-rose-200',
  Cleaning: 'bg-amber-100 text-amber-800 border-amber-200',
  Maintenance: 'bg-slate-100 text-slate-700 border-slate-200',
};

export const dayTypeLabel: Record<string, string> = {
  Weekday: 'Ngày thường',
  Weekend: 'Cuối tuần',
  Holiday: 'Ngày lễ',
};

export function formatDateTime(value: string): string {
  const date = new Date(value);
  return date.toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
