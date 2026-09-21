using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using FoodMatch.Domain.Entities;

namespace FoodMatch.Infrastructure.Data.Configurations;

public class UserReportConfiguration : IEntityTypeConfiguration<UserReport>
{
    public void Configure(EntityTypeBuilder<UserReport> builder)
    {
        builder.ToTable("user_reports");
        builder.HasKey(r => r.Id);
        builder.Property(r => r.Reason).IsRequired().HasMaxLength(200);
        builder.Property(r => r.Details).HasMaxLength(1000);

        builder.HasOne(r => r.ReporterTempUser)
               .WithMany()
               .HasForeignKey(r => r.ReporterTempUserId)
               .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(r => r.ReportedTempUser)
               .WithMany()
               .HasForeignKey(r => r.ReportedTempUserId)
               .OnDelete(DeleteBehavior.Restrict);
    }
}
