# Deploy Backend lên VPS (Windows)

## Vì sao CMD không hiện gì?

Thường do một trong các lý do sau:

1. **Chạy file `.exe` bằng double-click** → cửa sổ mở rồi **tắt ngay** nếu lỗi (không kịp đọc).
2. **Chạy sai thư mục** — thiếu `appsettings.json` hoặc `.dll` cạnh nhau.
3. **Chạy nền (service / `start /B`)** — log không ra CMD đang mở.
4. **Trước đây code có `ClearProviders()`** — tắt hết log console (đã sửa).

Luôn chạy trong **CMD/PowerShell đã mở sẵn**, không double-click file exe.

---

## Cách chạy đúng trên VPS Windows

### Bước 1: Publish trên máy dev (hoặc trên VPS nếu đã cài .NET 10 SDK)

```powershell
cd backend\HoltelCentrel.Api
dotnet publish -c Release -o .\publish
```

### Bước 2: Copy thư mục `publish` lên VPS

Copy cả folder (có `HoltelCentrel.Api.dll`, `appsettings.json`, …).

### Bước 3: Chạy trong CMD (giữ cửa sổ mở)

```cmd
cd C:\duong\dan\toi\publish

set ASPNETCORE_ENVIRONMENT=Production
set ASPNETCORE_URLS=http://0.0.0.0:5161
set PUBLIC_HOST=116.118.6.98
set FRONTEND_URL=http://116.118.6.98:8000
set Admin__Password=mat-khau-cua-ban
set Admin__TokenSecret=chuoi-bi-mat-dai

dotnet HoltelCentrel.Api.dll
```

Khi chạy **thành công**, sẽ thấy:

```
========================================
  Sao Dem Holtel API — dang chay
  Environment: Production
  URLs: http://0.0.0.0:5161
  Nhan Ctrl+C de dung
========================================
```

### Bước 4: Mở firewall VPS

Cho phép port **5161** (hoặc port bạn chọn) trong Windows Firewall + firewall nhà cung cấp VPS.

### Bước 5: Kiểm tra

Trên VPS hoặc máy khác:

```
http://IP-VPS:5161/api/rooms/availability
```

Phải trả JSON danh sách phòng.

---

## Frontend (Vercel) trỏ về VPS

Vercel → **Environment Variables**:

```
VITE_API_URL=http://IP-VPS:5161/api
```

(hoặc `https://api.tenmien.com/api` nếu có Nginx + SSL)

**Redeploy** Vercel sau khi đổi.

Trên VPS, set CORS:

```cmd
set FRONTEND_URL=https://holtel-center.vercel.app
```

---

## Chạy nền (không cần giữ CMD mở)

### Cách 1: NSSM (Windows Service) — khuyến nghị

1. Tải [NSSM](https://nssm.cc/)
2. `nssm install SaoDemApi`
3. Path: `C:\Program Files\dotnet\dotnet.exe`
4. Arguments: `C:\duong\dan\publish\HoltelCentrel.Api.dll`
5. Startup directory: thư mục `publish`
6. Thêm biến môi trường trong tab Environment

Log service xem trong NSSM hoặc file log bạn cấu hình.

### Cách 2: `start` trong CMD (tạm thời)

```cmd
start /B dotnet HoltelCentrel.Api.dll > api.log 2>&1
type api.log
```

---

## Lỗi thường gặp

| Triệu chứng | Cách xử lý |
|-------------|------------|
| CMD trống rồi tắt | Mở CMD trước, `cd` vào publish, chạy `dotnet HoltelCentrel.Api.dll` |
| `dotnet` không nhận lệnh | Cài [.NET 10 Runtime](https://dotnet.microsoft.com/download) trên VPS |
| Không truy cập từ ngoài | `ASPNETCORE_URLS=http://0.0.0.0:5161` + mở firewall |
| Vercel vẫn gọi localhost | Set `VITE_API_URL` trên Vercel → Redeploy |
| Mất data khi restart | Dùng đường dẫn DB cố định: `ConnectionStrings__DefaultConnection=Data Source=C:\data\holtelcentrel.db` |

---

## Nginx reverse proxy (tùy chọn, có HTTPS)

```nginx
server {
    listen 80;
    server_name api.tenmien.com;

    location / {
        proxy_pass http://127.0.0.1:5161;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Sau đó `VITE_API_URL=https://api.tenmien.com/api`
