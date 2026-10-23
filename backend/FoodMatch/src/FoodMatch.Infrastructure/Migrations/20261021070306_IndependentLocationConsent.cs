using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FoodMatch.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class IndependentLocationConsent : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "FromUserSharedAt",
                table: "match_requests",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "ToUserSharedAt",
                table: "match_requests",
                type: "timestamp with time zone",
                nullable: true);

            // Existing mutual consent keeps its original expiry. Any other legacy
            // state has no reliable per-person timestamp and requires fresh consent.
            migrationBuilder.Sql("""
                UPDATE "match_requests"
                SET "FromUserSharedAt" = "LocationSharedAt",
                    "ToUserSharedAt" = "LocationSharedAt"
                WHERE "FromUserSharedLocation" = TRUE
                  AND "ToUserSharedLocation" = TRUE
                  AND "LocationSharedAt" IS NOT NULL;

                UPDATE "match_requests"
                SET "FromUserSharedLocation" = FALSE,
                    "ToUserSharedLocation" = FALSE,
                    "LocationSharedAt" = NULL
                WHERE NOT ("FromUserSharedLocation" = TRUE
                    AND "ToUserSharedLocation" = TRUE
                    AND "LocationSharedAt" IS NOT NULL);
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "FromUserSharedAt",
                table: "match_requests");

            migrationBuilder.DropColumn(
                name: "ToUserSharedAt",
                table: "match_requests");
        }
    }
}
