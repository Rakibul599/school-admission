using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models;

public class Hold
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    
    public string ClassId { get; set; } = string.Empty;

    [ForeignKey(nameof(ClassId))]
    public SchoolClass? SchoolClass { get; set; }

    public string StudentId { get; set; } = string.Empty;
    public string Status { get; set; } = "HELD"; // HELD, CONFIRMED, CANCELLED, EXPIRED
    public DateTime ExpiresAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}