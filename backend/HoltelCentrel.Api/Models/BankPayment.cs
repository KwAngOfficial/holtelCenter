namespace HoltelCentrel.Api.Models;

/// <summary>Giao dịch chuyển khoản từ webhook ngân hàng (SePay-compatible).</summary>
public class BankPayment
{
    public int Id { get; set; }

    /// <summary>Id giao dịch từ gateway — unique để idempotent.</summary>
    public string GatewayTransactionId { get; set; } = string.Empty;

    public string? Gateway { get; set; }
    public string? AccountNumber { get; set; }
    public string? Content { get; set; }
    public string? ReferenceCode { get; set; }
    public string? TransferType { get; set; }

    public decimal Amount { get; set; }

    public int? BookingId { get; set; }
    public Booking? Booking { get; set; }

    /// <summary>Received | Matched | Unmatched | Duplicate</summary>
    public string Status { get; set; } = "Received";

    public string? MatchNote { get; set; }
    public string? RawPayload { get; set; }

    public DateTime ReceivedAt { get; set; } = DateTime.UtcNow;
    public DateTime? TransactionAt { get; set; }
}
