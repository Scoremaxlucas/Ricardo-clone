import type { SicTemplateDefinition, SicTemplateField, SicTemplateValues } from '@/lib/sic/templates'
import { Document, Page, StyleSheet, Text, View } from '@react-pdf/renderer'

const NAVY = '#0f2b5e'
const GOLD = '#b8912f'
const RED = '#c8102e'
const MUTED = '#64748b'
const INK = '#1e293b'
const FAINT = '#e2e8f0'
const LINE = '#94a3b8'

const s = StyleSheet.create({
  page: { padding: 36, fontFamily: 'Helvetica', fontSize: 10, color: INK },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  brand: { fontFamily: 'Helvetica-Bold', fontSize: 14, color: NAVY, letterSpacing: 1 },
  brandSub: { marginTop: 2, fontSize: 8, color: GOLD, letterSpacing: 2 },
  crest: { width: 28, height: 28, borderRadius: 5, backgroundColor: RED, alignItems: 'center', justifyContent: 'center' },
  crestMark: { color: '#fff', fontSize: 16, fontFamily: 'Helvetica-Bold' },
  title: { marginTop: 18, fontFamily: 'Helvetica-Bold', fontSize: 15, color: NAVY },
  subtitle: { marginTop: 3, fontSize: 9, color: MUTED },
  rule: { marginTop: 12, marginBottom: 8, height: 1.5, backgroundColor: NAVY },
  section: {
    marginTop: 14,
    marginBottom: 8,
    paddingVertical: 4,
    paddingHorizontal: 6,
    backgroundColor: '#f1f5f9',
    fontFamily: 'Helvetica-Bold',
    fontSize: 9,
    color: NAVY,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  row: { marginBottom: 10 },
  label: { fontSize: 8, color: MUTED, marginBottom: 3 },
  /** Ausgefüllter Wert */
  filled: {
    minHeight: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: FAINT,
    paddingBottom: 2,
    fontSize: 10,
    color: INK,
  },
  /** Leere Schreiblinie für Handschrift */
  blankLine: {
    height: 22,
    borderBottomWidth: 1,
    borderBottomColor: LINE,
    marginTop: 2,
  },
  /** Höheres Feld für Textarea / Bemerkungen */
  blankArea: {
    height: 48,
    borderWidth: 1,
    borderColor: LINE,
    borderStyle: 'dashed',
    marginTop: 2,
    borderRadius: 2,
  },
  optionsRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 2 },
  option: { fontSize: 9, color: INK, marginRight: 14, marginBottom: 4 },
  note: { marginTop: 14, fontSize: 8, color: MUTED, lineHeight: 1.4 },
  signRow: { marginTop: 24, flexDirection: 'row', justifyContent: 'space-between' },
  signBox: { width: '45%' },
  signLine: { marginTop: 36, borderBottomWidth: 1, borderBottomColor: NAVY, height: 1 },
  signHint: { marginTop: 4, fontSize: 8, color: MUTED },
  footer: {
    position: 'absolute',
    bottom: 24,
    left: 36,
    right: 36,
    fontSize: 7,
    color: '#94a3b8',
    textAlign: 'center',
  },
})

function SelectOptions({ field, value }: { field: SicTemplateField; value?: string }) {
  const v = (value ?? '').trim().toLowerCase()
  const options = field.options ?? []
  return (
    <View style={s.optionsRow}>
      {options.map(o => {
        const checked = v === o.value.toLowerCase() || v === o.label.toLowerCase()
        return (
          <Text key={o.value} style={s.option}>
            {checked ? '☑' : '☐'} {o.label}
          </Text>
        )
      })}
    </View>
  )
}

function YesNoValue({ value }: { value?: string }) {
  const v = (value ?? '').trim().toLowerCase()
  return (
    <View style={s.optionsRow}>
      <Text style={s.option}>{v === 'ja' || v === 'yes' ? '☑' : '☐'} Ja</Text>
      <Text style={s.option}>{v === 'nein' || v === 'no' ? '☑' : '☐'} Nein</Text>
    </View>
  )
}

function FormField({ field, value }: { field: SicTemplateField; value?: string }) {
  const filled = (value ?? '').trim()

  return (
    <View style={s.row} wrap={false}>
      <Text style={s.label}>
        {field.label}
        {field.required ? ' *' : ''}
      </Text>
      {field.kind === 'yesno' ?
        <YesNoValue value={value} />
      : field.kind === 'select' ?
        <SelectOptions field={field} value={value} />
      : filled ?
        <Text style={s.filled}>{filled}</Text>
      : field.kind === 'textarea' ?
        <View style={s.blankArea} />
      : <View style={s.blankLine} />
      }
    </View>
  )
}

export function SicTemplatePdfDocument(props: {
  template: SicTemplateDefinition
  values: SicTemplateValues
}) {
  const { template, values } = props
  const tenantFields = template.fields.filter(f => f.section === 'tenant')
  // Unterschrifts-Meta kommt ins Signatur-Block unten, nicht als 3× leere Felder
  const signKeys = new Set(['placeDate', 'signatoryName', 'signatoryRole'])
  const thirdFields = template.fields.filter(
    f => f.section === 'third_party' && !signKeys.has(f.key)
  )

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
          <FormField key={f.key} field={f} value={values[f.key]} />
        ))}

        <Text style={s.section}>
          Vom {template.thirdPartyLabel} handschriftlich auszufüllen
        </Text>
        {thirdFields.map(f => (
          <FormField key={f.key} field={f} value={values[f.key]} />
        ))}

        <View style={s.signRow}>
          <View style={s.signBox}>
            <Text style={s.label}>Name / Funktion der unterzeichnenden Person</Text>
            <View style={s.blankLine} />
            <View style={[s.signLine, { marginTop: 28 }]} />
            <Text style={s.signHint}>Unterschrift {template.thirdPartyLabel}</Text>
          </View>
          <View style={s.signBox}>
            <Text style={s.label}>Ort und Datum</Text>
            <View style={s.blankLine} />
            <View style={[s.signLine, { marginTop: 28 }]} />
            <Text style={s.signHint}>Stempel (falls vorhanden)</Text>
          </View>
        </View>

        <Text style={s.note}>
          Bitte dieses Formular handschriftlich ausfüllen und unterschreiben. Das unterschriebene Dokument
          (PDF-Scan oder Foto) dient als Nachweis für Swiss Immo Cert und wird unter «Mein Zertifikat»
          hochgeladen. Unvollständige Angaben können zu einer Rückfrage führen.
        </Text>

        <Text style={s.footer}>
          Swiss Immo Cert · schweizerisches Mieter-Zertifikat · swissimmocert.ch / wohnen.helvenda.ch
        </Text>
      </Page>
    </Document>
  )
}
