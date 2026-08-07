using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;
using HoltelCentrel.Api.Data;
using HoltelCentrel.Api.DTOs;
using HoltelCentrel.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace HoltelCentrel.Api.Services;

public class BankPaymentService(AppDbContext db, IHttpContextAccessor httpContextAccessor)
{
    public const int SettingsId = 1;

    public async Task<BankSettings> GetOrCreateSettingsAsync()
    {
        var settings = await db.BankSettings.FindAsync(SettingsId);
        if (settings is not null) return settings;

        settings = new BankSettings
        {
            Id = SettingsId,
            TransferContentPrefix = "SD",
            WebhookSecret = GenerateSecret(),
            IsEnabled = false,
            UpdatedAt = DateTime.UtcNow
        };
        db.BankSettings.Add(settings);
        await db.SaveChangesAsync();
        return settings;
    }

    public async Task<BankSettingsDto> GetSettingsDtoAsync()
    {
        var s = await GetOrCreateSettingsAsync();
        return MapSettings(s);
    }

    public async Task<BankSettingsDto> UpdateSettingsAsync(UpdateBankSettingsDto dto)
    {
        var s = await GetOrCreateSettingsAsync();

        s.BankName = dto.BankName.Trim();
        s.BankBin = dto.BankBin.Trim();
        s.AccountNumber = dto.AccountNumber.Trim();
        s.AccountName = dto.AccountName.Trim().ToUpperInvariant();
        s.TransferContentPrefix = string.IsNullOrWhiteSpace(dto.TransferContentPrefix)
            ? "SD"
            : Regex.Replace(dto.TransferContentPrefix.Trim().ToUpperInvariant(), @"[^A-Z0-9]", "");
        s.IsEnabled = dto.IsEnabled;
        s.UpdatedAt = DateTime.UtcNow;

        if (dto.RegenerateSecret || string.IsNullOrWhiteSpace(s.WebhookSecret))
            s.WebhookSecret = GenerateSecret();
        else if (!string.IsNullOrWhiteSpace(dto.WebhookSecret))
            s.WebhookSecret = dto.WebhookSecret.Trim();

        await db.SaveChangesAsync();
        return MapSettings(s);
    }

    public async Task<BankTransferInfoDto?> TryBuildTransferInfoAsync(int bookingId, decimal amount)
    {
        var s = await db.BankSettings.FindAsync(SettingsId);
        if (s is null || !s.IsEnabled) return null;
        if (string.IsNullOrWhiteSpace(s.BankBin) || string.IsNullOrWhiteSpace(s.AccountNumber))
            return null;

        var content = BuildTransferContent(s.TransferContentPrefix, bookingId);
        var qr = BuildVietQrUrl(s, amount, content);

        return new BankTransferInfoDto(
            s.BankName,
            s.BankBin,
            s.AccountNumber,
            s.AccountName,
            content,
            qr
        );
    }

    public static string BuildTransferContent(string prefix, int bookingId)
    {
        var p = string.IsNullOrWhiteSpace(prefix) ? "SD" : prefix.Trim().ToUpperInvariant();
        p = Regex.Replace(p, @"[^A-Z0-9]", "");
        if (string.IsNullOrEmpty(p)) p = "SD";
        return $"{p}{bookingId}";
    }

    public static string BuildVietQrUrl(BankSettings s, decimal amount, string content)
    {
        var amountInt = (long)Math.Round(amount, MidpointRounding.AwayFromZero);
        var template = "compact2";
        var baseUrl = $"https://img.vietqr.io/image/{Uri.EscapeDataString(s.BankBin)}-{Uri.EscapeDataString(s.AccountNumber)}-{template}.png";
        var query = $"amount={amountInt}&addInfo={Uri.EscapeDataString(content)}&accountName={Uri.EscapeDataString(s.AccountName)}";
        return $"{baseUrl}?{query}";
    }

    public bool ValidateWebhookSecret(BankSettings settings, HttpRequest request)
    {
        if (string.IsNullOrWhiteSpace(settings.WebhookSecret))
            return false;

        var expected = settings.WebhookSecret.Trim();

        var auth = request.Headers.Authorization.FirstOrDefault();
        if (!string.IsNullOrEmpty(auth))
        {
            // SePay: Authorization: Apikey <key>
            if (auth.StartsWith("Apikey ", StringComparison.OrdinalIgnoreCase))
            {
                if (SecureEquals(auth["Apikey ".Length..].Trim(), expected))
                    return true;
            }

            if (auth.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
            {
                if (SecureEquals(auth["Bearer ".Length..].Trim(), expected))
                    return true;
            }

            if (SecureEquals(auth.Trim(), expected))
                return true;
        }

        var xApiKey = request.Headers["X-Api-Key"].FirstOrDefault()
            ?? request.Headers["x-api-key"].FirstOrDefault();
        if (!string.IsNullOrEmpty(xApiKey) && SecureEquals(xApiKey.Trim(), expected))
            return true;

        if (request.Query.TryGetValue("api_key", out var q) && SecureEquals(q.ToString().Trim(), expected))
            return true;

        return false;
    }

    public async Task<WebhookResultDto> ProcessSePayWebhookAsync(SePayWebhookDto dto, string rawJson)
    {
        var settings = await GetOrCreateSettingsAsync();

        // SePay: id là khóa chống trùng (không đổi khi retry)
        var txId = dto.Id?.ToString()
            ?? (!string.IsNullOrWhiteSpace(dto.ReferenceCode) ? dto.ReferenceCode.Trim() : null)
            ?? $"manual-{Guid.NewGuid():N}";

        var existing = await db.BankPayments.FirstOrDefaultAsync(p => p.GatewayTransactionId == txId);
        if (existing is not null)
        {
            return new WebhookResultDto(true, "Duplicate", "Giao dịch đã xử lý trước đó (idempotent theo id).", existing.Id, existing.BookingId);
        }

        var amount = dto.TransferAmount ?? 0m;
        // content = nội dung CK gốc; code = mã thanh toán SePay trích theo cấu hình tiền tố
        var contentParts = new[] { dto.Content, dto.Code, dto.Description, dto.SubAccount }
            .Where(s => !string.IsNullOrWhiteSpace(s))
            .Select(s => s!.Trim());
        var contentForMatch = string.Join(" ", contentParts);
        var contentDisplay = dto.Content ?? dto.Code ?? dto.Description ?? "";
        var transferType = (dto.TransferType ?? "in").Trim().ToLowerInvariant();

        var payment = new BankPayment
        {
            GatewayTransactionId = txId,
            Gateway = dto.Gateway,
            AccountNumber = dto.AccountNumber,
            Content = contentDisplay.Length > 500 ? contentDisplay[..500] : contentDisplay,
            ReferenceCode = dto.ReferenceCode,
            TransferType = transferType,
            Amount = amount,
            RawPayload = rawJson.Length > 8000 ? rawJson[..8000] : rawJson,
            ReceivedAt = DateTime.UtcNow,
            TransactionAt = ParseVietnamTransactionDate(dto.TransactionDate),
            Status = "Received"
        };

        if (!settings.IsEnabled)
        {
            payment.Status = "Unmatched";
            payment.MatchNote = "Webhook/CK đang tắt trên hệ thống — đã ghi nhận giao dịch.";
            db.BankPayments.Add(payment);
            await db.SaveChangesAsync();
            return new WebhookResultDto(true, payment.Status, payment.MatchNote, payment.Id);
        }

        if (transferType is "out")
        {
            payment.Status = "Unmatched";
            payment.MatchNote = "Bỏ qua giao dịch tiền ra (out).";
            db.BankPayments.Add(payment);
            await db.SaveChangesAsync();
            return new WebhookResultDto(true, payment.Status, payment.MatchNote, payment.Id);
        }

        var bookingId = TryParseBookingId(contentForMatch, settings.TransferContentPrefix)
            ?? TryParseBookingId(dto.Code ?? "", settings.TransferContentPrefix)
            ?? TryParseBookingId(dto.Content ?? "", settings.TransferContentPrefix)
            ?? TryParseBookingId(dto.Description ?? "", settings.TransferContentPrefix);

        if (bookingId is null)
        {
            payment.Status = "Unmatched";
            payment.MatchNote = "Không tìm thấy mã booking trong content/code/description.";
            db.BankPayments.Add(payment);
            await db.SaveChangesAsync();
            return new WebhookResultDto(true, payment.Status, payment.MatchNote, payment.Id);
        }

        var booking = await db.Bookings.Include(b => b.Room).FirstOrDefaultAsync(b => b.Id == bookingId.Value);
        if (booking is null)
        {
            payment.Status = "Unmatched";
            payment.MatchNote = $"Booking #{bookingId} không tồn tại.";
            db.BankPayments.Add(payment);
            await db.SaveChangesAsync();
            return new WebhookResultDto(true, payment.Status, payment.MatchNote, payment.Id, bookingId);
        }

        payment.BookingId = booking.Id;

        if (booking.PaymentStatus is "Paid" or "Manual")
        {
            payment.Status = "Matched";
            payment.MatchNote = "Booking đã thanh toán trước đó; ghi nhận giao dịch SePay.";
            db.BankPayments.Add(payment);
            await db.SaveChangesAsync();
            return new WebhookResultDto(true, payment.Status, payment.MatchNote, payment.Id, booking.Id);
        }

        var expected = Math.Round(booking.TotalAmount, 0, MidpointRounding.AwayFromZero);
        var received = Math.Round(amount, 0, MidpointRounding.AwayFromZero);

        if (received < expected)
        {
            payment.Status = "Unmatched";
            payment.MatchNote = $"Số tiền thiếu: nhận {received:0} / cần {expected:0}.";
            db.BankPayments.Add(payment);
            await db.SaveChangesAsync();
            return new WebhookResultDto(true, payment.Status, payment.MatchNote, payment.Id, booking.Id);
        }

        booking.PaymentStatus = "Paid";
        booking.PaymentMethod = "BankTransfer";
        booking.PaidAt = DateTime.UtcNow;
        if (string.IsNullOrWhiteSpace(booking.TransferContent))
            booking.TransferContent = BuildTransferContent(settings.TransferContentPrefix, booking.Id);

        payment.Status = "Matched";
        payment.MatchNote = received > expected
            ? $"SePay khớp booking #{booking.Id} (nhận dư {received - expected:0}đ)."
            : $"SePay khớp booking #{booking.Id} — đã thanh toán.";

        db.BankPayments.Add(payment);
        await db.SaveChangesAsync();

        return new WebhookResultDto(true, payment.Status, payment.MatchNote, payment.Id, booking.Id);
    }

    /// <summary>transactionDate SePay: YYYY-MM-DD HH:mm:ss (giờ Việt Nam).</summary>
    private static DateTime? ParseVietnamTransactionDate(string? value)
    {
        if (string.IsNullOrWhiteSpace(value)) return null;
        if (!DateTime.TryParse(value, out var local)) return null;
        try
        {
            return RoomBillingService.FromVietnamLocal(DateTime.SpecifyKind(local, DateTimeKind.Unspecified));
        }
        catch
        {
            if (local.Kind == DateTimeKind.Unspecified)
                return DateTime.SpecifyKind(local, DateTimeKind.Utc);
            return local.ToUniversalTime();
        }
    }

    public async Task<BankPaymentDto?> MarkBookingPaidManualAsync(int bookingId)
    {
        var booking = await db.Bookings.Include(b => b.Room).FirstOrDefaultAsync(b => b.Id == bookingId);
        if (booking is null) return null;

        booking.PaymentStatus = "Manual";
        booking.PaymentMethod = booking.PaymentMethod ?? "Cash";
        booking.PaidAt = DateTime.UtcNow;

        var payment = new BankPayment
        {
            GatewayTransactionId = $"manual-{bookingId}-{DateTimeOffset.UtcNow.ToUnixTimeSeconds()}",
            Gateway = "Manual",
            Content = booking.TransferContent ?? $"Manual #{bookingId}",
            Amount = booking.TotalAmount,
            BookingId = booking.Id,
            Status = "Matched",
            MatchNote = "Đánh dấu đã thu thủ công (tiền mặt / ngoài hệ thống).",
            TransferType = "in",
            ReceivedAt = DateTime.UtcNow,
            TransactionAt = DateTime.UtcNow
        };
        db.BankPayments.Add(payment);
        await db.SaveChangesAsync();

        return MapPayment(payment, booking.Room?.RoomNumber);
    }

    public async Task<IReadOnlyList<BankPaymentDto>> ListPaymentsAsync(int take = 50)
    {
        take = Math.Clamp(take, 1, 200);
        var rows = await db.BankPayments
            .AsNoTracking()
            .Include(p => p.Booking)
                .ThenInclude(b => b!.Room)
            .OrderByDescending(p => p.ReceivedAt)
            .Take(take)
            .ToListAsync();

        return rows.Select(p => MapPayment(p, p.Booking?.Room?.RoomNumber)).ToList();
    }

    public static int? TryParseBookingId(string content, string prefix)
    {
        if (string.IsNullOrWhiteSpace(content)) return null;

        var p = string.IsNullOrWhiteSpace(prefix) ? "SD" : Regex.Escape(prefix.Trim());
        // Cho phép khoảng trắng: SD 42, SD42, sd42
        var match = Regex.Match(content, $@"(?i)\b{p}\s*(\d+)\b");
        if (match.Success && int.TryParse(match.Groups[1].Value, out var id))
            return id;

        // Fallback: SD + digits không word boundary (nội dung dính liền)
        match = Regex.Match(content, $@"(?i){p}(\d+)");
        if (match.Success && int.TryParse(match.Groups[1].Value, out id))
            return id;

        return null;
    }

    private BankSettingsDto MapSettings(BankSettings s)
    {
        var webhookUrl = BuildWebhookUrlHint();
        return new BankSettingsDto(
            s.Id,
            s.BankName,
            s.BankBin,
            s.AccountNumber,
            s.AccountName,
            s.TransferContentPrefix,
            s.WebhookSecret,
            s.IsEnabled,
            s.UpdatedAt,
            webhookUrl
        );
    }

    private string BuildWebhookUrlHint()
    {
        var ctx = httpContextAccessor.HttpContext;
        if (ctx is null) return "/api/webhooks/bank";

        var req = ctx.Request;
        var host = req.Headers["X-Forwarded-Host"].FirstOrDefault() ?? req.Host.Value;
        var scheme = req.Headers["X-Forwarded-Proto"].FirstOrDefault() ?? req.Scheme;
        return $"{scheme}://{host}/api/webhooks/bank";
    }

    private static BankPaymentDto MapPayment(BankPayment p, string? roomNumber) => new(
        p.Id,
        p.GatewayTransactionId,
        p.Gateway,
        p.AccountNumber,
        p.Content,
        p.ReferenceCode,
        p.TransferType,
        p.Amount,
        p.BookingId,
        roomNumber,
        p.Status,
        p.MatchNote,
        p.ReceivedAt,
        p.TransactionAt
    );

    private static string GenerateSecret()
    {
        var bytes = RandomNumberGenerator.GetBytes(24);
        return Convert.ToBase64String(bytes).TrimEnd('=').Replace('+', 'x').Replace('/', 'y');
    }

    private static bool SecureEquals(string a, string b)
    {
        var ba = Encoding.UTF8.GetBytes(a);
        var bb = Encoding.UTF8.GetBytes(b);
        if (ba.Length != bb.Length) return false;
        return CryptographicOperations.FixedTimeEquals(ba, bb);
    }
}
