# Luồng — Chỉnh giờ thuê (bánh răng)

## Mục tiêu

Trên ô phòng **Đang thuê**, thêm nút bánh răng nhỏ để sửa **giờ vào**, cập nhật ước tính tiền.

## Luồng UI

1. Admin mở Tổng quan → phòng Occupied có phiên active
2. Bấm ⚙ cạnh dòng "Vào: …"
3. Modal: `datetime-local` (giờ VN), xem trước ước tính (optional: sau khi lưu reload)
4. Lưu → `PATCH /api/rooms/{id}/check-in` → reload sơ đồ

## Luồng API

| Method | Path | Body |
|--------|------|------|
| PATCH | `/api/rooms/{id}/check-in` | `{ "checkInLocal": "2026-08-01T14:30:00" }` |

- Chỉ khi phòng `Occupied` + có booking `Active`
- `checkInLocal` = giờ Việt Nam → lưu UTC
- Không cho giờ vào sau thời điểm hiện tại (+5 phút buffer)

## Todo

| # | Việc | Status |
|---|------|--------|
| 1 | DTO + `FromVietnamLocal` + `UpdateCheckInAsync` | done |
| 2 | Endpoint RoomsController | done |
| 3 | API client + modal + bánh răng trên card | done |
| 4 | Wire AdminDashboard reload/toast | done |
