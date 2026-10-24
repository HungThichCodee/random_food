using FoodMatch.Infrastructure.Data;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

namespace FoodMatch.Infrastructure.Migrations;

[DbContext(typeof(FoodMatchDbContext))]
[Migration("20261024000000_RenameGaNuongMuoiOt")]
public class RenameGaNuongMuoiOt : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("UPDATE foods SET \"Name\" = 'Gà Nướng Muối Ớt' WHERE \"Name\" = 'Gà Nướng Mối';");
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("UPDATE foods SET \"Name\" = 'Gà Nướng Mối' WHERE \"Name\" = 'Gà Nướng Muối Ớt';");
    }
}
