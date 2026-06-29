using HoltelCentrel.Api.Data;
using HoltelCentrel.Api.DTOs;
using HoltelCentrel.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace HoltelCentrel.Api.Services;

public class RoomSessionService(AppDbContext db)
{
    public async Task<Booking?> GetActiveBookingAsync(int roomId) =>
        await db.Bookings
            .Where(b => b.RoomId == roomId && b.Status == "Active")
            .OrderByDescending(b => b.CheckIn)
            .FirstOrDefaultAsync();

    public async Task<CheckInSessionDto> StartSessionAsync(Room room)
    {
        var existing = await GetActiveBookingAsync(room.Id);
        if (existing is not null)
            throw new InvalidOperationException("Phòng đang có phiên thuê active.");

        var booking = new Booking
        {
            RoomId = room.Id,
            CheckIn = DateTime.UtcNow,
            Status = "Active",
            Notes = "Tự động check-in khi chuyển trạng thái Đang thuê"
        };

        db.Bookings.Add(booking);
        room.Status = RoomStatus.Occupied;
        await db.SaveChangesAsync();

        var checkInLocal = RoomBillingService.ToVietnamLocal(booking.CheckIn);
        return new CheckInSessionDto(
            booking.Id,
            booking.CheckIn,
            checkInLocal,
            $"Đã ghi nhận giờ vào: {checkInLocal:dd/MM/yyyy HH:mm}"
        );
    }

    public async Task<CheckoutBillingDto?> EndSessionAsync(Room room, RoomStatus newStatus)
    {
        var booking = await GetActiveBookingAsync(room.Id);

        if (booking is null)
        {
            room.Status = newStatus;
            await db.SaveChangesAsync();
            return null;
        }

        var checkOut = DateTime.UtcNow;
        var billing = RoomBillingService.Calculate(booking.CheckIn, checkOut);

        booking.CheckOut = checkOut;
        booking.DurationHours = billing.TotalBillableHours;
        booking.RoomAmount = billing.TotalAmount;
        booking.TotalAmount = billing.TotalAmount;
        booking.Status = "Completed";
        booking.Notes = string.Join("\n", billing.BreakdownLines);

        room.Status = newStatus;
        await db.SaveChangesAsync();

        return new CheckoutBillingDto(
            booking.Id,
            room.RoomNumber,
            room.Name,
            booking.CheckIn,
            RoomBillingService.ToVietnamLocal(booking.CheckIn),
            checkOut,
            RoomBillingService.ToVietnamLocal(checkOut),
            billing.TotalBillableHours,
            billing.OvernightNights,
            billing.HourlyAmount,
            billing.OvernightAmount,
            billing.ExcessAmount,
            billing.TotalAmount,
            billing.BreakdownLines.ToArray()
        );
    }

    public CheckoutBillingDto PreviewBilling(Room room)
    {
        var booking = db.Bookings
            .Where(b => b.RoomId == room.Id && b.Status == "Active")
            .OrderByDescending(b => b.CheckIn)
            .FirstOrDefault()
            ?? throw new InvalidOperationException("Phòng không có phiên thuê active.");

        var checkOut = DateTime.UtcNow;
        var billing = RoomBillingService.Calculate(booking.CheckIn, checkOut);

        return new CheckoutBillingDto(
            booking.Id,
            room.RoomNumber,
            room.Name,
            booking.CheckIn,
            RoomBillingService.ToVietnamLocal(booking.CheckIn),
            checkOut,
            RoomBillingService.ToVietnamLocal(checkOut),
            billing.TotalBillableHours,
            billing.OvernightNights,
            billing.HourlyAmount,
            billing.OvernightAmount,
            billing.ExcessAmount,
            billing.TotalAmount,
            billing.BreakdownLines.ToArray()
        );
    }
}
