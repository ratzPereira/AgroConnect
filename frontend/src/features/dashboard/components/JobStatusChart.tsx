import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { cn } from '@/utils/cn';

interface JobStatusData {
  name: string;
  value: number;
  color: string;
}

interface JobStatusChartProps {
  readonly data: JobStatusData[];
  readonly total: number;
  readonly className?: string;
}

function LegendLabel({ value }: { readonly value: string }) {
  return <span className="text-xs text-neutral-600 ml-1">{value}</span>;
}

const renderLegendLabel = (value: string) => <LegendLabel value={value} />;

export function JobStatusChart({ data, total, className }: JobStatusChartProps) {
  if (data.every((d) => d.value === 0)) {
    return (
      <div className={cn('flex items-center justify-center h-[200px] text-sm text-neutral-500', className)}>
        Sem dados disponíveis
      </div>
    );
  }

  return (
    <div className={cn('relative h-[200px]', className)}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={75}
            paddingAngle={2}
            dataKey="value"
          >
            {data.map((entry) => (
              <Cell key={entry.name} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value, name) => [value ?? 0, name ?? '']}
            contentStyle={{
              background: 'white',
              border: '1px solid #E8E6E0',
              borderRadius: '8px',
              fontSize: '12px',
            }}
          />
          <Legend
            verticalAlign="bottom"
            iconType="circle"
            iconSize={8}
            formatter={renderLegendLabel}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none" style={{ marginTop: '-12px' }}>
        <p className="text-2xl font-bold text-neutral-800">{total}</p>
        <p className="text-[10px] text-neutral-500">Total</p>
      </div>
    </div>
  );
}
