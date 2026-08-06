using HoltelCentrel.Api.Models;

namespace HoltelCentrel.Api.DTOs;

public record RoomDto(
    int Id,
    string Name,
    string RoomNumber,
    string RoomType,
    int Floor,
    string? Description,
    string? Amenities,
    string? ImageUrl,
    RoomStatus Status,
    bool IsPublic,
    ActiveSessionDto? ActiveSession
);

public record ActiveSessionDto(
    int BookingId,
    DateTime CheckIn,
    DateTime CheckInLocal,
    decimal? EstimatedTotal
);

public record UpdateRoomStatusResponseDto(
    RoomDto Room,
    CheckInSessionDto? CheckIn,
    CheckoutBillingDto? Checkout,
    string? Message
);

public record CheckInSessionDto(
    int BookingId,
    DateTime CheckIn,
    DateTime CheckInLocal,
    string Message
);

public record CheckoutBillingDto(
    int BookingId,
    string RoomNumber,
    string RoomName,
    DateTime CheckIn,
    DateTime CheckInLocal,
    DateTime CheckOut,
    DateTime CheckOutLocal,
    int TotalBillableHours,
    int OvernightNights,
    decimal HourlyAmount,
    decimal OvernightAmount,
    decimal ExcessAmount,
    decimal TotalAmount,
    string[] BreakdownLines,
    string PaymentStatus = "Unpaid",
    string? TransferContent = null,
    BankTransferInfoDto? BankTransfer = null
);

public record BankTransferInfoDto(
    string BankName,
    string BankBin,
    string AccountNumber,
    string AccountName,
    string TransferContent,
    string QrImageUrl
);

public record BankSettingsDto(
    int Id,
    string BankName,
    string BankBin,
    string AccountNumber,
    string AccountName,
    string TransferContentPrefix,
    string WebhookSecret,
    bool IsEnabled,
    DateTime UpdatedAt,
    string WebhookUrlHint
);

public record UpdateBankSettingsDto(
    string BankName,
    string BankBin,
    string AccountNumber,
    string AccountName,
    string TransferContentPrefix,
    string? WebhookSecret,
    bool IsEnabled,
    bool RegenerateSecret = false
);

public record BankPaymentDto(
    int Id,
    string GatewayTransactionId,
    string? Gateway,
    string? AccountNumber,
    string? Content,
    string? ReferenceCode,
    string? TransferType,
    decimal Amount,
    int? BookingId,
    string? RoomNumber,
    string Status,
    string? MatchNote,
    DateTime ReceivedAt,
    DateTime? TransactionAt
);

public record SePayWebhookDto(
    long? Id,
    string? Gateway,
    string? TransactionDate,
    string? AccountNumber,
    string? Code,
    string? Content,
    string? TransferType,
    decimal? TransferAmount,
    decimal? Accumulated,
    string? SubAccount,
    string? ReferenceCode,
    string? Description
);

public record WebhookResultDto(
    bool Ok,
    string Status,
    string Message,
    int? PaymentId = null,
    int? BookingId = null
);

public record CreateRoomDto(
    string Name,
    string RoomNumber,
    string RoomType,
    int Floor,
    string? Description,
    string? Amenities,
    string? ImageUrl,
    bool IsPublic
);

public record UpdateRoomStatusDto(RoomStatus Status);

public record HourlyRateDto(
    int Id,
    string RoomType,
    int DurationHours,
    string Label,
    decimal Price,
    DayType DayType,
    bool IsActive
);

public record CreateHourlyRateDto(
    string RoomType,
    int DurationHours,
    string Label,
    decimal Price,
    DayType DayType
);

public record ProductDto(
    int Id,
    string Name,
    string Category,
    decimal Price,
    int Stock,
    string? ImageUrl,
    bool IsActive
);

public record CreateProductDto(
    string Name,
    string Category,
    decimal Price,
    int Stock,
    string? ImageUrl
);

public record VoucherDto(
    int Id,
    string Code,
    string Name,
    string? Description,
    DiscountType DiscountType,
    decimal DiscountValue,
    int? MinDurationHours,
    string? ApplicableRoomTypes,
    DateTime ValidFrom,
    DateTime ValidTo,
    int UsageLimit,
    int UsedCount,
    bool IsActive
);

public record CreateVoucherDto(
    string Code,
    string Name,
    string? Description,
    DiscountType DiscountType,
    decimal DiscountValue,
    int? MinDurationHours,
    string? ApplicableRoomTypes,
    DateTime ValidFrom,
    DateTime ValidTo,
    int UsageLimit
);

public record ComboItemDto(int Id, int ProductId, string ProductName, int Quantity, decimal ProductPrice);

public record ComboDto(
    int Id,
    string Name,
    string? Description,
    string RoomType,
    int DurationHours,
    decimal ComboPrice,
    string? ImageUrl,
    bool IsActive,
    bool IsPublic,
    List<ComboItemDto> Items
);

public record CreateComboDto(
    string Name,
    string? Description,
    string RoomType,
    int DurationHours,
    decimal ComboPrice,
    string? ImageUrl,
    bool IsPublic,
    List<CreateComboItemDto> Items
);

public record CreateComboItemDto(int ProductId, int Quantity);

public record DashboardDto(
    int TotalRooms,
    int AvailableRooms,
    int OccupiedRooms,
    int CleaningRooms,
    int MaintenanceRooms,
    decimal TodayRevenue,
    int ActiveBookings
);

public record CheckInDto(
    int RoomId,
    string? GuestName,
    string? GuestPhone,
    int DurationHours,
    decimal RoomAmount,
    string? VoucherCode,
    int? ComboId,
    string? Notes
);

public record CheckOutDto(int BookingId);

public record UpdateCheckInDto(DateTime CheckInLocal);

public record LoginDto(string Password);

public record LoginResponseDto(string Token, int ExpiresInDays);
