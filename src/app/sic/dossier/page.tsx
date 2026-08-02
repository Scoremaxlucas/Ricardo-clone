import { permanentRedirect } from 'next/navigation'
import { sicPaths } from '@/lib/sic/config'

export const dynamic = 'force-dynamic'

/** Früherer Workspace-Pfad — permanent nach /sic/zertifikat. */
export default function SicDossierRedirectPage() {
  permanentRedirect(sicPaths.certificateWorkspace)
}
