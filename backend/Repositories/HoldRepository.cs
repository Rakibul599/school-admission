using backend.Data;
using backend.Models;
using Microsoft.EntityFrameworkCore;

namespace backend.Repositories;

public class HoldRepository : IHoldRepository
{
    private readonly AppDbContext _context;

    public HoldRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<Hold> CreateHoldAsync(Hold hold)
    {
        await _context.Holds.AddAsync(hold);
        await _context.SaveChangesAsync();
        return hold;
    }

    public async Task<bool> HasActiveHoldOrConfirmationAsync(string classId, string studentId, DateTime now)
    {
        return await _context.Holds.AnyAsync(h =>
            h.ClassId == classId &&
            h.StudentId == studentId &&
            (h.Status == "CONFIRMED" || (h.Status == "HELD" && h.ExpiresAt > now)));
    }

    public async Task<HoldSeatResult> TryHoldSeatAsync(string classId, string studentId, int durationSeconds)
    {
        var now = DateTime.UtcNow;

        // Isolated database transaction with row-level lock
        await using var transaction = await _context.Database.BeginTransactionAsync();

        // 1. Lock the class row using raw SQL (SELECT FOR UPDATE) to prevent race conditions
        var schoolClass = await _context.SchoolClasses
            .FromSqlRaw("SELECT * FROM \"SchoolClasses\" WHERE \"Id\" = {0} FOR UPDATE", classId)
            .FirstOrDefaultAsync();

        if (schoolClass == null)
        {
            return new HoldSeatResult
            {
                Success = false,
                ErrorCode = "CLASS_NOT_FOUND",
                ErrorMessage = $"Class with id '{classId}' does not exist."
            };
        }

        // 2. Check if student already has active hold or confirmation in this class
        var alreadyApplied = await _context.Holds.AnyAsync(h =>
            h.ClassId == classId &&
            h.StudentId == studentId &&
            (h.Status == "CONFIRMED" || (h.Status == "HELD" && h.ExpiresAt > now)));

        if (alreadyApplied)
        {
            return new HoldSeatResult
            {
                Success = false,
                ErrorCode = "ALREADY_APPLIED",
                ErrorMessage = "Student already has an active hold or confirmed admission in this class."
            };
        }

        // 3. Calculate occupied seats
        var heldSeats = await _context.Holds.CountAsync(h =>
            h.ClassId == classId &&
            h.Status == "HELD" &&
            h.ExpiresAt > now);

        var confirmedSeats = await _context.Holds.CountAsync(h =>
            h.ClassId == classId &&
            h.Status == "CONFIRMED");

        if (heldSeats + confirmedSeats >= schoolClass.TotalSeats)
        {
            return new HoldSeatResult
            {
                Success = false,
                ErrorCode = "NO_SEATS",
                ErrorMessage = "No seats available in this class."
            };
        }

        // 4. Create new hold
        var newHold = new Hold
        {
            Id = $"h_{Guid.NewGuid().ToString("N")[..8]}",
            ClassId = classId,
            StudentId = studentId,
            Status = "HELD",
            CreatedAt = now,
            ExpiresAt = now.AddSeconds(durationSeconds)
        };

        await _context.Holds.AddAsync(newHold);
        await _context.SaveChangesAsync();
        await transaction.CommitAsync();

        return new HoldSeatResult
        {
            Success = true,
            Hold = newHold
        };
    }
}