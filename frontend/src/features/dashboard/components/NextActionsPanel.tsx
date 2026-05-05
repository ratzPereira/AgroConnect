import { useNavigate } from 'react-router-dom';
import { AlertCircle, CheckCircle, Star, Clock } from 'lucide-react';
import type { ServiceRequestSummary } from '@/types/request';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';

interface NextActionsPanelProps {
  requests: ServiceRequestSummary[];
}

interface Action {
  id: number;
  icon: React.ReactNode;
  text: string;
  color: string;
}

function computeActions(requests: ServiceRequestSummary[]): Action[] {
  const actions: Action[] = [];

  for (const req of requests) {
    if (req.status === 'WITH_PROPOSALS' && req.proposalCount > 0) {
      actions.push({
        id: req.id,
        icon: <AlertCircle className="h-4 w-4 text-blue-500" />,
        text: `Tem ${req.proposalCount} proposta${req.proposalCount > 1 ? 's' : ''} para avaliar em "${req.title}"`,
        color: 'text-blue-700',
      });
    }

    if (req.status === 'AWAITING_CONFIRMATION') {
      actions.push({
        id: req.id,
        icon: <CheckCircle className="h-4 w-4 text-amber-500" />,
        text: `Confirme a conclusão de "${req.title}"`,
        color: 'text-amber-700',
      });
    }

    if (req.status === 'COMPLETED') {
      actions.push({
        id: req.id,
        icon: <Star className="h-4 w-4 text-yellow-500" />,
        text: `Avalie o serviço "${req.title}"`,
        color: 'text-yellow-700',
      });
    }

    if (req.status === 'PUBLISHED' && req.proposalCount === 0) {
      const created = new Date(req.createdAt);
      const daysSince = (Date.now() - created.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSince > 7) {
        actions.push({
          id: req.id,
          icon: <Clock className="h-4 w-4 text-neutral-400" />,
          text: `"${req.title}" ainda sem propostas`,
          color: 'text-neutral-600',
        });
      }
    }
  }

  return actions.slice(0, 5);
}

export function NextActionsPanel({ requests }: NextActionsPanelProps) {
  const navigate = useNavigate();
  const actions = computeActions(requests);

  if (actions.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <h3 className="text-sm font-semibold text-neutral-900">Ações Pendentes</h3>
      </CardHeader>
      <CardBody>
        <ul className="space-y-2">
          {actions.map((action) => (
            <li key={`${action.id}-${action.text.slice(0, 20)}`}>
              <button
                onClick={() => navigate(`/requests/${action.id}`)}
                className="flex items-start gap-2 w-full text-left rounded-lg p-2 hover:bg-neutral-50 transition-colors"
              >
                <span className="mt-0.5">{action.icon}</span>
                <span className={`text-sm ${action.color}`}>{action.text}</span>
              </button>
            </li>
          ))}
        </ul>
      </CardBody>
    </Card>
  );
}
