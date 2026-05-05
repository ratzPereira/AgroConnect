import type { RequestStatus, Urgency } from './request';

export interface RequestPin {
  id: number;
  latitude: number;
  longitude: number;
  status: RequestStatus;
  title: string;
  categoryName: string;
  urgency: Urgency;
  island: string;
}

export interface ActiveJob {
  executionId: number;
  requestId: number;
  requestTitle: string;
  categoryName: string;
  island: string;
  requestStatus: RequestStatus;
  hasAssignment: boolean;
  hasCheckin: boolean;
}
