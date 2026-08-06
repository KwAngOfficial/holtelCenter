# Fix layout dashboard phòng (tablet + chống chồng)

## Vấn đề

- Sticky **thanh tầng** (`top-0`) + sticky **header mỗi tầng** (`top-[3.25rem]`) chồng nhau
- Chiều cao thanh tầng thay đổi khi wrap → offset sai → UI đè lên
- `overflow-hidden` trên section làm sticky/clip lạ
- Grid/nút CTA chưa tối ưu độ rộng tablet (~768–1024)

## Hướng xử lý

1. Bỏ sticky header từng tầng (chỉ giữ thanh nhảy tầng, 1 hàng horizontal-scroll)
2. Section tầng `overflow-visible` / bo góc bằng nested container
3. Grid: mobile 1 · tablet 2 · desktop 3 · xl 4
4. Stat cards: 2 cột mobile, 3 tablet, 6 desktop
5. Room card: nút CTA xếp dọc khi hẹp, min-width/touch size

## Todo

- [x] Chẩn đoán sticky/z-index overlap
- [x] Sửa `AdminDashboard.tsx`
- [x] Sửa `RoomActionCard.tsx` (CTA, truncate)
- [x] `AdminLayout` min-w-0 + overflow tablet
- [x] Cập nhật checklist
