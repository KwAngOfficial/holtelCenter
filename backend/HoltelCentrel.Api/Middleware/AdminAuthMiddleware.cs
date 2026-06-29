using System.Text.Json;
using HoltelCentrel.Api.Services;

namespace HoltelCentrel.Api.Middleware;

public class AdminAuthMiddleware(RequestDelegate next, AdminAuthService auth)
{
    public async Task InvokeAsync(HttpContext context)
    {
        if (IsPublicEndpoint(context))
        {
            await next(context);
            return;
        }

        var authHeader = context.Request.Headers.Authorization.FirstOrDefault();
        if (authHeader?.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase) == true)
        {
            var token = authHeader["Bearer ".Length..].Trim();
            if (auth.ValidateToken(token))
            {
                await next(context);
                return;
            }
        }

        context.Response.StatusCode = StatusCodes.Status401Unauthorized;
        context.Response.ContentType = "application/json";
        await context.Response.WriteAsync(JsonSerializer.Serialize(new { message = "Unauthorized" }));
    }

    private static bool IsPublicEndpoint(HttpContext context)
    {
        var path = context.Request.Path.Value ?? "";
        var method = context.Request.Method;

        if (path.StartsWith("/api/auth", StringComparison.OrdinalIgnoreCase))
            return true;

        if (!method.Equals("GET", StringComparison.OrdinalIgnoreCase))
            return false;

        if (path.Equals("/api/rooms/availability", StringComparison.OrdinalIgnoreCase))
            return true;

        if (path.Equals("/api/rooms", StringComparison.OrdinalIgnoreCase)
            && context.Request.Query.ContainsKey("publicOnly"))
            return true;

        if (path.StartsWith("/api/hourlyrates", StringComparison.OrdinalIgnoreCase))
            return true;

        if (path.Equals("/api/combos", StringComparison.OrdinalIgnoreCase)
            && context.Request.Query.ContainsKey("publicOnly"))
            return true;

        if (path.Equals("/api/vouchers", StringComparison.OrdinalIgnoreCase)
            && context.Request.Query.ContainsKey("publicOnly"))
            return true;

        return false;
    }
}
