using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using FoodMatch.Domain.Entities;

namespace FoodMatch.Infrastructure.Data.Configurations;

public class FoodSuggestionLogConfiguration : IEntityTypeConfiguration<FoodSuggestionLog>
{
    public void Configure(EntityTypeBuilder<FoodSuggestionLog> builder)
    {
        builder.ToTable("food_suggestion_logs");
        builder.HasKey(s => s.Id);

        builder.HasOne(s => s.Food)
               .WithMany(f => f.SuggestionLogs)
               .HasForeignKey(s => s.FoodId)
               .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(s => s.TempUser)
               .WithMany(u => u.SuggestionLogs)
               .HasForeignKey(s => s.TempUserId)
               .OnDelete(DeleteBehavior.SetNull);
    }
}
