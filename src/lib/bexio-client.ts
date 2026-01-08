/**
 * Bexio API Client
 *
 * Handles all communication with the Bexio.ch accounting system.
 * Documentation: https://docs.bexio.com/
 */

const BEXIO_API_URL = 'https://api.bexio.com/2.0'

interface BexioConfig {
  apiToken: string
}

interface BexioContact {
  id?: number
  contact_type_id: number // 1 = Firma, 2 = Person
  name_1: string // Nachname oder Firmenname
  name_2?: string // Vorname
  address?: string
  postcode?: string
  city?: string
  country_id?: number // 1 = Schweiz
  mail?: string
  phone_fixed?: string
  user_id?: number // Owner in Bexio
  owner_id?: number
}

interface BexioInvoice {
  id?: number
  document_nr?: string
  title?: string
  contact_id: number
  user_id: number
  is_valid_from: string // YYYY-MM-DD
  is_valid_to: string // YYYY-MM-DD (Zahlungsfrist)
  mwst_type: number // 0 = inkl. MWST, 1 = exkl. MWST, 2 = ohne MWST
  mwst_is_net: boolean
  show_position_taxes: boolean
  language_id: number // 1 = DE
  bank_account_id: number
  currency_id: number // 1 = CHF
  payment_type_id: number // Zahlungsart
  header?: string
  footer?: string
  total_gross?: string
  total_net?: string
  total?: string
  positions: BexioInvoicePosition[]
  qr_reference?: string // Unsere QR-Referenz
}

interface BexioInvoicePosition {
  type: string // 'KbPositionArticle', 'KbPositionCustom', 'KbPositionText'
  amount: string
  unit_id?: number
  account_id?: number
  tax_id?: number // MWST-Satz ID
  text: string
  unit_price?: string
  discount_in_percent?: string
}

interface BexioPayment {
  id: number
  date: string
  amount: string
  reference?: string
  kb_invoice_id?: number
}

class BexioClient {
  private apiToken: string

  constructor(config: BexioConfig) {
    this.apiToken = config.apiToken
  }

  private async request<T>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    endpoint: string,
    body?: any
  ): Promise<T> {
    const url = `${BEXIO_API_URL}${endpoint}`

    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.apiToken}`,
      Accept: 'application/json',
    }

    if (body) {
      headers['Content-Type'] = 'application/json'
    }

    const response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Bexio API Error: ${response.status} - ${errorText}`)
    }

    return response.json()
  }

  // ============ KONTAKTE ============

  /**
   * Erstellt einen neuen Kontakt in Bexio
   */
  async createContact(contact: BexioContact): Promise<BexioContact> {
    return this.request<BexioContact>('POST', '/contact', contact)
  }

  /**
   * Aktualisiert einen bestehenden Kontakt
   */
  async updateContact(id: number, contact: Partial<BexioContact>): Promise<BexioContact> {
    return this.request<BexioContact>('PUT', `/contact/${id}`, contact)
  }

  /**
   * Sucht einen Kontakt nach E-Mail
   */
  async findContactByEmail(email: string): Promise<BexioContact | null> {
    const contacts = await this.request<BexioContact[]>('POST', '/contact/search', [
      { field: 'mail', value: email, criteria: '=' },
    ])
    return contacts.length > 0 ? contacts[0] : null
  }

  /**
   * Holt einen Kontakt nach ID
   */
  async getContact(id: number): Promise<BexioContact> {
    return this.request<BexioContact>('GET', `/contact/${id}`)
  }

  // ============ RECHNUNGEN ============

  /**
   * Erstellt eine neue Rechnung in Bexio
   */
  async createInvoice(invoice: BexioInvoice): Promise<BexioInvoice> {
    return this.request<BexioInvoice>('POST', '/kb_invoice', invoice)
  }

  /**
   * Markiert eine Rechnung als versendet (ändert Status)
   */
  async issueInvoice(invoiceId: number): Promise<BexioInvoice> {
    return this.request<BexioInvoice>('POST', `/kb_invoice/${invoiceId}/issue`, {})
  }

  /**
   * Holt eine Rechnung nach ID
   */
  async getInvoice(id: number): Promise<BexioInvoice> {
    return this.request<BexioInvoice>('GET', `/kb_invoice/${id}`)
  }

  /**
   * Sucht Rechnungen nach QR-Referenz
   */
  async findInvoiceByQrReference(qrReference: string): Promise<BexioInvoice | null> {
    // Bexio speichert QR-Referenz im Header oder als Custom Field
    const invoices = await this.request<BexioInvoice[]>('POST', '/kb_invoice/search', [
      { field: 'title', value: qrReference, criteria: 'like' },
    ])
    return invoices.length > 0 ? invoices[0] : null
  }

  /**
   * Holt alle offenen Rechnungen
   */
  async getOpenInvoices(): Promise<BexioInvoice[]> {
    return this.request<BexioInvoice[]>('POST', '/kb_invoice/search', [
      { field: 'kb_item_status_id', value: '7', criteria: '=' }, // 7 = Offen/Ausstehend
    ])
  }

  // ============ ZAHLUNGEN ============

  /**
   * Holt eingehende Zahlungen (Bankbewegungen)
   */
  async getPayments(fromDate?: string, toDate?: string): Promise<BexioPayment[]> {
    let endpoint = '/banking/payment'
    if (fromDate && toDate) {
      endpoint += `?date_from=${fromDate}&date_to=${toDate}`
    }
    return this.request<BexioPayment[]>('GET', endpoint)
  }

  /**
   * Ordnet eine Zahlung einer Rechnung zu
   */
  async matchPaymentToInvoice(paymentId: number, invoiceId: number): Promise<void> {
    await this.request('POST', `/banking/payment/${paymentId}/assign`, {
      kb_invoice_id: invoiceId,
    })
  }

  // ============ BANKKONTO ============

  /**
   * Holt alle Bankkonten
   */
  async getBankAccounts(): Promise<any[]> {
    return this.request<any[]>('GET', '/bank_account')
  }

  // ============ STEUERSÄTZE ============

  /**
   * Holt alle MWST-Sätze
   */
  async getTaxRates(): Promise<any[]> {
    return this.request<any[]>('GET', '/tax')
  }
}

// Singleton Instance
let bexioClient: BexioClient | null = null

export function getBexioClient(): BexioClient {
  if (!bexioClient) {
    const apiToken = process.env.BEXIO_API_TOKEN
    if (!apiToken) {
      throw new Error('BEXIO_API_TOKEN environment variable is not set')
    }
    bexioClient = new BexioClient({ apiToken })
  }
  return bexioClient
}

export { BexioClient }
export type { BexioContact, BexioInvoice, BexioInvoicePosition, BexioPayment }
