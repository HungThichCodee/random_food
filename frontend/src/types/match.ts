export interface MatchRequestDto {
  id: number;
  fromUserId: string;
  fromUserName: string;
  toUserId: string;
  toUserName: string;
  status: string;
  createdAt: string;
}

export interface CreateMatchRequestDto {
  toTempUserId: string;
}
