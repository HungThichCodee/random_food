using FoodMatch.Infrastructure.Data;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

namespace FoodMatch.Infrastructure.Migrations;

[DbContext(typeof(FoodMatchDbContext))]
[Migration("20261019000000_AddLocationSharing")]
public class AddLocationSharing : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        // Existing development databases may already have these columns from the old startup patch.
        migrationBuilder.Sql("ALTER TABLE \"match_requests\" ADD COLUMN IF NOT EXISTS \"FromUserSharedLocation\" boolean NOT NULL DEFAULT FALSE;");
        migrationBuilder.Sql("ALTER TABLE \"match_requests\" ADD COLUMN IF NOT EXISTS \"ToUserSharedLocation\" boolean NOT NULL DEFAULT FALSE;");
        migrationBuilder.Sql("ALTER TABLE \"match_requests\" ADD COLUMN IF NOT EXISTS \"LocationSharedAt\" timestamp with time zone NULL;");
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropColumn(name: "FromUserSharedLocation", table: "match_requests");
        migrationBuilder.DropColumn(name: "ToUserSharedLocation", table: "match_requests");
        migrationBuilder.DropColumn(name: "LocationSharedAt", table: "match_requests");
    }
}
