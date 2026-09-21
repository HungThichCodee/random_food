export interface ChatMessageDto {
  id: number;
  senderUserId: string;
  senderName: string;
  message: string;
  sentAt: string;
}

export interface SendMessageDto {
  matchRequestId: number;
  message: string;
}
