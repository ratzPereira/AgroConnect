import { Star, MessageCircle, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardBody } from '@/components/ui/Card';

interface SellerInfoProps {
  sellerId: number;
  sellerName: string;
  sellerRating: number | null;
  sellerListingCount: number;
  onContact: () => void;
}

function renderStars(rating: number): React.ReactNode {
  const stars = [];
  const fullStars = Math.floor(rating);
  const hasHalf = rating - fullStars >= 0.5;

  for (let i = 0; i < 5; i++) {
    if (i < fullStars) {
      stars.push(
        <Star key={i} className="h-4 w-4 fill-warning-400 text-warning-400" />,
      );
    } else if (i === fullStars && hasHalf) {
      stars.push(
        <Star key={i} className="h-4 w-4 fill-warning-400/50 text-warning-400" />,
      );
    } else {
      stars.push(
        <Star key={i} className="h-4 w-4 text-neutral-300" />,
      );
    }
  }

  return <>{stars}</>;
}

export function SellerInfo({
  sellerName,
  sellerRating,
  sellerListingCount,
  onContact,
}: SellerInfoProps) {
  const initials = sellerName
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <Card>
      <CardBody>
        <div className="flex items-center gap-3 mb-4">
          <div className="flex items-center justify-center h-12 w-12 rounded-full bg-primary-100 text-primary-700 font-bold text-sm">
            {initials}
          </div>
          <div>
            <p className="font-semibold text-neutral-900">{sellerName}</p>
            {sellerRating !== null && (
              <div className="flex items-center gap-1 mt-0.5">
                {renderStars(sellerRating)}
                <span className="text-sm text-neutral-500 ml-1">
                  {sellerRating.toFixed(1)}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-sm text-neutral-500 mb-4">
          <ShoppingBag className="h-4 w-4" />
          <span>
            {sellerListingCount} {sellerListingCount === 1 ? 'anúncio' : 'anúncios'}
          </span>
        </div>

        <Button onClick={onContact} className="w-full">
          <MessageCircle className="h-4 w-4" />
          Contactar Vendedor
        </Button>
      </CardBody>
    </Card>
  );
}
