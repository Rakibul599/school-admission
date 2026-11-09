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
    public async Task<HoldOperationResult> ConfirmHoldAsync(string holdId, string studentId)
    {
        if (string.IsNullOrWhiteSpace(studentId) || studentId.Trim().Length != 17 || !studentId.All(char.IsDigit))
        {
            return new HoldOperationResult
            {
                Success = false,
                ErrorCode = "INVALID_STUDENT_ID",
                ErrorMessage = "A valid 17-digit birth registration number is required."
            };
        }

        try
        {
            return await _holdRepository.ConfirmHoldAsync(holdId, studentId.Trim());
        }
        catch (Exception ex)
        {
            return new HoldOperationResult
            {
                Success = false,
                ErrorCode = "INTERNAL_ERROR",
                ErrorMessage = ex.Message
            };
        }
    }

    public async Task<HoldDetailResponseDto?> GetHoldByIdAsync(string holdId)
    {
        var hold = await _holdRepository.GetHoldByIdAsync(holdId);
        if (hold == null) return null;

        var status = hold.Status;
        if (status == "HELD" && hold.ExpiresAt <= DateTime.UtcNow)
        {
            status = "EXPIRED";
        }

        return new HoldDetailResponseDto
        {
            HoldId = hold.Id,
            ClassId = hold.ClassId,
            Status = status,
            ExpiresAt = hold.ExpiresAt
        };
    }
    public async Task<HoldOperationResult> CancelHoldAsync(string holdId, string studentId)
    {
        // Validate 17-digit student birth registration number
        if (string.IsNullOrWhiteSpace(studentId) || studentId.Trim().Length != 17 || !studentId.All(char.IsDigit))
        {
            return new HoldOperationResult
            {
                Success = false,
                ErrorCode = "INVALID_STUDENT_ID",
                ErrorMessage = "A valid 17-digit birth registration number is required."
            };
        }

        try
        {
            return await _holdRepository.CancelHoldAsync(holdId, studentId.Trim());
        }
        catch (Exception ex)
        {
            return new HoldOperationResult
            {
                Success = false,
                ErrorCode = "INTERNAL_ERROR",
                ErrorMessage = ex.Message
            };
        }
    }

    public async Task<HoldDetailResponseDto?> GetMyHoldAsync(string studentId)
    {
        // Validate 17-digit birth registration number
        if (string.IsNullOrWhiteSpace(studentId) || studentId.Trim().Length != 17 || !studentId.All(char.IsDigit))
        {
            return null;
        }

        var hold = await _holdRepository.GetLatestHoldByStudentIdAsync(studentId.Trim());
        if (hold == null)
        {
            return null;
        }

        var status = hold.Status;
        // Dynamically mark as EXPIRED if past expiration timestamp and still marked HELD
        if (status == "HELD" && hold.ExpiresAt <= DateTime.UtcNow)
        {
            status = "EXPIRED";
        }

        return new HoldDetailResponseDto
        {
            HoldId = hold.Id,
            ClassId = hold.ClassId,
            Status = status,
            ExpiresAt = hold.ExpiresAt
        };
    }
}