import { SicLandlordGuide } from '@/components/sic/SicLandlordGuide'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Für Vermieterinnen und Vermieter',
  description:
    'So liest du ein Mieter-Zertifikat von Swiss Immo Cert: was «GEPRÜFT» heisst, was das Siegel aussagt, wie Betreibungen ausgewiesen werden und wie du per QR-Code prüfst. Keine behördliche Auskunft, keine Bonitätsbewertung.',
  robots: { index: true, follow: true },
}

export default function SicLandlordPage() {
  return <SicLandlordGuide />
}
