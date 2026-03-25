import { useNavigate } from 'react-router-dom';
import { Users, MapPin, Camera, Clock } from 'lucide-react';
import type { ActiveJob } from '@/types/pin';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';

interface ProviderJobsListProps {
  jobs: ActiveJob[];
}

function getNextAction(job: ActiveJob): { text: string; icon: React.ReactNode; color: string } {
  if (job.requestStatus === 'AWARDED' && !job.hasAssignment) {
    return {
      text: 'Atribuir equipa',
      icon: <Users className="h-3.5 w-3.5" />,
      color: 'text-neutral-600 bg-neutral-100',
    };
  }
  if (job.requestStatus === 'AWARDED' && job.hasAssignment) {
    return {
      text: 'Fazer check-in',
      icon: <MapPin className="h-3.5 w-3.5" />,
      color: 'text-amber-700 bg-amber-50',
    };
  }
  if (job.requestStatus === 'IN_PROGRESS') {
    return {
      text: 'Enviar fotos / Concluir',
      icon: <Camera className="h-3.5 w-3.5" />,
      color: 'text-blue-700 bg-blue-50',
    };
  }
  return {
    text: 'Aguarda confirmação',
    icon: <Clock className="h-3.5 w-3.5" />,
    color: 'text-neutral-500 bg-neutral-50',
  };
}

export function ProviderJobsList({ jobs }: ProviderJobsListProps) {
  const navigate = useNavigate();

  if (jobs.length === 0) {
    return (
      <Card>
        <CardHeader>
          <h3 className="text-sm font-semibold text-neutral-900">Trabalhos Ativos</h3>
        </CardHeader>
        <CardBody>
          <p className="text-sm text-neutral-500 text-center py-4">Sem trabalhos ativos</p>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <h3 className="text-sm font-semibold text-neutral-900">Trabalhos Ativos</h3>
      </CardHeader>
      <CardBody>
        <ul className="space-y-2">
          {jobs.map((job) => {
            const action = getNextAction(job);
            return (
              <li key={job.executionId}>
                <button
                  onClick={() => navigate(`/requests/${job.requestId}`)}
                  className="w-full text-left rounded-lg p-3 hover:bg-neutral-50 transition-colors border border-neutral-100"
                >
                  <p className="text-sm font-medium text-neutral-900 line-clamp-1">
                    {job.requestTitle}
                  </p>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    {job.categoryName} · {job.island}
                  </p>
                  <span className={`inline-flex items-center gap-1 mt-1.5 text-xs font-medium px-2 py-0.5 rounded-full ${action.color}`}>
                    {action.icon}
                    {action.text}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </CardBody>
    </Card>
  );
}
