import { Skeleton } from "@/components/shared/loader";
import { cn } from "@/lib/utils";

export function KpiCardsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div
      className={cn(
        "grid-contained grid-cols-2 gap-3",
        count > 4 ? "lg:grid-cols-4" : "lg:grid-cols-4"
      )}
    >
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-card border border-border bg-card p-4 space-y-3"
        >
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-3 w-16" />
        </div>
      ))}
    </div>
  );
}

export function TableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="rounded-card border border-border bg-card overflow-hidden">
      <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-9 w-28" />
      </div>
      <div className="divide-y divide-border">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-3">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 flex-1 max-w-xs" />
            <Skeleton className="h-4 w-20 ml-auto" />
            <Skeleton className="h-8 w-8 rounded-sm" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function ModulePageSkeleton({
  kpiCount = 4,
  withTable = true,
}: {
  kpiCount?: number;
  withTable?: boolean;
}) {
  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-36" />
      </div>
      <KpiCardsSkeleton count={kpiCount} />
      {withTable ? <TableSkeleton /> : null}
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-2">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-4 w-56" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-28" />
          <Skeleton className="h-10 w-28" />
        </div>
      </div>
      <KpiCardsSkeleton count={8} />
      <Skeleton className="h-64 w-full rounded-card" />
      <div className="grid gap-4 lg:grid-cols-2">
        <TableSkeleton rows={4} />
        <TableSkeleton rows={4} />
      </div>
    </div>
  );
}
