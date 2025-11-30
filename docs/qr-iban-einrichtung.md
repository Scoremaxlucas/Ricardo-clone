# QR-IBAN Einrichtung für Swiss QR-Bill

## Was ist eine QR-IBAN?

Eine **QR-IBAN** ist eine spezielle IBAN für QR-Rechnungen (Swiss QR-Bill). Sie unterscheidet sich von der normalen IBAN und ist erforderlich, um QR-Rechnungen mit SCOR-Referenzen zu erstellen.

### Erkennungsmerkmale einer QR-IBAN

Eine QR-IBAN erkennen Sie daran, dass an der **5. und 6. Stelle** die Zahlen **"30"** oder **"31"** stehen.

**Beispiel:**
- ✅ QR-IBAN: `CH30 8080 8005 4832 7893 1` (Position 5-6 = "30")
- ✅ QR-IBAN: `CH31 8080 8005 4832 7893 1` (Position 5-6 = "31")
- ❌ Normale IBAN: `CH07 8080 8005 4832 7893 1` (Position 5-6 = "07")

## Warum benötigen Sie eine QR-IBAN?

Für QR-Rechnungen mit **SCOR-Referenzen** (Creditor Reference) ist eine QR-IBAN zwingend erforderlich. Ohne QR-IBAN werden QR-Codes von Banking-Apps als ungültig erkannt.

## Wie erhalten Sie eine QR-IBAN?

### Schritt 1: Kontaktieren Sie Ihre Bank

Sie müssen die QR-IBAN **direkt bei Ihrer Bank beantragen**. Die QR-IBAN ist kostenpflichtig und wird separat von der normalen IBAN verwaltet.

### Schritt 2: Beantragung bei verschiedenen Banken

#### Raiffeisen Bank
- **Kontakt:** Ihre Raiffeisen-Bankfiliale oder Online-Banking
- **Kosten:** Je nach Bank unterschiedlich (meist zwischen CHF 50-200 pro Jahr)
- **Bearbeitungszeit:** 1-2 Wochen

#### UBS
- **Kontakt:** UBS Business Banking oder Ihre Filiale
- **Online:** UBS e-banking → Zahlungsverkehr → QR-Rechnungen
- **Kosten:** Abhängig vom Kontotyp

#### PostFinance
- **Kontakt:** PostFinance Business Banking
- **Online:** PostFinance E-Finance → Zahlungsverkehr → QR-Rechnungen
- **Kosten:** Abhängig vom Kontotyp

#### ZKB (Zürcher Kantonalbank)
- **Kontakt:** ZKB Business Banking oder Ihre Filiale
- **Kosten:** Abhängig vom Kontotyp

#### Andere Banken
Kontaktieren Sie Ihre Bank direkt und fragen Sie nach einer **QR-IBAN für QR-Rechnungen**.

### Schritt 3: Informationen für die Beantragung

Bei der Beantragung benötigen Sie:
- Firmenname (wie er auf den Rechnungen erscheinen soll)
- Firmenadresse (vollständig)
- BIC/SWIFT-Code Ihrer Bank
- Bestätigung, dass Sie QR-Rechnungen erstellen möchten

## QR-IBAN im System konfigurieren

### Option 1: Über Umgebungsvariablen (Empfohlen)

Erstellen Sie eine `.env.local` Datei im Projekt-Root:

```bash
# QR-IBAN für Swiss QR-Bill
PAYMENT_IBAN=CH30 8080 8005 4832 7893 1

# BIC/SWIFT-Code
PAYMENT_BIC=RAIFCH22

# Firmeninformationen
PAYMENT_CREDITOR_NAME=Score-Max GmbH
PAYMENT_STREET=In der Hauswiese
PAYMENT_STREET_NUMBER=2
PAYMENT_POSTAL_CODE=8125
PAYMENT_CITY=Zollikerberg
PAYMENT_COUNTRY=CH
```

### Option 2: Direkt in der Konfiguration

Die IBAN wird in `src/lib/payment-config.ts` konfiguriert:

```typescript
export const PAYMENT_CONFIG = {
  iban: process.env.PAYMENT_IBAN || 'CH30 8080 8005 4832 7893 1', // QR-IBAN hier eintragen
  // ...
}
```

## Validierung der QR-IBAN

Nach der Konfiguration können Sie prüfen, ob die IBAN eine gültige QR-IBAN ist:

```bash
# Prüfe ob IBAN eine QR-IBAN ist
npx tsx -e "
const iban = process.env.PAYMENT_IBAN || 'CH0780808005483278931';
const cleanIban = iban.replace(/\\s/g, '');
const position5to6 = cleanIban.substring(4, 6);
const isQRIban = position5to6 === '30' || position5to6 === '31';
console.log('IBAN:', iban);
console.log('Position 5-6:', position5to6);
console.log('Ist QR-IBAN:', isQRIban ? '✅ JA' : '❌ NEIN');
"
```

## Kosten

Die Kosten für eine QR-IBAN variieren je nach Bank:
- **Raiffeisen:** CHF 50-200 pro Jahr
- **UBS:** Abhängig vom Kontotyp
- **PostFinance:** Abhängig vom Kontotyp
- **ZKB:** Abhängig vom Kontotyp

**Hinweis:** Erkundigen Sie sich bei Ihrer Bank nach den aktuellen Preisen.

## Wichtige Hinweise

1. **QR-IBAN ist erforderlich:** Ohne QR-IBAN funktionieren QR-Rechnungen nicht korrekt
2. **Separate Verwaltung:** Die QR-IBAN wird separat von der normalen IBAN verwaltet
3. **Kostenpflichtig:** Die QR-IBAN ist meist kostenpflichtig
4. **Bearbeitungszeit:** Die Beantragung kann 1-2 Wochen dauern
5. **Gültigkeit:** Die QR-IBAN bleibt gültig, solange das Konto aktiv ist

## Troubleshooting

### QR-Code wird als ungültig erkannt

**Mögliche Ursachen:**
1. ❌ Keine QR-IBAN verwendet (normale IBAN statt QR-IBAN)
2. ❌ QR-IBAN nicht korrekt konfiguriert
3. ❌ IBAN-Format falsch (Leerzeichen, falsche Länge)

**Lösung:**
1. Prüfen Sie, ob Position 5-6 der IBAN "30" oder "31" ist
2. Stellen Sie sicher, dass die IBAN in `.env.local` korrekt eingetragen ist
3. Prüfen Sie die Server-Logs auf Validierungsfehler

### QR-IBAN wird nicht akzeptiert

**Mögliche Ursachen:**
1. ❌ QR-IBAN wurde nicht bei der Bank aktiviert
2. ❌ QR-IBAN ist abgelaufen oder gesperrt
3. ❌ Falsche BIC/SWIFT-Code

**Lösung:**
1. Kontaktieren Sie Ihre Bank und prüfen Sie den Status der QR-IBAN
2. Stellen Sie sicher, dass die QR-IBAN aktiviert ist
3. Prüfen Sie den BIC/SWIFT-Code

## Weitere Ressourcen

- [Swiss QR-Bill Spezifikation](https://www.six-group.com/en/products-services/banking-services/payment-standardization/standards/qr-bill.html)
- [QR-Bill Validator](https://validation.iso-payments.ch/qrrechnung/)
- [Raiffeisen QR-Rechnung](https://www.raiffeisen.ch/de/firmenkunden/liquiditaet-und-zahlungsverkehr/harmonisierung-zahlungsverkehr/qr-rechnung.html)

## Support

Bei Fragen zur QR-IBAN wenden Sie sich bitte an:
- Ihre Bank (für Beantragung und Aktivierung)
- System-Administrator (für technische Konfiguration)

