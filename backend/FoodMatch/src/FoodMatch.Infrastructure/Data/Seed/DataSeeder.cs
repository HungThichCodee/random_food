using FoodMatch.Domain.Entities;
using FoodMatch.Infrastructure.Data;

namespace FoodMatch.Infrastructure.Data.Seed;

/// <summary>
/// Seeds initial data: 50 Vietnamese dishes + food tags.
/// </summary>
public static class DataSeeder
{
    /// <summary>
    /// Seeds food tags and 50 Vietnamese dishes into the database.
    /// Called during application startup or migration.
    /// </summary>
    public static async Task SeedAsync(FoodMatchDbContext context)
    {
        await using var transaction = await context.Database.BeginTransactionAsync();
        // 1. Initial seed for tags and standard foods
        if (!context.Foods.Any())
        {

        // 2. Seed Tags (P3.1)
        var tags = new Dictionary<string, FoodTag>
        {
            {"cay", new FoodTag { Name = "Cay" }},
            {"chay", new FoodTag { Name = "Chay" }},
            {"healthy", new FoodTag { Name = "Healthy" }},
            {"ngot", new FoodTag { Name = "Ngọt" }},
            {"man", new FoodTag { Name = "Mặn" }},
            {"chien", new FoodTag { Name = "Chiên" }},
            {"hap", new FoodTag { Name = "Hấp" }},
            {"nuong", new FoodTag { Name = "Nướng" }},
            {"hai_san", new FoodTag { Name = "Hải Sản" }},
            {"thit", new FoodTag { Name = "Thịt" }},
            {"rau", new FoodTag { Name = "Rau" }},
            {"do_uong", new FoodTag { Name = "Đồ Uống" }}
        };
        var existingTags = context.FoodTags.ToList();
        foreach (var key in tags.Keys.ToArray())
        {
            var existing = existingTags.FirstOrDefault(tag =>
                tag.Name.Equals(tags[key].Name, StringComparison.OrdinalIgnoreCase));
            if (existing != null)
                tags[key] = existing;
            else
                await context.FoodTags.AddAsync(tags[key]);
        }
        await context.SaveChangesAsync();

        // 3. Seed 50 Foods (P3.2 & P3.3)
        var foods = new List<Food>
        {
            CreateFood("Phở Bò", FoodMatch.Domain.Enums.FoodCategory.Nuoc, FoodMatch.Domain.Enums.PriceRange.Vua, FoodMatch.Domain.Enums.MealTime.Sang, tags["man"], tags["thit"]),
            CreateFood("Bún Bò Huế", FoodMatch.Domain.Enums.FoodCategory.Nuoc, FoodMatch.Domain.Enums.PriceRange.Vua, FoodMatch.Domain.Enums.MealTime.Sang, tags["man"], tags["cay"], tags["thit"]),
            CreateFood("Cơm Tấm", FoodMatch.Domain.Enums.FoodCategory.Kho, FoodMatch.Domain.Enums.PriceRange.Vua, FoodMatch.Domain.Enums.MealTime.Trua, tags["man"], tags["nuong"], tags["thit"]),
            CreateFood("Bánh Mì Thịt", FoodMatch.Domain.Enums.FoodCategory.Kho, FoodMatch.Domain.Enums.PriceRange.Re, FoodMatch.Domain.Enums.MealTime.Sang, tags["man"], tags["thit"]),
            CreateFood("Gỏi Cuốn", FoodMatch.Domain.Enums.FoodCategory.Kho, FoodMatch.Domain.Enums.PriceRange.Re, FoodMatch.Domain.Enums.MealTime.Trua, tags["healthy"], tags["rau"], tags["hai_san"], tags["thit"]),
            CreateFood("Bún Chả", FoodMatch.Domain.Enums.FoodCategory.Kho, FoodMatch.Domain.Enums.PriceRange.Vua, FoodMatch.Domain.Enums.MealTime.Trua, tags["man"], tags["nuong"], tags["thit"]),
            CreateFood("Bánh Xèo", FoodMatch.Domain.Enums.FoodCategory.Kho, FoodMatch.Domain.Enums.PriceRange.Vua, FoodMatch.Domain.Enums.MealTime.Toi, tags["man"], tags["chien"], tags["hai_san"]),
            CreateFood("Bún Đậu Mắm Tôm", FoodMatch.Domain.Enums.FoodCategory.Kho, FoodMatch.Domain.Enums.PriceRange.Vua, FoodMatch.Domain.Enums.MealTime.Trua, tags["man"], tags["chien"], tags["thit"]),
            CreateFood("Mì Quảng", FoodMatch.Domain.Enums.FoodCategory.Kho, FoodMatch.Domain.Enums.PriceRange.Vua, FoodMatch.Domain.Enums.MealTime.Trua, tags["man"], tags["thit"], tags["hai_san"]),
            CreateFood("Bún Riêu", FoodMatch.Domain.Enums.FoodCategory.Nuoc, FoodMatch.Domain.Enums.PriceRange.Vua, FoodMatch.Domain.Enums.MealTime.Sang, tags["man"], tags["hai_san"]),
            
            CreateFood("Hủ Tiếu Nam Vang", FoodMatch.Domain.Enums.FoodCategory.Nuoc, FoodMatch.Domain.Enums.PriceRange.Vua, FoodMatch.Domain.Enums.MealTime.Toi, tags["man"], tags["thit"], tags["hai_san"]),
            CreateFood("Cơm Rang Dưa Bò", FoodMatch.Domain.Enums.FoodCategory.Kho, FoodMatch.Domain.Enums.PriceRange.Vua, FoodMatch.Domain.Enums.MealTime.Trua, tags["man"], tags["chien"], tags["thit"]),
            CreateFood("Xôi Xéo", FoodMatch.Domain.Enums.FoodCategory.Kho, FoodMatch.Domain.Enums.PriceRange.Re, FoodMatch.Domain.Enums.MealTime.Sang, tags["man"], tags["chay"]),
            CreateFood("Bánh Canh Cua", FoodMatch.Domain.Enums.FoodCategory.Nuoc, FoodMatch.Domain.Enums.PriceRange.Vua, FoodMatch.Domain.Enums.MealTime.Toi, tags["man"], tags["hai_san"]),
            CreateFood("Bún Thịt Nướng", FoodMatch.Domain.Enums.FoodCategory.Kho, FoodMatch.Domain.Enums.PriceRange.Vua, FoodMatch.Domain.Enums.MealTime.Trua, tags["man"], tags["nuong"], tags["thit"]),
            CreateFood("Bánh Khọt", FoodMatch.Domain.Enums.FoodCategory.Kho, FoodMatch.Domain.Enums.PriceRange.Vua, FoodMatch.Domain.Enums.MealTime.Trua, tags["man"], tags["chien"], tags["hai_san"]),
            CreateFood("Chả Giò (Nem Rán)", FoodMatch.Domain.Enums.FoodCategory.Kho, FoodMatch.Domain.Enums.PriceRange.Re, FoodMatch.Domain.Enums.MealTime.Trua, tags["man"], tags["chien"], tags["thit"]),
            CreateFood("Bánh Bèo", FoodMatch.Domain.Enums.FoodCategory.Kho, FoodMatch.Domain.Enums.PriceRange.Re, FoodMatch.Domain.Enums.MealTime.Trua, tags["man"], tags["hap"]),
            CreateFood("Nem Nướng", FoodMatch.Domain.Enums.FoodCategory.Kho, FoodMatch.Domain.Enums.PriceRange.Vua, FoodMatch.Domain.Enums.MealTime.Toi, tags["man"], tags["nuong"], tags["thit"]),
            CreateFood("Lẩu Thái", FoodMatch.Domain.Enums.FoodCategory.Nuoc, FoodMatch.Domain.Enums.PriceRange.Cao, FoodMatch.Domain.Enums.MealTime.Toi, tags["man"], tags["cay"], tags["hai_san"]),
            
            CreateFood("Lẩu Bò", FoodMatch.Domain.Enums.FoodCategory.Nuoc, FoodMatch.Domain.Enums.PriceRange.Cao, FoodMatch.Domain.Enums.MealTime.Toi, tags["man"], tags["thit"]),
            CreateFood("Lẩu Gà Lá É", FoodMatch.Domain.Enums.FoodCategory.Nuoc, FoodMatch.Domain.Enums.PriceRange.Cao, FoodMatch.Domain.Enums.MealTime.Toi, tags["man"], tags["thit"]),
            CreateFood("Gà Nướng Mối", FoodMatch.Domain.Enums.FoodCategory.Kho, FoodMatch.Domain.Enums.PriceRange.Cao, FoodMatch.Domain.Enums.MealTime.Toi, tags["man"], tags["nuong"], tags["thit"]),
            CreateFood("Cơm Gà Hội An", FoodMatch.Domain.Enums.FoodCategory.Kho, FoodMatch.Domain.Enums.PriceRange.Vua, FoodMatch.Domain.Enums.MealTime.Trua, tags["man"], tags["thit"]),
            CreateFood("Bún Cá", FoodMatch.Domain.Enums.FoodCategory.Nuoc, FoodMatch.Domain.Enums.PriceRange.Vua, FoodMatch.Domain.Enums.MealTime.Sang, tags["man"], tags["hai_san"]),
            CreateFood("Cháo Lòng", FoodMatch.Domain.Enums.FoodCategory.Nuoc, FoodMatch.Domain.Enums.PriceRange.Vua, FoodMatch.Domain.Enums.MealTime.Khuya, tags["man"], tags["thit"]),
            CreateFood("Bún Ốc", FoodMatch.Domain.Enums.FoodCategory.Nuoc, FoodMatch.Domain.Enums.PriceRange.Vua, FoodMatch.Domain.Enums.MealTime.Sang, tags["man"], tags["hai_san"]),
            CreateFood("Bánh Tráng Trộn", FoodMatch.Domain.Enums.FoodCategory.Kho, FoodMatch.Domain.Enums.PriceRange.Re, FoodMatch.Domain.Enums.MealTime.Trua, tags["cay"], tags["man"]),
            CreateFood("Bánh Tráng Nướng", FoodMatch.Domain.Enums.FoodCategory.Kho, FoodMatch.Domain.Enums.PriceRange.Re, FoodMatch.Domain.Enums.MealTime.Toi, tags["nuong"], tags["man"]),
            CreateFood("Chè Khúc Bạch", FoodMatch.Domain.Enums.FoodCategory.Nuoc, FoodMatch.Domain.Enums.PriceRange.Re, FoodMatch.Domain.Enums.MealTime.Trua, tags["ngot"]),
            
            CreateFood("Chè Đậu Đen", FoodMatch.Domain.Enums.FoodCategory.Nuoc, FoodMatch.Domain.Enums.PriceRange.Re, FoodMatch.Domain.Enums.MealTime.Trua, tags["ngot"], tags["chay"]),
            CreateFood("Sinh Tố Bơ", FoodMatch.Domain.Enums.FoodCategory.Nuoc, FoodMatch.Domain.Enums.PriceRange.Re, FoodMatch.Domain.Enums.MealTime.Trua, tags["ngot"], tags["do_uong"], tags["healthy"]),
            CreateFood("Nước Mía", FoodMatch.Domain.Enums.FoodCategory.Nuoc, FoodMatch.Domain.Enums.PriceRange.Re, FoodMatch.Domain.Enums.MealTime.Trua, tags["ngot"], tags["do_uong"], tags["chay"]),
            CreateFood("Cà Phê Sữa Đá", FoodMatch.Domain.Enums.FoodCategory.Nuoc, FoodMatch.Domain.Enums.PriceRange.Re, FoodMatch.Domain.Enums.MealTime.Sang, tags["ngot"], tags["do_uong"]),
            CreateFood("Bò Né", FoodMatch.Domain.Enums.FoodCategory.Kho, FoodMatch.Domain.Enums.PriceRange.Vua, FoodMatch.Domain.Enums.MealTime.Sang, tags["man"], tags["thit"], tags["chien"]),
            CreateFood("Bò Lúc Lắc", FoodMatch.Domain.Enums.FoodCategory.Kho, FoodMatch.Domain.Enums.PriceRange.Vua, FoodMatch.Domain.Enums.MealTime.Trua, tags["man"], tags["thit"]),
            CreateFood("Cơm Niêu", FoodMatch.Domain.Enums.FoodCategory.Kho, FoodMatch.Domain.Enums.PriceRange.Vua, FoodMatch.Domain.Enums.MealTime.Trua, tags["man"], tags["thit"]),
            CreateFood("Bún Mắm", FoodMatch.Domain.Enums.FoodCategory.Nuoc, FoodMatch.Domain.Enums.PriceRange.Vua, FoodMatch.Domain.Enums.MealTime.Trua, tags["man"], tags["hai_san"]),
            CreateFood("Bánh Ướt", FoodMatch.Domain.Enums.FoodCategory.Kho, FoodMatch.Domain.Enums.PriceRange.Re, FoodMatch.Domain.Enums.MealTime.Sang, tags["man"], tags["hap"]),
            CreateFood("Bánh Đúc Nóng", FoodMatch.Domain.Enums.FoodCategory.Kho, FoodMatch.Domain.Enums.PriceRange.Re, FoodMatch.Domain.Enums.MealTime.Trua, tags["man"], tags["thit"]),
            
            CreateFood("Cơm Hến", FoodMatch.Domain.Enums.FoodCategory.Kho, FoodMatch.Domain.Enums.PriceRange.Re, FoodMatch.Domain.Enums.MealTime.Trua, tags["man"], tags["cay"], tags["hai_san"]),
            CreateFood("Bún Hến", FoodMatch.Domain.Enums.FoodCategory.Kho, FoodMatch.Domain.Enums.PriceRange.Re, FoodMatch.Domain.Enums.MealTime.Trua, tags["man"], tags["cay"], tags["hai_san"]),
            CreateFood("Nem Lụi", FoodMatch.Domain.Enums.FoodCategory.Kho, FoodMatch.Domain.Enums.PriceRange.Vua, FoodMatch.Domain.Enums.MealTime.Toi, tags["man"], tags["nuong"], tags["thit"]),
            CreateFood("Bò Kho", FoodMatch.Domain.Enums.FoodCategory.Nuoc, FoodMatch.Domain.Enums.PriceRange.Vua, FoodMatch.Domain.Enums.MealTime.Sang, tags["man"], tags["thit"]),
            CreateFood("Phở Gà", FoodMatch.Domain.Enums.FoodCategory.Nuoc, FoodMatch.Domain.Enums.PriceRange.Vua, FoodMatch.Domain.Enums.MealTime.Sang, tags["man"], tags["thit"]),
            CreateFood("Miến Lươn", FoodMatch.Domain.Enums.FoodCategory.Nuoc, FoodMatch.Domain.Enums.PriceRange.Vua, FoodMatch.Domain.Enums.MealTime.Sang, tags["man"], tags["hai_san"]),
            CreateFood("Cháo Sườn", FoodMatch.Domain.Enums.FoodCategory.Nuoc, FoodMatch.Domain.Enums.PriceRange.Re, FoodMatch.Domain.Enums.MealTime.Trua, tags["man"], tags["thit"]),
            CreateFood("Súp Cua", FoodMatch.Domain.Enums.FoodCategory.Nuoc, FoodMatch.Domain.Enums.PriceRange.Re, FoodMatch.Domain.Enums.MealTime.Trua, tags["man"], tags["hai_san"]),
            CreateFood("Bột Chiên", FoodMatch.Domain.Enums.FoodCategory.Kho, FoodMatch.Domain.Enums.PriceRange.Re, FoodMatch.Domain.Enums.MealTime.Trua, tags["man"], tags["chien"]),
            CreateFood("Cơm Chay", FoodMatch.Domain.Enums.FoodCategory.Kho, FoodMatch.Domain.Enums.PriceRange.Re, FoodMatch.Domain.Enums.MealTime.Trua, tags["chay"], tags["healthy"], tags["rau"])
        };

            await context.Foods.AddRangeAsync(foods);
            await context.SaveChangesAsync();
        }

        // 2. Ensure Rich Vegetarian & Healthy Foods are seeded
        if (!context.Foods.Any(f => f.Name == "Phở Chay Nấm Hương"))
        {
            var dbTags = context.FoodTags.ToList();
            var chayTag = dbTags.FirstOrDefault(t => t.Name == "Chay") ?? new FoodTag { Name = "Chay" };
            var healthyTag = dbTags.FirstOrDefault(t => t.Name == "Healthy") ?? new FoodTag { Name = "Healthy" };
            var rauTag = dbTags.FirstOrDefault(t => t.Name == "Rau") ?? new FoodTag { Name = "Rau" };
            var ngotTag = dbTags.FirstOrDefault(t => t.Name == "Ngọt") ?? new FoodTag { Name = "Ngọt" };

            var newChayFoods = new List<Food>
            {
                CreateFood("Phở Chay Nấm Hương", FoodMatch.Domain.Enums.FoodCategory.Nuoc, FoodMatch.Domain.Enums.PriceRange.Vua, FoodMatch.Domain.Enums.MealTime.Sang, chayTag, healthyTag, rauTag),
                CreateFood("Bún Riêu Chay Đậu Hũ", FoodMatch.Domain.Enums.FoodCategory.Nuoc, FoodMatch.Domain.Enums.PriceRange.Vua, FoodMatch.Domain.Enums.MealTime.Sang, chayTag, healthyTag, rauTag),
                CreateFood("Hủ Tiếu Chay Rau Củ", FoodMatch.Domain.Enums.FoodCategory.Nuoc, FoodMatch.Domain.Enums.PriceRange.Vua, FoodMatch.Domain.Enums.MealTime.Trua, chayTag, healthyTag, rauTag),
                CreateFood("Bún Bò Huế Chay", FoodMatch.Domain.Enums.FoodCategory.Nuoc, FoodMatch.Domain.Enums.PriceRange.Vua, FoodMatch.Domain.Enums.MealTime.Trua, chayTag, healthyTag, rauTag),
                CreateFood("Gỏi Cuốn Chay Nấm", FoodMatch.Domain.Enums.FoodCategory.Kho, FoodMatch.Domain.Enums.PriceRange.Re, FoodMatch.Domain.Enums.MealTime.Trua, chayTag, healthyTag, rauTag),
                CreateFood("Bánh Mì Chay Pâté Nấm", FoodMatch.Domain.Enums.FoodCategory.Kho, FoodMatch.Domain.Enums.PriceRange.Re, FoodMatch.Domain.Enums.MealTime.Sang, chayTag, healthyTag),
                CreateFood("Miến Xào Chay Nấm Đông Cô", FoodMatch.Domain.Enums.FoodCategory.Kho, FoodMatch.Domain.Enums.PriceRange.Vua, FoodMatch.Domain.Enums.MealTime.Trua, chayTag, healthyTag, rauTag),
                CreateFood("Salad Bơ Trái Cây Sốt Mè", FoodMatch.Domain.Enums.FoodCategory.Kho, FoodMatch.Domain.Enums.PriceRange.Vua, FoodMatch.Domain.Enums.MealTime.Trua, chayTag, healthyTag, rauTag),
                CreateFood("Cháo Nấm Tràm Hạt Sen", FoodMatch.Domain.Enums.FoodCategory.Nuoc, FoodMatch.Domain.Enums.PriceRange.Re, FoodMatch.Domain.Enums.MealTime.Trua, chayTag, healthyTag),
                CreateFood("Canh Nấm Đậu Hũ Rong Biển", FoodMatch.Domain.Enums.FoodCategory.Nuoc, FoodMatch.Domain.Enums.PriceRange.Vua, FoodMatch.Domain.Enums.MealTime.Toi, chayTag, healthyTag, rauTag),
                CreateFood("Chè Hạt Sen Long Nhãn", FoodMatch.Domain.Enums.FoodCategory.Nuoc, FoodMatch.Domain.Enums.PriceRange.Re, FoodMatch.Domain.Enums.MealTime.Trua, chayTag, ngotTag),
                CreateFood("Cơm Chiên Chay Dương Châu", FoodMatch.Domain.Enums.FoodCategory.Kho, FoodMatch.Domain.Enums.PriceRange.Vua, FoodMatch.Domain.Enums.MealTime.Trua, chayTag, healthyTag, rauTag)
            };

            await context.Foods.AddRangeAsync(newChayFoods);
            await context.SaveChangesAsync();
        }

        await transaction.CommitAsync();
    }

    private static Food CreateFood(
        string name, 
        FoodMatch.Domain.Enums.FoodCategory category, 
        FoodMatch.Domain.Enums.PriceRange price, 
        FoodMatch.Domain.Enums.MealTime time, 
        params FoodTag[] tags)
    {
        var food = new Food
        {
            Name = name,
            Category = category,
            CuisineType = "Vietnamese",
            AvgPriceRange = price,
            MealTime = time,
            IsActive = true
        };
        
        foreach (var tag in tags)
        {
            food.FoodFoodTags.Add(new FoodFoodTag { Tag = tag });
        }
        
        return food;
    }
}
