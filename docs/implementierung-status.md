# Implementierungsstatus: Ricardo-Zahlungsprozess

## ✅ Implementiert

### 1. Schema-Erweiterungen
- ✅ Invoice-Model erweitert mit Mahnprozess-Tracking
- ✅ User-Model erweitert mit Block-Tracking
- ✅ Datenbank migriert

### 2. Mahnprozess (Ricardo-Style)
- ✅ Automatische Erinnerungen nach Ricardo-Zeitplan:
  - Tag 14: Erste Zahlungsaufforderung
  - Tag 30: Erste Erinnerung
  - Tag 44: Zweite Erinnerung + CHF 10.– Mahnspesen
  - Tag 58: Letzte Erinnerung + Konto-Sperre
- ✅ E-Mail-Templates für alle 4 Stufen
- ✅ Plattform-Benachrichtigungen
- ✅ API-Route: `/api/invoices/process-reminders`

### 3. Konto-Sperre
- ✅ Automatische Sperre nach 58 Tagen bei Nichtzahlung
- ✅ Automatische Entsperrung bei Zahlung
- ✅ Block-Reason-Tracking
- ✅ Benachrichtigungen bei Sperre/Entsperrung

### 4. Dokumentation
- ✅ Detaillierte Analyse: `docs/ricardo-zahlungsprozess-analyse.md`
- ✅ Vergleich: `docs/gebuehren-vergleich-ricardo-helvenda.md`

---

## ⏳ Noch zu implementieren

### 1. Direktzahlung (Stripe/PayPal)
- ⏳ Stripe Integration
- ⏳ PayPal Integration
- ⏳ TWINT QR-Code-Generierung
- ⏳ Banküberweisung QR-Code (Swiss QR-Bill)
- ⏳ Webhook-Handler für Zahlungsbestätigung
- ⏳ Zahlungsstatus-Updates

### 2. Cron-Jobs
- ⏳ Tägliche Prüfung (z.B. um 2:00 Uhr):
  - Mahnprozess-Verarbeitung
  - Konto-Sperre-Prüfung
  - Zahlungsstatus-Updates

### 3. Frontend
- ⏳ Zahlungsseite mit allen Zahlungsmethoden
- ⏳ Rechnungsübersicht mit Mahnungen
- ⏳ Block-Warnung auf der Plattform
- ⏳ Zahlungsstatus-Anzeige

---

## 📋 Verwendung

### Mahnprozess manuell auslösen:
```bash
# Als Admin
POST /api/invoices/process-reminders
Authorization: Bearer <admin-token>

# Als Cron-Job
POST /api/invoices/process-reminders
Authorization: Bearer <CRON_SECRET>
```

### Cron-Job einrichten (Beispiel mit cron-job.org):
```
URL: https://helvenda.ch/api/invoices/process-reminders
Method: POST
Headers: Authorization: Bearer <CRON_SECRET>
Schedule: Täglich um 2:00 Uhr
```

---

## 🎯 Nächste Schritte

1. **Direktzahlung implementieren**
   - Stripe/PayPal SDK installieren
   - Zahlungsseite erstellen
   - Webhook-Handler implementieren

2. **Cron-Job einrichten**
   - Vercel Cron Jobs oder externer Service
   - Tägliche Ausführung um 2:00 Uhr

3. **Frontend erweitern**
   - Zahlungsseite
   - Block-Warnungen
   - Mahnungs-Anzeige

---

## 📊 Vergleich: Ricardo vs. Helvenda (nach Implementierung)

| Feature | Ricardo | Helvenda |
|---------|---------|----------|
| **Mahnprozess** | ✅ Automatisch (4 Stufen) | ✅ Automatisch (4 Stufen) |
| **Mahnspesen** | ✅ CHF 10.– | ✅ CHF 10.– |
| **Konto-Sperre** | ✅ Nach 58 Tagen | ✅ Nach 58 Tagen |
| **Automatische Entsperrung** | ✅ Bei Zahlung | ✅ Bei Zahlung |
| **E-Mail-Benachrichtigungen** | ✅ Ja | ✅ Ja |
| **Direktzahlung** | ✅ MoneyGuard | ⏳ In Arbeit |
| **Zahlungsmethoden** | Bank, TWINT, Kreditkarte | ⏳ In Arbeit |





