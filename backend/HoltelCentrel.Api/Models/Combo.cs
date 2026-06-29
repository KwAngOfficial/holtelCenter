namespace HoltelCentrel.Api.Models;

public class Combo
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string RoomType { get; set; } = "Standard";
    public int DurationHours { get; set; }
    public decimal ComboPrice { get; set; }
    public string? ImageUrl { get; set; }
    public bool IsActive { get; set; } = true;
    public bool IsPublic { get; set; } = true;

    public ICollection<ComboItem> Items { get; set; } = [];
}

public class ComboItem
{
    public int Id { get; set; }
    public int ComboId { get; set; }
    public Combo Combo { get; set; } = null!;
    public int ProductId { get; set; }
    public Product Product { get; set; } = null!;
    public int Quantity { get; set; } = 1;
}
