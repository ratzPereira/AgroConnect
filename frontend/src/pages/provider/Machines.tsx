import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { listMachines, createMachine } from '@/api/machines';
import { Card, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { AnimatedPage } from '@/components/AnimatedPage';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { EmptyRequests } from '@/components/illustrations/EmptyRequests';
import { useMotionConfig } from '@/hooks/useMotionConfig';
import { Plus, ChevronRight } from 'lucide-react';
import { cn } from '@/utils/cn';
import type { MachineStatus, CreateMachineRequest } from '@/types/machine';

const statusLabels: Record<MachineStatus, string> = {
  AVAILABLE: 'Disponível',
  IN_USE: 'Em uso',
  MAINTENANCE: 'Manutenção',
  RETIRED: 'Retirada',
};
const statusColors: Record<MachineStatus, string> = {
  AVAILABLE: 'bg-leaf-100 text-leaf-700',
  IN_USE: 'bg-blue-100 text-blue-700',
  MAINTENANCE: 'bg-warning-100 text-warning-700',
  RETIRED: 'bg-neutral-100 text-neutral-500',
};

const INPUT_CLASS = 'rounded-lg border border-neutral-300 px-3 py-2 text-sm w-full';

export function Machines() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const { listContainerVariants, listItemVariants } = useMotionConfig();

  const { data: machines, isLoading } = useQuery({
    queryKey: ['machines'],
    queryFn: () => listMachines(),
  });

  const createMut = useMutation({
    mutationFn: (data: CreateMachineRequest) => createMachine(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['machines'] });
      setShowForm(false);
    },
  });

  return (
    <AnimatedPage>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-neutral-900">Máquinas</h1>
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
                createMut.mutate({
                  name: fd.get('name') as string,
                  type: (fd.get('type') as string) || undefined,
                  description: (fd.get('description') as string) || undefined,
                  licensePlate: (fd.get('licensePlate') as string) || undefined,
                });
              }}
              className="space-y-3"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input name="name" placeholder="Nome da máquina" required className={INPUT_CLASS} />
                <input name="type" placeholder="Tipo (ex: Trator)" className={INPUT_CLASS} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input name="licensePlate" placeholder="Matrícula" className={INPUT_CLASS} />
                <input name="description" placeholder="Descrição" className={INPUT_CLASS} />
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
      ) : machines && machines.length > 0 ? (
        <motion.div
          variants={listContainerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {machines.map((m) => (
            <motion.div variants={listItemVariants} key={m.id}>
              <Card
                className="cursor-pointer hover:border-leaf-400 transition-colors"
                onClick={() => navigate(`/provider/machines/${m.id}`)}
              >
                <CardBody>
                  <div className="flex items-start justify-between mb-2">
                    <div className="min-w-0">
                      <p className="font-medium text-neutral-900 truncate">{m.name}</p>
                      {m.type && <p className="text-xs text-neutral-500">{m.type}</p>}
                    </div>
                    <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap', statusColors[m.status])}>
                      {statusLabels[m.status]}
                    </span>
                  </div>
                  {m.description && (
                    <p className="text-xs text-neutral-500 mb-1 line-clamp-2">{m.description}</p>
                  )}
                  {m.licensePlate && (
                    <p className="text-xs text-neutral-500">Matrícula: {m.licensePlate}</p>
                  )}
                  {m.nextMaintenanceDate && (
                    <p className="text-xs text-neutral-500">Próx. manutenção: {m.nextMaintenanceDate}</p>
                  )}
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
          illustration={<EmptyRequests className="w-48 h-auto" />}
          title="Sem máquinas registadas"
          description="Registe as suas máquinas para acompanhar a disponibilidade e manutenção."
          action={
            <Button onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4" />Adicionar máquina
            </Button>
          }
        />
      )}
    </AnimatedPage>
  );
}
