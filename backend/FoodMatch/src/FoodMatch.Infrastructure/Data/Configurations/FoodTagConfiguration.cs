using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using FoodMatch.Domain.Entities;

namespace FoodMatch.Infrastructure.Data.Configurations;

public class FoodTagConfiguration : IEntityTypeConfiguration<FoodTag>
{
    public void Configure(EntityTypeBuilder<FoodTag> builder)
    {
        builder.ToTable("food_tags");
        builder.HasKey(t => t.Id);
        builder.Property(t => t.Name).IsRequired().HasMaxLength(50);
        builder.HasIndex(t => t.Name).IsUnique();

        builder.HasMany(t => t.FoodFoodTags)
               .WithOne(fft => fft.Tag)
               .HasForeignKey(fft => fft.TagId);
    }
}
