# SePay Webhook (chuẩn)

## Spec SePay

1. Mỗi giao dịch → SePay gửi **HTTP POST** tới URL webhook của bạn
2. Endpoint phải trả **HTTP 200** + body **`{"success": true}`** trong **30 giây**
3. Nếu không (timeout / 4xx / 5xx) → SePay **retry** theo lịch
4. Khóa chống trùng: field **`id`** (integer, không đổi khi retry)

## Payload (POST body)

```json
{
  "id": 92704,
  "gateway": "Vietcombank",
  "transactionDate": "2024-07-02 11:08:33",
  "accountNumber": "1017588888",
  "subAccount": "",
  "code": "SEVN63DC8E5C",
  "content": "SEVN63DC8E5C chuyen tien",
  "transferType": "in",
  "description": "NGUYEN VAN A chuyen tien",
  "transferAmount": 5000000,
  "accumulated": 105000000,
  "referenceCode": "FT24012345678"
}
```

Khớp booking: tìm `PREFIX`+`bookingId` trong `content` / `code` / `description` (vd. `SD42`), so sánh `transferAmount` ≥ `TotalAmount`.

## Endpoint

| Method | Path | Response |
|--------|------|----------|
| POST | `/api/webhooks/sepay` | `200 {"success":true}` |
| POST | `/api/webhooks/bank` | alias giống sepay |
| GET | same paths | probe (không dùng cho SePay) |

Auth (tuỳ cấu hình SePay API Key): `Authorization: Apikey <WebhookSecret>`

## Luồng

```
SePay POST payload
  → (optional) verify Apikey
  → parse JSON (id, content, transferAmount, …)
  → idempotent theo id
  → match booking + amount → PaymentStatus=Paid
  → luôn 200 {"success":true} nếu đã nhận/ghi log (kể cả Unmatched)
  → 500 chỉ khi lỗi hệ thống (để SePay retry)
```

## Todo

- [x] Align response `{"success":true}`
- [x] Match content/code/description + id idempotent
- [x] Docs + admin copy
