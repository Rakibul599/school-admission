using backend.Models;

namespace backend.Repositories;

public interface IHoldRepository
{
    Task<Hold> CreateHoldAsync(Hold hold);
    Task<bool> HasActiveHoldOrConfirmationAsync(string classId, string studentId, DateTime now);
    Task<HoldSeatResult> TryHoldSeatAsync(string classId, string studentId, int durationSeconds);
}

public class HoldSeatResult
{
    public bool Success { get; set; }
    public string? ErrorCode { get; set; } // "CLASS_NOT_FOUND", "NO_SEATS", "ALREADY_APPLIED"
    public string? ErrorMessage { get; set; }
    public Hold? Hold { get; set; }
}