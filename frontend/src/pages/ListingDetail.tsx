import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getListingById, markListingSold, removeListing, toggleFavorite } from '@/api/listings';
import { useAuthStore } from '@/stores/authStore';
import { AnimatedPage } from '@/components/AnimatedPage';
import { ListingPhotoGallery } from '@/features/listings/components/ListingPhotoGallery';
import { SellerInfo } from '@/features/listings/components/SellerInfo';
import { ListingChatPanel } from '@/features/listings/components/ListingChatPanel';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Skeleton } from '@/components/ui/Skeleton';
import {
  ArrowLeft, Heart, Eye, MapPin, Calendar, Tag, Package,
  CheckCircle2, Trash2, Edit,
} from 'lucide-react';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { cn } from '@/utils/cn';
import { toast } from 'sonner';
import type { ListingCategory, ListingCondition, ListingStatus } from '@/types/listing';

const CATEGORY_LABELS: Record<ListingCategory, string> = {
  ANIMALS: 'Animais',
  PLANTS: 'Plantas',
  SEEDS: 'Sementes',
  PRODUCE: 'Produção',
  EQUIPMENT: 'Equipamento',
};

const CONDITION_LABELS: Record<ListingCondition, string> = {
  NEW: 'Novo',
  USED: 'Usado',
  LIKE_NEW: 'Semi-novo',
};

const STATUS_LABELS: Record<ListingStatus, string> = {
  DRAFT: 'Rascunho',
  ACTIVE: 'Ativo',
  SOLD: 'Vendido',
  EXPIRED: 'Expirado',
  REMOVED: 'Removido',
};

const STATUS_BADGE_VARIANTS: Record<ListingStatus, 'default' | 'success' | 'warning' | 'danger' | 'neutral'> = {
  DRAFT: 'neutral',
  ACTIVE: 'success',
  SOLD: 'default',
  EXPIRED: 'warning',
  REMOVED: 'danger',
};

const pinSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="42" viewBox="0 0 28 42">
  <path d="M14 0C6.268 0 0 6.268 0 14c0 10.5 14 28 14 28s14-17.5 14-28C28 6.268 21.732 0 14 0z" fill="#3DA63D" stroke="white" stroke-width="1.5"/>
  <circle cx="14" cy="14" r="6" fill="white"/>
</svg>`;

const markerIcon = L.divIcon({
  html: pinSvg,
  className: '',
  iconSize: [28, 42],
  iconAnchor: [14, 42],
});

function formatPrice(price: number): string {
  return new Intl.NumberFormat('pt-PT', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(price);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('pt-PT', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function ListingDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [chatOpen, setChatOpen] = useState(false);
  const [confirmSoldOpen, setConfirmSoldOpen] = useState(false);
  const [confirmRemoveOpen, setConfirmRemoveOpen] = useState(false);

  const listingId = Number(id);

  const { data: listing, isLoading } = useQuery({
    queryKey: ['listing', listingId],
    queryFn: () => getListingById(listingId),
    enabled: !Number.isNaN(listingId),
  });

  const favoriteMut = useMutation({
    mutationFn: () => toggleFavorite(listingId),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['listing', listingId] });
      toast.success(result.favorited ? 'Adicionado aos favoritos' : 'Removido dos favoritos');
    },
  });

  const soldMut = useMutation({
    mutationFn: () => markListingSold(listingId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['listing', listingId] });
      setConfirmSoldOpen(false);
      toast.success('Anúncio marcado como vendido');
    },
  });

  const removeMut = useMutation({
    mutationFn: () => removeListing(listingId),
    onSuccess: () => {
      toast.success('Anúncio removido');
      navigate('/marketplace/me');
    },
  });

  const isOwner = listing && user?.id === listing.sellerId;

  if (isLoading) {
    return (
      <AnimatedPage>
        <button
          onClick={() => navigate('/marketplace')}
          className="inline-flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-700 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </button>
        <Skeleton className="aspect-[16/9] w-full rounded-xl mb-4" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <Skeleton.Line className="h-8 w-3/4" />
            <Skeleton.Line className="h-10 w-32" />
            <Skeleton.Line className="h-4 w-full" />
            <Skeleton.Line className="h-4 w-full" />
            <Skeleton.Line className="h-4 w-2/3" />
          </div>
          <div>
            <Skeleton.Card />
          </div>
        </div>
      </AnimatedPage>
    );
  }

  if (!listing) {
    return (
      <AnimatedPage>
        <button
          onClick={() => navigate('/marketplace')}
          className="inline-flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-700 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </button>
        <div className="text-center py-16">
          <p className="text-neutral-500">Anúncio não encontrado.</p>
        </div>
      </AnimatedPage>
    );
  }

  return (
    <AnimatedPage>
      {/* Back button */}
      <button
        onClick={() => navigate('/marketplace')}
        className="inline-flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-700 mb-4"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar ao Marketplace
      </button>

      {/* Photo gallery */}
      <div className="mb-6">
        <ListingPhotoGallery photos={listing.photoUrls} />
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column — main content */}
        <div className="lg:col-span-2">
          {/* Status badge for non-active listings */}
          {listing.status !== 'ACTIVE' && (
            <div className="mb-3">
              <Badge variant={STATUS_BADGE_VARIANTS[listing.status]} dot>
                {STATUS_LABELS[listing.status]}
              </Badge>
            </div>
          )}

          {/* Title */}
          <h1 className="text-2xl font-bold text-neutral-900 mb-2">
            {listing.title}
          </h1>

          {/* Price row */}
          <div className="flex items-center gap-3 mb-4">
            {listing.price !== null ? (
              <span className="text-3xl font-bold text-neutral-900">
                {formatPrice(listing.price)}
              </span>
            ) : (
              <span className="text-xl italic text-neutral-500">Preço sob consulta</span>
            )}
            {listing.priceNegotiable && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-warning-100 text-warning-700">
                Negociável
              </span>
            )}
          </div>

          {/* Badges row */}
          <div className="flex flex-wrap gap-2 mb-6">
            <Badge variant="default">
              <Tag className="h-3 w-3" />
              {CATEGORY_LABELS[listing.category]}
            </Badge>
            {listing.condition && (
              <Badge variant="neutral">
                {CONDITION_LABELS[listing.condition]}
              </Badge>
            )}
            {listing.quantity !== null && listing.unit && (
              <Badge variant="neutral">
                <Package className="h-3 w-3" />
                {listing.quantity} {listing.unit}
              </Badge>
            )}
          </div>

          {/* Description */}
          <div className="mb-6">
            <h2 className="text-sm font-semibold text-neutral-700 mb-2">Descrição</h2>
            <p className="text-sm text-neutral-600 whitespace-pre-wrap leading-relaxed">
              {listing.description}
            </p>
          </div>

          {/* Meta info */}
          <div className="flex flex-wrap gap-4 text-sm text-neutral-500 mb-6">
            <span className="flex items-center gap-1">
              <Eye className="h-4 w-4" />
              {listing.viewsCount} {listing.viewsCount === 1 ? 'visualização' : 'visualizações'}
            </span>
            <span className="flex items-center gap-1">
              <Heart className="h-4 w-4" />
              {listing.favoriteCount} {listing.favoriteCount === 1 ? 'favorito' : 'favoritos'}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {formatDate(listing.createdAt)}
            </span>
          </div>

          {/* Actions for owner */}
          {isOwner && listing.status === 'ACTIVE' && (
            <div className="flex flex-wrap gap-3 mb-6 p-4 rounded-xl bg-neutral-50 border border-neutral-200">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(`/marketplace/${listing.id}`)}
              >
                <Edit className="h-4 w-4" />
                Editar
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setConfirmSoldOpen(true)}
              >
                <CheckCircle2 className="h-4 w-4" />
                Marcar como Vendido
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={() => setConfirmRemoveOpen(true)}
              >
                <Trash2 className="h-4 w-4" />
                Remover
              </Button>
            </div>
          )}

          {/* Favorite + Contact for non-owners */}
          {!isOwner && listing.status === 'ACTIVE' && (
            <div className="flex gap-3 mb-6">
              <Button
                variant={listing.favorited ? 'primary' : 'outline'}
                onClick={() => favoriteMut.mutate()}
                loading={favoriteMut.isPending}
              >
                <Heart
                  className={cn(
                    'h-4 w-4',
                    listing.favorited && 'fill-current',
                  )}
                />
                {listing.favorited ? 'Favoritado' : 'Favoritar'}
              </Button>
              <Button onClick={() => setChatOpen(true)}>
                Contactar Vendedor
              </Button>
            </div>
          )}
        </div>

        {/* Right column — sidebar */}
        <div className="space-y-4">
          {/* Seller info */}
          {!isOwner && (
            <SellerInfo
              sellerId={listing.sellerId}
              sellerName={listing.sellerName}
              sellerRating={listing.sellerRating}
              sellerListingCount={listing.sellerListingCount}
              onContact={() => setChatOpen(true)}
            />
          )}

          {/* Mini map */}
          <div className="rounded-xl overflow-hidden border border-neutral-200" style={{ height: 200 }}>
            <MapContainer
              center={[listing.latitude, listing.longitude]}
              zoom={12}
              style={{ height: '100%', width: '100%' }}
              scrollWheelZoom={false}
              dragging={false}
              zoomControl={false}
            >
              <TileLayer
                attribution='&copy; <a href="https://carto.com">CARTO</a>'
                url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
              />
              <Marker position={[listing.latitude, listing.longitude]} icon={markerIcon} />
            </MapContainer>
          </div>

          {/* Location details */}
          <div className="bg-white rounded-xl border border-neutral-200 p-4">
            <div className="flex items-start gap-2">
              <MapPin className="h-4 w-4 text-neutral-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-neutral-900">
                  {listing.island}
                </p>
                {listing.municipality && (
                  <p className="text-sm text-neutral-500">
                    {listing.municipality}
                    {listing.parish ? `, ${listing.parish}` : ''}
                  </p>
                )}
                {listing.locationName && (
                  <p className="text-xs text-neutral-400 mt-0.5">{listing.locationName}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Chat panel */}
      <ListingChatPanel
        listingId={listingId}
        sellerId={listing.sellerId}
        open={chatOpen}
        onClose={() => setChatOpen(false)}
      />

      {/* Confirm sold modal */}
      <Modal open={confirmSoldOpen} onClose={() => setConfirmSoldOpen(false)} title="Marcar como Vendido" size="sm">
        <p className="text-sm text-neutral-600 mb-6">
          Tem a certeza que pretende marcar este anúncio como vendido? Esta ação não pode ser revertida.
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => setConfirmSoldOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={() => soldMut.mutate()} loading={soldMut.isPending}>
            <CheckCircle2 className="h-4 w-4" />
            Confirmar Venda
          </Button>
        </div>
      </Modal>

      {/* Confirm remove modal */}
      <Modal open={confirmRemoveOpen} onClose={() => setConfirmRemoveOpen(false)} title="Remover Anúncio" size="sm">
        <p className="text-sm text-neutral-600 mb-6">
          Tem a certeza que pretende remover este anúncio? Esta ação não pode ser revertida.
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => setConfirmRemoveOpen(false)}>
            Cancelar
          </Button>
          <Button variant="danger" onClick={() => removeMut.mutate()} loading={removeMut.isPending}>
            <Trash2 className="h-4 w-4" />
            Remover
          </Button>
        </div>
      </Modal>
    </AnimatedPage>
  );
}
