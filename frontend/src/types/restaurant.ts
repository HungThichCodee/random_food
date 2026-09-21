export interface RestaurantDto {
  id: number;
  name: string;
  address?: string;
  lat: number;
  lng: number;
  category?: string;
  isBuffet: boolean;
  isInMall: boolean;
  mallName?: string;
}
