namespace backend.DTOs;

public class CreateClassRequestDto
{
    public string Name { get; set; } = string.Empty;
    public int TotalSeats { get; set; }
}