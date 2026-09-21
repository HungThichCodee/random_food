import apiClient from './axiosClient';
import type { FoodDto, FoodCriteriaDto } from '../types/food';

// TODO: Implement API calls
export const foodApi = {
  getRandomFood: async (): Promise<FoodDto> => {
    throw new Error('Not implemented');
  },
  getRandomFoodByCategory: async (category: string): Promise<FoodDto> => {
    throw new Error('Not implemented');
  },
  suggestByCriteria: async (criteria: FoodCriteriaDto): Promise<FoodDto[]> => {
    throw new Error('Not implemented');
  },
  getAllTags: async (): Promise<string[]> => {
    throw new Error('Not implemented');
  },
};
