import type { SicTemplateDefinition, SicTemplateField, SicTemplateValues } from '@/lib/sic/templates'
import { Document, Page, StyleSheet, Text, View } from '@react-pdf/renderer'

/**
 * Nachweisformular — klares Schweizer Geschäftsschreiben.
 * Felder: ausgefüllt als Text; leer als Eingabelinie (digital z. B. Adobe oder Ausdruck).
 */

const NAVY = '#0f2b5e'
const GOLD = '#b8912f'
const RED = '#c8102e'
const INK = '#1a1a1a'
const MUTED = '#5c5c5c'
const RULE = '#c8c8c8'

const s = StyleSheet.create({
  page: {
    paddingTop: 40,
    paddingBottom: 48,
    paddingHorizontal: 48,
    fontFamily: 'Helvetica',
    fontSize: 9.5,
    color: INK,
    lineHeight: 1.35,
  },

  /* Kopf */
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 12,
    borderBottomWidth: 1.25,
    borderBottomColor: NAVY,
  },
  brandCol: { flexDirection: 'row', alignItems: 'center' },
  crest: {
    width: 22,
    height: 22,
    backgroundColor: RED,
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  crestV: { position: 'absolute', width: 4, height: 14, backgroundColor: '#fff' },
  crestH: { position: 'absolute', width: 14, height: 4, backgroundColor: '#fff' },
  brand: {
    fontFamily: 'Times-Bold',
    fontSize: 13,
    color: NAVY,
    letterSpacing: 1.2,
  },
  brandSub: {
    marginTop: 1,
    fontSize: 7,
    color: GOLD,
    letterSpacing: 1.6,
    fontFamily: 'Helvetica-Bold',
  },
  docType: {
    fontSize: 8,
    color: MUTED,
    textAlign: 'right',
    maxWidth: 140,
  },

  title: {
    marginTop: 18,
    fontFamily: 'Times-Bold',
    fontSize: 16,
    color: NAVY,
  },
  subtitle: {
    marginTop: 4,
    fontSize: 9,
    color: MUTED,
  },

  /* Abschnitte */
  sectionHead: {
    marginTop: 18,
    marginBottom: 6,
    paddingBottom: 3,
    borderBottomWidth: 0.75,
    borderBottomColor: GOLD,
    fontFamily: 'Helvetica-Bold',
    fontSize: 8.5,
    color: NAVY,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },

  /* Formularzeilen — tabellarisch */
  field: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    minHeight: 22,
    paddingVertical: 5,
    borderBottomWidth: 0.5,
    borderBottomColor: RULE,
  },
  fieldTall: {
    flexDirection: 'column',
    alignItems: 'stretch',
    paddingVertical: 6,
    borderBottomWidth: 0.5,
    borderBottomColor: RULE,
  },
  label: {
    width: '38%',
    fontSize: 8,
    color: MUTED,
    paddingRight: 8,
    paddingBottom: 1,
  },
  labelFull: {
    fontSize: 8,
    color: MUTED,
    marginBottom: 4,
  },
  value: {
    flex: 1,
    fontSize: 10,
    color: INK,
    fontFamily: 'Helvetica',
  },
  emptyLine: {
    flex: 1,
    borderBottomWidth: 0.75,
    borderBottomColor: '#8a8a8a',
    height: 14,
    marginBottom: 1,
  },
  emptyArea: {
    height: 40,
    borderWidth: 0.75,
    borderColor: '#8a8a8a',
    marginTop: 2,
  },

  /* Optionen */
  optionsRow: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 14,
    marginBottom: 2,
  },
  box: {
    width: 9,
    height: 9,
    borderWidth: 0.9,
    borderColor: INK,
    marginRight: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxOn: {
    width: 5,
    height: 5,
    backgroundColor: NAVY,
  },
  optionLabel: {
    fontSize: 9,
    color: INK,
  },

  /* Unterschrift */
  signBlock: {
    marginTop: 22,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  signCol: { width: '46%' },
  signLabel: { fontSize: 8, color: MUTED, marginBottom: 6 },
  signSpace: {
    height: 36,
    borderBottomWidth: 0.75,
    borderBottomColor: NAVY,
  },
  signCaption: { marginTop: 4, fontSize: 7.5, color: MUTED },

  note: {
    marginTop: 16,
    fontSize: 7.5,
    color: MUTED,
    lineHeight: 1.45,
  },
  footer: {
    position: 'absolute',
    bottom: 28,
    left: 48,
    right: 48,
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 7,
    color: '#9a9a9a',
    borderTopWidth: 0.5,
    borderTopColor: RULE,
    paddingTop: 8,
  },
})

function CheckOption({ label, checked }: { label: string; checked: boolean }) {
  return (
    <View style={s.option}>
      <View style={s.box}>{checked ? <View style={s.boxOn} /> : null}</View>
      <Text style={s.optionLabel}>{label}</Text>
    </View>
  )
}

function SelectOptions({ field, value }: { field: SicTemplateField; value?: string }) {
  const v = (value ?? '').trim().toLowerCase()
  return (
    <View style={s.optionsRow}>
      {(field.options ?? []).map(o => {
        const checked = v === o.value.toLowerCase() || v === o.label.toLowerCase()
        return <CheckOption key={o.value} label={o.label} checked={checked} />
      })}
    </View>
  )
}

function YesNoValue({ value }: { value?: string }) {
  const v = (value ?? '').trim().toLowerCase()
  return (
    <View style={s.optionsRow}>
      <CheckOption label="Ja" checked={v === 'ja' || v === 'yes'} />
      <CheckOption label="Nein" checked={v === 'nein' || v === 'no'} />
    </View>
  )
}

function FormField({ field, value }: { field: SicTemplateField; value?: string }) {
  const filled = (value ?? '').trim()
  const isArea = field.kind === 'textarea'
  const label = `${field.label}${field.required ? ' *' : ''}`

  if (isArea) {
    return (
      <View style={s.fieldTall} wrap={false}>
        <Text style={s.labelFull}>{label}</Text>
        {filled ? <Text style={s.value}>{filled}</Text> : <View style={s.emptyArea} />}
      </View>
    )
  }

  return (
    <View style={s.field} wrap={false}>
      <Text style={s.label}>{label}</Text>
      {field.kind === 'yesno' ?
        <YesNoValue value={value} />
      : field.kind === 'select' ?
        <SelectOptions field={field} value={value} />
      : filled ?
        <Text style={s.value}>{filled}</Text>
      : <View style={s.emptyLine} />
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
  const signKeys = new Set(['placeDate', 'signatoryName', 'signatoryRole'])
  const thirdFields = template.fields.filter(
    f => f.section === 'third_party' && !signKeys.has(f.key)
  )

  return (
    <Document title={`SIC — ${template.title}`}>
      <Page size="A4" style={s.page}>
        <View style={s.header}>
          <View style={s.brandCol}>
            <View style={s.crest}>
              <View style={s.crestV} />
              <View style={s.crestH} />
            </View>
            <View>
              <Text style={s.brand}>SWISS IMMO CERT</Text>
              <Text style={s.brandSub}>MIETER-ZERTIFIKAT</Text>
            </View>
          </View>
          <Text style={s.docType}>Nachweisformular{'\n'}zum Ausfüllen und Unterzeichnen</Text>
        </View>

        <Text style={s.title}>{template.title}</Text>
        <Text style={s.subtitle}>{template.subtitle}</Text>

        <Text style={s.sectionHead}>Angaben der mietsuchenden Person</Text>
        {tenantFields.map(f => (
          <FormField key={f.key} field={f} value={values[f.key]} />
        ))}

        <Text style={s.sectionHead}>Angaben des {template.thirdPartyLabel}s</Text>
        {thirdFields.map(f => (
          <FormField key={f.key} field={f} value={values[f.key]} />
        ))}

        <View style={s.signBlock}>
          <View style={s.signCol}>
            <Text style={s.signLabel}>Name und Funktion der unterzeichnenden Person</Text>
            <View style={s.signSpace} />
            <Text style={s.signCaption}>Unterschrift {template.thirdPartyLabel}</Text>
          </View>
          <View style={s.signCol}>
            <Text style={s.signLabel}>Ort und Datum</Text>
            <View style={s.signSpace} />
            <Text style={s.signCaption}>Stempel (falls vorhanden)</Text>
          </View>
        </View>

        <Text style={s.note}>
          Bitte vollständig ausfüllen und unterzeichnen — digital (z. B. Adobe Acrobat) oder ausgedruckt.
          Das unterzeichnete Dokument (PDF oder Scan) als Nachweis unter «Mein Zertifikat» bei Swiss Immo
          Cert hochladen. Unvollständige Angaben können zu einer Rückfrage führen. Pflichtfelder sind mit *
          gekennzeichnet.
        </Text>

        <View style={s.footer} fixed>
          <Text>Swiss Immo Cert</Text>
          <Text>schweizerisches Mieter-Zertifikat</Text>
        </View>
      </Page>
    </Document>
  )
}
