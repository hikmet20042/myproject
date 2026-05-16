import { AppContainer } from "@/components/layout";
import { Card } from "@/components/ui/Card";
import { ButtonLink } from "@/components/ui";

export default function OrganizationPendingPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <AppContainer className="py-14 md:py-20">
        <Card className="mx-auto max-w-3xl p-8 text-center md:p-12">
          <h1 className="text-3xl font-bold text-slate-900">
            Təşkilatınız yoxlanışdadır
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-slate-600">
            Təşkilat hesabınız hazırda təsdiq gözləyir. Yoxlanış davam etdiyi müddətdə
            panelə giriş müvəqqəti məhdudlaşdırılıb. Məlumatlarınızı tam və düzgün saxlamaq üçün
            təşkilat profilinizi redaktə edə bilərsiniz.
          </p>
          <div className="mt-8">
            <ButtonLink
              href="/organization/profile"
              variant="primary"
              size="md"
              className="px-6 py-3"
            >
              Təşkilat profilini redaktə et
            </ButtonLink>
          </div>
        </Card>
      </AppContainer>
    </div>
  );
}
