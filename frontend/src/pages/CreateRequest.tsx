import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { createRequest, publishRequest } from '@/api/requests';
import { apiClient } from '@/api/client';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { ArrowLeft, ArrowRight, Send } from 'lucide-react';
import type { CreateServiceRequestDto, Urgency } from '@/types/request';

interface CategoryResponse {
  id: number;
  name: string;
  slug: string;
  description: string;
}

const requestSchema = z.object({
  categoryId: z.string().min(1, 'Selecione uma categoria'),
  title: z.string().min(1, 'O título é obrigatório').max(255),
  description: z.string().min(1, 'A descrição é obrigatória'),
  latitude: z.string().min(1, 'Latitude é obrigatória'),
  longitude: z.string().min(1, 'Longitude é obrigatória'),
  parish: z.string().optional(),
  municipality: z.string().optional(),
  island: z.string().optional(),
  area: z.string().optional(),
  areaUnit: z.string().optional(),
  urgency: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
});

type RequestFormData = z.infer<typeof requestSchema>;

const STEPS = ['Categoria', 'Detalhes', 'Localização', 'Revisão'];

export function CreateRequest() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await apiClient.get<CategoryResponse[]>('/categories');
      return res.data;
    },
  });

  const { register, handleSubmit, watch, formState: { errors }, trigger } = useForm<RequestFormData>({
    resolver: zodResolver(requestSchema) as never,
    defaultValues: {
      urgency: 'MEDIUM',
      areaUnit: 'hectares',
      latitude: '38.7167',
      longitude: '-27.2167',
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: RequestFormData) => {
      const dto: CreateServiceRequestDto = {
        categoryId: Number(data.categoryId),
        title: data.title,
        description: data.description,
        latitude: Number(data.latitude),
        longitude: Number(data.longitude),
        parish: data.parish || undefined,
        municipality: data.municipality || undefined,
        island: data.island || undefined,
        area: data.area ? Number(data.area) : undefined,
        areaUnit: data.areaUnit || undefined,
        urgency: data.urgency as Urgency,
      };
      const created = await createRequest(dto);
      await publishRequest(created.id);
      return created;
    },
    onSuccess: (data) => {
      navigate(`/requests/${data.id}`);
    },
  });

  const values = watch();

  async function handleNext() {
    const fieldsToValidate: (keyof RequestFormData)[][] = [
      ['categoryId'],
      ['title', 'description', 'urgency'],
      ['latitude', 'longitude'],
      [],
    ];
    const valid = await trigger(fieldsToValidate[step]);
    if (valid) setStep((s) => s + 1);
  }

  const selectedCategory = categories?.find((c) => String(c.id) === values.categoryId);

  return (
    <div className="animate-fade-in max-w-2xl mx-auto">
      <button
        onClick={() => step === 0 ? navigate('/requests') : setStep((s) => s - 1)}
        className="inline-flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-700 mb-4"
      >
        <ArrowLeft className="h-4 w-4" />
        {step === 0 ? 'Voltar aos pedidos' : 'Voltar'}
      </button>

      <h1 className="text-[28px] font-bold font-display leading-tight text-neutral-900 mb-2">
        Novo Pedido de Serviço
      </h1>

      {/* Step indicator */}
      <div className="flex gap-2 mb-6">
        {STEPS.map((label, i) => (
          <div key={label} className="flex-1">
            <div className={`h-1 rounded-full ${i <= step ? 'bg-green-600' : 'bg-neutral-200'}`} />
            <p className={`text-xs mt-1 ${i <= step ? 'text-green-700 font-medium' : 'text-neutral-400'}`}>
              {label}
            </p>
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit(((data: RequestFormData) => createMutation.mutate(data)) as never)}>
        {/* Step 0: Category */}
        {step === 0 && (
          <Card>
            <CardHeader>
              <h2 className="font-semibold text-neutral-900">Selecione a categoria</h2>
            </CardHeader>
            <CardBody>
              <div className="grid gap-3 sm:grid-cols-2">
                {categories?.map((cat) => (
                  <label
                    key={cat.id}
                    className={`flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-colors ${
                      values.categoryId === String(cat.id)
                        ? 'border-green-600 bg-green-50'
                        : 'border-neutral-200 hover:border-neutral-300'
                    }`}
                  >
                    <input
                      type="radio"
                      value={cat.id}
                      className="sr-only"
                      {...register('categoryId')}
                    />
                    <div>
                      <p className="text-sm font-medium text-neutral-900">{cat.name}</p>
                      {cat.description && (
                        <p className="text-xs text-neutral-500 mt-0.5">{cat.description}</p>
                      )}
                    </div>
                  </label>
                ))}
              </div>
              {errors.categoryId && <p className="text-xs text-red-600 mt-2">{errors.categoryId.message}</p>}
            </CardBody>
          </Card>
        )}

        {/* Step 1: Details */}
        {step === 1 && (
          <Card>
            <CardHeader>
              <h2 className="font-semibold text-neutral-900">Detalhes do pedido</h2>
            </CardHeader>
            <CardBody className="space-y-4">
              <Input
                label="Título"
                id="title"
                placeholder="Ex: Lavoura de terreno para plantação de milho"
                error={errors.title?.message}
                {...register('title')}
              />
              <div className="space-y-1.5">
                <label htmlFor="description" className="block text-sm font-medium text-neutral-700">
                  Descrição
                </label>
                <textarea
                  id="description"
                  rows={4}
                  placeholder="Descreva o que precisa em detalhe..."
                  className="block w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-1"
                  {...register('description')}
                />
                {errors.description && <p className="text-xs text-red-600">{errors.description.message}</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Área"
                  type="number"
                  step="0.1"
                  id="area"
                  placeholder="Ex: 2.5"
                  error={errors.area?.message}
                  {...register('area')}
                />
                <div className="space-y-1.5">
                  <label htmlFor="areaUnit" className="block text-sm font-medium text-neutral-700">
                    Unidade
                  </label>
                  <select
                    id="areaUnit"
                    className="block w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-1"
                    {...register('areaUnit')}
                  >
                    <option value="hectares">Hectares</option>
                    <option value="m2">m²</option>
                    <option value="alqueires">Alqueires</option>
                  </select>
                </div>
              </div>
              <div className="space-y-1.5">
                <label htmlFor="urgency" className="block text-sm font-medium text-neutral-700">
                  Urgência
                </label>
                <select
                  id="urgency"
                  className="block w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-1"
                  {...register('urgency')}
                >
                  <option value="LOW">Baixa</option>
                  <option value="MEDIUM">Média</option>
                  <option value="HIGH">Alta</option>
                </select>
              </div>
            </CardBody>
          </Card>
        )}

        {/* Step 2: Location */}
        {step === 2 && (
          <Card>
            <CardHeader>
              <h2 className="font-semibold text-neutral-900">Localização</h2>
            </CardHeader>
            <CardBody className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Latitude"
                  type="number"
                  step="0.0001"
                  id="latitude"
                  error={errors.latitude?.message}
                  {...register('latitude')}
                />
                <Input
                  label="Longitude"
                  type="number"
                  step="0.0001"
                  id="longitude"
                  error={errors.longitude?.message}
                  {...register('longitude')}
                />
              </div>
              <Input label="Freguesia" id="parish" {...register('parish')} />
              <Input label="Município" id="municipality" {...register('municipality')} />
              <Input label="Ilha" id="island" {...register('island')} />
            </CardBody>
          </Card>
        )}

        {/* Step 3: Review */}
        {step === 3 && (
          <Card>
            <CardHeader>
              <h2 className="font-semibold text-neutral-900">Revisão</h2>
            </CardHeader>
            <CardBody className="space-y-3">
              <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                <div>
                  <p className="text-neutral-500">Categoria</p>
                  <p className="font-medium text-neutral-900">{selectedCategory?.name}</p>
                </div>
                <div>
                  <p className="text-neutral-500">Urgência</p>
                  <p className="font-medium text-neutral-900">
                    {{ LOW: 'Baixa', MEDIUM: 'Média', HIGH: 'Alta' }[values.urgency ?? 'MEDIUM']}
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="text-neutral-500">Título</p>
                  <p className="font-medium text-neutral-900">{values.title}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-neutral-500">Descrição</p>
                  <p className="font-medium text-neutral-900">{values.description}</p>
                </div>
                {values.area && (
                  <div>
                    <p className="text-neutral-500">Área</p>
                    <p className="font-medium text-neutral-900">{values.area} {values.areaUnit}</p>
                  </div>
                )}
                <div>
                  <p className="text-neutral-500">Localização</p>
                  <p className="font-medium text-neutral-900">
                    {[values.parish, values.municipality, values.island].filter(Boolean).join(', ') || `${values.latitude}, ${values.longitude}`}
                  </p>
                </div>
              </div>
              {createMutation.isError && (
                <p className="text-sm text-red-600 mt-2">
                  Ocorreu um erro ao criar o pedido. Tente novamente.
                </p>
              )}
            </CardBody>
          </Card>
        )}

        {/* Navigation buttons */}
        <div className="flex justify-between mt-6">
          {step > 0 ? (
            <Button type="button" variant="outline" onClick={() => setStep((s) => s - 1)}>
              <ArrowLeft className="h-4 w-4" />
              Anterior
            </Button>
          ) : (
            <div />
          )}
          {step < STEPS.length - 1 ? (
            <Button type="button" onClick={handleNext}>
              Seguinte
              <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button type="submit" loading={createMutation.isPending}>
              <Send className="h-4 w-4" />
              Publicar Pedido
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
