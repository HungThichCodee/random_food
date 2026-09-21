export interface CreateTempUserDto {
  displayName: string;
  gender?: string;
  foodPreferences?: string[];
  desiredFood?: string;
}

export interface TempUserDto {
  id: string;
  sessionToken: string;
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
