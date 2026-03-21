import { Alert } from "@/components/feedback";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";

interface SectionErrorInlineProps {
  title: string;
  message: string;
  onRetry: () => void;
  retryText?: string;
  framed?: boolean;
  className?: string;
}

function ErrorContent({
  title,
  message,
  onRetry,
  retryText = "Yenidən cəhd et",
}: Omit<SectionErrorInlineProps, "framed" | "className">) {
  return (
    <Alert variant="error" title={title}>
      <div className="flex flex-wrap items-center gap-3">
        <span>{message}</span>
        <Button type="button" variant="outline" size="sm" onClick={onRetry}>
          {retryText}
        </Button>
      </div>
    </Alert>
  );
}

export default function SectionErrorInline({
  title,
  message,
  onRetry,
  retryText,
  framed = false,
  className,
}: SectionErrorInlineProps) {
  if (!framed) {
    return (
      <div className={className}>
        <ErrorContent
          title={title}
          message={message}
          onRetry={onRetry}
          retryText={retryText}
        />
      </div>
    );
  }

  return (
    <Card className={["overflow-hidden border border-slate-200 shadow-sm", className].filter(Boolean).join(" ")}>
      <CardContent padding="md" className="bg-white">
        <ErrorContent
          title={title}
          message={message}
          onRetry={onRetry}
          retryText={retryText}
        />
      </CardContent>
    </Card>
  );
}
