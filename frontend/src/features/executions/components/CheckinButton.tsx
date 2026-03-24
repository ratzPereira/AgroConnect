import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { checkinExecution } from '@/api/executions';
import { Button } from '@/components/ui/Button';
import { MapPin } from 'lucide-react';

interface CheckinButtonProps {
  executionId: number;
  requestId: number;
}

export function CheckinButton({ executionId, requestId }: CheckinButtonProps) {
  const queryClient = useQueryClient();
  const [geoError, setGeoError] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);

  const checkinMutation = useMutation({
    mutationFn: (data: { latitude: number; longitude: number }) =>
      checkinExecution(executionId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['execution', requestId] });
      queryClient.invalidateQueries({ queryKey: ['request', requestId] });
      queryClient.invalidateQueries({ queryKey: ['client-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['my-requests'] });
    },
  });

  function handleCheckin() {
    if (!navigator.geolocation) {
      setGeoError('A geolocalização não é suportada pelo seu navegador.');
      return;
    }

    setGeoError(null);
    setLocating(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocating(false);
        checkinMutation.mutate({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (error) => {
        setLocating(false);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setGeoError('Permissão de localização negada. Ative a localização nas definições do navegador.');
            break;
          case error.POSITION_UNAVAILABLE:
            setGeoError('Informação de localização indisponível.');
            break;
          case error.TIMEOUT:
            setGeoError('O pedido de localização expirou. Tente novamente.');
            break;
          default:
            setGeoError('Não foi possível obter a localização.');
        }
      },
      { enableHighAccuracy: true, timeout: 10_000 },
    );
  }

  return (
    <div>
      <Button
        size="sm"
        onClick={handleCheckin}
        loading={locating || checkinMutation.isPending}
      >
        <MapPin className="h-4 w-4" />
        {locating ? 'A obter localização...' : 'Fazer Check-in'}
      </Button>
      {geoError && <p className="text-xs text-red-600 mt-2">{geoError}</p>}
      {checkinMutation.isError && (
        <p className="text-xs text-red-600 mt-2">Erro ao fazer check-in. Tente novamente.</p>
      )}
    </div>
  );
}
