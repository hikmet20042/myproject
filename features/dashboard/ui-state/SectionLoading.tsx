type SectionLoadingVariant = "list" | "card-grid" | "notifications";

interface SectionLoadingProps {
  variant: SectionLoadingVariant;
  rows?: number;
}

function ListRowsSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div
          key={rowIndex}
          className="animate-pulse rounded-xl border border-slate-200 bg-slate-50 p-4"
        >
          <div className="h-4 w-2/5 rounded bg-slate-200" />
          <div className="mt-2 h-3 w-4/5 rounded bg-slate-200" />
          <div className="mt-3 h-3 w-1/3 rounded bg-slate-200" />
        </div>
      ))}
    </div>
  );
}

function CardGridSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: rows }).map((_, cardIndex) => (
        <div
          key={cardIndex}
          className="animate-pulse rounded-xl border border-slate-200 bg-slate-50 p-4"
        >
          <div className="h-5 w-3/5 rounded bg-slate-200" />
          <div className="mt-3 h-3 w-full rounded bg-slate-200" />
          <div className="mt-2 h-3 w-4/5 rounded bg-slate-200" />
          <div className="mt-4 h-8 w-24 rounded-lg bg-slate-200" />
        </div>
      ))}
    </div>
  );
}

function NotificationsSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div
          key={rowIndex}
          className="animate-pulse rounded-xl border border-slate-200 bg-slate-50 p-4"
        >
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-full bg-slate-200" />
            <div className="min-w-0 flex-1">
              <div className="h-4 w-2/5 rounded bg-slate-200" />
              <div className="mt-2 h-3 w-4/5 rounded bg-slate-200" />
              <div className="mt-3 h-3 w-1/3 rounded bg-slate-200" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function SectionLoading({ variant, rows = 3 }: SectionLoadingProps) {
  if (variant === "card-grid") {
    return <CardGridSkeleton rows={rows} />;
  }

  if (variant === "notifications") {
    return <NotificationsSkeleton rows={rows} />;
  }

  return <ListRowsSkeleton rows={rows} />;
}
