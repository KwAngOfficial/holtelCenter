using HoltelCentrel.Api.Data;
using HoltelCentrel.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace HoltelCentrel.Api.Data;

public static class DbSeeder
{
    public static async Task SeedAsync(AppDbContext db)
    {
        await db.Database.EnsureCreatedAsync();

        if (await db.Rooms.AnyAsync()) return;

        var rooms = new List<Room>
        {
            new() { Name = "Phòng Standard 101", RoomNumber = "101", RoomType = "Standard", Floor = 1, Description = "Phòng tiêu chuẩn ấm cúng", Amenities = "WiFi,TV,Điều hòa", ImageUrl = "https://picsum.photos/seed/room101/800/600", Status = RoomStatus.Available },
            new() { Name = "Phòng Standard 102", RoomNumber = "102", RoomType = "Standard", Floor = 1, Description = "View sân vườn", Amenities = "WiFi,TV,Điều hòa", ImageUrl = "https://picsum.photos/seed/room102/800/600", Status = RoomStatus.Available },
            new() { Name = "Phòng VIP 201", RoomNumber = "201", RoomType = "VIP", Floor = 2, Description = "Phòng VIP rộng rãi", Amenities = "WiFi,TV,Điều hòa,Jacuzzi", ImageUrl = "https://picsum.photos/seed/room201/800/600", Status = RoomStatus.Cleaning },
            new() { Name = "Phòng VIP 202", RoomNumber = "202", RoomType = "VIP", Floor = 2, Description = "Phòng đôi sang trọng", Amenities = "WiFi,TV,Điều hòa,Mini bar", ImageUrl = "https://picsum.photos/seed/room202/800/600", Status = RoomStatus.Available },
            new() { Name = "Phòng Couple 301", RoomNumber = "301", RoomType = "Couple", Floor = 3, Description = "Không gian lãng mạn", Amenities = "WiFi,TV,Điều hòa,Đèn mood", ImageUrl = "https://picsum.photos/seed/room301/800/600", Status = RoomStatus.Available },
        };
        db.Rooms.AddRange(rooms);

        db.HourlyRates.AddRange(
            new HourlyRate { RoomType = "Standard", DurationHours = 2, Label = "2 giờ", Price = 120_000, DayType = DayType.Weekday },
            new HourlyRate { RoomType = "Standard", DurationHours = 3, Label = "3 giờ", Price = 160_000, DayType = DayType.Weekday },
            new HourlyRate { RoomType = "Standard", DurationHours = 6, Label = "6 giờ", Price = 280_000, DayType = DayType.Weekday },
            new HourlyRate { RoomType = "Standard", DurationHours = 12, Label = "Qua đêm", Price = 350_000, DayType = DayType.Weekday },
            new HourlyRate { RoomType = "VIP", DurationHours = 2, Label = "2 giờ", Price = 180_000, DayType = DayType.Weekday },
            new HourlyRate { RoomType = "VIP", DurationHours = 3, Label = "3 giờ", Price = 240_000, DayType = DayType.Weekday },
            new HourlyRate { RoomType = "VIP", DurationHours = 12, Label = "Qua đêm", Price = 520_000, DayType = DayType.Weekday },
            new HourlyRate { RoomType = "Couple", DurationHours = 2, Label = "2 giờ", Price = 150_000, DayType = DayType.Weekday },
            new HourlyRate { RoomType = "Couple", DurationHours = 3, Label = "3 giờ", Price = 200_000, DayType = DayType.Weekday }
        );

        var products = new List<Product>
        {
            new() { Name = "Coca Cola", Category = "Nước ngọt", Price = 15_000, Stock = 48 },
            new() { Name = "Sting", Category = "Nước ngọt", Price = 15_000, Stock = 36 },
            new() { Name = "Aquafina 500ml", Category = "Nước suối", Price = 10_000, Stock = 60 },
            new() { Name = "Heineken", Category = "Bia", Price = 25_000, Stock = 24 },
            new() { Name = "Tiger", Category = "Bia", Price = 20_000, Stock = 30 },
            new() { Name = "Mì ly", Category = "Đồ ăn", Price = 18_000, Stock = 20 },
            new() { Name = "Snack khoai tây", Category = "Đồ ăn", Price = 12_000, Stock = 25 },
        };
        db.Products.AddRange(products);

        db.Vouchers.AddRange(
            new Voucher
            {
                Code = "WELCOME10",
                Name = "Giảm 10% lần đầu",
                Description = "Áp dụng cho khách mới",
                DiscountType = DiscountType.Percentage,
                DiscountValue = 10,
                ValidFrom = DateTime.UtcNow.AddDays(-7),
                ValidTo = DateTime.UtcNow.AddMonths(3),
                UsageLimit = 200
            },
            new Voucher
            {
                Code = "WEEKEND50K",
                Name = "Giảm 50K cuối tuần",
                Description = "Thuê từ 3 giờ trở lên",
                DiscountType = DiscountType.FixedAmount,
                DiscountValue = 50_000,
                MinDurationHours = 3,
                ValidFrom = DateTime.UtcNow.AddDays(-7),
                ValidTo = DateTime.UtcNow.AddMonths(2),
                UsageLimit = 100
            }
        );

        await db.SaveChangesAsync();

        var combo = new Combo
        {
            Name = "Combo Chill 3h",
            Description = "Phòng Standard 3 giờ + 2 nước ngọt",
            RoomType = "Standard",
            DurationHours = 3,
            ComboPrice = 185_000,
            ImageUrl = "https://picsum.photos/seed/combo1/800/600",
            Items =
            [
                new ComboItem { ProductId = products[0].Id, Quantity = 1 },
                new ComboItem { ProductId = products[1].Id, Quantity = 1 },
            ]
        };

        var combo2 = new Combo
        {
            Name = "Combo VIP Night",
            Description = "Phòng VIP qua đêm + 2 bia + snack",
            RoomType = "VIP",
            DurationHours = 12,
            ComboPrice = 580_000,
            ImageUrl = "https://picsum.photos/seed/combo2/800/600",
            Items =
            [
                new ComboItem { ProductId = products[3].Id, Quantity = 2 },
                new ComboItem { ProductId = products[6].Id, Quantity = 1 },
            ]
        };

        db.Combos.AddRange(combo, combo2);
        await db.SaveChangesAsync();
    }
}
