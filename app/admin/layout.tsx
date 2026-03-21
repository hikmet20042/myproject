'use client'

import { useSession } from '@/lib/auth/client'
import { UnauthorizedState } from '@/components/shared'

export default function AdminLayout({ children, }: { children: React.ReactNode }) {
  const { data: session } = useSession()

  if (!session) {
    return null
  }

  const isAdmin = session.user?.role === 'admin'

  if (!isAdmin) {
    return (
      <UnauthorizedState
        title={'Giriş Qadağandır'}
        message={'Bu sahəyə daxil olmaq üçün icazən yoxdur.'}
      />
    )
  }

  return (
  <div className="relative min-h-screen overflow-hidden bg-background">
  <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(214_32%_91%)_1px,transparent_1px),linear-gradient(to_bottom,hsl(214_32%_91%)_1px,transparent_1px)] bg-[size:3rem_3rem] opacity-35" />
  <div className="absolute left-1/2 top-16 h-72 w-72 -translate-x-1/2 rounded-full bg-blue-200/25 blur-3xl" />
  <div className="relative z-10 border-b border-gray-200 bg-white/90 shadow-sm backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{'Admin Paneli'}</h1>
              <p className="text-gray-600">{'icma360 platformasını idarə et'}</p>
            </div>
            <div className="flex items-center space-x-3">
              <div className="text-sm text-gray-600">
                {'Xoş gəldin'}, {session?.user?.name || 'Admin'}
              </div>
            </div>
          </div>
        </div>
      </div>
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  ) }
