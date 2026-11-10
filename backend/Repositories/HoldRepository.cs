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
            // h.ClassId == classId &&
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

        // Check if student already has active hold or confirmation in this class
        var alreadyApplied = await _context.Holds.AnyAsync(h =>
            // h.ClassId == classId &&
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

        // Calculate occupied seats
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

        // Create new hold
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

    public async Task<HoldOperationResult> ConfirmHoldAsync(string holdId, string studentId)
    {
        var now = DateTime.UtcNow;

        await using var transaction = await _context.Database.BeginTransactionAsync();

        // Fetch hold with row lock to avoid concurrent state changes
        var hold = await _context.Holds
            .FromSqlRaw("SELECT * FROM \"Holds\" WHERE \"Id\" = {0} FOR UPDATE", holdId)
            .FirstOrDefaultAsync();

        if (hold == null)
        {
            return new HoldOperationResult
            {
                Success = false,
                ErrorCode = "HOLD_NOT_FOUND",
                ErrorMessage = $"Hold with id '{holdId}' was not found."
            };
        }

        // Validate ownership
        if (hold.StudentId != studentId)
        {
            return new HoldOperationResult
            {
                Success = false,
                ErrorCode = "STUDENT_MISMATCH",
                ErrorMessage = "Student ID does not match the owner of this hold."
            };
        }

        // Check current status
        if (hold.Status == "CONFIRMED")
        {
            return new HoldOperationResult
            {
                Success = false,
                ErrorCode = "ALREADY_CONFIRMED",
                ErrorMessage = "This hold has already been confirmed."
            };
        }

        if (hold.Status != "HELD")
        {
            return new HoldOperationResult
            {
                Success = false,
                ErrorCode = "INVALID_STATUS",
                ErrorMessage = $"Cannot confirm a hold with status '{hold.Status}'."
            };
        }

        // Check expiration
        if (hold.ExpiresAt <= now)
        {
            hold.Status = "EXPIRED";
            await _context.SaveChangesAsync();
            await transaction.CommitAsync();

            return new HoldOperationResult
            {
                Success = false,
                ErrorCode = "HOLD_EXPIRED",
                ErrorMessage = "This seat hold has expired and cannot be confirmed."
            };
        }

        // Mark as confirmed
        hold.Status = "CONFIRMED";
        await _context.SaveChangesAsync();
        await transaction.CommitAsync();

        return new HoldOperationResult
        {
            Success = true,
            Hold = hold
        };
    }
    public async Task<Hold?> GetHoldByIdAsync(string holdId)
    {
        return await _context.Holds.FirstOrDefaultAsync(h => h.Id == holdId);
    }
    public async Task<HoldOperationResult> CancelHoldAsync(string holdId, string studentId)
    {
        var now = DateTime.UtcNow;

        await using var transaction = await _context.Database.BeginTransactionAsync();

        // Fetch hold with row lock to prevent race conditions during status transitions
        var hold = await _context.Holds
            .FromSqlRaw("SELECT * FROM \"Holds\" WHERE \"Id\" = {0} FOR UPDATE", holdId)
            .FirstOrDefaultAsync();

        if (hold == null)
        {
            return new HoldOperationResult
            {
                Success = false,
                ErrorCode = "HOLD_NOT_FOUND",
                ErrorMessage = $"Hold with id '{holdId}' was not found."
            };
        }

        // Validate ownership: only the student who created the hold can cancel it
        if (hold.StudentId != studentId)
        {
            return new HoldOperationResult
            {
                Success = false,
                ErrorCode = "STUDENT_MISMATCH",
                ErrorMessage = "You can only cancel your own hold."
            };
        }

        // Prevent cancellation if the seat is already confirmed
        if (hold.Status == "CONFIRMED")
        {
            return new HoldOperationResult
            {
                Success = false,
                ErrorCode = "ALREADY_CONFIRMED",
                ErrorMessage = "Confirmed admissions cannot be cancelled."
            };
        }

        // Validate current status
        if (hold.Status != "HELD")
        {
            return new HoldOperationResult
            {
                Success = false,
                ErrorCode = "INVALID_STATUS",
                ErrorMessage = $"Cannot cancel a hold with status '{hold.Status}'."
            };
        }

        // Check if the hold has already expired
        if (hold.ExpiresAt <= now)
        {
            hold.Status = "EXPIRED";
            await _context.SaveChangesAsync();
            await transaction.CommitAsync();

            return new HoldOperationResult
            {
                Success = false,
                ErrorCode = "HOLD_EXPIRED",
                ErrorMessage = "This hold has already expired."
            };
        }

        // Transition status to CANCELLED to immediately release the seat
        hold.Status = "CANCELLED";
        await _context.SaveChangesAsync();
        await transaction.CommitAsync();

        return new HoldOperationResult
        {
            Success = true,
            Hold = hold
        };
    }
    public async Task<Hold?> GetLatestHoldByStudentIdAsync(string studentId)
    {
        // Get the student's most recent hold record ordered by creation date
        return await _context.Holds
            .Where(h => h.StudentId == studentId)
            .OrderByDescending(h => h.CreatedAt)
            .FirstOrDefaultAsync();
    }

    public async Task<int> MarkExpiredHoldsAsync(DateTime now)
{
    // Directly batch update all expired holds in the database without loading them into memory
    return await _context.Holds
        .Where(h => h.Status == "HELD" && h.ExpiresAt <= now)
        .ExecuteUpdateAsync(setters => setters.SetProperty(h => h.Status, "EXPIRED"));
}
}