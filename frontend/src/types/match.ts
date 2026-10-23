export interface MatchRequestDto {
  id: number;
  fromUserId: string;
  fromUserName: string;
  toUserId: string;
  toUserName: string;
  status: string;
  createdAt: string;
  hasSharedLocation?: boolean;
  buddyHasSharedLocation?: boolean;
  locationSharedAt?: string;
  buddyLat?: number;
  buddyLng?: number;
  meetingPlace?: MeetingPlaceChoiceDto | null;
}

export interface MeetingPlaceChoiceDto {
  id: string;
  name: string;
  category: string;
  lat?: number | null;
  lng?: number | null;
  googleMapsUrl?: string | null;
  proposedByUserId: string;
  agreedAt?: string | null;
}

export interface CreateMatchRequestDto {
  toTempUserId: string;
}

export interface MeetingPlaceDto {
  id: string;
  name: string;
  category: 'restaurant' | 'cafe' | 'fast_food';
  lat: number;
  lng: number;
  distanceFromMiddleMeters: number;
}

export interface MeetingSuggestionsDto {
  places: MeetingPlaceDto[];
  searchUrl: string;
  providerAvailable: boolean;
  embedUrl: string;
}

export type MeetingSearchKind = 'restaurant' | 'cafe' | 'vegetarian' | 'dessert';
