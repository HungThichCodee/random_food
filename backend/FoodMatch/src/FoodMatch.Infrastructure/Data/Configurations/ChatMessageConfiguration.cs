using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using FoodMatch.Domain.Entities;

namespace FoodMatch.Infrastructure.Data.Configurations;

public class ChatMessageConfiguration : IEntityTypeConfiguration<ChatMessage>
{
    public void Configure(EntityTypeBuilder<ChatMessage> builder)
    {
        builder.ToTable("chat_messages");
        builder.HasKey(c => c.Id);
        builder.Property(c => c.Message).IsRequired().HasMaxLength(1000);

        builder.HasOne(c => c.MatchRequest)
               .WithMany(m => m.ChatMessages)
               .HasForeignKey(c => c.MatchRequestId)
               .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(c => c.SenderTempUser)
               .WithMany(u => u.ChatMessages)
               .HasForeignKey(c => c.SenderTempUserId)
               .OnDelete(DeleteBehavior.Restrict);
    }
}
