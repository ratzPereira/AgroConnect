import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { listUsers, banUser, unbanUser } from '@/api/admin';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Loader2, Ban, CheckCircle } from 'lucide-react';
import type { Role } from '@/types/auth';

const roleLabels: Record<Role, string> = {
  ADMIN: 'Admin',
  CLIENT: 'Cliente',
  PROVIDER_MANAGER: 'Prestador',
  PROVIDER_LEAD: 'Chefe Equipa',
  PROVIDER_OPERATOR: 'Operador',
};

export function AdminUsers() {
  const queryClient = useQueryClient();
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [page, setPage] = useState(0);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', roleFilter, page],
    queryFn: () => listUsers(roleFilter || undefined, page),
  });

  const banMut = useMutation({
    mutationFn: (id: number) => banUser(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-users'] }),
  });

  const unbanMut = useMutation({
    mutationFn: (id: number) => unbanUser(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-users'] }),
  });

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-neutral-900">Utilizadores</h1>
        <select value={roleFilter} onChange={(e) => { setRoleFilter(e.target.value); setPage(0); }} className="rounded-lg border border-neutral-300 px-3 py-2 text-sm">
          <option value="">Todos os papéis</option>
          <option value="CLIENT">Clientes</option>
          <option value="PROVIDER_MANAGER">Prestadores</option>
          <option value="ADMIN">Admins</option>
        </select>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-neutral-200 text-left text-neutral-500">
              <th className="px-6 py-3 font-medium">Nome</th>
              <th className="px-6 py-3 font-medium">Email</th>
              <th className="px-6 py-3 font-medium">Papel</th>
              <th className="px-6 py-3 font-medium">Estado</th>
              <th className="px-6 py-3 font-medium">Pedidos</th>
              <th className="px-6 py-3 font-medium">Propostas</th>
              <th className="px-6 py-3 font-medium">Registado</th>
              <th className="px-6 py-3"></th>
            </tr></thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={8} className="text-center py-8"><Loader2 className="h-5 w-5 animate-spin text-neutral-400 mx-auto" /></td></tr>
              ) : data?.content?.map((user) => (
                <tr key={user.id} className="border-b border-neutral-100">
                  <td className="px-6 py-3 font-medium text-neutral-900">{user.name}</td>
                  <td className="px-6 py-3 text-neutral-600">{user.email}</td>
                  <td className="px-6 py-3"><span className="text-xs font-medium px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-700">{roleLabels[user.role]}</span></td>
                  <td className="px-6 py-3">{user.active
                    ? <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-green-100 text-green-700">Ativo</span>
                    : <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-red-100 text-red-700">Banido</span>}
                  </td>
                  <td className="px-6 py-3 text-neutral-600">{user.requestCount}</td>
                  <td className="px-6 py-3 text-neutral-600">{user.proposalCount}</td>
                  <td className="px-6 py-3 text-neutral-500">{new Date(user.createdAt).toLocaleDateString('pt-PT')}</td>
                  <td className="px-6 py-3">
                    {user.active ? (
                      <Button size="sm" variant="danger" onClick={() => banMut.mutate(user.id)} loading={banMut.isPending}>
                        <Ban className="h-3.5 w-3.5" />Banir
                      </Button>
                    ) : (
                      <Button size="sm" variant="secondary" onClick={() => unbanMut.mutate(user.id)} loading={unbanMut.isPending}>
                        <CheckCircle className="h-3.5 w-3.5" />Desbanir
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {data && data.totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 px-6 py-4 border-t border-neutral-100">
            <Button size="sm" variant="ghost" disabled={data.first} onClick={() => setPage((p) => p - 1)}>Anterior</Button>
            <span className="text-sm text-neutral-500">Página {data.number + 1} de {data.totalPages}</span>
            <Button size="sm" variant="ghost" disabled={data.last} onClick={() => setPage((p) => p + 1)}>Seguinte</Button>
          </div>
        )}
      </Card>
    </div>
  );
}
