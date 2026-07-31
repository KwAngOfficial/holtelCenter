# Todo — Đổi database sang Supabase (PostgreSQL)

Project: [Supabase Table Editor](https://supabase.com/dashboard/project/aepgggsewieagxlwocxo/editor)  
Project ref: `aepgggsewieagxlwocxo`

## Mục tiêu

Backend ASP.NET Core bỏ SQLite (`holtelcentrel.db`) → dùng **PostgreSQL trên Supabase**. Data bền vững, xem/sửa bảng trực tiếp trên dashboard.

## Kiến trúc sau khi xong

```
Frontend → Backend API → Supabase PostgreSQL
                         (db.aepgggsewieagxlwocxo.supabase.co)
```

## Luồng triển khai

### Luồng 1 — Lấy connection string từ Supabase

1. Vào [Project Settings → Database](https://supabase.com/dashboard/project/aepgggsewieagxlwocxo/settings/database)
2. Copy **Connection string** (URI hoặc .NET / ADO.NET)
3. Lấy password database (đã set lúc tạo project; nếu quên → Reset database password)
4. Dùng dạng Npgsql:

**Quan trọng:** Host `db.*.supabase.co` là **IPv6-only**. Máy Windows/mạng IPv4 sẽ lỗi DNS (`SocketException 11004`). Dùng **Connection Pooler (IPv4)**:

```
Host=aws-0-ap-northeast-1.pooler.supabase.com;Port=5432;Database=postgres;Username=postgres.aepgggsewieagxlwocxo;Password=YOUR_PASSWORD;SSL Mode=Require;Trust Server Certificate=true
```

> Project này ở region **ap-northeast-1** (Tokyo). Copy chính xác từ Dashboard → **Connect** → Session mode nếu đổi region.

### Luồng 2 — Đổi code backend (repo)

| # | Việc | Status |
|---|------|--------|
| 1 | Thêm package `Npgsql.EntityFrameworkCore.PostgreSQL`, bỏ Sqlite | done |
| 2 | `Program.cs`: `UseSqlite` → `UseNpgsql` | done |
| 3 | Cập nhật `appsettings*.json` + `deploy/backend.env.example` | done |
| 4 | Ghi chú connection string qua env (không commit password) | done |
| 5 | Build backend xác nhận OK | done |

### Việc bạn cần làm (password thật)

1. [Database Settings](https://supabase.com/dashboard/project/aepgggsewieagxlwocxo/settings/database) → copy password (hoặc Reset)
2. Thay `YOUR_PASSWORD` trong `appsettings.json` **local** hoặc set env:

```powershell
$env:ConnectionStrings__DefaultConnection="Host=db.aepgggsewieagxlwocxo.supabase.co;Port=5432;Database=postgres;Username=postgres;Password=MAT_KHAU_THAT;SSL Mode=Require;Trust Server Certificate=true"
cd backend\HoltelCentrel.Api
dotnet run
```

3. Mở [Table Editor](https://supabase.com/dashboard/project/aepgggsewieagxlwocxo/editor) — sẽ thấy bảng sau lần chạy đầu (EnsureCreated + seed)

### Luồng 4 — Production / VPS

1. Env: `ConnectionStrings__DefaultConnection=<chuỗi Supabase>`
2. Bỏ path SQLite cũ trên disk VPS
3. Restart API service

## Lưu ý bảo mật

- **Không** commit password Supabase vào Git
- Prefer biến môi trường / User Secrets
- Restrict: chỉ backend gọi DB; không expose connection string ra frontend

## Checklist kiểm tra

- [ ] API start không lỗi kết nối
- [ ] `GET /api/rooms/availability` trả JSON
- [ ] Bảng hiện trên Supabase Editor
- [ ] Admin CRUD phòng vẫn hoạt động
