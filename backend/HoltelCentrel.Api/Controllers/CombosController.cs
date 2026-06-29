using HoltelCentrel.Api.Data;
using HoltelCentrel.Api.DTOs;
using HoltelCentrel.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace HoltelCentrel.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CombosController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IEnumerable<ComboDto>>> GetAll([FromQuery] bool? publicOnly = null)
    {
        var query = db.Combos.Include(c => c.Items).ThenInclude(i => i.Product).AsQueryable();
        if (publicOnly == true)
            query = query.Where(c => c.IsPublic && c.IsActive);

        var combos = await query.OrderBy(c => c.Name).ToListAsync();
        return Ok(combos.Select(MapCombo));
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<ComboDto>> GetById(int id)
    {
        var combo = await db.Combos.Include(c => c.Items).ThenInclude(i => i.Product)
            .FirstOrDefaultAsync(c => c.Id == id);
        if (combo is null) return NotFound();
        return Ok(MapCombo(combo));
    }

    [HttpPost]
    public async Task<ActionResult<ComboDto>> Create(CreateComboDto dto)
    {
        var combo = new Combo
        {
            Name = dto.Name,
            Description = dto.Description,
            RoomType = dto.RoomType,
            DurationHours = dto.DurationHours,
            ComboPrice = dto.ComboPrice,
            ImageUrl = dto.ImageUrl,
            IsPublic = dto.IsPublic,
            Items = dto.Items.Select(i => new ComboItem { ProductId = i.ProductId, Quantity = i.Quantity }).ToList()
        };

        db.Combos.Add(combo);
        await db.SaveChangesAsync();

        await db.Entry(combo).Collection(c => c.Items).Query().Include(i => i.Product).LoadAsync();
        return CreatedAtAction(nameof(GetById), new { id = combo.Id }, MapCombo(combo));
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<ComboDto>> Update(int id, CreateComboDto dto)
    {
        var combo = await db.Combos.Include(c => c.Items).FirstOrDefaultAsync(c => c.Id == id);
        if (combo is null) return NotFound();

        combo.Name = dto.Name;
        combo.Description = dto.Description;
        combo.RoomType = dto.RoomType;
        combo.DurationHours = dto.DurationHours;
        combo.ComboPrice = dto.ComboPrice;
        combo.ImageUrl = dto.ImageUrl;
        combo.IsPublic = dto.IsPublic;

        db.ComboItems.RemoveRange(combo.Items);
        combo.Items = dto.Items.Select(i => new ComboItem { ProductId = i.ProductId, Quantity = i.Quantity }).ToList();

        await db.SaveChangesAsync();
        await db.Entry(combo).Collection(c => c.Items).Query().Include(i => i.Product).LoadAsync();
        return Ok(MapCombo(combo));
    }

    [HttpPatch("{id:int}/toggle")]
    public async Task<ActionResult<ComboDto>> Toggle(int id)
    {
        var combo = await db.Combos.Include(c => c.Items).ThenInclude(i => i.Product)
            .FirstOrDefaultAsync(c => c.Id == id);
        if (combo is null) return NotFound();

        combo.IsActive = !combo.IsActive;
        await db.SaveChangesAsync();
        return Ok(MapCombo(combo));
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var combo = await db.Combos.FindAsync(id);
        if (combo is null) return NotFound();

        db.Combos.Remove(combo);
        await db.SaveChangesAsync();
        return NoContent();
    }

    private static ComboDto MapCombo(Combo c) => new(
        c.Id, c.Name, c.Description, c.RoomType, c.DurationHours, c.ComboPrice,
        c.ImageUrl, c.IsActive, c.IsPublic,
        c.Items.Select(i => new ComboItemDto(
            i.Id, i.ProductId, i.Product.Name, i.Quantity, i.Product.Price
        )).ToList()
    );
}
