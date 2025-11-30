# 🔍 Dispute-System: Umfassende Analyse

## 📋 Inhaltsverzeichnis

1. [Übersicht](#übersicht)
2. [Ricardo's Dispute-System](#ricardos-dispute-system)
3. [Helvenda's aktuelle Implementierung](#helvendas-aktuelle-implementierung)
4. [Vergleich & Analyse](#vergleich--analyse)
5. [Alle zugehörigen Funktionen](#alle-zugehörigen-funktionen)
6. [Verbesserungsvorschläge](#verbesserungsvorschläge)

---

## 📊 Übersicht

### Was ist ein Dispute?

Ein **Dispute** (Streitfall) ist ein formelles Verfahren zur Lösung von Problemen zwischen Käufer und Verkäufer nach einem Kaufabschluss. Disputes werden verwendet, wenn:

- Direkte Kommunikation nicht zum Erfolg führt
- Eine Partei ihre Verpflichtungen nicht erfüllt
- Es Unstimmigkeiten über den Zustand, die Lieferung oder Zahlung gibt
- Eine Partei nicht erreichbar ist

### Wann wird ein Dispute eingesetzt?

**Typische Dispute-Gründe:**
1. **Artikel nicht erhalten** - Käufer hat bezahlt, aber Artikel nicht erhalten
2. **Artikel beschädigt** - Artikel kam beschädigt an
3. **Falscher Artikel** - Artikel entspricht nicht der Beschreibung
4. **Zahlung nicht bestätigt** - Verkäufer hat Zahlung nicht erhalten/bestätigt
5. **Keine Antwort** - Verkäufer/Käufer antwortet nicht auf Nachrichten
6. **Sonstiges** - Andere Probleme, die nicht gelöst werden können

---

## 🏪 Ricardo's Dispute-System

### Wie funktioniert es bei Ricardo?

#### 1. **Dispute-Eröffnung**

**Wer kann eröffnen:**
- ✅ **Käufer**: Bei Problemen mit Artikel oder Verkäufer
- ✅ **Verkäufer**: Bei Problemen mit Zahlung oder Käufer

**Wann kann eröffnet werden:**
- Nach Kaufabschluss
- Wenn direkte Kommunikation fehlgeschlagen ist
- Innerhalb bestimmter Fristen (meist 30-60 Tage nach Kauf)

**Prozess:**
1. Benutzer klickt auf "Dispute eröffnen" im Kaufprozess
2. Wählt Dispute-Grund aus vordefinierten Kategorien
3. Beschreibt das Problem im Detail
4. Ricardo's Support-Team wird benachrichtigt

#### 2. **Dispute-Verarbeitung**

**Ricardo's Support-Team:**
- Prüft alle verfügbaren Informationen
- Kontaktiert beide Parteien
- Sammelt Beweise (Nachrichten, Fotos, etc.)
- Entscheidet über Lösung

**Typische Lösungen:**
- **Rückerstattung an Käufer** - Wenn Artikel nicht geliefert oder falsch
- **Zahlung an Verkäufer** - Wenn Käufer nicht zahlt
- **Teilweise Rückerstattung** - Bei beschädigtem Artikel
- **Kauf stornieren** - Wenn keine Lösung möglich
- **Vermittlung** - Beide Parteien einigen sich

#### 3. **Dispute-Status**

**Status-Übergänge:**
- `pending` → Dispute eröffnet, wird bearbeitet
- `under_review` → Support prüft den Fall
- `resolved` → Dispute gelöst
- `closed` → Dispute abgeschlossen

#### 4. **Automatische Maßnahmen**

**Bei Dispute-Eröffnung:**
- ✅ Kaufprozess wird "eingefroren"
- ✅ Zahlung wird zurückgehalten (falls Escrow)
- ✅ Beide Parteien werden benachrichtigt
- ✅ Support-Team wird alarmiert

**Nach Dispute-Lösung:**
- ✅ Status wird aktualisiert
- ✅ Zahlungen werden freigegeben/storniert
- ✅ Beide Parteien werden informiert
- ✅ Bewertungen können abgegeben werden

### Ricardo's Dispute-Gründe (Kategorien)

1. **Artikel-Probleme:**
   - Artikel nicht erhalten
   - Artikel beschädigt
   - Falscher Artikel geliefert
   - Artikel entspricht nicht Beschreibung

2. **Zahlungs-Probleme:**
   - Zahlung nicht erhalten
   - Zahlung nicht bestätigt
   - Falscher Betrag überwiesen

3. **Kommunikations-Probleme:**
   - Verkäufer antwortet nicht
   - Käufer antwortet nicht
   - Unklare Kommunikation

4. **Sonstiges:**
   - Andere Probleme

### Ricardo's Dispute-Timeline

```
Tag 0:  Kaufabschluss
Tag 1-7: Kontaktfrist (beide Parteien müssen sich melden)
Tag 8-21: Zahlungsfrist (14 Tage nach Kontakt)
Tag 22+: Dispute kann eröffnet werden (wenn Probleme auftreten)
```

**Wichtig:** Disputes können nur innerhalb bestimmter Fristen eröffnet werden (meist 30-60 Tage nach Kauf).

---

## 💻 Helvenda's aktuelle Implementierung

### Implementierte Features

#### ✅ 1. Dispute-Eröffnung

**Komponente:** `DisputeModal.tsx`
- Modal-Dialog für Dispute-Eröffnung
- Dropdown mit Dispute-Gründen
- Textfeld für Beschreibung
- Validierung vor Absenden

**Dispute-Gründe:**
```typescript
- item_not_received      // Artikel nicht erhalten
- item_damaged           // Artikel beschädigt
- item_wrong            // Falscher Artikel geliefert
- payment_not_confirmed // Zahlung nicht bestätigt
- seller_not_responding // Verkäufer antwortet nicht
- buyer_not_responding  // Käufer antwortet nicht
- other                 // Sonstiges
```

**API-Route:** `/api/purchases/[id]/dispute` (POST)
- Prüft Berechtigung (Käufer oder Verkäufer)
- Prüft ob bereits Dispute existiert
- Prüft ob Kauf abgeschlossen ist
- Erstellt Dispute-Eintrag
- Sendet Benachrichtigungen
- Sendet E-Mails

#### ✅ 2. Dispute-Datenmodell

**Schema (Prisma):**
```prisma
model Purchase {
  // Dispute-Felder
  disputeOpenedAt   DateTime? // Zeitpunkt der Dispute-Eröffnung
  disputeReason     String?   // Grund für Dispute (Format: "reason: description")
  disputeStatus     String?   // pending, resolved, closed
  disputeResolvedAt DateTime? // Zeitpunkt der Dispute-Lösung
  disputeResolvedBy String?   // ID des Admin-Users der gelöst hat
}
```

#### ✅ 3. Dispute-Anzeige in UI

**Käufer-Seite:** `/my-watches/buying/purchased`
- Button "Dispute eröffnen" (nur wenn Status nicht `completed` oder `cancelled`)
- Dispute-Status-Anzeige (wenn Dispute eröffnet)
- Dispute-Informationen (Grund, Status, Datum)

**Verkäufer-Seite:** `/my-watches/selling/sold`
- Button "Dispute eröffnen" (nur wenn Status nicht `completed` oder `cancelled`)
- Dispute-Status-Anzeige (wenn Dispute eröffnet)
- Dispute-Informationen (Grund, Status, Datum)

#### ✅ 4. Admin-Dispute-Verwaltung

**API-Route:** `/api/admin/disputes/[id]/resolve` (POST)
- Nur Admins können Disputes lösen
- Lösung mit Beschreibung
- Optionale Rückerstattung
- Optionale Kauf-Stornierung
- Benachrichtigungen an beide Parteien
- E-Mail-Benachrichtigungen

#### ✅ 5. Benachrichtigungen

**Bei Dispute-Eröffnung:**
- ✅ In-App-Benachrichtigung an andere Partei
- ✅ E-Mail-Benachrichtigung an andere Partei
- ✅ In-App-Benachrichtigung an alle Admins
- ✅ Status-Historie wird aktualisiert

**Bei Dispute-Lösung:**
- ✅ In-App-Benachrichtigung an beide Parteien
- ✅ E-Mail-Benachrichtigung an beide Parteien
- ✅ Status-Historie wird aktualisiert

### Aktuelle Einschränkungen

#### ❌ Fehlende Features

1. **Keine Admin-UI für Disputes**
   - Keine Übersichtsseite für alle Disputes
   - Keine Dispute-Detailseite für Admins
   - Keine Filterung/Sortierung

2. **Keine automatischen Maßnahmen**
   - Kaufprozess wird nicht "eingefroren"
   - Keine automatische Zahlungsrückhaltung
   - Keine automatischen Erinnerungen

3. **Keine Dispute-Historie**
   - Keine vollständige Historie der Dispute-Aktionen
   - Keine Kommentare/Nachrichten im Dispute
   - Keine Datei-Uploads (Beweise)

4. **Keine Fristen**
   - Keine Frist für Dispute-Eröffnung
   - Keine Frist für Dispute-Lösung
   - Keine automatischen Erinnerungen

5. **Keine Escrow-Funktionalität**
   - Zahlungen werden nicht zurückgehalten
   - Keine automatische Rückerstattung
   - Keine automatische Freigabe

---

## 🔄 Vergleich & Analyse

### Vergleichstabelle

| Feature | Ricardo | Helvenda | Status |
|---------|---------|----------|--------|
| **Dispute-Eröffnung** | ✅ | ✅ | ✅ Implementiert |
| **Dispute-Gründe** | ✅ (7+ Kategorien) | ✅ (7 Kategorien) | ✅ Ähnlich |
| **Dispute-Status** | ✅ (4 Status) | ✅ (3 Status) | ⚠️ Teilweise |
| **Admin-Verwaltung** | ✅ (UI + API) | ⚠️ (Nur API) | ❌ UI fehlt |
| **Automatische Maßnahmen** | ✅ | ❌ | ❌ Nicht implementiert |
| **Dispute-Historie** | ✅ | ⚠️ (Nur Status-Historie) | ⚠️ Teilweise |
| **Datei-Uploads** | ✅ | ❌ | ❌ Nicht implementiert |
| **Fristen** | ✅ | ❌ | ❌ Nicht implementiert |
| **Escrow** | ✅ | ❌ | ❌ Nicht implementiert |
| **Benachrichtigungen** | ✅ | ✅ | ✅ Implementiert |
| **E-Mail-Benachrichtigungen** | ✅ | ✅ | ✅ Implementiert |

### Stärken von Helvenda's Implementierung

1. ✅ **Grundfunktionalität vorhanden**
   - Dispute kann eröffnet werden
   - Dispute kann gelöst werden
   - Benachrichtigungen funktionieren

2. ✅ **Gute Datenstruktur**
   - Alle wichtigen Felder vorhanden
   - Status-Historie vorhanden
   - Erweiterbar

3. ✅ **Sichere API**
   - Berechtigungsprüfung
   - Validierung
   - Fehlerbehandlung

### Schwächen von Helvenda's Implementierung

1. ❌ **Keine Admin-UI**
   - Admins können Disputes nicht einfach verwalten
   - Keine Übersicht über alle Disputes
   - Keine Filterung/Sortierung

2. ❌ **Keine automatischen Maßnahmen**
   - Kaufprozess läuft weiter
   - Keine Zahlungsrückhaltung
   - Keine automatischen Erinnerungen

3. ❌ **Keine Fristen**
   - Disputes können jederzeit eröffnet werden
   - Keine automatischen Erinnerungen
   - Keine automatische Lösung

4. ❌ **Keine Escrow-Funktionalität**
   - Zahlungen werden nicht zurückgehalten
   - Keine automatische Rückerstattung
   - Keine automatische Freigabe

---

## 🛠️ Alle zugehörigen Funktionen

### Frontend-Komponenten

#### 1. `DisputeModal.tsx`
**Pfad:** `src/components/dispute/DisputeModal.tsx`

**Funktionen:**
- Modal-Dialog für Dispute-Eröffnung
- Dropdown mit Dispute-Gründen
- Textfeld für Beschreibung
- Validierung vor Absenden
- API-Aufruf zum Erstellen des Disputes

**Props:**
```typescript
interface DisputeModalProps {
  isOpen: boolean
  onClose: () => void
  purchaseId: string
  onDisputeOpened?: () => void
}
```

**Verwendung:**
- In `/my-watches/buying/purchased` (Käufer)
- In `/my-watches/selling/sold` (Verkäufer)

#### 2. Dispute-Anzeige in Purchase/Sale-Listen

**Käufer-Seite:** `src/app/my-watches/buying/purchased/page.tsx`
- Button "Dispute eröffnen" (Zeile 730-741)
- Dispute-Status-Anzeige
- Dispute-Informationen

**Verkäufer-Seite:** `src/app/my-watches/selling/sold/page.tsx`
- Button "Dispute eröffnen" (Zeile 437-449)
- Dispute-Status-Anzeige
- Dispute-Informationen

### Backend-API-Routes

#### 1. `/api/purchases/[id]/dispute` (POST)
**Pfad:** `src/app/api/purchases/[id]/dispute/route.ts`

**Funktionen:**
- Dispute eröffnen
- Berechtigung prüfen (Käufer oder Verkäufer)
- Validierung (kein Dispute bereits vorhanden, nicht abgeschlossen)
- Dispute-Eintrag erstellen
- Benachrichtigungen senden
- E-Mails senden
- Status-Historie aktualisieren

**Request Body:**
```typescript
{
  reason: string        // Dispute-Grund
  description: string   // Beschreibung
}
```

**Response:**
```typescript
{
  message: string
  purchase: Purchase
}
```

#### 2. `/api/purchases/[id]/dispute` (GET)
**Pfad:** `src/app/api/purchases/[id]/dispute/route.ts`

**Funktionen:**
- Dispute-Informationen abrufen
- Berechtigung prüfen (Käufer, Verkäufer oder Admin)

**Response:**
```typescript
{
  dispute: {
    openedAt: string | null
    reason: string | null
    status: string | null
    resolvedAt: string | null
    resolvedBy: string | null
  }
}
```

#### 3. `/api/admin/disputes/[id]/resolve` (POST)
**Pfad:** `src/app/api/admin/disputes/[id]/resolve/route.ts`

**Funktionen:**
- Dispute durch Admin lösen
- Nur Admins können lösen
- Lösung mit Beschreibung
- Optionale Rückerstattung
- Optionale Kauf-Stornierung
- Benachrichtigungen senden
- E-Mails senden
- Status-Historie aktualisieren

**Request Body:**
```typescript
{
  resolution: string      // Lösung-Beschreibung
  refundBuyer?: boolean   // Rückerstattung an Käufer
  refundSeller?: boolean  // Rückerstattung an Verkäufer
  cancelPurchase?: boolean // Kauf stornieren
}
```

**Response:**
```typescript
{
  message: string
  purchase: Purchase
}
```

### Datenbank-Schema

#### Purchase-Modell (Dispute-Felder)

```prisma
model Purchase {
  // Dispute-System
  disputeOpenedAt   DateTime? // Zeitpunkt der Dispute-Eröffnung
  disputeReason     String?   // Grund für Dispute (Format: "reason: description")
  disputeStatus     String?   // pending, resolved, closed
  disputeResolvedAt DateTime? // Zeitpunkt der Dispute-Lösung
  disputeResolvedBy String?   // ID des Admin-Users der gelöst hat
  
  // Status-Historie
  statusHistory String? // JSON Array: [{status, timestamp, changedBy, reason}]
}
```

### E-Mail-Templates

#### 1. `getDisputeOpenedEmail()`
**Pfad:** `src/lib/email.ts`

**Funktionen:**
- E-Mail an andere Partei senden
- Dispute-Grund anzeigen
- Beschreibung anzeigen
- Link zu Dispute-Seite

**Parameter:**
```typescript
getDisputeOpenedEmail(
  userName: string,
  openerName: string,
  articleTitle: string,
  reason: string,
  description: string,
  recipientRole: 'buyer' | 'seller'
)
```

#### 2. `getDisputeResolvedEmail()`
**Pfad:** `src/lib/email.ts`

**Funktionen:**
- E-Mail an beide Parteien senden
- Lösung anzeigen
- Link zu Kauf-Seite

**Parameter:**
```typescript
getDisputeResolvedEmail(
  userName: string,
  otherPartyName: string,
  articleTitle: string,
  resolution: string,
  recipientRole: 'buyer' | 'seller'
)
```

### Benachrichtigungen

#### 1. In-App-Benachrichtigungen

**Bei Dispute-Eröffnung:**
- Benachrichtigung an andere Partei
- Benachrichtigung an alle Admins

**Bei Dispute-Lösung:**
- Benachrichtigung an beide Parteien

**Typ:** `PURCHASE`
**Link:** `/my-watches/buying/purchased` oder `/my-watches/selling/sold`

---

## 🚀 Verbesserungsvorschläge

### 🔴 HOCH (Kritisch)

#### 1. Admin-UI für Disputes

**Was fehlt:**
- Übersichtsseite für alle Disputes
- Dispute-Detailseite für Admins
- Filterung/Sortierung nach Status, Datum, etc.
- Dispute-Lösung direkt in UI

**Implementierung:**
```typescript
// Neue Route: /admin/disputes
- Liste aller Disputes
- Filter: pending, resolved, closed
- Sortierung: Datum, Status, etc.
- Detailansicht mit allen Informationen
- Lösung-Formular direkt in UI
```

#### 2. Automatische Maßnahmen bei Dispute

**Was fehlt:**
- Kaufprozess "einfrieren" bei Dispute
- Zahlungsrückhaltung (falls Escrow)
- Automatische Erinnerungen

**Implementierung:**
```typescript
// Bei Dispute-Eröffnung:
- Status auf "dispute_opened" setzen
- Zahlungen zurückhalten (falls Escrow)
- Automatische Erinnerungen nach 3, 7, 14 Tagen
```

#### 3. Fristen für Dispute

**Was fehlt:**
- Frist für Dispute-Eröffnung (z.B. 30 Tage nach Kauf)
- Frist für Dispute-Lösung (z.B. 14 Tage nach Eröffnung)
- Automatische Erinnerungen

**Implementierung:**
```typescript
// Dispute-Fristen:
- Eröffnung: Max. 30 Tage nach Kauf
- Lösung: Max. 14 Tage nach Eröffnung
- Automatische Erinnerungen nach 7, 10, 14 Tagen
```

### 🟡 MITTEL (Wichtig)

#### 4. Dispute-Historie erweitern

**Was fehlt:**
- Vollständige Historie aller Dispute-Aktionen
- Kommentare/Nachrichten im Dispute
- Datei-Uploads (Beweise)

**Implementierung:**
```typescript
// Neue Tabelle: DisputeHistory
- action: string (opened, commented, resolved, etc.)
- comment: string
- files: string[] (URLs zu hochgeladenen Dateien)
- createdBy: string (User ID)
- createdAt: DateTime
```

#### 5. Escrow-Funktionalität

**Was fehlt:**
- Zahlungen zurückhalten bis Dispute gelöst
- Automatische Rückerstattung bei berechtigten Fällen
- Automatische Freigabe bei Lösung

**Implementierung:**
```typescript
// Escrow-System:
- Zahlungen werden zurückgehalten
- Bei Dispute-Lösung: Automatische Rückerstattung/Freigabe
- Bei Timeout: Automatische Lösung nach Frist
```

#### 6. Dispute-Statistiken

**Was fehlt:**
- Übersicht über alle Disputes
- Statistiken (Anzahl, Status, etc.)
- Performance-Metriken

**Implementierung:**
```typescript
// Admin-Dashboard:
- Anzahl offener Disputes
- Durchschnittliche Lösungszeit
- Dispute-Gründe-Statistik
- Top-Probleme
```

### 🟢 NIEDRIG (Nice-to-have)

#### 7. Dispute-Vorlagen

**Was fehlt:**
- Vordefinierte Lösungen für häufige Fälle
- Automatische Lösungsvorschläge

**Implementierung:**
```typescript
// Dispute-Vorlagen:
- "Artikel nicht erhalten" → Rückerstattung an Käufer
- "Zahlung nicht bestätigt" → Zahlung an Verkäufer
- etc.
```

#### 8. Dispute-Rating

**Was fehlt:**
- Bewertung der Dispute-Lösung
- Feedback-System

**Implementierung:**
```typescript
// Dispute-Rating:
- Bewertung der Lösung (1-5 Sterne)
- Feedback-Text
- Verbesserungsvorschläge
```

---

## 📊 Zusammenfassung

### ✅ Was funktioniert gut

1. **Grundfunktionalität vorhanden**
   - Dispute kann eröffnet werden
   - Dispute kann gelöst werden
   - Benachrichtigungen funktionieren

2. **Gute Datenstruktur**
   - Alle wichtigen Felder vorhanden
   - Status-Historie vorhanden
   - Erweiterbar

3. **Sichere API**
   - Berechtigungsprüfung
   - Validierung
   - Fehlerbehandlung

### ❌ Was fehlt

1. **Admin-UI**
   - Keine Übersichtsseite
   - Keine Detailseite
   - Keine Filterung/Sortierung

2. **Automatische Maßnahmen**
   - Keine Zahlungsrückhaltung
   - Keine automatischen Erinnerungen
   - Keine automatische Lösung

3. **Fristen**
   - Keine Frist für Eröffnung
   - Keine Frist für Lösung
   - Keine automatischen Erinnerungen

### 🎯 Empfehlung

**Priorität 1:** Admin-UI implementieren
**Priorität 2:** Automatische Maßnahmen hinzufügen
**Priorität 3:** Fristen implementieren
**Priorität 4:** Escrow-Funktionalität hinzufügen

---

**Erstellt am:** 2024-12-20
**Letzte Aktualisierung:** 2024-12-20
















