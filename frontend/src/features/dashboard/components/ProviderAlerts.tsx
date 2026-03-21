import { Link } from 'react-router-dom';
import { Alert } from '@/components/ui/Alert';
import { cn } from '@/utils/cn';
import type { InventoryItem } from '@/types/inventory';
import type { Machine } from '@/types/machine';

interface ProviderAlertsProps {
  lowStockItems: InventoryItem[];
  maintenanceDueMachines: Machine[];
  className?: string;
}

export function ProviderAlerts({ lowStockItems, maintenanceDueMachines, className }: ProviderAlertsProps) {
  if (lowStockItems.length === 0 && maintenanceDueMachines.length === 0) return null;

  return (
    <div className={cn('space-y-3', className)}>
      {lowStockItems.length > 0 && (
        <Alert variant="warning" title="Stock baixo">
          {lowStockItems.length === 1
            ? `${lowStockItems[0].productName} está abaixo do nível mínimo.`
            : `${lowStockItems.length} itens estão abaixo do nível mínimo.`}
          {' '}
          <Link to="/provider/inventory" className="underline font-medium">
            Ver inventário
          </Link>
        </Alert>
      )}
      {maintenanceDueMachines.length > 0 && (
        <Alert variant="danger" title="Manutenção pendente">
          {maintenanceDueMachines.length === 1
            ? `${maintenanceDueMachines[0].name} precisa de manutenção.`
            : `${maintenanceDueMachines.length} máquinas precisam de manutenção.`}
          {' '}
          <Link to="/provider/machines" className="underline font-medium">
            Ver máquinas
          </Link>
        </Alert>
      )}
    </div>
  );
}
