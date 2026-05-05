export type NotificationType =
  | 'NEW_PROPOSAL'
  | 'PROPOSAL_ACCEPTED'
  | 'PROPOSAL_REJECTED'
  | 'EXECUTION_COMPLETED'
  | 'SERVICE_CONFIRMED'
  | 'SERVICE_DISPUTED'
  | 'DISPUTE_RESOLVED'
  | 'NEW_REVIEW'
  | 'NEW_MESSAGE'
  | 'LISTING_MESSAGE'
  | 'LISTING_EXPIRED'
  | 'AUTO_CONFIRMED';

export interface Notification {
  id: number;
  type: NotificationType;
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
