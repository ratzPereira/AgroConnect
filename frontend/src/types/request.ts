export type RequestStatus =
  | 'DRAFT'
  | 'PUBLISHED'
  | 'WITH_PROPOSALS'
  | 'AWARDED'
  | 'IN_PROGRESS'
  | 'AWAITING_CONFIRMATION'
  | 'COMPLETED'
  | 'RATED'
  | 'DISPUTED'
  | 'EXPIRED'
  | 'CANCELLED';

export type Urgency = 'LOW' | 'MEDIUM' | 'HIGH';

export interface RequestPhoto {
  id: number;
  photoUrl: string;
  sortOrder: number;
  uploadedAt: string;
}

export interface ServiceRequestResponse {
  id: number;
  clientId: number;
  clientName: string;
  categoryId: number;
  categoryName: string;
  status: RequestStatus;
  title: string;
  description: string;
  latitude: number;
  longitude: number;
  parish: string;
  municipality: string;
  island: string;
  area: number;
  areaUnit: string;
  urgency: Urgency;
  preferredDateFrom: string | null;
  preferredDateTo: string | null;
  formData: string | null;
  expiresAt: string | null;
  photos: RequestPhoto[];
  proposalCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ServiceRequestSummary {
  id: number;
  categoryName: string;
  status: RequestStatus;
  title: string;
  parish: string;
  municipality: string;
  island: string;
  area: number;
  areaUnit: string;
  urgency: Urgency;
  proposalCount: number;
  createdAt: string;
}

export interface CreateServiceRequestDto {
  categoryId: number;
  title: string;
  description: string;
  latitude: number;
  longitude: number;
  parish?: string;
  municipality?: string;
  island?: string;
  area?: number;
  areaUnit?: string;
  urgency?: Urgency;
  preferredDateFrom?: string;
  preferredDateTo?: string;
  formData?: string;
}

export interface UpdateServiceRequestDto {
  categoryId?: number;
  title?: string;
  description?: string;
  latitude?: number;
  longitude?: number;
  parish?: string;
  municipality?: string;
  island?: string;
  area?: number;
  areaUnit?: string;
  urgency?: Urgency;
  preferredDateFrom?: string;
  preferredDateTo?: string;
  formData?: string;
}

export interface PresignedUrlResponse {
  uploadUrl: string;
  objectKey: string;
  publicUrl: string;
}

export interface Page<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
}
