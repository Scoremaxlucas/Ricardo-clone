import { SIC_COLORS, SIC_HOUSE_MARK, SIC_TAGLINE, sicLogoMarkHouseStroke } from '@/lib/sic/brand'
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
  const M = SIC_HOUSE_MARK
  return (
    <svg
      width={size}
      height={size}
      viewBox={M.viewBox}
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <path
        d={M.outline}
        stroke={sicLogoMarkHouseStroke(onDark)}
        strokeWidth={M.outlineStrokeWidth}
        strokeLinejoin="round"
        fill="none"
      />
      <rect {...M.square} fill={SIC_COLORS.red} />
      <rect {...M.crossV} fill="#fff" />
      <rect {...M.crossH} fill="#fff" />
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
    <span className={`inline-flex min-w-0 items-center gap-2 sm:gap-2.5 ${className ?? ''}`} aria-label={SIC_BRAND_NAME}>
      <SicLogoMark size={size} onDark={onDark} />
      <span className="flex flex-col leading-none">
        <span
          className="whitespace-nowrap text-[15px] font-bold tracking-tight sm:text-[19px]"
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
