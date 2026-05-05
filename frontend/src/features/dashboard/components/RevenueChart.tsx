import { AreaChart, Area, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { cn } from '@/utils/cn';

interface RevenueDataPoint {
  label: string;
  value: number;
}

interface RevenueChartProps {
  data: RevenueDataPoint[];
  className?: string;
}

export function RevenueChart({ data, className }: RevenueChartProps) {
  if (data.length < 2) {
    return (
      <div className={cn('flex items-center justify-center h-[200px] text-sm text-neutral-500', className)}>
        Dados insuficientes para o gráfico
      </div>
    );
  }

  return (
    <div className={cn('h-[200px]', className)}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 4 }}>
          <defs>
            <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2D8A2D" stopOpacity={0.2} />
              <stop offset="100%" stopColor="#2D8A2D" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#8F8C82' }} axisLine={false} tickLine={false} />
          <YAxis hide />
          <Tooltip
            contentStyle={{
              background: 'white',
              border: '1px solid #E8E6E0',
              borderRadius: '8px',
              fontSize: '12px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
            }}
            formatter={(value) => {
              const num = typeof value === 'number' ? value : 0;
              return [`${num.toLocaleString('pt-PT')} €`, 'Receita'];
            }}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke="#2D8A2D"
            strokeWidth={2}
            fill="url(#revenueGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
