using backend.DTOs;
using backend.Services;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers;

[ApiController]
[Route("me")]
public class MeController : ControllerBase
{
    private readonly IHoldService _holdService;

    public MeController(IHoldService holdService)
    {
        _holdService = holdService;
    }

    [HttpGet("holds")]
    [ProducesResponseType(typeof(HoldDetailResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetMyHold([FromHeader(Name = "X-Student-Id")] string? studentId)
    {
        if (string.IsNullOrWhiteSpace(studentId))
        {
            return BadRequest(new { error = "Header 'X-Student-Id' is required." });
        }

        if (studentId.Trim().Length != 17 || !studentId.All(char.IsDigit))
        {
            return BadRequest(new { error = "A valid 17-digit birth registration number is required." });
        }

        var hold = await _holdService.GetMyHoldAsync(studentId);
        if (hold == null)
        {
            return NotFound(new { error = "No hold or admission record found for this student." });
        }

        return Ok(hold);
    }
}