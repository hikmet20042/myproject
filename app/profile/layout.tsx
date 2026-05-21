import { Metadata } from 'next'
import ProfileLayoutClient from './ProfileLayoutClient'

export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return <ProfileLayoutClient>{children}</ProfileLayoutClient>
}
