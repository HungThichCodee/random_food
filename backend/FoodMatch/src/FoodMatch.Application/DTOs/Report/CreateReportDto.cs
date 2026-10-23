using System.ComponentModel.DataAnnotations;

namespace FoodMatch.Application.DTOs.Report;

/// <summary>
/// DTO for submitting a user report regarding misconduct or policy violation.
/// </summary>
public class CreateReportDto
{
    public Guid ReportedTempUserId { get; set; }
    [Required]
    [StringLength(200, MinimumLength = 1)]
    public string Reason { get; set; } = string.Empty;
    [StringLength(1000)]
    public string? Details { get; set; }
}
