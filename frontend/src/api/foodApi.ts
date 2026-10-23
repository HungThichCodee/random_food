import apiClient from './axiosClient';
import type { FoodResponseDto, FoodRandomRequestDto, FoodSuggestRequestDto, SuggestResponseDto } from '../types/food';

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
  suggestFoods: async (request: FoodSuggestRequestDto): Promise<SuggestResponseDto> => {
    const response = await apiClient.post<unknown, SuggestResponseDto>('/foods/suggest', request);
    return response;
  },
  getTagCounts: async (request: FoodSuggestRequestDto): Promise<Record<string, number>> => {
    const response = await apiClient.post<unknown, Record<string, number>>('/foods/tags-count', request);
    return response;
  },
  getWheelFoods: async (category?: string, count?: number): Promise<FoodResponseDto[]> => {
    const params = new URLSearchParams();
    if (count !== undefined) params.append('count', count.toString());
    if (category) {
      params.append('category', category);
    }
    const response = await apiClient.get<unknown, FoodResponseDto[]>(`/foods/wheel?${params.toString()}`);
    return response;
  },
};
