import apiClient from './axiosClient';
import type { FoodResponseDto, FoodRandomRequestDto, FoodSuggestRequestDto } from '../types/food';

export const foodApi = {
  getRandomFood: async (request: FoodRandomRequestDto): Promise<FoodResponseDto> => {
    const params = new URLSearchParams();
    params.append('sessionId', request.sessionId);
    if (request.category) {
      params.append('category', request.category);
    }
    const response = await apiClient.get<unknown, FoodResponseDto>(`/foods/random?${params.toString()}`);
    return response;
  },
  suggestFoods: async (request: FoodSuggestRequestDto): Promise<FoodResponseDto> => {
    const response = await apiClient.post<unknown, FoodResponseDto>('/foods/suggest', request);
    return response;
  },
};
