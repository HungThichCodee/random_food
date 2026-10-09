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
}

export interface CreateMatchRequestDto {
  toTempUserId: string;
}
