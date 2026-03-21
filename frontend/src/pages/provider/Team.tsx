import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { listTeamMembers, createTeamMember, deactivateTeamMember } from '@/api/teamMembers';
import { Card, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { AnimatedPage } from '@/components/AnimatedPage';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { EmptyTeam } from '@/components/illustrations/EmptyTeam';
import { useMotionConfig } from '@/hooks/useMotionConfig';
import { Plus, UserMinus } from 'lucide-react';
import { cn } from '@/utils/cn';
import type { TeamMember, CreateTeamMemberRequest, TeamMemberRole } from '@/types/teamMember';

const roleLabels: Record<TeamMemberRole, string> = { MANAGER: 'Gestor', LEAD: 'Chefe', OPERATOR: 'Operador' };
const roleColors: Record<TeamMemberRole, string> = {
  MANAGER: 'bg-purple-100 text-purple-700',
  LEAD: 'bg-blue-100 text-blue-700',
  OPERATOR: 'bg-neutral-100 text-neutral-700',
};

export function Team() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<TeamMember | null>(null);
  const { listContainerVariants, listItemVariants } = useMotionConfig();

  const { data: members, isLoading } = useQuery({
    queryKey: ['team-members'],
    queryFn: listTeamMembers,
  });

  const createMut = useMutation({
    mutationFn: (data: CreateTeamMemberRequest) => createTeamMember(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['team-members'] }); setShowForm(false); },
  });

  const deactivateMut = useMutation({
    mutationFn: (id: number) => deactivateTeamMember(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['team-members'] }),
  });

  return (
    <AnimatedPage>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-neutral-900">Equipa</h1>
        <Button size="sm" onClick={() => { setEditing(null); setShowForm(true); }}><Plus className="h-4 w-4" />Adicionar</Button>
      </div>
      {showForm && (
        <Card className="mb-6">
          <CardBody>
            <TeamMemberFormInline
              initial={editing}
              loading={createMut.isPending}
              onSubmit={(data) => createMut.mutate(data as CreateTeamMemberRequest)}
              onCancel={() => setShowForm(false)}
            />
          </CardBody>
        </Card>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Skeleton.Card />
          <Skeleton.Card />
          <Skeleton.Card />
        </div>
      ) : members && members.length > 0 ? (
        <motion.div
          variants={listContainerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {members.map((m) => (
            <motion.div variants={listItemVariants} key={m.id}>
              <Card>
                <CardBody>
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-neutral-900">{m.name}</p>
                      <p className="text-xs text-neutral-500">{m.email}</p>
                      {m.phone && <p className="text-xs text-neutral-500">{m.phone}</p>}
                    </div>
                    <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', roleColors[m.role])}>{roleLabels[m.role]}</span>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <Button size="sm" variant="ghost" onClick={() => deactivateMut.mutate(m.id)}>
                      <UserMinus className="h-4 w-4" />Desativar
                    </Button>
                  </div>
                </CardBody>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      ) : (
        <EmptyState
          illustration={<EmptyTeam className="w-48 h-auto" />}
          title="A sua equipa está vazia"
          description="Adicione membros à sua equipa para gerir os seus serviços de forma mais eficiente."
          action={
            <Button onClick={() => { setEditing(null); setShowForm(true); }}>
              <Plus className="h-4 w-4" />Adicionar membro
            </Button>
          }
        />
      )}
    </AnimatedPage>
  );
}

function TeamMemberFormInline({ initial, loading, onSubmit, onCancel }: {
  initial: TeamMember | null;
  loading: boolean;
  onSubmit: (data: CreateTeamMemberRequest) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? '');
  const [email, setEmail] = useState(initial?.email ?? '');
  const [phone, setPhone] = useState(initial?.phone ?? '');
  const [role, setRole] = useState<TeamMemberRole>(initial?.role ?? 'OPERATOR');

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit({ name, email, phone: phone || undefined, role }); }} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome" required className="rounded-lg border border-neutral-300 px-3 py-2 text-sm" />
        <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" type="email" required disabled={!!initial} className="rounded-lg border border-neutral-300 px-3 py-2 text-sm disabled:bg-neutral-100" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Telefone" className="rounded-lg border border-neutral-300 px-3 py-2 text-sm" />
        <select value={role} onChange={(e) => setRole(e.target.value as TeamMemberRole)} className="rounded-lg border border-neutral-300 px-3 py-2 text-sm">
          <option value="OPERATOR">Operador</option>
          <option value="LEAD">Chefe</option>
          <option value="MANAGER">Gestor</option>
        </select>
      </div>
      <div className="flex gap-2">
        <Button type="submit" size="sm" loading={loading}>Guardar</Button>
        <Button type="button" size="sm" variant="ghost" onClick={onCancel}>Cancelar</Button>
      </div>
    </form>
  );
}
