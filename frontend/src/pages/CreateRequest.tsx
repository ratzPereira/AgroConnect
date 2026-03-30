import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createRequest, publishRequest, getUploadUrl, confirmPhoto } from '@/api/requests';
import { apiClient } from '@/api/client';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { ArrowLeft, ArrowRight, Send, Camera } from 'lucide-react';
import { toast } from 'sonner';
import { LocationPicker } from '@/features/requests/components/LocationPicker';
import { DynamicForm } from '@/features/requests/components/DynamicForm';
import { WizardPhotoCollector } from '@/features/requests/components/WizardPhotoCollector';
import type { FormSchema } from '@/features/requests/components/DynamicForm';
import {
  AZORES_ISLANDS,
  AZORES_BOUNDS,
  AZORES_CENTER,
  findIsland,
  findMunicipality,
  findParish,
} from '@/features/requests/data/azoresLocations';
import type { CreateServiceRequestDto, Urgency } from '@/types/request';

interface CategoryResponse {
  id: number;
  name: string;
  slug: string;
  description: string;
  formSchema: string | null;
}

const SELECT_CLASS =
  'block w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-1';

const requestSchema = z.object({
  categoryId: z.string().min(1, 'Selecione uma categoria'),
  title: z.string().min(1, 'O título é obrigatório').max(255),
  description: z.string().min(1, 'A descrição é obrigatória'),
  latitude: z
    .number({ error: 'Marque a localização no mapa' })
    .min(AZORES_BOUNDS.minLat, 'A localização deve estar nos Açores')
    .max(AZORES_BOUNDS.maxLat, 'A localização deve estar nos Açores'),
  longitude: z
    .number({ error: 'Marque a localização no mapa' })
    .min(AZORES_BOUNDS.minLng, 'A localização deve estar nos Açores')
    .max(AZORES_BOUNDS.maxLng, 'A localização deve estar nos Açores'),
  island: z.string().min(1, 'Selecione uma ilha'),
  municipality: z.string().min(1, 'Selecione um município'),
  parish: z.string().optional(),
  urgency: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
});

type RequestFormData = z.infer<typeof requestSchema>;

const STEPS = ['Categoria', 'Detalhes', 'Localização', 'Fotografias', 'Revisão'];

export function CreateRequest() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(0);
  const [dynamicValues, setDynamicValues] = useState<Record<string, string>>({});
  const [dynamicErrors, setDynamicErrors] = useState<Record<string, string>>({});
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await apiClient.get<CategoryResponse[]>('/categories');
      return res.data;
    },
  });

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
    trigger,
  } = useForm<RequestFormData>({
    resolver: zodResolver(requestSchema) as never,
    defaultValues: {
      urgency: 'MEDIUM',
      island: '',
      municipality: '',
      parish: '',
    },
  });

  const values = watch();

  const selectedCategory = categories?.find((c) => String(c.id) === values.categoryId);

  const formSchema: FormSchema | null = useMemo(() => {
    if (!selectedCategory?.formSchema) return null;
    try {
      return JSON.parse(selectedCategory.formSchema) as FormSchema;
    } catch {
      return null;
    }
  }, [selectedCategory?.formSchema]);

  const handleDynamicChange = useCallback((name: string, value: string) => {
    setDynamicValues((prev) => ({ ...prev, [name]: value }));
    setDynamicErrors((prev) => {
      const next = { ...prev };
      delete next[name];
      return next;
    });
  }, []);

  async function uploadPhotos(requestId: number) {
    for (const file of photoFiles) {
      try {
        const { uploadUrl, publicUrl } = await getUploadUrl(requestId);
        const uploadResponse = await fetch(uploadUrl, {
          method: 'PUT',
          body: file,
          headers: { 'Content-Type': file.type },
        });
        if (!uploadResponse.ok) {
          throw new Error('Upload failed');
        }
        await confirmPhoto(requestId, publicUrl);
      } catch {
        toast.error(`Erro ao carregar foto: ${file.name}`);
      }
    }
  }

  const createMutation = useMutation({
    mutationFn: async (data: RequestFormData) => {
      const formData = Object.keys(dynamicValues).length > 0
        ? JSON.stringify(dynamicValues)
        : undefined;

      const dto: CreateServiceRequestDto = {
        categoryId: Number(data.categoryId),
        title: data.title,
        description: data.description,
        latitude: data.latitude,
        longitude: data.longitude,
        parish: data.parish || undefined,
        municipality: data.municipality,
        island: data.island,
        urgency: data.urgency as Urgency,
        formData,
      };
      const created = await createRequest(dto);

      if (photoFiles.length > 0) {
        await uploadPhotos(created.id);
      }

      const published = await publishRequest(created.id);
      return published;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['client-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['my-requests'] });
      navigate(`/requests/${data.id}`);
    },
  });

  // Cascading dropdowns: island → municipalities → parishes
  const selectedIslandData = useMemo(
    () => (values.island ? findIsland(values.island) : undefined),
    [values.island],
  );

  const municipalities = selectedIslandData?.municipalities ?? [];

  const selectedMunicipalityData = useMemo(
    () =>
      values.island && values.municipality
        ? findMunicipality(values.island, values.municipality)
        : undefined,
    [values.island, values.municipality],
  );

  const parishes = selectedMunicipalityData?.parishes ?? [];

  const selectedParishData = useMemo(
    () =>
      values.island && values.municipality && values.parish
        ? findParish(values.island, values.municipality, values.parish)
        : undefined,
    [values.island, values.municipality, values.parish],
  );

  const mapCenter = useMemo(() => {
    if (selectedParishData) {
      return {
        lat: selectedParishData.lat,
        lng: selectedParishData.lng,
        zoom: (selectedIslandData?.zoom ?? 11) + 3,
      };
    }
    if (selectedMunicipalityData) {
      return {
        lat: selectedMunicipalityData.lat,
        lng: selectedMunicipalityData.lng,
        zoom: (selectedIslandData?.zoom ?? 11) + 1,
      };
    }
    if (selectedIslandData) {
      return {
        lat: selectedIslandData.lat,
        lng: selectedIslandData.lng,
        zoom: selectedIslandData.zoom,
      };
    }
    return AZORES_CENTER;
  }, [selectedIslandData, selectedMunicipalityData, selectedParishData]);

  function handleIslandChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newIsland = e.target.value;
    setValue('island', newIsland);
    setValue('municipality', '');
    setValue('parish', '');
  }

  function handleMunicipalityChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newMunicipality = e.target.value;
    setValue('municipality', newMunicipality);
    setValue('parish', '');

    if (values.island && newMunicipality) {
      const muni = findMunicipality(values.island, newMunicipality);
      if (muni) {
        setValue('latitude', muni.lat);
        setValue('longitude', muni.lng);
      }
    }
  }

  function handleParishChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newParish = e.target.value;
    setValue('parish', newParish);

    if (values.island && values.municipality && newParish) {
      const parish = findParish(values.island, values.municipality, newParish);
      if (parish) {
        setValue('latitude', parish.lat);
        setValue('longitude', parish.lng);
      }
    }
  }

  function handleMapClick(lat: number, lng: number) {
    setValue('latitude', lat);
    setValue('longitude', lng);
  }

  function distanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  const pinTooFar = useMemo(() => {
    if (!selectedParishData || values.latitude == null || values.longitude == null) return false;
    const dist = distanceKm(
      values.latitude,
      values.longitude,
      selectedParishData.lat,
      selectedParishData.lng,
    );
    return dist > 5;
  }, [selectedParishData, values.latitude, values.longitude]);

  function validateDynamicFields(): boolean {
    if (!formSchema?.fields) return true;
    const newErrors: Record<string, string> = {};
    for (const field of formSchema.fields) {
      if (field.required && !dynamicValues[field.name]?.trim()) {
        newErrors[field.name] = `${field.label} é obrigatório.`;
      }
    }
    setDynamicErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleNext() {
    const fieldsToValidate: (keyof RequestFormData)[][] = [
      ['categoryId'],
      ['title', 'description', 'urgency'],
      ['island', 'municipality', 'latitude', 'longitude'],
      [], // photos — no validation needed
      [], // review
    ];

    if (step === 1) {
      const valid = await trigger(fieldsToValidate[step]);
      const dynamicValid = validateDynamicFields();
      if (valid && dynamicValid) setStep((s) => s + 1);
    } else {
      const valid = await trigger(fieldsToValidate[step]);
      if (valid && !(step === 2 && pinTooFar)) setStep((s) => s + 1);
    }
  }

  const locationError =
    errors.latitude?.message || errors.longitude?.message;

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

      <form onSubmit={(e) => e.preventDefault()}>
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

        {/* Step 1: Details + Dynamic Form */}
        {step === 1 && (
          <Card>
            <CardHeader>
              <h2 className="font-semibold text-neutral-900">Detalhes do pedido</h2>
            </CardHeader>
            <CardBody>
              <div className="mb-4">
                <Input
                  label="Título"
                  id="title"
                  placeholder="Ex: Lavoura de terreno para plantação de milho"
                  error={errors.title?.message}
                  {...register('title')}
                />
              </div>
              <div className="mb-4">
                <label htmlFor="description" className="block text-sm font-medium text-neutral-700 mb-1.5">
                  Descrição
                </label>
                <textarea
                  id="description"
                  rows={4}
                  placeholder="Descreva o que precisa em detalhe..."
                  className="block w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-1"
                  {...register('description')}
                />
                {errors.description && <p className="text-xs text-red-600 mt-1">{errors.description.message}</p>}
              </div>
              <div className="mb-4">
                <label htmlFor="urgency" className="block text-sm font-medium text-neutral-700 mb-1.5">
                  Urgência
                </label>
                <select id="urgency" className={SELECT_CLASS} {...register('urgency')}>
                  <option value="LOW">Baixa</option>
                  <option value="MEDIUM">Média</option>
                  <option value="HIGH">Alta</option>
                </select>
              </div>

              {/* Dynamic fields from category form_schema */}
              {formSchema && (
                <div className="mt-6 pt-4 border-t border-neutral-200">
                  <DynamicForm
                    schema={formSchema}
                    values={dynamicValues}
                    onChange={handleDynamicChange}
                    errors={dynamicErrors}
                  />
                </div>
              )}
            </CardBody>
          </Card>
        )}

        {/* Step 2: Location */}
        {step === 2 && (
          <Card>
            <CardHeader>
              <h2 className="font-semibold text-neutral-900">Localização</h2>
              <p className="text-sm text-neutral-500 mt-1">
                Selecione a ilha e o município, depois clique no mapa para marcar o local exato.
              </p>
            </CardHeader>
            <CardBody>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
                <div>
                  <label htmlFor="island" className="block text-sm font-medium text-neutral-700 mb-1.5">
                    Ilha *
                  </label>
                  <select
                    id="island"
                    className={SELECT_CLASS}
                    value={values.island ?? ''}
                    onChange={handleIslandChange}
                  >
                    <option value="">Selecione...</option>
                    {AZORES_ISLANDS.map((island) => (
                      <option key={island.name} value={island.name}>
                        {island.name}
                      </option>
                    ))}
                  </select>
                  {errors.island && <p className="text-xs text-red-600 mt-1">{errors.island.message}</p>}
                </div>

                <div>
                  <label htmlFor="municipality" className="block text-sm font-medium text-neutral-700 mb-1.5">
                    Município *
                  </label>
                  <select
                    id="municipality"
                    className={SELECT_CLASS}
                    value={values.municipality ?? ''}
                    onChange={handleMunicipalityChange}
                    disabled={!values.island}
                  >
                    <option value="">Selecione...</option>
                    {municipalities.map((m) => (
                      <option key={m.name} value={m.name}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                  {errors.municipality && <p className="text-xs text-red-600 mt-1">{errors.municipality.message}</p>}
                </div>

                <div>
                  <label htmlFor="parish" className="block text-sm font-medium text-neutral-700 mb-1.5">
                    Freguesia
                  </label>
                  <select
                    id="parish"
                    className={SELECT_CLASS}
                    value={values.parish ?? ''}
                    onChange={handleParishChange}
                    disabled={!values.municipality}
                  >
                    <option value="">Selecione...</option>
                    {parishes.map((p) => (
                      <option key={p.name} value={p.name}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <LocationPicker
                lat={values.latitude ?? null}
                lng={values.longitude ?? null}
                onChange={handleMapClick}
                center={mapCenter}
              />
              {locationError && (
                <p className="text-xs text-red-600 mt-2">{locationError}</p>
              )}
              {pinTooFar && (
                <p className="text-xs text-red-600 mt-2">
                  O pino está demasiado longe da freguesia selecionada. Ajuste o pino ou altere a freguesia.
                </p>
              )}
            </CardBody>
          </Card>
        )}

        {/* Step 3: Photos */}
        {step === 3 && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Camera className="h-5 w-5 text-neutral-500" />
                <h2 className="font-semibold text-neutral-900">Fotografias</h2>
              </div>
              <p className="text-sm text-neutral-500 mt-1">
                Adicione fotos do terreno ou local de trabalho para os prestadores terem mais contexto.
              </p>
            </CardHeader>
            <CardBody>
              <WizardPhotoCollector
                files={photoFiles}
                onChange={setPhotoFiles}
                maxPhotos={10}
              />
            </CardBody>
          </Card>
        )}

        {/* Step 4: Review */}
        {step === 4 && (
          <Card>
            <CardHeader>
              <h2 className="font-semibold text-neutral-900">Revisão</h2>
            </CardHeader>
            <CardBody>
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

                {/* Dynamic form data in review */}
                {formSchema?.fields && Object.keys(dynamicValues).length > 0 && (
                  <>
                    {formSchema.fields.map((field) =>
                      dynamicValues[field.name] ? (
                        <div key={field.name}>
                          <p className="text-neutral-500">{field.label}</p>
                          <p className="font-medium text-neutral-900">
                            {dynamicValues[field.name]} {field.unit ?? ''}
                          </p>
                        </div>
                      ) : null,
                    )}
                  </>
                )}

                <div className="col-span-2">
                  <p className="text-neutral-500">Localização</p>
                  <p className="font-medium text-neutral-900">
                    {[values.parish, values.municipality, values.island].filter(Boolean).join(', ')}
                  </p>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    {values.latitude}, {values.longitude}
                  </p>
                </div>

                {photoFiles.length > 0 && (
                  <div className="col-span-2">
                    <p className="text-neutral-500">Fotografias</p>
                    <p className="font-medium text-neutral-900">{photoFiles.length} foto(s)</p>
                  </div>
                )}
              </div>
              {createMutation.isError && (
                <p className="text-sm text-red-600 mt-4">
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
            <Button
              type="button"
              loading={createMutation.isPending}
              onClick={handleSubmit(((data: RequestFormData) => createMutation.mutate(data)) as never)}
            >
              <Send className="h-4 w-4" />
              Publicar Pedido
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
