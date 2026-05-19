'use client'

import { ArrowLeft, LogOut } from 'lucide-react'
import Link from 'next/link'
import { useLocalizedPath } from '@/hooks/useLocalizedPath'
import { FormLayout } from '@/components/forms'
import { Card, ButtonLink, Button } from '@/components/ui'
import { signOut } from '@/lib/auth/client'

export default function OrganizationPendingPage() {
  const localePath = useLocalizedPath()

  const handleSignOut = async () => {
    await signOut((path) => {
      window.location.href = path
    })
  }

  const signOutButton = (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={handleSignOut}
      className="text-slate-500 hover:text-red-600"
      icon={LogOut}
    >
      Hesabdan çıx
    </Button>
  )

  return (
    <FormLayout
      title="Təşkilatınız yoxlanışdadır"
      subtitle="Təşkilat hesabınız hazırda təsdiq gözləyir. Yoxlanış davam etdiyi müddətdə panelə giriş müvəqqəti məhdudlaşdırılıb."
      rightAction={signOutButton}
    >
      <Card className="p-8 text-center sm:p-12">
        <p className="mx-auto max-w-2xl text-slate-600">
          Məlumatlarınızı tam və düzgün saxlamaq üçün təşkilat profilinizi redaktə edə bilərsiniz.
        </p>
        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <ButtonLink
            href={localePath('/organization/profile')}
            variant="primary"
            size="md"
            className="px-6 py-3"
          >
            Təşkilat profilini redaktə et
          </ButtonLink>
          <Link href={localePath('/')}>
            <Button variant="outline" size="md" className="px-6 py-3" icon={ArrowLeft}>
              Ana səhifə
            </Button>
          </Link>
        </div>
      </Card>
    </FormLayout>
  )
}
