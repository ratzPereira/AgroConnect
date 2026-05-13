import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { listTeamMembers, createTeamMember } from '@/api/teamMembers';
import { Card, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { AnimatedPage } from '@/components/AnimatedPage';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { EmptyTeam } from '@/components/illustrations/EmptyTeam';
import { useMotionConfig } from '@/hooks/useMotionConfig';
import { Plus, ChevronRight } from 'lucide-react';
import { cn } from '@/utils/cn';
import type { CreateTeamMemberRequest, TeamMemberRole } from '@/types/teamMember';

const roleLabels: Record<TeamMemberRole, string> = { MANAGER: 'Gestor', LEAD: 'Chefe', OPERATOR: 'Operador' };
const roleColors: Record<TeamMemberRole, string> = {
  MANAGER: 'bg-purple-100 text-purple-700',
  LEAD: 'bg-blue-100 text-blue-700',
  OPERATOR: 'bg-neutral-100 text-neutral-700',
};

const INPUT_CLASS = 'rounded-lg border border-neutral-300 px-3 py-2 text-sm w-full';

export function Team() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const { listContainerVariants, listItemVariants } = useMotionConfig();

  const { data: members, isLoading } = useQuery({
    queryKey: ['team-members'],
    queryFn: listTeamMembers,
  });

  const createMut = useMutation({
    mutationFn: (data: CreateTeamMemberRequest) => createTeamMember(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-members'] });
      setShowForm(false);
    },
  });

  return (
    <AnimatedPage>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-neutral-900">Equipa</h1>
        <Button size="sm" onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4" />Adicionar
        </Button>
      </div>

      {showForm && (
        <Card className="mb-6">
          <CardBody>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                const rateRaw = (fd.get('hourlyRate') as string).trim();
                createMut.mutate({
                  name: fd.get('name') as string,
                  email: fd.get('email') as string,
                  phone: (fd.get('phone') as string) || undefined,
                  role: fd.get('role') as TeamMemberRole,
                  hourlyRate: rateRaw ? Number(rateRaw) : undefined,
                });
              }}
              className="space-y-3"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input name="name" placeholder="Nome" required className={INPUT_CLASS} />
                <input name="email" type="email" placeholder="Email" required className={INPUT_CLASS} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input name="phone" placeholder="Telefone" className={INPUT_CLASS} />
                <select name="role" defaultValue="OPERATOR" className={INPUT_CLASS}>
                  <option value="OPERATOR">Operador</option>
                  <option value="LEAD">Chefe</option>
                  <option value="MANAGER">Gestor</option>
                </select>
              </div>
              <div>
                <label htmlFor="tm-hourly-rate" className="block text-xs font-medium text-neutral-600 mb-1">
                  Taxa horária (€/h)
                </label>
                <input
                  id="tm-hourly-rate"
                  name="hourlyRate"
                  placeholder="12.50"
                  type="number"
                  min="0"
                  step="0.01"
                  className={INPUT_CLASS}
                />
                <p className="text-[11px] text-neutral-500 mt-1">
                  Usada para calcular o custo de mão-de-obra em cada serviço.
                </p>
              </div>
              <div className="flex gap-2">
                <Button type="submit" size="sm" loading={createMut.isPending}>Guardar</Button>
                <Button type="button" size="sm" variant="ghost" onClick={() => setShowForm(false)}>
                  Cancelar
                </Button>
              </div>
            </form>
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
              <Card
                className="cursor-pointer hover:border-leaf-400 transition-colors"
                onClick={() => navigate(`/provider/team/${m.id}`)}
              >
                <CardBody>
                  <div className="flex items-start justify-between mb-2">
                    <div className="min-w-0">
                      <p className="font-medium text-neutral-900 truncate">{m.name}</p>
                      <p className="text-xs text-neutral-500 truncate">{m.email}</p>
                      {m.phone && <p className="text-xs text-neutral-500">{m.phone}</p>}
                    </div>
                    <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap', roleColors[m.role])}>
                      {roleLabels[m.role]}
                    </span>
                  </div>
                  <p className="text-xs font-medium text-neutral-700">
                    {m.hourlyRate != null
                      ? `${Number(m.hourlyRate).toFixed(2)} €/h`
                      : <span className="text-neutral-400">Sem taxa horária</span>}
                  </p>
                  <div className="flex justify-end mt-3 text-neutral-400">
                    <ChevronRight className="h-4 w-4" />
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
            <Button onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4" />Adicionar membro
            </Button>
          }
        />
      )}
    </AnimatedPage>
  );
}
