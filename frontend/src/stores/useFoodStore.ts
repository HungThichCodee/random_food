import { create } from 'zustand';
import type { FoodResponseDto, FoodRandomRequestDto, FoodSuggestRequestDto } from '../types/food';
import { foodApi } from '../api/foodApi';

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
    } catch (err: any) {
      set({ error: err.response?.data?.Error || err.message || 'Failed to fetch random food', isLoading: false });
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
    } catch (err: any) {
      set({ error: err.response?.data?.Error || err.message || 'Failed to suggest foods', isLoading: false });
    }
  },

  fetchTagCounts: async (request: FoodSuggestRequestDto) => {
    try {
      const counts = await foodApi.getTagCounts(request);
      set({ tagCounts: counts });
    } catch (err: any) {
      console.error('Failed to fetch tag counts', err);
    }
  },

  fetchWheelFoods: async (category?: string, count: number = 8) => {
    set({ isLoading: true, error: null });
    try {
      const foods = await foodApi.getWheelFoods(category, count);
      set({ wheelFoods: foods, isLoading: false });
    } catch (err: any) {
      set({ error: err.response?.data?.Error || err.message || 'Failed to fetch wheel foods', isLoading: false });
    }
  },
  
  clearCurrentFood: () => set({ currentFood: null }),
  clearSuggestedFoods: () => set({ suggestedFoods: [] }),
}));
