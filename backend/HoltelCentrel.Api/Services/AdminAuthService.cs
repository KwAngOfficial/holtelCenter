using System.Security.Cryptography;
using System.Text;

namespace HoltelCentrel.Api.Services;

public class AdminAuthService(IConfiguration configuration)
{
    public int SessionDays =>
        int.TryParse(configuration["Admin:SessionDays"], out var days) && days > 0 ? days : 30;

    private TimeSpan TokenLifetime => TimeSpan.FromDays(SessionDays);

    private string Password => configuration["Admin:Password"] ?? "saodem2024";
    private string TokenSecret => configuration["Admin:TokenSecret"] ?? "holtel-centrel-dev-secret";

    public bool ValidatePassword(string password)
    {
        var expected = Password;
        if (password.Length != expected.Length) return false;
        return CryptographicOperations.FixedTimeEquals(
            Encoding.UTF8.GetBytes(password),
            Encoding.UTF8.GetBytes(expected));
    }

    public string IssueToken()
    {
        var expiry = DateTimeOffset.UtcNow.Add(TokenLifetime).ToUnixTimeSeconds();
        return $"{expiry}.{ComputeSignature(expiry)}";
    }

    public bool ValidateToken(string? token)
    {
        if (string.IsNullOrWhiteSpace(token)) return false;

        var parts = token.Split('.', 2);
        if (parts.Length != 2) return false;
        if (!long.TryParse(parts[0], out var expiry)) return false;
        if (DateTimeOffset.UtcNow.ToUnixTimeSeconds() > expiry) return false;

        return parts[1] == ComputeSignature(expiry);
    }

    private string ComputeSignature(long expiry)
    {
        using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(TokenSecret));
        return Convert.ToBase64String(hmac.ComputeHash(Encoding.UTF8.GetBytes(expiry.ToString())));
    }
}
