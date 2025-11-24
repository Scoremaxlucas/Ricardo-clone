# Gebühren-Vergleich: Ricardo vs. Helvenda

## 📊 Übersicht

### Ricardo.ch

**Gebührenstruktur:**
- **Erfolgsprovision**: 8-12% des Verkaufspreises
- **Mindestbetrag**: CHF 0.10
- **Höchstbetrag**: CHF 290.00
- **MwSt**: 8.1% auf die Provision

**Zahlungsprozess:**
1. **Rechnungserstellung**: Automatisch nach erfolgreichem Verkauf
2. **Zahlungsaufforderung**: 14 Tage nach Generierung der Gebühren
   - E-Mail mit Informationen zum offenen Saldo
   - Verfügbare Zahlungsmethoden
3. **Zahlungsfrist**: Nach Erhalt der ersten E-Mail fällig
4. **Mahnprozess**:
   - Nach 30 Tagen: Erste Zahlungserinnerung
   - Nach weiteren 14 Tagen: Zweite Erinnerung + CHF 10.– Mahnspesen
   - Bei weiterer Nichtzahlung: Konto-Sperre + Inkasso

**Zahlungsmethoden:**
- Banküberweisung
- TWINT
- Kreditkarte
- QR-Code

---

### Helvenda.ch (aktuell)

**Gebührenstruktur:**
- **Kommission**: 10% des Verkaufspreises (fest)
- **MwSt**: 8.1% auf die Kommission
- **Kein Mindest-/Höchstbetrag**

**Zahlungsprozess:**
1. **Rechnungserstellung**: Automatisch beim Kauf (sofort)
2. **Fälligkeitsdatum**: 30 Tage nach Erstellung
3. **Benachrichtigung**: 
   - E-Mail-Benachrichtigung
   - Plattform-Benachrichtigung
4. **Zahlung**: Manuelles Markieren als bezahlt
5. **Mahnprozess**: ❌ Nicht implementiert

**Zahlungsmethoden:**
- ❌ Keine direkte Zahlungsmöglichkeit in der Plattform
- Manuelles Markieren als bezahlt

---

## 🔍 Vergleich

| Feature | Ricardo | Helvenda | Status |
|---------|---------|----------|--------|
| **Gebührenberechnung** | 8-12% (variabel) | 10% (fest) | ✅ Implementiert |
| **Mindestbetrag** | CHF 0.10 | ❌ Kein Mindestbetrag | ⚠️ Fehlt |
| **Höchstbetrag** | CHF 290.00 | ❌ Kein Höchstbetrag | ⚠️ Fehlt |
| **MwSt** | 8.1% | 8.1% | ✅ Implementiert |
| **Rechnungserstellung** | Automatisch nach Verkauf | Automatisch beim Kauf | ✅ Implementiert |
| **Zahlungsaufforderung** | 14 Tage nach Generierung | Sofort (30 Tage Frist) | ⚠️ Unterschiedlich |
| **E-Mail-Benachrichtigung** | ✅ Ja | ✅ Ja | ✅ Implementiert |
| **Plattform-Benachrichtigung** | ✅ Ja | ✅ Ja | ✅ Implementiert |
| **Zahlungsmethoden** | Bank, TWINT, Kreditkarte, QR | ❌ Keine direkte Zahlung | ❌ Fehlt |
| **Online-Zahlung** | ✅ Ja | ❌ Nein | ❌ Fehlt |
| **Mahnprozess** | ✅ Automatisch | ❌ Nicht implementiert | ❌ Fehlt |
| **Konto-Sperre** | ✅ Bei Nichtzahlung | ❌ Nicht implementiert | ❌ Fehlt |
| **PDF-Rechnung** | ✅ Ja | ✅ Ja | ✅ Implementiert |
| **Rechnungsübersicht** | ✅ Ja | ✅ Ja | ✅ Implementiert |

---

## ⚠️ Fehlende Funktionen in Helvenda

### 1. Zahlungsintegration
- ❌ Keine direkte Zahlungsmöglichkeit in der Plattform
- ❌ Keine Integration von Zahlungsanbietern (Stripe, PayPal, etc.)
- ❌ Keine automatische Zahlungsbestätigung

### 2. Mahnprozess
- ❌ Keine automatischen Zahlungserinnerungen
- ❌ Keine Mahnspesen
- ❌ Keine Konto-Sperre bei Nichtzahlung

### 3. Gebührenstruktur
- ❌ Kein Mindestbetrag (CHF 0.10)
- ❌ Kein Höchstbetrag (CHF 290.00)
- ❌ Keine variablen Gebühren je nach Produkttyp

### 4. Zahlungsaufforderung
- ⚠️ Rechnung wird sofort erstellt (nicht nach 14 Tagen)
- ⚠️ Keine separate Zahlungsaufforderung nach 14 Tagen

---

## 💡 Empfohlene Verbesserungen

### Priorität 1: Zahlungsintegration
1. **Stripe/PayPal Integration**
   - Direkte Zahlung in der Plattform
   - Automatische Zahlungsbestätigung
   - Zahlungsstatus-Updates

2. **Zahlungsmethoden**
   - Banküberweisung (mit QR-Code)
   - TWINT
   - Kreditkarte
   - PayPal

### Priorität 2: Mahnprozess
1. **Automatische Erinnerungen**
   - Nach 30 Tagen: Erste Erinnerung
   - Nach weiteren 14 Tagen: Zweite Erinnerung + CHF 10.– Mahnspesen
   - E-Mail-Benachrichtigungen

2. **Konto-Sperre**
   - Automatische Sperre bei Nichtzahlung
   - Warnung vor Sperre

### Priorität 3: Gebührenstruktur
1. **Mindest-/Höchstbetrag**
   - Mindestbetrag: CHF 0.10
   - Höchstbetrag: CHF 290.00

2. **Variable Gebühren**
   - 8-12% je nach Produkttyp
   - Konfigurierbar im Admin-Panel

### Priorität 4: Zahlungsaufforderung
1. **14-Tage-Verzögerung**
   - Rechnung wird erstellt, aber erst nach 14 Tagen fällig
   - Separate Zahlungsaufforderung nach 14 Tagen

---

## 📝 Aktuelle Implementierung

### Rechnungserstellung
- **Zeitpunkt**: Beim Kauf (sofort)
- **Datei**: `src/lib/invoice.ts` → `calculateInvoiceForSale()`
- **Aufgerufen von**: `src/app/api/purchases/create/route.ts`

### Rechnungsübersicht
- **Seite**: `/my-watches/selling/fees`
- **Datei**: `src/app/my-watches/selling/fees/page.tsx`
- **API**: `/api/invoices/my-invoices`

### Rechnungsstatus
- `pending`: Offen
- `paid`: Bezahlt
- `overdue`: Überfällig

### Zahlung
- **Aktuell**: Manuelles Markieren als bezahlt
- **API**: `/api/invoices/[id]/mark-paid`

---

## 🎯 Nächste Schritte

1. **Zahlungsintegration implementieren** (Stripe/PayPal)
2. **Mahnprozess implementieren** (automatische Erinnerungen)
3. **Gebührenstruktur anpassen** (Mindest-/Höchstbetrag)
4. **Zahlungsaufforderung anpassen** (14-Tage-Verzögerung)





