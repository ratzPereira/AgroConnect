import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getProviderReviews } from '@/api/reviews';
import { ReviewCard } from './ReviewCard';
import { Button } from '@/components/ui/Button';
import { Loader2 } from 'lucide-react';

interface ReviewListProps {
  readonly providerId: number;
}

export function ReviewList({ providerId }: ReviewListProps) {
  const [page, setPage] = useState(0);
  const pageSize = 10;

  const { data, isLoading } = useQuery({
    queryKey: ['provider-reviews', providerId, page],
    queryFn: () => getProviderReviews(providerId, page, pageSize),
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-6">
        <Loader2 className="h-5 w-5 animate-spin text-neutral-400" />
      </div>
    );
  }

  if (!data || data.content.length === 0) {
    return (
      <p className="text-sm text-neutral-500 text-center py-6">
        Este prestador ainda não tem avaliações.
      </p>
    );
  }

  return (
    <div>
      <div className="space-y-3">
        {data.content.map((review) => (
          <ReviewCard key={review.id} review={review} />
        ))}
      </div>
      {data.totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          <Button
            variant="outline"
            size="sm"
            disabled={data.first}
            onClick={() => setPage((p) => p - 1)}
          >
            Anterior
          </Button>
          <span className="inline-flex items-center text-sm text-neutral-500">
            {data.number + 1} / {data.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={data.last}
            onClick={() => setPage((p) => p + 1)}
          >
            Seguinte
          </Button>
        </div>
      )}
    </div>
  );
}
