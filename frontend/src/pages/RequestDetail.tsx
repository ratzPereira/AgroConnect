import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getRequest, cancelRequest } from '@/api/requests';
import { getRequestProposals, createProposal, acceptProposal } from '@/api/proposals';
import { getRequestReviews } from '@/api/reviews';
import { useAuthStore } from '@/stores/authStore';
import { RequestStatusBadge } from '@/features/requests/components/RequestStatusBadge';
import { ProposalCard } from '@/features/proposals/components/ProposalCard';
import { CreateProposalModal } from '@/features/proposals/components/CreateProposalModal';
import { PaymentModal } from '@/features/proposals/components/PaymentModal';
import { ExecutionPanel } from '@/features/executions/components/ExecutionPanel';
import { ConfirmationPanel } from '@/features/requests/components/ConfirmationPanel';
import { ReviewForm } from '@/features/reviews/components/ReviewForm';
import { ReviewCard } from '@/features/reviews/components/ReviewCard';
import { ChatPanel } from '@/features/chat/components/ChatPanel';
import { PhotoUpload } from '@/features/requests/components/PhotoUpload';
import { PhotoLightbox } from '@/components/ui/PhotoLightbox';
import { AnimatedPage } from '@/components/AnimatedPage';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { StatusTimeline } from '@/components/ui/StatusTimeline';
import { Skeleton } from '@/components/ui/Skeleton';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { MapPin, Layers, Clock, X } from 'lucide-react';
import type { CreateProposalDto } from '@/types/proposal';
import type { ProposalAcceptResponse } from '@/types/stripe';

const urgencyLabels: Record<string, string> = {
  LOW: 'Baixa',
  MEDIUM: 'Média',
  HIGH: 'Alta',
};

const EXECUTION_STATUSES = new Set([
  'AWARDED', 'IN_PROGRESS', 'AWAITING_CONFIRMATION', 'COMPLETED', 'RATED', 'DISPUTED',
]);

const CHAT_STATUSES = new Set([
  'AWARDED', 'IN_PROGRESS', 'AWAITING_CONFIRMATION', 'COMPLETED', 'DISPUTED',
]);

const REVIEW_STATUSES = new Set(['COMPLETED', 'RATED']);

const TERMINAL_LABELS: Record<string, string> = {
  CANCELLED: 'Cancelado',
  EXPIRED: 'Expirado',
  DISPUTED: 'Em Disputa',
};

function buildTimelineSteps(status: string): Array<{ label: string; status: 'completed' | 'active' | 'upcoming' }> {
  const allSteps = [
    { key: 'DRAFT', label: 'Rascunho' },
    { key: 'PUBLISHED', label: 'Publicado' },
    { key: 'WITH_PROPOSALS', label: 'Com Propostas' },
    { key: 'AWARDED', label: 'Adjudicado' },
    { key: 'IN_PROGRESS', label: 'Em Curso' },
    { key: 'AWAITING_CONFIRMATION', label: 'Aguarda Confirmação' },
    { key: 'COMPLETED', label: 'Concluído' },
    { key: 'RATED', label: 'Avaliado' },
  ];

  let currentIndex = allSteps.findIndex((s) => s.key === status);

  if (currentIndex === -1 && status in TERMINAL_LABELS) {
    allSteps.push({ key: status, label: TERMINAL_LABELS[status] });
    currentIndex = allSteps.length - 1;
  }

  return allSteps.map((step, index) => ({
    label: step.label,
    status: index < currentIndex ? 'completed' as const : index === currentIndex ? 'active' as const : 'upcoming' as const,
  }));
}

export function RequestDetail() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [showProposalModal, setShowProposalModal] = useState(false);
  const [acceptingId, setAcceptingId] = useState<number | null>(null);
  const [paymentAcceptance, setPaymentAcceptance] = useState<ProposalAcceptResponse | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const requestId = Number(id);

  const { data: request, isLoading: requestLoading } = useQuery({
    queryKey: ['request', requestId],
    queryFn: () => getRequest(requestId),
    enabled: !isNaN(requestId),
  });

  const { data: proposals, isLoading: proposalsLoading } = useQuery({
    queryKey: ['proposals', requestId],
    queryFn: () => getRequestProposals(requestId),
    enabled: !isNaN(requestId),
  });

  const { data: reviews } = useQuery({
    queryKey: ['request-reviews', requestId],
    queryFn: () => getRequestReviews(requestId),
    enabled: !isNaN(requestId) && !!request && REVIEW_STATUSES.has(request.status),
  });

  const cancelMutation = useMutation({
    mutationFn: () => cancelRequest(requestId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['request', requestId] });
      queryClient.invalidateQueries({ queryKey: ['client-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['my-requests'] });
    },
  });

  const createProposalMutation = useMutation({
    mutationFn: (data: CreateProposalDto) => createProposal(requestId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proposals', requestId] });
      queryClient.invalidateQueries({ queryKey: ['request', requestId] });
      setShowProposalModal(false);
    },
  });

  const acceptMutation = useMutation({
    mutationFn: (proposalId: number) => acceptProposal(proposalId),
    onSuccess: (response) => {
      setPaymentAcceptance(response);
    },
    onError: () => {
      setAcceptingId(null);
    },
  });

  function handlePaymentSucceeded() {
    setPaymentAcceptance(null);
    setAcceptingId(null);
    queryClient.invalidateQueries({ queryKey: ['proposals', requestId] });
    queryClient.invalidateQueries({ queryKey: ['request', requestId] });
    queryClient.invalidateQueries({ queryKey: ['client-dashboard'] });
    queryClient.invalidateQueries({ queryKey: ['my-requests'] });
  }

  function handlePaymentClose() {
    setPaymentAcceptance(null);
    setAcceptingId(null);
  }

  const isProvider = user?.role === 'PROVIDER_MANAGER' || user?.role === 'PROVIDER_LEAD' || user?.role === 'PROVIDER_OPERATOR';
  const isOwner = request && request.clientId === user?.id;
  const alreadyProposed = isProvider && proposals && proposals.length > 0;
  const canPropose = isProvider && !alreadyProposed && request && (request.status === 'PUBLISHED' || request.status === 'WITH_PROPOSALS');
  const canCancel = isOwner && request && !['COMPLETED', 'RATED', 'DISPUTED', 'EXPIRED', 'CANCELLED'].includes(request.status);
  const canUploadPhotos = request && ['DRAFT', 'PUBLISHED', 'WITH_PROPOSALS'].includes(request.status);

  const showExecution = request && EXECUTION_STATUSES.has(request.status);
  const showChat = request && CHAT_STATUSES.has(request.status);
  const showConfirmation = isOwner && request?.status === 'AWAITING_CONFIRMATION';
  const isParticipant = isOwner || (isProvider && proposals?.some((p) => p.status === 'ACCEPTED'));
  const showReviewForm = isParticipant && request && REVIEW_STATUSES.has(request.status) &&
    reviews && !reviews.some((r) => r.authorId === user?.id);

  if (requestLoading) {
    return (
      <AnimatedPage className="max-w-3xl mx-auto">
        <Skeleton.Line className="h-4 w-40 mb-4" />
        <div className="flex items-start justify-between gap-4 mb-6">
          <div className="space-y-2">
            <Skeleton.Line className="h-5 w-24" />
            <Skeleton.Line className="h-6 w-64" />
          </div>
        </div>
        <Skeleton.Rect className="h-40 mb-6" />
        <Skeleton.Rect className="h-32" />
      </AnimatedPage>
    );
  }

  if (!request) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-neutral-500">Pedido não encontrado.</p>
      </div>
    );
  }

  return (
    <AnimatedPage className="max-w-3xl mx-auto">
      <Breadcrumbs
        items={[{ label: 'Pedidos', to: '/requests' }, { label: request.title }]}
        className="mb-4"
      />

      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <RequestStatusBadge status={request.status} />
            <span className="text-xs text-neutral-500">{request.categoryName}</span>
          </div>
          <h1 className="text-xl font-bold text-neutral-900">{request.title}</h1>
        </div>
        <div className="flex gap-2">
          {canPropose && (
            <Button size="sm" onClick={() => setShowProposalModal(true)}>
              Submeter Proposta
            </Button>
          )}
          {canCancel && (
            <Button
              size="sm"
              variant="danger"
              loading={cancelMutation.isPending}
              onClick={() => cancelMutation.mutate()}
            >
              <X className="h-4 w-4" />
              Cancelar
            </Button>
          )}
        </div>
      </div>

      {/* Two-column layout: main content + timeline sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_240px] gap-6">
        {/* Left column — main content */}
        <div>
          {/* Details */}
          <Card className="mb-6">
            <CardBody>
              <p className="text-sm text-neutral-700 whitespace-pre-wrap">{request.description}</p>
              <div className="flex flex-wrap items-center gap-4 mt-4 text-sm text-neutral-500">
                {request.parish && (
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {[request.parish, request.municipality, request.island].filter(Boolean).join(', ')}
                  </span>
                )}
                {request.area != null && (
                  <span className="inline-flex items-center gap-1">
                    <Layers className="h-4 w-4" />
                    {request.area} {request.areaUnit}
                  </span>
                )}
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  Urgência: {urgencyLabels[request.urgency] ?? request.urgency}
                </span>
              </div>
              {request.preferredDateFrom && (
                <p className="text-xs text-neutral-400 mt-2">
                  Data preferida: {request.preferredDateFrom}
                  {request.preferredDateTo && ` — ${request.preferredDateTo}`}
                </p>
              )}
            </CardBody>
          </Card>

          {/* Photos — owner can upload when request is open */}
          {(request.photos.length > 0 || (isOwner && canUploadPhotos)) && (
            <Card className="mb-6">
              <CardHeader>
                <h2 className="font-semibold text-neutral-900 text-sm">Fotos</h2>
              </CardHeader>
              <CardBody>
                {isOwner && canUploadPhotos ? (
                  <PhotoUpload requestId={requestId} photos={request.photos} />
                ) : (
                  <div className="grid grid-cols-3 gap-3">
                    {request.photos.map((photo, i) => (
                      <button
                        key={photo.id}
                        type="button"
                        onClick={() => setLightboxIndex(i)}
                        className="rounded-lg border border-neutral-200 overflow-hidden cursor-pointer hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-primary-500"
                        aria-label={`Abrir foto ${i + 1}`}
                      >
                        <img
                          src={photo.photoUrl}
                          alt="Foto do pedido"
                          className="w-full h-32 object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </CardBody>
            </Card>
          )}

          {/* Execution Panel (>=AWARDED) */}
          {showExecution && (
            <ExecutionPanel
              requestId={requestId}
              requestStatus={request.status}
              isProvider={isProvider}
              targetLat={request.latitude}
              targetLon={request.longitude}
            />
          )}

          {/* Chat Panel (>=AWARDED, for both client and provider) */}
          {showChat && <ChatPanel requestId={requestId} />}

          {/* Confirmation Panel (AWAITING_CONFIRMATION, client only) */}
          {showConfirmation && <ConfirmationPanel requestId={requestId} />}

          {/* Review Form (COMPLETED/RATED, user hasn't reviewed yet) */}
          {showReviewForm && <ReviewForm requestId={requestId} />}

          {/* Reviews submitted for this request */}
          {reviews && reviews.length > 0 && (
            <Card className="mb-6">
              <CardHeader>
                <h2 className="font-semibold text-neutral-900 text-sm">
                  Avaliações ({reviews.length})
                </h2>
              </CardHeader>
              <CardBody>
                <div className="space-y-3">
                  {reviews.map((review) => (
                    <ReviewCard key={review.id} review={review} />
                  ))}
                </div>
              </CardBody>
            </Card>
          )}

          {/* Proposals */}
          <Card>
            <CardHeader>
              <h2 className="font-semibold text-neutral-900 text-sm">
                Propostas ({proposals?.length ?? 0})
              </h2>
            </CardHeader>
            <CardBody>
              {proposalsLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton.Card key={i} />
                  ))}
                </div>
              ) : proposals && proposals.length > 0 ? (
                <div className="space-y-3">
                  {proposals.map((proposal) => (
                    <ProposalCard
                      key={proposal.id}
                      proposal={proposal}
                      isRequestOwner={isOwner ?? false}
                      onAccept={(pid) => {
                        setAcceptingId(pid);
                        acceptMutation.mutate(pid);
                      }}
                      acceptLoading={acceptMutation.isPending && acceptingId === proposal.id}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-neutral-500 text-center py-6">
                  Ainda não existem propostas para este pedido.
                </p>
              )}
            </CardBody>
          </Card>
        </div>

        {/* Right column — timeline sidebar */}
        <div className="order-first lg:order-last">
          <Card>
            <CardHeader>
              <h2 className="font-semibold text-neutral-900 text-sm">Progresso</h2>
            </CardHeader>
            <CardBody>
              <StatusTimeline steps={buildTimelineSteps(request.status)} />
            </CardBody>
          </Card>
        </div>
      </div>

      {/* Create Proposal Modal */}
      <CreateProposalModal
        open={showProposalModal}
        onClose={() => setShowProposalModal(false)}
        onSubmit={async (data) => {
          await createProposalMutation.mutateAsync(data);
        }}
        loading={createProposalMutation.isPending}
      />

      {/* Payment Modal — opens after accept returns clientSecret */}
      <PaymentModal
        open={paymentAcceptance !== null}
        onClose={handlePaymentClose}
        acceptance={paymentAcceptance}
        onSucceeded={handlePaymentSucceeded}
      />

      {/* Photo Lightbox */}
      {lightboxIndex !== null && (
        <PhotoLightbox
          photos={request.photos.map((p) => p.photoUrl)}
          currentIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onNavigate={setLightboxIndex}
        />
      )}
    </AnimatedPage>
  );
}
