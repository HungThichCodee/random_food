using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using FoodMatch.Domain.Entities;

namespace FoodMatch.Infrastructure.Data.Configurations;

public class FoodFoodTagConfiguration : IEntityTypeConfiguration<FoodFoodTag>
{
    public void Configure(EntityTypeBuilder<FoodFoodTag> builder)
    {
        builder.ToTable("food_food_tags");
        builder.HasKey(fft => new { fft.FoodId, fft.TagId });

        builder.HasOne(fft => fft.Food)
               .WithMany(f => f.FoodFoodTags)
               .HasForeignKey(fft => fft.FoodId)
               .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(fft => fft.Tag)
               .WithMany(t => t.FoodFoodTags)
               .HasForeignKey(fft => fft.TagId)
               .OnDelete(DeleteBehavior.Cascade);
    }
}
