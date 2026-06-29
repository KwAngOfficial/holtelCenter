using HoltelCentrel.Api.Data;
using HoltelCentrel.Api.DTOs;
using HoltelCentrel.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace HoltelCentrel.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ProductsController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IEnumerable<ProductDto>>> GetAll([FromQuery] bool? activeOnly = null)
    {
        var query = db.Products.AsQueryable();
        if (activeOnly == true)
            query = query.Where(p => p.IsActive);

        var products = await query.OrderBy(p => p.Category).ThenBy(p => p.Name).ToListAsync();
        return Ok(products.Select(MapProduct));
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<ProductDto>> GetById(int id)
    {
        var product = await db.Products.FindAsync(id);
        if (product is null) return NotFound();
        return Ok(MapProduct(product));
    }

    [HttpPost]
    public async Task<ActionResult<ProductDto>> Create(CreateProductDto dto)
    {
        var product = new Product
        {
            Name = dto.Name,
            Category = dto.Category,
            Price = dto.Price,
            Stock = dto.Stock,
            ImageUrl = dto.ImageUrl
        };

        db.Products.Add(product);
        await db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetById), new { id = product.Id }, MapProduct(product));
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<ProductDto>> Update(int id, CreateProductDto dto)
    {
        var product = await db.Products.FindAsync(id);
        if (product is null) return NotFound();

        product.Name = dto.Name;
        product.Category = dto.Category;
        product.Price = dto.Price;
        product.Stock = dto.Stock;
        product.ImageUrl = dto.ImageUrl;

        await db.SaveChangesAsync();
        return Ok(MapProduct(product));
    }

    [HttpPatch("{id:int}/toggle")]
    public async Task<ActionResult<ProductDto>> Toggle(int id)
    {
        var product = await db.Products.FindAsync(id);
        if (product is null) return NotFound();

        product.IsActive = !product.IsActive;
        await db.SaveChangesAsync();
        return Ok(MapProduct(product));
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var product = await db.Products.FindAsync(id);
        if (product is null) return NotFound();

        var inCombo = await db.ComboItems.AnyAsync(ci => ci.ProductId == id);
        if (inCombo)
            return BadRequest(new { message = "Sản phẩm đang được dùng trong combo." });

        db.Products.Remove(product);
        await db.SaveChangesAsync();
        return NoContent();
    }

    private static ProductDto MapProduct(Product p) => new(
        p.Id, p.Name, p.Category, p.Price, p.Stock, p.ImageUrl, p.IsActive
    );
}
