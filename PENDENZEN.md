# Pendenzenliste - Zukünftige Features

## Bexio Integration

**Status:** Geplant für später  
**Priorität:** Niedrig  
**Erstellt:** 2025-01-XX

### Beschreibung

Integration mit Bexio Buchhaltungssoftware, um offene Rechnungsbeträge automatisch in Bexio zu exportieren.

### Anforderungen

- Bexio API-Integration (REST API, OAuth 2.0)
- Export-Funktionalität für offene Rechnungen
- Daten-Mapping: Rechnungen → Bexio-Format
- Kontenplan-Zuordnung (Debitoren, Erlöse)
- Steuersätze-Mapping (MwSt 8.1%)
- Optional: Automatischer Export bei Rechnungserstellung
- Optional: Status-Synchronisation (Zahlungseingang)

### Technische Details

- Bexio API-Client implementieren
- Export-Funktion im Admin-Dashboard
- API-Credentials in Environment-Variablen speichern
- Fehlerbehandlung und Logging

### Notizen

- Benutzer benötigt Bexio-Account mit API-Zugang
- API-Dokumentation: https://docs.bexio.com/

---
