# Ricardo E-Mail-Benachrichtigungen - Systematische Auflistung

## 📧 E-Mail-Benachrichtigungen bei Ricardo.ch

### 🔵 FÜR KÄUFER

#### 1. Registrierung & Konto
- ✅ **E-Mail-Adresse bestätigen**
  - Nach der Registrierung
  - Enthält Bestätigungslink
  - Notwendig für Login

#### 2. Gebote & Auktionen
- ✅ **Gebotsbestätigung**
  - Nach Abgabe eines Gebots
  - Bestätigt den Gebotsbetrag
  
- ✅ **Überboten-Benachrichtigung**
  - Wenn ein anderes Mitglied ein höheres Gebot abgibt
  - Ermöglicht erneutes Bieten
  
- ✅ **Auktionsende-Benachrichtigung**
  - Information über den Ausgang einer Auktion
  - Erfolgreich gewonnen oder nicht gewonnen
  - Enthält Details zum Ergebnis

#### 3. Käufe & Transaktionen
- ✅ **Kaufbestätigung**
  - Nach erfolgreichem Sofortkauf
  - Nach erfolgreichem Auktionsende
  - Enthält nächste Schritte (Zahlung, Kontakt)

- ✅ **Zahlungsaufforderung**
  - Nach erfolgreichem Kauf
  - Enthält Zahlungsdetails und Fristen

- ✅ **Zahlungserinnerung**
  - Falls Zahlung innerhalb eines Zeitraums ausbleibt
  - Mehrere Erinnerungen möglich

#### 4. Versand & Lieferung
- ✅ **Versandbenachrichtigung**
  - Information, dass Artikel versendet wurde
  - Oft mit Tracking-Informationen
  - Tracking-Nummer falls vorhanden

#### 5. Preisvorschläge
- ✅ **Preisvorschlag akzeptiert**
  - Wenn Verkäufer einen Preisvorschlag akzeptiert
  - Enthält Details zum Kauf

#### 6. Bewertungen
- ✅ **Bewertungsaufforderung**
  - Nach Abschluss einer Transaktion
  - Erinnerung, Verkäufer zu bewerten

---

### 🟢 FÜR VERKÄUFER

#### 1. Angebote & Verkäufe
- ✅ **Angebotsbestätigung**
  - Bestätigung, dass Artikel erfolgreich eingestellt wurde
  - Enthält Artikelnummer und Details

- ✅ **Gebotsbenachrichtigung**
  - Information, wenn ein Gebot abgegeben wurde
  - Enthält Gebotsbetrag und Bieter-Info

- ✅ **Auktionsende-Benachrichtigung**
  - Mitteilung über den Ausgang der Auktion
  - Enthält Details zum Höchstbietenden
  - Kontaktdaten des Käufers

- ✅ **Verkaufsbestätigung**
  - Nach Auktionsende mit Gewinner
  - Nach Sofortkauf
  - Enthält Käufer-Details und nächste Schritte

#### 2. Zahlungen
- ✅ **Zahlungseingangsbestätigung**
  - Benachrichtigung, dass Käufer gezahlt hat
  - Enthält Zahlungsdetails

#### 3. Versand
- ✅ **Versandetikette**
  - Nach jedem Verkauf mit Versandoption "Paket"
  - Separate E-Mail mit Versandetikette im Anhang
  - Automatisch generiert

- ✅ **Versandaufforderung**
  - Erinnerung, verkauften Artikel zu versenden
  - Nach Zahlungseingang

#### 4. Preisvorschläge
- ✅ **Preisvorschlag erhalten**
  - Wenn Käufer einen Preisvorschlag unterbreitet
  - Enthält Vorschlag und Käufer-Info

#### 5. Gebühren & Rechnungen
- ✅ **Rechnungsbenachrichtigung**
  - Nach Verkauf (Gebühren-Rechnung)
  - Enthält Rechnungsdetails und Zahlungsfrist

- ✅ **Zahlungserinnerung**
  - Falls Rechnung nicht bezahlt wurde
  - Mehrere Erinnerungen möglich

#### 6. Bewertungen
- ✅ **Bewertungsaufforderung**
  - Erinnerung, Käufer nach Transaktion zu bewerten

---

### 🟡 ALLGEMEINE BENACHRICHTIGUNGEN

#### 1. System & Sicherheit
- ✅ **Sicherheitswarnungen**
  - Informationen über verdächtige Aktivitäten
  - Sicherheitsupdates
  - Passwort-Änderungen

- ✅ **Systemmeldungen**
  - Hinweise zu Wartungsarbeiten
  - Technische Probleme
  - Änderungen der Nutzungsbedingungen

#### 2. Marketing & Newsletter
- ✅ **Newsletter**
  - Regelmäßige Updates zu neuen Funktionen
  - Angebote oder Aktionen
  - Kann abbestellt werden

- ✅ **Monatlicher Verkaufsbericht** (optional)
  - Auf Wunsch für Verkäufer
  - Zusammenfassung der Verkaufsaktivitäten

---

## 📊 E-Mail-Benachrichtigungen in Helvenda (aktueller Stand)

### ✅ BEREITS IMPLEMENTIERT

1. ✅ **E-Mail-Verifizierung** (`getEmailVerificationEmail`)
   - Nach Registrierung
   - Enthält Bestätigungslink

2. ✅ **Verkaufsbenachrichtigung** (`getSaleNotificationEmail`)
   - An Verkäufer nach Verkauf
   - Nach Sofortkauf oder Auktionsende

3. ✅ **Antwort-Benachrichtigung** (`getAnswerNotificationEmail`)
   - Wenn Verkäufer auf Käufer-Frage antwortet

4. ✅ **Kaufbestätigung** (`getPurchaseConfirmationEmail`)
   - An Käufer nach erfolgreichem Kauf

5. ✅ **Zahlungsaufforderung** (`getPaymentRequestEmail`)
   - Nach 14 Tagen (erste Aufforderung)

6. ✅ **Erste Zahlungserinnerung** (`getFirstReminderEmail`)
   - Nach 30 Tagen

7. ✅ **Zweite Zahlungserinnerung** (`getSecondReminderEmail`)
   - Nach 44 Tagen
   - Mit Mahnspesen

8. ✅ **Dritte Zahlungserinnerung** (`getThirdReminderEmail`)
   - Nach 58 Tagen

9. ✅ **Finale Mahnung** (`getFinalReminderEmail`)
   - Vor Konto-Sperre

10. ✅ **Rechnungsbenachrichtigung** (`getInvoiceNotificationEmail`)
    - Nach Verkauf (Gebühren-Rechnung)

11. ✅ **Verifizierungs-Bestätigung** (`getVerificationApprovalEmail`)
    - Wenn Verifizierung genehmigt wurde

12. ✅ **Bewertungsbenachrichtigung** (`getReviewNotificationEmail`)
    - Wenn Bewertung erhalten wurde

13. ✅ **Kontaktfrist-Warnung** (`getContactDeadlineWarningEmail`)
    - Warnung vor Ablauf der Kontaktfrist

14. ✅ **Zahlungserinnerung** (`getPaymentReminderEmail`)
    - Allgemeine Zahlungserinnerung

15. ✅ **Dispute eröffnet** (`getDisputeOpenedEmail`)
    - Wenn ein Dispute eröffnet wurde

16. ✅ **Dispute gelöst** (`getDisputeResolvedEmail`)
    - Wenn ein Dispute gelöst wurde

---

### ❌ NOCH NICHT IMPLEMENTIERT

#### Für Käufer:
- ❌ **Gebotsbestätigung**
  - Nach Abgabe eines Gebots
  - Bestätigt den Gebotsbetrag
  
- ❌ **Überboten-Benachrichtigung**
  - Wenn ein anderes Mitglied ein höheres Gebot abgibt
  - Ermöglicht erneutes Bieten
  
- ❌ **Auktionsende-Benachrichtigung** (für Käufer)
  - Information über den Ausgang einer Auktion
  - Erfolgreich gewonnen oder nicht gewonnen
  
- ❌ **Zahlungsaufforderung** (für Käufer nach Kauf)
  - Nach erfolgreichem Kauf
  - Enthält Zahlungsdetails und Fristen
  
- ❌ **Versandbenachrichtigung**
  - Information, dass Artikel versendet wurde
  - Oft mit Tracking-Informationen
  
- ❌ **Preisvorschlag akzeptiert**
  - Wenn Verkäufer einen Preisvorschlag akzeptiert
  - Enthält Details zum Kauf
  
- ❌ **Bewertungsaufforderung** (für Käufer)
  - Nach Abschluss einer Transaktion
  - Erinnerung, Verkäufer zu bewerten

#### Für Verkäufer:
- ❌ **Angebotsbestätigung**
  - Bestätigung, dass Artikel erfolgreich eingestellt wurde
  - Enthält Artikelnummer und Details
  
- ❌ **Gebotsbenachrichtigung**
  - Information, wenn ein Gebot abgegeben wurde
  - Enthält Gebotsbetrag und Bieter-Info
  
- ❌ **Auktionsende-Benachrichtigung** (für Verkäufer)
  - Mitteilung über den Ausgang der Auktion
  - Enthält Details zum Höchstbietenden
  
- ❌ **Zahlungseingangsbestätigung**
  - Benachrichtigung, dass Käufer gezahlt hat
  - Enthält Zahlungsdetails
  
- ❌ **Versandetikette** (mit Anhang)
  - Nach jedem Verkauf mit Versandoption "Paket"
  - Separate E-Mail mit Versandetikette im Anhang
  - Automatisch generiert
  
- ❌ **Versandaufforderung**
  - Erinnerung, verkauften Artikel zu versenden
  - Nach Zahlungseingang
  
- ❌ **Preisvorschlag erhalten**
  - Wenn Käufer einen Preisvorschlag unterbreitet
  - Enthält Vorschlag und Käufer-Info
  
- ❌ **Bewertungsaufforderung** (für Verkäufer)
  - Erinnerung, Käufer nach Transaktion zu bewerten

#### Allgemein:
- ❌ **Sicherheitswarnungen**
  - Informationen über verdächtige Aktivitäten
  - Sicherheitsupdates
  - Passwort-Änderungen
  
- ❌ **Systemmeldungen**
  - Hinweise zu Wartungsarbeiten
  - Technische Probleme
  - Änderungen der Nutzungsbedingungen
  
- ❌ **Newsletter**
  - Regelmäßige Updates zu neuen Funktionen
  - Angebote oder Aktionen
  - Kann abbestellt werden
  
- ❌ **Monatlicher Verkaufsbericht** (optional)
  - Auf Wunsch für Verkäufer
  - Zusammenfassung der Verkaufsaktivitäten

---

## 📝 HINWEISE

- **Benutzer können E-Mail-Benachrichtigungen individuell verwalten**
- **Viele Benachrichtigungen können deaktiviert werden**
- **Newsletter ist optional und kann abbestellt werden**
- **Systemmeldungen sind wichtig und sollten aktiv bleiben**

---

## 🔄 NÄCHSTE SCHRITTE FÜR HELVENDA

1. **Priorität 1 (Kritisch):**
   - Gebotsbestätigung
   - Überboten-Benachrichtigung
   - Auktionsende-Benachrichtigung
   - Kaufbestätigung (für Käufer)
   - Zahlungseingangsbestätigung

2. **Priorität 2 (Wichtig):**
   - Versandbenachrichtigung
   - Versandaufforderung
   - Preisvorschlag-Benachrichtigungen
   - Bewertungsaufforderungen

3. **Priorität 3 (Nice-to-have):**
   - Newsletter
   - Monatlicher Verkaufsbericht
   - Sicherheitswarnungen

