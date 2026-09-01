import { DocumentRule, HouseMark, ModuleGlyph } from '@/lib/sic/cert/art'
import { SIC_CERT_TAGLINE } from '@/lib/sic/brand'
import { SIC_BRAND_NAME, SIC_ISSUER_LINE } from '@/lib/sic/config'
import { CERT } from '@/lib/sic/cert/tokens'
import { SIC_MODULE_BADGE, SIC_PLAUSIBILITY_FOOTER, type SicModuleId } from '@/lib/sic/modules'
import { Document, Image, Page, StyleSheet, Text, View } from '@react-pdf/renderer'
import React from 'react'

const C = CERT.color
const T = CERT.type

const s = StyleSheet.create({
  page: {
    backgroundColor: C.ivory,
    fontFamily: 'Helvetica',
    color: C.ink,
    fontSize: 10,
    padding: 28,
  },
  frame: {
    flexGrow: 1,
    borderWidth: 1.2,
    borderColor: C.navy,
    paddingTop: 0,
    paddingBottom: 20,
    paddingHorizontal: 0,
    position: 'relative',
  },

  headerBand: {
    backgroundColor: C.navy,
    paddingTop: 18,
    paddingBottom: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    position: 'relative',
  },
  code: {
    position: 'absolute',
    top: 10,
    right: 16,
    fontSize: T.code,
    color: C.goldPale,
    fontFamily: 'Helvetica-Bold',
    letterSpacing: 1,
  },
  brandRow: {
    marginTop: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'baseline',
  },
  brand: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 16,
    color: C.white,
    letterSpacing: 0.4,
  },
  brandImmo: {
    color: C.red,
  },
  brandRuleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  brandRule: { height: 0.7, width: 28, backgroundColor: C.gold },
  brandSub: {
    fontSize: 8,
    color: C.goldLight,
    letterSpacing: 2.4,
    marginHorizontal: 10,
    fontFamily: 'Helvetica-Bold',
  },
  tagline: {
    marginTop: 6,
    fontSize: T.tagline,
    color: C.goldPale,
    textAlign: 'center',
    letterSpacing: 0.3,
  },

  body: {
    paddingHorizontal: 28,
    paddingTop: 18,
  },

  completenessText: {
    fontSize: T.completeness,
    color: C.navy,
    fontFamily: 'Helvetica-Bold',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    textAlign: 'center',
  },

  holderWrap: { marginTop: 16, alignItems: 'center' },
  holderLabel: {
    fontSize: T.holderLabel,
    color: C.muted,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  holderName: {
    marginTop: 4,
    fontFamily: 'Helvetica-Bold',
    fontSize: 15,
    color: C.navy,
  },
  holderRule: { marginTop: 8 },

  rows: { marginTop: 14 },
  block: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 9,
    borderBottomWidth: 0.6,
    borderBottomColor: C.faint,
  },
  glyphWrap: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 0.7,
    borderColor: C.navy,
    backgroundColor: C.ivorySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  blockBody: { flex: 1, paddingRight: 8 },
  blockTitle: {
    fontSize: T.moduleTitle,
    fontFamily: 'Helvetica-Bold',
    color: C.navy,
  },
  lineRow: { flexDirection: 'row', alignItems: 'flex-start', marginTop: 3 },
  lineDot: { color: C.navy, fontSize: 8, marginRight: 5, marginTop: 1 },
  lineText: { fontSize: T.moduleLine, color: '#334155', flex: 1, lineHeight: 1.35 },
  badge: {
    marginTop: 2,
  },
  badgeText: {
    fontSize: T.badge,
    color: C.navy,
    fontFamily: 'Helvetica-Bold',
    letterSpacing: 0.8,
  },

  validityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 0.6,
    borderTopColor: C.faint,
    paddingTop: 14,
    marginTop: 18,
  },
  validCol: { flexDirection: 'column' },
  validLabel: {
    fontSize: T.dateLabel,
    color: C.muted,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  validValue: {
    fontSize: T.dateValue,
    fontFamily: 'Helvetica-Bold',
    color: C.navy,
    marginTop: 2,
  },

  signRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginTop: 18,
  },
  signCol: { flex: 1, paddingRight: 12 },
  signIssuer: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: C.navy,
  },
  signDate: { marginTop: 3, fontSize: 8, color: C.muted },
  qrCol: { alignItems: 'center' },
  qr: { width: 58, height: 58 },
  qrText: { fontSize: 6.5, color: C.muted, marginTop: 3, textAlign: 'center', maxWidth: 78 },

  legal: {
    marginTop: 16,
    fontSize: 7.5,
    color: C.muted,
    textAlign: 'left',
    lineHeight: 1.45,
  },
})

function fmt(d: Date): string {
  return d.toLocaleDateString('de-CH', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export type SicPdfModule = {
  id?: SicModuleId
  title: string
  lines: string[]
}

export function SicCertificatePdfDocument(props: {
  certificateCode: string
  holderName: string | null
  email?: string
  /** Tag der ersten Freigabe — nicht der Kauftag. */
  issuedAt: Date
  expiresAt: Date
  verifiedModules: SicPdfModule[]
  /** «2 von 4 Angaben geprüft» — macht ein Teil-Zertifikat ehrlich. */
  completenessLabel: string
  /** Umfangssatz: nicht aufgeführte Angaben wurden nicht geprüft. */
  scopeNote: string
  verifyUrl: string
  qrDataUrl: string
}) {
  const {
    certificateCode,
    holderName,
    issuedAt,
    expiresAt,
    verifiedModules,
    completenessLabel,
    scopeNote,
    verifyUrl,
    qrDataUrl,
  } = props

  return (
    <Document title={`${SIC_BRAND_NAME} ${certificateCode}`}>
      <Page size="A4" style={s.page}>
        <View style={s.frame}>
          <View style={s.headerBand}>
            <Text style={s.code}>{certificateCode}</Text>
            <HouseMark size={42} onDark />
            <View style={s.brandRow}>
              <Text style={s.brand}>Swiss </Text>
              <Text style={[s.brand, s.brandImmo]}>Immo </Text>
              <Text style={s.brand}>Cert</Text>
            </View>
            <View style={s.brandRuleRow}>
              <View style={s.brandRule} />
              <Text style={s.brandSub}>MIETER-ZERTIFIKAT</Text>
              <View style={s.brandRule} />
            </View>
            <Text style={s.tagline}>{SIC_CERT_TAGLINE}</Text>
          </View>

          <View style={s.body}>
            <Text style={s.completenessText}>{completenessLabel}</Text>

            <View style={s.holderWrap}>
              <Text style={s.holderLabel}>Ausgestellt für</Text>
              <Text style={s.holderName}>{holderName || 'Inhaber gemäss Nachweisen'}</Text>
              <View style={s.holderRule}>
                <DocumentRule width={140} />
              </View>
            </View>

            <View style={s.rows}>
              {verifiedModules.map((m, i) => (
                <View key={i} style={s.block} wrap={false}>
                  <View style={s.glyphWrap}>
                    <ModuleGlyph moduleId={m.id} size={15} />
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
                  <View style={s.badge}>
                    <Text style={s.badgeText}>{SIC_MODULE_BADGE}</Text>
                  </View>
                </View>
              ))}
            </View>

            <View style={s.validityRow}>
              <View style={s.validCol}>
                <Text style={s.validLabel}>Zertifikatsdatum</Text>
                <Text style={s.validValue}>{fmt(issuedAt)}</Text>
              </View>
              <View style={s.validCol}>
                <Text style={s.validLabel}>Gültig bis</Text>
                <Text style={s.validValue}>{fmt(expiresAt)}</Text>
              </View>
            </View>

            <View style={s.signRow}>
              <View style={s.signCol}>
                <Text style={s.signIssuer}>{SIC_ISSUER_LINE}</Text>
                <Text style={s.signDate}>{fmt(issuedAt)}</Text>
              </View>
              <View style={s.qrCol}>
                {qrDataUrl ? <Image src={qrDataUrl} style={s.qr} /> : null}
                <Text style={s.qrText}>Prüfseite: QR-Code scannen</Text>
              </View>
            </View>

            <Text style={s.legal}>
              {scopeNote} {SIC_PLAUSIBILITY_FOOTER} Online-Verifikation: {verifyUrl}
            </Text>
          </View>
        </View>
      </Page>
    </Document>
  )
}
