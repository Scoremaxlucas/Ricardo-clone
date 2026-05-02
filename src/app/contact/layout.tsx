import { DualHostDocumentShell } from '@/components/layout/DualHostDocumentShell'
import { isWohnenMatchingHostFromHeaders } from '@/lib/tenant-host'
import { headers } from 'next/headers'

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  const wohnen = isWohnenMatchingHostFromHeaders(headers())
  return <DualHostDocumentShell wohnen={wohnen}>{children}</DualHostDocumentShell>
}
