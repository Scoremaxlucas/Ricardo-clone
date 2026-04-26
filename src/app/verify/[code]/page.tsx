import type { Metadata } from 'next'
import { VerifyPageClient } from './VerifyPageClient'

type Props = { params: Promise<{ code: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { code } = await params
  return {
    title: `Zertifikat prüfen — ${decodeURIComponent(code)} | Helvenda Wohnungen`,
    robots: { index: false, follow: false },
  }
}

export default async function VerifyCertificatePage({ params }: Props) {
  const { code } = await params
  return <VerifyPageClient code={decodeURIComponent(code)} />
}
