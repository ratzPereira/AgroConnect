export interface Review {
  id: number;
  requestId: number;
  authorId: number;
  authorName: string;
  targetId: number;
  targetName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface CreateReviewRequest {
  rating: number;
  comment: string;
}
