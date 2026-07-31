# Luồng: Vercel (frontend) + Backend + Supabase

Project DB: [Supabase Editor](https://supabase.com/dashboard/project/aepgggsewieagxlwocxo/editor)

## Quan trọng

**Vercel không chạy backend .NET** và **không nối thẳng PostgreSQL** trong kiến trúc hiện tại.

```
User → Vercel (React) → Backend API (Render / VPS) → Supabase PostgreSQL
```

Supabase chỉ là **database của backend**. Frontend vẫn gọi API qua `VITE_API_URL`.

---

## Todo checklist

| # | Việc | Ở đâu |
|---|------|--------|
| 1 | Backend đã dùng Npgsql + pooler Supabase | Repo (đã xong) |
| 2 | Set `ConnectionStrings__DefaultConnection` = pooler Tokyo | Render / VPS |
| 3 | Deploy / restart backend | Render / VPS |
| 4 | Kiểm tra `https://API/api/rooms/availability` | Browser |
| 5 | Vercel env `VITE_API_URL` = URL backend `/api` | Vercel |
| 6 | Backend env `FRONTEND_URL` = URL Vercel | Render / VPS |
| 7 | Redeploy Vercel | Vercel |

---

## Bước 1 — Backend trỏ Supabase

Trên **Render** (hoặc VPS), Environment:

```
ConnectionStrings__DefaultConnection=Host=aws-0-ap-northeast-1.pooler.supabase.com;Port=5432;Database=postgres;Username=postgres.aepgggsewieagxlwocxo;Password=MAT_KHAU_DB;SSL Mode=Require;Trust Server Certificate=true
ASPNETCORE_ENVIRONMENT=Production
FRONTEND_URL=https://YOUR_APP.vercel.app
Admin__Password=...
Admin__TokenSecret=...
```

> Host phải là **pooler** (`aws-0-ap-northeast-1...`), không dùng `db.*.supabase.co` (IPv6 — Render/Vercel mạng thường chỉ IPv4).

Restart service. Kiểm tra:

```
https://holtelcenter.onrender.com/api/rooms/availability
```

(hoặc URL API của bạn) → JSON phòng. Bảng hiện trên [Editor](https://supabase.com/dashboard/project/aepgggsewieagxlwocxo/editor).

---

## Bước 2 — Vercel trỏ về Backend

Vercel → Project → **Settings → Environment Variables**:

| Name | Value | Environment |
|------|--------|-------------|
| `VITE_API_URL` | `https://holtelcenter.onrender.com/api` | Production (và Preview nếu cần) |

Hoặc sửa `frontend/vercel.json` → `build.env.VITE_API_URL` cho khớp URL API thật.

**Redeploy** Vercel (bắt buộc — `VITE_*` nhúng lúc build).

---

## Bước 3 — CORS

Backend phải cho phép origin Vercel:

```
FRONTEND_URL=https://holtel-center.vercel.app
```

(không có `/` cuối; thêm domain custom nếu có: `https://a.com,https://www.a.com`)

Code đã cho phép `*.vercel.app` — vẫn nên set `FRONTEND_URL` rõ ràng.

---

## Không làm gì trên Vercel liên quan Supabase?

Đúng với setup hiện tại:

- Không cần `SUPABASE_URL` / `SUPABASE_ANON_KEY` trên Vercel
- Không đổi frontend gọi thẳng Supabase
- Chỉ cần `VITE_API_URL` → backend đã nối Supabase

---

## Kiểm tra cuối

1. Mở site Vercel → trang chủ có phòng
2. `/admin/login` → dòng API = URL Render (không phải localhost)
3. Đăng nhập, CRUD → data đổi trên Supabase Editor

---

## Lỗi thường gặp

| Lỗi | Sửa |
|-----|-----|
| Vercel vẫn gọi localhost / API cũ | Đổi `VITE_API_URL` + **Redeploy** |
| CORS | Set `FRONTEND_URL` đúng domain Vercel |
| API lỗi DNS / IPv6 | Dùng pooler `aws-0-ap-northeast-1...` |
| Data không hiện trên Supabase | Backend chưa set ConnectionStrings mới / chưa restart |
