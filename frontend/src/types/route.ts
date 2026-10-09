export interface RouteDto {
  distanceKm: number;
  durationMinutes: number;
  coordinates: number[][]; // [lng, lat] pairs
}
