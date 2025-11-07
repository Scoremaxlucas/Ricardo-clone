// Versandkosten-Hilfsfunktionen

export type ShippingMethod = 'pickup' | 'b-post' | 'a-post'
export type ShippingMethodArray = ShippingMethod[] | null | undefined

export function getShippingCost(shippingMethods: ShippingMethodArray): number {
  if (!shippingMethods || shippingMethods.length === 0) {
    return 0
  }
  
  // Höchsten Betrag zurückgeben
  let maxCost = 0
  shippingMethods.forEach(method => {
    switch (method) {
      case 'b-post':
        maxCost = Math.max(maxCost, 8.50)
        break
      case 'a-post':
        maxCost = Math.max(maxCost, 12.50)
        break
      case 'pickup':
        maxCost = Math.max(maxCost, 0)
        break
    }
  })
  
  return maxCost
}

export function getShippingLabels(shippingMethods: ShippingMethodArray): string[] {
  if (!shippingMethods || shippingMethods.length === 0) {
    return ['Nicht angegeben']
  }
  
  const labels: string[] = []
  shippingMethods.forEach(method => {
    switch (method) {
      case 'pickup':
        labels.push('Abholung (kostenlos)')
        break
      case 'b-post':
        labels.push('Versand als Paket B-Post, bis 2 KG (CHF 8.50)')
        break
      case 'a-post':
        labels.push('Versand als Paket A-Post, bis 2 KG (CHF 12.50)')
        break
    }
  })
  
  return labels
}

// Legacy-Funktion für einzelne Methode (für Rückwärtskompatibilität)
export function getShippingLabel(shippingMethod: ShippingMethod | ShippingMethodArray | null | undefined): string {
  if (Array.isArray(shippingMethod)) {
    return getShippingLabels(shippingMethod).join(', ')
  }
  
  switch (shippingMethod) {
    case 'pickup':
      return 'Abholung (kostenlos)'
    case 'b-post':
      return 'Versand als Paket B-Post, bis 2 KG (CHF 8.50)'
    case 'a-post':
      return 'Versand als Paket A-Post, bis 2 KG (CHF 12.50)'
    default:
      return 'Nicht angegeben'
  }
}

