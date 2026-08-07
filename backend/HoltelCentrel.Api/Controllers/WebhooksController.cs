using System.Text;
using System.Text.Json;
using HoltelCentrel.Api.DTOs;
using HoltelCentrel.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace HoltelCentrel.Api.Controllers;

/// <summary>
/// SePay Webhook: POST payload giao dịch → HTTP 200 + {"success":true} trong 30s.
/// Auth tuỳ chọn: Authorization Apikey / Bearer / X-Api-Key = BankSettings.WebhookSecret.
/// </summary>
[ApiController]
[Route("api/webhooks")]
public class WebhooksController(BankPaymentService bankService, ILogger<WebhooksController> logger) : ControllerBase
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true
    };

    /// <summary>Probe URL (browser / health). SePay dùng POST.</summary>
    [HttpGet("bank")]
    [HttpGet("sepay")]
    [HttpHead("bank")]
    [HttpHead("sepay")]
    public IActionResult Probe()
    {
        return Ok(new
        {
            ok = true,
            provider = "SePay",
            message = "Webhook sẵn sàng. SePay gửi HTTP POST; response chuẩn: {\"success\":true}.",
            method = "POST",
            paths = new[] { "/api/webhooks/sepay", "/api/webhooks/bank" },
            successResponse = new { success = true },
            auth = new[]
            {
                "Authorization: Apikey <secret>",
                "Authorization: Bearer <secret>",
                "X-Api-Key: <secret>"
            }
        });
    }

    /// <summary>
    /// Nhận webhook SePay. Luôn trả {"success":true} khi đã nhận request hợp lệ
    /// (kể cả Unmatched/Duplicate) để SePay không retry vô tận.
    /// 500 chỉ khi lỗi hệ thống — SePay sẽ retry.
    /// </summary>
    [HttpPost("bank")]
    [HttpPost("sepay")]
    public async Task<IActionResult> ReceiveSePayWebhook()
    {
        try
        {
            var settings = await bankService.GetOrCreateSettingsAsync();

            if (!bankService.ValidateWebhookSecret(settings, Request))
            {
                logger.LogWarning("SePay webhook: secret không hợp lệ từ {IP}",
                    HttpContext.Connection.RemoteIpAddress?.ToString());
                return Unauthorized(new { success = false, message = "Webhook secret không hợp lệ." });
            }

            string raw;
            using (var reader = new StreamReader(Request.Body, Encoding.UTF8))
                raw = await reader.ReadToEndAsync();

            if (string.IsNullOrWhiteSpace(raw))
            {
                // Body trống — vẫn success để không spam retry nếu tool test rỗng
                logger.LogWarning("SePay webhook: body trống");
                return SePaySuccess();
            }

            SePayWebhookDto? dto;
            try
            {
                using var doc = JsonDocument.Parse(raw);
                if (doc.RootElement.ValueKind == JsonValueKind.Array)
                {
                    // Một số replay/tool gửi mảng
                    if (doc.RootElement.GetArrayLength() == 0)
                        return SePaySuccess();

                    dto = doc.RootElement[0].Deserialize<SePayWebhookDto>(JsonOptions);
                }
                else
                {
                    dto = doc.RootElement.Deserialize<SePayWebhookDto>(JsonOptions);
                }
            }
            catch (JsonException ex)
            {
                logger.LogWarning(ex, "SePay webhook: JSON không hợp lệ");
                // SePay chính thức luôn gửi JSON hợp lệ; tool test lỗi → success để dừng
                return SePaySuccess();
            }

            if (dto is null)
                return SePaySuccess();

            var result = await bankService.ProcessSePayWebhookAsync(dto, raw);
            logger.LogInformation(
                "SePay webhook id={TxId} status={Status} booking={BookingId}: {Message}",
                dto.Id?.ToString() ?? "(none)",
                result.Status,
                result.BookingId,
                result.Message);

            return SePaySuccess();
        }
        catch (Exception ex)
        {
            // Lỗi DB/hệ thống → không success → SePay retry
            logger.LogError(ex, "SePay webhook lỗi hệ thống");
            return StatusCode(StatusCodes.Status500InternalServerError, new
            {
                success = false,
                message = "Lỗi hệ thống, vui lòng thử lại."
            });
        }
    }

    private static OkObjectResult SePaySuccess() =>
        new(new SePayAckDto(true));
}
