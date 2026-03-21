import { ReactNode } from "react";

type EmptyStateKind = "empty-list" | "empty-filtered";
export type SectionEmptyStateScope =
  | "dashboard-events-list"
  | "dashboard-vacancies-list"
  | "dashboard-notifications";

interface SectionEmptyStateSlotProps {
  kind: EmptyStateKind;
  scope: SectionEmptyStateScope;
  children: ReactNode;
}

export default function SectionEmptyStateSlot({
  kind,
  scope,
  children,
}: SectionEmptyStateSlotProps) {
  return (
    <div
      className="contents"
      data-ui-state-slot="empty"
      data-empty-state-kind={kind}
      data-empty-state-scope={scope}
    >
      {children}
    </div>
  );
}
