-- Erinnerungen: Betreibungsregister (14 Tage) + Qualitätsnachweis (14 / 3 Tage vor Ablauf)
ALTER TABLE "tenant_profiles" ADD COLUMN "creditCheckExpiryReminder14dSentAt" TIMESTAMP(3);

ALTER TABLE "helvenda_certificates" ADD COLUMN "expiryReminder14dSentAt" TIMESTAMP(3);
ALTER TABLE "helvenda_certificates" ADD COLUMN "expiryReminder3dSentAt" TIMESTAMP(3);
