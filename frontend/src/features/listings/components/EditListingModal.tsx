import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateListing } from '@/api/listings';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Save } from 'lucide-react';
import { toast } from 'sonner';
import type { Listing, ListingCondition, UpdateListingDto } from '@/types/listing';

interface EditListingModalProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly listing: Listing;
}

const editSchema = z.object({
  title: z.string().min(3, 'Título deve ter pelo menos 3 caracteres.').max(200, 'Máximo 200 caracteres.'),
  description: z.string().min(10, 'Descrição deve ter pelo menos 10 caracteres.'),
  price: z
    .string()
    .refine((v) => v === '' || (!Number.isNaN(Number(v)) && Number(v) >= 0), {
      message: 'Preço deve ser zero ou positivo.',
    }),
  priceNegotiable: z.boolean(),
  condition: z.enum(['NEW', 'LIKE_NEW', 'USED', '']).optional(),
  quantity: z
    .string()
    .refine((v) => v === '' || (!Number.isNaN(Number(v)) && Number(v) >= 0), {
      message: 'Quantidade deve ser zero ou positiva.',
    }),
  unit: z.string().max(30, 'Máximo 30 caracteres.'),
  locationName: z.string().max(200, 'Máximo 200 caracteres.'),
});

type EditFormValues = z.infer<typeof editSchema>;

const CONDITION_OPTIONS = [
  { value: '', label: '—' },
  { value: 'NEW', label: 'Novo' },
  { value: 'LIKE_NEW', label: 'Semi-novo' },
  { value: 'USED', label: 'Usado' },
];

const UNIT_OPTIONS = [
  { value: '', label: '—' },
  { value: 'kg', label: 'Quilogramas (kg)' },
  { value: 'un', label: 'Unidades' },
  { value: 'lt', label: 'Litros' },
  { value: 'ton', label: 'Toneladas' },
  { value: 'dz', label: 'Dúzias' },
  { value: 'cx', label: 'Caixas' },
  { value: 'cabeças', label: 'Cabeças' },
];

export function EditListingModal({ open, onClose, listing }: EditListingModalProps) {
  const queryClient = useQueryClient();
  const showCondition = listing.category === 'EQUIPMENT';
  const showQuantity = listing.category !== 'EQUIPMENT';

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isDirty },
  } = useForm<EditFormValues>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      title: listing.title,
      description: listing.description,
      price: listing.price === null ? '' : String(listing.price),
      priceNegotiable: listing.priceNegotiable,
      condition: (listing.condition ?? '') as ListingCondition | '',
      quantity: listing.quantity === null ? '' : String(listing.quantity),
      unit: listing.unit ?? '',
      locationName: listing.locationName ?? '',
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        title: listing.title,
        description: listing.description,
        price: listing.price === null ? '' : String(listing.price),
        priceNegotiable: listing.priceNegotiable,
        condition: (listing.condition ?? '') as ListingCondition | '',
        quantity: listing.quantity === null ? '' : String(listing.quantity),
        unit: listing.unit ?? '',
        locationName: listing.locationName ?? '',
      });
    }
  }, [open, listing, reset]);

  const mut = useMutation({
    mutationFn: (data: UpdateListingDto) => updateListing(listing.id, data),
    onSuccess: (updated) => {
      queryClient.setQueryData(['listing', listing.id], updated);
      queryClient.invalidateQueries({ queryKey: ['my-listings'] });
      queryClient.invalidateQueries({ queryKey: ['listings'] });
      toast.success('Anúncio atualizado');
      onClose();
    },
    onError: () => {
      toast.error('Erro ao atualizar anúncio. Tente novamente.');
    },
  });

  function onSubmit(values: EditFormValues) {
    const payload: UpdateListingDto = {
      title: values.title.trim(),
      description: values.description.trim(),
      price: values.price === '' ? null : Number(values.price),
      priceNegotiable: values.priceNegotiable,
      condition: showCondition && values.condition !== '' ? (values.condition as ListingCondition) : null,
      quantity: showQuantity && values.quantity !== '' ? Number(values.quantity) : null,
      unit: showQuantity && values.unit !== '' ? values.unit : null,
      locationName: values.locationName === '' ? null : values.locationName,
    };
    mut.mutate(payload);
  }

  return (
    <Modal open={open} onClose={onClose} title="Editar Anúncio" size="lg">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Título"
          {...register('title')}
          error={errors.title?.message}
        />

        <div>
          <label htmlFor="edit-description" className="block text-sm font-medium text-neutral-700 mb-1.5">
            Descrição
          </label>
          <textarea
            id="edit-description"
            {...register('description')}
            rows={4}
            className="block w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-1"
          />
          {errors.description && (
            <p role="alert" className="mt-1 text-xs text-red-600">
              {errors.description.message}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Preço (EUR)"
            type="number"
            step="0.01"
            placeholder="Deixe vazio para 'sob consulta'"
            {...register('price')}
            error={errors.price?.message}
          />
          <div className="flex items-center pt-7">
            <label className="inline-flex items-center gap-2 text-sm text-neutral-700 cursor-pointer">
              <input
                type="checkbox"
                {...register('priceNegotiable')}
                className="rounded border-neutral-300 text-green-600 focus:ring-green-500"
              />
              Preço negociável
            </label>
          </div>
        </div>

        {showCondition && (
          <Controller
            control={control}
            name="condition"
            render={({ field }) => (
              <Select
                label="Estado"
                options={CONDITION_OPTIONS}
                value={field.value ?? ''}
                onChange={field.onChange}
              />
            )}
          />
        )}

        {showQuantity && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Quantidade"
              type="number"
              step="0.01"
              {...register('quantity')}
              error={errors.quantity?.message}
            />
            <Controller
              control={control}
              name="unit"
              render={({ field }) => (
                <Select
                  label="Unidade"
                  options={UNIT_OPTIONS}
                  value={field.value ?? ''}
                  onChange={field.onChange}
                />
              )}
            />
          </div>
        )}

        <Input
          label="Nome da localização (opcional)"
          placeholder="Ex: Quinta da Ribeira Grande"
          {...register('locationName')}
          error={errors.locationName?.message}
        />

        <div className="flex justify-end gap-3 pt-2 border-t border-neutral-100">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" loading={mut.isPending} disabled={!isDirty}>
            <Save className="h-4 w-4" />
            Guardar Alterações
          </Button>
        </div>
      </form>
    </Modal>
  );
}
