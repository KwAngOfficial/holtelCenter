# Setup ngân hàng & Webhook

## Mục tiêu

1. **Cấu hình ngân hàng** (admin): STK, tên chủ TK, BIN VietQR, prefix nội dung CK, webhook secret
2. **Webhook ngân hàng** (public): nhận báo có từ SePay / tương thích, khớp booking, đánh dấu đã thanh toán
3. **Checkout / hóa đơn**: hiện QR chuyển khoản + nội dung `PREFIX{bookingId}` khi đã setup ngân hàng

## Luồng setup (admin)

```
/admin/ngan-hang
  → GET /api/bank
  → form STK / BIN / tên NH / tên TK / prefix / secret / bật-tắt
  → PUT /api/bank
  → hiển thị URL webhook + lịch sử giao dịch gần đây
```

## Luồng thanh toán CK

```
Checkout (PATCH rooms status)
  → EndSession: Booking Completed, PaymentStatus=Unpaid
  → CheckoutBillingDto + bankTransfer (QR URL, STK, content)
  → CheckoutModal hiện QR

Khách/lễ tân chuyển khoản nội dung SD{bookingId}
  → SePay/bank → POST /api/webhooks/bank (Authorization: Apikey …)
  → verify secret
  → log BankPayment (idempotent theo gatewayTxId)
  → parse content → BookingId
  → amount match → PaymentStatus=Paid
```

## API

| Method | Path | Auth |
|--------|------|------|
| GET | `/api/bank` | Admin |
| PUT | `/api/bank` | Admin |
| GET | `/api/bank/payments?take=50` | Admin |
| POST | `/api/bank/payments/{bookingId}/mark-paid` | Admin (tiền mặt / thủ công) |
| POST | `/api/webhooks/bank` | Public + Webhook secret |
| POST | `/api/webhooks/sepay` | Alias webhook |

## Todo

- [x] File luồng này
- [x] Models + DbContext + migration
- [x] BankPaymentService + controllers + middleware
- [x] Checkout DTO + RoomSessionService
- [x] Frontend page /api / CheckoutModal