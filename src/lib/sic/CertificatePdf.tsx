import { CertSeal, DocumentRule, HouseMark, ModuleGlyph } from '@/lib/sic/cert/art'
import { SIC_CERT_TAGLINE } from '@/lib/sic/brand'
import { SIC_BRAND_NAME, SIC_ISSUER_LINE } from '@/lib/sic/config'
import { CERT } from '@/lib/sic/cert/tokens'
import {
  SIC_CERT_DOCUMENT_TITLE,
  SIC_DECLARED_BADGE,
  SIC_MODULE_BADGE,
  SIC_MODULES,
  SIC_PLAUSIBILITY_FOOTER,
  SIC_UNCHECKED_LINE,
  type SicDocumentPresentation,
  type SicModuleId,
} from '@/lib/sic/modules'
import { Document, Font, Image, Page, StyleSheet, Text, View } from '@react-pdf/renderer'
import React from 'react'
import { sicSwissDate } from '@/lib/sic/validity'

// Keine Silbentrennung: Namen, Ämter und Arbeitgeber dürfen nicht mitten im Wort brechen.
Font.registerHyphenationCallback(word => [word])

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
    paddingBottom: 16,
    paddingHorizontal: 0,
    position: 'relative',
    flexDirection: 'column',
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
    flexGrow: 1,
    flexDirection: 'column',
  },
  /** Datum, Siegel und Fusszeile sitzen unten auf der Seite — wie bei einer Urkunde. */
  spacer: { flexGrow: 1, minHeight: 14 },

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
    textAlign: 'center',
  },
  holderRule: { marginTop: 8 },

  rows: { marginTop: 14 },
  block: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 11,
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
  personRow: { flexDirection: 'row' },
  personCol: { flex: 1, paddingRight: 8 },
  personColRight: { paddingLeft: 8, paddingRight: 0, borderLeftWidth: 0.6, borderLeftColor: C.faint },
  groupLabel: {
    marginTop: 6,
    fontSize: 7.5,
    fontFamily: 'Helvetica-Bold',
    color: C.muted,
    letterSpacing: 0.4,
  },
  lineDot: { color: C.navy, fontSize: 8, marginRight: 5, marginTop: 1 },
  lineText: { fontSize: T.moduleLine, color: '#334155', flex: 1, lineHeight: 1.35 },
  // Nicht geprüft: zurückgenommen, aber lesbar — neutral, kein Warnton.
  glyphWrapUnchecked: { borderColor: C.faint, borderStyle: 'dashed', opacity: 0.6 },
  blockTitleUnchecked: { color: C.muted },
  lineTextUnchecked: { color: C.muted },
  badge: {
    marginTop: 1,
    borderWidth: 0.7,
    borderColor: C.navy,
    borderRadius: 2,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  badgeDeclared: { borderColor: C.muted, borderStyle: 'dashed' },
  badgeText: {
    fontSize: T.badge,
    color: C.navy,
    fontFamily: 'Helvetica-Bold',
    letterSpacing: 0.8,
  },
  badgeTextDeclared: { color: C.muted },

  validityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 0.6,
    borderTopColor: C.faint,
    paddingTop: 12,
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
    marginTop: 12,
  },
  signCol: { flex: 1, paddingRight: 12, flexDirection: 'row', alignItems: 'center' },
  signText: { marginLeft: 12 },
  signIssuer: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: C.navy,
  },
  signNote: { marginTop: 3, fontSize: 7.5, color: C.muted, maxWidth: 180, lineHeight: 1.35 },
  qrCol: { alignItems: 'center' },
  qr: { width: 62, height: 62 },
  qrText: { fontSize: 6.5, color: C.muted, marginTop: 3, textAlign: 'center' },
  qrCode: { fontSize: 7, color: C.navy, fontFamily: 'Helvetica-Bold', marginTop: 1.5, letterSpacing: 0.4 },

  legal: {
    marginTop: 12,
    fontSize: 7.5,
    color: C.muted,
    textAlign: 'left',
    lineHeight: 1.45,
  },
})

/**
 * Dichte Dokumente (Paar mit langen Angaben) rücken enger zusammen, damit das
 * Zertifikat auf einer Seite bleibt. Schätzt umbrochene Zeilen statt zu messen:
 * volle Breite ~80 Zeichen, eine Personenspalte ~38.
 */
export function sicPdfLineEstimate(modules: SicPdfModule[]): number {
  const rows = (line: string, width: number) => Math.max(1, Math.ceil(line.length / width))
  let total = 0
  for (const m of modules) {
    total += 2.5
    const people = (m.groups ?? []).filter(g => g.label)
    if (people.length > 0) {
      const cols = people.map(g => 1 + g.lines.reduce((n, l) => n + rows(l, 38), 0))
      total += Math.max(...cols)
      for (const g of (m.groups ?? []).filter(g => !g.label)) total += g.lines.reduce((n, l) => n + rows(l, 80), 0)
    } else {
      total += m.lines.reduce((n, l) => n + rows(l, 80), 0)
    }
  }
  return total
}

function compactLayout(modules: SicPdfModule[]): boolean {
  return sicPdfLineEstimate(modules) > 22
}

const compact = StyleSheet.create({
  headerBand: { paddingTop: 12, paddingBottom: 10 },
  brandRow: { marginTop: 4 },
  body: { paddingTop: 12 },
  holderWrap: { marginTop: 10 },
  rows: { marginTop: 8 },
  block: { paddingVertical: 7 },
})

function fmt(d: Date): string {
  return sicSwissDate(d)
}

export type SicPdfModule = {
  id?: SicModuleId
  title: string
  lines: string[]
  /** Paar: Zeilen je Person (Label) und für den Haushalt (Label null). */
  groups?: { label: string | null; lines: string[] }[]
  /** Leer = GEPRÜFT. «ANGABE» bei einer Erklärung ohne Nachweis. */
  badge?: string
}

export function SicCertificatePdfDocument(props: {
  certificateCode: string
  holderName: string | null
  email?: string
  /** Tag der ersten Freigabe — nicht der Kauftag. */
  issuedAt: Date
  expiresAt: Date
  verifiedModules: SicPdfModule[]
  /** «2 von 4 Angaben geprüft» — macht den Umfang ehrlich. */
  completenessLabel: string
  /** Umfangssatz: nicht aufgeführte Angaben wurden nicht geprüft. */
  scopeNote: string
  verifyUrl: string
  qrDataUrl: string
  /** 'certificate' = mit Siegel (Betreibungsauszug und Ausweis geprüft). Ein Zertifikat ist es immer. */
  presentation?: SicDocumentPresentation
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
    presentation = 'certificate',
  } = props
  const isCertificate = presentation === 'certificate'
  // Ohne geprüften Betreibungsauszug ist «Gültig bis» nur eine vorläufige Frist — kein Datum vortäuschen.
  // Nicht geprüfte Angaben stehen neutral da — für jeden gleich, ob nie eingereicht oder abgelehnt.
  const shownIds = new Set(verifiedModules.map(m => m.id))
  const unchecked = SIC_MODULES.filter(def => !shownIds.has(def.id))
  const dense = compactLayout(verifiedModules)

  return (
    <Document title={`${SIC_BRAND_NAME} ${certificateCode}`}>
      <Page size="A4" style={s.page}>
        <View style={s.frame}>
          <View style={dense ? [s.headerBand, compact.headerBand] : s.headerBand}>
            <Text style={s.code}>{certificateCode}</Text>
            <HouseMark size={dense ? 32 : 42} onDark />
            <View style={dense ? [s.brandRow, compact.brandRow] : s.brandRow}>
              <Text style={s.brand}>Swiss </Text>
              <Text style={[s.brand, s.brandImmo]}>Immo </Text>
              <Text style={s.brand}>Cert</Text>
            </View>
            <View style={s.brandRuleRow}>
              <View style={s.brandRule} />
              <Text style={s.brandSub}>{SIC_CERT_DOCUMENT_TITLE}</Text>
              <View style={s.brandRule} />
            </View>
            <Text style={s.tagline}>{SIC_CERT_TAGLINE}</Text>
          </View>

          <View style={dense ? [s.body, compact.body] : s.body}>
            <Text style={s.completenessText}>{completenessLabel}</Text>

            <View style={dense ? [s.holderWrap, compact.holderWrap] : s.holderWrap}>
              <Text style={s.holderLabel}>Ausgestellt für</Text>
              <Text style={s.holderName}>{holderName || 'Inhaber gemäss Nachweisen'}</Text>
              <View style={s.holderRule}>
                <DocumentRule width={140} />
              </View>
            </View>

            <View style={dense ? [s.rows, compact.rows] : s.rows}>
              {verifiedModules.map((m, i) => {
                const declared = (m.badge ?? SIC_MODULE_BADGE) === SIC_DECLARED_BADGE
                const grouped = m.groups?.some(g => g.label) ? m.groups : null
                return (
                  <View key={i} style={dense ? [s.block, compact.block] : s.block} wrap={false}>
                    <View style={s.glyphWrap}>
                      <ModuleGlyph moduleId={m.id} size={15} />
                    </View>
                    <View style={s.blockBody}>
                      <Text style={s.blockTitle}>{m.title}</Text>
                      {grouped ?
                        <>
                          {/* Paar: zwei Spalten, eine pro Person — hält das Zertifikat auf einer Seite. */}
                          <View style={s.personRow}>
                            {grouped
                              .filter(g => g.label)
                              .map((g, k) => (
                                <View key={k} style={k === 0 ? s.personCol : [s.personCol, s.personColRight]}>
                                  <Text style={s.groupLabel}>{g.label}</Text>
                                  {g.lines.map((line, j) => (
                                    <View key={j} style={s.lineRow}>
                                      <Text style={s.lineDot}>•</Text>
                                      <Text style={s.lineText}>{line}</Text>
                                    </View>
                                  ))}
                                </View>
                              ))}
                          </View>
                          {grouped
                            .filter(g => !g.label)
                            .flatMap(g => g.lines)
                            .map((line, j) => (
                              <View key={`h${j}`} style={[s.lineRow, { marginTop: j === 0 ? 6 : 3 }]}>
                                <Text style={s.lineDot}>•</Text>
                                <Text style={s.lineText}>{line}</Text>
                              </View>
                            ))}
                        </>
                      : m.lines.map((line, j) => (
                          <View key={j} style={s.lineRow}>
                            <Text style={s.lineDot}>•</Text>
                            <Text style={s.lineText}>{line}</Text>
                          </View>
                        ))
                      }
                    </View>
                    <View style={declared ? [s.badge, s.badgeDeclared] : s.badge}>
                      <Text style={declared ? [s.badgeText, s.badgeTextDeclared] : s.badgeText}>
                        {m.badge ?? SIC_MODULE_BADGE}
                      </Text>
                    </View>
                  </View>
                )
              })}
              {unchecked.map(def => (
                <View key={def.id} style={dense ? [s.block, compact.block] : s.block} wrap={false}>
                  <View style={[s.glyphWrap, s.glyphWrapUnchecked]}>
                    <ModuleGlyph moduleId={def.id} size={15} />
                  </View>
                  <View style={s.blockBody}>
                    <Text style={[s.blockTitle, s.blockTitleUnchecked]}>{def.title}</Text>
                    <View style={s.lineRow}>
                      <Text style={[s.lineText, s.lineTextUnchecked]}>{SIC_UNCHECKED_LINE}</Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>

            <View style={s.spacer} />

            <View wrap={false}>
              <View style={s.validityRow}>
                <View style={s.validCol}>
                  <Text style={s.validLabel}>Zertifikatsdatum</Text>
                  <Text style={s.validValue}>{fmt(issuedAt)}</Text>
                </View>
                <View style={[s.validCol, { alignItems: 'flex-end' }]}>
                  <Text style={s.validLabel}>Gültig bis</Text>
                  <Text style={s.validValue}>{fmt(expiresAt)}</Text>
                </View>
              </View>

              <View style={s.signRow}>
                <View style={s.signCol}>
                  {isCertificate ? <CertSeal year={String(issuedAt.getFullYear())} /> : null}
                  <View style={isCertificate ? s.signText : undefined}>
                    <Text style={s.signIssuer}>{SIC_ISSUER_LINE}</Text>
                    <Text style={s.signNote}>Gültig, solange die Prüfseite das Zertifikat als gültig ausweist.</Text>
                  </View>
                </View>
                <View style={s.qrCol}>
                  {qrDataUrl ? <Image src={qrDataUrl} style={s.qr} /> : null}
                  <Text style={s.qrText}>QR-Code scannen</Text>
                  <Text style={s.qrCode}>{certificateCode}</Text>
                </View>
              </View>

              <Text style={s.legal}>
                {scopeNote} {SIC_PLAUSIBILITY_FOOTER} Online-Verifikation: {verifyUrl}
              </Text>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  )
}
