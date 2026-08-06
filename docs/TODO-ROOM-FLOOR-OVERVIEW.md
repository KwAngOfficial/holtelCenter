# Redesign: Danh sách phòng theo tầng (Tổng quan)

## Mục tiêu

Thiết kế lại khu **Tất cả phòng** trên `/admin` (Sơ đồ phòng) để:

- Nhìn chuyên nghiệp hơn (ops/PMS, dễ quét trạng thái)
- Dễ sử dụng hơn (hành động 1–2 click, filter rõ)
- **Phân nhóm theo tầng** + nhảy nhanh giữa các tầng

## Phạm vi

| Trong scope | Ngoài scope |
|-------------|-------------|
| `AdminDashboard.tsx` — list phòng | API / backend |
| `RoomActionCard.tsx` — card thao tác | CRUD Phòng (`/admin/phong`) |
| Token & pattern admin hiện có | Public site rooms |

## Luồng nghiệp vụ (ops)

```
Load dashboard + rooms (poll 30s)
        │
        ▼
┌───────────────────┐
│ Stat filter cards │ ──► filter = all | Available | Occupied | Cleaning | Maintenance
└─────────┬─────────┘
          │
          ▼
  filteredRooms → group by floor → sort floor asc, roomNumber numeric
          │
          ▼
┌─────────────────────────────────────────────┐
│ Floor jump nav (sticky)                     │
│  Tầng 1 · 8 phòng · 2 thuê · 5 trống …      │
└─────────────────────┬───────────────────────┘
                      │ scrollIntoView
                      ▼
┌─────────────────────────────────────────────┐
│ Section Tầng N (sticky header khi scroll)   │
│  badge trạng thái trên tầng                 │
│  grid RoomActionCard                        │
└─────────────────────┬───────────────────────┘
                      │ Nhận khách / Checkout / …
                      ▼
           confirm → patch status → toast / bill → reload
```

## Luồng UI mục tiêu

### 1. Header khu vực list

- Tiêu đề: **Tất cả phòng** (hoặc label filter) + số phòng + số tầng
- Mô tả ngắn: phân theo tầng
- Nút **Xem tất cả** khi đang filter status

### 2. Floor jump

- Chỉ hiện khi ≥ 2 tầng (sau filter)
- Sticky dưới header trang khi scroll list dài
- Click → scroll tới `#floor-{n}`
- Hiển thị tóm tắt: tổng phòng, đang thuê (nếu > 0)

### 3. Floor section

- Badge “Tầng N” + số phòng
- Chip count: Trống / Đang thuê / Dọn / Bảo trì
- Grid card responsive (2 → 3 → 4 cột)
- Empty state khi filter không còn phòng

### 4. Room card (quét nhanh)

- **Ưu tiên scan:** số phòng + badge trạng thái
- Meta gọn: tên + loại phòng (không lặp “Tầng” trong card)
- Occupied: block phiên (giờ vào, ước tính, xem trước HĐ, sửa giờ)
- CTA chính theo trạng thái (primary row)
- Tùy chọn nâng cao thu gọn

## Tiêu chí chấp nhận

- [x] Phòng được nhóm theo `room.floor`, tầng tăng dần
- [x] Trong tầng, phòng sort theo `roomNumber` (numeric)
- [x] Filter status vẫn hoạt động; nhóm tầng theo danh sách đã lọc
- [x] Jump nav cuộn mượt tới đúng tầng
- [x] Card nhìn sạch, tương phản đủ, CTA rõ (desktop + mobile)
- [x] Không đổi API / backend

## Todo implement

- [x] Phân tích code hiện tại (`AdminDashboard`, `RoomActionCard`)
- [x] Viết file luồng này
- [x] Polish `AdminDashboard` (sticky floor nav, section header, empty)
- [x] Redesign `RoomActionCard` (hierarchy, session, actions)
- [x] Kiểm tra lint / review nhanh

## Files đụng chạm

1. `frontend/src/pages/admin/AdminDashboard.tsx`
2. `frontend/src/components/RoomActionCard.tsx`
3. `docs/TODO-ROOM-FLOOR-OVERVIEW.md` (file này)
