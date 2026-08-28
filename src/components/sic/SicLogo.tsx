import { SIC_COLORS, SIC_TAGLINE, sicLogoMarkHouseStroke } from '@/lib/sic/brand'
import { SIC_BRAND_NAME } from '@/lib/sic/config'

/**
 * SIC-Logo: Haus-Umriss mit Schweizer Kreuz + Wortmarke «Swiss Immo Cert».
 * «Immo» bleibt rot — der lesbare Name ist derselbe wie auf PDF, Mail und AGB.
 * `onDark`: Hausstrich in Paper, sonst verschwindet er auf Navy.
 */
export function SicLogoMark({
  size = 34,
  onDark = false,
  className,
}: {
  size?: number
  onDark?: boolean
  className?: string
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <path
        d="M8 21.5 24 8l16 13.5V41a1.5 1.5 0 0 1-1.5 1.5h-29A1.5 1.5 0 0 1 8 41z"
        stroke={sicLogoMarkHouseStroke(onDark)}
        strokeWidth={3}
        strokeLinejoin="round"
        fill="none"
      />
      <rect x="16" y="20" width="16" height="16" rx="3" fill={SIC_COLORS.red} />
      <rect x="23" y="23.5" width="2.5" height="9" rx="1" fill="#fff" />
      <rect x="19.75" y="26.75" width="9" height="2.5" rx="1" fill="#fff" />
    </svg>
  )
}

export function SicLogo({
  size = 34,
  onDark = false,
  showTagline = false,
  className,
}: {
  size?: number
  onDark?: boolean
  showTagline?: boolean
  className?: string
}) {
  const primary = onDark ? '#ffffff' : SIC_COLORS.navy
  return (
    <span className={`inline-flex items-center gap-2.5 ${className ?? ''}`} aria-label={SIC_BRAND_NAME}>
      <SicLogoMark size={size} onDark={onDark} />
      <span className="flex flex-col leading-none">
        <span
          className="whitespace-nowrap text-[17px] font-bold tracking-tight sm:text-[19px]"
          style={{ color: primary }}
        >
          Swiss <span style={{ color: SIC_COLORS.red }}>Immo</span> Cert
        </span>
        {showTagline && (
          <span
            className="mt-1 text-[10px] font-medium tracking-wide"
            style={{ color: onDark ? 'rgba(255,255,255,0.7)' : SIC_COLORS.navySoft }}
          >
            {SIC_TAGLINE}
          </span>
        )}
      </span>
    </span>
  )
}
