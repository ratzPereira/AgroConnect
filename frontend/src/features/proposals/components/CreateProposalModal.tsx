import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { X } from 'lucide-react';
import type { CreateProposalDto } from '@/types/proposal';

const proposalSchema = z.object({
  price: z.string().min(1, 'O preço é obrigatório'),
  description: z.string().min(1, 'A descrição é obrigatória'),
  includesText: z.string().optional(),
  excludesText: z.string().optional(),
});

type ProposalFormData = z.infer<typeof proposalSchema>;

interface CreateProposalModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreateProposalDto) => Promise<void>;
  loading?: boolean;
}

export function CreateProposalModal({ open, onClose, onSubmit, loading }: CreateProposalModalProps) {
  const { register, handleSubmit, formState: { errors }, reset } = useForm<ProposalFormData>({
    resolver: zodResolver(proposalSchema) as never,
  });

  if (!open) return null;

  async function handleFormSubmit(data: ProposalFormData) {
    await onSubmit({
      price: Number(data.price),
      description: data.description,
      includesText: data.includesText || undefined,
      excludesText: data.excludesText || undefined,
    });
    reset();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100">
          <h2 className="text-lg font-semibold text-neutral-900">Submeter Proposta</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-neutral-100 transition-colors">
            <X className="h-5 w-5 text-neutral-500" />
          </button>
        </div>
        <form onSubmit={handleSubmit(handleFormSubmit as never)} className="px-6 py-4 space-y-4">
          <Input
            label="Preço total (EUR)"
            type="number"
            step="0.01"
            id="price"
            error={errors.price?.message}
            {...register('price')}
          />
          <div className="space-y-1.5">
            <label htmlFor="description" className="block text-sm font-medium text-neutral-700">
              Descrição da proposta
            </label>
            <textarea
              id="description"
              rows={3}
              className="block w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-1"
              {...register('description')}
            />
            {errors.description && <p className="text-xs text-red-600">{errors.description.message}</p>}
          </div>
          <Input
            label="O que inclui"
            id="includesText"
            placeholder="Ex: Combustível, operador, transporte"
            {...register('includesText')}
          />
          <Input
            label="O que exclui"
            id="excludesText"
            placeholder="Ex: Remoção de pedras, drenagem"
            {...register('excludesText')}
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" loading={loading}>
              Submeter
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
