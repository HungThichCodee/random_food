using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using FoodMatch.Domain.Entities;

namespace FoodMatch.Infrastructure.Data.Configurations;

public class TempUserConfiguration : IEntityTypeConfiguration<TempUser>
{
    public void Configure(EntityTypeBuilder<TempUser> builder)
    {
        builder.ToTable("temp_users");
        builder.HasKey(u => u.Id);
        builder.Property(u => u.SessionToken).IsRequired().HasMaxLength(255);
        builder.Property(u => u.DisplayName).IsRequired().HasMaxLength(100);

        builder.HasIndex(u => new { u.CurrentLat, u.CurrentLng });
        builder.HasIndex(u => u.SessionToken);
    }
}
