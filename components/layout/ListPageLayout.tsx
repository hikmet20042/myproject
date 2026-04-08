import type { LucideIcon } from "lucide-react";
import { Sparkles } from "lucide-react";
import type { ReactNode } from "react";
import { PageStateGuard } from "@/components/shared";

type ListPageLayoutProps = {
  title: string;
  description: string;
  icon?: LucideIcon;
  headerBadgeText?: string;
  headerActions?: ReactNode;
  filterSection?: ReactNode;
  content: ReactNode;
  bottomCta?: ReactNode;
  isLoading?: boolean;
  isError?: boolean;
  isEmpty?: boolean;
  loadingTitle?: string;
  loadingText?: string;
  errorTitle?: string;
  errorMessage?: string;
  retryText?: string;
  onRetry?: () => void;
  emptyTitle?: string;
  emptyMessage?: string;
  emptyActionText?: string;
  onEmptyAction?: () => void;
  contentContainerClassName?: string;
  filterContainerClassName?: string;
};

export default function ListPageLayout({
  title,
  description,
  icon: HeaderIcon = Sparkles,
  headerBadgeText,
  headerActions,
  filterSection,
  content,
  bottomCta,
  isLoading = false,
  isError = false,
  isEmpty = false,
  loadingTitle,
  loadingText,
  errorTitle,
  errorMessage,
  retryText,
  onRetry,
  emptyTitle,
  emptyMessage,
  emptyActionText,
  onEmptyAction,
  contentContainerClassName = "max-w-7xl mx-auto",
  filterContainerClassName = "max-w-7xl mx-auto",
}: ListPageLayoutProps) {
  return (
    <PageStateGuard
      isLoading={isLoading}
      isError={isError}
      isEmpty={isEmpty}
      loadingTitle={loadingTitle}
      loadingText={loadingText}
      errorTitle={errorTitle}
      errorMessage={errorMessage}
      retryText={retryText}
      onRetry={onRetry}
      emptyTitle={emptyTitle}
      emptyMessage={emptyMessage}
      emptyActionText={emptyActionText}
      onEmptyAction={onEmptyAction}
    >
      <div className="min-h-screen bg-background text-foreground transition-colors duration-200">
        <section className="relative overflow-hidden pt-28 pb-20 md:pt-36 md:pb-24">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(214_32%_91%)_1px,transparent_1px),linear-gradient(to_bottom,hsl(214_32%_91%)_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-40" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 h-[480px] w-[820px] rounded-full bg-primary/10 blur-3xl" />

          <div className="section-padding relative z-10">
            <div className="mx-auto max-w-5xl text-center">
              <div className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-1.5 text-sm font-medium text-gray-600 mb-8">
                <HeaderIcon size={14} className="text-accent" />
                {headerBadgeText || title}
              </div>

              <h1 className="mx-auto max-w-4xl text-4xl sm:text-5xl md:text-6xl font-black tracking-tight text-gray-900 leading-tight">
                {title}
              </h1>
              <p className="mx-auto mt-6 max-w-3xl text-lg sm:text-xl text-gray-600 leading-relaxed">
                {description}
              </p>

              {headerActions && (
                <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
                  {headerActions}
                </div>
              )}
            </div>
          </div>
        </section>

        {filterSection && (
          <section className="section-padding py-8 sm:py-12">
            <div className={filterContainerClassName}>{filterSection}</div>
          </section>
        )}

        <section className="py-12 sm:py-16 lg:py-20">
          <div className="section-padding">
            <div className={contentContainerClassName}>{content}</div>
          </div>
        </section>

        {bottomCta && (
          <section className="py-16 md:py-20 bg-slate-50/60">
            <div className="section-padding">
              <div className="max-w-4xl mx-auto">{bottomCta}</div>
            </div>
          </section>
        )}
      </div>
    </PageStateGuard>
  );
}
