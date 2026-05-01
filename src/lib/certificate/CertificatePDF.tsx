import { Document, Image, Page, StyleSheet, Text, View } from '@react-pdf/renderer'
import type { CreditCertificateDisplayStatus } from '@/lib/certificate/issueCertificate'
import { isCreditCheckResult } from '@/lib/rental/types'
import { formatDate } from '@/lib/utils/formatDate'

/** Standard PDF sans-serif (Helvetica family). */
const HF = 'Helvetica'
const HFB = 'Helvetica-Bold'

const teal = '#18a87c'
const tealDark = '#107a5a'
const ink = '#0d2b1f'
const muted = '#5a7a6e'
const mutedLabel = '#8aa89e'
const mintLine = '#e8f7f2'
const mintBorder = '#b2e8d8'
const orangeWarn = '#f59e0b'
const footerBand = '#0d2b1f'
const explainBg = '#f5fdfb'

/** Siegel: nur deckende Hex-Farben (keine Opacity an Stroke). */
const SEAL_OUTER = 110
const SEAL_INNER = 94
const sealRingOuterColor = '#a8dece'
const sealRingInnerColor = '#c8eee4'
const sealTextColor = '#6ec4ab'

function formatMaxRentPdfLine(maxRent: number): string {
  const part =
    maxRent >= 10000
      ? `CHF ${(maxRent / 1000).toFixed(1)}k`
      : `CHF ${maxRent.toLocaleString('de-CH')}`
  return `bis ${part} / Mo.`
}

function cantonFromCreditJson(json: unknown): string | null {
  if (json == null || typeof json !== 'object') return null
  if (isCreditCheckResult(json)) {
    const c = json.canton.trim().toUpperCase()
    return c && c !== 'CH' && c.length === 2 ? json.canton.trim() : null
  }
  const raw = (json as { canton?: unknown }).canton
  const c = typeof raw === 'string' ? raw.trim().toUpperCase() : ''
  return c && c !== 'CH' && c.length === 2 ? (raw as string).trim() : null
}

function resolvePdfCanton(verifiedCreditCheckCanton: string, creditCheckResultJson: unknown | null): string | null {
  const v = (verifiedCreditCheckCanton || '').trim().toUpperCase()
  if (v && v !== 'CH' && v.length === 2) {
    return verifiedCreditCheckCanton.trim()
  }
  return cantonFromCreditJson(creditCheckResultJson)
}

const styles = StyleSheet.create({
  page: {
    width: '100%',
    height: '100%',
    padding: 0,
    margin: 0,
    backgroundColor: '#ffffff',
    fontFamily: HF,
    color: ink,
    position: 'relative',
  },
  topBand: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 8,
    backgroundColor: teal,
  },
  body: {
    paddingTop: 8,
    paddingBottom: 52,
  },
  headerBar: {
    paddingTop: 24,
    paddingHorizontal: 40,
    paddingBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  hSquare: {
    width: 28,
    height: 28,
    borderRadius: 4,
    backgroundColor: teal,
    justifyContent: 'center',
    alignItems: 'center',
  },
  hLetter: {
    fontFamily: HFB,
    fontSize: 16,
    color: '#ffffff',
  },
  brandName: {
    marginLeft: 10,
    fontSize: 13,
    fontFamily: HF,
    color: ink,
  },
  qualType: {
    fontSize: 8,
    fontFamily: HFB,
    color: teal,
    letterSpacing: 3,
    textTransform: 'uppercase',
  },
  headerLine: {
    height: 1,
    backgroundColor: teal,
    marginHorizontal: 40,
  },
  certNr: {
    marginTop: 12,
    marginHorizontal: 40,
    fontSize: 8,
    color: mutedLabel,
    letterSpacing: 1,
    textAlign: 'right',
    fontFamily: HF,
  },
  heroBlock: {
    marginTop: 32,
    marginHorizontal: 40,
  },
  heroKicker: {
    fontSize: 8,
    fontFamily: HFB,
    color: teal,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  heroName: {
    marginTop: 6,
    fontSize: 32,
    fontFamily: HFB,
    color: ink,
    lineHeight: 1.1,
  },
  heroSub: {
    marginTop: 4,
    fontSize: 11,
    fontFamily: HF,
    color: muted,
  },
  heroSep: {
    marginTop: 20,
    marginHorizontal: 40,
    height: 0.5,
    backgroundColor: mintLine,
  },
  intro: {
    marginTop: 16,
    marginHorizontal: 40,
    maxWidth: 400,
    fontSize: 9.5,
    fontFamily: HF,
    color: muted,
    lineHeight: 1.6,
  },
  gridOuterRow: {
    marginTop: 16,
    marginHorizontal: 40,
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  gridRelative: {
    position: 'relative',
    flex: 1,
    minWidth: 0,
  },
  gridTealBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    backgroundColor: teal,
  },
  gridPadded: {
    paddingLeft: 16,
  },
  gridCols: {
    flexDirection: 'row',
  },
  col: {
    flex: 1,
    paddingRight: 8,
  },
  cellLabel: {
    fontSize: 7,
    fontFamily: HFB,
    color: teal,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  cellValue: {
    marginTop: 3,
    fontSize: 10.5,
    fontFamily: HFB,
    color: ink,
    lineHeight: 1.35,
  },
  cellSub: {
    marginTop: 2,
    fontSize: 8.5,
    fontFamily: HF,
    color: muted,
    lineHeight: 1.35,
  },
  cellBlock: {
    paddingBottom: 20,
  },
  sealCol: {
    width: 124,
    justifyContent: 'center',
    alignItems: 'center',
    paddingLeft: 6,
  },
  sealOuter: {
    width: SEAL_OUTER,
    height: SEAL_OUTER,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  sealRingOuter: {
    position: 'absolute',
    width: SEAL_OUTER,
    height: SEAL_OUTER,
    borderRadius: 9999,
    borderWidth: 1.5,
    borderColor: sealRingOuterColor,
  },
  sealRingInner: {
    position: 'absolute',
    width: SEAL_INNER,
    height: SEAL_INNER,
    borderRadius: 9999,
    borderWidth: 0.8,
    borderColor: sealRingInnerColor,
  },
  sealText: {
    fontSize: 7,
    fontFamily: HFB,
    color: sealTextColor,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  qrSection: {
    marginTop: 20,
    marginHorizontal: 40,
  },
  qrSep: {
    height: 0.5,
    backgroundColor: mintLine,
    marginBottom: 20,
  },
  qrRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  qrFrame: {
    width: 68,
    height: 68,
    borderWidth: 1,
    borderColor: mintBorder,
    borderRadius: 4,
    padding: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qrImg: {
    width: 60,
    height: 60,
  },
  qrCopy: {
    marginLeft: 16,
    flex: 1,
    minWidth: 0,
  },
  qrHead: {
    fontSize: 7,
    fontFamily: HFB,
    color: teal,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  qrHint: {
    marginTop: 6,
    fontSize: 8.5,
    fontFamily: HF,
    color: muted,
  },
  qrUrl: {
    marginTop: 4,
    fontSize: 8.5,
    fontFamily: HFB,
    color: ink,
  },
  qrFoot: {
    marginTop: 4,
    fontSize: 7.5,
    fontFamily: HF,
    color: mutedLabel,
  },
  postQrSep: {
    height: 0.5,
    backgroundColor: mintLine,
    marginTop: 16,
    marginHorizontal: 40,
  },
  explainTitle: {
    marginHorizontal: 40,
    marginTop: 0,
    fontSize: 7,
    fontFamily: HFB,
    color: teal,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  explainRow: {
    marginTop: 12,
    marginHorizontal: 40,
    flexDirection: 'row',
  },
  explainCol: {
    width: 160,
    paddingRight: 12,
  },
  explainColTitle: {
    fontSize: 8.5,
    fontFamily: HFB,
    color: ink,
    lineHeight: 1.25,
  },
  explainColBody: {
    marginTop: 4,
    fontSize: 7.5,
    fontFamily: HF,
    color: muted,
    lineHeight: 1.25,
    maxHeight: 19,
  },
  postExplainSep: {
    height: 0.5,
    backgroundColor: mintLine,
    marginTop: 20,
    marginHorizontal: 40,
  },
  landlordBox: {
    marginTop: 16,
    marginHorizontal: 40,
    backgroundColor: explainBg,
    borderWidth: 0.5,
    borderColor: mintBorder,
    borderRadius: 4,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  landlordTitle: {
    fontSize: 7,
    fontFamily: HFB,
    color: teal,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  landlordBody: {
    marginTop: 8,
    fontSize: 8,
    fontFamily: HF,
    color: muted,
    lineHeight: 1.5,
  },
  bottomBand: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 28,
    backgroundColor: footerBand,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  bottomBandText: {
    fontSize: 7,
    fontFamily: HF,
    color: 'rgba(255,255,255,0.5)',
    maxWidth: 260,
  },
  bottomBandTextRight: {
    fontSize: 7,
    fontFamily: HF,
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'right',
    maxWidth: 220,
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
  /** DB-Feld; Fallback über creditCheckResultJson im PDF. */
  verifiedCreditCheckCanton: string
  creditCheckResultJson: unknown | null
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
    verifiedCreditCheckCanton,
    creditCheckResultJson,
    verifyUrl,
    qrDataUrl,
    year,
  } = props

  const cantonDisplay = resolvePdfCanton(verifiedCreditCheckCanton, creditCheckResultJson)
  const holderLine = `${firstName} ${lastName}`.trim()
  const addressBlock = `${address}\n${zip} ${city}`.trim()
  const qualifyLine = formatMaxRentPdfLine(incomeQualifiesUpTo)
  const statusPositive = creditStatus === 'CLEAR'
  const statusPhrase = statusPositive ? 'Keine Einträge' : 'Einträge vorhanden'
  const statusColor = statusPositive ? tealDark : orangeWarn

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.topBand} fixed />

        <View style={styles.body}>
          <View style={styles.headerBar}>
            <View style={styles.brandRow}>
              <View style={styles.hSquare}>
                <Text style={styles.hLetter}>H</Text>
              </View>
              <Text style={styles.brandName}>Helvenda Wohnungen</Text>
            </View>
            <Text style={styles.qualType}>QUALITÄTSNACHWEIS</Text>
          </View>

          <View style={styles.headerLine} />

          <Text style={styles.certNr}>
            Zertifikats-Nr.: {`  `}
            {certificateCode}
          </Text>

          <View style={styles.heroBlock}>
            <Text style={styles.heroKicker}>AUSGESTELLT FÜR</Text>
            <Text style={styles.heroName}>{holderLine}</Text>
            <Text style={styles.heroSub}>{employmentLine}</Text>
          </View>

          <View style={styles.heroSep} />

          <Text style={styles.intro}>
            Helvenda Wohnungen bestätigt, dass die nachstehende Person die aufgeführten Angaben eingereicht hat und
            diese durch Helvenda verifiziert wurden.
          </Text>

          <View style={styles.gridOuterRow}>
            <View style={styles.gridRelative}>
              <View style={styles.gridTealBar} />
              <View style={styles.gridPadded}>
                <View style={styles.gridCols}>
                  <View style={styles.col}>
                    <View style={styles.cellBlock}>
                      <Text style={styles.cellLabel}>Adresse</Text>
                      <Text style={styles.cellValue}>{addressBlock}</Text>
                    </View>
                    <View style={styles.cellBlock}>
                      <Text style={styles.cellLabel}>Einkommen</Text>
                      <Text style={styles.cellValue}>{incomeLabel}</Text>
                      <Text style={styles.cellSub}>{qualifyLine}</Text>
                    </View>
                  </View>

                  <View style={styles.col}>
                    <View style={styles.cellBlock}>
                      <Text style={styles.cellLabel}>Betreibungsregister</Text>
                      <Text style={[styles.cellValue, { color: statusColor }]}>{statusPhrase}</Text>
                      <Text style={styles.cellSub}>Ausstellungsdatum: {formatDate(creditCheckDate)}</Text>
                      {cantonDisplay ?
                        <Text style={styles.cellSub}>Kanton: {cantonDisplay}</Text>
                      : null}
                    </View>
                    <View style={styles.cellBlock}>
                      <Text style={styles.cellLabel}>Ausgestellt am</Text>
                      <Text style={styles.cellValue}>{formatDate(issuedAt)}</Text>
                    </View>
                  </View>

                  <View style={styles.col}>
                    <View style={styles.cellBlock}>
                      <Text style={styles.cellLabel}>Ausgestellt von</Text>
                      <Text style={styles.cellValue}>Helvenda Wohnungen</Text>
                      <Text style={styles.cellSub}>wohnen.helvenda.ch</Text>
                    </View>
                    <View style={styles.cellBlock}>
                      <Text style={styles.cellLabel}>Gültig bis</Text>
                      <Text style={styles.cellValue}>{formatDate(expiresAt)}</Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>

            <View style={styles.sealCol}>
              <View style={styles.sealOuter}>
                <View style={styles.sealRingOuter} />
                <View style={styles.sealRingInner} />
                <Text style={styles.sealText}>VERIFIZIERT</Text>
              </View>
            </View>
          </View>

          <View style={styles.qrSection}>
            <View style={styles.qrSep} />
            <View style={styles.qrRow}>
              <View style={styles.qrFrame}>{qrDataUrl ? <Image src={qrDataUrl} style={styles.qrImg} /> : null}</View>
              <View style={styles.qrCopy}>
                <Text style={styles.qrHead}>ECHTHEIT PRÜFEN</Text>
                <Text style={styles.qrHint}>Scanne den QR-Code oder besuche:</Text>
                <Text style={styles.qrUrl}>{verifyUrl}</Text>
                <Text style={styles.qrFoot}>Dieser Code ist einmalig und fälschungssicher.</Text>
              </View>
            </View>
          </View>

          <View style={styles.postQrSep} />

          <Text style={styles.explainTitle}>WAS BEDEUTET DIESES ZERTIFIKAT?</Text>

          <View style={styles.explainRow}>
            <View style={styles.explainCol}>
              <Text style={styles.explainColTitle}>Betreibungsregister geprüft</Text>
              <Text style={styles.explainColBody}>Offizieller CH-Auszug verifiziert und archiviert.</Text>
            </View>
            <View style={styles.explainCol}>
              <Text style={styles.explainColTitle}>Einkommen kategorisiert</Text>
              <Text style={styles.explainColBody}>Kategorie bestätigt — genaue Zahl bleibt privat.</Text>
            </View>
            <View style={styles.explainCol}>
              <Text style={styles.explainColTitle}>Einzigartiger Code</Text>
              <Text style={styles.explainColBody}>Echtheit jederzeit unter wohnen.helvenda.ch/verify prüfbar.</Text>
            </View>
          </View>

          <View style={styles.postExplainSep} />

          <View style={styles.landlordBox}>
            <Text style={styles.landlordTitle}>HINWEIS FÜR VERMIETER</Text>
            <Text style={styles.landlordBody}>
              Dieses Zertifikat wurde durch Helvenda Wohnungen ausgestellt und bestätigt, dass die genannten Angaben
              zum Zeitpunkt der Ausstellung verifiziert wurden. Der Verifikations-Code kann jederzeit unter
              wohnen.helvenda.ch/verify geprüft werden. Helvenda haftet nicht für nachträgliche Änderungen der persönlichen
              Situation des Zertifikatsinhabers.
            </Text>
          </View>
        </View>

        <View style={styles.bottomBand} fixed>
          <Text style={styles.bottomBandText}>
            © {year} Helvenda Wohnungen · Score-Max GmbH · Zollikerberg
          </Text>
          <Text style={styles.bottomBandTextRight}>
            Ohne Unterschrift gültig · Keine Haftung für selbstdeklarierte Angaben
          </Text>
        </View>
      </Page>
    </Document>
  )
}
