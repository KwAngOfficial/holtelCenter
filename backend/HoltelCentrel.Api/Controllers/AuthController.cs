using HoltelCentrel.Api.DTOs;
using HoltelCentrel.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace HoltelCentrel.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController(AdminAuthService auth) : ControllerBase
{
    [HttpPost("login")]
    public IActionResult Login(LoginDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Password))
            return BadRequest(new { message = "Vui lòng nhập mật khẩu." });

        if (!auth.ValidatePassword(dto.Password))
            return Unauthorized(new { message = "Mật khẩu không đúng." });

        return Ok(new LoginResponseDto(auth.IssueToken(), auth.SessionDays));
    }

    [HttpGet("verify")]
    public IActionResult Verify()
    {
        var authHeader = Request.Headers.Authorization.FirstOrDefault();
        if (authHeader?.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase) != true)
            return Unauthorized(new { message = "Unauthorized" });

        var token = authHeader["Bearer ".Length..].Trim();
        if (!auth.ValidateToken(token))
            return Unauthorized(new { message = "Phiên đăng nhập đã hết hạn." });

        return Ok(new { ok = true });
    }
}
