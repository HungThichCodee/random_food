namespace FoodMatch.Application.DTOs.TempUser;

/// <summary>
/// DTO for updating the geographic location of a temporary user.
/// </summary>
public class UpdateLocationDto
{
    public double Lat { get; set; }
    public double Lng { get; set; }
}
