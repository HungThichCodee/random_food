using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FoodMatch.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class PreventDuplicatePendingInvitations : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateIndex(
                name: "UX_match_requests_pending_pair",
                table: "match_requests",
                columns: new[] { "FromTempUserId", "ToTempUserId" },
                unique: true,
                filter: "\"Status\" = 'Pending'");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "UX_match_requests_pending_pair",
                table: "match_requests");
        }
    }
}
