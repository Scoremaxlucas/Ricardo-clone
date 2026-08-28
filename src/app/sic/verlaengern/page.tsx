import { SicDossierLogin } from '@/components/sic/SicDossierLogin'
import { SicRenewCheckout } from '@/components/sic/SicRenewCheckout'
import { sicPaths } from '@/lib/sic/config'
import { getSicSession } from '@/lib/sic/session-cookie'

export const dynamic = 'force-dynamic'

export const metadata = { title: 'Verlängerung' }

export default function SicRenewPage() {
  const session = getSicSession()
  if (!session) {
    return (
      <SicDossierLogin
        nextPath={sicPaths.renew}
        title="Verlängerung"
        intro="Melde dich an — danach geht es direkt zur Zahlung. Der Anmeldelink ist 30 Minuten gültig; die Verlängerungsseite selbst bleibt."
      />
    )
  }
  return <SicRenewCheckout />
}
