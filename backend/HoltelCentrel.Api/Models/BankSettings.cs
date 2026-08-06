namespace HoltelCentrel.Api.Models;

/// <summary>Cấu hình tài khoản nhận chuyển khoản (singleton row Id = 1).</summary>
public class BankSettings
{
    public int Id { get; set; } = 1;

    /// <summary>Tên ngân hàng hiển thị, vd. MB Bank, Vietcombank.</summary>
    public string BankName { get; set; } = string.Empty;

    /// <summary>Mã BIN / bank code cho VietQR (6 số hoặc short code img.vietqr.io), vd. 970422.</summary>
    public string BankBin { get; set; } = string.Empty;

    public string AccountNumber { get; set; } = string.Empty;
    public string AccountName { get; set; } = string.Empty;

    /// <summary>Prefix nội dung CK, ghép với BookingId → e.g. SD42.</summary>
    public string TransferContentPrefix { get; set; } = "SD";

    /// <summary>Secret xác thực webhook (SePay Apikey / Bearer / X-Api-Key).</summary>
    public string WebhookSecret { get; set; } = string.Empty;

    public bool IsEnabled { get; set; }
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
