import { useState, useMemo, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import {
  createListing,
  getListingUploadUrl,
  confirmListingPhoto,
} from '@/api/listings';
import { AnimatedPage } from '@/components/AnimatedPage';
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
import {
  ArrowLeft, Beef, Sprout, Wheat, Apple, Wrench,
  ImagePlus, Upload, Loader2, X, Send,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/utils/cn';
import type { ListingCategory, ListingCondition, CreateListingDto } from '@/types/listing';
import type { ComponentType } from 'react';

// --- Category metadata ---

interface CategoryMeta {
  value: ListingCategory;
  label: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
  showCondition: boolean;
  showQuantity: boolean;
}

const CATEGORIES: CategoryMeta[] = [
  { value: 'ANIMALS', label: 'Animais', description: 'Gado, aves, animais de quinta', icon: Beef, showCondition: false, showQuantity: true },
  { value: 'PLANTS', label: 'Plantas', description: 'Árvores, arbustos, flores, mudas', icon: Sprout, showCondition: false, showQuantity: true },
  { value: 'SEEDS', label: 'Sementes', description: 'Sementes e bolbos', icon: Wheat, showCondition: false, showQuantity: true },
  { value: 'PRODUCE', label: 'Produção', description: 'Frutas, legumes, laticínios, mel', icon: Apple, showCondition: false, showQuantity: true },
  { value: 'EQUIPMENT', label: 'Equipamento', description: 'Máquinas, ferramentas, peças', icon: Wrench, showCondition: true, showQuantity: false },
];

const CONDITION_OPTIONS: { value: ListingCondition; label: string }[] = [
  { value: 'NEW', label: 'Novo' },
  { value: 'LIKE_NEW', label: 'Semi-novo' },
  { value: 'USED', label: 'Usado' },
];

const UNIT_OPTIONS = [
  { value: 'kg', label: 'Quilogramas (kg)' },
  { value: 'un', label: 'Unidades' },
  { value: 'lt', label: 'Litros' },
  { value: 'ton', label: 'Toneladas' },
  { value: 'dz', label: 'Dúzias' },
  { value: 'cx', label: 'Caixas' },
];

const SELECT_CLASS =
  'block w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-1';

const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_PHOTOS = 8;

// --- Zod schema ---

const listingSchema = z.object({
  category: z.enum(['ANIMALS', 'PLANTS', 'SEEDS', 'PRODUCE', 'EQUIPMENT'], {
    required_error: 'Selecione uma categoria',
  }),
  title: z
    .string()
    .min(5, 'O título deve ter pelo menos 5 caracteres')
    .max(200, 'O título não pode exceder 200 caracteres'),
  description: z
    .string()
    .min(20, 'A descrição deve ter pelo menos 20 caracteres'),
  price: z.string().optional(),
  priceNegotiable: z.boolean().optional(),
  priceConsulta: z.boolean().optional(),
  condition: z.enum(['NEW', 'USED', 'LIKE_NEW']).nullable().optional(),
  quantity: z.string().optional(),
  unit: z.string().optional(),
  island: z.string().min(1, 'Selecione uma ilha'),
  municipality: z.string().min(1, 'Selecione um município'),
  parish: z.string().optional(),
  latitude: z
    .number({ required_error: 'Marque a localização no mapa' })
    .min(AZORES_BOUNDS.minLat, 'A localização deve estar nos Açores')
    .max(AZORES_BOUNDS.maxLat, 'A localização deve estar nos Açores'),
  longitude: z
    .number({ required_error: 'Marque a localização no mapa' })
    .min(AZORES_BOUNDS.minLng, 'A localização deve estar nos Açores')
    .max(AZORES_BOUNDS.maxLng, 'A localização deve estar nos Açores'),
});

type ListingFormData = z.infer<typeof listingSchema>;

interface PhotoPreview {
  file: File;
  url: string;
}

export function CreateListing() {
  const navigate = useNavigate();
  const [photos, setPhotos] = useState<PhotoPreview[]>([]);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    control,
    formState: { errors },
  } = useForm<ListingFormData>({
    resolver: zodResolver(listingSchema) as never,
    defaultValues: {
      priceNegotiable: false,
      priceConsulta: false,
      condition: null,
      island: '',
      municipality: '',
      parish: '',
    },
  });

  const values = watch();

  const selectedCategoryMeta = CATEGORIES.find((c) => c.value === values.category);

  // --- Cascading location dropdowns ---

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

  // --- Photo handling ---

  function validateFile(file: File): boolean {
    if (!ALLOWED_TYPES.has(file.type)) {
      toast.error('Formato não suportado. Use JPEG, PNG ou WebP.');
      return false;
    }
    if (file.size > MAX_FILE_SIZE) {
      toast.error('Ficheiro demasiado grande. Máximo 5MB.');
      return false;
    }
    return true;
  }

  function addPhotos(files: FileList | File[]) {
    const remaining = MAX_PHOTOS - photos.length;
    const fileArray = Array.from(files).slice(0, remaining);

    const newPreviews: PhotoPreview[] = [];
    for (const file of fileArray) {
      if (validateFile(file)) {
        newPreviews.push({ file, url: URL.createObjectURL(file) });
      }
    }

    setPhotos((prev) => [...prev, ...newPreviews]);
  }

  function removePhoto(index: number) {
    setPhotos((prev) => {
      const removed = prev[index];
      if (removed) URL.revokeObjectURL(removed.url);
      return prev.filter((_, i) => i !== index);
    });
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) addPhotos(e.target.files);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragOver(false);
      if (e.dataTransfer.files.length > 0) {
        addPhotos(e.dataTransfer.files);
      }
    },
    [photos.length], // eslint-disable-line react-hooks/exhaustive-deps
  );

  // --- Submit ---

  const createMut = useMutation({
    mutationFn: async (data: ListingFormData) => {
      const dto: CreateListingDto = {
        title: data.title,
        description: data.description,
        price: data.priceConsulta || !data.price ? null : Number(data.price),
        priceNegotiable: data.priceNegotiable ?? false,
        category: data.category as ListingCategory,
        condition: data.condition ?? null,
        quantity: data.quantity ? Number(data.quantity) : null,
        unit: data.unit || null,
        latitude: data.latitude,
        longitude: data.longitude,
        locationName: null,
        parish: data.parish || null,
        municipality: data.municipality,
        island: data.island,
      };

      const listing = await createListing(dto);

      // Upload photos
      if (photos.length > 0) {
        setUploading(true);
        for (const photo of photos) {
          try {
            const { uploadUrl, publicUrl } = await getListingUploadUrl(listing.id);
            await fetch(uploadUrl, {
              method: 'PUT',
              body: photo.file,
              headers: { 'Content-Type': photo.file.type },
            });
            await confirmListingPhoto(listing.id, publicUrl);
          } catch {
            toast.error('Erro ao carregar uma foto.');
          }
        }
        setUploading(false);
      }

      return listing;
    },
    onSuccess: (listing) => {
      // Clean up previews
      photos.forEach((p) => URL.revokeObjectURL(p.url));
      toast.success('Anúncio publicado com sucesso!');
      navigate(`/marketplace/${listing.id}`);
    },
    onError: () => {
      toast.error('Erro ao criar o anúncio. Tente novamente.');
    },
  });

  const locationError = errors.latitude?.message || errors.longitude?.message;
  const isSubmitting = createMut.isPending || uploading;

  return (
    <AnimatedPage>
      <button
        onClick={() => navigate('/marketplace')}
        className="inline-flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-700 mb-4"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar ao Marketplace
      </button>

      <h1 className="text-[28px] font-bold font-display leading-tight text-neutral-900 mb-6">
        Novo Anúncio
      </h1>

      <form
        onSubmit={handleSubmit((data) => createMut.mutate(data))}
        className="max-w-2xl space-y-6"
      >
        {/* Category selection */}
        <Card>
          <CardHeader>
            <h2 className="font-semibold text-neutral-900">Categoria</h2>
          </CardHeader>
          <CardBody>
            <Controller
              control={control}
              name="category"
              render={({ field }) => (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {CATEGORIES.map((cat) => {
                    const Icon = cat.icon;
                    const isSelected = field.value === cat.value;
                    return (
                      <label
                        key={cat.value}
                        className={cn(
                          'flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-colors duration-200',
                          isSelected
                            ? 'border-primary-600 bg-primary-50'
                            : 'border-neutral-200 hover:border-neutral-300',
                        )}
                      >
                        <input
                          type="radio"
                          value={cat.value}
                          checked={isSelected}
                          onChange={() => field.onChange(cat.value)}
                          className="sr-only"
                        />
                        <div className={cn(
                          'flex items-center justify-center h-10 w-10 rounded-lg',
                          isSelected ? 'bg-primary-100' : 'bg-neutral-100',
                        )}>
                          <Icon className={cn(
                            'h-5 w-5',
                            isSelected ? 'text-primary-600' : 'text-neutral-500',
                          )} />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-neutral-900">{cat.label}</p>
                          <p className="text-xs text-neutral-500">{cat.description}</p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              )}
            />
            {errors.category && (
              <p className="text-xs text-red-600 mt-2">{errors.category.message}</p>
            )}
          </CardBody>
        </Card>

        {/* Details */}
        <Card>
          <CardHeader>
            <h2 className="font-semibold text-neutral-900">Detalhes</h2>
          </CardHeader>
          <CardBody>
            <div className="space-y-4">
              <Input
                label="Título"
                id="title"
                placeholder="Ex: Vitelos Holstein de 6 meses"
                error={errors.title?.message}
                {...register('title')}
              />

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-neutral-700 mb-1.5">
                  Descrição
                </label>
                <textarea
                  id="description"
                  rows={5}
                  placeholder="Descreva o que está a vender em detalhe..."
                  className={cn(
                    'block w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm',
                    'focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-1',
                    'placeholder:text-neutral-400',
                    errors.description && 'border-red-300 focus:ring-red-500',
                  )}
                  {...register('description')}
                />
                {errors.description && (
                  <p className="text-xs text-red-600 mt-1">{errors.description.message}</p>
                )}
              </div>

              {/* Price */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="price" className="block text-sm font-medium text-neutral-700">
                    Preço
                  </label>
                  <label className="flex items-center gap-2 text-sm text-neutral-600 cursor-pointer">
                    <input
                      type="checkbox"
                      className="rounded border-neutral-300"
                      {...register('priceConsulta')}
                    />
                    Preço sob consulta
                  </label>
                </div>
                {!values.priceConsulta && (
                  <div className="flex items-center gap-3">
                    <Input
                      type="number"
                      id="price"
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                      className="flex-1"
                      {...register('price')}
                    />
                    <span className="text-sm text-neutral-500">EUR</span>
                  </div>
                )}
                {!values.priceConsulta && (
                  <label className="flex items-center gap-2 text-sm text-neutral-600 mt-2 cursor-pointer">
                    <input
                      type="checkbox"
                      className="rounded border-neutral-300"
                      {...register('priceNegotiable')}
                    />
                    Preço negociável
                  </label>
                )}
              </div>

              {/* Condition — only for EQUIPMENT */}
              {selectedCategoryMeta?.showCondition && (
                <div>
                  <label htmlFor="condition" className="block text-sm font-medium text-neutral-700 mb-1.5">
                    Estado
                  </label>
                  <select id="condition" className={SELECT_CLASS} {...register('condition')}>
                    <option value="">Selecione...</option>
                    {CONDITION_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Quantity + Unit — for PRODUCE, SEEDS, ANIMALS */}
              {selectedCategoryMeta?.showQuantity && (
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Quantidade"
                    type="number"
                    step="0.1"
                    min="0"
                    placeholder="Ex: 50"
                    {...register('quantity')}
                  />
                  <div>
                    <label htmlFor="unit" className="block text-sm font-medium text-neutral-700 mb-1.5">
                      Unidade
                    </label>
                    <select id="unit" className={SELECT_CLASS} {...register('unit')}>
                      <option value="">Selecione...</option>
                      {UNIT_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>
          </CardBody>
        </Card>

        {/* Location */}
        <Card>
          <CardHeader>
            <h2 className="font-semibold text-neutral-900">Localização</h2>
            <p className="text-sm text-neutral-500 mt-1">
              Selecione a ilha e o município, depois clique no mapa para marcar o local.
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
                {errors.municipality && (
                  <p className="text-xs text-red-600 mt-1">{errors.municipality.message}</p>
                )}
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

        {/* Photos */}
        <Card>
          <CardHeader>
            <h2 className="font-semibold text-neutral-900">Fotografias</h2>
            <p className="text-sm text-neutral-500 mt-1">
              Adicione até {MAX_PHOTOS} fotos. A primeira será a foto de capa.
            </p>
          </CardHeader>
          <CardBody>
            {/* Photo previews */}
            {photos.length > 0 && (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mb-3">
                {photos.map((photo, i) => (
                  <div key={photo.url} className="relative group aspect-square">
                    <img
                      src={photo.url}
                      alt={`Foto ${i + 1}`}
                      className="w-full h-full object-cover rounded-lg border border-neutral-200"
                    />
                    {i === 0 && (
                      <span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-primary-600 text-white">
                        Capa
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => removePhoto(i)}
                      className="absolute top-1.5 right-1.5 p-1 rounded-full bg-black/60 text-white hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-all"
                      aria-label="Remover foto"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Drop zone */}
            {photos.length < MAX_PHOTOS && (
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  'flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed cursor-pointer transition-all duration-200',
                  photos.length > 0 ? 'py-5' : 'py-8',
                  dragOver
                    ? 'border-primary-400 bg-primary-50 scale-[1.01]'
                    : 'border-neutral-300 hover:border-primary-400 hover:bg-neutral-50',
                )}
              >
                {dragOver ? (
                  <>
                    <Upload className="h-8 w-8 text-primary-500" />
                    <p className="text-sm text-primary-600 font-medium">Largue aqui</p>
                  </>
                ) : (
                  <>
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-neutral-100">
                      <ImagePlus className="h-5 w-5 text-neutral-500" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-neutral-700 font-medium">
                        Arraste imagens ou <span className="text-primary-600">clique para escolher</span>
                      </p>
                      <p className="text-xs text-neutral-400 mt-0.5">
                        JPEG, PNG ou WebP, máx. 5MB cada
                      </p>
                    </div>
                  </>
                )}
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              className="hidden"
              onChange={handleFileSelect}
            />

            <p className="text-xs text-neutral-400 mt-2">
              {photos.length}/{MAX_PHOTOS} fotos
            </p>
          </CardBody>
        </Card>

        {/* Submit */}
        <Button
          type="submit"
          size="lg"
          className="w-full"
          loading={isSubmitting}
          disabled={isSubmitting}
        >
          {uploading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              A carregar fotos...
            </>
          ) : (
            <>
              <Send className="h-4 w-4" />
              Publicar Anúncio
            </>
          )}
        </Button>

        {createMut.isError && (
          <p className="text-sm text-red-600 text-center">
            Ocorreu um erro ao criar o anúncio. Tente novamente.
          </p>
        )}
      </form>
    </AnimatedPage>
  );
}
