import type { ReactNode } from "react";
import { Container } from "@/components/layout/Container";
import { Card } from "@/components/ui/Card";

type AdminListLayoutProps = {
  title?: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
};

export default function AdminListLayout({
  title,
  description,
  actions,
  children,
  className = "py-6 space-y-6",
}: AdminListLayoutProps) {
  return (
    <Container size="xl" padding="lg">
      <div className={className}>
        {(title || description || actions) && (
          <Card className="p-6">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                {title && <h1 className="text-2xl font-bold text-slate-900">{title}</h1>}
                {description && <p className="text-slate-600 mt-1">{description}</p>}
              </div>
              {actions && <div className="flex gap-2">{actions}</div>}
            </div>
          </Card>
        )}
        {children}
      </div>
    </Container>
  );
}
