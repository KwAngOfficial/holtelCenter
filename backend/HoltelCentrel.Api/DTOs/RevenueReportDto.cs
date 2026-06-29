namespace HoltelCentrel.Api.DTOs;

public record RevenueReportDto(
    decimal TotalRevenue,
    int TotalTransactions,
    decimal AverageTransaction,
    decimal TodayRevenue,
    decimal WeekRevenue,
    decimal MonthRevenue,
    List<DailyRevenueDto> DailyBreakdown,
    List<RoomRevenueDto> ByRoom,
    List<RevenueTransactionDto> Transactions
);

public record DailyRevenueDto(string Date, string Label, decimal Amount, int Count);

public record RoomRevenueDto(
    int RoomId,
    string RoomNumber,
    string RoomName,
    string RoomType,
    decimal Amount,
    int Count
);

public record RevenueTransactionDto(
    int Id,
    string RoomNumber,
    string RoomName,
    string RoomType,
    DateTime CheckInLocal,
    DateTime CheckOutLocal,
    int DurationHours,
    decimal TotalAmount
);
