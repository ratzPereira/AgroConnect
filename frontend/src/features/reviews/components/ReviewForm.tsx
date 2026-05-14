import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createReview } from '@/api/reviews';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Star, Send } from 'lucide-react';
import { cn } from '@/utils/cn';
import type { CreateReviewRequest } from '@/types/review';

const reviewSchema = z.object({
  rating: z.number().min(1, 'Selecione uma avaliação').max(5),
  comment: z.string().min(10, 'O comentário deve ter pelo menos 10 caracteres'),
});

type ReviewFormData = z.infer<typeof reviewSchema>;

interface ReviewFormProps {
  readonly requestId: number;
}

export function ReviewForm({ requestId }: ReviewFormProps) {
  const queryClient = useQueryClient();
  const [hoverRating, setHoverRating] = useState(0);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
    reset,
  } = useForm<ReviewFormData>({
    resolver: zodResolver(reviewSchema),
    defaultValues: { rating: 0, comment: '' },
  });

  const currentRating = watch('rating');

  const createMutation = useMutation({
    mutationFn: (data: CreateReviewRequest) => createReview(requestId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['request', requestId] });
      queryClient.invalidateQueries({ queryKey: ['request-reviews', requestId] });
      queryClient.invalidateQueries({ queryKey: ['client-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['my-requests'] });
      reset();
    },
  });

  function onSubmit(data: ReviewFormData) {
    createMutation.mutate(data);
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <h2 className="font-semibold text-neutral-900 text-sm">Avaliar Serviço</h2>
      </CardHeader>
      <CardBody>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Star rating */}
          <div className="space-y-1.5">
            <span className="block text-sm font-medium text-neutral-700">Avaliação</span>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  onMouseEnter={() => setHoverRating(value)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setValue('rating', value, { shouldValidate: true })}
                  className="p-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500 rounded"
                >
                  <Star
                    className={cn(
                      'h-7 w-7 transition-colors',
                      (hoverRating || currentRating) >= value
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-neutral-300',
                    )}
                  />
                </button>
              ))}
            </div>
            {/* Hidden input for the rating value */}
            <input type="hidden" {...register('rating', { valueAsNumber: true })} />
            {errors.rating && (
              <p className="text-xs text-red-600">{errors.rating.message}</p>
            )}
          </div>

          {/* Comment */}
          <div className="space-y-1.5">
            <label htmlFor="reviewComment" className="block text-sm font-medium text-neutral-700">
              Comentário
            </label>
            <textarea
              id="reviewComment"
              rows={3}
              placeholder="Descreva a sua experiência com o serviço..."
              className={cn(
                'block w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-offset-1',
                errors.comment
                  ? 'border-red-300 focus:ring-red-500'
                  : 'border-neutral-300 focus:ring-green-500',
              )}
              {...register('comment')}
            />
            {errors.comment && (
              <p className="text-xs text-red-600">{errors.comment.message}</p>
            )}
          </div>

          <div className="flex justify-end">
            <Button type="submit" loading={createMutation.isPending}>
              <Send className="h-4 w-4" />
              Enviar Avaliação
            </Button>
          </div>

          {createMutation.isError && (
            <p className="text-sm text-red-600">
              Erro ao enviar avaliação. Tente novamente.
            </p>
          )}
          {createMutation.isSuccess && (
            <p className="text-sm text-green-700">Avaliação enviada com sucesso.</p>
          )}
        </form>
      </CardBody>
    </Card>
  );
}
