# Deploy lên Vercel + Render (free tier)

Kiến trúc khuyến nghị:

| Thành phần | Nền tảng | Lý do |
|------------|----------|--------|
| **Frontend** (React/Vite) | **Vercel** | Free, CDN nhanh, SPA routing sẵn |
| **Backend** (.NET API) | **Render** | Free Web Service, hỗ trợ Docker/.NET |

> Vercel **không** chạy tốt ASP.NET Core API lâu dài → backend đặt trên Render.

---

## Bước 0: Đưa code lên GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/<user>/holtel-centrel.git
git push -u origin main
```

---

## Bước 1: Deploy Backend lên Render (free)

1. Vào [render.com](https://render.com) → **New** → **Web Service**
2. Kết nối repo GitHub
3. Cấu hình:

| Mục | Giá trị |
|-----|---------|
| **Name** | `saodem-api` (hoặc tên bạn chọn) |
| **Region** | Singapore (gần VN) |
| **Branch** | `main` |
| **Root Directory** | *(để trống)* |
| **Runtime** | **Docker** |
| **Dockerfile Path** | `Dockerfile` hoặc `backend/HoltelCentrel.Api/Dockerfile` |
| **Docker Context** | `.` *(bắt buộc — thư mục gốc repo, KHÔNG dùng `backend/HoltelCentrel.Api`)* |
| **Instance Type** | **Free** |

4. **Environment Variables** (bắt buộc):

| Key | Giá trị |
|-----|---------|
| `ASPNETCORE_ENVIRONMENT` | `Production` |
| `Admin__Password` | Mật khẩu quản trị (tự đặt, mạnh) |
| `Admin__TokenSecret` | Chuỗi bí mật dài ngẫu nhiên |
| `FRONTEND_URL` | *(điền sau bước 2)* URL Vercel, vd: `https://saodem.vercel.app` |

5. **Create Web Service** → đợi build (~5–10 phút lần đầu)

6. Copy URL API, ví dụ: `https://saodem-api.onrender.com`

7. Kiểm tra: mở `https://saodem-api.onrender.com/api/rooms/availability` — phải trả JSON.

### Deploy nhanh bằng Blueprint

Repo có file `render.yaml`. Trên Render: **New** → **Blueprint** → chọn repo → điền biến môi trường khi được hỏi.

### Lưu ý Render free

- **Cold start**: API ngủ sau ~15 phút không dùng, lần mở đầu có thể **chậm 30–60 giây**
- **SQLite**: dữ liệu có thể **mất khi redeploy** (free tier không có ổ cứng persistent). Phù hợp demo; production nên dùng PostgreSQL hoặc Render Disk (trả phí)

---

## Bước 2: Deploy Frontend lên Vercel (free)

1. Vào [vercel.com](https://vercel.com) → **Add New Project** → import repo GitHub
2. Cấu hình:

| Mục | Giá trị |
|-----|---------|
| **Framework Preset** | Vite |
| **Root Directory** | `frontend` |
| **Build Command** | `npm run build` |
| **Output Directory** | `dist` |

3. **Environment Variables**:

| Key | Giá trị |
|-----|---------|
| `VITE_API_URL` | `https://saodem-api.onrender.com/api` *(URL Render + `/api`)* |

4. **Deploy**

5. Copy URL Vercel, ví dụ: `https://saodem.vercel.app`

6. Quay lại **Render** → service API → **Environment** → thêm/cập nhật:

```
FRONTEND_URL=https://saodem.vercel.app
```

7. **Manual Deploy** hoặc đợi auto-redeploy trên Render để CORS nhận domain Vercel.

---

## Bước 3: Kiểm tra

1. Mở URL Vercel → trang chủ hiển thị phòng/combo
2. Vào `/admin` → đăng nhập bằng `Admin__Password` đã đặt trên Render
3. Nếu lỗi CORS: kiểm tra `FRONTEND_URL` khớp đúng domain Vercel (không có `/` cuối)

---

## Phương án B: Cả hai trên Render

Repo có `render.yaml` với 2 service:

- `saodem-api` — Docker (.NET)
- `saodem-web` — Static Site (React)

1. Render → **New** → **Blueprint** → chọn repo
2. Đặt biến:
   - `Admin__Password`
   - `VITE_API_URL` = `https://<tên-api>.onrender.com/api`
   - `FRONTEND_URL` = `https://<tên-web>.onrender.com`

Frontend static trên Render cũng free; tốc độ CDN thường kém Vercel một chút.

---

## Biến môi trường tham khảo

### Backend (Render)

```
ASPNETCORE_ENVIRONMENT=Production
Admin__Password=<mat-khau-quan-tri>
Admin__TokenSecret=<chuoi-bi-mat-dai>
Admin__SessionDays=30
FRONTEND_URL=https://your-app.vercel.app
ConnectionStrings__DefaultConnection=Data Source=holtelcentrel.db
```

### Frontend (Vercel)

```
VITE_API_URL=https://your-api.onrender.com/api
```

---

## Custom domain (tùy chọn)

- **Vercel**: Settings → Domains → thêm domain → cập nhật `FRONTEND_URL` trên Render
- **Render**: Settings → Custom Domains cho API

---

### Lỗi Docker `HoltelCentrel.Api.csproj: not found`

Render mặc định dùng **context = thư mục gốc repo**. Cấu hình:

- **Dockerfile Path**: `Dockerfile` (file ở gốc repo)
- **Docker Context**: `.`

Sau đó push code mới và **Manual Deploy** lại.

---

## Troubleshooting

| Triệu chứng | Cách xử lý |
|-------------|------------|
| Docker `csproj: not found` | Dockerfile Path = `Dockerfile`, Docker Context = `.` (gốc repo) |
| Trang trắng / 404 khi refresh | Đã có `vercel.json` rewrite SPA; redeploy Vercel |
| `Failed to fetch` / CORS | Kiểm tra `FRONTEND_URL` và `VITE_API_URL` |
| API chậm lần đầu | Render free cold start — bình thường |
| Mất dữ liệu sau deploy | SQLite free tier — dùng PostgreSQL nếu cần giữ lâu dài |
| 401 admin | Dùng mật khẩu từ `Admin__Password` trên Render, không phải local |
