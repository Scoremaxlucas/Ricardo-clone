import { Document, Image, Page, StyleSheet, Text, View } from '@react-pdf/renderer'

const TEAL = '#0f766e'
const INK = '#0f172a'
const MUTED = '#64748b'
const LINE = '#e2e8f0'

const s = StyleSheet.create({
  page: { paddingTop: 48, paddingHorizontal: 54, paddingBottom: 40, fontFamily: 'Helvetica', color: INK, fontSize: 10 },
  brandRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  brand: { fontSize: 11, letterSpacing: 2, color: TEAL, fontFamily: 'Helvetica-Bold' },
  code: { fontSize: 10, color: MUTED, fontFamily: 'Helvetica-Bold' },
  title: { marginTop: 26, fontSize: 24, fontFamily: 'Helvetica-Bold', color: INK },
  subtitle: { marginTop: 4, fontSize: 11, color: MUTED },
  holder: { marginTop: 22, fontSize: 16, fontFamily: 'Helvetica-Bold' },
  holderMeta: { marginTop: 2, fontSize: 10, color: MUTED },
  sectionTitle: { marginTop: 26, marginBottom: 8, fontSize: 11, fontFamily: 'Helvetica-Bold', color: INK, textTransform: 'uppercase', letterSpacing: 1 },
  moduleBlock: { marginBottom: 12, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: LINE },
  moduleHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  moduleTitle: { fontSize: 12, fontFamily: 'Helvetica-Bold' },
  badge: { fontSize: 8, color: TEAL, fontFamily: 'Helvetica-Bold', letterSpacing: 1 },
  lineRow: { flexDirection: 'row', alignItems: 'center', marginTop: 5 },
  check: { width: 11, height: 11, borderRadius: 6, backgroundColor: TEAL, color: '#fff', fontSize: 7, textAlign: 'center', paddingTop: 2, marginRight: 7, fontFamily: 'Helvetica-Bold' },
  lineText: { fontSize: 10, color: '#334155' },
  emptyNote: { fontSize: 10, color: MUTED, marginTop: 4 },
  footerWrap: { position: 'absolute', bottom: 32, left: 54, right: 54 },
  validityRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 22, paddingTop: 12, borderTopWidth: 1, borderTopColor: LINE },
  validLabel: { fontSize: 8, color: MUTED, textTransform: 'uppercase', letterSpacing: 1 },
  validValue: { fontSize: 11, fontFamily: 'Helvetica-Bold', marginTop: 2 },
  verifyRow: { flexDirection: 'row', alignItems: 'center', marginTop: 20 },
  qr: { width: 78, height: 78, marginRight: 14 },
  verifyText: { fontSize: 9, color: MUTED, maxWidth: 340 },
  verifyUrl: { fontSize: 9, color: TEAL, fontFamily: 'Helvetica-Bold', marginTop: 3 },
  legal: { fontSize: 7.5, color: '#94a3b8', lineHeight: 1.4 },
})

function fmt(d: Date): string {
  return d.toLocaleDateString('de-CH', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export type SicPdfModule = { title: string; lines: string[] }

export function SicCertificatePdfDocument(props: {
  certificateCode: string
  holderName: string | null
  email: string
  issuedAt: Date
  expiresAt: Date
  verifiedModules: SicPdfModule[]
  verifyUrl: string
  qrDataUrl: string
}) {
  const { certificateCode, holderName, email, issuedAt, expiresAt, verifiedModules, verifyUrl, qrDataUrl } = props

  return (
    <Document title={`Swiss Immo Cert ${certificateCode}`}>
      <Page size="A4" style={s.page}>
        <View style={s.brandRow}>
          <Text style={s.brand}>SWISS IMMO CERT</Text>
          <Text style={s.code}>{certificateCode}</Text>
        </View>

        <Text style={s.title}>Mieterzertifikat</Text>
        <Text style={s.subtitle}>Unabhängig geprüftes Dossier für Ihre Wohnungsbewerbung</Text>

        <Text style={s.holder}>{holderName || 'Inhaber gemäss Nachweisen'}</Text>
        <Text style={s.holderMeta}>{email}</Text>

        <Text style={s.sectionTitle}>Verifizierte Angaben</Text>

        {verifiedModules.length === 0 ?
          <Text style={s.emptyNote}>
            Basiszertifikat — es wurden noch keine Module verifiziert. Fügen Sie Module hinzu, um geprüfte Angaben
            anzuzeigen.
          </Text>
        : verifiedModules.map((m, i) => (
            <View key={i} style={s.moduleBlock}>
              <View style={s.moduleHead}>
                <Text style={s.moduleTitle}>{m.title}</Text>
                <Text style={s.badge}>VERIFIZIERT</Text>
              </View>
              {m.lines.map((line, j) => (
                <View key={j} style={s.lineRow}>
                  <Text style={s.check}>✓</Text>
                  <Text style={s.lineText}>{line}</Text>
                </View>
              ))}
            </View>
          ))
        }

        <View style={s.footerWrap}>
          <View style={s.validityRow}>
            <View>
              <Text style={s.validLabel}>Ausgestellt</Text>
              <Text style={s.validValue}>{fmt(issuedAt)}</Text>
            </View>
            <View>
              <Text style={s.validLabel}>Gültig bis</Text>
              <Text style={s.validValue}>{fmt(expiresAt)}</Text>
            </View>
          </View>

          <View style={s.verifyRow}>
            {qrDataUrl ? <Image src={qrDataUrl} style={s.qr} /> : null}
            <View>
              <Text style={s.verifyText}>
                Echtheit online prüfen — Code oder QR scannen. Die Verifikation zeigt den aktuellen Status dieses
                Zertifikats.
              </Text>
              <Text style={s.verifyUrl}>{verifyUrl}</Text>
            </View>
          </View>

          <View style={{ marginTop: 16 }}>
            <Text style={s.legal}>
              Swiss Immo Cert bestätigt die Prüfung der eingereichten Nachweise zum Ausstellungszeitpunkt. Das Zertifikat
              ersetzt keine behördliche Auskunft. Missbrauch wird verfolgt.
            </Text>
          </View>
        </View>
      </Page>
    </Document>
  )
}
