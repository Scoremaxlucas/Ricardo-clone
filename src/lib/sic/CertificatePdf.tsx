import { Document, Image, Page, StyleSheet, Text, View } from '@react-pdf/renderer'

const NAVY = '#0f2b5e'
const GOLD = '#b8912f'
const GOLD_LIGHT = '#d8b25a'
const GREEN = '#2f9e44'
const RED = '#c8102e'
const INK = '#1e293b'
const MUTED = '#64748b'
const FAINT = '#e7ddc4'

const s = StyleSheet.create({
  page: { padding: 24, backgroundColor: '#ffffff', fontFamily: 'Helvetica', color: INK, fontSize: 10 },
  frameOuter: { flexGrow: 1, borderWidth: 2.5, borderColor: NAVY, padding: 4 },
  frameInner: { flexGrow: 1, borderWidth: 1, borderColor: GOLD, paddingVertical: 26, paddingHorizontal: 34, position: 'relative' },

  code: { position: 'absolute', top: 12, right: 16, fontSize: 8, color: MUTED, fontFamily: 'Helvetica-Bold', letterSpacing: 1 },

  header: { alignItems: 'center' },
  crest: { width: 42, height: 42, borderRadius: 7, backgroundColor: RED, alignItems: 'center', justifyContent: 'center' },
  crestV: { position: 'absolute', width: 7, height: 24, backgroundColor: '#fff', borderRadius: 1 },
  crestH: { position: 'absolute', width: 24, height: 7, backgroundColor: '#fff', borderRadius: 1 },
  brand: { marginTop: 12, fontFamily: 'Times-Bold', fontSize: 25, color: NAVY, letterSpacing: 3, textAlign: 'center' },
  brandRuleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 6 },
  brandRule: { height: 1, width: 46, backgroundColor: GOLD },
  brandSub: { fontSize: 9, color: GOLD, letterSpacing: 4, marginHorizontal: 10, fontFamily: 'Helvetica-Bold' },
  tagline: { marginTop: 6, fontSize: 9, color: MUTED, textAlign: 'center' },
  divider: { height: 1, backgroundColor: FAINT, marginTop: 16, marginBottom: 4 },

  holderWrap: { marginTop: 10, alignItems: 'center' },
  holderLabel: { fontSize: 8, color: MUTED, letterSpacing: 1, textTransform: 'uppercase' },
  holderName: { marginTop: 3, fontFamily: 'Times-Bold', fontSize: 15, color: NAVY },
  holderMeta: { marginTop: 1, fontSize: 9, color: MUTED },

  rows: { marginTop: 18 },
  block: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: FAINT },
  bullet: { width: 24, height: 24, borderRadius: 12, backgroundColor: NAVY, borderWidth: 1.2, borderColor: GOLD, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  bulletMark: { color: GOLD_LIGHT, fontSize: 11, fontFamily: 'Helvetica-Bold' },
  blockBody: { flex: 1, paddingRight: 10 },
  blockTitle: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: NAVY },
  lineRow: { flexDirection: 'row', alignItems: 'flex-start', marginTop: 3 },
  lineDot: { color: GOLD, fontSize: 8, marginRight: 5, marginTop: 1 },
  lineText: { fontSize: 9.5, color: '#334155', flex: 1 },
  verified: { flexDirection: 'row', alignItems: 'center', marginTop: 1 },
  verifiedCheck: { width: 12, height: 12, borderRadius: 6, backgroundColor: GREEN, color: '#fff', fontSize: 7, textAlign: 'center', paddingTop: 2, marginRight: 4, fontFamily: 'Helvetica-Bold' },
  verifiedText: { fontSize: 8, color: GREEN, fontFamily: 'Helvetica-Bold', letterSpacing: 1 },

  emptyNote: { fontSize: 10, color: MUTED, marginTop: 6, lineHeight: 1.5 },

  footer: { position: 'absolute', bottom: 22, left: 34, right: 34 },
  validityRow: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: FAINT, paddingTop: 12, marginBottom: 16 },
  validCol: { flexDirection: 'row', alignItems: 'center' },
  calIcon: { width: 20, height: 20, borderRadius: 4, backgroundColor: NAVY, marginRight: 8 },
  validLabel: { fontSize: 7.5, color: MUTED, textTransform: 'uppercase', letterSpacing: 1 },
  validValue: { fontSize: 12, fontFamily: 'Helvetica-Bold', color: NAVY, marginTop: 1 },

  signRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  seal: { width: 62, height: 62, borderRadius: 31, borderWidth: 1.5, borderColor: GOLD, alignItems: 'center', justifyContent: 'center' },
  sealTop: { fontSize: 6, color: GOLD, fontFamily: 'Helvetica-Bold', letterSpacing: 0.5, textAlign: 'center' },
  sealMark: { fontSize: 15, color: NAVY, fontFamily: 'Helvetica-Bold', marginVertical: 1 },
  sealBottom: { fontSize: 5, color: GOLD, letterSpacing: 0.5, textAlign: 'center' },
  signCol: { alignItems: 'center', flex: 1, marginHorizontal: 14 },
  signLine: { width: 150, borderBottomWidth: 1, borderBottomColor: NAVY, height: 22 },
  signLabel: { marginTop: 4, fontSize: 8, color: MUTED, textAlign: 'center' },
  qrCol: { alignItems: 'center' },
  qr: { width: 62, height: 62 },
  qrText: { fontSize: 6.5, color: MUTED, marginTop: 3, textAlign: 'center', maxWidth: 78 },

  legal: { position: 'absolute', bottom: 6, left: 34, right: 34, fontSize: 6.5, color: '#94a3b8', textAlign: 'center', lineHeight: 1.4 },
})

function fmt(d: Date): string {
  return d.toLocaleDateString('de-CH', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export type SicPdfModule = { title: string; lines: string[] }

export function SicCertificatePdfDocument(props: {
  certificateCode: string
  holderName: string | null
  email?: string
  issuedAt: Date
  expiresAt: Date
  verifiedModules: SicPdfModule[]
  verifyUrl: string
  qrDataUrl: string
}) {
  const { certificateCode, holderName, issuedAt, expiresAt, verifiedModules, verifyUrl, qrDataUrl } = props

  return (
    <Document title={`Swiss Immo Cert ${certificateCode}`}>
      <Page size="A4" style={s.page}>
        <View style={s.frameOuter}>
          <View style={s.frameInner}>
            <Text style={s.code}>{certificateCode}</Text>

            {/* Kopf */}
            <View style={s.header}>
              <View style={s.crest}>
                <View style={s.crestV} />
                <View style={s.crestH} />
              </View>
              <Text style={s.brand}>SWISS IMMO CERT</Text>
              <View style={s.brandRuleRow}>
                <View style={s.brandRule} />
                <Text style={s.brandSub}>MIETER-ZERTIFIKAT</Text>
                <View style={s.brandRule} />
              </View>
              <Text style={s.tagline}>Geprüft. Verifiziert. Vertrauenswürdig.</Text>
            </View>

            <View style={s.divider} />

            <View style={s.holderWrap}>
              <Text style={s.holderLabel}>Ausgestellt für</Text>
              <Text style={s.holderName}>{holderName || 'Inhaber gemäss Nachweisen'}</Text>
            </View>

            {/* Verifizierte Angaben */}
            <View style={s.rows}>
              {verifiedModules.length === 0 ?
                <Text style={s.emptyNote}>
                  Basiszertifikat — es wurden noch keine Module verifiziert. Fügen Sie Module hinzu, um geprüfte
                  Angaben anzuzeigen.
                </Text>
              : verifiedModules.map((m, i) => (
                  <View key={i} style={s.block}>
                    <View style={s.bullet}>
                      <Text style={s.bulletMark}>✓</Text>
                    </View>
                    <View style={s.blockBody}>
                      <Text style={s.blockTitle}>{m.title}</Text>
                      {m.lines.map((line, j) => (
                        <View key={j} style={s.lineRow}>
                          <Text style={s.lineDot}>•</Text>
                          <Text style={s.lineText}>{line}</Text>
                        </View>
                      ))}
                    </View>
                    <View style={s.verified}>
                      <Text style={s.verifiedCheck}>✓</Text>
                      <Text style={s.verifiedText}>VERIFIZIERT</Text>
                    </View>
                  </View>
                ))
              }
            </View>

            {/* Fuss */}
            <View style={s.footer}>
              <View style={s.validityRow}>
                <View style={s.validCol}>
                  <View style={s.calIcon} />
                  <View>
                    <Text style={s.validLabel}>Zertifikatsdatum</Text>
                    <Text style={s.validValue}>{fmt(issuedAt)}</Text>
                  </View>
                </View>
                <View style={s.validCol}>
                  <View style={s.calIcon} />
                  <View>
                    <Text style={s.validLabel}>Gültig bis</Text>
                    <Text style={s.validValue}>{fmt(expiresAt)}</Text>
                  </View>
                </View>
              </View>

              <View style={s.signRow}>
                <View style={s.seal}>
                  <Text style={s.sealTop}>GEPRÜFT &amp;</Text>
                  <Text style={s.sealMark}>SIC</Text>
                  <Text style={s.sealBottom}>VERIFIZIERT</Text>
                </View>

                <View style={s.signCol}>
                  <View style={s.signLine} />
                  <Text style={s.signLabel}>Swiss Immo Cert · Geprüft. Verifiziert.</Text>
                </View>

                <View style={s.qrCol}>
                  {qrDataUrl ? <Image src={qrDataUrl} style={s.qr} /> : null}
                  <Text style={s.qrText}>Echtheit prüfen: QR-Code scannen</Text>
                </View>
              </View>
            </View>

            <Text style={s.legal}>
              Swiss Immo Cert bestätigt die Prüfung der eingereichten Nachweise zum Ausstellungszeitpunkt. Das
              Zertifikat ersetzt keine behördliche Auskunft. Online-Verifikation: {verifyUrl}
            </Text>
          </View>
        </View>
      </Page>
    </Document>
  )
}
