using HoltelCentrel.Api.Data;
using HoltelCentrel.Api.DTOs;
using HoltelCentrel.Api.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace HoltelCentrel.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ReportsController(AppDbContext db) : ControllerBase
{
    [HttpGet("revenue")]
    public async Task<ActionResult<RevenueReportDto>> GetRevenue(
        [FromQuery] DateTime? from,
        [FromQuery] DateTime? to)
    {
        var nowLocal = RoomBillingService.ToVietnamLocal(DateTime.UtcNow);
        var toLocal = to?.Date ?? nowLocal.Date;
        var fromLocal = from?.Date ?? toLocal.AddDays(-29);

        if (fromLocal > toLocal)
            return BadRequest(new { message = "Ngày bắt đầu phải trước ngày kết thúc." });

        var bookings = await db.Bookings
            .Include(b => b.Room)
            .Where(b => b.Status == "Completed" && b.CheckOut != null)
            .OrderByDescending(b => b.CheckOut)
            .ToListAsync();

        var inRange = bookings
            .Where(b =>
            {
                var checkoutLocal = RoomBillingService.ToVietnamLocal(b.CheckOut!.Value).Date;
                return checkoutLocal >= fromLocal && checkoutLocal <= toLocal;
            })
            .ToList();

        var todayLocal = nowLocal.Date;
        var daysSinceMonday = ((int)todayLocal.DayOfWeek + 6) % 7;
        var weekStart = todayLocal.AddDays(-daysSinceMonday);
        var monthStart = new DateTime(todayLocal.Year, todayLocal.Month, 1);

        decimal SumByCheckout(Func<DateTime, bool> predicate) =>
            bookings.Where(b => predicate(RoomBillingService.ToVietnamLocal(b.CheckOut!.Value).Date))
                .Sum(b => b.TotalAmount);

        var dailyGroups = inRange
            .GroupBy(b => RoomBillingService.ToVietnamLocal(b.CheckOut!.Value).Date)
            .OrderBy(g => g.Key)
            .Select(g => new DailyRevenueDto(
                g.Key.ToString("yyyy-MM-dd"),
                g.Key.ToString("dd/MM"),
                g.Sum(b => b.TotalAmount),
                g.Count()
            ))
            .ToList();

        // Fill missing days with zero for chart continuity
        var dailyBreakdown = new List<DailyRevenueDto>();
        for (var d = fromLocal; d <= toLocal; d = d.AddDays(1))
        {
            var existing = dailyGroups.FirstOrDefault(x => x.Date == d.ToString("yyyy-MM-dd"));
            dailyBreakdown.Add(existing ?? new DailyRevenueDto(
                d.ToString("yyyy-MM-dd"),
                d.ToString("dd/MM"),
                0,
                0
            ));
        }

        var byRoom = inRange
            .GroupBy(b => b.RoomId)
            .Select(g =>
            {
                var room = g.First().Room;
                return new RoomRevenueDto(
                    room.Id,
                    room.RoomNumber,
                    room.Name,
                    room.RoomType,
                    g.Sum(b => b.TotalAmount),
                    g.Count()
                );
            })
            .OrderByDescending(r => r.Amount)
            .ToList();

        var transactions = inRange
            .Select(b => new RevenueTransactionDto(
                b.Id,
                b.Room.RoomNumber,
                b.Room.Name,
                b.Room.RoomType,
                RoomBillingService.ToVietnamLocal(b.CheckIn),
                RoomBillingService.ToVietnamLocal(b.CheckOut!.Value),
                b.DurationHours,
                b.TotalAmount
            ))
            .ToList();

        var totalRevenue = inRange.Sum(b => b.TotalAmount);
        var totalTransactions = inRange.Count;

        return Ok(new RevenueReportDto(
            totalRevenue,
            totalTransactions,
            totalTransactions > 0 ? Math.Round(totalRevenue / totalTransactions, 0) : 0,
            SumByCheckout(d => d == todayLocal),
            SumByCheckout(d => d >= weekStart && d <= todayLocal),
            SumByCheckout(d => d >= monthStart && d <= todayLocal),
            dailyBreakdown,
            byRoom,
            transactions
        ));
    }
}
