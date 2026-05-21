import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getListingById, markListingSold, removeListing, toggleFavorite } from '@/api/listings';
import { useAuthStore } from '@/stores/authStore';
import { AnimatedPage } from '@/components/AnimatedPage';
import { ListingPhotoGallery } from '@/features/listings/components/ListingPhotoGallery';
import { ListingChatPanel } from '@/features/listings/components/ListingChatPanel';
import { EditListingModal } from '@/features/listings/components/EditListingModal';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Skeleton } from '@/components/ui/Skeleton';
import {
  ArrowLeft, Heart, Eye, MapPin, Calendar, Package, Star,
  CheckCircle2, Trash2, MessageCircle, ShoppingBag,
  Beef, Sprout, Wheat, Apple, Wrench, Share2, Shield, Clock, Pencil,
} from 'lucide-react';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { cn } from '@/utils/cn';
import { toast } from 'sonner';
import type { ListingCategory, ListingCondition, ListingStatus } from '@/types/listing';
import type { ComponentType } from 'react';

/* ─── Lookup tables ───────────────────────────────────────────── */

const CATEGORY_META: Record<ListingCategory, {
  label: string;
  icon: ComponentType<{ className?: string }>;
  bg: string;
  text: string;
  badge: string;
}> = {
  ANIMALS:   { label: 'Animais',     icon: Beef,   bg: 'bg-amber-50',   text: 'text-amber-600',   badge: 'bg-amber-100 text-amber-700 ring-amber-200/60' },
  PLANTS:    { label: 'Plantas',     icon: Sprout, bg: 'bg-emerald-50', text: 'text-emerald-600', badge: 'bg-emerald-100 text-emerald-700 ring-emerald-200/60' },
  SEEDS:     { label: 'Sementes',    icon: Wheat,  bg: 'bg-orange-50',  text: 'text-orange-600',  badge: 'bg-orange-100 text-orange-700 ring-orange-200/60' },
  PRODUCE:   { label: 'Produção',    icon: Apple,  bg: 'bg-green-50',   text: 'text-green-600',   badge: 'bg-green-100 text-green-700 ring-green-200/60' },
  EQUIPMENT: { label: 'Equipamento', icon: Wrench, bg: 'bg-slate-50',   text: 'text-slate-500',   badge: 'bg-slate-100 text-slate-600 ring-slate-200/60' },
};

const CONDITION_LABELS: Record<ListingCondition, string> = {
  NEW: 'Novo',
  USED: 'Usado',
  LIKE_NEW: 'Semi-novo',
};

const STATUS_CONFIG: Record<ListingStatus, { label: string; color: string }> = {
  DRAFT:   { label: 'Rascunho', color: 'bg-neutral-100 text-neutral-600' },
  ACTIVE:  { label: 'Ativo',    color: 'bg-emerald-100 text-emerald-700' },
  SOLD:    { label: 'Vendido',  color: 'bg-sky-100 text-sky-700' },
  EXPIRED: { label: 'Expirado', color: 'bg-amber-100 text-amber-700' },
  REMOVED: { label: 'Removido', color: 'bg-red-100 text-red-700' },
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

/* ─── Helpers ─────────────────────────────────────────────────── */

function formatPrice(price: number): string {
  return new Intl.NumberFormat('pt-PT', {
    minimumFractionDigits: price < 1 ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(price) + ' €';
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('pt-PT', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function getStarClass(i: number, rating: number): string {
  if (i < Math.floor(rating)) return 'fill-amber-400 text-amber-400';
  if (i < Math.ceil(rating) && rating % 1 >= 0.5) return 'fill-amber-400/50 text-amber-400';
  return 'text-neutral-200';
}

function renderStars(rating: number) {
  return Array.from({ length: 5 }, (_, i) => (
    <Star
      key={`star-${i}`}
      className={cn('h-3.5 w-3.5', getStarClass(i, rating))}
    />
  ));
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 60) return `${mins}min`;
  const hours = Math.floor(diff / 3_600_000);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(diff / 86_400_000);
  if (days < 30) return `${days}d`;
  const months = Math.floor(days / 30);
  return months < 12 ? `${months}m` : `${Math.floor(months / 12)}a`;
}

/* ─── Component ───────────────────────────────────────────────── */

export function ListingDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [chatOpen, setChatOpen] = useState(false);
  const [confirmSoldOpen, setConfirmSoldOpen] = useState(false);
  const [confirmRemoveOpen, setConfirmRemoveOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

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

  /* ── Loading skeleton ──────────────────────────────────────── */

  if (isLoading) {
    return (
      <AnimatedPage>
        <div className="max-w-5xl mx-auto">
          <Skeleton className="h-[400px] w-full rounded-2xl mb-6" />
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            <div className="lg:col-span-3 space-y-4">
              <Skeleton.Line className="h-8 w-3/4" />
              <Skeleton.Line className="h-10 w-40" />
              <Skeleton.Line className="h-4 w-full" />
              <Skeleton.Line className="h-4 w-full" />
              <Skeleton.Line className="h-4 w-2/3" />
            </div>
            <div className="lg:col-span-2">
              <Skeleton.Card />
            </div>
          </div>
        </div>
      </AnimatedPage>
    );
  }

  if (!listing) {
    return (
      <AnimatedPage>
        <div className="max-w-5xl mx-auto text-center py-20">
          <ShoppingBag className="h-16 w-16 text-neutral-300 mx-auto mb-4" />
          <p className="text-neutral-500 mb-4">Anúncio não encontrado.</p>
          <Button variant="outline" onClick={() => navigate('/marketplace')}>
            <ArrowLeft className="h-4 w-4" />
            Voltar ao Marketplace
          </Button>
        </div>
      </AnimatedPage>
    );
  }

  const cat = CATEGORY_META[listing.category] ?? CATEGORY_META.EQUIPMENT;
  const CatIcon = cat.icon;
  const sellerName = listing.sellerName ?? 'Utilizador';
  const initials = sellerName.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);
  const hasCoordinates = listing.latitude != null && listing.longitude != null;

  return (
    <AnimatedPage>
      <div className="max-w-5xl mx-auto">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-neutral-400 mb-4">
          <button
            onClick={() => navigate('/marketplace')}
            className="hover:text-neutral-700 transition-colors"
          >
            Marketplace
          </button>
          <span>/</span>
          <span className="text-neutral-600 truncate max-w-[200px]">{listing.title}</span>
        </nav>

        {/* Photo gallery */}
        <ListingPhotoGallery photos={listing.photoUrls} />

        {/* Status banner for non-active listings */}
        {listing.status !== 'ACTIVE' && (
          <div className={cn(
            'mt-4 px-4 py-3 rounded-xl flex items-center gap-2 text-sm font-medium',
            STATUS_CONFIG[listing.status].color,
          )}>
            <Shield className="h-4 w-4" />
            Este anúncio está marcado como <strong>{STATUS_CONFIG[listing.status].label.toLowerCase()}</strong>
          </div>
        )}

        {/* Main content — 3/5 + 2/5 layout */}
        <div className="grid grid-cols-1 md:grid-cols-5" style={{ gap: 32, marginTop: 24 }}>
          {/* ── Left column ── */}
          <div className="md:col-span-3" style={{ minWidth: 0 }}>
            {/* Category + time ago */}
            <div className="flex items-center gap-2.5 mb-3">
              <span className={cn(
                'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ring-1',
                cat.badge,
              )}>
                <CatIcon className="h-3.5 w-3.5" />
                {cat.label}
              </span>
              {listing.condition && (
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-neutral-100 text-neutral-600 ring-1 ring-neutral-200/60">
                  {CONDITION_LABELS[listing.condition]}
                </span>
              )}
              <span className="flex items-center gap-1 text-xs text-neutral-400 ml-auto">
                <Clock className="h-3.5 w-3.5" />
                {timeAgo(listing.createdAt)}
              </span>
            </div>

            {/* Title */}
            <h1 className="text-xl sm:text-2xl font-bold font-display text-neutral-900 leading-tight mb-4">
              {listing.title}
            </h1>

            {/* Price block */}
            <div className="flex items-baseline gap-3 mb-6">
              {listing.price === null ? (
                <span className="text-lg font-medium italic text-neutral-400">Preço sob consulta</span>
              ) : (
                <span className="text-3xl font-extrabold text-neutral-900 tracking-tight">
                  {formatPrice(listing.price)}
                </span>
              )}
              {listing.priceNegotiable && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wide bg-amber-50 text-amber-600 ring-1 ring-amber-200/60">
                  Negociável
                </span>
              )}
            </div>

            {/* Quantity if present */}
            {listing.quantity !== null && listing.unit && (
              <div className="flex items-center gap-2 text-sm text-neutral-600 mb-6 -mt-2">
                <Package className="h-4 w-4 text-neutral-400" />
                <span>{listing.quantity} {listing.unit}</span>
              </div>
            )}

            {/* Divider */}
            <hr className="border-neutral-100 mb-6" />

            {/* Description */}
            <div className="mb-8">
              <h2 className="text-sm font-semibold text-neutral-900 uppercase tracking-wide mb-3">
                Descrição
              </h2>
              <div className="text-sm text-neutral-600 leading-relaxed whitespace-pre-wrap">
                {listing.description}
              </div>
            </div>

            {/* Details grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
              <DetailItem
                icon={<MapPin className="h-4 w-4" />}
                label="Localização"
                value={(listing.island ?? '') + (listing.municipality ? `, ${listing.municipality}` : '') || 'Não especificada'}
              />
              <DetailItem
                icon={<Calendar className="h-4 w-4" />}
                label="Publicado"
                value={formatDate(listing.createdAt)}
              />
              <DetailItem
                icon={<Eye className="h-4 w-4" />}
                label="Visualizações"
                value={String(listing.viewsCount)}
              />
            </div>

            {/* Owner actions */}
            {isOwner && listing.status === 'ACTIVE' && (
              <div className="flex flex-wrap gap-2.5 p-4 rounded-xl bg-neutral-50/80 border border-neutral-200/60 mb-6">
                <span className="text-xs font-medium text-neutral-400 uppercase tracking-wide w-full mb-1">
                  Gerir anúncio
                </span>
                <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
                  <Pencil className="h-4 w-4" /> Editar
                </Button>
                <Button size="sm" onClick={() => setConfirmSoldOpen(true)}>
                  <CheckCircle2 className="h-4 w-4" /> Marcar como Vendido
                </Button>
                <Button variant="danger" size="sm" onClick={() => setConfirmRemoveOpen(true)}>
                  <Trash2 className="h-4 w-4" /> Remover
                </Button>
              </div>
            )}
          </div>

          {/* ── Right column (sticky sidebar) ── */}
          <div className="md:col-span-2">
            <div className="md:sticky" style={{ top: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Action card (non-owner) */}
              {!isOwner && listing.status === 'ACTIVE' && (
                <div className="rounded-2xl border border-neutral-200/80 bg-white p-5 shadow-sm">
                  <Button onClick={() => setChatOpen(true)} className="w-full mb-3">
                    <MessageCircle className="h-4 w-4" />
                    Contactar Vendedor
                  </Button>
                  <div className="grid grid-cols-2 gap-2.5">
                    <Button
                      variant={listing.favorited ? 'primary' : 'outline'}
                      size="sm"
                      onClick={() => favoriteMut.mutate()}
                      loading={favoriteMut.isPending}
                      className="w-full"
                    >
                      <Heart className={cn('h-4 w-4', listing.favorited && 'fill-current')} />
                      {listing.favorited ? 'Favoritado' : 'Favoritar'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => {
                        navigator.clipboard.writeText(globalThis.location.href);
                        toast.success('Link copiado');
                      }}
                    >
                      <Share2 className="h-4 w-4" />
                      Partilhar
                    </Button>
                  </div>
                </div>
              )}

              {/* Seller card */}
              <div className="rounded-2xl border border-neutral-200/80 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    'flex items-center justify-center h-12 w-12 rounded-full font-bold text-sm',
                    cat.bg, cat.text,
                  )}>
                    {initials}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-neutral-900 truncate">{sellerName}</p>
                    {listing.sellerRating == null ? (
                      <p className="text-xs text-neutral-400 mt-0.5">Vendedor novo</p>
                    ) : (
                      <div className="flex items-center gap-1 mt-0.5">
                        {renderStars(listing.sellerRating)}
                        <span className="text-xs text-neutral-500 ml-0.5">
                          {listing.sellerRating.toFixed(1)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-4 mt-4 pt-3.5 border-t border-neutral-100 text-xs text-neutral-500">
                  <span className="flex items-center gap-1">
                    <ShoppingBag className="h-3.5 w-3.5" />
                    {listing.sellerListingCount} {listing.sellerListingCount === 1 ? 'anúncio' : 'anúncios'}
                  </span>
                  <span className="flex items-center gap-1">
                    <Heart className="h-3.5 w-3.5" />
                    {listing.favoriteCount} {listing.favoriteCount === 1 ? 'favorito' : 'favoritos'}
                  </span>
                </div>
              </div>

              {/* Map card */}
              {hasCoordinates && (
                <div className="rounded-2xl border border-neutral-200/80 bg-white overflow-hidden shadow-sm">
                  <div className="h-[180px]">
                    <MapContainer
                      center={[listing.latitude, listing.longitude]}
                      zoom={12}
                      style={{ height: '100%', width: '100%' }}
                      scrollWheelZoom={false}
                      dragging={false}
                      zoomControl={false}
                      attributionControl={false}
                    >
                      <TileLayer
                        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                      />
                      <Marker position={[listing.latitude, listing.longitude]} icon={markerIcon} />
                    </MapContainer>
                  </div>
                  <div className="px-4 py-3.5">
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-neutral-400 mt-0.5 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-neutral-900">{listing.island}</p>
                        {(listing.municipality || listing.parish) && (
                          <p className="text-xs text-neutral-500">
                            {[listing.municipality, listing.parish].filter(Boolean).join(', ')}
                          </p>
                        )}
                        {listing.locationName && (
                          <p className="text-xs text-neutral-400 mt-0.5">{listing.locationName}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Safety notice */}
              <div className="rounded-xl bg-neutral-50 border border-neutral-200/60 px-4 py-3 flex items-start gap-2.5">
                <Shield className="h-4 w-4 text-neutral-400 mt-0.5 flex-shrink-0" />
                <p className="text-[11px] text-neutral-400 leading-relaxed">
                  Nunca envie dinheiro antes de ver o produto. Combine encontros em locais públicos.
                </p>
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

        {/* Edit modal */}
        <EditListingModal
          open={editOpen}
          onClose={() => setEditOpen(false)}
          listing={listing}
        />

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
      </div>
    </AnimatedPage>
  );
}

/* ─── Sub-components ──────────────────────────────────────────── */

function DetailItem({ icon, label, value }: { readonly icon: React.ReactNode; readonly label: string; readonly value: string }) {
  return (
    <div className="flex items-start gap-2.5 p-3 rounded-xl bg-neutral-50/80 border border-neutral-100">
      <span className="text-neutral-400 mt-0.5">{icon}</span>
      <div>
        <p className="text-[11px] font-medium text-neutral-400 uppercase tracking-wide">{label}</p>
        <p className="text-sm font-medium text-neutral-700 mt-0.5">{value}</p>
      </div>
    </div>
  );
}
