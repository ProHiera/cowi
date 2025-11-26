import { Skeleton } from "@/components/ui/skeleton";

export default function ConsoleLoading() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between gap-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-10 w-32" />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-32 w-full" />
        ))}
      </div>
      <Skeleton className="h-64 w-full" />
    </div>
  );
}
