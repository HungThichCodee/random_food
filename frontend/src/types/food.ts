export interface FoodResponseDto {
  id: number;
  name: string;
  category: string;
  cuisineType: string;
  avgPriceRange: string;
  mealTime: string;
  tags: string[];
}

export interface SuggestResponseDto {
  items: FoodResponseDto[];
  matchLevel: 'exact' | 'relaxed' | 'dishTypeOnly' | 'empty';
  relaxed: string[];
  message: string;
}

export interface FoodRandomRequestDto {
  category?: string;
  sessionId: string;
}

export interface FoodSuggestRequestDto {
  sessionId: string;
  mealTimes?: string[];
  priceRange?: string;
  category?: string;
  includedTags?: string[];
  excludedTags?: string[];
}
