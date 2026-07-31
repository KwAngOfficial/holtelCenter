using System.Text.Json.Serialization;
using HoltelCentrel.Api.Data;
using HoltelCentrel.Api.Middleware;
using HoltelCentrel.Api.Services;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
        options.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
    });
builder.Services.AddOpenApi();

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddScoped<RoomSessionService>();
builder.Services.AddSingleton<AdminAuthService>();

builder.Services.Configure<ForwardedHeadersOptions>(options =>
{
    options.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
});

var corsOrigins = new List<string>
{
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5161",
    "http://127.0.0.1:5161",
};
var configuredOrigins = builder.Configuration.GetSection("Cors:Origins").Get<string[]>();
if (configuredOrigins is { Length: > 0 })
    corsOrigins.AddRange(configuredOrigins);

var allowedHosts = builder.Configuration.GetSection("Cors:AllowedHosts").Get<string[]>() ?? [];
var publicHost = builder.Configuration["PUBLIC_HOST"];
if (!string.IsNullOrWhiteSpace(publicHost))
    allowedHosts = [.. allowedHosts, publicHost];

var frontendUrl = builder.Configuration["FRONTEND_URL"];
if (!string.IsNullOrWhiteSpace(frontendUrl))
{
    corsOrigins.AddRange(
        frontendUrl.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries));
}

builder.Services.AddCors(options =>
{
    var allowedOrigins = corsOrigins.Distinct(StringComparer.OrdinalIgnoreCase).ToHashSet(StringComparer.OrdinalIgnoreCase);
    var hostAllowList = allowedHosts.Distinct(StringComparer.OrdinalIgnoreCase).ToHashSet(StringComparer.OrdinalIgnoreCase);

    options.AddPolicy("Frontend", policy =>
        policy.SetIsOriginAllowed(origin =>
        {
            if (string.IsNullOrWhiteSpace(origin)) return false;
            if (allowedOrigins.Contains(origin)) return true;

            if (!Uri.TryCreate(origin, UriKind.Absolute, out var uri)) return false;

            if (uri.Host.EndsWith(".vercel.app", StringComparison.OrdinalIgnoreCase))
                return true;

            // VPS: cho phép mọi port trên IP/host đã cấu hình (vd. frontend :8000)
            if (hostAllowList.Contains(uri.Host))
                return true;

            return false;
        })
        .AllowAnyHeader()
        .AllowAnyMethod());
});

var port = Environment.GetEnvironmentVariable("PORT");
var aspnetUrls = Environment.GetEnvironmentVariable("ASPNETCORE_URLS");
if (!string.IsNullOrEmpty(port))
    builder.WebHost.UseUrls($"http://+:{port}");
else if (string.IsNullOrWhiteSpace(aspnetUrls) && !builder.Environment.IsDevelopment())
    builder.WebHost.UseUrls("http://127.0.0.1:5161");

var app = builder.Build();

app.UseForwardedHeaders();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    await DbSeeder.SeedAsync(db);
}

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseCors("Frontend");
app.UseMiddleware<AdminAuthMiddleware>();

// Chỉ bật HTTPS redirect khi có cấu hình SSL (tránh warn trên VPS HTTP-only)
var httpsPort = builder.Configuration["HTTPS_PORT"] ?? builder.Configuration["ASPNETCORE_HTTPS_PORT"];
if (!string.IsNullOrWhiteSpace(httpsPort))
    app.UseHttpsRedirection();

app.MapControllers();

app.Lifetime.ApplicationStarted.Register(() =>
{
    var urls = app.Urls.Any()
        ? string.Join(", ", app.Urls)
        : aspnetUrls ?? "http://0.0.0.0:5161";
    var cs = app.Configuration.GetConnectionString("DefaultConnection") ?? "";
    string? dbHost = null;
    foreach (var part in cs.Split(';', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries))
    {
        var idx = part.IndexOf('=');
        if (idx <= 0) continue;
        var key = part[..idx].Trim();
        if (key.Equals("Host", StringComparison.OrdinalIgnoreCase) || key.Equals("Server", StringComparison.OrdinalIgnoreCase))
        {
            dbHost = part[(idx + 1)..].Trim();
            break;
        }
    }
    if (string.IsNullOrWhiteSpace(dbHost) && cs.Contains("Data Source=", StringComparison.OrdinalIgnoreCase))
        dbHost = "(sqlite file)";

    Console.WriteLine();
    Console.WriteLine("========================================");
    Console.WriteLine("  Sao Dem Holtel API — dang chay");
    Console.WriteLine($"  Environment: {app.Environment.EnvironmentName}");
    Console.WriteLine($"  URLs: {urls}");
    Console.WriteLine($"  Database: {dbHost ?? "(chua cau hinh)"}");
    Console.WriteLine("  Nhan Ctrl+C de dung");
    Console.WriteLine("========================================");
    Console.WriteLine();
});

app.Run();
