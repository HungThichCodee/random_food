import { create } from 'zustand';
import type { FoodResponseDto, FoodRandomRequestDto, FoodSuggestRequestDto } from '../types/food';
import { foodApi } from '../api/foodApi';

interface FoodState {
  currentFood: FoodResponseDto | null;
  suggestedFoods: FoodResponseDto[];
  isLoading: boolean;
  error: string | null;
  
  fetchRandomFood: (request: FoodRandomRequestDto) => Promise<void>;
  fetchSuggestedFoods: (request: FoodSuggestRequestDto) => Promise<void>;
  clearCurrentFood: () => void;
  clearSuggestedFoods: () => void;
}

export const useFoodStore = create<FoodState>((set) => ({
  currentFood: null,
  suggestedFoods: [],
  isLoading: false,
  error: null,
  
  fetchRandomFood: async (request: FoodRandomRequestDto) => {
    set({ isLoading: true, error: null });
    try {
      const food = await foodApi.getRandomFood(request);
      set({ currentFood: food, isLoading: false });
    } catch (err: any) {
      set({ error: err.response?.data?.Error || err.message || 'Failed to fetch random food', isLoading: false });
    }
  },

  fetchSuggestedFoods: async (request: FoodSuggestRequestDto) => {
    set({ isLoading: true, error: null });
    try {
      const food = await foodApi.suggestFoods(request);
      // Wait, suggestFoods currently returns a single FoodResponseDto (the backend PickRandomFood returns one). 
      // So suggestedFoods array should just store the single result or we can keep appending to history.
      // Let's just store the latest result as an array of 1 for now, or update the state properly.
      set({ suggestedFoods: [food], currentFood: food, isLoading: false });
    } catch (err: any) {
      set({ error: err.response?.data?.Error || err.message || 'Failed to suggest foods', isLoading: false });
    }
  },
  
  clearCurrentFood: () => set({ currentFood: null }),
  clearSuggestedFoods: () => set({ suggestedFoods: [] }),
}));
