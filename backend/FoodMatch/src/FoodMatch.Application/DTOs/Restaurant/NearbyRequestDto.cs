using System.ComponentModel.DataAnnotations;

namespace FoodMatch.Application.DTOs.Restaurant
{
    public class NearbyRequestDto
    {
        [Required(ErrorMessage = "Latitude is required")]
        [Range(-90.0, 90.0, ErrorMessage = "Latitude must be between -90 and 90")]
        public double Latitude { get; set; }

        [Required(ErrorMessage = "Longitude is required")]
        [Range(-180.0, 180.0, ErrorMessage = "Longitude must be between -180 and 180")]
        public double Longitude { get; set; }

        [Range(100, 5000, ErrorMessage = "Radius must be between 100 and 5000 meters")]
        public double Radius { get; set; } = 1000;
    }
}
