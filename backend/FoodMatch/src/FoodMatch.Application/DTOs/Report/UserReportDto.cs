namespace FoodMatch.Application.DTOs.Report;

/// <summary>
/// Data transfer object for user report records.
/// </summary>
public class UserReportDto
{
    public int Id { get; set; }
    public Guid ReporterUserId { get; set; }
    public Guid ReportedUserId { get; set; }
    public string Reason { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}
