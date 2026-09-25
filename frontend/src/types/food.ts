export interface FoodResponseDto {
  id: number;
  name: string;
  category: string;
  cuisineType: string;
  avgPriceRange: string;
  mealTime: string;
  tags: string[];
}

export interface FoodRandomRequestDto {
  category?: string;
  sessionId: string;
}

export interface FoodSuggestRequestDto {
  sessionId: string;
  mealTime?: string;
  priceRange?: string;
  includedTags?: string[];
  excludedTags?: string[];
}
