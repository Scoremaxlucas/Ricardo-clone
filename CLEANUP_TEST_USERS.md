# Test-User Cleanup - Schnelle Anleitung

## ⚡ Ein-Klick Cleanup (Kopiere und füge in Browser-Konsole ein)

1. Gehe zu **https://www.helvenda.ch** und logge dich als **Admin** ein
2. Öffne die **Browser-Konsole** (F12 → Console Tab)
3. **Kopiere den gesamten Code unten** und füge ihn ein, dann drücke Enter:

```javascript
fetch('/api/admin/users/cleanup-test-users').then(r=>r.json()).then(d=>{const n=d.stats.nonAdminUsers;if(n===0){alert('✅ Keine Test-User gefunden!');return;}if(confirm(`⚠️ WARNUNG: Dies löscht ${n} Nicht-Admin-User und ALLE deren Daten!\n\nDiese Aktion ist irreversibel!\n\nMöchtest du wirklich fortfahren?`)){fetch('/api/admin/users/cleanup-test-users',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({confirm:true})}).then(r=>r.json()).then(r=>{alert(`✅ Cleanup abgeschlossen!\n\n${r.stats.deletedUsers} User gelöscht\n${r.stats.deletedWatches} Watches gelöscht\n${r.stats.deletedBids} Bids gelöscht\n\nDie Plattform ist jetzt bereit für den Launch!`);console.log('Cleanup Ergebnis:',r);}).catch(e=>alert('❌ Fehler: '+e.message));}}).catch(e=>alert('❌ Fehler: '+e.message));
```

## 📋 Was passiert:

- ✅ Zeigt zuerst Statistiken (wie viele User gelöscht werden)
- ✅ Fragt nach Bestätigung
- ✅ Löscht alle Nicht-Admin-User und deren Daten
- ✅ Admin-User bleiben erhalten
- ✅ Gibt detaillierte Statistiken zurück

## ⚠️ WICHTIG:

- Diese Aktion ist **irreversibel**
- Nur Admin-User bleiben erhalten
- Alle Test-Daten werden gelöscht
- Die Plattform ist danach bereit für den Launch
