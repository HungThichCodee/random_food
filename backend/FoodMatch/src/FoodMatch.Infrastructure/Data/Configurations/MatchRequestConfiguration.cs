using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using FoodMatch.Domain.Entities;

namespace FoodMatch.Infrastructure.Data.Configurations;

public class MatchRequestConfiguration : IEntityTypeConfiguration<MatchRequest>
{
    public void Configure(EntityTypeBuilder<MatchRequest> builder)
    {
        builder.ToTable("match_requests");
        builder.HasKey(m => m.Id);
        builder.Property(m => m.Status).HasConversion<string>();
        builder.Property(m => m.MeetingPlaceId).HasMaxLength(64);
        builder.Property(m => m.MeetingPlaceName).HasMaxLength(120);
        builder.Property(m => m.MeetingPlaceCategory).HasMaxLength(32);
        builder.Property(m => m.MeetingPlaceGoogleMapsUrl).HasMaxLength(2048);
        builder.Property(m => m.Version).IsRowVersion();
        builder.HasIndex(m => m.FromTempUserId, "IX_match_requests_FromTempUserId");
        builder.HasIndex(m => new { m.FromTempUserId, m.ToTempUserId })
               .IsUnique()
               .HasDatabaseName("UX_match_requests_pending_pair")
               .HasFilter("\"Status\" = 'Pending'");

        builder.HasOne(m => m.FromTempUser)
               .WithMany(u => u.SentMatchRequests)
               .HasForeignKey(m => m.FromTempUserId)
               .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(m => m.ToTempUser)
               .WithMany(u => u.ReceivedMatchRequests)
               .HasForeignKey(m => m.ToTempUserId)
               .OnDelete(DeleteBehavior.Restrict);
    }
}
