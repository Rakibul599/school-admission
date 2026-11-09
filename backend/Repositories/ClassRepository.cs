using backend.Data;
using backend.Models;
using Microsoft.EntityFrameworkCore;

namespace backend.Repositories;

public class ClassRepository : IClassRepository
{
    private readonly AppDbContext _context;

    public ClassRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<SchoolClass> CreateClassAsync(SchoolClass schoolClass)
    {
        await _context.SchoolClasses.AddAsync(schoolClass);
        await _context.SaveChangesAsync();
        return schoolClass;
    }

    public async Task<SchoolClass?> GetClassByIdAsync(string id)
    {
        return await _context.SchoolClasses.FirstOrDefaultAsync(c => c.Id == id);
    }

    public async Task<bool> ClassExistsByNameAsync(string name)
    {
        return await _context.SchoolClasses.AnyAsync(c => c.Name.ToLower() == name.Trim().ToLower());
    }

    public async Task<List<SchoolClass>> GetAllClassesWithHoldsAsync()
    {
        return await _context.SchoolClasses
            .Include(c => c.Holds)
            .OrderBy(c => c.CreatedAt)
            .ToListAsync();
    }

    public async Task<SchoolClass?> GetClassWithHoldsByIdAsync(string id)
    {
        return await _context.SchoolClasses
            .Include(c => c.Holds)
            .FirstOrDefaultAsync(c => c.Id == id);
    }
}