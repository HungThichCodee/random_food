import { create } from 'zustand';
import type { FoodDto } from '../types/food';

interface FoodState {
  currentFood: FoodDto | null;
  suggestedFoods: FoodDto[];
  tags: string[];
  isLoading: boolean;
  error: string | null;
  // TODO: Add actions
  setCurrentFood: (food: FoodDto | null) => void;
  setSuggestedFoods: (foods: FoodDto[]) => void;
  setTags: (tags: string[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useFoodStore = create<FoodState>((set) => ({
  currentFood: null,
  suggestedFoods: [],
  tags: [],
  isLoading: false,
  error: null,
  setCurrentFood: (food) => set({ currentFood: food }),
  setSuggestedFoods: (foods) => set({ suggestedFoods: foods }),
  setTags: (tags) => set({ tags }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
}));
