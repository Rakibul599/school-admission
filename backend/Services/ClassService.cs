using backend.DTOs;
using backend.Models;
using backend.Repositories;

namespace backend.Services;

public class ClassService : IClassService
{
    private readonly IClassRepository _classRepository;

    public ClassService(IClassRepository classRepository)
    {
        _classRepository = classRepository;
    }

    public async Task<ClassResponseDto> CreateClassAsync(CreateClassRequestDto request)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
        {
            throw new ArgumentException("Class name cannot be empty.");
        }

        if (request.TotalSeats <= 0)
        {
            throw new ArgumentException("Total seats must be greater than zero.");
        }

        var schoolClass = new SchoolClass
        {
            Id = $"c_{Guid.NewGuid().ToString("N")[..8]}", // Generates prefix format like c_123
            Name = request.Name.Trim(),
            TotalSeats = request.TotalSeats,
            CreatedAt = DateTime.UtcNow
        };

        var createdClass = await _classRepository.CreateClassAsync(schoolClass);

        return new ClassResponseDto
        {
            Id = createdClass.Id,
            Name = createdClass.Name,
            TotalSeats = createdClass.TotalSeats
        };
    }
    public async Task<List<ClassDetailResponseDto>> GetAllClassesAsync()
    {
        var classes = await _classRepository.GetAllClassesWithHoldsAsync();
        var now = DateTime.UtcNow;

        return classes.Select(c => MapToDetailDto(c, now)).ToList();
    }

    public async Task<ClassDetailResponseDto?> GetClassByIdAsync(string classId)
    {
        var schoolClass = await _classRepository.GetClassWithHoldsByIdAsync(classId);
        if (schoolClass == null) return null;

        return MapToDetailDto(schoolClass, DateTime.UtcNow);
    }

    private static ClassDetailResponseDto MapToDetailDto(SchoolClass c, DateTime now)
    {
        var heldSeats = c.Holds.Count(h => h.Status == "HELD" && h.ExpiresAt > now);
        var confirmedSeats = c.Holds.Count(h => h.Status == "CONFIRMED");
        var availableSeats = Math.Max(0, c.TotalSeats - (heldSeats + confirmedSeats));

        return new ClassDetailResponseDto
        {
            Id = c.Id,
            Name = c.Name,
            TotalSeats = c.TotalSeats,
            HeldSeats = heldSeats,
            ConfirmedSeats = confirmedSeats,
            AvailableSeats = availableSeats
        };
    }
}