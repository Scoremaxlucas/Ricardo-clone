// Bankverbindung für Rechnungen und Zahlungen
export const PAYMENT_CONFIG = {
  // Firmeninformationen
  creditorName: process.env.PAYMENT_CREDITOR_NAME || 'Score-Max GmbH',
  
  // Adresse
  address: {
    street: process.env.PAYMENT_STREET || 'In der Hauswiese',
    streetNumber: process.env.PAYMENT_STREET_NUMBER || '2',
    postalCode: process.env.PAYMENT_POSTAL_CODE || '8125',
    city: process.env.PAYMENT_CITY || 'Zollikerberg',
    country: process.env.PAYMENT_COUNTRY || 'CH'
  },
  
  // Bankverbindung
  iban: process.env.PAYMENT_IBAN || 'CH07 8080 8005 4832 7893 1',
  bic: process.env.PAYMENT_BIC || 'RAIFCH22',
  
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
  }
}
