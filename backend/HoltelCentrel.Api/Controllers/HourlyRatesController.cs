using HoltelCentrel.Api.Data;
using HoltelCentrel.Api.DTOs;
using HoltelCentrel.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace HoltelCentrel.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class HourlyRatesController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IEnumerable<HourlyRateDto>>> GetAll([FromQuery] string? roomType = null, [FromQuery] bool? activeOnly = null)
    {
        var query = db.HourlyRates.AsQueryable();
        if (!string.IsNullOrEmpty(roomType))
            query = query.Where(r => r.RoomType == roomType);
        if (activeOnly == true)
            query = query.Where(r => r.IsActive);

        var rates = await query.OrderBy(r => r.RoomType).ThenBy(r => r.DurationHours).ToListAsync();
        return Ok(rates.Select(MapRate));
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<HourlyRateDto>> GetById(int id)
    {
        var rate = await db.HourlyRates.FindAsync(id);
        if (rate is null) return NotFound();
        return Ok(MapRate(rate));
    }

    [HttpPost]
    public async Task<ActionResult<HourlyRateDto>> Create(CreateHourlyRateDto dto)
    {
        var rate = new HourlyRate
        {
            RoomType = dto.RoomType,
            DurationHours = dto.DurationHours,
            Label = dto.Label,
            Price = dto.Price,
            DayType = dto.DayType
        };

        db.HourlyRates.Add(rate);
        await db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetById), new { id = rate.Id }, MapRate(rate));
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<HourlyRateDto>> Update(int id, CreateHourlyRateDto dto)
    {
        var rate = await db.HourlyRates.FindAsync(id);
        if (rate is null) return NotFound();

        rate.RoomType = dto.RoomType;
        rate.DurationHours = dto.DurationHours;
        rate.Label = dto.Label;
        rate.Price = dto.Price;
        rate.DayType = dto.DayType;

        await db.SaveChangesAsync();
        return Ok(MapRate(rate));
    }

    [HttpPatch("{id:int}/toggle")]
    public async Task<ActionResult<HourlyRateDto>> Toggle(int id)
    {
        var rate = await db.HourlyRates.FindAsync(id);
        if (rate is null) return NotFound();

        rate.IsActive = !rate.IsActive;
        await db.SaveChangesAsync();
        return Ok(MapRate(rate));
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var rate = await db.HourlyRates.FindAsync(id);
        if (rate is null) return NotFound();

        db.HourlyRates.Remove(rate);
        await db.SaveChangesAsync();
        return NoContent();
    }

    private static HourlyRateDto MapRate(HourlyRate r) => new(
        r.Id, r.RoomType, r.DurationHours, r.Label, r.Price, r.DayType, r.IsActive
    );
}
