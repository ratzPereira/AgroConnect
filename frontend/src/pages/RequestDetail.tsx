import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getRequest, cancelRequest } from '@/api/requests';
import { getRequestProposals, createProposal, acceptProposal } from '@/api/proposals';
import { useAuthStore } from '@/stores/authStore';
import { RequestStatusBadge } from '@/features/requests/components/RequestStatusBadge';
import { ProposalCard } from '@/features/proposals/components/ProposalCard';
import { CreateProposalModal } from '@/features/proposals/components/CreateProposalModal';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, MapPin, Layers, Clock, Loader2, X } from 'lucide-react';
import type { CreateProposalDto } from '@/types/proposal';

const urgencyLabels: Record<string, string> = {
  LOW: 'Baixa',
  MEDIUM: 'Média',
  HIGH: 'Alta',
};

export function RequestDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [showProposalModal, setShowProposalModal] = useState(false);
  const [acceptingId, setAcceptingId] = useState<number | null>(null);

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

  const cancelMutation = useMutation({
    mutationFn: () => cancelRequest(requestId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['request', requestId] }),
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proposals', requestId] });
      queryClient.invalidateQueries({ queryKey: ['request', requestId] });
      setAcceptingId(null);
    },
  });

  const isProvider = user?.role === 'PROVIDER_MANAGER' || user?.role === 'PROVIDER_LEAD' || user?.role === 'PROVIDER_OPERATOR';
  const isOwner = request && request.clientId === user?.id;
  const canPropose = isProvider && request && (request.status === 'PUBLISHED' || request.status === 'WITH_PROPOSALS');
  const canCancel = isOwner && request && !['RATED', 'EXPIRED', 'CANCELLED'].includes(request.status);

  if (requestLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-neutral-400" />
      </div>
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
    <div className="animate-fade-in max-w-3xl mx-auto">
      <button
        onClick={() => navigate('/requests')}
        className="inline-flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-700 mb-4"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar aos pedidos
      </button>

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

      {/* Photos */}
      {request.photos.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <h2 className="font-semibold text-neutral-900 text-sm">Fotos</h2>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-3 gap-3">
              {request.photos.map((photo) => (
                <img
                  key={photo.id}
                  src={photo.photoUrl}
                  alt="Foto do pedido"
                  className="w-full h-32 object-cover rounded-lg border border-neutral-200"
                />
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
            <div className="flex justify-center py-6">
              <Loader2 className="h-5 w-5 animate-spin text-neutral-400" />
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

      {/* Create Proposal Modal */}
      <CreateProposalModal
        open={showProposalModal}
        onClose={() => setShowProposalModal(false)}
        onSubmit={async (data) => {
          await createProposalMutation.mutateAsync(data);
        }}
        loading={createProposalMutation.isPending}
      />
    </div>
  );
}
