# Deploy frontend lên VPS (Windows)

## Vì sao vẫn lỗi `localhost:5161`?

Trang `http://116.118.6.98:8000` đang dùng **file JS cũ** (build trước khi sửa).

Dấu hiệu bản cũ:
- Console: `Chưa cấu hình VITE_API_URL trên Vercel...`
- Request vẫn tới `http://localhost:5161/api/...`

## Cách sửa (làm đúng thứ tự)

### Bước 1 — Build trên máy dev

```powershell
cd frontend
npm install
npm run build
```

### Bước 2 — Copy TOÀN BỘ folder `dist` lên VPS

Copy **hết** nội dung `frontend/dist/` vào thư mục web port 8000:

```
dist/
  index.html          ← BẮT BUỘC (trỏ file JS mới)
  config.js           ← BẮT BUỘC
  assets/
    index-xxxxx.js    ← file JS mới (hash khác bản cũ)
    index-xxxxx.css
```

**Không** chỉ copy 1 file — phải thay **cả folder**, đặc biệt `index.html` + `assets/`.

### Bước 3 — Xóa cache trình duyệt

`Ctrl + Shift + R` hoặc mở tab ẩn danh.

### Bước 4 — Kiểm tra

Mở `/admin/login`, dưới form phải thấy:

```
API: http://116.118.6.98:5161/api · build 2026-07-21
```

Nếu vẫn thấy `localhost:5161` → chưa upload đúng bản mới.

---

## Sửa nhanh không build lại (chỉ `config.js`)

Nếu chưa kịp build, upload file `frontend/public/config.js` lên VPS (cùng thư mục `index.html`) và thêm vào `index.html` **trước** `<div id="root">`:

```html
<script src="/config.js"></script>
```

`config.js` tự set API = `http://116.118.6.98:5161/api`.

**Vẫn cần** file JS mới (`npm run build`) để app đọc `window.__API_BASE__`.

---

## Backend trên VPS (port 5161)

```cmd
set ASPNETCORE_URLS=http://0.0.0.0:5161
set PUBLIC_HOST=116.118.6.98
set FRONTEND_URL=http://116.118.6.98:8000
dotnet HoltelCentrel.Api.dll
```

Test: `http://116.118.6.98:5161/api/rooms/availability`
