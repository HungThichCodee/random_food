namespace FoodMatch.Application.DTOs.Restaurant
{
    public class RestaurantResponseDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Address { get; set; } = string.Empty;
        public double Latitude { get; set; }
        public double Longitude { get; set; }
        public string? GoogleMapUrl { get; set; }
        public double Rating { get; set; }
        public double Distance { get; set; } // Calculated distance in meters
        public bool IsBuffet { get; set; }
        public bool IsInMall { get; set; }
    }
}
