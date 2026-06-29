namespace HoltelCentrel.Api.Models;

public class HourlyRate
{
    public int Id { get; set; }
    public string RoomType { get; set; } = "Standard";
    public int DurationHours { get; set; }
    public string Label { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public DayType DayType { get; set; } = DayType.Weekday;
    public bool IsActive { get; set; } = true;
}
