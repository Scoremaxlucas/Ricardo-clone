import {
  PDFDocument,
  PDFFont,
  PDFForm,
  PDFName,
  PDFBool,
  PDFPage,
  StandardFonts,
  rgb,
  type RGB,
} from 'pdf-lib'
import type { SicTemplateId, SicTemplateValues } from '@/lib/sic/templates'
import { SIC_BRAND_NAME } from '@/lib/sic/config'
import { A4, COLORS, COL, LAYOUT, MARGIN, TYPE } from './tokens'

type Ctx = {
  doc: PDFDocument
  page: PDFPage
  form: PDFForm
  font: PDFFont
  fontBold: PDFFont
  /** Top-down cursor: current Y of the next content top edge (PDF coords). */
  y: number
  tab: number
}

function c(rgbParts: { r: number; g: number; b: number }): RGB {
  return rgb(rgbParts.r, rgbParts.g, rgbParts.b)
}

function nextTab(ctx: Ctx): number {
  ctx.tab += 1
  return ctx.tab
}

function drawText(
  ctx: Ctx,
  text: string,
  x: number,
  yBaseline: number,
  size: number,
  color: RGB,
  bold = false
) {
  ctx.page.drawText(text, {
    x,
    y: yBaseline,
    size,
    font: bold ? ctx.fontBold : ctx.font,
    color,
  })
}

function drawLine(ctx: Ctx, x1: number, y1: number, x2: number, y2: number, color: RGB, thickness = 0.75) {
  ctx.page.drawLine({
    start: { x: x1, y: y1 },
    end: { x: x2, y: y2 },
    thickness,
    color,
  })
}

function drawRect(
  ctx: Ctx,
  x: number,
  y: number,
  w: number,
  h: number,
  border: RGB,
  fill?: RGB
) {
  ctx.page.drawRectangle({
    x,
    y,
    width: w,
    height: h,
    borderWidth: 1,
    borderColor: border,
    color: fill,
  })
}

/** Swiss cross mark in red square. */
function drawLogo(ctx: Ctx, x: number, yBottom: number, size: number) {
  drawRect(ctx, x, yBottom, size, size, c(COLORS.red), c(COLORS.red))
  const pad = size * 0.28
  const bar = size * 0.18
  // Vertical bar
  ctx.page.drawRectangle({
    x: x + size / 2 - bar / 2,
    y: yBottom + pad,
    width: bar,
    height: size - pad * 2,
    color: rgb(1, 1, 1),
    borderWidth: 0,
  })
  // Horizontal bar
  ctx.page.drawRectangle({
    x: x + pad,
    y: yBottom + size / 2 - bar / 2,
    width: size - pad * 2,
    height: bar,
    color: rgb(1, 1, 1),
    borderWidth: 0,
  })
}

function drawHeader(ctx: Ctx) {
  const top = A4.height - MARGIN.top
  const logoSize = 16
  const logoY = top - logoSize
  drawLogo(ctx, MARGIN.x, logoY, logoSize)

  drawText(ctx, SIC_BRAND_NAME, MARGIN.x + logoSize + 8, logoY + 8, TYPE.brand, c(COLORS.navy), true)
  drawText(
    ctx,
    'MIETER-ZERTIFIKAT',
    MARGIN.x + logoSize + 8,
    logoY + 1,
    TYPE.brandSub,
    c(COLORS.gold),
    true
  )

  const right = 'Nachweisformular · zum Ausfüllen und Unterzeichnen'
  const rightW = ctx.font.widthOfTextAtSize(right, TYPE.docMeta)
  drawText(ctx, right, A4.width - MARGIN.x - rightW, logoY + 5, TYPE.docMeta, c(COLORS.muted))

  const ruleY = logoY - 8
  drawLine(ctx, MARGIN.x, ruleY, A4.width - MARGIN.x, ruleY, c(COLORS.navy), 1.25)
  ctx.y = ruleY - 8
}

function drawTitle(ctx: Ctx, title: string, subtitle: string) {
  drawText(ctx, title, MARGIN.x, ctx.y - TYPE.docTitle * 0.85, TYPE.docTitle, c(COLORS.navy), true)
  ctx.y -= TYPE.docTitle + 2
  drawText(ctx, subtitle, MARGIN.x, ctx.y - TYPE.body * 0.8, TYPE.body, c(COLORS.muted))
  ctx.y -= TYPE.body + 6
}

function drawSection(ctx: Ctx, title: string) {
  ctx.y -= LAYOUT.sectionGapBefore
  const baseline = ctx.y - TYPE.section * 0.8
  drawText(ctx, title.toUpperCase(), MARGIN.x, baseline, TYPE.section, c(COLORS.navy), true)
  const ruleY = baseline - 4
  drawLine(ctx, MARGIN.x, ruleY, A4.width - MARGIN.x, ruleY, c(COLORS.gold), 0.7)
  ctx.y = ruleY - LAYOUT.sectionGapAfter
}

/**
 * Label above + box field. Returns the AcroForm field name.
 * Prefill sits inside the widget via setText — never floating above an underline.
 */
function drawTextField(
  ctx: Ctx,
  opts: {
    name: string
    label: string
    required?: boolean
    x: number
    width: number
    value?: string
    prefilled?: boolean
    multiline?: boolean
    height?: number
  }
) {
  const {
    name,
    label,
    required,
    x,
    width,
    value,
    prefilled,
    multiline,
    height = LAYOUT.fieldHeight,
  } = opts

  const labelText = `${label.toUpperCase()}${required ? ' *' : ''}`
  const labelBaseline = ctx.y - TYPE.label * 0.85
  drawText(ctx, labelText, x, labelBaseline, TYPE.label, c(COLORS.muted), true)

  if (prefilled && (value ?? '').trim()) {
    const hint = 'vorausgefüllt'
    const hintW = ctx.font.widthOfTextAtSize(hint, 6.5)
    drawText(ctx, hint, x + width - hintW, labelBaseline, 6.5, c(COLORS.hint))
  }

  const boxTop = labelBaseline - LAYOUT.labelGap
  const boxY = boxTop - height
  drawRect(ctx, x, boxY, width, height, c(COLORS.border), c(COLORS.fieldBg))

  const field = ctx.form.createTextField(name)
  if (multiline) field.enableMultiline()
  if ((value ?? '').trim()) field.setText(value!.trim())
  field.addToPage(ctx.page, {
    x: x + 4,
    y: boxY + 2,
    width: width - 8,
    height: height - 4,
    borderWidth: 0,
    backgroundColor: rgb(1, 1, 1),
    textColor: c(COLORS.ink),
    font: ctx.font,
  })
  try {
    field.setFontSize(TYPE.value)
  } catch {
    // Some pdf-lib versions require DA after widget; appearances updated at save
  }
  // Tab order via creation sequence
  void nextTab(ctx)

  return boxY
}

/** Advances cursor after a full-width or row of fields. */
function afterFieldRow(ctx: Ctx, boxY: number) {
  ctx.y = boxY - LAYOUT.fieldBlockGap
}

function drawChoiceGroup(
  ctx: Ctx,
  opts: {
    name: string
    label: string
    required?: boolean
    options: { value: string; label: string }[]
    selected?: string
  }
) {
  const { name, label, required, options, selected } = opts
  const labelText = `${label.toUpperCase()}${required ? ' *' : ''}`
  const labelBaseline = ctx.y - TYPE.label * 0.85
  drawText(ctx, labelText, MARGIN.x, labelBaseline, TYPE.label, c(COLORS.muted), true)

  const rowY = labelBaseline - LAYOUT.labelGap - LAYOUT.checkboxSize
  let x = MARGIN.x
  const selectedNorm = (selected ?? '').trim().toLowerCase()

  for (const opt of options) {
    const fieldName = `${name}__${opt.value}`
    const box = ctx.form.createCheckBox(fieldName)
    box.addToPage(ctx.page, {
      x,
      y: rowY,
      width: LAYOUT.checkboxSize,
      height: LAYOUT.checkboxSize,
      borderWidth: 1,
      borderColor: c(COLORS.border),
      backgroundColor: rgb(1, 1, 1),
      textColor: c(COLORS.navy),
    })
    const match =
      selectedNorm === opt.value.toLowerCase() || selectedNorm === opt.label.toLowerCase()
    if (match) box.check()
    void nextTab(ctx)

    const textX = x + LAYOUT.checkboxSize + LAYOUT.checkboxTextGap
    const textBaseline = rowY + LAYOUT.checkboxSize / 2 - TYPE.body * 0.35
    drawText(ctx, opt.label, textX, textBaseline, TYPE.body, c(COLORS.ink))
    const textW = ctx.font.widthOfTextAtSize(opt.label, TYPE.body)
    x = textX + textW + LAYOUT.optionGap
  }

  ctx.y = rowY - LAYOUT.fieldBlockGap
}

function drawSignatureBlock(
  ctx: Ctx,
  opts: {
    placeDateValue?: string
    placeDateName?: string
    leftCaption: string
    rightCaption: string
  }
) {
  ctx.y -= 4
  // Place/date — boxed field with label above (regular field pattern)
  const placeBottom = drawTextField(ctx, {
    name: opts.placeDateName ?? 'placeDate',
    label: 'Ort und Datum',
    x: MARGIN.x,
    width: COL.half,
    value: opts.placeDateValue,
  })

  // Signature pads — label BELOW (different pattern)
  const padTop = placeBottom - 6
  const padH = LAYOUT.signaturePadHeight
  const padY = padTop - padH
  const leftX = MARGIN.x
  const rightX = MARGIN.x + COL.half + LAYOUT.colGutter

  drawRect(ctx, leftX, padY, COL.half, padH, c(COLORS.border), c(COLORS.fieldBg))
  drawRect(ctx, rightX, padY, COL.half, padH, c(COLORS.border), c(COLORS.fieldBg))

  const captionY = padY - TYPE.label - 2
  drawText(ctx, opts.leftCaption.toUpperCase(), leftX, captionY, TYPE.label, c(COLORS.muted), true)
  drawText(ctx, opts.rightCaption.toUpperCase(), rightX, captionY, TYPE.label, c(COLORS.muted), true)

  ctx.y = captionY - 8
}

function drawFooter(ctx: Ctx) {
  const y = MARGIN.bottom - 2
  drawLine(ctx, MARGIN.x, MARGIN.bottom + 14, A4.width - MARGIN.x, MARGIN.bottom + 14, c(COLORS.rule), 0.5)

  const brand = `${SIC_BRAND_NAME} · Schweizer Mieter-Zertifikat`
  drawText(ctx, brand, MARGIN.x, y + 6, TYPE.footer, c(COLORS.muted))

  const legend = '* Pflichtfeld  ·  Ausgefüllt unterzeichnen und unter «Mein Zertifikat» hochladen'
  const legendW = ctx.font.widthOfTextAtSize(legend, TYPE.footer)
  drawText(ctx, legend, A4.width - MARGIN.x - legendW, y + 6, TYPE.footer, c(COLORS.muted))
}

async function createCtx(): Promise<Ctx> {
  const doc = await PDFDocument.create()
  const page = doc.addPage([A4.width, A4.height])
  const font = await doc.embedFont(StandardFonts.Helvetica)
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold)
  const form = doc.getForm()
  return {
    doc,
    page,
    form,
    font,
    fontBold,
    y: A4.height - MARGIN.top,
    tab: 0,
  }
}

function enableNeedAppearances(form: PDFForm) {
  form.acroForm.dict.set(PDFName.of('NeedAppearances'), PDFBool.True)
}

function v(values: SicTemplateValues, key: string): string {
  return (values[key] ?? '').trim()
}

/** Zwei Felder nebeneinander; Cursor startet auf derselben Zeile. */
function drawTwoCol(
  ctx: Ctx,
  left: Parameters<typeof drawTextField>[1],
  right: Parameters<typeof drawTextField>[1]
) {
  const startY = ctx.y
  const leftBottom = drawTextField(ctx, left)
  ctx.y = startY
  const rightBottom = drawTextField(ctx, right)
  afterFieldRow(ctx, Math.min(leftBottom, rightBottom))
}

function drawEmployerForm(ctx: Ctx, values: SicTemplateValues) {
  drawHeader(ctx)
  drawTitle(ctx, 'Arbeitgeberbestätigung', 'Bestätigung zu Anstellung, Pensum und Einkommen')

  drawSection(ctx, 'Angaben der mietsuchenden Person')
  {
    const bottom = drawTextField(ctx, {
      name: 'employeeName',
      label: 'Name der mietsuchenden Person',
      required: true,
      x: MARGIN.x,
      width: COL.full,
      value: v(values, 'employeeName'),
      prefilled: Boolean(v(values, 'employeeName')),
    })
    afterFieldRow(ctx, bottom)
  }
  {
    const bottom = drawTextField(ctx, {
      name: 'employeeAddress',
      label: 'Wohnadresse',
      x: MARGIN.x,
      width: COL.full,
      value: v(values, 'employeeAddress'),
    })
    afterFieldRow(ctx, bottom)
  }

  drawSection(ctx, 'Angaben des Arbeitgebers')
  {
    const bottom = drawTextField(ctx, {
      name: 'employerName',
      label: 'Arbeitgeber (Firma / Name)',
      required: true,
      x: MARGIN.x,
      width: COL.full,
      value: v(values, 'employerName'),
    })
    afterFieldRow(ctx, bottom)
  }
  {
    const bottom = drawTextField(ctx, {
      name: 'employerAddress',
      label: 'Arbeitgeber-Adresse',
      x: MARGIN.x,
      width: COL.full,
      value: v(values, 'employerAddress'),
    })
    afterFieldRow(ctx, bottom)
  }
  {
    const bottom = drawTextField(ctx, {
      name: 'employerContact',
      label: 'Kontaktperson / Telefon / E-Mail',
      x: MARGIN.x,
      width: COL.full,
      value: v(values, 'employerContact'),
    })
    afterFieldRow(ctx, bottom)
  }
  {
    const bottom = drawTextField(ctx, {
      name: 'position',
      label: 'Funktion / Stelle',
      required: true,
      x: MARGIN.x,
      width: COL.full,
      value: v(values, 'position'),
    })
    afterFieldRow(ctx, bottom)
  }

  drawTwoCol(
    ctx,
    {
      name: 'startDate',
      label: 'Anstellungsbeginn',
      required: true,
      x: MARGIN.x,
      width: COL.half,
      value: v(values, 'startDate'),
    },
    {
      name: 'workloadPercent',
      label: 'Pensum (%)',
      required: true,
      x: MARGIN.x + COL.half + LAYOUT.colGutter,
      width: COL.half,
      value: v(values, 'workloadPercent'),
    }
  )

  {
    const bottom = drawTextField(ctx, {
      name: 'grossAnnualSalary',
      label: 'Bruttojahreslohn (CHF)',
      required: true,
      x: MARGIN.x,
      width: COL.half,
      value: v(values, 'grossAnnualSalary'),
    })
    afterFieldRow(ctx, bottom)
  }

  drawChoiceGroup(ctx, {
    name: 'employmentType',
    label: 'Anstellungsart',
    required: true,
    options: [
      { value: 'unbefristet', label: 'Unbefristet' },
      { value: 'befristet', label: 'Befristet' },
      { value: 'probezeit', label: 'Probezeit' },
      { value: 'sonstiges', label: 'Sonstiges' },
    ],
    selected: v(values, 'employmentType'),
  })

  drawChoiceGroup(ctx, {
    name: 'noticeGiven',
    label: 'Wurde gekündigt / ist eine Kündigung ausgesprochen?',
    required: true,
    options: [
      { value: 'ja', label: 'Ja' },
      { value: 'nein', label: 'Nein' },
    ],
    selected: v(values, 'noticeGiven'),
  })

  {
    const bottom = drawTextField(ctx, {
      name: 'employerNotes',
      label: 'Zusätzliche Bemerkungen',
      x: MARGIN.x,
      width: COL.full,
      value: v(values, 'employerNotes'),
      multiline: true,
      height: LAYOUT.textareaHeight,
    })
    afterFieldRow(ctx, bottom)
  }

  drawTwoCol(
    ctx,
    {
      name: 'signatoryName',
      label: 'Name der unterzeichnenden Person',
      x: MARGIN.x,
      width: COL.half,
      value: v(values, 'signatoryName'),
    },
    {
      name: 'signatoryRole',
      label: 'Funktion der unterzeichnenden Person',
      x: MARGIN.x + COL.half + LAYOUT.colGutter,
      width: COL.half,
      value: v(values, 'signatoryRole'),
    }
  )

  drawSignatureBlock(ctx, {
    placeDateValue: v(values, 'placeDate'),
    leftCaption: 'Unterschrift & Funktion der unterzeichnenden Person',
    rightCaption: 'Stempel (falls vorhanden)',
  })

  drawFooter(ctx)
}

function drawLandlordForm(ctx: Ctx, values: SicTemplateValues) {
  drawHeader(ctx)
  drawTitle(ctx, 'Vermieter-Referenz', 'Referenz zum Mietverhältnis und zur Zahlungsmoral')

  drawSection(ctx, 'Angaben der mietsuchenden Person')
  {
    const bottom = drawTextField(ctx, {
      name: 'tenantName',
      label: 'Name der mietsuchenden Person',
      required: true,
      x: MARGIN.x,
      width: COL.full,
      value: v(values, 'tenantName'),
      prefilled: Boolean(v(values, 'tenantName')),
    })
    afterFieldRow(ctx, bottom)
  }
  {
    const bottom = drawTextField(ctx, {
      name: 'propertyAddress',
      label: 'Adresse des Mietobjekts',
      required: true,
      x: MARGIN.x,
      width: COL.full,
      value: v(values, 'propertyAddress'),
    })
    afterFieldRow(ctx, bottom)
  }

  drawTwoCol(
    ctx,
    {
      name: 'tenancyFrom',
      label: 'Mietbeginn',
      required: true,
      x: MARGIN.x,
      width: COL.half,
      value: v(values, 'tenancyFrom'),
    },
    {
      name: 'tenancyTo',
      label: 'Mietende (leer = aktuell)',
      x: MARGIN.x + COL.half + LAYOUT.colGutter,
      width: COL.half,
      value: v(values, 'tenancyTo'),
    }
  )

  {
    const bottom = drawTextField(ctx, {
      name: 'monthlyRent',
      label: 'Monatsmiete inkl. NK (CHF)',
      x: MARGIN.x,
      width: COL.half,
      value: v(values, 'monthlyRent'),
    })
    afterFieldRow(ctx, bottom)
  }

  drawSection(ctx, 'Angaben des Vermieters')
  {
    const bottom = drawTextField(ctx, {
      name: 'landlordName',
      label: 'Vermieter / Verwaltung',
      required: true,
      x: MARGIN.x,
      width: COL.full,
      value: v(values, 'landlordName'),
    })
    afterFieldRow(ctx, bottom)
  }
  {
    const bottom = drawTextField(ctx, {
      name: 'landlordContact',
      label: 'Kontakt (Telefon / E-Mail)',
      x: MARGIN.x,
      width: COL.full,
      value: v(values, 'landlordContact'),
    })
    afterFieldRow(ctx, bottom)
  }

  drawChoiceGroup(ctx, {
    name: 'rentOnTime',
    label: 'Wurde die Miete stets fristgerecht bezahlt?',
    required: true,
    options: [
      { value: 'ja', label: 'Ja' },
      { value: 'nein', label: 'Nein' },
    ],
    selected: v(values, 'rentOnTime'),
  })

  drawChoiceGroup(ctx, {
    name: 'damages',
    label: 'Gab es nennenswerte Schäden / Beanstandungen?',
    required: true,
    options: [
      { value: 'ja', label: 'Ja' },
      { value: 'nein', label: 'Nein' },
    ],
    selected: v(values, 'damages'),
  })

  drawChoiceGroup(ctx, {
    name: 'wouldReRent',
    label: 'Würden Sie erneut an diese Person vermieten?',
    required: true,
    options: [
      { value: 'ja', label: 'Ja' },
      { value: 'nein', label: 'Nein' },
    ],
    selected: v(values, 'wouldReRent'),
  })

  {
    const bottom = drawTextField(ctx, {
      name: 'landlordNotes',
      label: 'Bemerkungen des Vermieters',
      x: MARGIN.x,
      width: COL.full,
      value: v(values, 'landlordNotes'),
      multiline: true,
      height: LAYOUT.textareaHeight,
    })
    afterFieldRow(ctx, bottom)
  }

  drawTwoCol(
    ctx,
    {
      name: 'signatoryName',
      label: 'Name der unterzeichnenden Person',
      x: MARGIN.x,
      width: COL.half,
      value: v(values, 'signatoryName'),
    },
    {
      name: 'signatoryRole',
      label: 'Funktion',
      x: MARGIN.x + COL.half + LAYOUT.colGutter,
      width: COL.half,
      value: v(values, 'signatoryRole'),
    }
  )

  drawSignatureBlock(ctx, {
    placeDateValue: v(values, 'placeDate'),
    leftCaption: 'Unterschrift & Funktion der unterzeichnenden Person',
    rightCaption: 'Stempel (falls vorhanden)',
  })

  drawFooter(ctx)
}

/** Generate a fillable SIC Nachweisformular PDF (AcroForm). */
export async function renderSicTemplatePdf(
  templateId: SicTemplateId,
  values: SicTemplateValues = {}
): Promise<Uint8Array> {
  const ctx = await createCtx()

  if (templateId === 'employer_confirmation') drawEmployerForm(ctx, values)
  else if (templateId === 'landlord_reference') drawLandlordForm(ctx, values)
  else throw new Error(`Unbekanntes Formular: ${templateId}`)

  if (ctx.y < MARGIN.bottom + 20) {
    console.warn(`[sic/form-kit] Content may be tight: y=${ctx.y.toFixed(1)} for ${templateId}`)
  }

  enableNeedAppearances(ctx.form)
  // Update field appearances so Preview/Adobe show text immediately
  ctx.form.updateFieldAppearances(ctx.font)

  return ctx.doc.save({ updateFieldAppearances: true })
}
