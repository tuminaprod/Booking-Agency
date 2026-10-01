import { Skeleton } from "./feedback";

export function ListingSkeleton({ cols = 3 }: { cols?: 3 | 4 }) {
  return (
    <div className="container-page pt-10" aria-busy aria-label="Loading">
      <Skeleton className="h-12 w-72" />
      <Skeleton className="mt-3 h-5 w-96 max-w-full" />
      <div className="mt-8 flex gap-2">
        {Array.from({ length: 6 }, (_, i) => (
          <Skeleton key={i} className="h-10 w-24" />
        ))}
      </div>
      <div className={`mt-8 grid gap-5 sm:grid-cols-2 ${cols === 4 ? "xl:grid-cols-4" : "lg:grid-cols-3"}`}>
        {Array.from({ length: cols * 2 }, (_, i) => (
          <div key={i} className="overflow-hidden rounded-lg border border-line bg-surface">
            <Skeleton className="aspect-[4/3] rounded-none" />
            <div className="space-y-2 p-5">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-6 w-4/5" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function DetailSkeleton() {
  return (
    <div className="container-page pt-6" aria-busy aria-label="Loading">
      <Skeleton className="h-4 w-64" />
      <Skeleton className="mt-5 h-12 w-2/3" />
      <Skeleton className="mt-3 h-5 w-80 max-w-full" />
      <div className="mt-6 grid h-[min(56vh,520px)] grid-cols-4 grid-rows-2 gap-2">
        <Skeleton className="col-span-4 row-span-2 rounded-xl sm:col-span-2" />
        <Skeleton className="hidden sm:block" />
        <Skeleton className="hidden sm:block" />
        <Skeleton className="hidden sm:block" />
        <Skeleton className="hidden sm:block" />
      </div>
      <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_22rem]">
        <div className="space-y-3">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-11/12" />
          <Skeleton className="h-4 w-4/5" />
        </div>
        <Skeleton className="hidden h-80 rounded-xl lg:block" />
      </div>
    </div>
  );
}
