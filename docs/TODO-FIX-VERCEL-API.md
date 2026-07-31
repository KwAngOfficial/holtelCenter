# Fix — Vercel 405 Method Not Allowed trên /api/auth/login

## Nguyên nhân

`public/config.js` set `window.__API_BASE__ = '/api'` cho mọi host không phải localhost.

Trên Vercel, request đi tới:
`https://*.vercel.app/api/auth/login` → static host không có POST API → **405**.

`resolveApiBase()` ưu tiên `__API_BASE__` hơn `VITE_API_URL` / Render URL.

## Luồng sửa

1. `config.js`: bỏ qua hostname `*.vercel.app` (để dùng `VITE_API_URL` / fallback Render)
2. Redeploy Vercel (hoặc chỉ cần file `config.js` mới trong dist)
3. Kiểm tra login → Request URL phải là `https://holtelcenter.onrender.com/api/auth/login`

## Todo

| # | Việc | Status |
|---|------|--------|
| 1 | Sửa config.js skip vercel.app | done |
| 2 | Xác nhận vercel.json VITE_API_URL đúng | done (`https://holtelcenter.onrender.com/api`) |
