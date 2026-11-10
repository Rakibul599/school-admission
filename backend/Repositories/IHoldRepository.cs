using backend.Models;

namespace backend.Repositories;

public interface IHoldRepository
{
    Task<Hold> CreateHoldAsync(Hold hold);
    Task<bool> HasActiveHoldOrConfirmationAsync(string classId, string studentId, DateTime now);
    Task<HoldSeatResult> TryHoldSeatAsync(string classId, string studentId, int durationSeconds);
    Task<HoldOperationResult> ConfirmHoldAsync(string holdId, string studentId);
    Task<Hold?> GetHoldByIdAsync(string holdId);
    Task<HoldOperationResult> CancelHoldAsync(string holdId, string studentId);
    Task<Hold?> GetLatestHoldByStudentIdAsync(string studentId);
    Task<int> MarkExpiredHoldsAsync(DateTime now);
}

public class HoldSeatResult
{
    public bool Success { get; set; }
    public string? ErrorCode { get; set; } // "CLASS_NOT_FOUND", "NO_SEATS", "ALREADY_APPLIED"
    public string? ErrorMessage { get; set; }
    public Hold? Hold { get; set; }
}

public class HoldOperationResult
{
    public bool Success { get; set; }
    public string? ErrorCode { get; set; }
    public string? ErrorMessage { get; set; }
    public Hold? Hold { get; set; }
}