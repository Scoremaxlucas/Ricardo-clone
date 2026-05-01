import { Document, Image, Page, StyleSheet, Text, View } from '@react-pdf/renderer'
import type { CreditCertificateDisplayStatus } from '@/lib/certificate/issueCertificate'
import { formatCHF } from '@/lib/utils/formatCurrency'
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
    paddingBottom: 44,
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
  gridSection: {
    marginTop: 28,
    marginHorizontal: 40,
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  gridLeftCluster: {
    flexDirection: 'row',
    flex: 1,
    minWidth: 0,
  },
  gridAccent: {
    width: 3,
    backgroundColor: teal,
    alignSelf: 'stretch',
  },
  gridInner: {
    flex: 1,
    paddingLeft: 16,
    paddingBottom: 4,
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
    width: 88,
    justifyContent: 'center',
    alignItems: 'center',
    paddingLeft: 4,
  },
  sealOuter: {
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  sealRingOuter: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 1.5,
    borderColor: 'rgba(24, 168, 124, 0.12)',
  },
  sealRingInner: {
    position: 'absolute',
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 0.5,
    borderColor: 'rgba(24, 168, 124, 0.12)',
  },
  sealText: {
    fontSize: 7,
    fontFamily: HFB,
    color: 'rgba(24, 168, 124, 0.2)',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  qrSection: {
    marginTop: 32,
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
  creditCanton: string
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
    creditCanton,
    verifyUrl,
    qrDataUrl,
    year,
  } = props

  const holderLine = `${firstName} ${lastName}`.trim()
  const addressBlock = `${address}\n${zip} ${city}`.trim()
  const qualifyLine = `Qualifiziert bis ${formatCHF(incomeQualifiesUpTo)} / Monat`
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

          <View style={styles.gridSection}>
            <View style={styles.gridLeftCluster}>
              <View style={styles.gridAccent} />
              <View style={styles.gridInner}>
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
                      <Text style={styles.cellSub}>Kanton: {creditCanton}</Text>
                    </View>
                    <View style={styles.cellBlock}>
                      <Text style={styles.cellLabel}>Ausgestellt am</Text>
                      <Text style={styles.cellValue}>{formatDate(issuedAt)}</Text>
                    </View>
                  </View>

                  <View style={styles.col}>
                    <View style={styles.cellBlock}>
                      <Text style={styles.cellLabel}>Zertifikat</Text>
                      <Text style={styles.cellValue}>Helvenda Qualitätsnachweis</Text>
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
