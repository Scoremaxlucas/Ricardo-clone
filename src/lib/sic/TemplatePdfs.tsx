import type { SicTemplateDefinition, SicTemplateValues } from '@/lib/sic/templates'
import { Document, Page, StyleSheet, Text, View } from '@react-pdf/renderer'

const NAVY = '#0f2b5e'
const GOLD = '#b8912f'
const RED = '#c8102e'
const MUTED = '#64748b'
const INK = '#1e293b'
const FAINT = '#e2e8f0'

const s = StyleSheet.create({
  page: { padding: 36, fontFamily: 'Helvetica', fontSize: 10, color: INK },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  brand: { fontFamily: 'Helvetica-Bold', fontSize: 14, color: NAVY, letterSpacing: 1 },
  brandSub: { marginTop: 2, fontSize: 8, color: GOLD, letterSpacing: 2 },
  crest: { width: 28, height: 28, borderRadius: 5, backgroundColor: RED, alignItems: 'center', justifyContent: 'center' },
  crestMark: { color: '#fff', fontSize: 16, fontFamily: 'Helvetica-Bold' },
  title: { marginTop: 22, fontFamily: 'Helvetica-Bold', fontSize: 16, color: NAVY },
  subtitle: { marginTop: 4, fontSize: 9, color: MUTED },
  rule: { marginTop: 14, marginBottom: 10, height: 1, backgroundColor: FAINT },
  section: { marginTop: 12, marginBottom: 4, fontFamily: 'Helvetica-Bold', fontSize: 10, color: NAVY, textTransform: 'uppercase', letterSpacing: 1 },
  row: { marginBottom: 8 },
  label: { fontSize: 8, color: MUTED, marginBottom: 2 },
  valueBox: {
    minHeight: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#cbd5e1',
    paddingBottom: 3,
    fontSize: 10,
    color: INK,
  },
  yesno: { flexDirection: 'row', marginTop: 2 },
  check: { fontSize: 9, color: INK, marginRight: 16 },
  note: { marginTop: 16, fontSize: 8, color: MUTED, lineHeight: 1.4 },
  signRow: { marginTop: 28, flexDirection: 'row', justifyContent: 'space-between' },
  signBox: { width: '45%' },
  signLine: { marginTop: 28, borderBottomWidth: 1, borderBottomColor: NAVY, height: 1 },
  signHint: { marginTop: 4, fontSize: 8, color: MUTED },
  footer: { position: 'absolute', bottom: 24, left: 36, right: 36, fontSize: 7, color: '#94a3b8', textAlign: 'center' },
})

function FieldValue({ value }: { value?: string }) {
  const v = (value ?? '').trim()
  if (!v) return <Text style={s.valueBox}>…………………………………………</Text>
  return <Text style={s.valueBox}>{v}</Text>
}

function YesNoValue({ value }: { value?: string }) {
  const v = (value ?? '').trim().toLowerCase()
  return (
    <View style={s.yesno}>
      <Text style={s.check}>{v === 'ja' || v === 'yes' ? '☑' : '☐'} Ja</Text>
      <Text style={s.check}>{v === 'nein' || v === 'no' ? '☑' : '☐'} Nein</Text>
    </View>
  )
}

export function SicTemplatePdfDocument(props: {
  template: SicTemplateDefinition
  values: SicTemplateValues
}) {
  const { template, values } = props
  const tenantFields = template.fields.filter(f => f.section === 'tenant')
  const thirdFields = template.fields.filter(f => f.section === 'third_party')

  return (
    <Document>
      <Page size="A4" style={s.page}>
        <View style={s.headerRow}>
          <View>
            <Text style={s.brand}>SWISS IMMO CERT</Text>
            <Text style={s.brandSub}>NACHWEISFORMULAR</Text>
          </View>
          <View style={s.crest}>
            <Text style={s.crestMark}>+</Text>
          </View>
        </View>

        <Text style={s.title}>{template.title}</Text>
        <Text style={s.subtitle}>{template.subtitle}</Text>
        <View style={s.rule} />

        <Text style={s.section}>Angaben der mietsuchenden Person</Text>
        {tenantFields.map(f => (
          <View key={f.key} style={s.row} wrap={false}>
            <Text style={s.label}>{f.label}{f.required ? ' *' : ''}</Text>
            {f.kind === 'yesno' ? <YesNoValue value={values[f.key]} /> : <FieldValue value={values[f.key]} />}
          </View>
        ))}

        <Text style={s.section}>Vom {template.thirdPartyLabel} auszufüllen / zu bestätigen</Text>
        {thirdFields.map(f => (
          <View key={f.key} style={s.row} wrap={false}>
            <Text style={s.label}>{f.label}{f.required ? ' *' : ''}</Text>
            {f.kind === 'yesno' ? <YesNoValue value={values[f.key]} /> : <FieldValue value={values[f.key]} />}
          </View>
        ))}

        <View style={s.signRow}>
          <View style={s.signBox}>
            <View style={s.signLine} />
            <Text style={s.signHint}>Unterschrift {template.thirdPartyLabel}</Text>
          </View>
          <View style={s.signBox}>
            <View style={s.signLine} />
            <Text style={s.signHint}>Ort / Datum</Text>
          </View>
        </View>

        <Text style={s.note}>
          Dieses Formular dient als Nachweis für Swiss Immo Cert. Unvollständige oder fehlende Angaben
          können zu einer Rückfrage führen. Bitte unterschriebenes Dokument als PDF oder Foto im
          Mieter-Dossier hochladen.
        </Text>

        <Text style={s.footer}>Swiss Immo Cert · schweizerisches Mieter-Zertifikat · swissimmocert.ch / wohnen.helvenda.ch</Text>
      </Page>
    </Document>
  )
}
