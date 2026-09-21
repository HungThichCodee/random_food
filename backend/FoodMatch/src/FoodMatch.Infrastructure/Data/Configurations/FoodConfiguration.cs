using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using FoodMatch.Domain.Entities;

namespace FoodMatch.Infrastructure.Data.Configurations;

public class FoodConfiguration : IEntityTypeConfiguration<Food>
{
    public void Configure(EntityTypeBuilder<Food> builder)
    {
        builder.ToTable("foods");
        builder.HasKey(f => f.Id);
        builder.Property(f => f.Name).IsRequired().HasMaxLength(200);

        // Relationships
        builder.HasMany(f => f.FoodFoodTags)
               .WithOne(fft => fft.Food)
               .HasForeignKey(fft => fft.FoodId);

        builder.HasMany(f => f.SuggestionLogs)
               .WithOne(sl => sl.Food)
               .HasForeignKey(sl => sl.FoodId);
    }
}
