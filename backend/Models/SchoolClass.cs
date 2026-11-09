namespace backend.Models;

public class SchoolClass
{
    public string Id {get;set;}=Guid.NewGuid().ToString();
    public string Name {get;set;}=string.Empty;
    public int TotalSeats {get;set;}
    public DateTime CreatedAt {get;set;}=DateTime.UtcNow;
    public ICollection<Hold> Holds {get;set;}=new List<Hold>();
}