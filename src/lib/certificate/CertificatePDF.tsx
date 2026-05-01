import { Document, Image, Page, StyleSheet, Text, View } from '@react-pdf/renderer'
import type { CreditCertificateDisplayStatus } from '@/lib/certificate/issueCertificate'
import { formatDate } from '@/lib/utils/formatDate'

const HF = 'Helvetica'
const HFB = 'Helvetica-Bold'

const TEAL = '#18a87c'
const INK = '#1a1a1a'
const LABEL = '#9e9e9e'
const MUTED = '#5a5a5a'
const LINE_LIGHT = '#e0e0e0'
const FOOTER_BG = '#1a1a1a'
const ORANGE_WARN = '#e67e22'
const RED_ALERT = '#c0392b'
const DISCLAIMER = '#b0b0b0'
const FOOTER_TEXT = '#949494'

const PAGE_PAD_X = 48
const FACTS_LABEL = 6.5
const FACTS_VALUE = 12
const FACTS_SUB = 9
const BR_STATUS = 14

function formatQualifyMonthlyChf(maxRent: number): string {
  const n = maxRent.toLocaleString('de-CH')
  return `Qualifiziert für Mieten bis CHF ${n} / Monat`
}

function displayVerifyHostPath(verifyUrl: string): string {
  try {
    const u = new URL(verifyUrl)
    const path = u.pathname.endsWith('/') ? u.pathname : `${u.pathname}/`
    return `${u.host}${path}`
  } catch {
    return verifyUrl.replace(/^https?:\/\//i, '')
  }
}

function expiryPresentation(expiresAt: Date) {
  const daysRemaining = Math.floor(
    (new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  )
  if (daysRemaining > 30) {
    return {
      valueColor: INK,
      sub: null as string | null,
      subColor: undefined as string | undefined,
    }
  }
  if (daysRemaining >= 14) {
    return {
      valueColor: ORANGE_WARN,
      sub: `${daysRemaining} Tage verbleibend`,
      subColor: ORANGE_WARN,
    }
  }
  return {
    valueColor: RED_ALERT,
    sub: `Läuft bald ab — ${Math.max(0, daysRemaining)} Tage`,
    subColor: RED_ALERT,
  }
}

const styles = StyleSheet.create({
  page: {
    width: '100%',
    height: '100%',
    padding: 0,
    margin: 0,
    backgroundColor: '#ffffff',
    fontFamily: HF,
    color: INK,
    position: 'relative',
  },
  topBand: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 6,
    backgroundColor: TEAL,
  },
  scrollBody: {
    paddingBottom: 52,
  },
  headerRow: {
    marginTop: 24,
    paddingLeft: PAGE_PAD_X,
    paddingRight: PAGE_PAD_X,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  brandLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  hSquare: {
    width: 26,
    height: 26,
    borderRadius: 4,
    backgroundColor: TEAL,
    justifyContent: 'center',
    alignItems: 'center',
  },
  hLetter: {
    fontFamily: HFB,
    fontSize: 14,
    color: '#ffffff',
  },
  brandGap: { width: 10 },
  brandName: {
    fontFamily: HF,
    fontSize: 11,
    color: INK,
  },
  qualWord: {
    fontFamily: HF,
    fontSize: 7,
    color: INK,
    letterSpacing: 3,
    textTransform: 'uppercase',
  },
  headerSep: {
    marginTop: 16,
    marginLeft: PAGE_PAD_X,
    marginRight: PAGE_PAD_X,
    height: 0.75,
    backgroundColor: INK,
  },
  certNr: {
    marginTop: 10,
    paddingRight: PAGE_PAD_X,
    fontFamily: HF,
    fontSize: 7.5,
    color: LABEL,
    textAlign: 'right',
  },
  heroBlock: {
    marginTop: 36,
    paddingLeft: PAGE_PAD_X,
  },
  heroKicker: {
    fontFamily: HF,
    fontSize: 7,
    color: LABEL,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  heroName: {
    fontFamily: HFB,
    fontSize: 36,
    color: INK,
    lineHeight: 1.1,
  },
  heroSub: {
    fontFamily: HF,
    fontSize: 11,
    color: MUTED,
    marginTop: 6,
  },
  heroSep: {
    marginTop: 24,
    marginLeft: PAGE_PAD_X,
    marginRight: PAGE_PAD_X,
    height: 0.5,
    backgroundColor: LINE_LIGHT,
  },
  factsWrap: {
    marginTop: 28,
    paddingLeft: PAGE_PAD_X,
    paddingRight: PAGE_PAD_X,
    position: 'relative',
  },
  factsRow: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  factsColLeft: {
    width: 180,
    paddingRight: 8,
  },
  factsColRight: {
    flex: 1,
    minWidth: 0,
    paddingRight: 128,
  },
  lab: {
    fontFamily: HF,
    fontSize: FACTS_LABEL,
    color: LABEL,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 3,
  },
  val: {
    fontFamily: HFB,
    fontSize: FACTS_VALUE,
    color: INK,
    lineHeight: 1.3,
  },
  sub: {
    fontFamily: HF,
    fontSize: FACTS_SUB,
    color: MUTED,
    marginTop: 2,
    lineHeight: 1.3,
  },
  brClean: {
    fontFamily: HFB,
    fontSize: BR_STATUS,
    color: TEAL,
    lineHeight: 1.2,
  },
  brBad: {
    fontFamily: HFB,
    fontSize: BR_STATUS,
    color: RED_ALERT,
    lineHeight: 1.2,
  },
  preQrSep: {
    marginTop: 28,
    marginLeft: PAGE_PAD_X,
    marginRight: PAGE_PAD_X,
    height: 0.5,
    backgroundColor: LINE_LIGHT,
  },
  qrSection: {
    marginTop: 20,
    paddingLeft: PAGE_PAD_X,
    paddingRight: PAGE_PAD_X,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  qrFrame: {
    width: 70,
    height: 70,
    borderWidth: 0.5,
    borderColor: LINE_LIGHT,
    borderStyle: 'solid',
    padding: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qrImg: {
    width: 62,
    height: 62,
  },
  qrCopy: {
    marginLeft: 20,
    flex: 1,
    minWidth: 0,
  },
  qrHead: {
    fontFamily: HF,
    fontSize: 6.5,
    color: LABEL,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  qrUrl: {
    fontFamily: HF,
    fontSize: 8.5,
    color: MUTED,
  },
  qrCodeText: {
    fontFamily: HFB,
    fontSize: 10,
    color: INK,
    letterSpacing: 1,
    marginTop: 4,
  },
  qrFoot: {
    fontFamily: HF,
    fontSize: 7.5,
    color: LABEL,
    marginTop: 8,
  },
  disclaimerBlock: {
    marginTop: 20,
    paddingLeft: PAGE_PAD_X,
    paddingRight: PAGE_PAD_X,
  },
  disclaimerSep: {
    height: 0.5,
    backgroundColor: LINE_LIGHT,
    marginBottom: 12,
  },
  disclaimerText: {
    fontFamily: HF,
    fontSize: 7,
    color: DISCLAIMER,
    lineHeight: 1.5,
  },
  bottomBand: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 26,
    backgroundColor: FOOTER_BG,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingLeft: PAGE_PAD_X,
    paddingRight: PAGE_PAD_X,
  },
  bottomBandText: {
    fontFamily: HF,
    fontSize: 7,
    color: FOOTER_TEXT,
    maxWidth: 360,
  },
  bottomBandTextRight: {
    fontFamily: HF,
    fontSize: 7,
    color: FOOTER_TEXT,
    textAlign: 'right',
  },
  sealAbs: {
    position: 'absolute',
    top: 340,
    right: PAGE_PAD_X,
    width: 120,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sealOuter: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: INK,
    borderStyle: 'solid',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sealInner: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 0.75,
    borderColor: '#d0d0d0',
    borderStyle: 'solid',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sealLine1: {
    fontFamily: HFB,
    fontSize: 8,
    color: INK,
    letterSpacing: 2,
    textAlign: 'center',
  },
  sealOrn: {
    fontFamily: HF,
    fontSize: 6,
    color: MUTED,
    textAlign: 'center',
    marginTop: 2,
  },
  sealLine3: {
    fontFamily: HFB,
    fontSize: 8,
    color: INK,
    letterSpacing: 2,
    textAlign: 'center',
    marginTop: 2,
  },
  sealYear: {
    fontFamily: HF,
    fontSize: 7,
    color: LABEL,
    textAlign: 'center',
    marginTop: 3,
  },
})

export type CertificatePdfProps = {
  certificateCode: string
  issuedAt: Date
  expiresAt: Date
  firstName: string
  lastName: string
  address: string
  zip: string
  city: string
  employmentLine: string
  incomeLabel: string
  incomeQualifiesUpTo: number
  creditStatus: CreditCertificateDisplayStatus
  creditCheckDate: Date
  verifiedCreditCheckCanton: string
  creditCheckResultJson: unknown | null
  /** Server-aufgelöster Kanton; keine Zeile wenn null. */
  canton?: string | null
  verifyUrl: string
  qrDataUrl: string
  year: number
}

export function CertificatePdfDocument(props: CertificatePdfProps) {
  const {
    certificateCode,
    issuedAt,
    expiresAt,
    firstName,
    lastName,
    address,
    zip,
    city,
    employmentLine,
    incomeLabel,
    incomeQualifiesUpTo,
    creditStatus,
    creditCheckDate,
    verifiedCreditCheckCanton: _verifiedCreditCheckCanton,
    creditCheckResultJson: _creditCheckResultJson,
    canton,
    verifyUrl,
    qrDataUrl,
    year,
  } = props

  const holderLine = `${firstName} ${lastName}`.trim()
  const statusClear = creditStatus === 'CLEAR'
  const brSubParts = [`Ausgestellt ${formatDate(creditCheckDate)}`]
  if (canton) {
    brSubParts.push(`Kanton ${canton}`)
  }
  const brSub = brSubParts.join(' · ')

  const expiry = expiryPresentation(expiresAt)
  const verifyPathDisplay = displayVerifyHostPath(verifyUrl)

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.topBand} fixed />

        <View style={styles.scrollBody}>
          <View style={styles.headerRow}>
            <View style={styles.brandLeft}>
              <View style={styles.hSquare}>
                <Text style={styles.hLetter}>H</Text>
              </View>
              <View style={styles.brandGap} />
              <Text style={styles.brandName}>Helvenda Wohnungen</Text>
            </View>
            <Text style={styles.qualWord}>QUALITÄTSNACHWEIS</Text>
          </View>

          <View style={styles.headerSep} />

          <Text style={styles.certNr}>
            Zertifikats-Nr.{`  `}
            {certificateCode}
          </Text>

          <View style={styles.heroBlock}>
            <Text style={styles.heroKicker}>AUSGESTELLT FÜR</Text>
            <Text style={styles.heroName}>{holderLine}</Text>
            <Text style={styles.heroSub}>{employmentLine}</Text>
          </View>

          <View style={styles.heroSep} />

          <View style={styles.factsWrap}>
            <View style={styles.factsRow}>
              <View style={styles.factsColLeft}>
                <Text style={styles.lab}>BETREIBUNGSREGISTER</Text>
                {statusClear ?
                  <Text style={styles.brClean}>Keine Einträge</Text>
                : <Text style={styles.brBad}>Einträge vorhanden</Text>}
                <Text style={styles.sub}>{brSub}</Text>
              </View>
              <View style={styles.factsColRight}>
                <Text style={styles.lab}>HAUSHALTSEINKOMMEN</Text>
                <Text style={styles.val}>{incomeLabel}</Text>
                <Text style={styles.sub}>{formatQualifyMonthlyChf(incomeQualifiesUpTo)}</Text>
              </View>
            </View>

            <View style={styles.factsRow}>
              <View style={styles.factsColLeft}>
                <Text style={styles.lab}>AUSSTELLUNGSDATUM</Text>
                <Text style={styles.val}>{formatDate(issuedAt)}</Text>
              </View>
              <View style={styles.factsColRight}>
                <Text style={styles.lab}>GÜLTIG BIS</Text>
                <Text style={[styles.val, { color: expiry.valueColor }]}>{formatDate(expiresAt)}</Text>
                {expiry.sub ?
                  <Text style={[styles.sub, { color: expiry.subColor }]}>{expiry.sub}</Text>
                : null}
              </View>
            </View>

            <View style={styles.factsRow}>
              <View style={styles.factsColLeft}>
                <Text style={styles.lab}>BESCHÄFTIGUNG</Text>
                <Text style={styles.val}>{employmentLine}</Text>
              </View>
              <View style={styles.factsColRight}>
                <Text style={styles.lab}>ADRESSE</Text>
                <Text style={styles.val}>{address}</Text>
                <Text style={styles.sub}>
                  {zip} {city}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.preQrSep} />

          <View style={styles.qrSection}>
            <View style={styles.qrFrame}>{qrDataUrl ? <Image src={qrDataUrl} style={styles.qrImg} /> : null}</View>
            <View style={styles.qrCopy}>
              <Text style={styles.qrHead}>ECHTHEIT PRÜFEN</Text>
              <Text style={styles.qrUrl}>{verifyPathDisplay}</Text>
              <Text style={styles.qrCodeText}>{certificateCode}</Text>
              <Text style={styles.qrFoot}>Dieser Code ist einmalig.</Text>
            </View>
          </View>

          <View style={styles.disclaimerBlock}>
            <View style={styles.disclaimerSep} />
            <Text style={styles.disclaimerText}>
              Helvenda Wohnungen bestätigt die Verifizierung der genannten Angaben zum Zeitpunkt der Ausstellung.
              Helvenda haftet nicht für nachträgliche Änderungen.
            </Text>
          </View>
        </View>

        <View style={styles.sealAbs}>
          <View style={styles.sealOuter}>
            <View style={styles.sealInner}>
              <Text style={styles.sealLine1}>HELVENDA</Text>
              <Text style={styles.sealOrn}>◆</Text>
              <Text style={styles.sealLine3}>VERIFIZIERT</Text>
              <Text style={styles.sealYear}>{String(year)}</Text>
            </View>
          </View>
        </View>

        <View style={styles.bottomBand} fixed>
          <Text style={styles.bottomBandText}>
            © {year} Helvenda Wohnungen · Score-Max GmbH · Zollikerberg
          </Text>
          <Text style={styles.bottomBandTextRight}>Ohne Unterschrift gültig</Text>
        </View>
      </Page>
    </Document>
  )
}
