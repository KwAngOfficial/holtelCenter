using System.Text;
using System.Text.Json;
using HoltelCentrel.Api.DTOs;
using HoltelCentrel.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace HoltelCentrel.Api.Controllers;

/// <summary>Webhook public — xác thực bằng WebhookSecret trong BankSettings (không dùng admin Bearer).</summary>
[ApiController]
[Route("api/webhooks")]
public class WebhooksController(BankPaymentService bankService) : ControllerBase
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true
    };

    [HttpPost("bank")]
    [HttpPost("sepay")]
    public async Task<ActionResult<WebhookResultDto>> ReceiveBankWebhook()
    {
        var settings = await bankService.GetOrCreateSettingsAsync();

        if (!bankService.ValidateWebhookSecret(settings, Request))
            return Unauthorized(new { message = "Webhook secret không hợp lệ." });

        string raw;
        using (var reader = new StreamReader(Request.Body, Encoding.UTF8))
            raw = await reader.ReadToEndAsync();

        if (string.IsNullOrWhiteSpace(raw))
            return BadRequest(new { message = "Body trống." });

        SePayWebhookDto? dto;
        try
        {
            // SePay gửi 1 object; một số tool gửi mảng
            using var doc = JsonDocument.Parse(raw);
            if (doc.RootElement.ValueKind == JsonValueKind.Array)
            {
                if (doc.RootElement.GetArrayLength() == 0)
                    return BadRequest(new { message = "Mảng giao dịch trống." });

                dto = doc.RootElement[0].Deserialize<SePayWebhookDto>(JsonOptions);
            }
            else
            {
                dto = doc.RootElement.Deserialize<SePayWebhookDto>(JsonOptions);
            }
        }
        catch (JsonException)
        {
            return BadRequest(new { message = "JSON không hợp lệ." });
        }

        if (dto is null)
            return BadRequest(new { message = "Không đọc được payload webhook." });

        var result = await bankService.ProcessSePayWebhookAsync(dto, raw);
        return Ok(result);
    }
}
