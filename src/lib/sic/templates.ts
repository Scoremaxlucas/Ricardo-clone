import type { SicModuleId } from '@/lib/sic/modules'

/**
 * SIC-Nachweis-Formulare (PDF): Vom Mieter optional vorausgefüllt (Name/Adresse),
 * vom Dritten (Arbeitgeber / Vermieter) handschriftlich ausgefüllt und unterschrieben —
 * danach Upload im Dossier.
 */

export type SicTemplateId = 'employer_confirmation' | 'landlord_reference'

export type SicTemplateFieldKind = 'text' | 'textarea' | 'date' | 'number' | 'select' | 'yesno'

export type SicTemplateField = {
  key: string
  label: string
  kind: SicTemplateFieldKind
  /** Abschnitt: Mieter vs. Dritter */
  section: 'tenant' | 'third_party'
  required?: boolean
  placeholder?: string
  options?: { value: string; label: string }[]
  /** Prefill aus dem Zertifikatshinweis-Namen */
  prefillFromHolder?: boolean
}

export type SicTemplateDefinition = {
  id: SicTemplateId
  moduleKind: SicModuleId
  title: string
  subtitle: string
  thirdPartyLabel: string
  howTo: string[]
  fields: SicTemplateField[]
}

export const SIC_TEMPLATES: readonly SicTemplateDefinition[] = [
  {
    id: 'employer_confirmation',
    moduleKind: 'ARBEIT_EINKOMMEN',
    title: 'Arbeitgeberbestätigung',
    subtitle: 'Bestätigung zu Anstellung, Pensum und Einkommen',
    thirdPartyLabel: 'Arbeitgeber',
    howTo: [
      'Optional: Name vorausfüllen, dann PDF-Formular herunterladen.',
      'Formular dem Arbeitgeber geben — er füllt es handschriftlich aus und unterschreibt.',
      'Unterschriebenes Dokument (Scan/Foto) im Modul hochladen.',
    ],
    fields: [
      {
        key: 'employeeName',
        label: 'Name der/des Arbeitnehmer:in',
        kind: 'text',
        section: 'tenant',
        required: true,
        prefillFromHolder: true,
      },
      {
        key: 'employeeAddress',
        label: 'Wohnadresse',
        kind: 'text',
        section: 'tenant',
        placeholder: 'Strasse, PLZ Ort',
      },
      {
        key: 'employerName',
        label: 'Arbeitgeber (Firma / Name)',
        kind: 'text',
        section: 'third_party',
        required: true,
        placeholder: 'Muster AG',
      },
      {
        key: 'employerAddress',
        label: 'Arbeitgeber-Adresse',
        kind: 'text',
        section: 'third_party',
        placeholder: 'Strasse, PLZ Ort',
      },
      {
        key: 'employerContact',
        label: 'Kontaktperson / Telefon / E-Mail',
        kind: 'text',
        section: 'third_party',
        placeholder: 'Max Muster, +41 …, hr@firma.ch',
      },
      {
        key: 'position',
        label: 'Funktion / Stelle',
        kind: 'text',
        section: 'third_party',
        required: true,
      },
      {
        key: 'employmentType',
        label: 'Anstellungsart',
        kind: 'select',
        section: 'third_party',
        required: true,
        options: [
          { value: 'unbefristet', label: 'Unbefristet' },
          { value: 'befristet', label: 'Befristet' },
          { value: 'probezeit', label: 'Probezeit' },
          { value: 'sonstiges', label: 'Sonstiges' },
        ],
      },
      {
        key: 'startDate',
        label: 'Anstellungsbeginn',
        kind: 'date',
        section: 'third_party',
        required: true,
      },
      {
        key: 'workloadPercent',
        label: 'Pensum (%)',
        kind: 'number',
        section: 'third_party',
        required: true,
        placeholder: '100',
      },
      {
        key: 'grossAnnualSalary',
        label: 'Bruttojahreslohn (CHF)',
        kind: 'number',
        section: 'third_party',
        required: true,
        placeholder: '90000',
      },
      {
        key: 'noticeGiven',
        label: 'Wurde gekündigt / ist eine Kündigung ausgesprochen?',
        kind: 'yesno',
        section: 'third_party',
        required: true,
      },
      {
        key: 'employerNotes',
        label: 'Zusätzliche Bemerkungen des Arbeitgebers',
        kind: 'textarea',
        section: 'third_party',
        placeholder: 'Optional',
      },
      {
        key: 'placeDate',
        label: 'Ort und Datum der Unterschrift',
        kind: 'text',
        section: 'third_party',
        placeholder: 'Zürich, 02.08.2026',
      },
      {
        key: 'signatoryName',
        label: 'Name der unterzeichnenden Person',
        kind: 'text',
        section: 'third_party',
      },
      {
        key: 'signatoryRole',
        label: 'Funktion der unterzeichnenden Person',
        kind: 'text',
        section: 'third_party',
        placeholder: 'z. B. HR / Geschäftsleitung',
      },
    ],
  },
  {
    id: 'landlord_reference',
    moduleKind: 'ZUVERLAESSIGKEIT',
    title: 'Vermieter-Referenz',
    subtitle: 'Referenz zum Mietverhältnis und zur Zahlungsmoral',
    thirdPartyLabel: 'Vermieter',
    howTo: [
      'Optional: Name und Mietobjekt vorausfüllen, dann PDF-Formular herunterladen.',
      'Formular dem Vermieter geben — er füllt es handschriftlich aus und unterschreibt.',
      'Unterschriebenes Dokument (Scan/Foto) im Modul hochladen.',
    ],
    fields: [
      {
        key: 'tenantName',
        label: 'Name der/des Mieter:in',
        kind: 'text',
        section: 'tenant',
        required: true,
        prefillFromHolder: true,
      },
      {
        key: 'propertyAddress',
        label: 'Adresse des Mietobjekts',
        kind: 'text',
        section: 'tenant',
        required: true,
        placeholder: 'Strasse Nr., PLZ Ort',
      },
      {
        key: 'tenancyFrom',
        label: 'Mietbeginn',
        kind: 'date',
        section: 'tenant',
        required: true,
      },
      {
        key: 'tenancyTo',
        label: 'Mietende (leer = aktuell)',
        kind: 'date',
        section: 'tenant',
      },
      {
        key: 'monthlyRent',
        label: 'Monatsmiete inkl. NK (CHF)',
        kind: 'number',
        section: 'tenant',
        placeholder: '1850',
      },
      {
        key: 'landlordName',
        label: 'Vermieter / Verwaltung',
        kind: 'text',
        section: 'third_party',
        required: true,
      },
      {
        key: 'landlordContact',
        label: 'Kontakt (Telefon / E-Mail)',
        kind: 'text',
        section: 'third_party',
        placeholder: '+41 … / vermietung@…',
      },
      {
        key: 'rentOnTime',
        label: 'Wurde die Miete stets fristgerecht bezahlt?',
        kind: 'yesno',
        section: 'third_party',
        required: true,
      },
      {
        key: 'damages',
        label: 'Gab es nennenswerte Schäden / Beanstandungen?',
        kind: 'yesno',
        section: 'third_party',
        required: true,
      },
      {
        key: 'wouldReRent',
        label: 'Würden Sie erneut an diese Person vermieten?',
        kind: 'yesno',
        section: 'third_party',
        required: true,
      },
      {
        key: 'landlordNotes',
        label: 'Bemerkungen des Vermieters',
        kind: 'textarea',
        section: 'third_party',
        placeholder: 'Optional',
      },
      {
        key: 'placeDate',
        label: 'Ort und Datum der Unterschrift',
        kind: 'text',
        section: 'third_party',
        placeholder: 'Bern, 02.08.2026',
      },
      {
        key: 'signatoryName',
        label: 'Name der unterzeichnenden Person',
        kind: 'text',
        section: 'third_party',
      },
      {
        key: 'signatoryRole',
        label: 'Funktion',
        kind: 'text',
        section: 'third_party',
        placeholder: 'z. B. Vermieter / Hausverwaltung',
      },
    ],
  },
] as const

const BY_ID = Object.fromEntries(SIC_TEMPLATES.map(t => [t.id, t])) as Record<
  SicTemplateId,
  SicTemplateDefinition
>

export function isSicTemplateId(v: unknown): v is SicTemplateId {
  return typeof v === 'string' && v in BY_ID
}

export function getSicTemplate(id: SicTemplateId): SicTemplateDefinition {
  return BY_ID[id]
}

export function templatesForModule(moduleKind: SicModuleId): SicTemplateDefinition[] {
  return SIC_TEMPLATES.filter(t => t.moduleKind === moduleKind)
}

export type SicTemplateValues = Record<string, string>

export function emptyTemplateValues(template: SicTemplateDefinition, holderName?: string | null): SicTemplateValues {
  const values: SicTemplateValues = {}
  for (const f of template.fields) {
    values[f.key] = f.prefillFromHolder && holderName ? holderName : ''
  }
  return values
}
