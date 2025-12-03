# Deployment Checklist - GOLDEN RULE

## ⚠️ KRITISCH: Daten-Schutz

**GOLDEN RULE: NIEMALS dürfen bestehende Artikel oder User durch Code-Änderungen verschwinden oder gelöscht werden.**

## Vor jedem Deployment:

### 1. Validierung aller Artikel
```bash
# Als Admin aufrufen:
GET /api/admin/validate-watches

# Erwartetes Ergebnis:
{
  "total": X,
  "visible": X,
  "hidden": 0,  // MUSS 0 sein!
  "status": "safe"
}
```

**Wenn `hidden > 0`: STOPPEN! Deployment nicht durchführen!**

### 2. Prüfe Filter-Logik Änderungen
- [ ] Alle Filter verwenden `{ moderationStatus: { not: 'rejected' } }` statt expliziter Listen
- [ ] Keine neuen Filter hinzugefügt, die bestehende Artikel ausschließen könnten
- [ ] Purchase-Filter erlauben: keine Purchases ODER alle storniert
- [ ] Auction-Filter erlauben: keine Auktion ODER noch nicht abgelaufen ODER Purchase vorhanden

### 3. Prüfe Delete-Operationen
- [ ] Keine `delete()` oder `deleteMany()` Operationen ohne explizite User-Bestätigung
- [ ] Keine automatischen Cleanup-Skripte, die echte Daten löschen könnten
- [ ] Alle Delete-Operationen sind Admin-only und erfordern explizite Bestätigung

### 4. Prüfe Schema-Änderungen
- [ ] Keine Migrationen, die Daten löschen könnten
- [ ] Keine Default-Werte, die bestehende Daten ändern könnten
- [ ] Keine Required-Felder hinzugefügt ohne Default-Wert

### 5. Test auf Staging
- [ ] Alle bestehenden Artikel sind noch sichtbar
- [ ] Alle User können sich noch einloggen
- [ ] Keine Fehler in der Konsole

## Nach dem Deployment:

### 1. Validierung erneut ausführen
```bash
GET /api/admin/validate-watches
```

### 2. Manuelle Prüfung
- [ ] Homepage zeigt Artikel
- [ ] Suche funktioniert
- [ ] Kategorien zeigen Artikel
- [ ] User können sich einloggen

## Bei Problemen:

1. **SOFORT Deployment rückgängig machen**
2. Prüfe Vercel Logs für Fehler
3. Prüfe Datenbank direkt: `SELECT * FROM watches WHERE moderationStatus != 'rejected'`
4. Kontaktiere Entwickler

## Schutzmechanismen:

- `src/lib/data-protection.ts`: Validierungs-Funktionen
- `src/app/api/admin/validate-watches/route.ts`: Admin-Endpoint zur Validierung
- Pre-Deployment Hook: Automatische Validierung (TODO: Implementieren)

