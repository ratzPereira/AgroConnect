export interface Notification {
  id: number;
  type: string;
  title: string;
  body: string;
  data: string | null;
  read: boolean;
  createdAt: string;
  link: string | null;
}

export interface UnreadCount {
  count: number;
}
