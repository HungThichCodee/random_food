export interface FoodDto {
  id: number;
  name: string;
  category?: string;
  cuisineType?: string;
  imageUrl?: string;
  avgPriceRange?: string;
  mealTime?: string;
  tags: string[];
}

export interface FoodCriteriaDto {
  category?: string;
  tags?: string[];
  priceRange?: string;
  mealTime?: string;
  excludeFoodIds?: number[];
}
