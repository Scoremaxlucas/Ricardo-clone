import { SIC_REVIEW_SLA } from '@/lib/sic/config'
import type { SicDossierView } from '@/lib/sic/dossier'
import { SIC_SEAL_MODULE_IDS, type SicModuleId } from '@/lib/sic/modules'

export type SicNextStep = {
  title: string
  detail: string
  /** Anker auf der Workspace-Seite, z. B. `#modul-BONITAET`. */
  anchor: string | null
  kind: 'action' | 'wait' | 'done'
}

function pickModule(
  modules: SicDossierView['purchasedModules'],
  status: SicDossierView['purchasedModules'][number]['status'],
  preferSeal: boolean
) {
  const matches = modules.filter(m => m.status === status)
  if (matches.length === 0) return null
  if (!preferSeal) return matches[0]
  const seal = matches.find(m => (SIC_SEAL_MODULE_IDS as readonly SicModuleId[]).includes(m.moduleKind))
  return seal ?? matches[0]
}

/**
 * Ein klarer nächster Schritt für den Workspace — Priorität: Name → Nachreichen →
 * Siegel-Unterlagen → sonstige Uploads → Warten → PDF / fertig.
 */
export function sicNextStep(dossier: SicDossierView): SicNextStep | null {
  if (dossier.status === 'REVOKED') {
    return {
      title: 'Zertifikat widerrufen',
      detail: 'Dieses Zertifikat ist nicht mehr gültig. Für eine neue Bewerbung legst du ein neues an.',
      anchor: null,
      kind: 'done',
    }
  }

  if (dossier.expired && dossier.renewal.available) {
    return {
      title: 'Zertifikat verlängern',
      detail: 'Die Gültigkeit ist abgelaufen. Mit einem frischen Betreibungsauszug kannst du verlängern.',
      anchor: '#verlaengern',
      kind: 'action',
    }
  }

  if (!dossier.holderName) {
    return {
      title: 'Name auf dem Zertifikat speichern',
      detail: dossier.couple
        ? 'Beide Namen erscheinen auf dem Dokument — ohne sie gibt es kein PDF.'
        : 'Ohne Namen können wir kein PDF erstellen.',
      anchor: '#sic-name',
      kind: 'action',
    }
  }

  const rejected = pickModule(dossier.purchasedModules, 'REJECTED', true)
  if (rejected) {
    return {
      title: `«${rejected.title}» nachreichen`,
      detail: rejected.reviewNote?.trim() || 'Bitte neue Unterlagen hochladen — ohne Zusatzkosten.',
      anchor: `#modul-${rejected.moduleKind}`,
      kind: 'action',
    }
  }

  const pendingSeal = pickModule(dossier.purchasedModules, 'PENDING_DOCS', true)
  if (pendingSeal) {
    const forSeal = (SIC_SEAL_MODULE_IDS as readonly SicModuleId[]).includes(pendingSeal.moduleKind)
    return {
      title: `«${pendingSeal.title}» hochladen`,
      detail: forSeal
        ? 'Für das Mieter-Zertifikat mit Siegel brauchst du diese Angabe.'
        : 'Lade die Unterlagen hoch — danach prüfen wir sie.',
      anchor: `#modul-${pendingSeal.moduleKind}`,
      kind: 'action',
    }
  }

  const inReview = pickModule(dossier.purchasedModules, 'IN_REVIEW', true)
  if (inReview) {
    return {
      title: 'Wir prüfen deine Unterlagen',
      detail: `«${inReview.title}» ist bei uns — ${SIC_REVIEW_SLA}. Du bekommst eine E-Mail, sobald es durch ist.`,
      anchor: `#modul-${inReview.moduleKind}`,
      kind: 'wait',
    }
  }

  if (dossier.certificateSealReady && dossier.landlordPdfReady) {
    return {
      title: 'Dein Mieter-Zertifikat ist bereit',
      detail: 'Mit Siegel und QR — lade das PDF herunter und leg es der nächsten Bewerbung bei.',
      anchor: '#sic-pdf',
      kind: 'done',
    }
  }

  if (dossier.landlordPdfReady && !dossier.certificateSealReady) {
    return {
      title: 'Prüfstand als PDF nutzen',
      detail: 'Das Siegel folgt, sobald Betreibungsauszug und Ausweis geprüft sind. Bis dahin kannst du den Stand schon beilegen.',
      anchor: '#sic-pdf',
      kind: 'done',
    }
  }

  if (dossier.availableModules.length > 0) {
    return {
      title: 'Fehlende Angaben ergänzen',
      detail: 'Beim Anlegen gehören alle vier dazu — was noch fehlt, kannst du hier nachkaufen.',
      anchor: '#erganzen',
      kind: 'action',
    }
  }

  return null
}
