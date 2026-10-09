namespace FoodMatch.Application.DTOs.Food;

public class SuggestResponseDto
{
    public List<FoodResponseDto> Items { get; set; } = new();
    public string MatchLevel { get; set; } = "exact"; // exact, relaxed, dishTypeOnly, empty
    public List<string> Relaxed { get; set; } = new();
    public string Message { get; set; } = string.Empty;
}
