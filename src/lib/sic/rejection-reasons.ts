/** Vorformulierte Ablehnungsgründe für die Prüfoberfläche. */
export const SIC_REJECTION_REASONS: readonly string[] = [
  'Der Auszug vom Betreibungsamt ist älter als drei Monate. Bitte einen aktuellen Auszug nachreichen.',
  'Das Dokument ist unvollständig — es fehlen Seiten oder Angaben.',
  'Das Dokument ist nicht lesbar. Bitte einen klaren Scan oder ein scharfes Foto hochladen.',
  'Auf dem Formular fehlt die Unterschrift.',
  'Im Auszug sind offene Betreibungen vermerkt. Bezahlst du sie und lässt sie beim Betreibungsamt als bezahlt vermerken, reichst du einen neuen Auszug kostenlos nach. Bei höchstens 2 offenen Betreibungen unter CHF 1’000 kannst du im Dossier zustimmen, dass sie offen auf dem Zertifikat stehen.',
  'Im Auszug sind offene Betreibungen über der Grenze vermerkt (mehr als 2 oder zusammen ab CHF 1’000). Sobald sie erledigt sind, reichst du einen neuen Auszug kostenlos nach.',
  'Im Auszug sind Verlustscheine vermerkt. Damit können wir den Betreibungsauszug nicht freigeben.',
  'Der Ausweis ist abgelaufen. Bitte den gültigen Ausweis hochladen.',
  'Der Name auf dem Nachweis stimmt nicht mit dem Namen auf dem Zertifikat überein.',
  'Der Inhalt des Nachweises erfüllt die Voraussetzungen für eine Freigabe nicht.',
] as const
