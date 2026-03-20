export interface Notification {
  id: number;
  type: string;
  title: string;
  body: string;
  data: string | null;
  read: boolean;
  createdAt: string;
}

export interface UnreadCount {
  count: number;
}
