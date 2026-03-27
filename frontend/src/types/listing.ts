export type ListingCategory = 'ANIMALS' | 'PLANTS' | 'SEEDS' | 'PRODUCE' | 'EQUIPMENT';
export type ListingStatus = 'DRAFT' | 'ACTIVE' | 'SOLD' | 'EXPIRED' | 'REMOVED';
export type ListingCondition = 'NEW' | 'USED' | 'LIKE_NEW';

export interface Listing {
  id: number;
  title: string;
  description: string;
  price: number | null;
  priceNegotiable: boolean;
  category: ListingCategory;
  condition: ListingCondition | null;
  quantity: number | null;
  unit: string | null;
  latitude: number;
  longitude: number;
  locationName: string | null;
  parish: string | null;
  municipality: string | null;
  island: string;
  status: ListingStatus;
  viewsCount: number;
  sellerId: number;
  sellerName: string;
  sellerRating: number | null;
  sellerListingCount: number;
  photoUrls: string[];
  favoriteCount: number;
  favorited: boolean;
  createdAt: string;
  updatedAt: string;
  expiresAt: string | null;
}

export interface ListingSummary {
  id: number;
  title: string;
  price: number | null;
  priceNegotiable: boolean;
  category: ListingCategory;
  condition: ListingCondition | null;
  island: string;
  locationName: string | null;
  latitude: number;
  longitude: number;
  firstPhotoUrl: string | null;
  createdAt: string;
  status: ListingStatus;
  viewsCount: number;
}

export interface ListingConversation {
  id: number;
  listingId: number;
  listingTitle: string;
  listingFirstPhoto: string | null;
  otherPartyId: number;
  otherPartyName: string;
  lastMessage: string | null;
  lastMessageAt: string | null;
  unreadCount: number;
}

export interface ListingMessage {
  id: number;
  senderId: number;
  senderName: string;
  content: string;
  sentAt: string;
  readAt: string | null;
}

export interface ListingStats {
  activeCount: number;
  soldCount: number;
  totalViews: number;
  totalConversations: number;
}

export interface CreateListingDto {
  title: string;
  description: string;
  price: number | null;
  priceNegotiable: boolean;
  category: ListingCategory;
  condition: ListingCondition | null;
  quantity: number | null;
  unit: string | null;
  latitude: number;
  longitude: number;
  locationName: string | null;
  parish: string | null;
  municipality: string | null;
  island: string;
}

export interface UpdateListingDto {
  title?: string;
  description?: string;
  price?: number | null;
  priceNegotiable?: boolean;
  category?: ListingCategory;
  condition?: ListingCondition | null;
  quantity?: number | null;
  unit?: string | null;
  latitude?: number;
  longitude?: number;
  locationName?: string | null;
  parish?: string | null;
  municipality?: string | null;
  island?: string;
}
