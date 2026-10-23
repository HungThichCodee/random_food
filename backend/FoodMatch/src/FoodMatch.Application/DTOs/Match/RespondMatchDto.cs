using System.ComponentModel.DataAnnotations;

namespace FoodMatch.Application.DTOs.Match;

/// <summary>
/// DTO for responding to a dining match request.
/// </summary>
public class RespondMatchDto
{
    [Required]
    public bool? Accept { get; set; }
}
