namespace HoltelCentrel.Api.Models;

public class Booking
{
    public int Id { get; set; }
    public int RoomId { get; set; }
    public Room Room { get; set; } = null!;
    public string? GuestName { get; set; }
    public string? GuestPhone { get; set; }
    public DateTime CheckIn { get; set; }
    public DateTime? CheckOut { get; set; }
    public int DurationHours { get; set; }
    public decimal RoomAmount { get; set; }
    public decimal ProductAmount { get; set; }
    public decimal DiscountAmount { get; set; }
    public decimal TotalAmount { get; set; }
    public string? VoucherCode { get; set; }
    public int? ComboId { get; set; }
    public string Status { get; set; } = "Active";
    public string? Notes { get; set; }

    /// <summary>Unpaid | Paid | Manual — thanh toán sau checkout.</summary>
    public string PaymentStatus { get; set; } = "Unpaid";

    /// <summary>Cash | BankTransfer | null</summary>
    public string? PaymentMethod { get; set; }

    public DateTime? PaidAt { get; set; }

    /// <summary>Nội dung CK mong đợi, e.g. SD42.</summary>
    public string? TransferContent { get; set; }
}
