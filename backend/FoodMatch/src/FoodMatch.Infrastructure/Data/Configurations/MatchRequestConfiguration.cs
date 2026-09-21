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
