export interface RestaurantDto {
  id: number;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  googleMapUrl: string;
  rating: number;
  distance: number;
  isBuffet: boolean;
  isInMall: boolean;
}
