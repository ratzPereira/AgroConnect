export interface ChatMessage {
  id: number;
  senderId: number;
  senderName: string;
  content: string;
  sentAt: string;
}

export interface SendMessageRequest {
  content: string;
}
