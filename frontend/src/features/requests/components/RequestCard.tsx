import { useNavigate } from 'react-router-dom';
import { Card, CardBody } from '@/components/ui/Card';
import { RequestStatusBadge } from './RequestStatusBadge';
import { MapPin, Clock, Layers } from 'lucide-react';
import type { ServiceRequestSummary } from '@/types/request';

const urgencyLabels: Record<string, string> = {
  LOW: 'Baixa',
  MEDIUM: 'Média',
  HIGH: 'Alta',
};

interface RequestCardProps {
  request: ServiceRequestSummary;
}

export function RequestCard({ request }: RequestCardProps) {
  const navigate = useNavigate();

  return (
    <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate(`/requests/${request.id}`)}>
      <CardBody>
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1">
              <RequestStatusBadge status={request.status} />
              <span className="text-xs text-neutral-500">{request.categoryName}</span>
            </div>
            <h3 className="text-sm font-semibold text-neutral-900 truncate">{request.title}</h3>
            <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-neutral-500">
              {request.parish && (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {request.parish}, {request.island}
                </span>
              )}
              {request.area != null && (
                <span className="inline-flex items-center gap-1">
                  <Layers className="h-3 w-3" />
                  {request.area} {request.areaUnit}
                </span>
              )}
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {urgencyLabels[request.urgency] ?? request.urgency}
              </span>
            </div>
          </div>
          <div className="text-right shrink-0">
            {request.proposalCount > 0 && (
              <span className="text-xs font-medium text-green-700 bg-green-50 px-2 py-1 rounded-full">
                {request.proposalCount} {request.proposalCount === 1 ? 'proposta' : 'propostas'}
              </span>
            )}
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
