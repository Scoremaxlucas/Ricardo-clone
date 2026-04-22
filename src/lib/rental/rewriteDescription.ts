import Anthropic from '@anthropic-ai/sdk'
import { anthropicListingModelCandidates } from '@/lib/rental/anthropic-model'

type RewriteContext = {
  title?: string
  rooms?: number
  areaSqm?: number
  city?: string
  canton?: string
  rentPerMonth?: number
  features?: string[]
  availableFrom?: string
}

function toNum(v: unknown): number | undefined {
  if (typeof v === 'number' && Number.isFinite(v)) return v
  if (typeof v === 'string') {
    const n = Number(v.replace(',', '.'))
    return Number.isFinite(n) ? n : undefined
  }
  return undefined
}

function toStr(v: unknown): string | undefined {
  if (typeof v !== 'string') return undefined
  const t = v.trim()
  return t || undefined
}

function isModelNotFound(error: unknown): boolean {
  const s = String(error)
  return s.includes('not_found_error') || (s.includes('404') && s.includes('model'))
}

export async function rewriteDescriptionInHelvendarVoice(
  originalDescription: string,
  listingData: RewriteContext
): Promise<string> {
  if (!originalDescription || originalDescription.trim().length < 10) {
    return originalDescription
  }

  const apiKey = process.env.ANTHROPIC_API_KEY?.trim()
  if (!apiKey) return originalDescription

  const anthropic = new Anthropic({ apiKey })

  const contextInfo = [
    listingData.rooms && `${listingData.rooms} Zimmer`,
    listingData.areaSqm && `${listingData.areaSqm} m²`,
    listingData.city && listingData.canton && `${listingData.city} (${listingData.canton})`,
    listingData.rentPerMonth && `CHF ${listingData.rentPerMonth}/Monat`,
    listingData.features?.length && `Ausstattung: ${listingData.features.join(', ')}`,
    listingData.availableFrom && `Verfügbar ab: ${listingData.availableFrom}`,
  ]
    .filter(Boolean)
    .join(' · ')

  const userPrompt = `Schreibe diese Wohnungsbeschreibung im Helvenda-Stil um.

Kontext der Wohnung: ${contextInfo}

Originalbeschreibung:
${originalDescription}

Wichtig:
- Behalte alle sachlichen Informationen (Lage, Ausstattung, Verfügbarkeit)
- Entferne Marketing-Floskeln und Übertreibungen
- Schreibe komplett neu in eigenen Worten — kein Copy-Paste aus dem Original
- Falls die Originalbeschreibung auf Englisch oder Französisch ist: schreibe die Helvenda-Version auf Deutsch
- Falls wichtige Infos fehlen: ergänze sie nicht — bleibe bei den vorhandenen Fakten`

  const systemPrompt = `Du schreibst Wohnungsinserate für Helvenda Wohnungen — den fairen Schweizer Mietmarkt.

Helvenda's Schreibstil:
- Klar, ehrlich und einladend — keine Marketing-Übertreibungen
- Warmherzig aber professionell — wie eine Empfehlung von einem Freund
- Konkret und informativ — jeder Satz hat einen Zweck
- Schweizer Deutsch-Sensibilität — korrekte Schreibweise (z.B. "Grünfläche" nicht "Grünanlage")
- Nie: Superlative ohne Substanz ("traumhaft", "einmalig", "exklusiv")
- Nie: Füllwörter ("selbstverständlich", "natürlich", "wunderschön")
- Immer: konkrete Details die wirklich nützlich sind
- Länge: 80-150 Wörter — prägnant, nicht zu kurz, nicht zu lang
- Sprache: Deutsch
- Perspektive: direkte Ansprache an den Mietenden ("du" Form)

Beispiel guter Helvenda-Beschreibung:
"Diese 3.5-Zimmer-Wohnung im zweiten Stock liegt ruhig an einer verkehrsarmen Strasse in Zürich-Wiedikon. Das Wohnzimmer ist grosszügig geschnitten und geht auf einen Balkon mit Blick in den Innenhof. Die Küche wurde 2022 renoviert und verfügt über eine Induktionskochfeld und Geschirrspüler. Zwei Zimmer eignen sich gut als Schlaf- und Arbeitszimmer. Der Bahnhof Wiedikon ist in 4 Gehminuten erreichbar. Kellerabteil und Waschmaschinenraum im Haus inklusive."

Antworte NUR mit der fertigen Beschreibung — kein Intro, keine Erklärung, keine Anführungszeichen.`

  const models = anthropicListingModelCandidates(process.env.ANTHROPIC_INGEST_MODEL)
  for (let i = 0; i < models.length; i++) {
    const model = models[i]
    try {
      const message = await anthropic.messages.create({
        model,
        max_tokens: 600,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      })

      const rewritten =
        message.content[0]?.type === 'text' ? message.content[0].text.trim() : originalDescription

      if (rewritten.length < 30) {
        console.warn('[INGEST] Rewrite too short, returning original')
        return originalDescription
      }
      return rewritten
    } catch (error) {
      if (isModelNotFound(error) && i < models.length - 1) {
        console.warn('[INGEST] Rewrite model unavailable:', model, '→ fallback:', models[i + 1])
        continue
      }
      throw error
    }
  }
  return originalDescription
}

export function rewriteContextFromUnknown(raw: Record<string, unknown>): RewriteContext {
  return {
    title: toStr(raw.title),
    rooms: toNum(raw.rooms),
    areaSqm: toNum(raw.areaSqm),
    city: toStr(raw.city),
    canton: toStr(raw.canton),
    rentPerMonth: toNum(raw.rentPerMonth),
    features: Array.isArray(raw.features) ? raw.features.filter((x): x is string => typeof x === 'string') : undefined,
    availableFrom: toStr(raw.availableFrom),
  }
}
