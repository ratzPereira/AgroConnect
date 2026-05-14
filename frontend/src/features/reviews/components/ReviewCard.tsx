import { Card, CardBody } from '@/components/ui/Card';
import { Star } from 'lucide-react';
import { format } from 'date-fns';
import type { Review } from '@/types/review';

interface ReviewCardProps {
  readonly review: Review;
}

export function ReviewCard({ review }: ReviewCardProps) {
  return (
    <Card>
      <CardBody>
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-semibold text-neutral-900">{review.authorName}</span>
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((value) => (
                  <Star
                    key={value}
                    className={`h-3.5 w-3.5 ${
                      value <= review.rating
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-neutral-300'
                    }`}
                  />
                ))}
              </div>
            </div>
            <p className="text-sm text-neutral-600">{review.comment}</p>
          </div>
          <span className="text-xs text-neutral-400 shrink-0">
            {format(new Date(review.createdAt), 'dd/MM/yyyy')}
          </span>
        </div>
      </CardBody>
    </Card>
  );
}
