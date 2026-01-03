// Bankverbindung für Rechnungen und Zahlungen
export const PAYMENT_CONFIG = {
  // Firmeninformationen
  creditorName: process.env.PAYMENT_CREDITOR_NAME || 'Score-Max GmbH',
  
  // Legal/Registration Information
  vatNumber: process.env.PAYMENT_VAT_NUMBER || 'CHE-123.456.789 MWST', // UID/MWST-Nr.
  uid: process.env.PAYMENT_UID || 'CHE-123.456.789', // Unternehmens-Identifikationsnummer
  
  // Contact Information
  email: process.env.PAYMENT_EMAIL || 'support@helvenda.ch',
  phone: process.env.PAYMENT_PHONE || '+41 44 123 45 67',
  website: process.env.PAYMENT_WEBSITE || 'www.helvenda.ch',

  // Adresse
  address: {
    street: process.env.PAYMENT_STREET || 'In der Hauswiese',
    streetNumber: process.env.PAYMENT_STREET_NUMBER || '2',
    postalCode: process.env.PAYMENT_POSTAL_CODE || '8125',
    city: process.env.PAYMENT_CITY || 'Zollikerberg',
    country: process.env.PAYMENT_COUNTRY || 'CH',
  },

  // Bankverbindung
  iban: process.env.PAYMENT_IBAN || 'CH07 8080 8005 4832 7893 1',
  bic: process.env.PAYMENT_BIC || 'RAIFCH22',
  bankName: process.env.PAYMENT_BANK_NAME || 'Raiffeisen Schweiz',
  
  // Payment Terms
  paymentTermsDays: parseInt(process.env.PAYMENT_TERMS_DAYS || '30', 10),
  
  // Legal Information
  legalNotice: process.env.PAYMENT_LEGAL_NOTICE || 'Diese Rechnung ist ohne Unterschrift gültig. Gerichtsstand ist Zürich.',

  // Formatierte Adresse für QR-Code
  getFullAddress(): string {
    return `${this.address.street} ${this.address.streetNumber}\n${this.address.postalCode} ${this.address.city}\n${this.address.country}`
  },

  // Formatierte Adresse für QR-Code (eine Zeile)
  getStreetLine(): string {
    return `${this.address.street} ${this.address.streetNumber}`
  },

  // Formatierte PLZ und Ort für QR-Code
  getCityLine(): string {
    return `${this.address.postalCode} ${this.address.city}`
  },

  // IBAN ohne Leerzeichen (für QR-Code)
  getIbanWithoutSpaces(): string {
    return this.iban.replace(/\s/g, '')
  },

  // Prüft ob die IBAN eine QR-IBAN ist (Position 5-6 muss "30" oder "31" sein)
  isQRIban(): boolean {
    const cleanIban = this.getIbanWithoutSpaces()
    if (cleanIban.length < 6) return false
    const position5to6 = cleanIban.substring(4, 6)
    return position5to6 === '30' || position5to6 === '31'
  },

  // Gibt eine Warnung aus, wenn keine QR-IBAN verwendet wird
  validateQRIban(): { isValid: boolean; message?: string } {
    if (!this.isQRIban()) {
      return {
        isValid: false,
        message: `⚠️  Die verwendete IBAN ist keine QR-IBAN. Position 5-6 ist "${this.getIbanWithoutSpaces().substring(4, 6)}", sollte aber "30" oder "31" sein. Bitte beantragen Sie eine QR-IBAN bei Ihrer Bank. Siehe docs/qr-iban-einrichtung.md`,
      }
    }
    return { isValid: true }
  },
}
