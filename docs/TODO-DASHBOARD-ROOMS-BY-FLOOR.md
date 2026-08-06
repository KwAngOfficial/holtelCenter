# TODO — Tổng quan: danh sách phòng theo tầng

## Mục tiêu
Thiết kế lại khu vực **Tất cả phòng** trên trang Sơ đồ phòng (Admin Dashboard) cho chuyên nghiệp, dễ quét nhanh, và **phân nhóm theo tầng**.

## Luồng hiện tại
1. Dashboard load rooms + stats.
2. Filter theo trạng thái (tất cả / trống / đang thuê / dọn / bảo trì).
3. Hiển thị grid card phẳng — không group theo `floor`.

## Luồng mới
1. Load rooms như cũ.
2. Filter theo trạng thái (giữ filter card stats).
3. Group phòng đã lọc theo `floor` (sắp xếp tầng tăng dần).
4. Trong mỗi tầng: sort theo `roomNumber`.
5. Hiển thị section từng tầng + header tóm tắt (số phòng, mini-stats trạng thái).
6. (Tuỳ chọn) thanh nhảy tầng khi có ≥ 2 tầng.

## Checklist triển khai
- [x] Viết todo / luồng (file này)
- [x] Group `filteredRooms` theo `floor`
- [x] UI section theo tầng (header + grid cards)
- [x] Mini summary trạng thái trên header tầng
- [x] Floor jump khi nhiều tầng (≥2)
- [x] Empty state vẫn rõ ràng khi filter không có phòng
- [x] Giữ nguyên action / modal checkout · edit check-in; tinh chỉnh card UI

## Tiêu chí chấp nhận
- Lễ tân nhìn một tầng biết ngay có bao nhiêu phòng trống / đang thuê.
- Không vỡ layout mobile: section stack, grid 1→4 cột theo breakpoint.
- Không đổi API / schema; chỉ frontend group + UI.

## File chạm
- `frontend/src/pages/admin/AdminDashboard.tsx` — group + layout
- `frontend/src/components/RoomActionCard.tsx` — chỉ tinh chỉnh nhẹ nếu cần đồng bộ UI
