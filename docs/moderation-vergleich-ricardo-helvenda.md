# Angebotsmoderation: Ricardo vs. Helvenda

## Vergleich der Moderation-Funktionen

### ✅ Aktuell bei Helvenda vorhanden

1. **Grundlegende Moderation**
   - ✅ Alle Angebote anzeigen
   - ✅ Filter nach Status (Aktiv/Inaktiv/Alle)
   - ✅ Suche nach Titel, Marke, Modell, Verkäufer
   - ✅ Status aktivieren/deaktivieren
   - ✅ Angebot löschen
   - ✅ Angebot ansehen (Link zur Produktseite)
   - ✅ Statistiken (Gesamt, Aktiv, Inaktiv)

2. **Berechnete Aktivität**
   - ✅ Dynamische Berechnung basierend auf Purchase-Status und Auktion-Status
   - ✅ Berücksichtigt stornierte Purchases korrekt

---

### ❌ Fehlende Funktionen (typisch für Ricardo)

#### 1. **Melde-System**

- ❌ Benutzer können problematische Angebote melden
- ❌ Admin sieht gemeldete Angebote mit Priorität
- ❌ Grund für Meldung (Spam, Betrug, falsche Kategorie, etc.)
- ❌ Status: "Gemeldet", "In Prüfung", "Erledigt"

#### 2. **Erweiterte Filter**

- ❌ Filter nach Kategorie
- ❌ Filter nach Datum (Erstellt, Aktualisiert)
- ❌ Filter nach Verkäufer-Verifizierungsstatus
- ❌ Filter nach Angebotsart (Auktion, Sofortkauf)
- ❌ Filter nach Preisbereich
- ❌ Filter nach gemeldeten Angeboten

#### 3. **Bulk-Aktionen**

- ❌ Mehrere Angebote gleichzeitig aktivieren/deaktivieren
- ❌ Mehrere Angebote gleichzeitig löschen
- ❌ Bulk-Kategorisierung
- ❌ Bulk-Status-Änderung

#### 4. **Admin-Notizen & Historie**

- ❌ Admin kann Notizen zu Angeboten hinzufügen
- ❌ Änderungs-Historie (wer hat wann was geändert)
- ❌ Aktivitäts-Log pro Angebot
- ❌ Kommentare zwischen Admins

#### 5. **Automatische Moderation**

- ❌ Keyword-Filter (automatische Flagging bei bestimmten Wörtern)
- ❌ Duplikat-Erkennung
- ❌ Spam-Erkennung
- ❌ Automatische Deaktivierung bei Verstößen

#### 6. **Erweiterte Informationen**

- ❌ Anzahl der Aufrufe
- ❌ Anzahl der Favoriten
- ❌ Anzahl der Gebote (bei Auktionen)
- ❌ Verkäufer-Bewertung
- ❌ Verkäufer-Verifizierungsstatus
- ❌ Anzahl früherer Verkäufe des Verkäufers

#### 7. **Kategorisierung & Tags**

- ❌ Falsche Kategorie korrigieren
- ❌ Tags hinzufügen/entfernen
- ❌ Kategorie-Vorschläge basierend auf Inhalt

#### 8. **Bild-Moderation**

- ❌ Bildqualität prüfen
- ❌ Unangemessene Bilder markieren
- ❌ Wasserzeichen-Erkennung
- ❌ Duplikat-Bilder erkennen

#### 9. **Preis-Moderation**

- ❌ Unrealistische Preise flaggen
- ❌ Preis-Vergleich mit ähnlichen Artikeln
- ❌ Preis-Historie anzeigen

#### 10. **Verkäufer-Kontext**

- ❌ Verkäufer-Profil direkt öffnen
- ❌ Verkäufer-Statistiken (Anzahl Angebote, Verkäufe, Bewertungen)
- ❌ Verkäufer-Verifizierungsstatus
- ❌ Verkäufer-Warnungen/Blockierungen

#### 11. **Export & Reporting**

- ❌ Angebote als CSV exportieren
- ❌ Moderation-Statistiken exportieren
- ❌ Reports generieren

#### 12. **Workflow-Management**

- ❌ Warteschlange für neue Angebote
- ❌ Priorisierung nach Dringlichkeit
- ❌ Zuweisung an bestimmte Admins
- ❌ Status: "Ausstehend", "In Prüfung", "Genehmigt", "Abgelehnt"

---

## Empfohlene Implementierungspriorität

### 🔴 Hoch (Kritisch)

1. **Melde-System** - Benutzer müssen problematische Angebote melden können
2. **Erweiterte Filter** - Kategorie, Datum, Verkäufer-Status
3. **Verkäufer-Kontext** - Schneller Zugriff auf Verkäufer-Informationen

### 🟡 Mittel (Wichtig)

4. **Bulk-Aktionen** - Effizienz für Admins
5. **Admin-Notizen** - Kommunikation zwischen Admins
6. **Erweiterte Informationen** - Aufrufe, Favoriten, Bewertungen

### 🟢 Niedrig (Nice-to-have)

7. **Automatische Moderation** - Keyword-Filter, Spam-Erkennung
8. **Export & Reporting** - CSV-Export, Statistiken
9. **Workflow-Management** - Warteschlange, Zuweisung

---

## Technische Umsetzung

### Datenbank-Erweiterungen benötigt:

- `Report` Modell für Meldungen
- `AdminNote` Modell für Notizen
- `ModerationHistory` Modell für Historie
- `WatchView` Modell für Aufrufe-Tracking
- Erweiterte Indizes für Performance

### API-Erweiterungen benötigt:

- `/api/admin/watches/report` - Angebot melden
- `/api/admin/watches/[id]/notes` - Notizen verwalten
- `/api/admin/watches/[id]/history` - Historie abrufen
- `/api/admin/watches/bulk` - Bulk-Aktionen
- `/api/admin/watches/export` - Export-Funktion

---

## Zusammenfassung

**Helvenda hat aktuell:**

- ✅ Grundlegende Moderation-Funktionen
- ✅ Status-Management
- ✅ Suche und Filter

**Ricardo hat zusätzlich:**

- ✅ Melde-System
- ✅ Erweiterte Filter
- ✅ Bulk-Aktionen
- ✅ Admin-Notizen
- ✅ Automatische Moderation
- ✅ Erweiterte Statistiken
- ✅ Workflow-Management

**Empfehlung:** Implementierung der hoch-priorisierten Features würde Helvenda auf Ricardo-Niveau bringen.
