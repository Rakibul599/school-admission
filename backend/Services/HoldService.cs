using backend.DTOs;
using backend.Repositories;

namespace backend.Services;

public class HoldService : IHoldService
{
    private readonly IHoldRepository _holdRepository;
    private readonly IConfiguration _configuration;

    public HoldService(IHoldRepository holdRepository, IConfiguration configuration)
    {
        _holdRepository = holdRepository;
        _configuration = configuration;
    }

    public async Task<HoldSeatResult> HoldSeatAsync(string classId, string studentId)
    {
        if (string.IsNullOrWhiteSpace(studentId) || studentId.Trim().Length != 17 || !studentId.All(char.IsDigit))
        {
            return new HoldSeatResult
            {
                Success = false,
                ErrorCode = "INVALID_STUDENT_ID",
                ErrorMessage = "A valid 17-digit birth registration number is required."
            };
        }

        var durationEnv = Environment.GetEnvironmentVariable("HOLD_DURATION_SECONDS")
                          ?? _configuration["HOLD_DURATION_SECONDS"];

        if (!int.TryParse(durationEnv, out var durationSeconds) || durationSeconds <= 0)
        {
            durationSeconds = 600;
        }

        try
        {
            return await _holdRepository.TryHoldSeatAsync(classId, studentId.Trim(), durationSeconds);
        }
        catch (Exception ex)
        {
            return new HoldSeatResult
            {
                Success = false,
                ErrorCode = "INTERNAL_ERROR",
                ErrorMessage = ex.Message
            };
        }
    }
}