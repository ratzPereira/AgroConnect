import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { assignExecution } from '@/api/executions';
import { listTeamMembers } from '@/api/teamMembers';
import { listMachines } from '@/api/machines';
import { Button } from '@/components/ui/Button';
import { UserPlus } from 'lucide-react';
import type { TeamMemberRole } from '@/types/teamMember';

const ROLE_LABEL: Record<TeamMemberRole, string> = {
  MANAGER: 'Gestor',
  LEAD: 'Chefe de equipa',
  OPERATOR: 'Operador',
};

interface AssignmentFormProps {
  readonly executionId: number;
  readonly requestId: number;
}

export function AssignmentForm({ executionId, requestId }: AssignmentFormProps) {
  const queryClient = useQueryClient();
  const [teamMemberId, setTeamMemberId] = useState('');
  const [machineId, setMachineId] = useState('');

  const { data: teamMembers } = useQuery({
    queryKey: ['team-members'],
    queryFn: listTeamMembers,
  });

  const { data: machines } = useQuery({
    queryKey: ['machines'],
    queryFn: () => listMachines(),
  });

  const assignMutation = useMutation({
    mutationFn: (data: { teamMemberId: number; machineId?: number }) =>
      assignExecution(executionId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['execution', requestId] });
      setTeamMemberId('');
      setMachineId('');
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!teamMemberId) return;
    assignMutation.mutate({
      teamMemberId: Number(teamMemberId),
      machineId: machineId ? Number(machineId) : undefined,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3">
      <div className="flex-1 min-w-[160px] space-y-1.5">
        <label htmlFor="teamMember" className="block text-xs font-medium text-neutral-600">
          Membro da equipa
        </label>
        <select
          id="teamMember"
          value={teamMemberId}
          onChange={(e) => setTeamMemberId(e.target.value)}
          className="block w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-1"
        >
          <option value="">Selecionar...</option>
          {teamMembers?.filter((m) => m.active).map((m) => (
            <option key={m.id} value={m.id}>
              {m.name} ({ROLE_LABEL[m.role]})
            </option>
          ))}
        </select>
      </div>
      <div className="flex-1 min-w-[160px] space-y-1.5">
        <label htmlFor="machine" className="block text-xs font-medium text-neutral-600">
          Máquina (opcional)
        </label>
        <select
          id="machine"
          value={machineId}
          onChange={(e) => setMachineId(e.target.value)}
          className="block w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-1"
        >
          <option value="">Nenhuma</option>
          {machines?.filter((m) => m.status !== 'RETIRED').map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
      </div>
      <Button
        type="submit"
        size="sm"
        disabled={!teamMemberId}
        loading={assignMutation.isPending}
      >
        <UserPlus className="h-4 w-4" />
        Atribuir
      </Button>
      {assignMutation.isError && (
        <p className="w-full text-xs text-red-600">Erro ao atribuir membro. Tente novamente.</p>
      )}
    </form>
  );
}
