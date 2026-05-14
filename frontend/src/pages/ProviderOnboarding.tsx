import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { updateProviderProfile } from '@/api/profile';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { LocationPicker } from '@/features/requests/components/LocationPicker';
import {
  AZORES_ISLANDS,
  AZORES_BOUNDS,
  AZORES_CENTER,
  findIsland,
  findMunicipality,
  findParish,
} from '@/features/requests/data/azoresLocations';
import { ArrowRight, MapPin, CheckCircle } from 'lucide-react';

const SELECT_CLASS =
  'block w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-1';

const onboardingSchema = z.object({
  island: z.string().min(1, 'Selecione uma ilha'),
  municipality: z.string().min(1, 'Selecione um municipio'),
  parish: z.string().optional(),
  latitude: z
    .number({ error: 'Marque a localizacao no mapa' })
    .min(AZORES_BOUNDS.minLat, 'A localizacao deve estar nos Acores')
    .max(AZORES_BOUNDS.maxLat, 'A localizacao deve estar nos Acores'),
  longitude: z
    .number({ error: 'Marque a localizacao no mapa' })
    .min(AZORES_BOUNDS.minLng, 'A localizacao deve estar nos Acores')
    .max(AZORES_BOUNDS.maxLng, 'A localizacao deve estar nos Acores'),
  serviceRadiusKm: z
    .string()
    .min(1, 'Indique o raio de servico')
    .transform(Number)
    .refine((v) => v > 0 && v <= 200, 'O raio deve ser entre 1 e 200 km'),
  phone: z.string().optional(),
  description: z.string().max(1000, 'Maximo 1000 caracteres').optional(),
});

type OnboardingFormData = z.infer<typeof onboardingSchema>;

const STEPS = ['Localizacao', 'Area de Servico', 'Concluir'];

export function ProviderOnboarding() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(0);

  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors },
    trigger,
  } = useForm<OnboardingFormData>({
    resolver: zodResolver(onboardingSchema) as never,
    defaultValues: {
      island: '',
      municipality: '',
      parish: '',
      serviceRadiusKm: '' as unknown as number,
      phone: '',
      description: '',
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (data: OnboardingFormData) => {
      return updateProviderProfile({
        island: data.island,
        municipality: data.municipality,
        parish: data.parish || undefined,
        latitude: data.latitude,
        longitude: data.longitude,
        serviceRadiusKm: Number(data.serviceRadiusKm),
        phone: data.phone || undefined,
        description: data.description || undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-profile'] });
      toast.success('Perfil configurado com sucesso!');
      navigate('/dashboard', { replace: true });
    },
    onError: () => {
      toast.error('Erro ao guardar o perfil. Tente novamente.');
    },
  });

  const values = useWatch({ control }) as Partial<OnboardingFormData>;

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
    setValue('island', e.target.value);
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
      const p = findParish(values.island, values.municipality, newParish);
      if (p) {
        setValue('latitude', p.lat);
        setValue('longitude', p.lng);
      }
    }
  }

  function handleMapClick(lat: number, lng: number) {
    setValue('latitude', lat);
    setValue('longitude', lng);
  }

  async function handleNext() {
    const fieldsToValidate: (keyof OnboardingFormData)[][] = [
      ['island', 'municipality', 'latitude', 'longitude'],
      ['serviceRadiusKm'],
      [],
    ];
    const valid = await trigger(fieldsToValidate[step]);
    if (valid) setStep((s) => s + 1);
  }

  const locationError = errors.latitude?.message || errors.longitude?.message;

  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-green-100 mb-4">
            <MapPin className="h-7 w-7 text-green-600" />
          </div>
          <h1 className="text-[28px] font-bold font-display leading-tight text-neutral-900">
            Configure a sua area de atuacao
          </h1>
          <p className="text-neutral-500 mt-2">
            Indique onde opera para receber pedidos relevantes na sua zona.
          </p>
        </div>

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
          {/* Step 0: Location */}
          {step === 0 && (
            <Card>
              <CardHeader>
                <h2 className="font-semibold text-neutral-900">Onde esta a sua sede?</h2>
                <p className="text-sm text-neutral-500 mt-1">
                  Selecione a ilha e municipio, depois ajuste o pino no mapa.
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
                      Municipio *
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
              </CardBody>
            </Card>
          )}

          {/* Step 1: Service area */}
          {step === 1 && (
            <Card>
              <CardHeader>
                <h2 className="font-semibold text-neutral-900">Area de servico</h2>
                <p className="text-sm text-neutral-500 mt-1">
                  Ate onde esta disposto a deslocar-se para prestar servicos?
                </p>
              </CardHeader>
              <CardBody>
                <div className="mb-5">
                  <Input
                    label="Raio de servico (km) *"
                    type="number"
                    min={1}
                    max={200}
                    step={1}
                    id="serviceRadiusKm"
                    placeholder="Ex: 30"
                    error={errors.serviceRadiusKm?.message}
                    {...register('serviceRadiusKm')}
                  />
                  <p className="text-xs text-neutral-400 mt-1">
                    Recebera pedidos num raio ate esta distancia da sua sede.
                  </p>
                </div>

                <div className="mb-5">
                  <Input
                    label="Telefone"
                    type="tel"
                    id="phone"
                    placeholder="+351 912 345 678"
                    error={errors.phone?.message}
                    {...register('phone')}
                  />
                </div>

                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-neutral-700 mb-1.5">
                    Descricao da empresa
                  </label>
                  <textarea
                    id="description"
                    rows={3}
                    placeholder="Descreva brevemente os servicos que oferece..."
                    className="block w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-1"
                    {...register('description')}
                  />
                  {errors.description && <p className="text-xs text-red-600 mt-1">{errors.description.message}</p>}
                </div>
              </CardBody>
            </Card>
          )}

          {/* Step 2: Review */}
          {step === 2 && (
            <Card>
              <CardHeader>
                <h2 className="font-semibold text-neutral-900">Tudo pronto!</h2>
                <p className="text-sm text-neutral-500 mt-1">
                  Confirme os seus dados antes de comecar.
                </p>
              </CardHeader>
              <CardBody>
                <div className="space-y-4">
                  <div className="flex items-start gap-3 p-4 rounded-lg bg-green-50 border border-green-200">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-green-800">Localizacao</p>
                      <p className="text-sm text-green-700">
                        {[values.parish, values.municipality, values.island].filter(Boolean).join(', ')}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-4 rounded-lg bg-green-50 border border-green-200">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-green-800">Raio de servico</p>
                      <p className="text-sm text-green-700">{values.serviceRadiusKm} km</p>
                    </div>
                  </div>

                  {values.phone && (
                    <div className="flex items-start gap-3 p-4 rounded-lg bg-green-50 border border-green-200">
                      <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-green-800">Telefone</p>
                        <p className="text-sm text-green-700">{values.phone}</p>
                      </div>
                    </div>
                  )}

                  {values.description && (
                    <div className="flex items-start gap-3 p-4 rounded-lg bg-green-50 border border-green-200">
                      <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-green-800">Descricao</p>
                        <p className="text-sm text-green-700">{values.description}</p>
                      </div>
                    </div>
                  )}
                </div>

                {saveMutation.isError && (
                  <p className="text-sm text-red-600 mt-4">
                    Ocorreu um erro ao guardar. Tente novamente.
                  </p>
                )}
              </CardBody>
            </Card>
          )}

          {/* Navigation */}
          <div className="flex justify-between mt-6">
            {step > 0 ? (
              <Button type="button" variant="outline" onClick={() => setStep((s) => s - 1)}>
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
                loading={saveMutation.isPending}
                onClick={handleSubmit(((data: OnboardingFormData) => saveMutation.mutate(data)) as never)}
              >
                Comecar a usar o AgroConnect
              </Button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
