using HoltelCentrel.Api.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace HoltelCentrel.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class HealthController(AppDbContext db, IConfiguration config) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Get()
    {
        var cs = config.GetConnectionString("DefaultConnection") ?? "";
        var host = ExtractValue(cs, "Host") ?? ExtractValue(cs, "Server");
        var database = ExtractValue(cs, "Database") ?? (cs.Contains("Data Source=", StringComparison.OrdinalIgnoreCase) ? "sqlite-file" : null);
        var isSqlite = cs.Contains("Data Source=", StringComparison.OrdinalIgnoreCase)
                       || cs.Contains(".db", StringComparison.OrdinalIgnoreCase) && !cs.Contains("Host=", StringComparison.OrdinalIgnoreCase);
        var isSupabase = (host?.Contains("supabase", StringComparison.OrdinalIgnoreCase) ?? false);

        int? roomCount = null;
        string? dbError = null;
        try
        {
            roomCount = await db.Rooms.CountAsync();
        }
        catch (Exception ex)
        {
            dbError = ex.Message;
        }

        return Ok(new
        {
            ok = dbError is null,
            environment = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") ?? "Unknown",
            databaseHost = host,
            databaseName = database,
            usingSqlite = isSqlite,
            usingSupabase = isSupabase,
            roomCount,
            dbError,
            hint = !isSupabase
                ? "API chưa nối Supabase. Set ConnectionStrings__DefaultConnection trên Render/VPS rồi redeploy."
                : roomCount == 0
                    ? "Đã nối Supabase nhưng Rooms trống — kiểm tra Table Editor bảng \"Rooms\"."
                    : "Đã nối Supabase. So roomCount với số dòng trên Editor."
        });
    }

    private static string? ExtractValue(string connectionString, string key)
    {
        foreach (var part in connectionString.Split(';', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries))
        {
            var idx = part.IndexOf('=');
            if (idx <= 0) continue;
            var k = part[..idx].Trim();
            if (k.Equals(key, StringComparison.OrdinalIgnoreCase))
                return part[(idx + 1)..].Trim();
        }
        return null;
    }
}
