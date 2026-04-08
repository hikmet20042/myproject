import type { ReactNode } from "react";
import { Container } from "@/components/layout/Container";

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
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                {title && <h1 className="text-2xl font-bold text-gray-900">{title}</h1>}
                {description && <p className="text-gray-600 mt-1">{description}</p>}
              </div>
              {actions && <div className="flex gap-2">{actions}</div>}
            </div>
          </div>
        )}
        {children}
      </div>
    </Container>
  );
}
