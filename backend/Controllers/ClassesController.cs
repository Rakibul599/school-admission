using backend.DTOs;
using backend.Services;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers;

[ApiController]
[Route("classes")]
public class ClassesController : ControllerBase
{
    private readonly IClassService _classService;
    private readonly IHoldService _holdService;

    public ClassesController(IClassService classService, IHoldService holdService)
    {
        _classService = classService;
        _holdService = holdService;
    }

    [HttpPost]
    [ProducesResponseType(typeof(ClassResponseDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CreateClass([FromBody] CreateClassRequestDto request)
    {
        try
        {
            var response = await _classService.CreateClassAsync(request);
            return StatusCode(StatusCodes.Status201Created, response);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpGet]
    [ProducesResponseType(typeof(List<ClassDetailResponseDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAllClasses()
    {
        var classes = await _classService.GetAllClassesAsync();
        return Ok(classes);
    }

    [HttpGet("{classId}")]
    [ProducesResponseType(typeof(ClassDetailResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetClassById(string classId)
    {
        var classDetail = await _classService.GetClassByIdAsync(classId);
        if (classDetail == null)
        {
            return NotFound(new { error = $"Class with id '{classId}' not found." });
        }

        return Ok(classDetail);
    }

    [HttpPost("{classId}/holds")]
    [ProducesResponseType(typeof(HoldSeatResponseDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> HoldSeat(
        string classId,
        [FromHeader(Name = "X-Student-Id")] string? studentId)
    {
        if (string.IsNullOrWhiteSpace(studentId))
        {
            return BadRequest(new { error = "Header 'X-Student-Id' is required." });
        }

        var result = await _holdService.HoldSeatAsync(classId, studentId);

        if (result == null || !result.Success || result.Hold == null)
        {
            var errorMsg = result?.ErrorMessage ?? "An unexpected error occurred while holding the seat.";

            return result?.ErrorCode switch
            {
                "CLASS_NOT_FOUND" => NotFound(new { error = errorMsg }),
                "NO_SEATS" => Conflict(new { error = errorMsg }),
                "ALREADY_APPLIED" => Conflict(new { error = errorMsg }),
                "INVALID_STUDENT_ID" => BadRequest(new { error = errorMsg }),
                _ => BadRequest(new { error = errorMsg })
            };
        }

        var response = new HoldSeatResponseDto
        {
            HoldId = result.Hold.Id,
            ClassId = result.Hold.ClassId,
            StudentId = result.Hold.StudentId,
            Status = result.Hold.Status,
            ExpiresAt = result.Hold.ExpiresAt
        };

        return StatusCode(StatusCodes.Status201Created, response);
    }
}