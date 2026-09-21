namespace FoodMatch.Application.DTOs.Report;

/// <summary>
/// DTO for submitting a user report regarding misconduct or policy violation.
/// </summary>
public class CreateReportDto
{
    public Guid ReportedTempUserId { get; set; }
    public string Reason { get; set; } = string.Empty;
    public string? Details { get; set; }
}
