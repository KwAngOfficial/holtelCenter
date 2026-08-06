using HoltelCentrel.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace HoltelCentrel.Api.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<Room> Rooms => Set<Room>();
    public DbSet<HourlyRate> HourlyRates => Set<HourlyRate>();
    public DbSet<Product> Products => Set<Product>();
    public DbSet<Voucher> Vouchers => Set<Voucher>();
    public DbSet<Combo> Combos => Set<Combo>();
    public DbSet<ComboItem> ComboItems => Set<ComboItem>();
    public DbSet<Booking> Bookings => Set<Booking>();
    public DbSet<BankSettings> BankSettings => Set<BankSettings>();
    public DbSet<BankPayment> BankPayments => Set<BankPayment>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Room>()
            .HasIndex(r => r.RoomNumber)
            .IsUnique();

        modelBuilder.Entity<Voucher>()
            .HasIndex(v => v.Code)
            .IsUnique();

        modelBuilder.Entity<ComboItem>()
            .HasOne(ci => ci.Combo)
            .WithMany(c => c.Items)
            .HasForeignKey(ci => ci.ComboId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<ComboItem>()
            .HasOne(ci => ci.Product)
            .WithMany()
            .HasForeignKey(ci => ci.ProductId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Booking>()
            .HasOne(b => b.Room)
            .WithMany(r => r.Bookings)
            .HasForeignKey(b => b.RoomId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<BankSettings>()
            .Property(b => b.Id)
            .ValueGeneratedNever();

        modelBuilder.Entity<BankPayment>()
            .HasIndex(p => p.GatewayTransactionId)
            .IsUnique();

        modelBuilder.Entity<BankPayment>()
            .HasOne(p => p.Booking)
            .WithMany()
            .HasForeignKey(p => p.BookingId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}
