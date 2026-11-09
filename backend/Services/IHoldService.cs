using backend.DTOs;
using backend.Repositories;

namespace backend.Services;

public interface IHoldService
{
    Task<HoldSeatResult> HoldSeatAsync(string classId, string studentId);
}