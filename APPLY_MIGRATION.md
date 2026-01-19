# Migration anwenden - Einfache Anleitung

## Option 1: Browser-Konsole (Schnellste Methode)

1. Gehe zu **https://www.helvenda.ch** und logge dich als **Admin** ein
2. Öffne die **Browser-Konsole** (F12 oder Rechtsklick → "Untersuchen" → Console Tab)
3. Kopiere und füge diesen Code ein, dann drücke Enter:

```javascript
fetch('/api/admin/apply-migration', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' }
})
  .then(r => r.json())
  .then(data => {
    if(data.success) {
      alert('✅ Migration erfolgreich!\n\n' + data.results.join('\n'));
      console.log('✅ Migration Ergebnis:', data);
    } else {
      alert('❌ Fehler: ' + (data.error || data.message));
      console.error('❌ Migration Fehler:', data);
    }
  })
  .catch(err => {
    alert('❌ Fehler: ' + err.message);
    console.error('Fehler:', err);
  });
```

4. Du solltest eine Erfolgsmeldung sehen!

## Option 2: Bookmarklet (Einmal einrichten, dann immer nutzbar)

1. Erstelle ein neues Bookmark in deinem Browser
2. Name: "Apply Migration"
3. URL: Kopiere den Inhalt von `scripts/apply-migration-bookmarklet.js` (ohne `javascript:` am Anfang)
4. Gehe zu helvenda.ch, logge dich als Admin ein
5. Klicke auf das Bookmark

## Was passiert?

Die Migration fügt folgende Spalten zur `user_preferences` Tabelle hinzu:
- emailOnNewMessage
- emailOnNewBid
- emailOnNewOffer
- emailOnSaleCompleted
- emailOnOutbid
- emailOnAuctionEnding
- emailOnPurchase
- emailOnShipping
- emailOnSearchMatch
- emailOnFavoritePriceChange
- emailMarketing
- emailDigestFrequency

Nach der Migration sollten die Notification Preferences vollständig funktionieren!
