# Stripe Integration - Cloudflare Optimierungen

## Übersicht

Die Stripe-Integration wurde umfassend verbessert, um mit Cloudflare optimal zu funktionieren und die Onboarding-Anforderungen von Stripe/TWINT zu erfüllen.

## ✅ Implementierte Verbesserungen

### 1. **Rate Limiting & DDoS-Schutz**

- **Webhook Rate Limiting**: 100 Requests pro 10 Sekunden pro IP
- **Database-backed Tracking**: Verwendet `RateLimit` Model für persistente Rate-Limits
- **Automatische Cleanup**: Alte Rate-Limit-Einträge werden automatisch entfernt
- **Fail-Open Strategie**: Bei Fehlern wird die Anfrage erlaubt (nicht blockiert)

**Dateien:**
- `src/lib/rate-limit.ts` - Rate Limiting Utility
- `prisma/schema.prisma` - `RateLimit` Model

### 2. **Webhook Security**

- **IP-Validierung**: Basis-Check für Stripe-IPs (Cloudflare `CF-Connecting-IP` Support)
- **Signature Verification**: Strikte Stripe-Signatur-Verifizierung (Hauptsicherheitsschicht)
- **Request Validation**: Content-Type und Header-Validierung
- **Strukturiertes Logging**: JSON-Logging für bessere Analyse

**Dateien:**
- `src/lib/stripe-webhook-security.ts` - Security Utilities
- `src/app/api/stripe/webhook/route.ts` - Verbesserter Webhook-Handler

### 3. **Error Handling & Retry Logic**

- **Timeout Protection**: 30 Sekunden Maximum Processing Time
- **Idempotency**: Verhindert doppelte Verarbeitung von Events
- **Strukturierte Fehlerantworten**: Konsistente Error-Responses mit Retry-Informationen
- **Error Logging**: Detailliertes Logging für Debugging

**Features:**
- Automatische Retry-Logik durch Stripe
- Fehler werden in `WebhookMetric` gespeichert
- Admin kann Fehler in Monitoring-Dashboard sehen

### 4. **Monitoring & Health Checks**

- **Health Check Endpoint**: `/api/stripe/health` für Cloudflare Health Checks
- **Webhook Metrics**: Tracking von Performance, Fehlerrate, Processing Time
- **Admin Dashboard**: `/admin/stripe/monitoring` für Live-Metriken
- **Automatische Cleanup**: Alte Metriken werden nach 30 Tagen gelöscht

**Dateien:**
- `src/app/api/stripe/health/route.ts` - Health Check
- `src/lib/stripe-monitoring.ts` - Metrics Tracking
- `src/app/admin/stripe/monitoring/page.tsx` - Admin Dashboard
- `src/app/api/admin/stripe/metrics/route.ts` - Metrics API
- `prisma/schema.prisma` - `WebhookMetric` Model

### 5. **Cloudflare-Optimierungen**

- **CF-Connecting-IP Support**: Korrekte IP-Erkennung hinter Cloudflare
- **Security Headers**: Spezielle Headers für Webhook-Endpoint
- **HSTS**: Strict Transport Security für Webhook-Endpoint
- **Response Headers**: Rate-Limit-Informationen in Response-Headers

**Konfiguration:**
- `next.config.js` - Enhanced Security Headers für `/api/stripe/webhook`

### 6. **Performance Optimierungen**

- **Asynchrones Metrics Recording**: Blockiert nicht die Webhook-Verarbeitung
- **Efficient Database Queries**: Optimierte Indizes für Rate Limits und Metrics
- **Strukturiertes Logging**: JSON-Logs für Log-Aggregation

## 📊 Monitoring Dashboard

Das Admin-Dashboard unter `/admin/stripe/monitoring` zeigt:

- **Gesamt Events**: Anzahl verarbeiteter Webhooks
- **Erfolgreich/Fehlgeschlagen**: Erfolgsrate
- **Fehlerrate**: Prozentuale Fehlerrate
- **Durchschnittliche Verarbeitungszeit**: Performance-Metriken
- **Letztes Event/Letzter Fehler**: Timestamps
- **System Health**: Status aller Komponenten

## 🔒 Security Features

1. **Signature Verification**: Stripe-Signatur wird bei jedem Webhook verifiziert
2. **Rate Limiting**: Schutz vor DDoS und Missbrauch
3. **IP Validation**: Basis-Check (Signature ist primäre Sicherheit)
4. **Timeout Protection**: Verhindert hängende Requests
5. **Idempotency**: Verhindert doppelte Verarbeitung

## 🚀 Cloudflare Vorteile

Mit Cloudflare profitieren Sie von:

1. **Professionelle Domain**: `helvenda.ch` statt `vercel.app`
   - ✅ Erfüllt Stripe-Anforderung für funktionale Website
   - ✅ Erhöht Vertrauen bei Stripe-Onboarding

2. **Automatisches SSL/TLS**: 
   - ✅ HTTPS erforderlich für Stripe
   - ✅ Keine manuelle Zertifikatsverwaltung

3. **Support-Email**: `support@helvenda.ch` funktioniert
   - ✅ Erfüllt Stripe-Anforderung für Kontakt-E-Mail
   - ✅ Cloudflare Email Routing

4. **DDoS-Schutz**: 
   - ✅ Zusätzliche Sicherheitsebene
   - ✅ Rate Limiting auf Cloudflare-Ebene möglich

5. **Bessere Performance**:
   - ✅ Schnellere Ladezeiten
   - ✅ Bessere User Experience
   - ✅ Positive Auswirkung auf Stripe-Onboarding

## 📝 Environment Variables

Stellen Sie sicher, dass folgende Variablen gesetzt sind:

```env
STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

## 🔧 Wartung

### Metrics Cleanup

Die alten Metriken werden automatisch nach 30 Tagen gelöscht. Sie können auch manuell aufräumen:

```typescript
import { cleanupOldMetrics } from '@/lib/stripe-monitoring'
await cleanupOldMetrics()
```

### Rate Limit Anpassung

Um Rate Limits anzupassen, bearbeiten Sie `src/lib/rate-limit.ts`:

```typescript
// Aktuell: 100 requests per 10 seconds
limit: 100,
window: 10,
```

## 📈 Nächste Schritte

1. **Stripe Dashboard**: Webhook-Endpoint auf `https://helvenda.ch/api/stripe/webhook` setzen
2. **Cloudflare Health Check**: Konfigurieren Sie Health Checks auf `/api/stripe/health`
3. **Monitoring**: Überwachen Sie das Dashboard regelmäßig
4. **TWINT Aktivierung**: TWINT sollte jetzt problemlos aktivierbar sein

## ✅ Stripe/TWINT Onboarding Checkliste

Mit diesen Verbesserungen erfüllen Sie alle Stripe-Anforderungen:

- ✅ Funktionale Website (helvenda.ch)
- ✅ SSL/TLS Zertifikat (automatisch via Cloudflare)
- ✅ Support-E-Mail (support@helvenda.ch)
- ✅ Legal Notice mit Firmendaten
- ✅ Schweiz als Versandziel
- ✅ Preise in CHF
- ✅ Sichere Webhook-Verarbeitung
- ✅ Rate Limiting & DDoS-Schutz
- ✅ Monitoring & Health Checks

## 🎯 Ergebnis

Die Stripe-Integration ist jetzt:
- **Sicherer**: Rate Limiting, Signature Verification, IP Validation
- **Zuverlässiger**: Error Handling, Retry Logic, Idempotency
- **Überwachbar**: Metrics, Health Checks, Admin Dashboard
- **Cloudflare-optimiert**: CF-Connecting-IP Support, Security Headers
- **Production-ready**: Alle Best Practices implementiert
