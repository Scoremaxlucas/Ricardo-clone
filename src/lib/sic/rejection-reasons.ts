/** Vorformulierte Ablehnungsgründe für die Prüfoberfläche. */
export const SIC_REJECTION_REASONS: readonly string[] = [
  'Der Auszug vom Betreibungsamt ist älter als drei Monate. Bitte einen aktuellen Auszug nachreichen.',
  'Das Dokument ist unvollständig — es fehlen Seiten oder Angaben.',
  'Das Dokument ist nicht lesbar. Bitte einen klaren Scan oder ein scharfes Foto hochladen.',
  'Auf dem Formular fehlt die Unterschrift.',
  'Im Auszug sind offene Betreibungen oder Verlustscheine vermerkt. Sobald sie erledigt sind, kannst du einen neuen Auszug ohne Zusatzkosten nachreichen.',
  'Der Ausweis ist abgelaufen. Bitte den gültigen Ausweis hochladen.',
  'Der Name auf dem Nachweis stimmt nicht mit dem Namen auf dem Zertifikat überein.',
  'Der Inhalt des Nachweises erfüllt die Voraussetzungen für eine Freigabe nicht.',
] as const
