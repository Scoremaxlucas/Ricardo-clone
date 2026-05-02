import { Document, Image, Page, StyleSheet, Text, View } from '@react-pdf/renderer'
import type { CreditCertificateDisplayStatus } from '@/lib/certificate/issueCertificate'

/** Helvenda Wohnungen — Qualitätsnachweis PDF (Flagship-Layout, druckfreundlich, nur Standard-PDF-Schriften) */
const TEAL = '#0d6b52'
const TEAL_LIGHT = '#e8f4f0'
const TEAL_ACCENT = '#18a87c'
const INK = '#121814'
const INK_SOFT = '#2a322e'
const LABEL = '#5a6560'
const MUTED = '#4a524e'
const LINE = '#d8dcd9'
const LINE_STRONG = '#1a1f1c'
const PAPER = '#e8e9e6'
const SHEET = '#ffffff'
const SHEET_EDGE = '#bfc4bf'
const FOOTER_BG = '#0f1412'
const ORANGE = '#c45c12'
const RED = '#a82828'
const DISCLAIMER = '#5c6560'
const PAD_OUTER = 22
const PAD = 40
const HF = 'Helvetica'
const HFB = 'Helvetica-Bold'
const CF = 'Courier'

function formatNumber(n: number): string {
  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, "'")
}

function formatPdfDate(date: Date | string): string {
  const d = new Date(date)
  if (Number.isNaN(d.getTime())) {
    return '—.—.—'
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
    backgroundColor: PAPER,
    fontFamily: HF,
    color: INK,
    padding: PAD_OUTER,
    paddingBottom: 52,
  },
  sheet: {
    flex: 1,
    backgroundColor: SHEET,
    borderWidth: 0.75,
    borderColor: SHEET_EDGE,
    position: 'relative',
    paddingBottom: 36,
  },
  topRuleTeal: {
    height: 3,
    backgroundColor: TEAL_ACCENT,
    width: '100%',
  },
  topRuleInk: {
    height: 2,
    backgroundColor: LINE_STRONG,
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: PAD,
    paddingTop: 26,
    paddingBottom: 14,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoBox: {
    width: 30,
    height: 30,
    backgroundColor: TEAL_ACCENT,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoLetter: {
    color: '#ffffff',
    fontSize: 16,
    fontFamily: HFB,
  },
  brandCol: {
    marginLeft: 11,
  },
  brandName: {
    fontSize: 11,
    fontFamily: HFB,
    color: INK,
    letterSpacing: 0.3,
  },
  brandSub: {
    fontSize: 6.5,
    fontFamily: HF,
    color: LABEL,
    marginTop: 2,
    letterSpacing: 1.2,
  },
  docTitleBlock: {
    alignItems: 'flex-end',
  },
  docTitle: {
    fontSize: 8,
    fontFamily: HFB,
    color: INK,
    letterSpacing: 2.8,
  },
  docTitleRule: {
    width: 112,
    height: 1.5,
    backgroundColor: TEAL_ACCENT,
    marginTop: 6,
  },
  registryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: PAD,
    paddingVertical: 10,
    marginHorizontal: PAD,
    marginTop: 4,
    borderWidth: 0.75,
    borderColor: LINE,
    backgroundColor: '#fafbf9',
  },
  registryLabel: {
    fontSize: 6.5,
    fontFamily: HFB,
    color: LABEL,
    letterSpacing: 1.4,
  },
  registryCode: {
    fontSize: 9,
    fontFamily: CF,
    color: INK,
    letterSpacing: 0.4,
  },
  heroRow: {
    flexDirection: 'row',
    paddingHorizontal: PAD,
    marginTop: 22,
    alignItems: 'flex-end',
    gap: 20,
  },
  heroCol: {
    flex: 1,
    minWidth: 0,
    borderLeftWidth: 3,
    borderLeftColor: TEAL_ACCENT,
    paddingLeft: 14,
    paddingVertical: 4,
  },
  heroKicker: {
    fontSize: 6.5,
    fontFamily: HFB,
    color: LABEL,
    letterSpacing: 2.2,
    marginBottom: 6,
  },
  heroName: {
    fontSize: 22,
    fontFamily: HFB,
    color: INK,
    lineHeight: 1.08,
    letterSpacing: -0.2,
  },
  heroPromise: {
    marginTop: 10,
    fontSize: 8,
    fontFamily: HF,
    color: MUTED,
    lineHeight: 1.45,
    maxWidth: 340,
  },
  sealOuter: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2.25,
    borderColor: TEAL,
    backgroundColor: TEAL_LIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  sealInner: {
    width: 82,
    height: 82,
    borderRadius: 41,
    borderWidth: 0.75,
    borderColor: TEAL,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 4,
  },
  sealMonogram: {
    fontSize: 18,
    fontFamily: HFB,
    color: TEAL,
    letterSpacing: 2,
    marginBottom: 2,
  },
  sealLine: {
    fontSize: 5.5,
    fontFamily: HFB,
    color: TEAL,
    letterSpacing: 1.8,
    marginBottom: 1,
  },
  sealYear: {
    fontSize: 8,
    fontFamily: HFB,
    color: TEAL,
    marginTop: 2,
  },
  factsFrame: {
    marginHorizontal: PAD,
    marginTop: 20,
    borderWidth: 0.75,
    borderColor: LINE,
    paddingTop: 14,
    paddingBottom: 12,
    paddingHorizontal: 14,
  },
  factsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  colLeft: {
    width: 228,
    paddingRight: 12,
  },
  colDivider: {
    width: 0.75,
    minHeight: 168,
    backgroundColor: LINE,
    marginTop: 2,
  },
  colRight: {
    flex: 1,
    paddingLeft: 14,
    minWidth: 0,
  },
  factBlock: {
    marginBottom: 11,
  },
  factLabel: {
    fontSize: 6,
    fontFamily: HFB,
    color: LABEL,
    letterSpacing: 1.6,
    marginBottom: 3,
  },
  factValue: {
    fontSize: 11,
    fontFamily: HFB,
    color: INK,
    lineHeight: 1.2,
  },
  factValueSm: {
    fontSize: 12,
    fontFamily: HFB,
    lineHeight: 1.15,
  },
  factSub: {
    fontSize: 8,
    fontFamily: HF,
    color: MUTED,
    marginTop: 2,
    lineHeight: 1.35,
  },
  verifyPanel: {
    marginHorizontal: PAD,
    marginTop: 18,
    borderWidth: 0.75,
    borderColor: LINE,
    backgroundColor: '#f6f8f6',
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  qrFrame: {
    width: 76,
    height: 76,
    borderWidth: 0.75,
    borderColor: INK,
    padding: 5,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: SHEET,
  },
  qrImg: {
    width: 64,
    height: 64,
  },
  qrCopy: {
    marginLeft: 16,
    flex: 1,
    minWidth: 0,
  },
  qrHead: {
    fontSize: 6.5,
    fontFamily: HFB,
    color: INK,
    letterSpacing: 2,
    marginBottom: 4,
  },
  qrSub: {
    fontSize: 7,
    fontFamily: HF,
    color: LABEL,
    marginBottom: 6,
  },
  qrUrl: {
    fontSize: 7.5,
    fontFamily: CF,
    color: INK_SOFT,
    lineHeight: 1.35,
  },
  qrFoot: {
    fontSize: 7,
    fontFamily: HF,
    color: LABEL,
    marginTop: 6,
    lineHeight: 1.45,
  },
  disclaimerSep: {
    height: 0.75,
    backgroundColor: LINE,
    marginHorizontal: PAD,
    marginTop: 18,
    marginBottom: 10,
  },
  disclaimer: {
    fontSize: 7.5,
    fontFamily: HF,
    color: DISCLAIMER,
    paddingHorizontal: PAD,
    lineHeight: 1.55,
  },
  decSep: {
    height: 0.75,
    backgroundColor: LINE,
    marginHorizontal: PAD,
    marginTop: 16,
    marginBottom: 12,
  },
  decRow: {
    flexDirection: 'row',
    paddingHorizontal: PAD,
    marginBottom: 12,
  },
  decColFirst: {
    flex: 1,
    minWidth: 0,
    paddingRight: 12,
    borderRightWidth: 0.75,
    borderRightColor: LINE,
  },
  decColMid: {
    flex: 1,
    minWidth: 0,
    paddingHorizontal: 12,
    borderRightWidth: 0.75,
    borderRightColor: LINE,
  },
  decColLast: {
    flex: 1,
    minWidth: 0,
    paddingLeft: 12,
  },
  decLab: {
    fontSize: 5.5,
    fontFamily: HFB,
    color: LABEL,
    letterSpacing: 1.4,
    marginBottom: 3,
  },
  decVal: {
    fontSize: 8.5,
    fontFamily: HFB,
    color: INK_SOFT,
  },
  decSub: {
    fontSize: 7,
    fontFamily: HF,
    color: MUTED,
    marginTop: 2,
  },
  decClose: {
    fontSize: 6,
    fontFamily: HFB,
    color: '#6a726e',
    letterSpacing: 2.2,
    textAlign: 'center',
    marginBottom: 18,
    paddingHorizontal: PAD,
  },
  bottomBand: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 28,
    backgroundColor: FOOTER_BG,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: PAD,
    borderTopWidth: 0.75,
    borderTopColor: '#2a3430',
  },
  bottomText: {
    fontSize: 6.5,
    fontFamily: HF,
    color: 'rgba(255,255,255,0.72)',
    maxWidth: 380,
  },
  bottomTextRight: {
    fontSize: 6.5,
    fontFamily: HFB,
    color: 'rgba(255,255,255,0.85)',
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
  const kantonSuffix = canton ? ` · Kanton ${canton}` : ''
  const brSub = `Ausgestellt am ${formatPdfDate(creditCheckDate)}${kantonSuffix}`

  const daysRem = daysRemainingFor(expiresAt)
  const expiryValueColor = daysRem > 30 ? INK : daysRem > 14 ? ORANGE : RED
  const verifyPath = verifyDisplayPath(verifyUrl)

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.sheet}>
          <View style={styles.topRuleTeal} fixed />
          <View style={styles.topRuleInk} fixed />

          <View style={styles.header}>
            <View style={styles.brandRow}>
              <View style={styles.logoBox}>
                <Text style={styles.logoLetter}>H</Text>
              </View>
              <View style={styles.brandCol}>
                <Text style={styles.brandName}>Helvenda Wohnungen</Text>
                <Text style={styles.brandSub}>SCHWEIZER MIETMARKTPLATZ</Text>
              </View>
            </View>
            <View style={styles.docTitleBlock}>
              <Text style={styles.docTitle}>QUALITÄTSNACHWEIS</Text>
              <View style={styles.docTitleRule} />
            </View>
          </View>

          <View style={styles.registryRow}>
            <Text style={styles.registryLabel}>REGISTRIERNUMMER</Text>
            <Text style={styles.registryCode}>{certificateCode}</Text>
          </View>

          <View style={styles.heroRow}>
            <View style={styles.heroCol}>
              <Text style={styles.heroKicker}>AUSGESTELLT FÜR</Text>
              <Text style={styles.heroName}>{holder}</Text>
              <Text style={styles.heroPromise}>
                Dieses Dokument bestätigt die zum Zeitpunkt der Ausstellung geprüften Angaben. Es dient Mietenden und
                Vermietenden als nachvollziehbarer Nachweis — ergänzend zu den üblichen Unterlagen.
              </Text>
            </View>
            <View style={styles.sealOuter}>
              <View style={styles.sealInner}>
                <Text style={styles.sealMonogram}>H</Text>
                <Text style={styles.sealLine}>VERIFIZIERT</Text>
                <Text style={styles.sealYear}>{String(year)}</Text>
              </View>
            </View>
          </View>

          <View style={styles.factsFrame}>
            <View style={styles.factsRow}>
              <View style={styles.colLeft}>
                <View style={styles.factBlock}>
                  <Text style={styles.factLabel}>BETREIBUNGSREGISTER</Text>
                  <Text
                    style={[
                      styles.factValueSm,
                      { color: brClear ? TEAL_ACCENT : RED },
                    ]}
                  >
                    {brClear ? 'Keine Einträge' : 'Einträge vorhanden'}
                  </Text>
                  <Text style={styles.factSub}>{brSub}</Text>
                </View>
                <View style={styles.factBlock}>
                  <Text style={styles.factLabel}>AUSSTELLUNGSDATUM</Text>
                  <Text style={styles.factValue}>{formatPdfDate(issuedAt)}</Text>
                </View>
                <View style={styles.factBlock}>
                  <Text style={styles.factLabel}>BESCHÄFTIGUNG</Text>
                  <Text style={styles.factValue}>{employmentLine}</Text>
                </View>
              </View>
              <View style={styles.colDivider} />
              <View style={styles.colRight}>
                <View style={styles.factBlock}>
                  <Text style={styles.factLabel}>HAUSHALTSEINKOMMEN</Text>
                  <Text style={styles.factValue}>{incomeLabel}</Text>
                  <Text style={styles.factSub}>
                    {`Qualifiziert für Mieten bis CHF ${formatNumber(incomeQualifiesUpTo)} / Monat`}
                  </Text>
                </View>
                <View style={styles.factBlock}>
                  <Text style={styles.factLabel}>GÜLTIG BIS</Text>
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
            </View>
          </View>

          <View style={styles.verifyPanel}>
            <View style={styles.qrFrame}>
              {qrDataUrl ? <Image src={qrDataUrl} style={styles.qrImg} /> : null}
            </View>
            <View style={styles.qrCopy}>
              <Text style={styles.qrHead}>ELEKTRONISCHE PRÜFUNG</Text>
              <Text style={styles.qrSub}>Echtheit und Gültigkeit online verifizieren</Text>
              <Text style={styles.qrUrl}>{verifyPath}</Text>
              <Text style={styles.qrFoot}>
                QR-Code scannen oder Adresse eingeben. Der Zertifikats-Code ist in der URL enthalten und entspricht der
                Registriernummer oben.
              </Text>
            </View>
          </View>

          <View style={styles.disclaimerSep} />
          <Text style={styles.disclaimer}>
            Helvenda Wohnungen bestätigt die Verifizierung der genannten Angaben zum Zeitpunkt der Ausstellung. Für
            nachträgliche Änderungen der persönlichen oder wirtschaftlichen Situation des Inhabers wird keine Haftung
            übernommen.
          </Text>

          <View style={styles.decSep} />

          <View style={styles.decRow}>
            <View style={styles.decColFirst}>
              <Text style={styles.decLab}>AUSGESTELLT DURCH</Text>
              <Text style={styles.decVal}>Helvenda Wohnungen</Text>
              <Text style={styles.decSub}>wohnen.helvenda.ch</Text>
            </View>
            <View style={styles.decColMid}>
              <Text style={styles.decLab}>GÜLTIGKEITSDAUER</Text>
              <Text style={styles.decVal}>90 Tage</Text>
              <Text style={styles.decSub}>Ab Ausstellungsdatum</Text>
            </View>
            <View style={styles.decColLast}>
              <Text style={styles.decLab}>VERIFIKATION</Text>
              <Text style={styles.decVal}>Online prüfbar</Text>
              <Text style={styles.decSub}>wohnen.helvenda.ch/verify</Text>
            </View>
          </View>

          <Text style={styles.decClose}>{`HELVENDA WOHNUNGEN  ·  QUALITÄTSNACHWEIS  ·  ${year}`}</Text>

          <View style={styles.bottomBand} fixed>
            <Text style={styles.bottomText}>
              {`${year} Helvenda Wohnungen · Score-Max GmbH · Zollikerberg · Schweiz`}
            </Text>
            <Text style={styles.bottomTextRight}>Rechtsgültig ohne Unterschrift</Text>
          </View>
        </View>
      </Page>
    </Document>
  )
}
