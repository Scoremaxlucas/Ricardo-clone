import { CERTIFICATE_FOOTNOTE_PDF_DE } from '@/lib/certificate/certificate-display'
import type { CreditCertificateDisplayStatus } from '@/lib/certificate/issueCertificate'
import { Document, Image, Page, StyleSheet, Text, View } from '@react-pdf/renderer'
import * as React from 'react'

/**
 * Helvenda Wohnungen — Qualitätsnachweis (PDF).
 *
 * Designhaltung:
 *  - Eine Schriftfamilie (Helvetica), Courier nur für Code/URL.
 *  - Hairlines und Whitespace tragen die Hierarchie, keine Boxen.
 *  - Akzentfarbe sparsam (Top-Hairline, Logomark, ein Status-Wert).
 *  - Keine Siegel-Ornamente, keine Vermieter-Kommunikationsbanner.
 *  - A4 wird gefüllt; Footer am unteren Rand der Seite.
 */
const TEAL = '#0d6b52'
const TEAL_ACCENT = '#18a87c'
const INK = '#0d1411'
const INK_SOFT = '#2a322e'
const MUTED = '#5b655f'
const LABEL = '#7a847e'
const HAIRLINE = '#d8ddd9'
const HAIRLINE_SOFT = '#e6eae6'
const ORANGE = '#b14a0e'
const RED = '#9c2424'

const HF = 'Helvetica'
const HFB = 'Helvetica-Bold'
const CF = 'Courier'

const PAGE_PAD_X = 56
const PAGE_PAD_TOP = 38
const PAGE_PAD_BOTTOM = 44

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
    backgroundColor: '#ffffff',
    fontFamily: HF,
    color: INK,
    paddingHorizontal: PAGE_PAD_X,
    paddingTop: PAGE_PAD_TOP,
    paddingBottom: PAGE_PAD_BOTTOM,
    flexDirection: 'column',
  },

  topStripe: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 5,
    backgroundColor: TEAL_ACCENT,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoBox: {
    width: 26,
    height: 26,
    backgroundColor: TEAL_ACCENT,
    borderRadius: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoLetter: {
    color: '#ffffff',
    fontSize: 14,
    fontFamily: HFB,
  },
  brandText: {
    marginLeft: 11,
  },
  brandName: {
    fontSize: 11,
    fontFamily: HFB,
    color: INK,
    letterSpacing: 0.2,
  },
  brandTagline: {
    fontSize: 7.5,
    fontFamily: HF,
    color: LABEL,
    letterSpacing: 1.4,
    marginTop: 3,
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  docTitle: {
    fontSize: 11,
    fontFamily: HFB,
    color: INK,
    letterSpacing: 0.2,
  },
  docCode: {
    fontSize: 8.5,
    fontFamily: CF,
    color: INK_SOFT,
    letterSpacing: 0.4,
    marginTop: 4,
  },
  headerRule: {
    height: 0.6,
    backgroundColor: HAIRLINE,
    marginTop: 14,
  },

  // Holder
  holder: {
    marginTop: 32,
    marginBottom: 32,
  },
  eyebrow: {
    fontSize: 7.5,
    fontFamily: HFB,
    color: LABEL,
    letterSpacing: 1.6,
  },
  holderName: {
    fontSize: 26,
    fontFamily: HFB,
    color: INK,
    letterSpacing: -0.3,
    marginTop: 10,
    lineHeight: 1.1,
  },
  holderAddress: {
    fontSize: 10.5,
    fontFamily: HF,
    color: MUTED,
    marginTop: 8,
    lineHeight: 1.4,
  },

  sectionRule: {
    height: 0.6,
    backgroundColor: HAIRLINE,
  },

  // Section
  section: {
    paddingTop: 22,
    paddingBottom: 22,
  },
  sectionTitle: {
    fontSize: 8,
    fontFamily: HFB,
    color: TEAL,
    letterSpacing: 1.6,
    marginBottom: 18,
  },

  // Verified single fact (Betreibungsregister)
  factLabel: {
    fontSize: 7.5,
    fontFamily: HFB,
    color: LABEL,
    letterSpacing: 1.4,
    marginBottom: 6,
  },
  factValue: {
    fontSize: 11,
    fontFamily: HFB,
    color: INK,
    lineHeight: 1.25,
  },
  factValueLg: {
    fontSize: 15,
    fontFamily: HFB,
    color: INK,
    lineHeight: 1.2,
  },
  factCaption: {
    fontSize: 9,
    fontFamily: HF,
    color: MUTED,
    marginTop: 5,
    lineHeight: 1.4,
  },

  // 2-col grid
  grid: {
    flexDirection: 'row',
  },
  gridCell: {
    flex: 1,
    paddingRight: 18,
  },
  gridCellLast: {
    flex: 1,
    paddingLeft: 18,
  },
  gridSpacer: {
    height: 22,
  },

  // Validity row
  validity: {
    flexDirection: 'row',
    paddingTop: 22,
    paddingBottom: 22,
  },
  validityCol: {
    flex: 1,
    paddingRight: 18,
  },
  validityColLast: {
    flex: 1,
  },

  // Verify panel
  verify: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingTop: 22,
    paddingBottom: 22,
  },
  qrFrame: {
    width: 70,
    height: 70,
    borderWidth: 0.6,
    borderColor: HAIRLINE,
    padding: 5,
    flexShrink: 0,
  },
  qrImg: {
    width: 60,
    height: 60,
  },
  verifyCopy: {
    flex: 1,
    minWidth: 0,
    marginLeft: 18,
    paddingTop: 2,
  },
  verifyTitle: {
    fontSize: 9,
    fontFamily: HFB,
    color: INK,
    letterSpacing: 1.4,
  },
  verifyUrl: {
    fontSize: 9.5,
    fontFamily: CF,
    color: INK_SOFT,
    marginTop: 7,
    letterSpacing: 0.2,
  },
  verifyText: {
    fontSize: 9,
    fontFamily: HF,
    color: MUTED,
    marginTop: 9,
    lineHeight: 1.45,
    width: '100%',
  },

  // Footer
  spacer: {
    flexGrow: 1,
  },
  footer: {
    paddingTop: 16,
  },
  footerRule: {
    height: 0.6,
    backgroundColor: HAIRLINE_SOFT,
    marginBottom: 14,
  },
  footnote: {
    fontSize: 7.5,
    fontFamily: HF,
    color: MUTED,
    lineHeight: 1.5,
    marginBottom: 12,
    width: '100%',
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  metaLeft: {
    fontSize: 7.5,
    fontFamily: HF,
    color: LABEL,
    lineHeight: 1.45,
  },
  metaRight: {
    fontSize: 7.5,
    fontFamily: HF,
    color: LABEL,
    letterSpacing: 0.2,
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
  housingSituationLabel: string | null
  housingSinceLabel: string | null
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
    housingSituationLabel,
    housingSinceLabel,
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
  const brCaption = `Auszug geprüft am ${formatPdfDate(creditCheckDate)}${kantonSuffix}`

  const daysRem = daysRemainingFor(expiresAt)
  const expiryColor = daysRem > 30 ? INK : daysRem > 14 ? ORANGE : RED
  const verifyPath = verifyDisplayPath(verifyUrl)

  const incomeCaption = `Zulässige Bruttomiete nach 3×-Regel: CHF ${formatNumber(incomeQualifiesUpTo)}`
  const addressLine = `${address} · ${zip} ${city}`.trim()

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.topStripe} fixed />

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.brandRow}>
            <View style={styles.logoBox}>
              <Text style={styles.logoLetter}>H</Text>
            </View>
            <View style={styles.brandText}>
              <Text style={styles.brandName}>Helvenda Wohnungen</Text>
              <Text style={styles.brandTagline}>Schweizer Mietmarktplatz</Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.docTitle}>Qualitätsnachweis</Text>
            <Text style={styles.docCode}>{certificateCode}</Text>
          </View>
        </View>
        <View style={styles.headerRule} />

        {/* Holder */}
        <View style={styles.holder}>
          <Text style={styles.eyebrow}>AUSGESTELLT FÜR</Text>
          <Text style={styles.holderName}>{holder}</Text>
          <Text style={styles.holderAddress}>{addressLine}</Text>
        </View>

        <View style={styles.sectionRule} />

        {/* Verifizierte Angaben */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>VERIFIZIERTE ANGABEN</Text>
          <Text style={styles.factLabel}>Betreibungsregister</Text>
          <Text style={[styles.factValueLg, { color: brClear ? TEAL : RED }]}>
            {brClear ? 'Keine Einträge' : 'Einträge vorhanden'}
          </Text>
          <Text style={styles.factCaption}>{brCaption}</Text>
        </View>

        <View style={styles.sectionRule} />

        {/* Angaben aus Mieterprofil */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ANGABEN AUS MIETERPROFIL</Text>
          <View style={styles.grid}>
            <View style={styles.gridCell}>
              <Text style={styles.factLabel}>Haushaltsnetto</Text>
              <Text style={styles.factValue}>{incomeLabel}</Text>
              <Text style={styles.factCaption}>{incomeCaption}</Text>
            </View>
            <View style={styles.gridCellLast}>
              <Text style={styles.factLabel}>Beschäftigung</Text>
              <Text style={styles.factValue}>{employmentLine}</Text>
            </View>
          </View>
          {housingSituationLabel ?
            <>
              <View style={styles.gridSpacer} />
              <View style={styles.grid}>
                <View style={styles.gridCell}>
                  <Text style={styles.factLabel}>Wohnverhältnis</Text>
                  <Text style={styles.factValue}>{housingSituationLabel}</Text>
                  {housingSinceLabel ?
                    <Text style={styles.factCaption}>{housingSinceLabel}</Text>
                  : null}
                </View>
                <View style={styles.gridCellLast}>
                  <Text style={styles.factLabel}>Wohnadresse</Text>
                  <Text style={styles.factValue}>{address}</Text>
                  <Text style={styles.factCaption}>{`${zip} ${city}`.trim()}</Text>
                </View>
              </View>
            </>
          : null}
        </View>

        <View style={styles.sectionRule} />

        {/* Validity */}
        <View style={styles.validity}>
          <View style={styles.validityCol}>
            <Text style={styles.factLabel}>Ausgestellt</Text>
            <Text style={styles.factValue}>{formatPdfDate(issuedAt)}</Text>
          </View>
          <View style={styles.validityCol}>
            <Text style={styles.factLabel}>Gültig bis</Text>
            <Text style={[styles.factValue, { color: expiryColor }]}>{formatPdfDate(expiresAt)}</Text>
            {daysRem <= 30 ?
              <Text style={[styles.factCaption, { color: ORANGE }]}>{`${daysRem} Tage verbleibend`}</Text>
            : null}
          </View>
          <View style={styles.validityColLast}>
            <Text style={styles.factLabel}>Gültigkeitsdauer</Text>
            <Text style={styles.factValue}>90 Tage</Text>
          </View>
        </View>

        <View style={styles.sectionRule} />

        {/* Verify */}
        <View style={styles.verify}>
          <View style={styles.qrFrame}>
            {qrDataUrl ? <Image src={qrDataUrl} style={styles.qrImg} /> : null}
          </View>
          <View style={styles.verifyCopy}>
            <Text style={styles.verifyTitle}>ONLINE PRÜFEN</Text>
            <Text style={styles.verifyUrl}>{verifyPath}</Text>
            <Text style={styles.verifyText}>
              Echtheit, Gültigkeit und Stand des Registerauszugs lassen sich online verifizieren —
              über den QR-Code oder die Adresse oben.
            </Text>
          </View>
        </View>

        {/* Spacer pushes footer to bottom */}
        <View style={styles.spacer} />

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.footerRule} />
          <Text style={styles.footnote}>{CERTIFICATE_FOOTNOTE_PDF_DE}</Text>
          <View style={styles.metaRow}>
            <Text style={styles.metaLeft}>
              {`Helvenda Wohnungen · Score-Max GmbH, Zollikerberg, Schweiz · ${year}`}
            </Text>
            <Text style={styles.metaRight}>Elektronisch erstellt</Text>
          </View>
        </View>
      </Page>
    </Document>
  )
}
