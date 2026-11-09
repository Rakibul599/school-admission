using backend.DTOs;
using backend.Services;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers;

[ApiController]
[Route("classes")]
public class ClassesController : ControllerBase
{
    private readonly IClassService _classService;

    public ClassesController(IClassService classService)
    {
        _classService = classService;
    }

    [HttpPost]
    [ProducesResponseType(typeof(ClassResponseDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CreateClass([FromBody] CreateClassRequestDto request)
    {
        try
        {
            var response = await _classService.CreateClassAsync(request);
            return CreatedAtAction(nameof(CreateClass), new { classId = response.Id }, response);
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
        var classDetails = await _classService.GetClassByIdAsync(classId);
        if (classDetails == null)
        {
            return NotFound();
        }
        return Ok(classDetails);
    }
}