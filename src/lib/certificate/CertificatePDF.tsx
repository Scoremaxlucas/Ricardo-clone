import { Document, Image, Page, StyleSheet, Text, View } from '@react-pdf/renderer'
import type { CreditCertificateDisplayStatus } from '@/lib/certificate/issueCertificate'

const TEAL = '#18a87c'
const INK = '#1a1a1a'
const LABEL = '#9e9e9e'
const MUTED = '#5a5a5a'
const LINE = '#e0e0e0'
const LINE2 = '#e8e8e8'
const FOOTER_BG = '#1a1a1a'
const ORANGE = '#e67e22'
const RED = '#c0392b'
const DISCLAIMER = '#b0b0b0'
const PAD = 48

const HF = 'Helvetica'
const HFB = 'Helvetica-Bold'

/** Nur ASCII-Apostroph (') als Tausenderzeichen */
function formatNumber(n: number): string {
  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, "'")
}

function formatPdfDate(date: Date | string): string {
  const d = new Date(date)
  if (Number.isNaN(d.getTime())) {
    return '--.--.----'
  }
  return d.toLocaleDateString('de-CH', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

function verifyDisplayPath(verifyUrl: string): string {
  try {
    const u = new URL(verifyUrl)
    const path = u.pathname.endsWith('/') ? u.pathname : `${u.pathname}/`
    return `${u.host}${path}`
  } catch {
    return verifyUrl.replace(/^https?:\/\//i, '')
  }
}

function daysRemainingFor(expiresAt: Date): number {
  return Math.max(
    0,
    Math.floor((new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  )
}

const styles = StyleSheet.create({
  page: {
    width: '100%',
    height: '100%',
    backgroundColor: '#ffffff',
    fontFamily: HF,
    color: INK,
    paddingBottom: 56,
    position: 'relative',
  },
  /** Kein Teal hier: Teal nur Logo + Betreibungsregister-Status laut Vorgabe */
  topBand: {
    height: 4,
    backgroundColor: INK,
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: PAD,
    paddingTop: 22,
    paddingBottom: 16,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoBox: {
    width: 28,
    height: 28,
    backgroundColor: TEAL,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoLetter: {
    color: '#ffffff',
    fontSize: 15,
    fontFamily: HFB,
  },
  brandName: {
    fontSize: 12,
    fontFamily: HF,
    color: INK,
    marginLeft: 10,
  },
  docTitle: {
    fontSize: 7,
    fontFamily: HFB,
    color: INK,
    letterSpacing: 3,
  },
  sepBlack: {
    height: 1,
    backgroundColor: INK,
    marginHorizontal: PAD,
  },
  certNrWrap: {
    paddingHorizontal: PAD,
    marginTop: 10,
    alignItems: 'flex-end',
  },
  certNr: {
    fontSize: 7.5,
    fontFamily: HF,
    color: LABEL,
  },
  hero: {
    paddingHorizontal: PAD,
    marginTop: 22,
  },
  heroKicker: {
    fontSize: 7,
    fontFamily: HFB,
    color: LABEL,
    letterSpacing: 2,
    marginBottom: 8,
  },
  heroName: {
    fontSize: 42,
    fontFamily: HFB,
    color: INK,
    lineHeight: 1.05,
  },
  sepLight: {
    height: 0.5,
    backgroundColor: LINE,
    marginHorizontal: PAD,
    marginTop: 16,
  },
  factsOuter: {
    paddingHorizontal: PAD,
    marginTop: 20,
    flexDirection: 'row',
    position: 'relative',
    paddingRight: 120,
  },
  colLeft: {
    width: 220,
  },
  colRight: {
    flex: 1,
    paddingLeft: 24,
    minWidth: 0,
  },
  factBlock: {
    marginBottom: 18,
  },
  factLabel: {
    fontSize: 6.5,
    fontFamily: HFB,
    color: LABEL,
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  factValue: {
    fontSize: 12,
    fontFamily: HFB,
    color: INK,
  },
  factValueSm: {
    fontSize: 14,
    fontFamily: HFB,
    color: INK,
  },
  factSub: {
    fontSize: 8.5,
    fontFamily: HF,
    color: MUTED,
    marginTop: 2,
  },
  sealWrap: {
    position: 'absolute',
    right: PAD,
    top: 10,
    width: 110,
    height: 110,
    borderRadius: 9999,
    borderWidth: 1.5,
    borderColor: '#c8c8c8',
    borderStyle: 'solid',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sealInner: {
    width: 90,
    height: 90,
    borderRadius: 9999,
    borderWidth: 0.5,
    borderColor: LINE,
    borderStyle: 'solid',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sealLine: {
    fontSize: 7.5,
    fontFamily: HFB,
    color: INK,
    letterSpacing: 2,
    marginBottom: 4,
  },
  sealYear: {
    fontSize: 7,
    fontFamily: HF,
    color: LABEL,
  },
  preQrSep: {
    height: 0.5,
    backgroundColor: LINE,
    marginHorizontal: PAD,
    marginTop: 16,
  },
  qrRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: PAD,
    marginTop: 16,
  },
  qrFrame: {
    width: 72,
    height: 72,
    borderWidth: 0.5,
    borderColor: LINE,
    borderStyle: 'solid',
    padding: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrImg: {
    width: 62,
    height: 62,
  },
  qrCopy: {
    marginLeft: 18,
    flex: 1,
    minWidth: 0,
  },
  qrHead: {
    fontSize: 6.5,
    fontFamily: HFB,
    color: LABEL,
    letterSpacing: 1.5,
    marginBottom: 5,
  },
  qrUrl: {
    fontSize: 8.5,
    fontFamily: HF,
    color: MUTED,
  },
  qrCode: {
    fontSize: 11,
    fontFamily: HFB,
    color: INK,
    letterSpacing: 0.5,
    marginTop: 4,
  },
  qrFoot: {
    fontSize: 7.5,
    fontFamily: HF,
    color: '#b0b0b0',
    marginTop: 6,
  },
  disclaimerSep: {
    height: 0.5,
    backgroundColor: LINE,
    marginHorizontal: PAD,
    marginTop: 16,
    marginBottom: 12,
  },
  disclaimer: {
    fontSize: 7,
    fontFamily: HF,
    color: DISCLAIMER,
    paddingHorizontal: PAD,
    lineHeight: 1.5,
  },
  decSep: {
    height: 0.5,
    backgroundColor: LINE2,
    marginHorizontal: PAD,
    marginTop: 20,
    marginBottom: 16,
  },
  decRow: {
    flexDirection: 'row',
    paddingHorizontal: PAD,
    marginBottom: 16,
  },
  decCol: {
    flex: 1,
    minWidth: 0,
    paddingRight: 8,
  },
  decLab: {
    fontSize: 6,
    fontFamily: HFB,
    color: '#b0b0b0',
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  decVal: {
    fontSize: 9,
    fontFamily: HFB,
    color: '#888888',
  },
  decSub: {
    fontSize: 7.5,
    fontFamily: HF,
    color: '#a0a0a0',
    marginTop: 2,
  },
  decClose: {
    fontSize: 6,
    fontFamily: HF,
    color: '#d0d0d0',
    letterSpacing: 3,
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: PAD,
  },
  bottomBand: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 26,
    backgroundColor: FOOTER_BG,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: PAD,
  },
  bottomText: {
    fontSize: 7,
    fontFamily: HF,
    color: 'rgba(255,255,255,0.4)',
    maxWidth: 360,
  },
  bottomTextRight: {
    fontSize: 7,
    fontFamily: HF,
    color: 'rgba(255,255,255,0.4)',
    textAlign: 'right',
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
  canton: string | null
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

  const holder = `${firstName} ${lastName}`.trim()
  const brClear = creditStatus === 'CLEAR'
  const kantonSuffix = canton ? ` - Kanton ${canton}` : ''
  const brSub = `Ausgestellt ${formatPdfDate(creditCheckDate)}${kantonSuffix}`

  const daysRem = daysRemainingFor(expiresAt)
  const expiryValueColor =
    daysRem > 30 ? INK : daysRem > 14 ? ORANGE : RED

  const verifyPath = verifyDisplayPath(verifyUrl)

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.topBand} fixed />

        <View style={styles.header}>
          <View style={styles.brandRow}>
            <View style={styles.logoBox}>
              <Text style={styles.logoLetter}>H</Text>
            </View>
            <Text style={styles.brandName}>Helvenda Wohnungen</Text>
          </View>
          <Text style={styles.docTitle}>QUALITAETSNACHWEIS</Text>
        </View>

        <View style={styles.sepBlack} />

        <View style={styles.certNrWrap}>
          <Text style={styles.certNr}>Zertifikats-Nr.  {certificateCode}</Text>
        </View>

        <View style={styles.hero}>
          <Text style={styles.heroKicker}>AUSGESTELLT FUER</Text>
          <Text style={styles.heroName}>{holder}</Text>
        </View>

        <View style={styles.sepLight} />

        <View style={styles.factsOuter}>
          <View style={styles.colLeft}>
            <View style={styles.factBlock}>
              <Text style={styles.factLabel}>BETREIBUNGSREGISTER</Text>
              <Text
                style={[
                  styles.factValueSm,
                  { color: brClear ? TEAL : RED },
                ]}
              >
                {brClear ? 'Keine Eintraege' : 'Eintraege vorhanden'}
              </Text>
              <Text style={styles.factSub}>{brSub}</Text>
            </View>

            <View style={styles.factBlock}>
              <Text style={styles.factLabel}>AUSSTELLUNGSDATUM</Text>
              <Text style={styles.factValue}>{formatPdfDate(issuedAt)}</Text>
            </View>

            <View style={styles.factBlock}>
              <Text style={styles.factLabel}>BESCHAEFTIGUNG</Text>
              <Text style={styles.factValue}>{employmentLine}</Text>
            </View>
          </View>

          <View style={styles.colRight}>
            <View style={styles.factBlock}>
              <Text style={styles.factLabel}>HAUSHALTSEINKOMMEN</Text>
              <Text style={styles.factValue}>{incomeLabel}</Text>
              <Text style={styles.factSub}>
                {`Qualifiziert fuer Mieten bis CHF ${formatNumber(incomeQualifiesUpTo)} / Monat`}
              </Text>
            </View>

            <View style={styles.factBlock}>
              <Text style={styles.factLabel}>GUELTIG BIS</Text>
              <Text style={[styles.factValue, { color: expiryValueColor }]}>
                {formatPdfDate(expiresAt)}
              </Text>
              {daysRem <= 30 ?
                <Text style={[styles.factSub, { color: ORANGE }]}>
                  {`${daysRem} Tage verbleibend`}
                </Text>
              : null}
            </View>

            <View style={styles.factBlock}>
              <Text style={styles.factLabel}>ADRESSE</Text>
              <Text style={styles.factValue}>{address}</Text>
              <Text style={styles.factSub}>
                {zip} {city}
              </Text>
            </View>
          </View>

          <View style={styles.sealWrap}>
            <View style={styles.sealInner}>
              <Text style={styles.sealLine}>HELVENDA</Text>
              <Text style={styles.sealLine}>VERIFIZIERT</Text>
              <Text style={styles.sealYear}>{String(year)}</Text>
            </View>
          </View>
        </View>

        <View style={styles.preQrSep} />

        <View style={styles.qrRow}>
          <View style={styles.qrFrame}>
            {qrDataUrl ? <Image src={qrDataUrl} style={styles.qrImg} /> : null}
          </View>
          <View style={styles.qrCopy}>
            <Text style={styles.qrHead}>ECHTHEIT PRUEFEN</Text>
            <Text style={styles.qrUrl}>{verifyPath}</Text>
            <Text style={styles.qrCode}>{certificateCode}</Text>
            <Text style={styles.qrFoot}>Code einmalig — Online gegen Referenz pruefbar.</Text>
          </View>
        </View>

        <View style={styles.disclaimerSep} />
        <Text style={styles.disclaimer}>
          Helvenda Wohnungen bestaetigt die Verifizierung der genannten Angaben zum Zeitpunkt der
          Ausstellung. Helvenda haftet nicht fuer nachtraegliche Aenderungen der persoenlichen
          Situation des Zertifikatsinhabers.
        </Text>

        <View style={styles.decSep} />

        <View style={styles.decRow}>
          <View style={styles.decCol}>
            <Text style={styles.decLab}>AUSGESTELLT DURCH</Text>
            <Text style={styles.decVal}>Helvenda Wohnungen</Text>
            <Text style={styles.decSub}>wohnen.helvenda.ch</Text>
          </View>
          <View style={styles.decCol}>
            <Text style={styles.decLab}>GUELTIGKEITSDAUER</Text>
            <Text style={styles.decVal}>90 Tage</Text>
            <Text style={styles.decSub}>Ab Ausstellungsdatum</Text>
          </View>
          <View style={[styles.decCol, { paddingRight: 0 }]}>
            <Text style={styles.decLab}>VERIFIKATION</Text>
            <Text style={styles.decVal}>Online pruefbar</Text>
            <Text style={styles.decSub}>wohnen.helvenda.ch/verify</Text>
          </View>
        </View>

        <Text style={styles.decClose}>
          {`HELVENDA WOHNUNGEN  -  QUALITAETSNACHWEIS  -  ${year}`}
        </Text>

        <View style={styles.bottomBand} fixed>
          <Text style={styles.bottomText}>
            {`${year} Helvenda Wohnungen - Score-Max GmbH - Zollikerberg`}
          </Text>
          <Text style={styles.bottomTextRight}>Ohne Unterschrift gueltig</Text>
        </View>
      </Page>
    </Document>
  )
}
