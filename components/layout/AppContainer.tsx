import type { ReactNode } from "react";
import { Container } from "@/components/layout/Container";
import { cn } from "@/lib/utils";

type AppContainerProps = {
  children: ReactNode;
  className?: string;
};

export default function AppContainer({ children, className }: AppContainerProps) {
  return (
    <Container
      size="xl"
      padding="none"
      className={cn("w-full px-4 sm:px-6 lg:px-8 py-16 md:py-20", className)}
    >
      {children}
    </Container>
  );
}
