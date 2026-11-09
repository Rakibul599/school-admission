using backend.DTOs;

namespace backend.Services;

public interface IClassService
{
    Task<ClassResponseDto> CreateClassAsync(CreateClassRequestDto request);
    Task<List<ClassDetailResponseDto>> GetAllClassesAsync();
    Task<ClassDetailResponseDto?> GetClassByIdAsync(string classId);
}