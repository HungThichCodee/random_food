using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FoodMatch.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddMeetingPlaceChoice : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "MeetingPlaceAgreedAt",
                table: "match_requests",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "MeetingPlaceCategory",
                table: "match_requests",
                type: "character varying(32)",
                maxLength: 32,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "MeetingPlaceId",
                table: "match_requests",
                type: "character varying(64)",
                maxLength: 64,
                nullable: true);

            migrationBuilder.AddColumn<double>(
                name: "MeetingPlaceLat",
                table: "match_requests",
                type: "double precision",
                nullable: true);

            migrationBuilder.AddColumn<double>(
                name: "MeetingPlaceLng",
                table: "match_requests",
                type: "double precision",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "MeetingPlaceName",
                table: "match_requests",
                type: "character varying(120)",
                maxLength: 120,
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "MeetingPlaceProposedBy",
                table: "match_requests",
                type: "uuid",
                nullable: true);

        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "MeetingPlaceAgreedAt",
                table: "match_requests");

            migrationBuilder.DropColumn(
                name: "MeetingPlaceCategory",
                table: "match_requests");

            migrationBuilder.DropColumn(
                name: "MeetingPlaceId",
                table: "match_requests");

            migrationBuilder.DropColumn(
                name: "MeetingPlaceLat",
                table: "match_requests");

            migrationBuilder.DropColumn(
                name: "MeetingPlaceLng",
                table: "match_requests");

            migrationBuilder.DropColumn(
                name: "MeetingPlaceName",
                table: "match_requests");

            migrationBuilder.DropColumn(
                name: "MeetingPlaceProposedBy",
                table: "match_requests");

        }
    }
}
