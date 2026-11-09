using backend.DTOs;
using backend.Repositories;

namespace backend.Services;

public interface IHoldService
{
    Task<HoldSeatResult> HoldSeatAsync(string classId, string studentId);
    Task<HoldOperationResult> ConfirmHoldAsync(string holdId, string studentId);
    Task<HoldDetailResponseDto?> GetHoldByIdAsync(string holdId);
    Task<HoldOperationResult> CancelHoldAsync(string holdId, string studentId);
    Task<HoldDetailResponseDto?> GetMyHoldAsync(string studentId);
}