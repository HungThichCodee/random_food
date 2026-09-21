namespace FoodMatch.Domain.Entities;

/// <summary>
/// User report for inappropriate behavior.
/// Maps to the 'user_reports' table.
/// </summary>
public class UserReport
{
    public int Id { get; set; }
    public Guid ReporterTempUserId { get; set; }
    public TempUser ReporterTempUser { get; set; } = null!;
    public Guid ReportedTempUserId { get; set; }
    public TempUser ReportedTempUser { get; set; } = null!;
    public string Reason { get; set; } = string.Empty;
    public string? Details { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
