namespace HoltelCentrel.Api.Models;

public class Room
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string RoomNumber { get; set; } = string.Empty;
    public string RoomType { get; set; } = "Standard";
    public int Floor { get; set; } = 1;
    public string? Description { get; set; }
    public string? Amenities { get; set; }
    public string? ImageUrl { get; set; }
    public RoomStatus Status { get; set; } = RoomStatus.Available;
    public bool IsPublic { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<Booking> Bookings { get; set; } = [];
}
