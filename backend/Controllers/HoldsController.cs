using backend.DTOs;
using backend.Services;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers;

[ApiController]
[Route("holds")]
public class HoldsController : ControllerBase
{
    private readonly IHoldService _holdService;

    public HoldsController(IHoldService holdService)
    {
        _holdService = holdService;
    }

    [HttpGet("{holdId}")]
    [ProducesResponseType(typeof(HoldDetailResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetHoldById(string holdId)
    {
        var hold = await _holdService.GetHoldByIdAsync(holdId);
        if (hold == null)
        {
            return NotFound(new { error = $"Hold with id '{holdId}' was not found." });
        }

        return Ok(hold);
    }

    [HttpPost("{holdId}/confirm")]
    [ProducesResponseType(typeof(ConfirmHoldResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> ConfirmHold(
        string holdId,
        [FromHeader(Name = "X-Student-Id")] string? studentId)
    {
        if (string.IsNullOrWhiteSpace(studentId))
        {
            return BadRequest(new { error = "Header 'X-Student-Id' is required." });
        }

        var result = await _holdService.ConfirmHoldAsync(holdId, studentId);

        if (!result.Success || result.Hold == null)
        {
            return result.ErrorCode switch
            {
                "HOLD_NOT_FOUND" => NotFound(new { error = result.ErrorMessage }),
                "HOLD_EXPIRED" => Conflict(new { error = result.ErrorMessage }),
                "ALREADY_CONFIRMED" => Conflict(new { error = result.ErrorMessage }),
                "INVALID_STATUS" => Conflict(new { error = result.ErrorMessage }),
                "STUDENT_MISMATCH" => BadRequest(new { error = result.ErrorMessage }),
                "INVALID_STUDENT_ID" => BadRequest(new { error = result.ErrorMessage }),
                _ => BadRequest(new { error = result.ErrorMessage ?? "Could not confirm hold." })
            };
        }

        var response = new ConfirmHoldResponseDto
        {
            HoldId = result.Hold.Id,
            ClassId = result.Hold.ClassId,
            StudentId = result.Hold.StudentId,
            Status = result.Hold.Status
        };

        return Ok(response);
    }

    [HttpDelete("{holdId}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> CancelHold(
        string holdId,
        [FromHeader(Name = "X-Student-Id")] string? studentId)
    {
        if (string.IsNullOrWhiteSpace(studentId))
        {
            return BadRequest(new { error = "Header 'X-Student-Id' is required." });
        }

        var result = await _holdService.CancelHoldAsync(holdId, studentId);

        if (!result.Success)
        {
            return result.ErrorCode switch
            {
                "HOLD_NOT_FOUND" => NotFound(new { error = result.ErrorMessage }),
                "STUDENT_MISMATCH" => BadRequest(new { error = result.ErrorMessage }),
                "ALREADY_CONFIRMED" => Conflict(new { error = result.ErrorMessage }),
                "HOLD_EXPIRED" => Conflict(new { error = result.ErrorMessage }),
                "INVALID_STATUS" => Conflict(new { error = result.ErrorMessage }),
                _ => BadRequest(new { error = result.ErrorMessage ?? "Could not cancel hold." })
            };
        }

        // Return HTTP 204 No Content upon successful cancellation
        return NoContent();
    }
}