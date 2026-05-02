/**
 * Kurze EN/FR/IT-Hinweise für transaktionale E-Mails (CH-Vierfeldrigkeit).
 */

export type TransactionalNoticeKind = 'marketplace' | 'wohnungen'

export type TransactionalNoticeSurface = 'light' | 'dark'

const WO_BODY = `<p style="margin:0 0 6px 0;"><strong>English:</strong> Automated message from Helvenda Wohnungen (Swiss rentals). For support, use the contact or help section on the website.</p>
<p style="margin:0 0 6px 0;"><strong>Français :</strong> Message automatique de Helvenda Wohnungen (locations en Suisse). Pour l'assistance, utilisez le formulaire de contact ou l'aide sur le site.</p>
<p style="margin:0;"><strong>Italiano:</strong> Messaggio automatico da Helvenda Wohnungen (affitti in Svizzera). Per assistenza, usa il contatto o la sezione aiuto sul sito.</p>`

const MP_BODY = `<p style="margin:0 0 6px 0;"><strong>English:</strong> Automated message from Helvenda.ch (Swiss marketplace). For support, use the contact options on the website.</p>
<p style="margin:0 0 6px 0;"><strong>Français :</strong> Message automatique de Helvenda.ch (place de marché suisse). Pour l'assistance, utilisez les contacts prévus sur le site.</p>
<p style="margin:0;"><strong>Italiano:</strong> Messaggio automatico da Helvenda.ch (marketplace svizzero). Per assistenza, usa i contatti indicati sul sito.</p>`

/** HTML-Block für E-Mail-Footer (Helvenda Marktplatz oder Wohnungen). */
export function multilingualTransactionalNoticeHtml(
  kind: TransactionalNoticeKind,
  surface: TransactionalNoticeSurface = 'light'
): string {
  const body = kind === 'wohnungen' ? WO_BODY : MP_BODY
  const wrap =
    surface === 'dark' ?
      'margin:16px auto 0;padding-top:16px;border-top:1px solid #374151;font-size:11px;line-height:1.55;color:#9ca3af;text-align:left;max-width:520px;'
    : 'margin:16px 0 0;padding-top:14px;border-top:1px solid #e5e7eb;font-size:11px;line-height:1.55;color:#6b7280;text-align:left;'
  return `<div style="${wrap}">${body}</div>`
}

/** Klartext-Zusatz für multipart/alternative oder einfache Text-Mails. */
export function multilingualTransactionalNoticePlaintext(kind: TransactionalNoticeKind): string {
  if (kind === 'wohnungen') {
    return [
      '',
      '---',
      'EN: Automated message from Helvenda Wohnungen (Swiss rentals). For support, use contact or help on the website.',
      "FR: Message automatique de Helvenda Wohnungen (locations en Suisse). Assistance : contact ou aide sur le site.",
      'IT: Messaggio automatico da Helvenda Wohnungen (affitti in Svizzera). Assistenza: contatto o aiuto sul sito.',
    ].join('\n')
  }
  return [
    '',
    '---',
    'EN: Automated message from Helvenda.ch (Swiss marketplace). For support, use the website.',
    'FR: Message automatique de Helvenda.ch (place de marché suisse). Assistance : site web.',
    'IT: Messaggio automatico da Helvenda.ch (marketplace svizzero). Assistenza: sito web.',
  ].join('\n')
}
