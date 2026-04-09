'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { signOut } from '@/lib/auth/client'
import Link from 'next/link'
import { LogOut, ArrowLeft } from 'lucide-react'
import { useLocalizedPath } from '@/hooks/useLocalizedPath'

export default function SignOut() {
  const localePath = useLocalizedPath()
  const router = useRouter()

  useEffect(() => {
    const handleSignOut = async () => {
      await signOut()
      router.replace(localePath('/'))
    }

    handleSignOut()
  }, [localePath, router])

  return (
    <div className="relative min-h-screen overflow-hidden bg-background py-10">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(214_32%_91%)_1px,transparent_1px),linear-gradient(to_bottom,hsl(214_32%_91%)_1px,transparent_1px)] bg-[size:3rem_3rem] opacity-35" />
      <div className="absolute left-1/2 top-24 h-72 w-72 -translate-x-1/2 rounded-full bg-blue-200/30 blur-3xl" />

      <div className="relative z-10 mx-auto flex min-h-[80vh] w-full max-w-lg items-center justify-center px-4 sm:px-6">
        <div className="w-full rounded-3xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
              <LogOut className="h-6 w-6 text-blue-700" />
            </div>

            <h1 className="text-2xl font-black text-gray-900">
              {'Çıxış edilir'}
            </h1>

            <p className="mt-2 text-sm text-gray-600">
              {'Çıxış edildi'}
            </p>

            <div className="mt-4">
              <div className="mx-auto h-6 w-6 animate-spin rounded-full border-b-2 border-blue-600" />
            </div>

            <p className="mt-4 text-xs text-gray-500">
              {'Ana səhifəyə yönləndirilir'}
            </p>

            <div className="mt-6">
              <Link
                href={localePath('/')}
                className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 transition-colors hover:text-blue-500"
              >
                <ArrowLeft className="h-4 w-4" />
                {'İndi ana səhifəyə keç'}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
