using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FoodMatch.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddGoogleMeetingPlaceLink : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "MeetingPlaceGoogleMapsUrl",
                table: "match_requests",
                type: "character varying(2048)",
                maxLength: 2048,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "MeetingPlaceGoogleMapsUrl",
                table: "match_requests");
        }
    }
}
