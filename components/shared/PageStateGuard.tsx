import type { ReactNode } from "react";
import LoadingState from "./LoadingState";
import ErrorState from "./ErrorState";
import EmptyState from "./EmptyState";

type PageStateGuardProps = {
  isLoading: boolean;
  isError: boolean;
  isEmpty: boolean;
  children: ReactNode;
  loadingText?: string;
  loadingTitle?: string;
  errorTitle?: string;
  errorMessage?: string;
  onRetry?: () => void;
  retryText?: string;
  emptyTitle?: string;
  emptyMessage?: string;
  emptyActionText?: string;
  onEmptyAction?: () => void;
  fullPage?: boolean;
};

export default function PageStateGuard({
  isLoading,
  isError,
  isEmpty,
  children,
  loadingText = "Yüklənir...",
  loadingTitle = "Yüklənir",
  errorTitle = "Məlumatları yükləyərkən problem baş verdi",
  errorMessage = "Bir xəta baş verdi. Zəhmət olmasa yenidən cəhd edin.",
  onRetry,
  retryText = "Yenidən cəhd et",
  emptyTitle = "Hələlik burada sakitlikdir",
  emptyMessage = "Hazırda göstəriləcək məzmun yoxdur. İlk addımı sən ata bilərsən.",
  emptyActionText,
  onEmptyAction,
  fullPage = true,
}: PageStateGuardProps) {
  if (isLoading) {
    return <LoadingState title={loadingTitle} text={loadingText} variant={fullPage ? 'page' : 'spinner'} />;
  }

  if (isError) {
    return (
      <ErrorState
        title={errorTitle}
        message={errorMessage}
        onRetry={onRetry}
        retryText={retryText}
        fullPage={fullPage}
      />
    );
  }

  if (isEmpty) {
    return (
      <EmptyState
        title={emptyTitle}
        message={emptyMessage}
        actionText={emptyActionText}
        onAction={onEmptyAction}
        variant="card"
      />
    );
  }

  return <>{children}</>;
}
