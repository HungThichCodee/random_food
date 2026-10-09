export interface CreateTempUserDto {
  displayName: string;
  gender?: string;
  foodPreferences?: string[];
  desiredFood?: string;
}

export interface TempUserDto {
  id: string;
  sessionToken: string;
  token: string;
  displayName: string;
  gender?: string;
  foodPreferences: string[];
  desiredFood?: string;
  currentLat?: number;
  currentLng?: number;
  locationVisible: boolean;
  status: string;
  expiresAt: string;
}

export interface NearbyUserDto {
  id: string;
  displayName: string;
  gender?: string;
  desiredFood?: string;
  distanceLabel: string;
}
