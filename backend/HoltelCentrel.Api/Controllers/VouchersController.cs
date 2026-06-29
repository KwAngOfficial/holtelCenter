using HoltelCentrel.Api.Data;
using HoltelCentrel.Api.DTOs;
using HoltelCentrel.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace HoltelCentrel.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class VouchersController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IEnumerable<VoucherDto>>> GetAll([FromQuery] bool? activeOnly = null, [FromQuery] bool? publicOnly = null)
    {
        var query = db.Vouchers.AsQueryable();
        if (activeOnly == true)
            query = query.Where(v => v.IsActive);
        if (publicOnly == true)
        {
            var now = DateTime.UtcNow;
            query = query.Where(v => v.IsActive && v.ValidFrom <= now && v.ValidTo >= now && v.UsedCount < v.UsageLimit);
        }

        var vouchers = await query.OrderByDescending(v => v.ValidFrom).ToListAsync();
        return Ok(vouchers.Select(MapVoucher));
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<VoucherDto>> GetById(int id)
    {
        var voucher = await db.Vouchers.FindAsync(id);
        if (voucher is null) return NotFound();
        return Ok(MapVoucher(voucher));
    }

    [HttpGet("validate/{code}")]
    public async Task<ActionResult<VoucherDto>> Validate(string code)
    {
        var voucher = await db.Vouchers.FirstOrDefaultAsync(v => v.Code == code.ToUpper());
        if (voucher is null) return NotFound(new { message = "Mã voucher không tồn tại." });

        var now = DateTime.UtcNow;
        if (!voucher.IsActive || voucher.ValidFrom > now || voucher.ValidTo < now || voucher.UsedCount >= voucher.UsageLimit)
            return BadRequest(new { message = "Voucher không còn hiệu lực." });

        return Ok(MapVoucher(voucher));
    }

    [HttpPost]
    public async Task<ActionResult<VoucherDto>> Create(CreateVoucherDto dto)
    {
        var code = dto.Code.ToUpper();
        if (await db.Vouchers.AnyAsync(v => v.Code == code))
            return BadRequest(new { message = "Mã voucher đã tồn tại." });

        var voucher = new Voucher
        {
            Code = code,
            Name = dto.Name,
            Description = dto.Description,
            DiscountType = dto.DiscountType,
            DiscountValue = dto.DiscountValue,
            MinDurationHours = dto.MinDurationHours,
            ApplicableRoomTypes = dto.ApplicableRoomTypes,
            ValidFrom = dto.ValidFrom,
            ValidTo = dto.ValidTo,
            UsageLimit = dto.UsageLimit
        };

        db.Vouchers.Add(voucher);
        await db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetById), new { id = voucher.Id }, MapVoucher(voucher));
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<VoucherDto>> Update(int id, CreateVoucherDto dto)
    {
        var voucher = await db.Vouchers.FindAsync(id);
        if (voucher is null) return NotFound();

        var code = dto.Code.ToUpper();
        if (await db.Vouchers.AnyAsync(v => v.Code == code && v.Id != id))
            return BadRequest(new { message = "Mã voucher đã tồn tại." });

        voucher.Code = code;
        voucher.Name = dto.Name;
        voucher.Description = dto.Description;
        voucher.DiscountType = dto.DiscountType;
        voucher.DiscountValue = dto.DiscountValue;
        voucher.MinDurationHours = dto.MinDurationHours;
        voucher.ApplicableRoomTypes = dto.ApplicableRoomTypes;
        voucher.ValidFrom = dto.ValidFrom;
        voucher.ValidTo = dto.ValidTo;
        voucher.UsageLimit = dto.UsageLimit;

        await db.SaveChangesAsync();
        return Ok(MapVoucher(voucher));
    }

    [HttpPatch("{id:int}/toggle")]
    public async Task<ActionResult<VoucherDto>> Toggle(int id)
    {
        var voucher = await db.Vouchers.FindAsync(id);
        if (voucher is null) return NotFound();

        voucher.IsActive = !voucher.IsActive;
        await db.SaveChangesAsync();
        return Ok(MapVoucher(voucher));
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var voucher = await db.Vouchers.FindAsync(id);
        if (voucher is null) return NotFound();

        db.Vouchers.Remove(voucher);
        await db.SaveChangesAsync();
        return NoContent();
    }

    private static VoucherDto MapVoucher(Voucher v) => new(
        v.Id, v.Code, v.Name, v.Description, v.DiscountType, v.DiscountValue,
        v.MinDurationHours, v.ApplicableRoomTypes, v.ValidFrom, v.ValidTo,
        v.UsageLimit, v.UsedCount, v.IsActive
    );
}
