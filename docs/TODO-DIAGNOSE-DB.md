# Chẩn đoán — App không thấy data Supabase / thêm phòng không nhận

## Hiện tượng

- Data cũ mất
- Thêm phòng trên [Supabase Editor](https://supabase.com/dashboard/project/aepgggsewieagxlwocxo/editor) → site (Vercel) **không** hiện

## Kết luận gần như chắc

**API mà Vercel gọi (Render) đang nối DB khác** (thường SQLite cũ trên disk Render), **không** phải project Supabase bạn đang sửa.

```
Bạn sửa: Supabase Editor
Vercel gọi: https://holtelcenter.onrender.com  →  DB khác / SQLite tạm
```

## Luồng kiểm tra

1. Mở: `https://holtelcenter.onrender.com/api/health`
2. Xem `databaseHost` + `roomCount`
3. So với Editor: số phòng / host phải khớp `*.pooler.supabase.com` hoặc `*.supabase.co`

| Kết quả health | Ý nghĩa |
|----------------|---------|
| Host chứa `supabase` + roomCount khớp Editor | Đúng DB |
| Host `null` / không supabase / roomCount khác | Render chưa set ConnectionStrings |
| API lỗi / sleep | Đợi wake rồi thử lại |

## Luồng sửa (Render)

1. Render → Service API → **Environment**
2. Thêm / sửa:

```
ConnectionStrings__DefaultConnection=Host=aws-0-ap-northeast-1.pooler.supabase.com;Port=5432;Database=postgres;Username=postgres.aepgggsewieagxlwocxo;Password=MAT_KHAU_DB;SSL Mode=Require;Trust Server Certificate=true
```

3. **Manual Deploy** / Restart
4. Gọi lại `/api/health` → `databaseHost` phải có `pooler.supabase.com`
5. Thêm 1 phòng trên Editor → refresh site → phải thấy

## Lưu ý Table Editor

EF dùng bảng `"Rooms"` (chữ R hoa). Thêm đúng cột: `Name`, `RoomNumber`, `RoomType`, `Floor`, `Status`, `IsPublic`, `CreatedAt` (timestamp UTC).

Status: `0`=Available, `1`=Occupied, `2`=Cleaning, `3`=Maintenance (enum int).

## Todo code

| # | Việc | Status |
|---|------|--------|
| 1 | Endpoint `GET /api/health` (host + roomCount, không lộ password) | done |
| 2 | Public trong AdminAuthMiddleware | done |
| 3 | Log DB host khi startup | done |
