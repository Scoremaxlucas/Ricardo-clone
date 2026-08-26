-- SIC-Zahlbeträge mit Rappen abbilden (Testpreise liegen unter CHF 1.–).
ALTER TABLE "sic_payments"
  ALTER COLUMN "amountChf" TYPE DECIMAL(10,2) USING "amountChf"::DECIMAL(10,2);
