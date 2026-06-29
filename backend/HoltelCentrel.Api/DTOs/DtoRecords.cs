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
    string[] BreakdownLines
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

public record LoginDto(string Password);

public record LoginResponseDto(string Token, int ExpiresInDays);
