import { Document, Image, Page, StyleSheet, Text, View } from '@react-pdf/renderer'
import type { CreditCertificateDisplayStatus } from '@/lib/certificate/issueCertificate'
import { formatCHF } from '@/lib/utils/formatCurrency'
import { formatDate } from '@/lib/utils/formatDate'

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: 'Helvetica',
    color: '#0d2b1f',
    position: 'relative',
  },
  watermark: {
    position: 'absolute',
    left: 80,
    top: 280,
    fontSize: 60,
    color: '#18a87c',
    opacity: 0.04,
    transform: 'rotate(-35deg)',
    fontFamily: 'Helvetica',
    fontWeight: 'bold',
  },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  hSquare: {
    width: 32,
    height: 32,
    backgroundColor: '#18a87c',
    justifyContent: 'center',
    alignItems: 'center',
  },
  hLetter: { color: '#fff', fontSize: 16, fontFamily: 'Helvetica', fontWeight: 'bold' },
  brandText: { fontSize: 11, fontWeight: 'bold', color: '#0d2b1f' },
  qualLabel: { fontSize: 10, letterSpacing: 3, color: '#18a87c', textTransform: 'uppercase' },
  line: { height: 2, backgroundColor: '#18a87c', marginBottom: 12 },
  certNr: { fontSize: 10, color: '#8aa89e', fontFamily: 'Helvetica', textAlign: 'right', marginBottom: 16 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#0d2b1f', marginBottom: 10 },
  intro: { fontSize: 10, color: '#5a7a6e', marginBottom: 20, lineHeight: 1.5 },
  twoCol: { flexDirection: 'row', gap: 24 },
  col: { flex: 1 },
  label: { fontSize: 8, fontWeight: 'bold', color: '#8aa89e', textTransform: 'uppercase', marginBottom: 4, letterSpacing: 0.5 },
  value: { fontSize: 11, fontWeight: 'bold', color: '#0d2b1f', marginBottom: 14, lineHeight: 1.35 },
  qrBlock: { marginTop: 20, flexDirection: 'row', gap: 16, alignItems: 'flex-start' },
  qrUrl: { fontSize: 9, color: '#5a7a6e', marginTop: 4, maxWidth: 280 },
  footerLine: { height: 2, backgroundColor: '#18a87c', marginTop: 24, marginBottom: 8 },
  footer: { fontSize: 8, color: '#8aa89e', lineHeight: 1.4 },
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

  const creditLine =
    creditStatus === 'CLEAR' ? 'Keine Einträge' : 'Einträge gemäss Auszug (Betreibungsregister)'

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.watermark} fixed>
          HELVENDA VERIFIZIERT
        </Text>
        <View style={styles.headerRow}>
          <View style={styles.brand}>
            <View style={styles.hSquare}>
              <Text style={styles.hLetter}>H</Text>
            </View>
            <Text style={styles.brandText}>Helvenda Wohnungen</Text>
          </View>
          <Text style={styles.qualLabel}>QUALITÄTSNACHWEIS</Text>
        </View>
        <View style={styles.line} />
        <Text style={styles.certNr}>Zertifikats-Nr.: {certificateCode}</Text>
        <Text style={styles.title}>Helvenda Qualitätsnachweis</Text>
        <Text style={styles.intro}>
          Helvenda Wohnungen bestätigt, dass die nachstehende Person die aufgeführten Angaben eingereicht hat und diese
          durch Helvenda verifiziert wurden.
        </Text>
        <View style={styles.twoCol}>
          <View style={styles.col}>
            <Text style={styles.label}>Inhaberin / Inhaber</Text>
            <Text style={styles.value}>
              {firstName} {lastName}
            </Text>
            <Text style={styles.label}>Aktuelle Adresse</Text>
            <Text style={styles.value}>
              {address}
              {'\n'}
              {zip} {city}
            </Text>
            <Text style={styles.label}>Beschäftigung</Text>
            <Text style={styles.value}>{employmentLine}</Text>
            <Text style={styles.label}>Haushaltseinkommen (Kategorie)</Text>
            <Text style={styles.value}>
              {incomeLabel}
              {'\n'}
              Qualifiziert nach 3x-Regel für Mieten bis {formatCHF(incomeQualifiesUpTo)}/Mo.
            </Text>
          </View>
          <View style={styles.col}>
            <Text style={styles.label}>Betreibungsregister</Text>
            <Text style={styles.value}>
              Status: {creditLine}
              {'\n'}
              Ausstellungsdatum: {formatDate(creditCheckDate)}
              {'\n'}
              Kanton: {creditCanton}
            </Text>
            <Text style={styles.label}>Zertifikat ausgestellt</Text>
            <Text style={styles.value}>{formatDate(issuedAt)}</Text>
            <Text style={styles.label}>Zertifikat gültig bis</Text>
            <Text style={styles.value}>{formatDate(expiresAt)}</Text>
            <Text style={styles.label}>Verifiziert durch</Text>
            <Text style={styles.value}>
              Helvenda Wohnungen{'\n'}wohnen.helvenda.ch
            </Text>
          </View>
        </View>
        <View style={styles.qrBlock}>
          {qrDataUrl ? <Image src={qrDataUrl} style={{ width: 80, height: 80 }} /> : null}
          <View>
            <Text style={styles.label}>Echtheit prüfen</Text>
            <Text style={styles.qrUrl}>{verifyUrl}</Text>
          </View>
        </View>
        <View style={styles.footerLine} />
        <Text style={styles.footer}>
          © {year} Helvenda Wohnungen · Score-Max GmbH · Zollikerberg{'\n'}
          Dieses Dokument wurde automatisch erstellt und ist ohne Unterschrift gültig.{'\n'}
          Helvenda übernimmt keine Haftung für die Richtigkeit der selbstdeklarierten Angaben.
        </Text>
      </Page>
    </Document>
  )
}
