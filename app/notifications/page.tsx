import NotificationsPageContainer from "@/features/notifications/components/NotificationsPageContainer";
import { AppContainer } from "@/components/layout";

export default function NotificationsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100 text-foreground">
      <AppContainer className="py-8 md:py-10">
        <NotificationsPageContainer />
      </AppContainer>
    </div>
  );
}
