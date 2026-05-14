/* eslint-disable react-refresh/only-export-components */
import { cn } from '@/utils/cn';

interface SkeletonBaseProps {
  readonly className?: string;
}

const shimmerClasses = 'bg-gradient-to-r from-neutral-200 via-neutral-100 to-neutral-200 bg-[length:200%_100%] animate-shimmer';

function SkeletonBase({ className }: SkeletonBaseProps) {
  return <div className={cn(shimmerClasses, 'rounded', className)} />;
}

function Line({ className }: SkeletonBaseProps) {
  return <SkeletonBase className={cn('h-4 w-full rounded', className)} />;
}

function Circle({ className }: SkeletonBaseProps) {
  return <SkeletonBase className={cn('h-10 w-10 rounded-full', className)} />;
}

function Rect({ className }: SkeletonBaseProps) {
  return <SkeletonBase className={cn('h-24 w-full rounded-lg', className)} />;
}

function SkeletonCard({ className }: SkeletonBaseProps) {
  return (
    <div className={cn('rounded-xl border border-neutral-200 bg-white p-5 space-y-3', className)}>
      <div className="flex items-center gap-3">
        <Circle className="h-8 w-8" />
        <Line className="h-4 w-32" />
      </div>
      <Line className="h-3 w-full" />
      <Line className="h-3 w-3/4" />
      <div className="flex gap-2 pt-1">
        <Line className="h-6 w-16 rounded-full" />
        <Line className="h-6 w-20 rounded-full" />
      </div>
    </div>
  );
}

function SkeletonStat({ className }: SkeletonBaseProps) {
  return (
    <div className={cn('rounded-xl border border-neutral-200 bg-white p-5 space-y-2', className)}>
      <div className="flex items-center justify-between">
        <Line className="h-3 w-20" />
        <Circle className="h-8 w-8" />
      </div>
      <Line className="h-8 w-24" />
      <Line className="h-3 w-16" />
    </div>
  );
}

const TABLE_HEADER_KEYS = ['th-0', 'th-1', 'th-2', 'th-3'];
const TABLE_ROW_KEYS = ['tr-0', 'tr-1', 'tr-2', 'tr-3', 'tr-4'];
const TABLE_CELL_KEYS = ['tc-0', 'tc-1', 'tc-2', 'tc-3'];

function SkeletonTable({ className }: SkeletonBaseProps) {
  return (
    <div className={cn('rounded-xl border border-neutral-200 bg-white overflow-hidden', className)}>
      <div className="border-b border-neutral-200 p-4 flex gap-4">
        {TABLE_HEADER_KEYS.map(k => (
          <Line key={k} className="h-4 flex-1" />
        ))}
      </div>
      {TABLE_ROW_KEYS.map(rowKey => (
        <div key={rowKey} className="border-b border-neutral-100 p-4 flex gap-4">
          {TABLE_CELL_KEYS.map(cellKey => (
            <Line key={`${rowKey}-${cellKey}`} className="h-3 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

export const Skeleton = Object.assign(SkeletonBase, {
  Line,
  Circle,
  Rect,
  Card: SkeletonCard,
  Stat: SkeletonStat,
  Table: SkeletonTable,
});
