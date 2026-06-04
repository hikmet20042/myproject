import { Metadata } from 'next'
import SavedLayoutClient from './SavedLayoutClient'

export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

export default function SavedLayout({ children }: { children: React.ReactNode }) {
  return <SavedLayoutClient>{children}</SavedLayoutClient>
}
