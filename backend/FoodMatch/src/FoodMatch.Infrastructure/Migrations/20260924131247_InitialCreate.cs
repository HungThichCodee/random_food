using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace FoodMatch.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "food_tags",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Name = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_food_tags", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "foods",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Category = table.Column<string>(type: "text", nullable: true),
                    CuisineType = table.Column<string>(type: "text", nullable: true),
                    ImageUrl = table.Column<string>(type: "text", nullable: true),
                    AvgPriceRange = table.Column<string>(type: "text", nullable: true),
                    MealTime = table.Column<string>(type: "text", nullable: true),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_foods", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "restaurants",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    ExternalPlaceId = table.Column<string>(type: "text", nullable: true),
                    Name = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    Address = table.Column<string>(type: "text", nullable: true),
                    Lat = table.Column<double>(type: "double precision", nullable: false),
                    Lng = table.Column<double>(type: "double precision", nullable: false),
                    Category = table.Column<string>(type: "text", nullable: true),
                    IsBuffet = table.Column<bool>(type: "boolean", nullable: false),
                    IsInMall = table.Column<bool>(type: "boolean", nullable: false),
                    MallName = table.Column<string>(type: "text", nullable: true),
                    Source = table.Column<string>(type: "text", nullable: false),
                    LastSyncedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_restaurants", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "temp_users",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    SessionToken = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    DisplayName = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Gender = table.Column<string>(type: "text", nullable: true),
                    FoodPreferencesJson = table.Column<string>(type: "text", nullable: true),
                    DesiredFood = table.Column<string>(type: "text", nullable: true),
                    CurrentLat = table.Column<double>(type: "double precision", nullable: true),
                    CurrentLng = table.Column<double>(type: "double precision", nullable: true),
                    LocationVisible = table.Column<bool>(type: "boolean", nullable: false),
                    Status = table.Column<string>(type: "text", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    ExpiresAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_temp_users", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "food_food_tags",
                columns: table => new
                {
                    FoodId = table.Column<int>(type: "integer", nullable: false),
                    TagId = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_food_food_tags", x => new { x.FoodId, x.TagId });
                    table.ForeignKey(
                        name: "FK_food_food_tags_food_tags_TagId",
                        column: x => x.TagId,
                        principalTable: "food_tags",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_food_food_tags_foods_FoodId",
                        column: x => x.FoodId,
                        principalTable: "foods",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "food_suggestion_logs",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    TempUserId = table.Column<Guid>(type: "uuid", nullable: true),
                    FoodId = table.Column<int>(type: "integer", nullable: false),
                    SuggestionType = table.Column<int>(type: "integer", nullable: true),
                    SuggestedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_food_suggestion_logs", x => x.Id);
                    table.ForeignKey(
                        name: "FK_food_suggestion_logs_foods_FoodId",
                        column: x => x.FoodId,
                        principalTable: "foods",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_food_suggestion_logs_temp_users_TempUserId",
                        column: x => x.TempUserId,
                        principalTable: "temp_users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "match_requests",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    FromTempUserId = table.Column<Guid>(type: "uuid", nullable: false),
                    ToTempUserId = table.Column<Guid>(type: "uuid", nullable: false),
                    Status = table.Column<string>(type: "text", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_match_requests", x => x.Id);
                    table.ForeignKey(
                        name: "FK_match_requests_temp_users_FromTempUserId",
                        column: x => x.FromTempUserId,
                        principalTable: "temp_users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_match_requests_temp_users_ToTempUserId",
                        column: x => x.ToTempUserId,
                        principalTable: "temp_users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "user_reports",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    ReporterTempUserId = table.Column<Guid>(type: "uuid", nullable: false),
                    ReportedTempUserId = table.Column<Guid>(type: "uuid", nullable: false),
                    Reason = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Details = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_user_reports", x => x.Id);
                    table.ForeignKey(
                        name: "FK_user_reports_temp_users_ReportedTempUserId",
                        column: x => x.ReportedTempUserId,
                        principalTable: "temp_users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_user_reports_temp_users_ReporterTempUserId",
                        column: x => x.ReporterTempUserId,
                        principalTable: "temp_users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "chat_messages",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    MatchRequestId = table.Column<int>(type: "integer", nullable: false),
                    SenderTempUserId = table.Column<Guid>(type: "uuid", nullable: false),
                    Message = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: false),
                    SentAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_chat_messages", x => x.Id);
                    table.ForeignKey(
                        name: "FK_chat_messages_match_requests_MatchRequestId",
                        column: x => x.MatchRequestId,
                        principalTable: "match_requests",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_chat_messages_temp_users_SenderTempUserId",
                        column: x => x.SenderTempUserId,
                        principalTable: "temp_users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_chat_messages_MatchRequestId",
                table: "chat_messages",
                column: "MatchRequestId");

            migrationBuilder.CreateIndex(
                name: "IX_chat_messages_SenderTempUserId",
                table: "chat_messages",
                column: "SenderTempUserId");

            migrationBuilder.CreateIndex(
                name: "IX_food_food_tags_TagId",
                table: "food_food_tags",
                column: "TagId");

            migrationBuilder.CreateIndex(
                name: "IX_food_suggestion_logs_FoodId",
                table: "food_suggestion_logs",
                column: "FoodId");

            migrationBuilder.CreateIndex(
                name: "IX_food_suggestion_logs_TempUserId",
                table: "food_suggestion_logs",
                column: "TempUserId");

            migrationBuilder.CreateIndex(
                name: "IX_food_tags_Name",
                table: "food_tags",
                column: "Name",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_match_requests_FromTempUserId",
                table: "match_requests",
                column: "FromTempUserId");

            migrationBuilder.CreateIndex(
                name: "IX_match_requests_ToTempUserId",
                table: "match_requests",
                column: "ToTempUserId");

            migrationBuilder.CreateIndex(
                name: "IX_restaurants_Lat_Lng",
                table: "restaurants",
                columns: new[] { "Lat", "Lng" });

            migrationBuilder.CreateIndex(
                name: "IX_temp_users_CurrentLat_CurrentLng",
                table: "temp_users",
                columns: new[] { "CurrentLat", "CurrentLng" });

            migrationBuilder.CreateIndex(
                name: "IX_temp_users_SessionToken",
                table: "temp_users",
                column: "SessionToken");

            migrationBuilder.CreateIndex(
                name: "IX_user_reports_ReportedTempUserId",
                table: "user_reports",
                column: "ReportedTempUserId");

            migrationBuilder.CreateIndex(
                name: "IX_user_reports_ReporterTempUserId",
                table: "user_reports",
                column: "ReporterTempUserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "chat_messages");

            migrationBuilder.DropTable(
                name: "food_food_tags");

            migrationBuilder.DropTable(
                name: "food_suggestion_logs");

            migrationBuilder.DropTable(
                name: "restaurants");

            migrationBuilder.DropTable(
                name: "user_reports");

            migrationBuilder.DropTable(
                name: "match_requests");

            migrationBuilder.DropTable(
                name: "food_tags");

            migrationBuilder.DropTable(
                name: "foods");

            migrationBuilder.DropTable(
                name: "temp_users");
        }
    }
}
