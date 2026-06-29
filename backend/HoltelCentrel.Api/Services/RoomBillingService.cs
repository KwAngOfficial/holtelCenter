namespace HoltelCentrel.Api.Services;

public class BillingResult
{
    public DateTime CheckInLocal { get; set; }
    public DateTime CheckOutLocal { get; set; }
    public decimal HourlyAmount { get; set; }
    public decimal OvernightAmount { get; set; }
    public decimal ExcessAmount { get; set; }
    public decimal TotalAmount { get; set; }
    public int TotalBillableHours { get; set; }
    public int OvernightNights { get; set; }
    public List<string> BreakdownLines { get; set; } = [];
}

public static class RoomBillingService
{
    public const decimal FirstHourPrice = 80_000m;
    public const decimal AdditionalHourPrice = 10_000m;
    public const decimal OvernightPrice = 180_000m;
    public const decimal OvernightExcessHourPrice = 10_000m;

    private static readonly TimeZoneInfo VietnamTimeZone = GetVietnamTimeZone();

    public static DateTime ToVietnamLocal(DateTime dateTime)
    {
        var utc = dateTime.Kind switch
        {
            DateTimeKind.Utc => dateTime,
            DateTimeKind.Local => dateTime.ToUniversalTime(),
            _ => DateTime.SpecifyKind(dateTime, DateTimeKind.Utc)
        };
        return TimeZoneInfo.ConvertTimeFromUtc(utc, VietnamTimeZone);
    }

    public static DateTime VietnamNowUtc()
    {
        return TimeZoneInfo.ConvertTimeToUtc(
            TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, VietnamTimeZone),
            VietnamTimeZone);
    }

    public static int CeilHours(double totalMinutes)
    {
        if (totalMinutes <= 0) return 0;
        return (int)Math.Ceiling(totalMinutes / 60.0);
    }

    public static decimal CalculateHourlyAmount(int billableHours)
    {
        if (billableHours <= 0) return 0;
        return FirstHourPrice + Math.Max(0, billableHours - 1) * AdditionalHourPrice;
    }

    public static (DateTime Start, DateTime End) GetOvernightWindow(DateTime localDate)
    {
        var start = localDate.Date.AddHours(20);
        var end = localDate.Date.AddDays(1).AddHours(6);
        return (start, end);
    }

    public static BillingResult Calculate(DateTime checkInUtc, DateTime checkOutUtc)
    {
        var checkIn = ToVietnamLocal(checkInUtc);
        var checkOut = ToVietnamLocal(checkOutUtc);

        if (checkOut <= checkIn)
            throw new ArgumentException("Thời gian ra phải sau thời gian vào.");

        var result = new BillingResult
        {
            CheckInLocal = checkIn,
            CheckOutLocal = checkOut
        };

        var overnightDates = GetOverlappingOvernightDates(checkIn, checkOut);

        if (overnightDates.Count == 0)
        {
            var hours = CeilHours((checkOut - checkIn).TotalMinutes);
            var amount = CalculateHourlyAmount(hours);
            result.TotalBillableHours = hours;
            result.HourlyAmount = amount;
            result.TotalAmount = amount;
            result.BreakdownLines.Add(
                hours <= 1
                    ? $"Thuê theo giờ: {hours} giờ × 80.000đ = {amount:N0}đ"
                    : $"Thuê theo giờ: {hours} giờ = 80.000đ + {hours - 1} giờ × 10.000đ = {amount:N0}đ");
            result.BreakdownLines.Add($"Tổng cộng: {amount:N0}đ");
            return result;
        }

        var firstOvernightStart = GetOvernightWindow(overnightDates[0]).Start;
        if (checkIn < firstOvernightStart)
        {
            var segEnd = checkOut < firstOvernightStart ? checkOut : firstOvernightStart;
            var hours = CeilHours((segEnd - checkIn).TotalMinutes);
            var amount = CalculateHourlyAmount(hours);
            result.HourlyAmount += amount;
            result.TotalBillableHours += hours;
            result.BreakdownLines.Add(
                $"Trước khung qua đêm ({checkIn:dd/MM/yyyy HH:mm} – {segEnd:dd/MM/yyyy HH:mm}): {hours} giờ = {amount:N0}đ");
        }

        foreach (var date in overnightDates)
        {
            var (onStart, onEnd) = GetOvernightWindow(date);
            result.OvernightAmount += OvernightPrice;
            result.OvernightNights++;
            result.BreakdownLines.Add(
                $"Qua đêm ({onStart:dd/MM/yyyy HH:mm} – {onEnd:dd/MM/yyyy HH:mm}): {OvernightPrice:N0}đ");
        }

        foreach (var date in overnightDates)
        {
            var (_, onEnd) = GetOvernightWindow(date);
            var excessStart = onEnd > checkIn ? onEnd : checkIn;
            if (excessStart >= checkOut) continue;

            var nextNightDate = date.AddDays(1).Date;
            var nextOvernightStart = nextNightDate.AddHours(20);
            var hasNextOvernight = overnightDates.Contains(nextNightDate) && checkOut > nextOvernightStart;

            var excessEnd = hasNextOvernight ? nextOvernightStart : checkOut;
            if (excessStart >= excessEnd) continue;

            var hours = CeilHours((excessEnd - excessStart).TotalMinutes);
            var amount = hours * OvernightExcessHourPrice;
            result.ExcessAmount += amount;
            result.BreakdownLines.Add(
                $"Thời gian vượt sau qua đêm ({excessStart:dd/MM/yyyy HH:mm} – {excessEnd:dd/MM/yyyy HH:mm}): {hours} giờ × 10.000đ = {amount:N0}đ");
        }

        result.TotalAmount = result.HourlyAmount + result.OvernightAmount + result.ExcessAmount;
        result.BreakdownLines.Add($"Tổng cộng: {result.TotalAmount:N0}đ");
        return result;
    }

    private static List<DateTime> GetOverlappingOvernightDates(DateTime checkIn, DateTime checkOut)
    {
        var dates = new List<DateTime>();
        for (var d = checkIn.Date; d <= checkOut.Date; d = d.AddDays(1))
        {
            var (onStart, onEnd) = GetOvernightWindow(d);
            if (checkIn < onEnd && checkOut > onStart)
                dates.Add(d);
        }
        return dates;
    }

    private static TimeZoneInfo GetVietnamTimeZone()
    {
        try { return TimeZoneInfo.FindSystemTimeZoneById("Asia/Ho_Chi_Minh"); }
        catch
        {
            try { return TimeZoneInfo.FindSystemTimeZoneById("SE Asia Standard Time"); }
            catch { return TimeZoneInfo.CreateCustomTimeZone("VN", TimeSpan.FromHours(7), "VN", "VN"); }
        }
    }
}
