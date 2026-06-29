using HoltelCentrel.Api.Data;
using HoltelCentrel.Api.DTOs;
using HoltelCentrel.Api.Models;
using HoltelCentrel.Api.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace HoltelCentrel.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class RoomsController(AppDbContext db, RoomSessionService sessionService) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IEnumerable<RoomDto>>> GetAll([FromQuery] bool? publicOnly = null)
    {
        var query = db.Rooms.AsQueryable();
        if (publicOnly == true)
            query = query.Where(r => r.IsPublic);

        var rooms = await query.OrderBy(r => r.Floor).ThenBy(r => r.RoomNumber).ToListAsync();
        return Ok(await MapRoomsAsync(rooms));
    }

    [HttpGet("availability")]
    public async Task<ActionResult<IEnumerable<RoomDto>>> GetAvailability()
    {
        var rooms = await db.Rooms
            .Where(r => r.IsPublic)
            .OrderBy(r => r.Floor)
            .ThenBy(r => r.RoomNumber)
            .ToListAsync();
        return Ok(await MapRoomsAsync(rooms));
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<RoomDto>> GetById(int id)
    {
        var room = await db.Rooms.FindAsync(id);
        if (room is null) return NotFound();
        return Ok(await MapRoomAsync(room));
    }

    [HttpGet("{id:int}/billing-preview")]
    public async Task<ActionResult<CheckoutBillingDto>> BillingPreview(int id)
    {
        var room = await db.Rooms.FindAsync(id);
        if (room is null) return NotFound();
        if (room.Status != RoomStatus.Occupied)
            return BadRequest(new { message = "Phòng không ở trạng thái đang thuê." });

        try
        {
            return Ok(sessionService.PreviewBilling(room));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost]
    public async Task<ActionResult<RoomDto>> Create(CreateRoomDto dto)
    {
        if (await db.Rooms.AnyAsync(r => r.RoomNumber == dto.RoomNumber))
            return BadRequest(new { message = "Số phòng đã tồn tại." });

        var room = new Room
        {
            Name = dto.Name,
            RoomNumber = dto.RoomNumber,
            RoomType = dto.RoomType,
            Floor = dto.Floor,
            Description = dto.Description,
            Amenities = dto.Amenities,
            ImageUrl = dto.ImageUrl,
            IsPublic = dto.IsPublic,
            Status = RoomStatus.Available
        };

        db.Rooms.Add(room);
        await db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetById), new { id = room.Id }, await MapRoomAsync(room));
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<RoomDto>> Update(int id, CreateRoomDto dto)
    {
        var room = await db.Rooms.FindAsync(id);
        if (room is null) return NotFound();

        if (await db.Rooms.AnyAsync(r => r.RoomNumber == dto.RoomNumber && r.Id != id))
            return BadRequest(new { message = "Số phòng đã tồn tại." });

        room.Name = dto.Name;
        room.RoomNumber = dto.RoomNumber;
        room.RoomType = dto.RoomType;
        room.Floor = dto.Floor;
        room.Description = dto.Description;
        room.Amenities = dto.Amenities;
        room.ImageUrl = dto.ImageUrl;
        room.IsPublic = dto.IsPublic;

        await db.SaveChangesAsync();
        return Ok(await MapRoomAsync(room));
    }

    [HttpPatch("{id:int}/status")]
    public async Task<ActionResult<UpdateRoomStatusResponseDto>> UpdateStatus(int id, UpdateRoomStatusDto dto)
    {
        var room = await db.Rooms.FindAsync(id);
        if (room is null) return NotFound();

        var previousStatus = room.Status;
        if (previousStatus == dto.Status)
            return Ok(new UpdateRoomStatusResponseDto(await MapRoomAsync(room), null, null, null));

        CheckInSessionDto? checkIn = null;
        CheckoutBillingDto? checkout = null;
        string? message = null;

        try
        {
            if (dto.Status == RoomStatus.Occupied && previousStatus != RoomStatus.Occupied)
            {
                checkIn = await sessionService.StartSessionAsync(room);
            }
            else if (previousStatus == RoomStatus.Occupied && dto.Status != RoomStatus.Occupied)
            {
                checkout = await sessionService.EndSessionAsync(room, dto.Status);
                if (checkout is null)
                {
                    message = "Đã chuyển trạng thái phòng. Không có phiên thuê để tính tiền (dữ liệu cũ).";
                }
            }
            else
            {
                room.Status = dto.Status;
                await db.SaveChangesAsync();
            }
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }

        return Ok(new UpdateRoomStatusResponseDto(await MapRoomAsync(room), checkIn, checkout, message));
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var room = await db.Rooms.FindAsync(id);
        if (room is null) return NotFound();

        var bookings = await db.Bookings.Where(b => b.RoomId == id).ToListAsync();

        if (bookings.Any(b => b.Status == "Active"))
            return BadRequest(new { message = "Không thể xóa phòng đang có khách thuê. Hãy checkout trước." });

        if (bookings.Count > 0)
            db.Bookings.RemoveRange(bookings);

        db.Rooms.Remove(room);

        try
        {
            await db.SaveChangesAsync();
        }
        catch (DbUpdateException)
        {
            return BadRequest(new { message = "Không thể xóa phòng do còn dữ liệu liên quan." });
        }

        return NoContent();
    }

    private async Task<List<RoomDto>> MapRoomsAsync(IEnumerable<Room> rooms)
    {
        var roomList = rooms.ToList();
        var roomIds = roomList.Select(r => r.Id).ToList();
        var activeBookings = await db.Bookings
            .Where(b => roomIds.Contains(b.RoomId) && b.Status == "Active")
            .ToListAsync();
        var bookingByRoom = activeBookings.ToDictionary(b => b.RoomId);

        return roomList.Select(r => MapRoom(r, bookingByRoom.GetValueOrDefault(r.Id))).ToList();
    }

    private async Task<RoomDto> MapRoomAsync(Room room)
    {
        var booking = await sessionService.GetActiveBookingAsync(room.Id);
        return MapRoom(room, booking);
    }

    private static RoomDto MapRoom(Room r, Booking? activeBooking)
    {
        ActiveSessionDto? session = null;
        if (activeBooking is not null)
        {
            decimal? estimated = null;
            try
            {
                estimated = RoomBillingService.Calculate(activeBooking.CheckIn, DateTime.UtcNow).TotalAmount;
            }
            catch
            {
                // ignore preview errors
            }

            session = new ActiveSessionDto(
                activeBooking.Id,
                activeBooking.CheckIn,
                RoomBillingService.ToVietnamLocal(activeBooking.CheckIn),
                estimated
            );
        }

        return new RoomDto(
            r.Id, r.Name, r.RoomNumber, r.RoomType, r.Floor,
            r.Description, r.Amenities, r.ImageUrl, r.Status, r.IsPublic, session
        );
    }
}
