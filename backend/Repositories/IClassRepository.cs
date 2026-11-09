using backend.Models;

namespace backend.Repositories;

public interface IClassRepository
{
    Task<SchoolClass> CreateClassAsync(SchoolClass schoolClass);
    Task<SchoolClass?> GetClassByIdAsync(string id);
    Task<bool> ClassExistsByNameAsync(string name);
    Task<List<SchoolClass>> GetAllClassesWithHoldsAsync();
    Task<SchoolClass?> GetClassWithHoldsByIdAsync(string id);
}