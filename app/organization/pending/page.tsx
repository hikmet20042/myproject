import Link from "next/link";
import { AppContainer } from "@/components/layout";

export default function OrganizationPendingPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <AppContainer className="py-14 md:py-20">
        <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm md:p-12">
          <h1 className="text-3xl font-bold text-slate-900">
            Təşkilatınız yoxlanışdadır
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-slate-600">
            Təşkilat hesabınız hazırda təsdiq gözləyir. Yoxlanış davam etdiyi müddətdə
            panelə giriş müvəqqəti məhdudlaşdırılıb. Məlumatlarınızı tam və düzgün saxlamaq üçün
            təşkilat profilinizi redaktə edə bilərsiniz.
          </p>
          <div className="mt-8">
            <Link
              href="/organization/profile"
              className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-blue-700"
            >
              Təşkilat profilini redaktə et
            </Link>
          </div>
        </div>
      </AppContainer>
    </div>
  );
}
