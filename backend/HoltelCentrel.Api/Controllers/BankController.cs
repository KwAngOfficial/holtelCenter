using HoltelCentrel.Api.DTOs;
using HoltelCentrel.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace HoltelCentrel.Api.Controllers;

[ApiController]
[Route("api/bank")]
public class BankController(BankPaymentService bankService) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<BankSettingsDto>> Get()
        => Ok(await bankService.GetSettingsDtoAsync());

    [HttpPut]
    public async Task<ActionResult<BankSettingsDto>> Update(UpdateBankSettingsDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.AccountNumber) && dto.IsEnabled)
            return BadRequest(new { message = "Cần số tài khoản khi bật chuyển khoản." });
        if (string.IsNullOrWhiteSpace(dto.BankBin) && dto.IsEnabled)
            return BadRequest(new { message = "Cần mã BIN ngân hàng (VietQR) khi bật chuyển khoản." });

        var result = await bankService.UpdateSettingsAsync(dto);
        return Ok(result);
    }

    [HttpGet("payments")]
    public async Task<ActionResult<IEnumerable<BankPaymentDto>>> Payments([FromQuery] int take = 50)
        => Ok(await bankService.ListPaymentsAsync(take));

    [HttpPost("payments/{bookingId:int}/mark-paid")]
    public async Task<ActionResult<BankPaymentDto>> MarkPaid(int bookingId)
    {
        var result = await bankService.MarkBookingPaidManualAsync(bookingId);
        if (result is null) return NotFound(new { message = "Không tìm thấy booking." });
        return Ok(result);
    }
}
