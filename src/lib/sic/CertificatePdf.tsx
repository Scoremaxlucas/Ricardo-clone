import {
  CalendarMark,
  CornerFlourish,
  CrestWithLaurel,
  GuillocheRule,
  ModuleGlyph,
  Seal,
} from '@/lib/sic/cert/art'
import { SIC_CERT_TAGLINE } from '@/lib/sic/brand'
import { SIC_BRAND_NAME } from '@/lib/sic/config'
import { SIC_CERT_BACKDROP_DATA_URL } from '@/lib/sic/cert/backdrop-asset'
import { CERT } from '@/lib/sic/cert/tokens'
import type { SicModuleId } from '@/lib/sic/modules'
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
    padding: CERT.page.padding,
  },
  frameOuter: {
    flexGrow: 1,
    borderWidth: CERT.frame.outer,
    borderColor: C.navy,
    padding: CERT.frame.gap,
    position: 'relative',
  },
  frameInner: {
    flexGrow: 1,
    borderWidth: CERT.frame.inner,
    borderColor: C.gold,
    paddingTop: CERT.frame.padV,
    paddingBottom: CERT.frame.padV + 8,
    paddingHorizontal: CERT.frame.padH,
    position: 'relative',
  },
  corner: { position: 'absolute', width: 28, height: 28 },
  cornerTL: { top: 6, left: 6 },
  cornerTR: { top: 6, right: 6 },
  cornerBL: { bottom: 6, left: 6 },
  cornerBR: { bottom: 6, right: 6 },

  backdrop: {
    position: 'absolute',
    left: 24,
    right: 24,
    top: 250,
    height: 180,
    opacity: 0.18,
  },

  headerBand: {
    backgroundColor: C.navy,
    marginHorizontal: -CERT.frame.padH + 4,
    marginTop: -CERT.frame.padV + 8,
    paddingTop: 14,
    paddingBottom: 14,
    paddingHorizontal: 16,
    alignItems: 'center',
    position: 'relative',
  },
  code: {
    position: 'absolute',
    top: 8,
    right: 12,
    fontSize: T.code,
    color: C.goldPale,
    fontFamily: 'Helvetica-Bold',
    letterSpacing: 1.1,
  },
  brand: {
    marginTop: 6,
    fontFamily: 'Times-Bold',
    fontSize: T.brand,
    color: C.white,
    letterSpacing: 1.2,
    textAlign: 'center',
  },
  brandRuleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  brandRule: { height: 1, width: 40, backgroundColor: C.gold },
  brandSub: {
    fontSize: T.brandSub,
    color: C.goldLight,
    letterSpacing: 3.5,
    marginHorizontal: 10,
    fontFamily: 'Helvetica-Bold',
  },
  tagline: {
    marginTop: 6,
    fontSize: T.tagline,
    color: C.goldPale,
    textAlign: 'center',
    letterSpacing: 0.4,
  },

  completenessWrap: {
    marginTop: 10,
    alignSelf: 'center',
    borderWidth: 0.8,
    borderColor: C.goldLight,
    backgroundColor: C.ivorySoft,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 2,
  },
  completenessText: {
    fontSize: T.completeness,
    color: C.goldText,
    fontFamily: 'Helvetica-Bold',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },

  holderWrap: { marginTop: 14, alignItems: 'center' },
  holderLabel: {
    fontSize: T.holderLabel,
    color: C.muted,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  holderName: {
    marginTop: 4,
    fontFamily: 'Times-Bold',
    fontSize: T.holderName,
    color: C.navy,
  },
  holderRule: { marginTop: 8 },

  rows: { marginTop: 16 },
  block: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: C.faint,
  },
  glyphWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.gold,
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
  lineDot: { color: C.gold, fontSize: 8, marginRight: 5, marginTop: 1 },
  lineText: { fontSize: T.moduleLine, color: '#334155', flex: 1, lineHeight: 1.35 },
  badge: {
    borderWidth: 1,
    borderColor: C.gold,
    backgroundColor: C.ivorySoft,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 2,
    marginTop: 2,
  },
  badgeText: {
    fontSize: T.badge,
    color: C.gold,
    fontFamily: 'Helvetica-Bold',
    letterSpacing: 1,
  },

  emptyNote: { fontSize: 10, color: C.muted, marginTop: 6, lineHeight: 1.5 },

  footer: { position: 'absolute', bottom: 28, left: CERT.frame.padH, right: CERT.frame.padH },
  validityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: C.faint,
    paddingTop: 12,
    marginBottom: 14,
  },
  validCol: { flexDirection: 'row', alignItems: 'center' },
  calIcon: {
    marginRight: 8,
  },
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
    marginTop: 1,
  },

  signRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  signCol: { alignItems: 'center', flex: 1, marginHorizontal: 12 },
  signLine: { width: 150, borderBottomWidth: 1, borderBottomColor: C.navy, height: 20 },
  signLabel: { marginTop: 4, fontSize: 7.5, color: C.muted, textAlign: 'center' },
  qrCol: { alignItems: 'center' },
  qr: { width: 58, height: 58 },
  qrText: { fontSize: 6.2, color: C.muted, marginTop: 3, textAlign: 'center', maxWidth: 78 },

  legal: {
    position: 'absolute',
    bottom: 8,
    left: CERT.frame.padH,
    right: CERT.frame.padH,
    fontSize: T.legal,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 1.4,
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
        <View style={s.frameOuter}>
          <View style={s.frameInner}>
            <View style={[s.corner, s.cornerTL]}>
              <CornerFlourish corner="tl" />
            </View>
            <View style={[s.corner, s.cornerTR]}>
              <CornerFlourish corner="tr" />
            </View>
            <View style={[s.corner, s.cornerBL]}>
              <CornerFlourish corner="bl" />
            </View>
            <View style={[s.corner, s.cornerBR]}>
              <CornerFlourish corner="br" />
            </View>

            <Image src={SIC_CERT_BACKDROP_DATA_URL} style={s.backdrop} />

            <View style={s.headerBand}>
              <Text style={s.code}>{certificateCode}</Text>
              <CrestWithLaurel size={72} />
              <Text style={s.brand}>{SIC_BRAND_NAME}</Text>
              <View style={s.brandRuleRow}>
                <View style={s.brandRule} />
                <Text style={s.brandSub}>MIETER-ZERTIFIKAT</Text>
                <View style={s.brandRule} />
              </View>
              <Text style={s.tagline}>{SIC_CERT_TAGLINE}</Text>
            </View>

            <View style={s.completenessWrap}>
              <Text style={s.completenessText}>{completenessLabel}</Text>
            </View>

            <View style={s.holderWrap}>
              <Text style={s.holderLabel}>Ausgestellt für</Text>
              <Text style={s.holderName}>{holderName || 'Inhaber gemäss Nachweisen'}</Text>
              <View style={s.holderRule}>
                <GuillocheRule width={160} />
              </View>
            </View>

            <View style={s.rows}>
              {verifiedModules.length === 0 ?
                <Text style={s.emptyNote}>
                  Basiszertifikat — es wurden noch keine Module verifiziert. Fügen Sie Module hinzu,
                  um geprüfte Angaben anzuzeigen.
                </Text>
              : verifiedModules.map((m, i) => (
                  <View key={i} style={s.block} wrap={false}>
                    <View style={s.glyphWrap}>
                      <ModuleGlyph moduleId={m.id} size={16} />
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
                      <Text style={s.badgeText}>VERIFIZIERT</Text>
                    </View>
                  </View>
                ))
              }
            </View>

            <View style={s.footer}>
              <View style={s.validityRow}>
                <View style={s.validCol}>
                  <View style={s.calIcon}>
                    <CalendarMark size={18} />
                  </View>
                  <View>
                    <Text style={s.validLabel}>Zertifikatsdatum</Text>
                    <Text style={s.validValue}>{fmt(issuedAt)}</Text>
                  </View>
                </View>
                <View style={s.validCol}>
                  <View style={s.calIcon}>
                    <CalendarMark size={18} />
                  </View>
                  <View>
                    <Text style={s.validLabel}>Gültig bis</Text>
                    <Text style={s.validValue}>{fmt(expiresAt)}</Text>
                  </View>
                </View>
              </View>

              <View style={s.signRow}>
                <Seal size={58} />

                <View style={s.signCol}>
                  <View style={s.signLine} />
                  <Text style={s.signLabel}>
                    {SIC_BRAND_NAME} · {SIC_CERT_TAGLINE}
                  </Text>
                </View>

                <View style={s.qrCol}>
                  {qrDataUrl ? <Image src={qrDataUrl} style={s.qr} /> : null}
                  <Text style={s.qrText}>Echtheit prüfen: QR-Code scannen</Text>
                </View>
              </View>
            </View>

            <Text style={s.legal}>
              {scopeNote} {SIC_BRAND_NAME} bestätigt die Prüfung der eingereichten Nachweise zum
              Ausstellungszeitpunkt und ersetzt keine behördliche Auskunft. Online-Verifikation:{' '}
              {verifyUrl}
            </Text>
          </View>
        </View>
      </Page>
    </Document>
  )
}
