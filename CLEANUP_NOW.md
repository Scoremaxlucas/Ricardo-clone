# Cleanup jetzt ausführen

## Einfachste Methode (Browser-Konsole):

1. Gehe zu **helvenda.ch** und logge dich als Admin ein
2. Öffne die **Browser-Konsole** (F12 → Console)
3. Kopiere und füge diesen Befehl ein, dann drücke Enter:

```javascript
fetch('/api/admin/users/cleanup-simple', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ confirm: true })
})
  .then(r => r.json())
  .then(data => {
    console.log('✅ Ergebnis:', data);
    alert(data.message || 'Cleanup abgeschlossen!');
    location.reload();
  })
  .catch(e => {
    console.error('❌ Fehler:', e);
    alert('Fehler: ' + e.message);
  });
```

4. Bestätige die Alert-Box
5. Die Seite lädt automatisch neu und zeigt nur noch Admin-User

## Was passiert:

- ✅ Alle User außer dir werden gelöscht
- ✅ Alle abhängigen Daten werden automatisch gelöscht (Cascade)
- ✅ Du bleibst erhalten
- ✅ Keine Beschädigung der Datenbank

## Nach dem Cleanup:

Die Admin-Users-Seite zeigt nur noch Admin-User an.
