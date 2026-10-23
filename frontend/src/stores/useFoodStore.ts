import { create } from 'zustand';
import type { FoodResponseDto, FoodRandomRequestDto, FoodSuggestRequestDto } from '../types/food';
import { foodApi } from '../api/foodApi';

let latestWheelRequest = 0;

interface FoodState {
  currentFood: FoodResponseDto | null;
  suggestedFoods: FoodResponseDto[];
  suggestMatchLevel: 'exact' | 'relaxed' | 'dishTypeOnly' | 'empty';
  suggestRelaxed: string[];
  suggestMessage: string;
  wheelFoods: FoodResponseDto[];
  isLoading: boolean;
  error: string | null;
  tagCounts: Record<string, number>;
  
  fetchRandomFood: (request: FoodRandomRequestDto) => Promise<void>;
  fetchSuggestedFoods: (request: FoodSuggestRequestDto) => Promise<void>;
  fetchTagCounts: (request: FoodSuggestRequestDto) => Promise<void>;
  fetchWheelFoods: (category?: string, count?: number) => Promise<void>;
  clearCurrentFood: () => void;
  clearSuggestedFoods: () => void;
}

export const useFoodStore = create<FoodState>((set) => ({
  currentFood: null,
  suggestedFoods: [],
  suggestMatchLevel: 'exact',
  suggestRelaxed: [],
  suggestMessage: '',
  wheelFoods: [],
  isLoading: false,
  error: null,
  tagCounts: {},
  
  fetchRandomFood: async (request: FoodRandomRequestDto) => {
    set({ isLoading: true, error: null });
    try {
      const food = await foodApi.getRandomFood(request);
      set({ currentFood: food, isLoading: false });
    } catch {
      set({ error: 'Không tải được món ăn. Hãy thử lại.', isLoading: false });
    }
  },

  fetchSuggestedFoods: async (request: FoodSuggestRequestDto) => {
    set({ isLoading: true, error: null });
    try {
      const res = await foodApi.suggestFoods(request);
      set({ 
        suggestedFoods: res.items, 
        suggestMatchLevel: res.matchLevel,
        suggestRelaxed: res.relaxed,
        suggestMessage: res.message,
        isLoading: false 
      });
    } catch {
      set({ error: 'Không tải được gợi ý món ăn. Hãy thử lại.', isLoading: false });
    }
  },

  fetchTagCounts: async (request: FoodSuggestRequestDto) => {
    try {
      const counts = await foodApi.getTagCounts(request);
      set({ tagCounts: counts });
    } catch {
      console.error('Could not fetch tag counts');
    }
  },

  fetchWheelFoods: async (category?: string, count?: number) => {
    const requestId = ++latestWheelRequest;
    set({ isLoading: true, error: null, wheelFoods: [] });
    try {
      const foods = await foodApi.getWheelFoods(category, count);
      if (requestId === latestWheelRequest) set({ wheelFoods: foods, isLoading: false });
    } catch {
      if (requestId === latestWheelRequest)
        set({ error: 'Không tải được vòng quay món ăn. Hãy thử lại.', wheelFoods: [], isLoading: false });
    }
  },
  
  clearCurrentFood: () => set({ currentFood: null }),
  clearSuggestedFoods: () => set({ suggestedFoods: [] }),
}));
