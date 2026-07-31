# Cấu hình production — VPS + Domain (khuyến nghị)

Sửa 2 giá trị sau khi có domain:

- `YOUR_DOMAIN` → ví dụ: `saodemhotel.vn`
- `YOUR_VPS_IP` → IP VPS, ví dụ: `116.118.6.98`

## Luồng nhanh (tóm tắt)

| # | Việc | Ở đâu |
|---|------|--------|
| 1 | DNS A `@` + `www` → IP VPS | Nhà cung cấp domain |
| 2 | `.\scripts\build-production.ps1` | Máy dev (Windows) |
| 3 | Upload `release/saodem-api.zip` → `/var/www/saodem/api/` | VPS |
| 4 | Upload `release/saodem-web.zip` → `/var/www/saodem/web/` | VPS |
| 5 | Cấu hình systemd + Nginx + Certbot | VPS (Linux) |
| 6 | Mở `https://YOUR_DOMAIN/admin/login` → thấy **API: /api** | Trình duyệt |

**Một lệnh build trên máy dev:**

```powershell
cd "D:\Desktop\Self_Project\Holtel Centrel"
.\scripts\build-production.ps1
```

Sau đó upload 2 file zip trong `release/` lên VPS (WinSCP, FileZilla, hoặc `scp`).

## Kiến trúc

```
Internet
   │
   ▼
https://YOUR_DOMAIN          ← Nginx (443) phục vụ React (dist/)
https://YOUR_DOMAIN/api/...  ← Nginx proxy → Backend 127.0.0.1:5161
```

**Ưu điểm:** Cùng domain → **không lỗi CORS**, không lộ port 5161 ra ngoài.

---

## Bước 1 — DNS

Tại nhà cung cấp domain, thêm bản ghi:

| Loại | Tên | Giá trị |
|------|-----|---------|
| A | `@` | YOUR_VPS_IP |
| A | `www` | YOUR_VPS_IP |

Đợi 5–30 phút, kiểm tra: `ping YOUR_DOMAIN`

---

## Bước 2 — Build trên máy dev

### Backend

```bash
cd backend/HoltelCentrel.Api
dotnet publish -c Release -o ./publish
```

Upload folder `publish/` lên VPS: `/var/www/saodem/api/`

### Frontend

```bash
cd frontend
npm install
npm run build
```

Upload folder `dist/` lên VPS: `/var/www/saodem/web/`

File `dist/config.js` mặc định dùng `/api` (cùng domain).

---

## Bước 3 — Cấu hình Backend trên VPS (Linux)

Tạo file `/var/www/saodem/api/.env` (hoặc dùng `deploy/backend.env.example`):

```bash
ASPNETCORE_ENVIRONMENT=Production
ASPNETCORE_URLS=http://127.0.0.1:5161
FRONTEND_URL=https://YOUR_DOMAIN,https://www.YOUR_DOMAIN
Admin__Password=MAT_KHAU_MANH
Admin__TokenSecret=CHUOI_BI_MAT_DAI_NGẪU_NHIEN
Admin__SessionDays=30
# Supabase PostgreSQL (xem docs/TODO-SUPABASE-MIGRATE.md)
ConnectionStrings__DefaultConnection=Host=aws-0-ap-northeast-1.pooler.supabase.com;Port=5432;Database=postgres;Username=postgres.aepgggsewieagxlwocxo;Password=YOUR_PASSWORD;SSL Mode=Require;Trust Server Certificate=true
```


Thư mục app:

```bash
sudo mkdir -p /var/www/saodem
sudo chown -R www-data:www-data /var/www/saodem
```

### Systemd service

Copy `deploy/saodem-api.service` → `/etc/systemd/system/saodem-api.service`

Sửa `YOUR_DOMAIN` trong service nếu cần, rồi:

```bash
sudo systemctl daemon-reload
sudo systemctl enable saodem-api
sudo systemctl start saodem-api
sudo systemctl status saodem-api
```

Kiểm tra nội bộ:

```bash
curl http://127.0.0.1:5161/api/rooms/availability
```

---

## Bước 4 — Nginx + SSL

```bash
sudo apt update
sudo apt install -y nginx certbot python3-certbot-nginx
```

Copy `deploy/nginx.conf.example` → `/etc/nginx/sites-available/saodem`

Sửa `YOUR_DOMAIN`, enable site:

```bash
sudo ln -s /etc/nginx/sites-available/saodem /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

Cấp SSL miễn phí:

```bash
sudo certbot --nginx -d YOUR_DOMAIN -d www.YOUR_DOMAIN
```

---

## Bước 5 — Firewall

```bash
sudo ufw allow 80
sudo ufw allow 443
sudo ufw allow 22
sudo ufw enable
```

**Không** mở port 5161 ra internet (API chỉ qua Nginx).

---

## Bước 6 — Kiểm tra

1. `https://YOUR_DOMAIN` → trang chủ, có phòng
2. `https://YOUR_DOMAIN/admin/login` → dòng **API: /api**
3. `https://YOUR_DOMAIN/api/rooms/availability` → JSON
4. Đăng nhập admin bằng `Admin__Password`

---

## Cập nhật phiên bản mới

```bash
# Trên máy dev
dotnet publish ... && npm run build

# Upload lên VPS, rồi:
sudo systemctl restart saodem-api
# (frontend chỉ cần thay file trong /var/www/saodem/web/)
```

---

## Phương án B — API subdomain

Nếu muốn `https://api.YOUR_DOMAIN`:

1. DNS: `A api → YOUR_VPS_IP`
2. Nginx server block riêng cho `api.YOUR_DOMAIN` → proxy 5161
3. Sửa `frontend/public/config.js` trên VPS:

```javascript
window.__API_BASE__ = 'https://api.YOUR_DOMAIN/api';
```

4. Backend `.env`: `FRONTEND_URL=https://YOUR_DOMAIN`

---

## Windows VPS

Xem thêm `DEPLOY-VPS.md`. Dùng IIS hoặc Nginx for Windows + tương tự reverse proxy `/api`.

---

## Xử lý lỗi

| Lỗi | Cách sửa |
|-----|----------|
| API vẫn gọi `localhost` | Upload `dist` mới + `config.js` có `__API_BASE__='/api'` |
| 502 Bad Gateway | `systemctl status saodem-api` — backend chưa chạy |
| CORS | Dùng cùng domain `/api` hoặc set `FRONTEND_URL` |
| SSL | `certbot renew --dry-run` |
