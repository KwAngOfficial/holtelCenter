namespace HoltelCentrel.Api.Models;

public class Voucher
{
    public int Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public DiscountType DiscountType { get; set; } = DiscountType.Percentage;
    public decimal DiscountValue { get; set; }
    public int? MinDurationHours { get; set; }
    public string? ApplicableRoomTypes { get; set; }
    public DateTime ValidFrom { get; set; }
    public DateTime ValidTo { get; set; }
    public int UsageLimit { get; set; } = 100;
    public int UsedCount { get; set; }
    public bool IsActive { get; set; } = true;
}
