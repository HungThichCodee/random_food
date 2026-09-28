using System.ComponentModel.DataAnnotations;

namespace FoodMatch.Application.DTOs.TempUser;

/// <summary>
/// DTO for updating the geographic location of a temporary user.
/// </summary>
public class UpdateLocationDto
{
    [Required(ErrorMessage = "Latitude is required.")]
    [Range(-90.0, 90.0, ErrorMessage = "Latitude must be between -90 and 90.")]
    public double Lat { get; set; }

    [Required(ErrorMessage = "Longitude is required.")]
    [Range(-180.0, 180.0, ErrorMessage = "Longitude must be between -180 and 180.")]
    public double Lng { get; set; }
}
