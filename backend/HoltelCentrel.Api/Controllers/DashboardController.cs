using HoltelCentrel.Api.Data;
using HoltelCentrel.Api.DTOs;
using HoltelCentrel.Api.Models;
using HoltelCentrel.Api.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace HoltelCentrel.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class DashboardController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<DashboardDto>> Get()
    {
        var rooms = await db.Rooms.ToListAsync();
        var todayLocal = RoomBillingService.ToVietnamLocal(DateTime.UtcNow).Date;

        var completedBookings = await db.Bookings
            .Where(b => b.CheckOut != null && b.Status == "Completed")
            .ToListAsync();

        var todayRevenue = completedBookings
            .Where(b => RoomBillingService.ToVietnamLocal(b.CheckOut!.Value).Date == todayLocal)
            .Sum(b => b.TotalAmount);

        var activeBookings = await db.Bookings.CountAsync(b => b.Status == "Active");

        return Ok(new DashboardDto(
            rooms.Count,
            rooms.Count(r => r.Status == RoomStatus.Available),
            rooms.Count(r => r.Status == RoomStatus.Occupied),
            rooms.Count(r => r.Status == RoomStatus.Cleaning),
            rooms.Count(r => r.Status == RoomStatus.Maintenance),
            todayRevenue,
            activeBookings
        ));
    }

    [HttpPost("check-in")]
    public async Task<IActionResult> CheckIn(CheckInDto dto)
    {
        var room = await db.Rooms.FindAsync(dto.RoomId);
        if (room is null) return NotFound(new { message = "Phòng không tồn tại." });
        if (room.Status != RoomStatus.Available)
            return BadRequest(new { message = "Phòng không ở trạng thái trống." });

        decimal discount = 0;
        if (!string.IsNullOrEmpty(dto.VoucherCode))
        {
            var voucher = await db.Vouchers.FirstOrDefaultAsync(v => v.Code == dto.VoucherCode.ToUpper());
            if (voucher is not null && voucher.IsActive)
            {
                discount = voucher.DiscountType == DiscountType.Percentage
                    ? dto.RoomAmount * voucher.DiscountValue / 100
                    : voucher.DiscountValue;
                voucher.UsedCount++;
            }
        }

        var booking = new Booking
        {
            RoomId = dto.RoomId,
            GuestName = dto.GuestName,
            GuestPhone = dto.GuestPhone,
            CheckIn = DateTime.UtcNow,
            DurationHours = dto.DurationHours,
            RoomAmount = dto.RoomAmount,
            DiscountAmount = discount,
            TotalAmount = dto.RoomAmount - discount,
            VoucherCode = dto.VoucherCode?.ToUpper(),
            ComboId = dto.ComboId,
            Notes = dto.Notes,
            Status = "Active"
        };

        room.Status = RoomStatus.Occupied;
        db.Bookings.Add(booking);
        await db.SaveChangesAsync();

        return Ok(new { booking.Id, message = "Check-in thành công." });
    }

    [HttpPost("check-out")]
    public async Task<IActionResult> CheckOut(CheckOutDto dto)
    {
        var booking = await db.Bookings.Include(b => b.Room).FirstOrDefaultAsync(b => b.Id == dto.BookingId);
        if (booking is null) return NotFound(new { message = "Booking không tồn tại." });
        if (booking.Status != "Active")
            return BadRequest(new { message = "Booking đã được checkout." });

        booking.CheckOut = DateTime.UtcNow;
        booking.Status = "Completed";
        booking.Room.Status = RoomStatus.Cleaning;

        await db.SaveChangesAsync();
        return Ok(new { booking.Id, booking.TotalAmount, message = "Check-out thành công." });
    }
}
