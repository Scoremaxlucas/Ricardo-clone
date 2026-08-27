import { Logo } from '@/components/ui/Logo'
import { SicLogo } from '@/components/sic/SicLogo'

export function AuthBrandLogo({ isSic }: { isSic: boolean }) {
  if (isSic) return <SicLogo size={32} />
  return <Logo size="md" />
}
