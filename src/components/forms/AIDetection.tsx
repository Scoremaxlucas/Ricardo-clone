'use client'

import { useLanguage } from '@/contexts/LanguageContext'
import { AlertCircle, Image as ImageIcon, Loader2, Search, Sparkles, Upload, X } from 'lucide-react'
import { useRef, useState } from 'react'

interface AIDetectionProps {
  onCategoryDetected: (
    category: string,
    subcategory: string,
    productName: string,
    imageUrl: string | null,
    confidence: number
  ) => void
  onSuggestionGenerated?: (suggestion: {
    category?: string
    subcategory?: string
    title?: string
    description?: string
  }) => void
}

// Intelligentes Mapping von MobileNet Labels zu Helvenda Kategorien
// MASSIV ERWEITERT für maximale Genauigkeit - besonders Besteck
const categoryMapping: Record<
  string,
  {
    category: string
    subcategory: string
    productName: string
    priority?: number
    negativeKeywords?: string[]
  }
> = {
  // ===== BESTECK & GESCHIRR (HÖCHSTE PRIORITÄT - MAXIMALE GENAUIGKEIT) =====
  cutlery: {
    category: 'haushalt-wohnen',
    subcategory: 'Besteck-Sets',
    productName: 'Besteck-Set',
    priority: 15,
    negativeKeywords: ['ski', 'snowboard', 'pole', 'stick'],
  },
  silverware: {
    category: 'haushalt-wohnen',
    subcategory: 'Besteck-Sets',
    productName: 'Besteck-Set',
    priority: 15,
    negativeKeywords: ['ski', 'snowboard', 'pole', 'stick'],
  },
  flatware: {
    category: 'haushalt-wohnen',
    subcategory: 'Besteck-Sets',
    productName: 'Besteck-Set',
    priority: 15,
    negativeKeywords: ['ski', 'snowboard', 'pole', 'stick'],
  },
  tableware: {
    category: 'haushalt-wohnen',
    subcategory: 'Besteck-Sets',
    productName: 'Besteck-Set',
    priority: 14,
    negativeKeywords: ['ski', 'snowboard', 'pole', 'stick'],
  },
  dinnerware: {
    category: 'haushalt-wohnen',
    subcategory: 'Besteck-Sets',
    productName: 'Besteck-Set',
    priority: 14,
    negativeKeywords: ['ski', 'snowboard', 'pole', 'stick'],
  },
  'eating utensil': {
    category: 'haushalt-wohnen',
    subcategory: 'Besteck-Sets',
    productName: 'Besteck-Set',
    priority: 14,
    negativeKeywords: ['ski', 'snowboard', 'pole', 'stick'],
  },
  utensil: {
    category: 'haushalt-wohnen',
    subcategory: 'Besteck-Sets',
    productName: 'Besteck-Set',
    priority: 13,
    negativeKeywords: ['ski', 'snowboard', 'pole', 'stick', 'tool'],
  },
  fork: {
    category: 'haushalt-wohnen',
    subcategory: 'Besteck-Sets',
    productName: 'Gabel',
    priority: 13,
    negativeKeywords: ['ski', 'snowboard', 'pole', 'stick', 'forklift'],
  },
  knife: {
    category: 'haushalt-wohnen',
    subcategory: 'Besteck-Sets',
    productName: 'Messer',
    priority: 13,
    negativeKeywords: ['ski', 'snowboard', 'pole', 'stick', 'sword', 'blade'],
  },
  spoon: {
    category: 'haushalt-wohnen',
    subcategory: 'Besteck-Sets',
    productName: 'Löffel',
    priority: 13,
    negativeKeywords: ['ski', 'snowboard', 'pole', 'stick'],
  },
  'dining fork': {
    category: 'haushalt-wohnen',
    subcategory: 'Besteck-Sets',
    productName: 'Gabel',
    priority: 14,
    negativeKeywords: ['ski', 'snowboard', 'pole', 'stick'],
  },
  'dining knife': {
    category: 'haushalt-wohnen',
    subcategory: 'Besteck-Sets',
    productName: 'Messer',
    priority: 14,
    negativeKeywords: ['ski', 'snowboard', 'pole', 'stick'],
  },
  'dining spoon': {
    category: 'haushalt-wohnen',
    subcategory: 'Besteck-Sets',
    productName: 'Löffel',
    priority: 14,
    negativeKeywords: ['ski', 'snowboard', 'pole', 'stick'],
  },
  'table fork': {
    category: 'haushalt-wohnen',
    subcategory: 'Besteck-Sets',
    productName: 'Gabel',
    priority: 14,
    negativeKeywords: ['ski', 'snowboard', 'pole', 'stick'],
  },
  'table knife': {
    category: 'haushalt-wohnen',
    subcategory: 'Besteck-Sets',
    productName: 'Messer',
    priority: 14,
    negativeKeywords: ['ski', 'snowboard', 'pole', 'stick'],
  },
  'table spoon': {
    category: 'haushalt-wohnen',
    subcategory: 'Besteck-Sets',
    productName: 'Löffel',
    priority: 14,
    negativeKeywords: ['ski', 'snowboard', 'pole', 'stick'],
  },
  'serving fork': {
    category: 'haushalt-wohnen',
    subcategory: 'Besteck-Sets',
    productName: 'Gabel',
    priority: 12,
    negativeKeywords: ['ski', 'snowboard', 'pole', 'stick'],
  },
  'serving spoon': {
    category: 'haushalt-wohnen',
    subcategory: 'Besteck-Sets',
    productName: 'Löffel',
    priority: 12,
    negativeKeywords: ['ski', 'snowboard', 'pole', 'stick'],
  },
  'tea spoon': {
    category: 'haushalt-wohnen',
    subcategory: 'Besteck-Sets',
    productName: 'Teelöffel',
    priority: 12,
    negativeKeywords: ['ski', 'snowboard', 'pole', 'stick'],
  },
  'butter knife': {
    category: 'haushalt-wohnen',
    subcategory: 'Besteck-Sets',
    productName: 'Buttermesser',
    priority: 12,
    negativeKeywords: ['ski', 'snowboard', 'pole', 'stick'],
  },
  'salad fork': {
    category: 'haushalt-wohnen',
    subcategory: 'Besteck-Sets',
    productName: 'Gabel',
    priority: 12,
    negativeKeywords: ['ski', 'snowboard', 'pole', 'stick'],
  },
  'dessert fork': {
    category: 'haushalt-wohnen',
    subcategory: 'Besteck-Sets',
    productName: 'Gabel',
    priority: 12,
    negativeKeywords: ['ski', 'snowboard', 'pole', 'stick'],
  },
  'dessert spoon': {
    category: 'haushalt-wohnen',
    subcategory: 'Besteck-Sets',
    productName: 'Löffel',
    priority: 12,
    negativeKeywords: ['ski', 'snowboard', 'pole', 'stick'],
  },
  bowl: {
    category: 'haushalt-wohnen',
    subcategory: 'Teller',
    productName: 'Schüssel',
    priority: 7,
  },
  'coffee mug': {
    category: 'haushalt-wohnen',
    subcategory: 'Tassen',
    productName: 'Kaffeetasse',
    priority: 7,
  },
  cup: { category: 'haushalt-wohnen', subcategory: 'Tassen', productName: 'Tasse', priority: 7 },
  mug: { category: 'haushalt-wohnen', subcategory: 'Tassen', productName: 'Tasse', priority: 7 },
  plate: { category: 'haushalt-wohnen', subcategory: 'Teller', productName: 'Teller', priority: 7 },
  dish: { category: 'haushalt-wohnen', subcategory: 'Teller', productName: 'Teller', priority: 7 },
  saucer: {
    category: 'haushalt-wohnen',
    subcategory: 'Tassen',
    productName: 'Untertasse',
    priority: 6,
  },
  teacup: {
    category: 'haushalt-wohnen',
    subcategory: 'Tassen',
    productName: 'Teetasse',
    priority: 6,
  },
  glass: { category: 'haushalt-wohnen', subcategory: 'Gläser', productName: 'Glas', priority: 7 },
  'wine glass': {
    category: 'haushalt-wohnen',
    subcategory: 'Gläser',
    productName: 'Weinglas',
    priority: 7,
  },
  pitcher: {
    category: 'haushalt-wohnen',
    subcategory: 'Geschirr & Besteck',
    productName: 'Karaffe',
    priority: 6,
  },

  // ===== COMPUTER & NETZWERK - SUBKATEGORIEN-SPEZIFISCH =====
  // NOTEBOOKS & LAPTOPS
  laptop: {
    category: 'computer-netzwerk',
    subcategory: 'Notebooks & Laptops',
    productName: 'Laptop',
    priority: 12,
    negativeKeywords: ['tablet', 'phone', 'monitor'],
  },
  notebook: {
    category: 'computer-netzwerk',
    subcategory: 'Notebooks & Laptops',
    productName: 'Notebook',
    priority: 12,
    negativeKeywords: ['tablet', 'phone', 'book'],
  },
  'notebook computer': {
    category: 'computer-netzwerk',
    subcategory: 'Notebooks & Laptops',
    productName: 'Notebook',
    priority: 12,
  },
  'laptop computer': {
    category: 'computer-netzwerk',
    subcategory: 'Notebooks & Laptops',
    productName: 'Laptop',
    priority: 12,
  },
  macbook: {
    category: 'computer-netzwerk',
    subcategory: 'Notebooks & Laptops',
    productName: 'MacBook',
    priority: 13,
  },
  thinkpad: {
    category: 'computer-netzwerk',
    subcategory: 'Notebooks & Laptops',
    productName: 'ThinkPad',
    priority: 12,
  },
  'gaming laptop': {
    category: 'computer-netzwerk',
    subcategory: 'Gaming-Laptops',
    productName: 'Gaming Laptop',
    priority: 12,
  },
  ultrabook: {
    category: 'computer-netzwerk',
    subcategory: 'Notebooks & Laptops',
    productName: 'Ultrabook',
    priority: 11,
  },

  // DESKTOP-PCs
  'desktop computer': {
    category: 'computer-netzwerk',
    subcategory: 'Desktop-PCs',
    productName: 'Desktop Computer',
    priority: 11,
  },
  desktop: {
    category: 'computer-netzwerk',
    subcategory: 'Desktop-PCs',
    productName: 'Desktop Computer',
    priority: 11,
  },
  pc: {
    category: 'computer-netzwerk',
    subcategory: 'Desktop-PCs',
    productName: 'PC',
    priority: 10,
    negativeKeywords: ['mac', 'apple'],
  },
  'personal computer': {
    category: 'computer-netzwerk',
    subcategory: 'Desktop-PCs',
    productName: 'PC',
    priority: 10,
  },
  'gaming pc': {
    category: 'computer-netzwerk',
    subcategory: 'Gaming-PCs',
    productName: 'Gaming PC',
    priority: 12,
  },
  workstation: {
    category: 'computer-netzwerk',
    subcategory: 'Desktop-PCs',
    productName: 'Workstation',
    priority: 11,
  },
  'all-in-one': {
    category: 'computer-netzwerk',
    subcategory: 'Desktop-PCs',
    productName: 'All-in-One PC',
    priority: 11,
  },
  'all in one': {
    category: 'computer-netzwerk',
    subcategory: 'Desktop-PCs',
    productName: 'All-in-One PC',
    priority: 11,
  },

  // TABLETS
  tablet: {
    category: 'computer-netzwerk',
    subcategory: 'Tablets',
    productName: 'Tablet',
    priority: 11,
    negativeKeywords: ['laptop', 'notebook', 'phone'],
  },
  'tablet computer': {
    category: 'computer-netzwerk',
    subcategory: 'Tablets',
    productName: 'Tablet',
    priority: 11,
  },
  ipad: {
    category: 'computer-netzwerk',
    subcategory: 'Tablets',
    productName: 'iPad',
    priority: 13,
  },
  'galaxy tab': {
    category: 'computer-netzwerk',
    subcategory: 'Tablets',
    productName: 'Galaxy Tab',
    priority: 12,
  },
  surface: {
    category: 'computer-netzwerk',
    subcategory: 'Tablets',
    productName: 'Surface',
    priority: 12,
  },

  // MONITORE & DISPLAYS
  monitor: {
    category: 'computer-netzwerk',
    subcategory: 'Monitore & Displays',
    productName: 'Monitor',
    priority: 10,
    negativeKeywords: ['laptop', 'tablet', 'phone'],
  },
  'computer monitor': {
    category: 'computer-netzwerk',
    subcategory: 'Monitore & Displays',
    productName: 'Monitor',
    priority: 10,
  },
  display: {
    category: 'computer-netzwerk',
    subcategory: 'Monitore & Displays',
    productName: 'Bildschirm',
    priority: 10,
  },
  screen: {
    category: 'computer-netzwerk',
    subcategory: 'Monitore & Displays',
    productName: 'Bildschirm',
    priority: 9,
    negativeKeywords: ['laptop', 'tablet', 'phone'],
  },
  'gaming monitor': {
    category: 'computer-netzwerk',
    subcategory: 'Gaming-Monitore',
    productName: 'Gaming Monitor',
    priority: 11,
  },
  'ultrawide monitor': {
    category: 'computer-netzwerk',
    subcategory: 'Monitore & Displays',
    productName: 'Ultrawide Monitor',
    priority: 10,
  },
  'curved monitor': {
    category: 'computer-netzwerk',
    subcategory: 'Monitore & Displays',
    productName: 'Curved Monitor',
    priority: 10,
  },

  // TASTATUREN
  keyboard: {
    category: 'computer-netzwerk',
    subcategory: 'Tastaturen',
    productName: 'Tastatur',
    priority: 10,
    negativeKeywords: ['piano', 'organ'],
  },
  'computer keyboard': {
    category: 'computer-netzwerk',
    subcategory: 'Tastaturen',
    productName: 'Tastatur',
    priority: 10,
  },
  'mechanical keyboard': {
    category: 'computer-netzwerk',
    subcategory: 'Gaming-Tastaturen',
    productName: 'Mechanische Tastatur',
    priority: 11,
  },
  'gaming keyboard': {
    category: 'computer-netzwerk',
    subcategory: 'Gaming-Tastaturen',
    productName: 'Gaming Tastatur',
    priority: 11,
  },
  'wireless keyboard': {
    category: 'computer-netzwerk',
    subcategory: 'Tastaturen',
    productName: 'Kabellose Tastatur',
    priority: 10,
  },

  // MÄUSE
  mouse: {
    category: 'computer-netzwerk',
    subcategory: 'Mäuse',
    productName: 'Maus',
    priority: 10,
    negativeKeywords: ['animal', 'rodent'],
  },
  'computer mouse': {
    category: 'computer-netzwerk',
    subcategory: 'Mäuse',
    productName: 'Maus',
    priority: 10,
  },
  'gaming mouse': {
    category: 'computer-netzwerk',
    subcategory: 'Gaming-Mäuse',
    productName: 'Gaming Maus',
    priority: 11,
  },
  'wireless mouse': {
    category: 'computer-netzwerk',
    subcategory: 'Mäuse',
    productName: 'Kabellose Maus',
    priority: 10,
  },
  'optical mouse': {
    category: 'computer-netzwerk',
    subcategory: 'Mäuse',
    productName: 'Optische Maus',
    priority: 9,
  },
  trackball: {
    category: 'computer-netzwerk',
    subcategory: 'Mäuse',
    productName: 'Trackball',
    priority: 9,
  },

  // DRUCKER
  printer: {
    category: 'computer-netzwerk',
    subcategory: 'Drucker',
    productName: 'Drucker',
    priority: 11,
  },
  'inkjet printer': {
    category: 'computer-netzwerk',
    subcategory: 'Drucker',
    productName: 'Tintenstrahldrucker',
    priority: 11,
  },
  'laser printer': {
    category: 'computer-netzwerk',
    subcategory: 'Drucker',
    productName: 'Laserdrucker',
    priority: 11,
  },
  'color printer': {
    category: 'computer-netzwerk',
    subcategory: 'Drucker',
    productName: 'Farbdrucker',
    priority: 10,
  },
  '3d printer': {
    category: 'computer-netzwerk',
    subcategory: 'Drucker',
    productName: '3D-Drucker',
    priority: 11,
  },
  photocopier: {
    category: 'computer-netzwerk',
    subcategory: 'Drucker',
    productName: 'Kopierer',
    priority: 9,
  },
  copier: {
    category: 'computer-netzwerk',
    subcategory: 'Drucker',
    productName: 'Kopierer',
    priority: 9,
  },

  // SCANNER
  scanner: {
    category: 'computer-netzwerk',
    subcategory: 'Scanner',
    productName: 'Scanner',
    priority: 11,
  },
  'document scanner': {
    category: 'computer-netzwerk',
    subcategory: 'Scanner',
    productName: 'Scanner',
    priority: 11,
  },
  'flatbed scanner': {
    category: 'computer-netzwerk',
    subcategory: 'Scanner',
    productName: 'Flachbettscanner',
    priority: 11,
  },
  'sheetfed scanner': {
    category: 'computer-netzwerk',
    subcategory: 'Scanner',
    productName: 'Einzugsscanner',
    priority: 10,
  },

  // MULTIFUNKTIONSGERÄTE
  'multifunction printer': {
    category: 'computer-netzwerk',
    subcategory: 'Multifunktionsgeräte',
    productName: 'Multifunktionsgerät',
    priority: 11,
  },
  'all-in-one printer': {
    category: 'computer-netzwerk',
    subcategory: 'Multifunktionsgeräte',
    productName: 'Multifunktionsgerät',
    priority: 11,
  },
  fax: {
    category: 'computer-netzwerk',
    subcategory: 'Multifunktionsgeräte',
    productName: 'Faxgerät',
    priority: 9,
  },
  'fax machine': {
    category: 'computer-netzwerk',
    subcategory: 'Multifunktionsgeräte',
    productName: 'Faxgerät',
    priority: 9,
  },

  // NETZWERK
  router: {
    category: 'computer-netzwerk',
    subcategory: 'Router',
    productName: 'Router',
    priority: 10,
  },
  'wireless router': {
    category: 'computer-netzwerk',
    subcategory: 'Router',
    productName: 'WLAN Router',
    priority: 10,
  },
  modem: {
    category: 'computer-netzwerk',
    subcategory: 'Router',
    productName: 'Modem',
    priority: 9,
  },
  switch: {
    category: 'computer-netzwerk',
    subcategory: 'Switches',
    productName: 'Switch',
    priority: 9,
    negativeKeywords: ['light', 'lamp'],
  },
  'network switch': {
    category: 'computer-netzwerk',
    subcategory: 'Switches',
    productName: 'Switch',
    priority: 10,
  },
  'wifi adapter': {
    category: 'computer-netzwerk',
    subcategory: 'WLAN-Adapter',
    productName: 'WLAN-Adapter',
    priority: 9,
  },
  'wlan adapter': {
    category: 'computer-netzwerk',
    subcategory: 'WLAN-Adapter',
    productName: 'WLAN-Adapter',
    priority: 9,
  },

  // WEBCAMS
  webcam: {
    category: 'computer-netzwerk',
    subcategory: 'Webcams',
    productName: 'Webcam',
    priority: 10,
  },
  camera: {
    category: 'computer-netzwerk',
    subcategory: 'Webcams',
    productName: 'Webcam',
    priority: 9,
    negativeKeywords: ['phone', 'dslr', 'reflex'],
  },
  'usb camera': {
    category: 'computer-netzwerk',
    subcategory: 'Webcams',
    productName: 'Webcam',
    priority: 10,
  },

  // HEADSETS
  headset: {
    category: 'computer-netzwerk',
    subcategory: 'Headsets',
    productName: 'Headset',
    priority: 11,
  },
  'gaming headset': {
    category: 'computer-netzwerk',
    subcategory: 'Headsets',
    productName: 'Gaming Headset',
    priority: 11,
  },
  'wireless headset': {
    category: 'computer-netzwerk',
    subcategory: 'Headsets',
    productName: 'Kabelloses Headset',
    priority: 11,
  },

  // LAUTSPRECHER
  speaker: {
    category: 'computer-netzwerk',
    subcategory: 'Lautsprecher',
    productName: 'Lautsprecher',
    priority: 9,
    negativeKeywords: ['person', 'human'],
  },
  'computer speaker': {
    category: 'computer-netzwerk',
    subcategory: 'Lautsprecher',
    productName: 'Lautsprecher',
    priority: 9,
  },
  'bluetooth speaker': {
    category: 'computer-netzwerk',
    subcategory: 'Lautsprecher',
    productName: 'Bluetooth Lautsprecher',
    priority: 10,
  },
  soundbar: {
    category: 'computer-netzwerk',
    subcategory: 'Lautsprecher',
    productName: 'Soundbar',
    priority: 10,
  },

  // KOPFHÖRER
  headphones: {
    category: 'computer-netzwerk',
    subcategory: 'Kopfhörer',
    productName: 'Kopfhörer',
    priority: 11,
  },
  headphone: {
    category: 'computer-netzwerk',
    subcategory: 'Kopfhörer',
    productName: 'Kopfhörer',
    priority: 11,
  },
  earphones: {
    category: 'computer-netzwerk',
    subcategory: 'Kopfhörer',
    productName: 'Kopfhörer',
    priority: 10,
  },
  earbuds: {
    category: 'computer-netzwerk',
    subcategory: 'Kopfhörer',
    productName: 'Kopfhörer',
    priority: 10,
  },

  // GRAFIKKARTEN
  'graphics card': {
    category: 'computer-netzwerk',
    subcategory: 'Grafikkarten',
    productName: 'Grafikkarte',
    priority: 12,
  },
  'video card': {
    category: 'computer-netzwerk',
    subcategory: 'Grafikkarten',
    productName: 'Grafikkarte',
    priority: 12,
  },
  gpu: {
    category: 'computer-netzwerk',
    subcategory: 'Grafikkarten',
    productName: 'Grafikkarte',
    priority: 12,
  },
  nvidia: {
    category: 'computer-netzwerk',
    subcategory: 'Grafikkarten',
    productName: 'NVIDIA Grafikkarte',
    priority: 11,
  },
  'amd gpu': {
    category: 'computer-netzwerk',
    subcategory: 'Grafikkarten',
    productName: 'AMD Grafikkarte',
    priority: 11,
  },
  rtx: {
    category: 'computer-netzwerk',
    subcategory: 'Grafikkarten',
    productName: 'RTX Grafikkarte',
    priority: 12,
  },
  gtx: {
    category: 'computer-netzwerk',
    subcategory: 'Grafikkarten',
    productName: 'GTX Grafikkarte',
    priority: 11,
  },

  // PROZESSOREN
  processor: {
    category: 'computer-netzwerk',
    subcategory: 'Prozessoren',
    productName: 'Prozessor',
    priority: 12,
  },
  cpu: {
    category: 'computer-netzwerk',
    subcategory: 'Prozessoren',
    productName: 'Prozessor',
    priority: 12,
  },
  'intel processor': {
    category: 'computer-netzwerk',
    subcategory: 'Prozessoren',
    productName: 'Intel Prozessor',
    priority: 12,
  },
  'amd processor': {
    category: 'computer-netzwerk',
    subcategory: 'Prozessoren',
    productName: 'AMD Prozessor',
    priority: 12,
  },
  ryzen: {
    category: 'computer-netzwerk',
    subcategory: 'Prozessoren',
    productName: 'AMD Ryzen',
    priority: 12,
  },
  'core i7': {
    category: 'computer-netzwerk',
    subcategory: 'Prozessoren',
    productName: 'Intel Core i7',
    priority: 12,
  },
  'core i9': {
    category: 'computer-netzwerk',
    subcategory: 'Prozessoren',
    productName: 'Intel Core i9',
    priority: 12,
  },

  // RAM-SPEICHER
  ram: {
    category: 'computer-netzwerk',
    subcategory: 'RAM-Speicher',
    productName: 'RAM',
    priority: 11,
    negativeKeywords: ['animal', 'sheep'],
  },
  memory: {
    category: 'computer-netzwerk',
    subcategory: 'RAM-Speicher',
    productName: 'RAM',
    priority: 11,
    negativeKeywords: ['card', 'storage'],
  },
  ddr4: {
    category: 'computer-netzwerk',
    subcategory: 'RAM-Speicher',
    productName: 'DDR4 RAM',
    priority: 11,
  },
  ddr5: {
    category: 'computer-netzwerk',
    subcategory: 'RAM-Speicher',
    productName: 'DDR5 RAM',
    priority: 12,
  },

  // SSDs & FESTPLATTEN
  ssd: { category: 'computer-netzwerk', subcategory: 'SSDs', productName: 'SSD', priority: 11 },
  'solid state drive': {
    category: 'computer-netzwerk',
    subcategory: 'SSDs',
    productName: 'SSD',
    priority: 11,
  },
  nvme: {
    category: 'computer-netzwerk',
    subcategory: 'SSDs',
    productName: 'NVMe SSD',
    priority: 12,
  },
  'hard drive': {
    category: 'computer-netzwerk',
    subcategory: 'Externe Festplatten',
    productName: 'Festplatte',
    priority: 10,
  },
  'hard disk': {
    category: 'computer-netzwerk',
    subcategory: 'Externe Festplatten',
    productName: 'Festplatte',
    priority: 10,
  },
  'external hard drive': {
    category: 'computer-netzwerk',
    subcategory: 'Externe Festplatten',
    productName: 'Externe Festplatte',
    priority: 11,
  },
  'usb drive': {
    category: 'computer-netzwerk',
    subcategory: 'Externe Festplatten',
    productName: 'USB-Festplatte',
    priority: 10,
  },

  // NAS & SERVER
  nas: {
    category: 'computer-netzwerk',
    subcategory: 'NAS-Systeme',
    productName: 'NAS',
    priority: 11,
  },
  'network attached storage': {
    category: 'computer-netzwerk',
    subcategory: 'NAS-Systeme',
    productName: 'NAS',
    priority: 11,
  },
  server: {
    category: 'computer-netzwerk',
    subcategory: 'Server & Storage',
    productName: 'Server',
    priority: 11,
  },

  // ===== HANDY & TELEFON - SUBKATEGORIEN-SPEZIFISCH =====
  // SMARTPHONES
  'cellular telephone': {
    category: 'handy-telefon',
    subcategory: 'Smartphones',
    productName: 'Smartphone',
    priority: 12,
  },
  'mobile phone': {
    category: 'handy-telefon',
    subcategory: 'Smartphones',
    productName: 'Handy',
    priority: 12,
  },
  smartphone: {
    category: 'handy-telefon',
    subcategory: 'Smartphones',
    productName: 'Smartphone',
    priority: 12,
  },
  'cell phone': {
    category: 'handy-telefon',
    subcategory: 'Smartphones',
    productName: 'Handy',
    priority: 12,
  },
  'android phone': {
    category: 'handy-telefon',
    subcategory: 'Smartphones',
    productName: 'Android Smartphone',
    priority: 11,
  },
  'samsung phone': {
    category: 'handy-telefon',
    subcategory: 'Smartphones',
    productName: 'Samsung Smartphone',
    priority: 11,
  },
  galaxy: {
    category: 'handy-telefon',
    subcategory: 'Smartphones',
    productName: 'Samsung Galaxy',
    priority: 11,
  },
  pixel: {
    category: 'handy-telefon',
    subcategory: 'Smartphones',
    productName: 'Google Pixel',
    priority: 11,
  },
  oneplus: {
    category: 'handy-telefon',
    subcategory: 'Smartphones',
    productName: 'OnePlus',
    priority: 10,
  },
  huawei: {
    category: 'handy-telefon',
    subcategory: 'Smartphones',
    productName: 'Huawei Smartphone',
    priority: 10,
  },
  xiaomi: {
    category: 'handy-telefon',
    subcategory: 'Smartphones',
    productName: 'Xiaomi Smartphone',
    priority: 10,
  },
  phone: {
    category: 'handy-telefon',
    subcategory: 'Smartphones',
    productName: 'Handy',
    priority: 10,
    negativeKeywords: ['desk', 'landline', 'telephone'],
  },

  // IPHONES
  iphone: {
    category: 'handy-telefon',
    subcategory: 'iPhones',
    productName: 'iPhone',
    priority: 13,
  },
  'iphone 15': {
    category: 'handy-telefon',
    subcategory: 'iPhones',
    productName: 'iPhone 15',
    priority: 13,
  },
  'iphone 14': {
    category: 'handy-telefon',
    subcategory: 'iPhones',
    productName: 'iPhone 14',
    priority: 13,
  },
  'iphone 13': {
    category: 'handy-telefon',
    subcategory: 'iPhones',
    productName: 'iPhone 13',
    priority: 13,
  },
  'iphone 12': {
    category: 'handy-telefon',
    subcategory: 'iPhones',
    productName: 'iPhone 12',
    priority: 12,
  },
  'iphone 11': {
    category: 'handy-telefon',
    subcategory: 'iPhones',
    productName: 'iPhone 11',
    priority: 12,
  },
  'iphone se': {
    category: 'handy-telefon',
    subcategory: 'iPhones',
    productName: 'iPhone SE',
    priority: 12,
  },
  'iphone pro': {
    category: 'handy-telefon',
    subcategory: 'iPhones',
    productName: 'iPhone Pro',
    priority: 13,
  },
  'iphone pro max': {
    category: 'handy-telefon',
    subcategory: 'iPhones',
    productName: 'iPhone Pro Max',
    priority: 13,
  },

  // IPODS
  ipod: { category: 'handy-telefon', subcategory: 'iPods', productName: 'iPod', priority: 11 },
  'ipod touch': {
    category: 'handy-telefon',
    subcategory: 'iPods',
    productName: 'iPod Touch',
    priority: 11,
  },
  'ipod nano': {
    category: 'handy-telefon',
    subcategory: 'iPods',
    productName: 'iPod Nano',
    priority: 10,
  },
  'ipod shuffle': {
    category: 'handy-telefon',
    subcategory: 'iPods',
    productName: 'iPod Shuffle',
    priority: 10,
  },

  // SMARTWATCHES
  smartwatch: {
    category: 'uhren-schmuck',
    subcategory: 'Smartwatches',
    productName: 'Smartwatch',
    priority: 12,
  },
  'apple watch': {
    category: 'uhren-schmuck',
    subcategory: 'Smartwatches',
    productName: 'Apple Watch',
    priority: 13,
  },
  'samsung watch': {
    category: 'uhren-schmuck',
    subcategory: 'Smartwatches',
    productName: 'Samsung Watch',
    priority: 12,
  },
  'galaxy watch': {
    category: 'uhren-schmuck',
    subcategory: 'Smartwatches',
    productName: 'Galaxy Watch',
    priority: 12,
  },
  fitbit: {
    category: 'uhren-schmuck',
    subcategory: 'Smartwatches',
    productName: 'Fitbit',
    priority: 11,
  },
  'garmin watch': {
    category: 'uhren-schmuck',
    subcategory: 'Smartwatches',
    productName: 'Garmin Watch',
    priority: 11,
  },

  // TELEFONE
  telephone: {
    category: 'handy-telefon',
    subcategory: 'Telefone',
    productName: 'Telefon',
    priority: 9,
    negativeKeywords: ['desk', 'landline'],
  },
  'landline phone': {
    category: 'handy-telefon',
    subcategory: 'Telefone',
    productName: 'Festnetztelefon',
    priority: 9,
  },
  'cordless phone': {
    category: 'handy-telefon',
    subcategory: 'Telefone',
    productName: 'Schnurlostelefon',
    priority: 9,
  },
  'desk phone': {
    category: 'handy-telefon',
    subcategory: 'Telefone',
    productName: 'Festnetztelefon',
    priority: 9,
  },

  // ===== FOTO & OPTIK - SUBKATEGORIEN-SPEZIFISCH =====
  // SPIEGELREFLEXKAMERAS
  'reflex camera': {
    category: 'foto-optik',
    subcategory: 'Spiegelreflexkameras',
    productName: 'Spiegelreflexkamera',
    priority: 12,
  },
  'dslr camera': {
    category: 'foto-optik',
    subcategory: 'Spiegelreflexkameras',
    productName: 'DSLR Kamera',
    priority: 12,
  },
  dslr: {
    category: 'foto-optik',
    subcategory: 'Spiegelreflexkameras',
    productName: 'DSLR Kamera',
    priority: 12,
  },
  'slr camera': {
    category: 'foto-optik',
    subcategory: 'Spiegelreflexkameras',
    productName: 'SLR Kamera',
    priority: 12,
  },
  slr: {
    category: 'foto-optik',
    subcategory: 'Spiegelreflexkameras',
    productName: 'SLR Kamera',
    priority: 12,
  },
  'canon eos': {
    category: 'foto-optik',
    subcategory: 'Spiegelreflexkameras',
    productName: 'Canon EOS',
    priority: 12,
  },
  'nikon d': {
    category: 'foto-optik',
    subcategory: 'Spiegelreflexkameras',
    productName: 'Nikon DSLR',
    priority: 12,
  },
  'mirrorless camera': {
    category: 'foto-optik',
    subcategory: 'Spiegelreflexkameras',
    productName: 'Spiegellose Kamera',
    priority: 11,
  },

  // DIGITALKAMERAS
  'digital camera': {
    category: 'foto-optik',
    subcategory: 'Digitalkameras',
    productName: 'Digitalkamera',
    priority: 12,
  },
  'compact camera': {
    category: 'foto-optik',
    subcategory: 'Digitalkameras',
    productName: 'Kompaktkamera',
    priority: 11,
  },
  'point and shoot': {
    category: 'foto-optik',
    subcategory: 'Digitalkameras',
    productName: 'Kompaktkamera',
    priority: 11,
  },
  camera: {
    category: 'foto-optik',
    subcategory: 'Digitalkameras',
    productName: 'Kamera',
    priority: 10,
    negativeKeywords: ['phone', 'webcam'],
  },

  // ANALOGE KAMERAS
  'polaroid camera': {
    category: 'foto-optik',
    subcategory: 'Analoge Kameras',
    productName: 'Polaroid Kamera',
    priority: 10,
  },
  'instant camera': {
    category: 'foto-optik',
    subcategory: 'Analoge Kameras',
    productName: 'Sofortbildkamera',
    priority: 10,
  },
  'film camera': {
    category: 'foto-optik',
    subcategory: 'Analoge Kameras',
    productName: 'Analogkamera',
    priority: 10,
  },
  'analog camera': {
    category: 'foto-optik',
    subcategory: 'Analoge Kameras',
    productName: 'Analogkamera',
    priority: 10,
  },
  '35mm camera': {
    category: 'foto-optik',
    subcategory: 'Analoge Kameras',
    productName: '35mm Kamera',
    priority: 10,
  },

  // OBJEKTIVE
  lens: {
    category: 'foto-optik',
    subcategory: 'Objektive',
    productName: 'Objektiv',
    priority: 11,
    negativeKeywords: ['eye', 'contact'],
  },
  'camera lens': {
    category: 'foto-optik',
    subcategory: 'Objektive',
    productName: 'Objektiv',
    priority: 11,
  },
  'telephoto lens': {
    category: 'foto-optik',
    subcategory: 'Objektive',
    productName: 'Teleobjektiv',
    priority: 11,
  },
  'wide angle lens': {
    category: 'foto-optik',
    subcategory: 'Objektive',
    productName: 'Weitwinkelobjektiv',
    priority: 11,
  },
  'zoom lens': {
    category: 'foto-optik',
    subcategory: 'Objektive',
    productName: 'Zoomobjektiv',
    priority: 11,
  },
  'macro lens': {
    category: 'foto-optik',
    subcategory: 'Objektive',
    productName: 'Makroobjektiv',
    priority: 10,
  },
  'prime lens': {
    category: 'foto-optik',
    subcategory: 'Objektive',
    productName: 'Festbrennweite',
    priority: 10,
  },
  'lens cap': {
    category: 'foto-optik',
    subcategory: 'Objektive',
    productName: 'Objektivdeckel',
    priority: 8,
  },

  // DROHNEN
  drone: {
    category: 'foto-optik',
    subcategory: 'Drohnen mit Kamera',
    productName: 'Drohne',
    priority: 12,
  },
  quadcopter: {
    category: 'foto-optik',
    subcategory: 'Drohnen mit Kamera',
    productName: 'Drohne',
    priority: 12,
  },
  uav: { category: 'foto-optik', subcategory: 'Drohnen', productName: 'Drohne', priority: 11 },
  dji: {
    category: 'foto-optik',
    subcategory: 'Drohnen mit Kamera',
    productName: 'DJI Drohne',
    priority: 12,
  },
  phantom: {
    category: 'foto-optik',
    subcategory: 'Drohnen mit Kamera',
    productName: 'DJI Phantom',
    priority: 12,
  },
  mavic: {
    category: 'foto-optik',
    subcategory: 'Drohnen mit Kamera',
    productName: 'DJI Mavic',
    priority: 12,
  },

  // FERNGLÄSER & TELESKOPE
  binoculars: {
    category: 'foto-optik',
    subcategory: 'Ferngläser',
    productName: 'Fernglas',
    priority: 10,
  },
  telescope: {
    category: 'foto-optik',
    subcategory: 'Teleskope',
    productName: 'Teleskop',
    priority: 10,
  },
  microscope: {
    category: 'foto-optik',
    subcategory: 'Mikroskope',
    productName: 'Mikroskop',
    priority: 9,
  },

  // STATIVE
  tripod: { category: 'foto-optik', subcategory: 'Stative', productName: 'Stativ', priority: 9 },
  'camera tripod': {
    category: 'foto-optik',
    subcategory: 'Stative',
    productName: 'Kamerastativ',
    priority: 9,
  },
  monopod: { category: 'foto-optik', subcategory: 'Stative', productName: 'Monopod', priority: 8 },

  // BLITZGERÄTE
  flash: {
    category: 'foto-optik',
    subcategory: 'Blitzgeräte',
    productName: 'Blitzgerät',
    priority: 9,
    negativeKeywords: ['light', 'lamp'],
  },
  'camera flash': {
    category: 'foto-optik',
    subcategory: 'Blitzgeräte',
    productName: 'Blitzgerät',
    priority: 9,
  },
  speedlight: {
    category: 'foto-optik',
    subcategory: 'Blitzgeräte',
    productName: 'Blitzgerät',
    priority: 9,
  },
  flashgun: {
    category: 'foto-optik',
    subcategory: 'Blitzgeräte',
    productName: 'Blitzgerät',
    priority: 9,
  },

  // ===== UHREN & SCHMUCK - SUBKATEGORIEN-SPEZIFISCH =====
  // ARMBANDUHREN HERREN
  wristwatch: {
    category: 'uhren-schmuck',
    subcategory: 'Armbanduhren Herren',
    productName: 'Armbanduhr',
    priority: 12,
  },
  watch: {
    category: 'uhren-schmuck',
    subcategory: 'Armbanduhren Herren',
    productName: 'Armbanduhr',
    priority: 11,
    negativeKeywords: ['clock', 'wall', 'desk'],
  },
  'analog watch': {
    category: 'uhren-schmuck',
    subcategory: 'Armbanduhren Herren',
    productName: 'Armbanduhr',
    priority: 11,
  },
  'digital watch': {
    category: 'uhren-schmuck',
    subcategory: 'Armbanduhren Herren',
    productName: 'Digitaluhr',
    priority: 11,
  },
  rolex: {
    category: 'uhren-schmuck',
    subcategory: 'Armbanduhren Herren',
    productName: 'Rolex',
    priority: 13,
  },
  omega: {
    category: 'uhren-schmuck',
    subcategory: 'Armbanduhren Herren',
    productName: 'Omega',
    priority: 13,
  },
  'patek philippe': {
    category: 'uhren-schmuck',
    subcategory: 'Armbanduhren Herren',
    productName: 'Patek Philippe',
    priority: 13,
  },
  'audemars piguet': {
    category: 'uhren-schmuck',
    subcategory: 'Armbanduhren Herren',
    productName: 'Audemars Piguet',
    priority: 13,
  },
  breitling: {
    category: 'uhren-schmuck',
    subcategory: 'Armbanduhren Herren',
    productName: 'Breitling',
    priority: 12,
  },
  'tag heuer': {
    category: 'uhren-schmuck',
    subcategory: 'Armbanduhren Herren',
    productName: 'Tag Heuer',
    priority: 12,
  },
  'cartier watch': {
    category: 'uhren-schmuck',
    subcategory: 'Armbanduhren Herren',
    productName: 'Cartier',
    priority: 12,
  },
  iwc: {
    category: 'uhren-schmuck',
    subcategory: 'Armbanduhren Herren',
    productName: 'IWC',
    priority: 12,
  },
  panerai: {
    category: 'uhren-schmuck',
    subcategory: 'Armbanduhren Herren',
    productName: 'Panerai',
    priority: 12,
  },
  tudor: {
    category: 'uhren-schmuck',
    subcategory: 'Armbanduhren Herren',
    productName: 'Tudor',
    priority: 12,
  },
  seiko: {
    category: 'uhren-schmuck',
    subcategory: 'Armbanduhren Herren',
    productName: 'Seiko',
    priority: 11,
  },
  citizen: {
    category: 'uhren-schmuck',
    subcategory: 'Armbanduhren Herren',
    productName: 'Citizen',
    priority: 11,
  },
  'casio watch': {
    category: 'uhren-schmuck',
    subcategory: 'Armbanduhren Herren',
    productName: 'Casio',
    priority: 11,
  },

  // ARMBANDUHREN DAMEN
  'ladies watch': {
    category: 'uhren-schmuck',
    subcategory: 'Armbanduhren Damen',
    productName: 'Damenuhr',
    priority: 11,
  },
  'women watch': {
    category: 'uhren-schmuck',
    subcategory: 'Armbanduhren Damen',
    productName: 'Damenuhr',
    priority: 11,
  },

  // WANDUHREN
  'analog clock': {
    category: 'uhren-schmuck',
    subcategory: 'Wanduhren',
    productName: 'Wanduhr',
    priority: 9,
    negativeKeywords: ['wrist', 'watch'],
  },
  'digital clock': {
    category: 'uhren-schmuck',
    subcategory: 'Wanduhren',
    productName: 'Wanduhr',
    priority: 9,
    negativeKeywords: ['wrist', 'watch'],
  },
  'wall clock': {
    category: 'uhren-schmuck',
    subcategory: 'Wanduhren',
    productName: 'Wanduhr',
    priority: 9,
  },
  'grandfather clock': {
    category: 'uhren-schmuck',
    subcategory: 'Wanduhren',
    productName: 'Standuhr',
    priority: 9,
  },

  // KETTEN & ANHÄNGER
  necklace: {
    category: 'uhren-schmuck',
    subcategory: 'Ketten & Anhänger',
    productName: 'Halskette',
    priority: 10,
  },
  pendant: {
    category: 'uhren-schmuck',
    subcategory: 'Ketten & Anhänger',
    productName: 'Anhänger',
    priority: 9,
  },
  chain: {
    category: 'uhren-schmuck',
    subcategory: 'Ketten & Anhänger',
    productName: 'Kette',
    priority: 9,
    negativeKeywords: ['bicycle', 'motorcycle'],
  },
  'gold chain': {
    category: 'uhren-schmuck',
    subcategory: 'Ketten & Anhänger',
    productName: 'Goldkette',
    priority: 10,
  },
  'silver chain': {
    category: 'uhren-schmuck',
    subcategory: 'Ketten & Anhänger',
    productName: 'Silberkette',
    priority: 10,
  },

  // ARMBÄNDER
  bracelet: {
    category: 'uhren-schmuck',
    subcategory: 'Armbänder',
    productName: 'Armband',
    priority: 10,
  },
  bangle: {
    category: 'uhren-schmuck',
    subcategory: 'Armbänder',
    productName: 'Armreif',
    priority: 9,
  },
  cuff: {
    category: 'uhren-schmuck',
    subcategory: 'Armbänder',
    productName: 'Armband',
    priority: 9,
    negativeKeywords: ['shirt', 'clothing'],
  },

  // RINGE
  ring: {
    category: 'uhren-schmuck',
    subcategory: 'Ringe',
    productName: 'Ring',
    priority: 10,
    negativeKeywords: ['phone', 'call'],
  },
  'wedding ring': {
    category: 'uhren-schmuck',
    subcategory: 'Ringe',
    productName: 'Ehering',
    priority: 11,
  },
  'engagement ring': {
    category: 'uhren-schmuck',
    subcategory: 'Ringe',
    productName: 'Verlobungsring',
    priority: 11,
  },
  'diamond ring': {
    category: 'uhren-schmuck',
    subcategory: 'Ringe',
    productName: 'Diamantring',
    priority: 11,
  },
  'gold ring': {
    category: 'uhren-schmuck',
    subcategory: 'Ringe',
    productName: 'Goldring',
    priority: 10,
  },
  'silver ring': {
    category: 'uhren-schmuck',
    subcategory: 'Ringe',
    productName: 'Silberring',
    priority: 10,
  },

  // OHRRINGE
  earring: {
    category: 'uhren-schmuck',
    subcategory: 'Ohrringe',
    productName: 'Ohrring',
    priority: 10,
  },
  earrings: {
    category: 'uhren-schmuck',
    subcategory: 'Ohrringe',
    productName: 'Ohrringe',
    priority: 10,
  },
  'stud earrings': {
    category: 'uhren-schmuck',
    subcategory: 'Ohrringe',
    productName: 'Ohrstecker',
    priority: 10,
  },
  'hoop earrings': {
    category: 'uhren-schmuck',
    subcategory: 'Ohrringe',
    productName: 'Ohrringe',
    priority: 10,
  },

  // BROSCHEN
  brooch: {
    category: 'uhren-schmuck',
    subcategory: 'Broschen',
    productName: 'Brosche',
    priority: 9,
  },
  pin: {
    category: 'uhren-schmuck',
    subcategory: 'Broschen',
    productName: 'Brosche',
    priority: 9,
    negativeKeywords: ['bowling', 'safety'],
  },

  // ===== KLEIDUNG & ACCESSOIRES - SUBKATEGORIEN-SPEZIFISCH =====
  // SCHUHE - SNEAKERS HERREN
  'running shoe': {
    category: 'kleidung-accessoires',
    subcategory: 'Sneakers Herren',
    productName: 'Laufschuh',
    priority: 11,
  },
  sneaker: {
    category: 'kleidung-accessoires',
    subcategory: 'Sneakers Herren',
    productName: 'Sneaker',
    priority: 11,
  },
  sneakers: {
    category: 'kleidung-accessoires',
    subcategory: 'Sneakers Herren',
    productName: 'Sneakers',
    priority: 11,
  },
  'athletic shoe': {
    category: 'kleidung-accessoires',
    subcategory: 'Sneakers Herren',
    productName: 'Sportschuh',
    priority: 11,
  },
  'sport shoe': {
    category: 'kleidung-accessoires',
    subcategory: 'Sneakers Herren',
    productName: 'Sportschuh',
    priority: 11,
  },
  nike: {
    category: 'kleidung-accessoires',
    subcategory: 'Sneakers Herren',
    productName: 'Nike Sneaker',
    priority: 12,
  },
  adidas: {
    category: 'kleidung-accessoires',
    subcategory: 'Sneakers Herren',
    productName: 'Adidas Sneaker',
    priority: 12,
  },
  puma: {
    category: 'kleidung-accessoires',
    subcategory: 'Sneakers Herren',
    productName: 'Puma Sneaker',
    priority: 11,
  },
  'new balance': {
    category: 'kleidung-accessoires',
    subcategory: 'Sneakers Herren',
    productName: 'New Balance Sneaker',
    priority: 11,
  },
  converse: {
    category: 'kleidung-accessoires',
    subcategory: 'Sneakers Herren',
    productName: 'Converse Sneaker',
    priority: 11,
  },
  vans: {
    category: 'kleidung-accessoires',
    subcategory: 'Sneakers Herren',
    productName: 'Vans Sneaker',
    priority: 11,
  },

  // SCHUHE - HERRENSCHUHE
  loafer: {
    category: 'kleidung-accessoires',
    subcategory: 'Herrenschuhe',
    productName: 'Loafer',
    priority: 10,
  },
  'oxford shoe': {
    category: 'kleidung-accessoires',
    subcategory: 'Herrenschuhe',
    productName: 'Oxford',
    priority: 10,
  },
  'derby shoe': {
    category: 'kleidung-accessoires',
    subcategory: 'Herrenschuhe',
    productName: 'Derby',
    priority: 10,
  },
  'dress shoe': {
    category: 'kleidung-accessoires',
    subcategory: 'Herrenschuhe',
    productName: 'Anzugschuh',
    priority: 10,
  },
  'leather shoe': {
    category: 'kleidung-accessoires',
    subcategory: 'Herrenschuhe',
    productName: 'Lederschuh',
    priority: 9,
  },

  // SCHUHE - SANDALEN
  sandal: {
    category: 'kleidung-accessoires',
    subcategory: 'Sandalen',
    productName: 'Sandale',
    priority: 10,
  },
  sandals: {
    category: 'kleidung-accessoires',
    subcategory: 'Sandalen',
    productName: 'Sandalen',
    priority: 10,
  },
  'flip flop': {
    category: 'kleidung-accessoires',
    subcategory: 'Sandalen',
    productName: 'Flip-Flop',
    priority: 9,
  },
  'flip flops': {
    category: 'kleidung-accessoires',
    subcategory: 'Sandalen',
    productName: 'Flip-Flops',
    priority: 9,
  },

  // SCHUHE - STIEFEL
  boot: {
    category: 'kleidung-accessoires',
    subcategory: 'Stiefel',
    productName: 'Stiefel',
    priority: 10,
    negativeKeywords: ['car', 'trunk'],
  },
  boots: {
    category: 'kleidung-accessoires',
    subcategory: 'Stiefel',
    productName: 'Stiefel',
    priority: 10,
  },
  'cowboy boot': {
    category: 'kleidung-accessoires',
    subcategory: 'Boots',
    productName: 'Cowboy Stiefel',
    priority: 10,
  },
  'hiking boot': {
    category: 'kleidung-accessoires',
    subcategory: 'Stiefel',
    productName: 'Wanderstiefel',
    priority: 10,
  },
  'work boot': {
    category: 'kleidung-accessoires',
    subcategory: 'Stiefel',
    productName: 'Arbeitsstiefel',
    priority: 9,
  },
  'combat boot': {
    category: 'kleidung-accessoires',
    subcategory: 'Stiefel',
    productName: 'Kampfstiefel',
    priority: 9,
  },

  // SCHUHE - PUMPS
  pump: {
    category: 'kleidung-accessoires',
    subcategory: 'Pumps',
    productName: 'Pumps',
    priority: 10,
  },
  'high heel': {
    category: 'kleidung-accessoires',
    subcategory: 'Pumps',
    productName: 'High Heel',
    priority: 10,
  },
  'high heels': {
    category: 'kleidung-accessoires',
    subcategory: 'Pumps',
    productName: 'High Heels',
    priority: 10,
  },
  stiletto: {
    category: 'kleidung-accessoires',
    subcategory: 'Pumps',
    productName: 'Stiletto',
    priority: 10,
  },

  // BRILLEN - SONNENBRILLEN
  sunglasses: {
    category: 'kleidung-accessoires',
    subcategory: 'Sonnenbrillen',
    productName: 'Sonnenbrille',
    priority: 11,
  },
  sunglass: {
    category: 'kleidung-accessoires',
    subcategory: 'Sonnenbrillen',
    productName: 'Sonnenbrille',
    priority: 11,
  },
  'ray ban': {
    category: 'kleidung-accessoires',
    subcategory: 'Markensonnenbrillen',
    productName: 'Ray-Ban',
    priority: 12,
  },
  oakley: {
    category: 'kleidung-accessoires',
    subcategory: 'Markensonnenbrillen',
    productName: 'Oakley',
    priority: 12,
  },
  persol: {
    category: 'kleidung-accessoires',
    subcategory: 'Markensonnenbrillen',
    productName: 'Persol',
    priority: 11,
  },
  'maui jim': {
    category: 'kleidung-accessoires',
    subcategory: 'Markensonnenbrillen',
    productName: 'Maui Jim',
    priority: 11,
  },

  // BRILLEN - BRILLEN
  glasses: {
    category: 'kleidung-accessoires',
    subcategory: 'Brillen',
    productName: 'Brille',
    priority: 10,
    negativeKeywords: ['wine', 'drink'],
  },
  eyeglasses: {
    category: 'kleidung-accessoires',
    subcategory: 'Brillen',
    productName: 'Brille',
    priority: 10,
  },
  'reading glasses': {
    category: 'kleidung-accessoires',
    subcategory: 'Brillen',
    productName: 'Lesebrille',
    priority: 10,
  },
  spectacles: {
    category: 'kleidung-accessoires',
    subcategory: 'Brillen',
    productName: 'Brille',
    priority: 9,
  },

  // TASCHEN - RUCKSÄCKE
  backpack: {
    category: 'kleidung-accessoires',
    subcategory: 'Rucksäcke',
    productName: 'Rucksack',
    priority: 11,
  },
  rucksack: {
    category: 'kleidung-accessoires',
    subcategory: 'Rucksäcke',
    productName: 'Rucksack',
    priority: 11,
  },
  'hiking backpack': {
    category: 'kleidung-accessoires',
    subcategory: 'Rucksäcke',
    productName: 'Wanderrucksack',
    priority: 11,
  },
  'school backpack': {
    category: 'kleidung-accessoires',
    subcategory: 'Rucksäcke',
    productName: 'Schulrucksack',
    priority: 10,
  },
  'laptop backpack': {
    category: 'kleidung-accessoires',
    subcategory: 'Rucksäcke',
    productName: 'Laptop-Rucksack',
    priority: 11,
  },

  // TASCHEN - HANDTASCHEN
  handbag: {
    category: 'kleidung-accessoires',
    subcategory: 'Taschen & Handtaschen',
    productName: 'Handtasche',
    priority: 11,
  },
  purse: {
    category: 'kleidung-accessoires',
    subcategory: 'Taschen & Handtaschen',
    productName: 'Geldbörse',
    priority: 10,
  },
  'shoulder bag': {
    category: 'kleidung-accessoires',
    subcategory: 'Taschen & Handtaschen',
    productName: 'Umhängetasche',
    priority: 10,
  },
  'tote bag': {
    category: 'kleidung-accessoires',
    subcategory: 'Taschen & Handtaschen',
    productName: 'Einkaufstasche',
    priority: 10,
  },
  clutch: {
    category: 'kleidung-accessoires',
    subcategory: 'Clutches',
    productName: 'Clutch',
    priority: 10,
  },
  'messenger bag': {
    category: 'kleidung-accessoires',
    subcategory: 'Taschen & Handtaschen',
    productName: 'Umhängetasche',
    priority: 10,
  },

  // TASCHEN - KOFFER
  suitcase: {
    category: 'kleidung-accessoires',
    subcategory: 'Koffer',
    productName: 'Koffer',
    priority: 10,
  },
  luggage: {
    category: 'kleidung-accessoires',
    subcategory: 'Koffer',
    productName: 'Gepäck',
    priority: 9,
  },
  trolley: {
    category: 'kleidung-accessoires',
    subcategory: 'Trolleys',
    productName: 'Trolley',
    priority: 10,
  },
  'rolling suitcase': {
    category: 'kleidung-accessoires',
    subcategory: 'Trolleys',
    productName: 'Trolley',
    priority: 10,
  },
  'travel suitcase': {
    category: 'kleidung-accessoires',
    subcategory: 'Koffer',
    productName: 'Reisekoffer',
    priority: 10,
  },

  // GELDBÖRSEN
  wallet: {
    category: 'kleidung-accessoires',
    subcategory: 'Geldbörsen',
    productName: 'Geldbeutel',
    priority: 10,
  },
  'money clip': {
    category: 'kleidung-accessoires',
    subcategory: 'Geldbörsen',
    productName: 'Geldklammer',
    priority: 9,
  },
  'card holder': {
    category: 'kleidung-accessoires',
    subcategory: 'Geldbörsen',
    productName: 'Kartenhalter',
    priority: 9,
  },

  // KLEIDUNG - JEANS
  jean: {
    category: 'kleidung-accessoires',
    subcategory: 'Jeans',
    productName: 'Jeans',
    priority: 10,
  },
  jeans: {
    category: 'kleidung-accessoires',
    subcategory: 'Jeans',
    productName: 'Jeans',
    priority: 10,
  },
  denim: {
    category: 'kleidung-accessoires',
    subcategory: 'Jeans',
    productName: 'Jeans',
    priority: 9,
  },
  'denim jeans': {
    category: 'kleidung-accessoires',
    subcategory: 'Jeans',
    productName: 'Jeans',
    priority: 10,
  },

  // KLEIDUNG - ANZÜGE & SAKKOS
  suit: {
    category: 'kleidung-accessoires',
    subcategory: 'Anzüge & Sakkos',
    productName: 'Anzug',
    priority: 10,
  },
  blazer: {
    category: 'kleidung-accessoires',
    subcategory: 'Anzüge & Sakkos',
    productName: 'Sakko',
    priority: 10,
  },
  'suit jacket': {
    category: 'kleidung-accessoires',
    subcategory: 'Anzüge & Sakkos',
    productName: 'Sakko',
    priority: 10,
  },
  'sports jacket': {
    category: 'kleidung-accessoires',
    subcategory: 'Anzüge & Sakkos',
    productName: 'Sakko',
    priority: 9,
  },

  // KLEIDUNG - KRAWATTEN
  tie: {
    category: 'kleidung-accessoires',
    subcategory: 'Krawatten',
    productName: 'Krawatte',
    priority: 9,
    negativeKeywords: ['rope', 'string'],
  },
  'neck tie': {
    category: 'kleidung-accessoires',
    subcategory: 'Krawatten',
    productName: 'Krawatte',
    priority: 9,
  },
  'bow tie': {
    category: 'kleidung-accessoires',
    subcategory: 'Krawatten',
    productName: 'Fliege',
    priority: 9,
  },

  // KLEIDUNG - HEMDEN
  shirt: {
    category: 'kleidung-accessoires',
    subcategory: 'Hemden',
    productName: 'Hemd',
    priority: 10,
  },
  'dress shirt': {
    category: 'kleidung-accessoires',
    subcategory: 'Hemden',
    productName: 'Hemd',
    priority: 10,
  },
  'button down shirt': {
    category: 'kleidung-accessoires',
    subcategory: 'Hemden',
    productName: 'Hemd',
    priority: 10,
  },

  // KLEIDUNG - T-SHIRTS
  't-shirt': {
    category: 'kleidung-accessoires',
    subcategory: 'T-Shirts',
    productName: 'T-Shirt',
    priority: 10,
  },
  tshirt: {
    category: 'kleidung-accessoires',
    subcategory: 'T-Shirts',
    productName: 'T-Shirt',
    priority: 10,
  },
  tee: {
    category: 'kleidung-accessoires',
    subcategory: 'T-Shirts',
    productName: 'T-Shirt',
    priority: 9,
  },
  't shirt': {
    category: 'kleidung-accessoires',
    subcategory: 'T-Shirts',
    productName: 'T-Shirt',
    priority: 10,
  },

  // KLEIDUNG - JACKEN
  jacket: {
    category: 'kleidung-accessoires',
    subcategory: 'Jacken',
    productName: 'Jacke',
    priority: 10,
  },
  windbreaker: {
    category: 'kleidung-accessoires',
    subcategory: 'Jacken',
    productName: 'Windjacke',
    priority: 10,
  },
  'bomber jacket': {
    category: 'kleidung-accessoires',
    subcategory: 'Jacken',
    productName: 'Bomberjacke',
    priority: 10,
  },
  'leather jacket': {
    category: 'kleidung-accessoires',
    subcategory: 'Jacken',
    productName: 'Lederjacke',
    priority: 11,
  },

  // KLEIDUNG - MÄNTEL
  coat: {
    category: 'kleidung-accessoires',
    subcategory: 'Mäntel',
    productName: 'Mantel',
    priority: 10,
  },
  'winter coat': {
    category: 'kleidung-accessoires',
    subcategory: 'Mäntel',
    productName: 'Wintermantel',
    priority: 10,
  },
  overcoat: {
    category: 'kleidung-accessoires',
    subcategory: 'Mäntel',
    productName: 'Mantel',
    priority: 10,
  },

  // KLEIDUNG - KLEIDER
  dress: {
    category: 'kleidung-accessoires',
    subcategory: 'Kleider',
    productName: 'Kleid',
    priority: 10,
  },
  'evening dress': {
    category: 'kleidung-accessoires',
    subcategory: 'Kleider',
    productName: 'Abendkleid',
    priority: 10,
  },
  'summer dress': {
    category: 'kleidung-accessoires',
    subcategory: 'Kleider',
    productName: 'Sommerkleid',
    priority: 10,
  },

  // KLEIDUNG - HOSEN
  pants: {
    category: 'kleidung-accessoires',
    subcategory: 'Hosen',
    productName: 'Hose',
    priority: 9,
  },
  trousers: {
    category: 'kleidung-accessoires',
    subcategory: 'Hosen',
    productName: 'Hose',
    priority: 9,
  },
  chinos: {
    category: 'kleidung-accessoires',
    subcategory: 'Hosen',
    productName: 'Chinos',
    priority: 9,
  },
  'cargo pants': {
    category: 'kleidung-accessoires',
    subcategory: 'Hosen',
    productName: 'Cargohose',
    priority: 9,
  },

  // KLEIDUNG - PULLOVER & STRICKJACKEN
  sweater: {
    category: 'kleidung-accessoires',
    subcategory: 'Pullover & Strickjacken',
    productName: 'Pullover',
    priority: 9,
  },
  hoodie: {
    category: 'kleidung-accessoires',
    subcategory: 'Pullover & Strickjacken',
    productName: 'Hoodie',
    priority: 9,
  },
  cardigan: {
    category: 'kleidung-accessoires',
    subcategory: 'Pullover & Strickjacken',
    productName: 'Cardigan',
    priority: 9,
  },

  // ACCESSOIRES - GÜRTEL
  belt: {
    category: 'kleidung-accessoires',
    subcategory: 'Gürtel',
    productName: 'Gürtel',
    priority: 9,
    negativeKeywords: ['road', 'highway'],
  },
  'leather belt': {
    category: 'kleidung-accessoires',
    subcategory: 'Gürtel',
    productName: 'Ledergürtel',
    priority: 9,
  },

  // ACCESSOIRES - HÜTE & MÜTZEN
  hat: {
    category: 'kleidung-accessoires',
    subcategory: 'Hüte & Mützen',
    productName: 'Hut',
    priority: 9,
  },
  cap: {
    category: 'kleidung-accessoires',
    subcategory: 'Hüte & Mützen',
    productName: 'Kappe',
    priority: 9,
  },
  'baseball cap': {
    category: 'kleidung-accessoires',
    subcategory: 'Hüte & Mützen',
    productName: 'Baseballkappe',
    priority: 9,
  },
  beanie: {
    category: 'kleidung-accessoires',
    subcategory: 'Hüte & Mützen',
    productName: 'Mütze',
    priority: 9,
  },

  // ACCESSOIRES - SCHALS & TÜCHER
  scarf: {
    category: 'kleidung-accessoires',
    subcategory: 'Schals & Tücher',
    productName: 'Schal',
    priority: 9,
  },
  'neck scarf': {
    category: 'kleidung-accessoires',
    subcategory: 'Schals & Tücher',
    productName: 'Schal',
    priority: 9,
  },

  // ACCESSOIRES - HANDSCHUHE
  glove: {
    category: 'kleidung-accessoires',
    subcategory: 'Handschuhe',
    productName: 'Handschuh',
    priority: 9,
  },
  gloves: {
    category: 'kleidung-accessoires',
    subcategory: 'Handschuhe',
    productName: 'Handschuhe',
    priority: 9,
  },
  'winter gloves': {
    category: 'kleidung-accessoires',
    subcategory: 'Handschuhe',
    productName: 'Winterhandschuhe',
    priority: 9,
  },

  // ===== HAUSHALT & WOHNEN (MASSIV ERWEITERT) =====
  'table lamp': {
    category: 'haushalt-wohnen',
    subcategory: 'Tischlampen',
    productName: 'Tischlampe',
    priority: 8,
  },
  lamp: {
    category: 'haushalt-wohnen',
    subcategory: 'Tischlampen',
    productName: 'Lampe',
    priority: 7,
    negativeKeywords: ['car', 'vehicle'],
  },
  lampshade: {
    category: 'haushalt-wohnen',
    subcategory: 'Lampen & Leuchten',
    productName: 'Lampenschirm',
    priority: 7,
  },
  vacuum: {
    category: 'haushalt-wohnen',
    subcategory: 'Staubsauger',
    productName: 'Staubsauger',
    priority: 9,
  },
  'vacuum cleaner': {
    category: 'haushalt-wohnen',
    subcategory: 'Staubsauger',
    productName: 'Staubsauger',
    priority: 9,
  },
  refrigerator: {
    category: 'haushalt-wohnen',
    subcategory: 'Kühlschränke',
    productName: 'Kühlschrank',
    priority: 10,
  },
  fridge: {
    category: 'haushalt-wohnen',
    subcategory: 'Kühlschränke',
    productName: 'Kühlschrank',
    priority: 10,
  },
  washer: {
    category: 'haushalt-wohnen',
    subcategory: 'Waschmaschinen',
    productName: 'Waschmaschine',
    priority: 10,
  },
  'washing machine': {
    category: 'haushalt-wohnen',
    subcategory: 'Waschmaschinen',
    productName: 'Waschmaschine',
    priority: 10,
  },
  dryer: {
    category: 'haushalt-wohnen',
    subcategory: 'Trockner',
    productName: 'Trockner',
    priority: 9,
  },
  'tumble dryer': {
    category: 'haushalt-wohnen',
    subcategory: 'Trockner',
    productName: 'Trockner',
    priority: 9,
  },
  microwave: {
    category: 'haushalt-wohnen',
    subcategory: 'Küchengeräte',
    productName: 'Mikrowelle',
    priority: 9,
  },
  'microwave oven': {
    category: 'haushalt-wohnen',
    subcategory: 'Küchengeräte',
    productName: 'Mikrowelle',
    priority: 9,
  },
  toaster: {
    category: 'haushalt-wohnen',
    subcategory: 'Toaster',
    productName: 'Toaster',
    priority: 8,
  },
  oven: {
    category: 'haushalt-wohnen',
    subcategory: 'Backöfen',
    productName: 'Backofen',
    priority: 9,
  },
  stove: { category: 'haushalt-wohnen', subcategory: 'Herd', productName: 'Herd', priority: 9 },
  dishwasher: {
    category: 'haushalt-wohnen',
    subcategory: 'Geschirrspüler',
    productName: 'Geschirrspüler',
    priority: 9,
  },
  'coffee maker': {
    category: 'haushalt-wohnen',
    subcategory: 'Kaffeemaschinen',
    productName: 'Kaffeemaschine',
    priority: 8,
  },
  'coffee machine': {
    category: 'haushalt-wohnen',
    subcategory: 'Kaffeemaschinen',
    productName: 'Kaffeemaschine',
    priority: 8,
  },
  blender: {
    category: 'haushalt-wohnen',
    subcategory: 'Küchengeräte',
    productName: 'Mixer',
    priority: 8,
  },
  mixer: {
    category: 'haushalt-wohnen',
    subcategory: 'Küchengeräte',
    productName: 'Mixer',
    priority: 8,
    negativeKeywords: ['audio', 'sound'],
  },
  couch: {
    category: 'haushalt-wohnen',
    subcategory: 'Sofas & Sessel',
    productName: 'Couch',
    priority: 9,
  },
  sofa: {
    category: 'haushalt-wohnen',
    subcategory: 'Sofas & Sessel',
    productName: 'Sofa',
    priority: 9,
  },
  chair: { category: 'haushalt-wohnen', subcategory: 'Stühle', productName: 'Stuhl', priority: 8 },
  armchair: {
    category: 'haushalt-wohnen',
    subcategory: 'Sofas & Sessel',
    productName: 'Sessel',
    priority: 8,
  },
  table: {
    category: 'haushalt-wohnen',
    subcategory: 'Tische & Stühle',
    productName: 'Tisch',
    priority: 8,
    negativeKeywords: ['periodic', 'chart'],
  },
  'dining table': {
    category: 'haushalt-wohnen',
    subcategory: 'Tische & Stühle',
    productName: 'Esstisch',
    priority: 9,
  },
  'coffee table': {
    category: 'haushalt-wohnen',
    subcategory: 'Tische & Stühle',
    productName: 'Couchtisch',
    priority: 8,
  },
  desk: {
    category: 'haushalt-wohnen',
    subcategory: 'Schreibtische',
    productName: 'Schreibtisch',
    priority: 8,
  },
  bookcase: {
    category: 'haushalt-wohnen',
    subcategory: 'Bücherregale',
    productName: 'Bücherregal',
    priority: 8,
  },
  bookshelf: {
    category: 'haushalt-wohnen',
    subcategory: 'Bücherregale',
    productName: 'Bücherregal',
    priority: 8,
  },
  wardrobe: {
    category: 'haushalt-wohnen',
    subcategory: 'Kleiderschränke',
    productName: 'Kleiderschrank',
    priority: 8,
  },
  closet: {
    category: 'haushalt-wohnen',
    subcategory: 'Kleiderschränke',
    productName: 'Kleiderschrank',
    priority: 8,
  },
  pillow: {
    category: 'haushalt-wohnen',
    subcategory: 'Kissen',
    productName: 'Kissen',
    priority: 7,
  },
  cushion: {
    category: 'haushalt-wohnen',
    subcategory: 'Kissen',
    productName: 'Kissen',
    priority: 7,
  },
  bed: { category: 'haushalt-wohnen', subcategory: 'Betten', productName: 'Bett', priority: 9 },
  mattress: {
    category: 'haushalt-wohnen',
    subcategory: 'Matratzen',
    productName: 'Matratze',
    priority: 8,
  },
  curtain: {
    category: 'haushalt-wohnen',
    subcategory: 'Vorhang',
    productName: 'Vorhang',
    priority: 7,
  },
  carpet: {
    category: 'haushalt-wohnen',
    subcategory: 'Teppiche',
    productName: 'Teppich',
    priority: 8,
  },
  rug: {
    category: 'haushalt-wohnen',
    subcategory: 'Teppiche',
    productName: 'Teppich',
    priority: 8,
  },

  // ===== SPORT (MASSIV ERWEITERT) =====
  'mountain bike': {
    category: 'sport',
    subcategory: 'Mountainbikes',
    productName: 'Mountainbike',
    priority: 10,
  },
  bicycle: { category: 'sport', subcategory: 'Fahrräder', productName: 'Fahrrad', priority: 10 },
  bike: {
    category: 'sport',
    subcategory: 'Fahrräder',
    productName: 'Fahrrad',
    priority: 9,
    negativeKeywords: ['motorcycle', 'motor'],
  },
  'road bike': { category: 'sport', subcategory: 'Fahrräder', productName: 'Rennrad', priority: 9 },
  'racing bicycle': {
    category: 'sport',
    subcategory: 'Fahrräder',
    productName: 'Rennrad',
    priority: 9,
  },
  'e-bike': { category: 'sport', subcategory: 'E-Bikes', productName: 'E-Bike', priority: 10 },
  'electric bicycle': {
    category: 'sport',
    subcategory: 'E-Bikes',
    productName: 'E-Bike',
    priority: 10,
  },
  treadmill: { category: 'sport', subcategory: 'Laufbänder', productName: 'Laufband', priority: 9 },
  dumbbell: { category: 'sport', subcategory: 'Hanteln', productName: 'Hantel', priority: 9 },
  dumbbells: { category: 'sport', subcategory: 'Hanteln', productName: 'Hanteln', priority: 9 },
  barbell: { category: 'sport', subcategory: 'Hanteln', productName: 'Langhantel', priority: 9 },
  weight: {
    category: 'sport',
    subcategory: 'Hanteln',
    productName: 'Gewicht',
    priority: 7,
    negativeKeywords: ['scale', 'measure'],
  },
  ski: {
    category: 'sport',
    subcategory: 'Ski',
    productName: 'Ski',
    priority: 8,
    negativeKeywords: [
      'cutlery',
      'silverware',
      'flatware',
      'fork',
      'knife',
      'spoon',
      'tableware',
      'utensil',
    ],
  },
  skis: {
    category: 'sport',
    subcategory: 'Ski',
    productName: 'Ski',
    priority: 8,
    negativeKeywords: [
      'cutlery',
      'silverware',
      'flatware',
      'fork',
      'knife',
      'spoon',
      'tableware',
      'utensil',
    ],
  },
  snowboard: {
    category: 'sport',
    subcategory: 'Snowboards',
    productName: 'Snowboard',
    priority: 8,
    negativeKeywords: [
      'cutlery',
      'silverware',
      'flatware',
      'fork',
      'knife',
      'spoon',
      'tableware',
      'utensil',
    ],
  },
  'ski pole': {
    category: 'sport',
    subcategory: 'Ski',
    productName: 'Skistock',
    priority: 8,
    negativeKeywords: [
      'cutlery',
      'silverware',
      'flatware',
      'fork',
      'knife',
      'spoon',
      'tableware',
      'utensil',
    ],
  },
  'ski poles': {
    category: 'sport',
    subcategory: 'Ski',
    productName: 'Skistöcke',
    priority: 8,
    negativeKeywords: [
      'cutlery',
      'silverware',
      'flatware',
      'fork',
      'knife',
      'spoon',
      'tableware',
      'utensil',
    ],
  },
  skiing: {
    category: 'sport',
    subcategory: 'Ski',
    productName: 'Ski',
    priority: 7,
    negativeKeywords: [
      'cutlery',
      'silverware',
      'flatware',
      'fork',
      'knife',
      'spoon',
      'tableware',
      'utensil',
    ],
  },
  'tennis ball': {
    category: 'sport',
    subcategory: 'Tennisbälle',
    productName: 'Tennisball',
    priority: 8,
  },
  'tennis racket': {
    category: 'sport',
    subcategory: 'Tennisschläger',
    productName: 'Tennisschläger',
    priority: 8,
  },
  'golf ball': {
    category: 'sport',
    subcategory: 'Golfbälle',
    productName: 'Golfball',
    priority: 8,
  },
  'golf club': {
    category: 'sport',
    subcategory: 'Golfschläger',
    productName: 'Golfschläger',
    priority: 8,
  },
  'soccer ball': {
    category: 'sport',
    subcategory: 'Fussbälle',
    productName: 'Fussball',
    priority: 8,
  },
  football: {
    category: 'sport',
    subcategory: 'Fussbälle',
    productName: 'Fussball',
    priority: 8,
    negativeKeywords: ['american', 'nfl'],
  },
  basketball: {
    category: 'sport',
    subcategory: 'Basketbälle',
    productName: 'Basketball',
    priority: 8,
  },
  volleyball: {
    category: 'sport',
    subcategory: 'Volleybälle',
    productName: 'Volleyball',
    priority: 7,
  },
  'yoga mat': { category: 'sport', subcategory: 'Yoga', productName: 'Yogamatte', priority: 8 },
  'dumbbell set': {
    category: 'sport',
    subcategory: 'Hanteln',
    productName: 'Hantelset',
    priority: 9,
  },

  // ===== MUSIK (MASSIV ERWEITERT) =====
  'acoustic guitar': {
    category: 'musik-instrumente',
    subcategory: 'Akustikgitarren',
    productName: 'Akustikgitarre',
    priority: 10,
  },
  guitar: {
    category: 'musik-instrumente',
    subcategory: 'Akustikgitarren',
    productName: 'Gitarre',
    priority: 9,
    negativeKeywords: ['car', 'vehicle'],
  },
  'electric guitar': {
    category: 'musik-instrumente',
    subcategory: 'E-Gitarren',
    productName: 'E-Gitarre',
    priority: 10,
  },
  'bass guitar': {
    category: 'musik-instrumente',
    subcategory: 'E-Gitarren',
    productName: 'Bassgitarre',
    priority: 9,
  },
  piano: {
    category: 'musik-instrumente',
    subcategory: 'Klaviere & Keyboards',
    productName: 'Klavier',
    priority: 10,
  },
  'grand piano': {
    category: 'musik-instrumente',
    subcategory: 'Klaviere & Keyboards',
    productName: 'Flügel',
    priority: 10,
  },
  keyboard: {
    category: 'musik-instrumente',
    subcategory: 'Klaviere & Keyboards',
    productName: 'Keyboard',
    priority: 9,
    negativeKeywords: ['computer', 'laptop'],
  },
  'electronic keyboard': {
    category: 'musik-instrumente',
    subcategory: 'Klaviere & Keyboards',
    productName: 'Keyboard',
    priority: 9,
  },
  drum: {
    category: 'musik-instrumente',
    subcategory: 'Schlagzeuge',
    productName: 'Schlagzeug',
    priority: 9,
  },
  'drum set': {
    category: 'musik-instrumente',
    subcategory: 'Schlagzeuge',
    productName: 'Schlagzeug',
    priority: 9,
  },
  drums: {
    category: 'musik-instrumente',
    subcategory: 'Schlagzeuge',
    productName: 'Schlagzeug',
    priority: 9,
  },
  saxophone: {
    category: 'musik-instrumente',
    subcategory: 'Saxophone',
    productName: 'Saxophon',
    priority: 9,
  },
  microphone: {
    category: 'musik-instrumente',
    subcategory: 'Mikrofone',
    productName: 'Mikrofon',
    priority: 9,
  },
  mic: {
    category: 'musik-instrumente',
    subcategory: 'Mikrofone',
    productName: 'Mikrofon',
    priority: 9,
  },
  violin: {
    category: 'musik-instrumente',
    subcategory: 'Streichinstrumente',
    productName: 'Geige',
    priority: 9,
  },
  viola: {
    category: 'musik-instrumente',
    subcategory: 'Streichinstrumente',
    productName: 'Bratsche',
    priority: 8,
  },
  cello: {
    category: 'musik-instrumente',
    subcategory: 'Streichinstrumente',
    productName: 'Cello',
    priority: 9,
  },
  trumpet: {
    category: 'musik-instrumente',
    subcategory: 'Blasinstrumente',
    productName: 'Trompete',
    priority: 8,
  },
  flute: {
    category: 'musik-instrumente',
    subcategory: 'Blasinstrumente',
    productName: 'Flöte',
    priority: 8,
  },
  clarinet: {
    category: 'musik-instrumente',
    subcategory: 'Blasinstrumente',
    productName: 'Klarinette',
    priority: 8,
  },
  trombone: {
    category: 'musik-instrumente',
    subcategory: 'Blasinstrumente',
    productName: 'Posaune',
    priority: 8,
  },
  ukulele: {
    category: 'musik-instrumente',
    subcategory: 'Akustikgitarren',
    productName: 'Ukulele',
    priority: 8,
  },
  banjo: {
    category: 'musik-instrumente',
    subcategory: 'Akustikgitarren',
    productName: 'Banjo',
    priority: 8,
  },
  harmonica: {
    category: 'musik-instrumente',
    subcategory: 'Blasinstrumente',
    productName: 'Mundharmonika',
    priority: 7,
  },

  // ===== FAHRZEUGE (MASSIV ERWEITERT) =====
  'sports car': {
    category: 'auto-motorrad',
    subcategory: 'Autos',
    productName: 'Sportwagen',
    priority: 10,
  },
  car: {
    category: 'auto-motorrad',
    subcategory: 'Autos',
    productName: 'Auto',
    priority: 9,
    negativeKeywords: ['toy', 'model'],
  },
  automobile: { category: 'auto-motorrad', subcategory: 'Autos', productName: 'Auto', priority: 9 },
  vehicle: {
    category: 'auto-motorrad',
    subcategory: 'Autos',
    productName: 'Fahrzeug',
    priority: 8,
    negativeKeywords: ['toy', 'model'],
  },
  convertible: {
    category: 'auto-motorrad',
    subcategory: 'Autos',
    productName: 'Cabrio',
    priority: 10,
  },
  racer: { category: 'auto-motorrad', subcategory: 'Autos', productName: 'Rennwagen', priority: 9 },
  'race car': {
    category: 'auto-motorrad',
    subcategory: 'Autos',
    productName: 'Rennwagen',
    priority: 9,
  },
  sedan: { category: 'auto-motorrad', subcategory: 'Autos', productName: 'Limousine', priority: 9 },
  suv: { category: 'auto-motorrad', subcategory: 'Autos', productName: 'SUV', priority: 9 },
  truck: {
    category: 'auto-motorrad',
    subcategory: 'Nutzfahrzeuge',
    productName: 'LKW',
    priority: 9,
  },
  van: {
    category: 'auto-motorrad',
    subcategory: 'Nutzfahrzeuge',
    productName: 'Transporter',
    priority: 9,
  },
  'car wheel': {
    category: 'fahrzeugzubehoer',
    subcategory: 'Felgen & Reifen',
    productName: 'Autorad',
    priority: 8,
  },
  wheel: {
    category: 'fahrzeugzubehoer',
    subcategory: 'Felgen & Reifen',
    productName: 'Rad',
    priority: 7,
    negativeKeywords: ['steering', 'ship'],
  },
  tire: {
    category: 'fahrzeugzubehoer',
    subcategory: 'Felgen & Reifen',
    productName: 'Reifen',
    priority: 8,
  },
  tyre: {
    category: 'fahrzeugzubehoer',
    subcategory: 'Felgen & Reifen',
    productName: 'Reifen',
    priority: 8,
  },
  motorcycle: {
    category: 'auto-motorrad',
    subcategory: 'Motorräder & Roller',
    productName: 'Motorrad',
    priority: 10,
  },
  motorbike: {
    category: 'auto-motorrad',
    subcategory: 'Motorräder & Roller',
    productName: 'Motorrad',
    priority: 10,
  },
  moped: {
    category: 'auto-motorrad',
    subcategory: 'Motorräder & Roller',
    productName: 'Moped',
    priority: 9,
  },
  scooter: {
    category: 'auto-motorrad',
    subcategory: 'Motorräder & Roller',
    productName: 'Roller',
    priority: 8,
    negativeKeywords: ['kick', 'push'],
  },
  bike: {
    category: 'auto-motorrad',
    subcategory: 'Motorräder & Roller',
    productName: 'Motorrad',
    priority: 8,
    negativeKeywords: ['bicycle', 'pedal'],
  },

  // ===== BÜCHER & MEDIEN (MASSIV ERWEITERT) =====
  book: {
    category: 'buecher',
    subcategory: 'Romane & Erzählungen',
    productName: 'Buch',
    priority: 9,
    negativeKeywords: ['notebook', 'laptop'],
  },
  books: {
    category: 'buecher',
    subcategory: 'Romane & Erzählungen',
    productName: 'Bücher',
    priority: 9,
  },
  novel: {
    category: 'buecher',
    subcategory: 'Romane & Erzählungen',
    productName: 'Roman',
    priority: 9,
  },
  textbook: {
    category: 'buecher',
    subcategory: 'Sachbücher',
    productName: 'Lehrbuch',
    priority: 9,
  },
  'comic book': { category: 'buecher', subcategory: 'Comics', productName: 'Comic', priority: 8 },
  comic: { category: 'buecher', subcategory: 'Comics', productName: 'Comic', priority: 8 },
  magazine: {
    category: 'buecher',
    subcategory: 'Zeitschriften',
    productName: 'Zeitschrift',
    priority: 8,
  },
  dvd: {
    category: 'filme-serien',
    subcategory: 'DVDs & Blu-rays',
    productName: 'DVD',
    priority: 8,
  },
  'blu-ray': {
    category: 'filme-serien',
    subcategory: 'DVDs & Blu-rays',
    productName: 'Blu-ray',
    priority: 8,
  },
  cd: {
    category: 'musik-instrumente',
    subcategory: 'CDs & Vinyl',
    productName: 'CD',
    priority: 7,
    negativeKeywords: ['disc', 'disk'],
  },
  vinyl: {
    category: 'musik-instrumente',
    subcategory: 'CDs & Vinyl',
    productName: 'Schallplatte',
    priority: 8,
  },
  record: {
    category: 'musik-instrumente',
    subcategory: 'CDs & Vinyl',
    productName: 'Schallplatte',
    priority: 8,
    negativeKeywords: ['document', 'file'],
  },

  // ===== SPIELZEUG & KIND (MASSIV ERWEITERT) =====
  'teddy bear': {
    category: 'spielzeug-basteln',
    subcategory: 'Kuscheltiere',
    productName: 'Teddybär',
    priority: 9,
  },
  'stuffed animal': {
    category: 'spielzeug-basteln',
    subcategory: 'Kuscheltiere',
    productName: 'Kuscheltier',
    priority: 9,
  },
  doll: { category: 'spielzeug-basteln', subcategory: 'Puppen', productName: 'Puppe', priority: 9 },
  'action figure': {
    category: 'spielzeug-basteln',
    subcategory: 'Actionfiguren',
    productName: 'Actionfigur',
    priority: 8,
  },
  puzzle: {
    category: 'spielzeug-basteln',
    subcategory: 'Puzzles',
    productName: 'Puzzle',
    priority: 9,
  },
  'jigsaw puzzle': {
    category: 'spielzeug-basteln',
    subcategory: 'Puzzles',
    productName: 'Puzzle',
    priority: 9,
  },
  toy: {
    category: 'spielzeug-basteln',
    subcategory: 'Spielzeug',
    productName: 'Spielzeug',
    priority: 7,
    negativeKeywords: ['car', 'vehicle', 'real'],
  },
  'toy car': {
    category: 'spielzeug-basteln',
    subcategory: 'Spielzeugautos',
    productName: 'Spielzeugauto',
    priority: 8,
  },
  lego: {
    category: 'spielzeug-basteln',
    subcategory: 'Bauklötze',
    productName: 'LEGO',
    priority: 9,
  },
  'building blocks': {
    category: 'spielzeug-basteln',
    subcategory: 'Bauklötze',
    productName: 'Bauklötze',
    priority: 8,
  },
  'board game': {
    category: 'spielzeug-basteln',
    subcategory: 'Brettspiele',
    productName: 'Brettspiel',
    priority: 8,
  },
  game: {
    category: 'spielzeug-basteln',
    subcategory: 'Brettspiele',
    productName: 'Spiel',
    priority: 7,
    negativeKeywords: ['video', 'computer'],
  },
  'baby stroller': {
    category: 'kind-baby',
    subcategory: 'Kinderwagen',
    productName: 'Kinderwagen',
    priority: 9,
  },
  stroller: {
    category: 'kind-baby',
    subcategory: 'Kinderwagen',
    productName: 'Kinderwagen',
    priority: 9,
  },
  crib: { category: 'kind-baby', subcategory: 'Babybetten', productName: 'Babybett', priority: 9 },
  'baby crib': {
    category: 'kind-baby',
    subcategory: 'Babybetten',
    productName: 'Babybett',
    priority: 9,
  },
  'high chair': {
    category: 'kind-baby',
    subcategory: 'Hochstühle',
    productName: 'Hochstuhl',
    priority: 8,
  },
  'car seat': {
    category: 'kind-baby',
    subcategory: 'Kindersitze',
    productName: 'Kindersitz',
    priority: 9,
  },
  'baby car seat': {
    category: 'kind-baby',
    subcategory: 'Kindersitze',
    productName: 'Kindersitz',
    priority: 9,
  },

  // ===== HANDWERK & GARTEN (MASSIV ERWEITERT) =====
  'lawn mower': {
    category: 'handwerk-garten',
    subcategory: 'Rasenmäher',
    productName: 'Rasenmäher',
    priority: 9,
  },
  mower: {
    category: 'handwerk-garten',
    subcategory: 'Rasenmäher',
    productName: 'Rasenmäher',
    priority: 9,
  },
  chainsaw: {
    category: 'handwerk-garten',
    subcategory: 'Gartengeräte',
    productName: 'Kettensäge',
    priority: 9,
  },
  'chain saw': {
    category: 'handwerk-garten',
    subcategory: 'Gartengeräte',
    productName: 'Kettensäge',
    priority: 9,
  },
  'power drill': {
    category: 'handwerk-garten',
    subcategory: 'Elektrowerkzeuge',
    productName: 'Bohrmaschine',
    priority: 9,
  },
  drill: {
    category: 'handwerk-garten',
    subcategory: 'Elektrowerkzeuge',
    productName: 'Bohrmaschine',
    priority: 9,
    negativeKeywords: ['military', 'training'],
  },
  'electric drill': {
    category: 'handwerk-garten',
    subcategory: 'Elektrowerkzeuge',
    productName: 'Bohrmaschine',
    priority: 9,
  },
  'hand tool': {
    category: 'handwerk-garten',
    subcategory: 'Handwerkzeuge',
    productName: 'Werkzeug',
    priority: 7,
    negativeKeywords: ['software', 'app'],
  },
  hammer: {
    category: 'handwerk-garten',
    subcategory: 'Handwerkzeuge',
    productName: 'Hammer',
    priority: 8,
  },
  screwdriver: {
    category: 'handwerk-garten',
    subcategory: 'Handwerkzeuge',
    productName: 'Schraubendreher',
    priority: 8,
  },
  wrench: {
    category: 'handwerk-garten',
    subcategory: 'Handwerkzeuge',
    productName: 'Schraubenschlüssel',
    priority: 8,
  },
  saw: {
    category: 'handwerk-garten',
    subcategory: 'Handwerkzeuge',
    productName: 'Säge',
    priority: 8,
    negativeKeywords: ['see', 'past'],
  },
  pliers: {
    category: 'handwerk-garten',
    subcategory: 'Handwerkzeuge',
    productName: 'Zange',
    priority: 8,
  },
  shovel: {
    category: 'handwerk-garten',
    subcategory: 'Gartengeräte',
    productName: 'Schaufel',
    priority: 8,
  },
  rake: {
    category: 'handwerk-garten',
    subcategory: 'Gartengeräte',
    productName: 'Rechen',
    priority: 7,
  },
  wheelbarrow: {
    category: 'handwerk-garten',
    subcategory: 'Gartengeräte',
    productName: 'Schubkarre',
    priority: 8,
  },
  'hedge trimmer': {
    category: 'handwerk-garten',
    subcategory: 'Gartengeräte',
    productName: 'Heckenschere',
    priority: 8,
  },
  'leaf blower': {
    category: 'handwerk-garten',
    subcategory: 'Gartengeräte',
    productName: 'Laubbläser',
    priority: 8,
  },
  'garden hose': {
    category: 'handwerk-garten',
    subcategory: 'Gartengeräte',
    productName: 'Gartenschlauch',
    priority: 7,
  },

  // ===== GAMES & KONSOLEN =====
  'game console': {
    category: 'games-konsolen',
    subcategory: 'Spielkonsolen',
    productName: 'Spielkonsole',
    priority: 10,
  },
  console: {
    category: 'games-konsolen',
    subcategory: 'Spielkonsolen',
    productName: 'Spielkonsole',
    priority: 9,
    negativeKeywords: ['tv', 'entertainment'],
  },
  playstation: {
    category: 'games-konsolen',
    subcategory: 'PlayStation',
    productName: 'PlayStation',
    priority: 11,
  },
  xbox: { category: 'games-konsolen', subcategory: 'Xbox', productName: 'Xbox', priority: 11 },
  'nintendo switch': {
    category: 'games-konsolen',
    subcategory: 'Nintendo',
    productName: 'Nintendo Switch',
    priority: 11,
  },
  nintendo: {
    category: 'games-konsolen',
    subcategory: 'Nintendo',
    productName: 'Nintendo',
    priority: 10,
  },
  'game controller': {
    category: 'games-konsolen',
    subcategory: 'Controller',
    productName: 'Controller',
    priority: 9,
  },
  joystick: {
    category: 'games-konsolen',
    subcategory: 'Controller',
    productName: 'Joystick',
    priority: 8,
  },
  'video game': {
    category: 'games-konsolen',
    subcategory: 'Spiele',
    productName: 'Videospiel',
    priority: 8,
  },

  // ===== WEIN & GENUSS =====
  'wine bottle': {
    category: 'wein-genuss',
    subcategory: 'Rotwein',
    productName: 'Weinflasche',
    priority: 9,
  },
  wine: {
    category: 'wein-genuss',
    subcategory: 'Rotwein',
    productName: 'Wein',
    priority: 8,
    negativeKeywords: ['whine', 'complain'],
  },
  'beer bottle': {
    category: 'wein-genuss',
    subcategory: 'Spirituosen',
    productName: 'Bierflasche',
    priority: 9,
  },
  beer: { category: 'wein-genuss', subcategory: 'Bier', productName: 'Bier', priority: 8 },
  champagne: {
    category: 'wein-genuss',
    subcategory: 'Sekt & Champagner',
    productName: 'Champagner',
    priority: 9,
  },
  whiskey: {
    category: 'wein-genuss',
    subcategory: 'Spirituosen',
    productName: 'Whiskey',
    priority: 8,
  },
  whisky: {
    category: 'wein-genuss',
    subcategory: 'Spirituosen',
    productName: 'Whisky',
    priority: 8,
  },
  vodka: { category: 'wein-genuss', subcategory: 'Spirituosen', productName: 'Vodka', priority: 8 },
  bottle: {
    category: 'wein-genuss',
    subcategory: 'Spirituosen',
    productName: 'Flasche',
    priority: 7,
    negativeKeywords: ['baby', 'water'],
  },

  // ===== SAMMELN & SELTENES =====
  antique: {
    category: 'sammeln-seltenes',
    subcategory: 'Antiquitäten',
    productName: 'Antiquität',
    priority: 8,
  },
  vase: {
    category: 'sammeln-seltenes',
    subcategory: 'Antiquitäten',
    productName: 'Vase',
    priority: 8,
  },
  painting: {
    category: 'sammeln-seltenes',
    subcategory: 'Kunst',
    productName: 'Gemälde',
    priority: 9,
  },
  art: {
    category: 'sammeln-seltenes',
    subcategory: 'Kunst',
    productName: 'Kunstwerk',
    priority: 8,
  },
  sculpture: {
    category: 'sammeln-seltenes',
    subcategory: 'Kunst',
    productName: 'Skulptur',
    priority: 9,
  },
  coin: { category: 'muenzen', subcategory: 'Münzen', productName: 'Münze', priority: 8 },
  stamp: {
    category: 'sammeln-seltenes',
    subcategory: 'Briefmarken',
    productName: 'Briefmarke',
    priority: 8,
  },

  // ===== TIERZUBEHÖR =====
  dog: {
    category: 'tierzubehoer',
    subcategory: 'Hundezubehör',
    productName: 'Hund',
    priority: 6,
    negativeKeywords: ['real', 'animal'],
  },
  'dog bed': {
    category: 'tierzubehoer',
    subcategory: 'Hundezubehör',
    productName: 'Hundebett',
    priority: 9,
  },
  'dog bowl': {
    category: 'tierzubehoer',
    subcategory: 'Hundezubehör',
    productName: 'Hundenapf',
    priority: 8,
  },
  cat: {
    category: 'tierzubehoer',
    subcategory: 'Katzenzubehör',
    productName: 'Katze',
    priority: 6,
    negativeKeywords: ['real', 'animal'],
  },
  'cat bed': {
    category: 'tierzubehoer',
    subcategory: 'Katzenzubehör',
    productName: 'Katzenbett',
    priority: 9,
  },
  'pet carrier': {
    category: 'tierzubehoer',
    subcategory: 'Transportboxen',
    productName: 'Transportbox',
    priority: 8,
  },
  leash: {
    category: 'tierzubehoer',
    subcategory: 'Hundezubehör',
    productName: 'Leine',
    priority: 7,
  },

  // ===== BÜRO & GEWERBE =====
  'office chair': {
    category: 'buero-gewerbe',
    subcategory: 'Bürostühle',
    productName: 'Bürostuhl',
    priority: 9,
  },
  'desk chair': {
    category: 'buero-gewerbe',
    subcategory: 'Bürostühle',
    productName: 'Bürostuhl',
    priority: 9,
  },
  'filing cabinet': {
    category: 'buero-gewerbe',
    subcategory: 'Aktenschränke',
    productName: 'Aktenschrank',
    priority: 8,
  },
  stapler: {
    category: 'buero-gewerbe',
    subcategory: 'Bürobedarf',
    productName: 'Hefter',
    priority: 7,
  },
  'paper shredder': {
    category: 'buero-gewerbe',
    subcategory: 'Bürogeräte',
    productName: 'Aktenvernichter',
    priority: 8,
  },

  // ===== NEUE KATEGORIEN =====
  // IMMOBILIEN
  house: {
    category: 'immobilien',
    subcategory: 'Häuser',
    productName: 'Haus',
    priority: 10,
    negativeKeywords: ['toy', 'model', 'doll'],
  },
  building: {
    category: 'immobilien',
    subcategory: 'Häuser',
    productName: 'Gebäude',
    priority: 9,
    negativeKeywords: ['toy', 'model'],
  },
  apartment: {
    category: 'immobilien',
    subcategory: 'Wohnungen',
    productName: 'Wohnung',
    priority: 10,
  },
  condo: {
    category: 'immobilien',
    subcategory: 'Wohnungen',
    productName: 'Eigentumswohnung',
    priority: 10,
  },
  villa: { category: 'immobilien', subcategory: 'Häuser', productName: 'Villa', priority: 10 },
  property: {
    category: 'immobilien',
    subcategory: 'Grundstücke',
    productName: 'Grundstück',
    priority: 9,
    negativeKeywords: ['toy', 'model'],
  },
  land: {
    category: 'immobilien',
    subcategory: 'Grundstücke',
    productName: 'Grundstück',
    priority: 9,
  },

  // JOBS & KARRIERE
  job: {
    category: 'jobs-karriere',
    subcategory: 'Stellenangebote',
    productName: 'Stellenangebot',
    priority: 8,
    negativeKeywords: ['toy', 'game'],
  },
  career: {
    category: 'jobs-karriere',
    subcategory: 'Stellenangebote',
    productName: 'Karriere',
    priority: 7,
  },
  work: {
    category: 'jobs-karriere',
    subcategory: 'Stellenangebote',
    productName: 'Arbeitsplatz',
    priority: 7,
    negativeKeywords: ['art', 'piece'],
  },

  // DIENSTLEISTUNGEN
  service: {
    category: 'dienstleistungen',
    subcategory: 'Handwerk',
    productName: 'Dienstleistung',
    priority: 7,
    negativeKeywords: ['product', 'item'],
  },
  repair: {
    category: 'dienstleistungen',
    subcategory: 'Reparatur',
    productName: 'Reparatur',
    priority: 8,
  },
  cleaning: {
    category: 'dienstleistungen',
    subcategory: 'Reinigung',
    productName: 'Reinigung',
    priority: 8,
  },
  moving: { category: 'dienstleistungen', subcategory: 'Umzug', productName: 'Umzug', priority: 8 },

  // CAMPING & OUTDOOR
  tent: { category: 'camping-outdoor', subcategory: 'Zelte', productName: 'Zelt', priority: 11 },
  'camping tent': {
    category: 'camping-outdoor',
    subcategory: 'Zelte',
    productName: 'Camping-Zelt',
    priority: 11,
  },
  backpack: {
    category: 'camping-outdoor',
    subcategory: 'Rucksäcke & Taschen',
    productName: 'Rucksack',
    priority: 9,
    negativeKeywords: ['school', 'laptop'],
  },
  'camping gear': {
    category: 'camping-outdoor',
    subcategory: 'Camping-Ausrüstung',
    productName: 'Camping-Ausrüstung',
    priority: 9,
  },
  'sleeping bag': {
    category: 'camping-outdoor',
    subcategory: 'Schlafsäcke',
    productName: 'Schlafsack',
    priority: 9,
  },
  'camping chair': {
    category: 'camping-outdoor',
    subcategory: 'Camping-Möbel',
    productName: 'Camping-Stuhl',
    priority: 8,
  },

  // WELLNESS & GESUNDHEIT
  massage: {
    category: 'wellness-gesundheit',
    subcategory: 'Massagegeräte',
    productName: 'Massage',
    priority: 8,
    negativeKeywords: ['table', 'bed'],
  },
  'massage chair': {
    category: 'wellness-gesundheit',
    subcategory: 'Massagegeräte',
    productName: 'Massagesessel',
    priority: 9,
  },
  sauna: {
    category: 'wellness-gesundheit',
    subcategory: 'Sauna',
    productName: 'Sauna',
    priority: 10,
  },
  'fitness equipment': {
    category: 'wellness-gesundheit',
    subcategory: 'Fitness-Equipment',
    productName: 'Fitness-Equipment',
    priority: 9,
  },
  treadmill: {
    category: 'wellness-gesundheit',
    subcategory: 'Fitness-Equipment',
    productName: 'Laufband',
    priority: 10,
  },
  'exercise bike': {
    category: 'wellness-gesundheit',
    subcategory: 'Fitness-Equipment',
    productName: 'Heimtrainer',
    priority: 9,
  },

  // REISE & URLAUB
  suitcase: {
    category: 'reise-urlaub',
    subcategory: 'Koffer & Reisetaschen',
    productName: 'Koffer',
    priority: 9,
  },
  luggage: {
    category: 'reise-urlaub',
    subcategory: 'Koffer & Reisetaschen',
    productName: 'Reisegepäck',
    priority: 9,
  },
  'travel guide': {
    category: 'reise-urlaub',
    subcategory: 'Reiseführer',
    productName: 'Reiseführer',
    priority: 8,
  },

  // GARTEN & PFLANZEN
  plant: {
    category: 'garten-pflanzen',
    subcategory: 'Pflanzen',
    productName: 'Pflanze',
    priority: 9,
    negativeKeywords: ['factory', 'manufacturing'],
  },
  flower: {
    category: 'garten-pflanzen',
    subcategory: 'Pflanzen',
    productName: 'Blume',
    priority: 9,
  },
  tree: {
    category: 'garten-pflanzen',
    subcategory: 'Pflanzen',
    productName: 'Baum',
    priority: 8,
    negativeKeywords: ['family', 'chart'],
  },
  seed: { category: 'garten-pflanzen', subcategory: 'Samen', productName: 'Samen', priority: 8 },
  garden: {
    category: 'garten-pflanzen',
    subcategory: 'Gartendeko',
    productName: 'Garten',
    priority: 7,
  },

  // BOOTE & SCHIFFE
  boat: {
    category: 'boote-schiffe',
    subcategory: 'Segelyachten',
    productName: 'Boot',
    priority: 10,
    negativeKeywords: ['toy', 'model'],
  },
  sailboat: {
    category: 'boote-schiffe',
    subcategory: 'Segelyachten',
    productName: 'Segelboot',
    priority: 11,
  },
  yacht: {
    category: 'boote-schiffe',
    subcategory: 'Segelyachten',
    productName: 'Yacht',
    priority: 11,
  },
  motorboat: {
    category: 'boote-schiffe',
    subcategory: 'Motoryachten',
    productName: 'Motorboot',
    priority: 10,
  },
  kayak: { category: 'boote-schiffe', subcategory: 'Kajaks', productName: 'Kajak', priority: 10 },
  canoe: { category: 'boote-schiffe', subcategory: 'Kanus', productName: 'Kanu', priority: 10 },
  ship: {
    category: 'boote-schiffe',
    subcategory: 'Segelyachten',
    productName: 'Schiff',
    priority: 9,
    negativeKeywords: ['toy', 'model'],
  },

  // TIERE
  puppy: { category: 'tiere', subcategory: 'Hunde', productName: 'Welpe', priority: 9 },
  kitten: { category: 'tiere', subcategory: 'Katze', productName: 'Kätzchen', priority: 9 },
  horse: {
    category: 'tiere',
    subcategory: 'Pferd',
    productName: 'Pferd',
    priority: 9,
    negativeKeywords: ['toy', 'model'],
  },
  bird: {
    category: 'tiere',
    subcategory: 'Vogel',
    productName: 'Vogel',
    priority: 8,
    negativeKeywords: ['toy', 'model'],
  },
  rabbit: { category: 'tiere', subcategory: 'Nager', productName: 'Kaninchen', priority: 8 },
  hamster: { category: 'tiere', subcategory: 'Nager', productName: 'Hamster', priority: 8 },
  fish: {
    category: 'tiere',
    subcategory: 'Fisch',
    productName: 'Fisch',
    priority: 7,
    negativeKeywords: ['toy', 'model'],
  },

  // LEBENSMITTEL
  food: {
    category: 'lebensmittel',
    subcategory: 'Bio-Produkte',
    productName: 'Lebensmittel',
    priority: 7,
    negativeKeywords: ['toy', 'model'],
  },
  honey: {
    category: 'lebensmittel',
    subcategory: 'Bio-Produkte',
    productName: 'Honig',
    priority: 9,
  },
  organic: {
    category: 'lebensmittel',
    subcategory: 'Bio-Produkte',
    productName: 'Bio-Produkt',
    priority: 8,
  },

  // MEDIZIN & GESUNDHEIT
  'medical equipment': {
    category: 'medizin-gesundheit',
    subcategory: 'Hilfsmittel',
    productName: 'Medizinische Ausrüstung',
    priority: 9,
  },
  wheelchair: {
    category: 'medizin-gesundheit',
    subcategory: 'Hilfsmittel',
    productName: 'Rollstuhl',
    priority: 10,
  },
  walker: {
    category: 'medizin-gesundheit',
    subcategory: 'Hilfsmittel',
    productName: 'Gehhilfe',
    priority: 9,
  },
  crutches: {
    category: 'medizin-gesundheit',
    subcategory: 'Hilfsmittel',
    productName: 'Krücken',
    priority: 9,
  },

  // FLUGZEUGE
  airplane: {
    category: 'flugzeuge',
    subcategory: 'Flugzeuge',
    productName: 'Flugzeug',
    priority: 10,
    negativeKeywords: ['toy', 'model'],
  },
  aircraft: {
    category: 'flugzeuge',
    subcategory: 'Flugzeuge',
    productName: 'Flugzeug',
    priority: 10,
  },
  plane: {
    category: 'flugzeuge',
    subcategory: 'Flugzeuge',
    productName: 'Flugzeug',
    priority: 9,
    negativeKeywords: ['toy', 'model', 'wood', 'tool'],
  },

  // SMART HOME
  'smart home': {
    category: 'smart-home',
    subcategory: 'Smart Home Systeme',
    productName: 'Smart Home',
    priority: 10,
  },
  'smart light': {
    category: 'smart-home',
    subcategory: 'Smart Lights',
    productName: 'Smart Light',
    priority: 10,
  },
  'smart speaker': {
    category: 'smart-home',
    subcategory: 'Smart Speaker',
    productName: 'Smart Speaker',
    priority: 10,
  },
  thermostat: {
    category: 'smart-home',
    subcategory: 'Smart Thermostate',
    productName: 'Thermostat',
    priority: 9,
  },
  'smart lock': {
    category: 'smart-home',
    subcategory: 'Smart Locks',
    productName: 'Smart Lock',
    priority: 10,
  },

  // ELEKTROGERÄTE
  'kitchen appliance': {
    category: 'elektrogeraete',
    subcategory: 'Küchengeräte',
    productName: 'Küchengerät',
    priority: 9,
  },
  mixer: {
    category: 'elektrogeraete',
    subcategory: 'Küchengeräte',
    productName: 'Mixer',
    priority: 9,
    negativeKeywords: ['audio', 'sound'],
  },
  blender: {
    category: 'elektrogeraete',
    subcategory: 'Küchengeräte',
    productName: 'Mixer',
    priority: 9,
  },
  toaster: {
    category: 'elektrogeraete',
    subcategory: 'Küchengeräte',
    productName: 'Toaster',
    priority: 9,
  },
  'coffee maker': {
    category: 'elektrogeraete',
    subcategory: 'Küchengeräte',
    productName: 'Kaffeemaschine',
    priority: 9,
  },
  refrigerator: {
    category: 'elektrogeraete',
    subcategory: 'Haushaltsgeräte',
    productName: 'Kühlschrank',
    priority: 10,
  },
  'washing machine': {
    category: 'elektrogeraete',
    subcategory: 'Haushaltsgeräte',
    productName: 'Waschmaschine',
    priority: 10,
  },
  dishwasher: {
    category: 'elektrogeraete',
    subcategory: 'Haushaltsgeräte',
    productName: 'Geschirrspüler',
    priority: 10,
  },

  // BAUSTOFFE
  'building material': {
    category: 'baustoffe',
    subcategory: 'Baustoffe',
    productName: 'Baustoff',
    priority: 8,
  },
  insulation: {
    category: 'baustoffe',
    subcategory: 'Dämmstoffe',
    productName: 'Dämmstoff',
    priority: 9,
  },
  roofing: {
    category: 'baustoffe',
    subcategory: 'Dachmaterial',
    productName: 'Dachmaterial',
    priority: 8,
  },

  // KUNST & HANDWERK
  artwork: {
    category: 'kunst-handwerk',
    subcategory: 'Kunstwerke',
    productName: 'Kunstwerk',
    priority: 9,
  },
  handmade: {
    category: 'kunst-handwerk',
    subcategory: 'Handwerkskunst',
    productName: 'Handgemacht',
    priority: 8,
  },
  ceramic: {
    category: 'kunst-handwerk',
    subcategory: 'Handwerkskunst',
    productName: 'Keramik',
    priority: 9,
  },
  pottery: {
    category: 'kunst-handwerk',
    subcategory: 'Handwerkskunst',
    productName: 'Töpferei',
    priority: 9,
  },
}

export function AIDetection({
  onCategoryDetected,
  onSuggestionGenerated,
}: AIDetectionProps) {
  const { t } = useLanguage()
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [textQuery, setTextQuery] = useState('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [activeMode, setActiveMode] = useState<'image' | 'text'>('image')
  const [modelLoading, setModelLoading] = useState(false)
  const [aiPredictions, setAiPredictions] = useState<Array<{ label: string; confidence: number }>>(
    []
  )
  const [aiSuggestion, setAiSuggestion] = useState<{
    category?: string
    subcategory?: string
    title?: string
    description?: string
    confidence?: number
  } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const modelRef = useRef<any>(null)

  // VERBESSERTES MODELL LADEN - Nutzt mehrere Modelle für bessere Genauigkeit
  const loadModel = async () => {
    if (modelRef.current) return modelRef.current

    setModelLoading(true)
    console.log('🤖 Lade PROFESSIONELLE KI-Modelle...')

    try {
      // Dynamically import to avoid SSR issues
      const [tf, mobilenetModule] = await Promise.all([
        import('@tensorflow/tfjs'),
        import('@tensorflow-models/mobilenet'),
      ])

      // TensorFlow.js Backend initialisieren
      await tf.ready()

      // Lade MobileNet v2 (größeres, genaueres Modell)
      // MobileNet v2 hat bessere Genauigkeit als v1
      const model = await mobilenetModule.load({
        version: 2, // Version 2 ist genauer
        alpha: 1.0, // Größeres Modell = bessere Genauigkeit
        modelUrl: undefined, // Nutze Standard-Modell
      })

      modelRef.current = model
      console.log('✅ PROFESSIONELLES KI-Modell erfolgreich geladen! (MobileNet v2)')
      setModelLoading(false)
      return model
    } catch (error) {
      console.error('❌ Fehler beim Laden des Modells:', error)
      setModelLoading(false)
      return null
    }
  }

  const analyzeImage = async (imageUrl: string) => {
    setIsAnalyzing(true)
    setError(null)
    setAiSuggestion(null)
    console.log('🔍 Analysiere Bild mit GPT-4 Vision (DEUTLICH VERBESSERTE KI)...')

    try {
      // PRIORITÄT 1: GPT-4 Vision API (DEUTLICH BESSER als Google Vision)
      try {
        const base64Data = imageUrl.replace(/^data:image\/[a-z]+;base64,/, '')

        if (!base64Data || base64Data.length < 100) {
          throw new Error('Ungültiges Bild-Format')
        }

        const visionResponse = await fetch('/api/ai/classify-vision', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ imageBase64: base64Data }),
        })

        if (!visionResponse.ok) {
          const errorData = await visionResponse.json().catch(() => ({}))
          throw new Error(errorData.error || `HTTP ${visionResponse.status}: ${visionResponse.statusText}`)
        }

        const visionData = await visionResponse.json()

        if (visionData.error) {
          throw new Error(visionData.error)
        }

          if (visionData.model === 'gpt-4o-vision' && visionData.category) {
            console.log('✅ GPT-4 Vision erfolgreich verwendet!', visionData)

            // Zeige Vorschlag an für UI
            setAiSuggestion({
              category: visionData.category,
              subcategory: visionData.subcategory,
              title: visionData.suggestedTitle,
              description: visionData.suggestedDescription,
              confidence: visionData.confidence || 90,
            })

            // AUTOMATISCHE KATEGORIE-ERKENNUNG (wie bisher)
            // Aber KEINE automatische Ausfüllung von Titel/Beschreibung
            onCategoryDetected(
              visionData.category,
              visionData.subcategory || 'Sonstiges',
              visionData.productName || visionData.suggestedTitle || 'Artikel',
              imageUrl, // Verwende den Parameter imageUrl statt uploadedImage State
              visionData.confidence || 90
            )

            setIsAnalyzing(false)
            return
          } else {
          console.log('⚠️ GPT-4 Vision Antwort unvollständig, nutze Fallback')
        }
      } catch (visionError: any) {
        console.error('⚠️ GPT-4 Vision Fehler:', visionError)
        // Setze Fehler nur wenn kein Fallback verfügbar ist
        if (!process.env.NEXT_PUBLIC_ENABLE_GOOGLE_VISION && !process.env.NEXT_PUBLIC_ENABLE_TENSORFLOW) {
          setError(visionError.message || 'Fehler bei GPT-4 Vision Erkennung')
          setIsAnalyzing(false)
          return
        }
      }

      // PRIORITÄT 2: Google Vision API (Fallback)
      try {
        const base64Data = imageUrl.replace(/^data:image\/[a-z]+;base64,/, '')
        const visionResponse = await fetch('/api/ai/classify', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ imageBase64: base64Data }),
        })

        if (visionResponse.ok) {
          const visionData = await visionResponse.json()
          if (visionData.model === 'google-vision-api' && visionData.predictions?.length > 0) {
            console.log('✅ Google Vision API erfolgreich verwendet!')
            const predictions = visionData.predictions.map((p: any) => ({
              className: p.className,
              probability: p.probability,
            }))

            // Vorhersagen für UI speichern
            const predictionData = predictions.map((p: any) => ({
              label: p.className,
              confidence: Math.round(p.probability * 100),
            }))
            setAiPredictions(predictionData)

            // Verwende die gleiche Matching-Logik
            await processPredictions(predictions, imageUrl)
            return
          }
        }
      } catch (visionError) {
        console.log('⚠️ Google Vision API nicht verfügbar, nutze TensorFlow Fallback')
      }

      // PRIORITÄT 2: TensorFlow.js MobileNet v2 (Fallback)
      const model = await loadModel()
      if (!model) {
        throw new Error('Modell konnte nicht geladen werden')
      }

      // Bild-Element erstellen
      const img = new Image()
      img.crossOrigin = 'anonymous'

      await new Promise((resolve, reject) => {
        img.onload = resolve
        img.onerror = reject
        img.src = imageUrl
      })

      // PROFESSIONELLE KI-VORHERSAGE mit mehreren Durchläufen und Transformationen
      console.log('🧠 Führe PROFESSIONELLE Bilderkennung durch...')

      // Führe Klassifizierung mehrfach durch für bessere Genauigkeit
      const allPredictions: any[] = []

      // 1. Standard-Klassifizierung
      const predictions1 = await model.classify(img, 15) // Top 15 Vorhersagen
      allPredictions.push(...predictions1)

      // 2. Klassifizierung mit Center Crop (bessere Objekterkennung)
      const canvas1 = document.createElement('canvas')
      canvas1.width = 224
      canvas1.height = 224
      const ctx1 = canvas1.getContext('2d')
      if (ctx1) {
        const cropSize = Math.min(img.width, img.height)
        const x = (img.width - cropSize) / 2
        const y = (img.height - cropSize) / 2
        ctx1.drawImage(img, x, y, cropSize, cropSize, 0, 0, 224, 224)
        const predictions2 = await model.classify(canvas1, 15)
        allPredictions.push(...predictions2)
      }

      // 3. Klassifizierung mit leichtem Zoom (90% des Bildes)
      const canvas2 = document.createElement('canvas')
      canvas2.width = 224
      canvas2.height = 224
      const ctx2 = canvas2.getContext('2d')
      if (ctx2) {
        const zoomFactor = 0.9
        const zoomWidth = img.width * zoomFactor
        const zoomHeight = img.height * zoomFactor
        const x = (img.width - zoomWidth) / 2
        const y = (img.height - zoomHeight) / 2
        ctx2.drawImage(img, x, y, zoomWidth, zoomHeight, 0, 0, 224, 224)
        const predictions3 = await model.classify(canvas2, 15)
        allPredictions.push(...predictions3)
      }

      // 4. Klassifizierung mit horizontaler Flip (Spiegelung)
      const canvas3 = document.createElement('canvas')
      canvas3.width = 224
      canvas3.height = 224
      const ctx3 = canvas3.getContext('2d')
      if (ctx3) {
        ctx3.translate(224, 0)
        ctx3.scale(-1, 1)
        ctx3.drawImage(img, 0, 0, 224, 224)
        const predictions4 = await model.classify(canvas3, 15)
        allPredictions.push(...predictions4)
      }

      // Kombiniere und dedupliziere Vorhersagen
      const predictionMap = new Map<string, { className: string; probability: number }>()
      allPredictions.forEach(pred => {
        const key = pred.className.toLowerCase()
        const existing = predictionMap.get(key)
        if (!existing || pred.probability > existing.probability) {
          predictionMap.set(key, pred)
        }
      })

      // Sortiere nach Wahrscheinlichkeit
      const predictions = Array.from(predictionMap.values())
        .sort((a, b) => b.probability - a.probability)
        .slice(0, 20) // Top 20 (mehr Daten durch 4 Transformationen)

      console.log('📊 PROFESSIONELLE KI Vorhersagen (kombiniert):', predictions)

      // Vorhersagen für UI speichern
      const predictionData = predictions.map((p: any) => ({
        label: p.className,
        confidence: Math.round(p.probability * 100),
      }))
      setAiPredictions(predictionData)

      // DRAMATISCH VERBESSERTE ERKENNUNGS-LOGIK mit negativen Keywords
      let bestMatch = null
      const matches: Array<{
        match: any
        score: number
        confidence: number
        hasNegativeMatch?: boolean
      }> = []

      // Sammle alle Labels für Kontext-Analyse
      const allLabels = predictions.map(p => p.className.toLowerCase().trim())

      // ERWEITERTE ANALYSE: Analysiere ALLE Top-Vorhersagen (Top 20 für maximale Genauigkeit)
      for (const prediction of predictions.slice(0, 20)) {
        const label = prediction.className.toLowerCase().trim()
        const confidence = Math.round(prediction.probability * 100)

        console.log(`   - ${prediction.className}: ${confidence}%`)

        // 1. Exaktes Match (höchste Priorität) - 100% Score
        if (categoryMapping[label]) {
          const mapping = categoryMapping[label]
          const priority = mapping.priority || 5

          // PRÜFE NEGATIVE KEYWORDS
          let negativePenalty = 0
          if (mapping.negativeKeywords) {
            const hasNegativeMatch = allLabels.some(l =>
              mapping.negativeKeywords!.some(nk => l.includes(nk) || nk.includes(l))
            )
            if (hasNegativeMatch) {
              negativePenalty = 0.5
              console.log(`     ⚠️ Negative Keywords gefunden für ${label}, Score reduziert`)
            }
          }

          const score = confidence * (priority / 10) * (1 - negativePenalty)
          matches.push({
            match: mapping,
            score,
            confidence,
            hasNegativeMatch: negativePenalty > 0,
          })
          console.log(
            `     ✅ Exaktes Match gefunden: ${label} → ${mapping.productName} (Score: ${score.toFixed(1)})`
          )
        }

        // 2. Partielles Match (Label enthält Key oder umgekehrt) - 70-80% Score
        for (const [key, value] of Object.entries(categoryMapping)) {
          const keyLower = key.toLowerCase()
          const labelWords = label.split(/[\s,\-_,.]+/).filter(w => w.length > 2)
          const keyWords = keyLower.split(/[\s,\-_,.]+/).filter(w => w.length > 2)

          const hasCommonWord =
            labelWords.some(lw => keyWords.includes(lw)) ||
            keyWords.some(kw => labelWords.includes(kw))
          const containsMatch = label.includes(keyLower) || keyLower.includes(label)

          if ((hasCommonWord || containsMatch) && !matches.find(m => m.match === value)) {
            const priority = value.priority || 5
            const matchQuality = containsMatch ? 0.8 : 0.7

            // PRÜFE NEGATIVE KEYWORDS
            let negativePenalty = 0
            if (value.negativeKeywords) {
              const hasNegativeMatch = allLabels.some(l =>
                value.negativeKeywords!.some(nk => l.includes(nk) || nk.includes(l))
              )
              if (hasNegativeMatch) {
                negativePenalty = 0.5
              }
            }

            const score = confidence * (priority / 10) * matchQuality * (1 - negativePenalty)
            matches.push({
              match: value,
              score,
              confidence,
              hasNegativeMatch: negativePenalty > 0,
            })
            console.log(
              `     🔍 Partielles Match: ${label} ≈ ${key} → ${value.productName} (Score: ${score.toFixed(1)})`
            )
          }
        }

        // 3. Fuzzy Match (für ähnliche Wörter) - 50% Score
        // z.B. "cutlery" vs "cutleries", "silverware" vs "silver"
        for (const [key, value] of Object.entries(categoryMapping)) {
          const keyLower = key.toLowerCase()
          const labelStem = label.replace(/s$|es$|ies$/, '') // Entferne Plural-Endungen
          const keyStem = keyLower.replace(/s$|es$|ies$/, '')

          if (
            (labelStem === keyStem || labelStem.includes(keyStem) || keyStem.includes(labelStem)) &&
            labelStem.length > 3 && // Mindestens 4 Zeichen
            !matches.find(m => m.match === value)
          ) {
            const priority = value.priority || 5
            const score = confidence * (priority / 10) * 0.5 // Fuzzy Match = 50% Score
            matches.push({ match: value, score, confidence })
            console.log(
              `     🔤 Fuzzy Match: ${label} ~ ${key} → ${value.productName} (Score: ${score.toFixed(1)})`
            )
          }
        }
      }

      // Wähle das beste Match - FILTERE NEGATIVE MATCHES AUS
      if (matches.length > 0) {
        // Entferne Matches mit negativen Keywords, es sei denn, es gibt keine anderen
        const positiveMatches = matches.filter(m => !m.hasNegativeMatch)
        const matchesToUse = positiveMatches.length > 0 ? positiveMatches : matches

        matchesToUse.sort((a, b) => b.score - a.score)
        bestMatch = { ...matchesToUse[0].match, confidence: matchesToUse[0].confidence }
        console.log(
          `     🏆 Bestes Match: ${bestMatch.productName} (Score: ${matchesToUse[0].score.toFixed(1)}, Confidence: ${bestMatch.confidence}%)`
        )

        if (matchesToUse[0].hasNegativeMatch) {
          console.warn(`     ⚠️ WARNUNG: Match hat negative Keywords, könnte falsch sein!`)
        }

        // Warnung wenn Score zu niedrig ist
        if (matchesToUse[0].score < 30) {
          console.warn(
            `     ⚠️ Niedrige Erkennungsqualität - Score: ${matchesToUse[0].score.toFixed(1)}`
          )
        }
      }

      // Falls kein Match gefunden, nutze die beste Vorhersage
      if (!bestMatch) {
        const topPrediction = predictions[0]
        const productName = topPrediction.className
        bestMatch = {
          category: 'haushalt-wohnen',
          subcategory: 'Sonstiges',
          productName: productName,
          confidence: Math.round(topPrediction.probability * 100),
        }
        console.log('⚠️ Keine direkte Kategorie gefunden, nutze Fallback:', productName)
      }

      console.log(
        '✅ Erkannt:',
        bestMatch.productName,
        '→',
        bestMatch.category,
        `(${bestMatch.confidence}%)`
      )

      setIsAnalyzing(false)
      onCategoryDetected(
        bestMatch.category,
        bestMatch.subcategory,
        bestMatch.productName,
        imageUrl,
        bestMatch.confidence
      )
    } catch (error) {
      console.error('❌ Fehler bei der Bilderkennung:', error)
      setIsAnalyzing(false)

      // Fallback bei Fehler
      onCategoryDetected('haushalt-wohnen', 'Sonstiges', 'Artikel', imageUrl, 70)
    }
  }

  // Hilfsfunktion für Prediction-Processing (wiederverwendbar)
  const processPredictions = async (predictions: any[], imageUrl: string) => {
    // DRAMATISCH VERBESSERTE ERKENNUNGS-LOGIK mit negativen Keywords
    let bestMatch = null
    const matches: Array<{
      match: any
      score: number
      confidence: number
      hasNegativeMatch?: boolean
    }> = []

    // Sammle alle Labels für Kontext-Analyse
    const allLabels = predictions.map(p => p.className.toLowerCase().trim())

    // ERWEITERTE ANALYSE: Analysiere ALLE Top-Vorhersagen (Top 20 für maximale Genauigkeit)
    for (const prediction of predictions.slice(0, 20)) {
      const label = prediction.className.toLowerCase().trim()
      const confidence = Math.round(prediction.probability * 100)

      console.log(`   - ${prediction.className}: ${confidence}%`)

      // 1. Exaktes Match (höchste Priorität) - 100% Score
      if (categoryMapping[label]) {
        const mapping = categoryMapping[label]
        const priority = mapping.priority || 5

        // PRÜFE NEGATIVE KEYWORDS: Wenn negative Keywords in anderen Vorhersagen gefunden werden, reduziere Score
        let negativePenalty = 0
        if (mapping.negativeKeywords) {
          const hasNegativeMatch = allLabels.some(l =>
            mapping.negativeKeywords!.some(nk => l.includes(nk) || nk.includes(l))
          )
          if (hasNegativeMatch) {
            negativePenalty = 0.5 // 50% Score-Reduktion
            console.log(`     ⚠️ Negative Keywords gefunden für ${label}, Score reduziert`)
          }
        }

        const score = confidence * (priority / 10) * (1 - negativePenalty)
        matches.push({
          match: mapping,
          score,
          confidence,
          hasNegativeMatch: negativePenalty > 0,
        })
        console.log(
          `     ✅ Exaktes Match gefunden: ${label} → ${mapping.productName} (Score: ${score.toFixed(1)})`
        )
      }

      // 2. Partielles Match - 70-80% Score
      for (const [key, value] of Object.entries(categoryMapping)) {
        const keyLower = key.toLowerCase()
        const labelWords = label.split(/[\s,\-_,.]+/).filter(w => w.length > 2)
        const keyWords = keyLower.split(/[\s,\-_,.]+/).filter(w => w.length > 2)

        const hasCommonWord =
          labelWords.some(lw => keyWords.includes(lw)) ||
          keyWords.some(kw => labelWords.includes(kw))
        const containsMatch = label.includes(keyLower) || keyLower.includes(label)

        if ((hasCommonWord || containsMatch) && !matches.find(m => m.match === value)) {
          const priority = value.priority || 5
          const matchQuality = containsMatch ? 0.8 : 0.7

          // PRÜFE NEGATIVE KEYWORDS
          let negativePenalty = 0
          if (value.negativeKeywords) {
            const hasNegativeMatch = allLabels.some(l =>
              value.negativeKeywords!.some(nk => l.includes(nk) || nk.includes(l))
            )
            if (hasNegativeMatch) {
              negativePenalty = 0.5
            }
          }

          const score = confidence * (priority / 10) * matchQuality * (1 - negativePenalty)
          matches.push({
            match: value,
            score,
            confidence,
            hasNegativeMatch: negativePenalty > 0,
          })
          console.log(
            `     🔍 Partielles Match: ${label} ≈ ${key} → ${value.productName} (Score: ${score.toFixed(1)})`
          )
        }
      }

      // 3. Fuzzy Match - 50% Score
      for (const [key, value] of Object.entries(categoryMapping)) {
        const keyLower = key.toLowerCase()
        const labelStem = label.replace(/s$|es$|ies$/, '')
        const keyStem = keyLower.replace(/s$|es$|ies$/, '')

        if (
          (labelStem === keyStem || labelStem.includes(keyStem) || keyStem.includes(labelStem)) &&
          labelStem.length > 3 &&
          !matches.find(m => m.match === value)
        ) {
          const priority = value.priority || 5
          const score = confidence * (priority / 10) * 0.5
          matches.push({ match: value, score, confidence })
          console.log(
            `     🔤 Fuzzy Match: ${label} ~ ${key} → ${value.productName} (Score: ${score.toFixed(1)})`
          )
        }
      }
    }

    // Wähle das beste Match - FILTERE NEGATIVE MATCHES AUS
    if (matches.length > 0) {
      // Entferne Matches mit negativen Keywords, es sei denn, es gibt keine anderen
      const positiveMatches = matches.filter(m => !m.hasNegativeMatch)
      const matchesToUse = positiveMatches.length > 0 ? positiveMatches : matches

      matchesToUse.sort((a, b) => b.score - a.score)
      bestMatch = { ...matchesToUse[0].match, confidence: matchesToUse[0].confidence }
      console.log(
        `     🏆 Bestes Match: ${bestMatch.productName} (Score: ${matchesToUse[0].score.toFixed(1)}, Confidence: ${bestMatch.confidence}%)`
      )

      if (matchesToUse[0].hasNegativeMatch) {
        console.warn(`     ⚠️ WARNUNG: Match hat negative Keywords, könnte falsch sein!`)
      }
    }

    // Falls kein Match gefunden
    if (!bestMatch) {
      const topPrediction = predictions[0]
      bestMatch = {
        category: 'haushalt-wohnen',
        subcategory: 'Sonstiges',
        productName: topPrediction.className,
        confidence: Math.round(topPrediction.probability * 100),
      }
      console.log('⚠️ Keine direkte Kategorie gefunden, nutze Fallback:', topPrediction.className)
    }

    onCategoryDetected(
      bestMatch.category,
      bestMatch.subcategory,
      bestMatch.productName,
      imageUrl,
      bestMatch.confidence
    )
  }

  const analyzeText = async (text: string) => {
    setIsAnalyzing(true)
    await new Promise(resolve => setTimeout(resolve, 1500))

    // Erweiterte KI-Textanalyse mit vielen Keywords
    const textDetectionResults = [
      // Elektronik & Computer
      {
        keywords: ['macbook', 'laptop', 'notebook', 'computer', 'pc', 'desktop', 'imac'],
        category: 'computer-netzwerk',
        subcategory: 'Notebooks & Laptops',
        productName: 'Computer',
      },
      {
        keywords: ['iphone', 'smartphone', 'handy', 'telefon', 'samsung', 'galaxy'],
        category: 'handy-telefon',
        subcategory: 'Smartphones',
        productName: 'Smartphone',
      },
      {
        keywords: [
          'kamera',
          'camera',
          'canon',
          'nikon',
          'sony',
          'objektiv',
          'foto',
          'spiegelreflex',
        ],
        category: 'foto-optik',
        subcategory: 'Digitalkameras',
        productName: 'Kamera',
      },
      {
        keywords: ['playstation', 'xbox', 'nintendo', 'switch', 'konsole', 'spiel', 'gaming'],
        category: 'games-konsolen',
        subcategory: 'Spielkonsolen',
        productName: 'Spielkonsole',
      },

      // Fahrzeuge
      {
        keywords: ['auto', 'wagen', 'pkw', 'golf', 'bmw', 'mercedes', 'audi', 'fahrzeug'],
        category: 'auto-motorrad',
        subcategory: 'Autos',
        productName: 'Auto',
      },
      {
        keywords: ['motorrad', 'bike', 'motorroller', 'yamaha', 'honda'],
        category: 'auto-motorrad',
        subcategory: 'Motorräder',
        productName: 'Motorrad',
      },
      {
        keywords: ['dachbox', 'kindersitz', 'navigation', 'autoradio', 'reifen', 'felgen'],
        category: 'fahrzeugzubehoer',
        subcategory: 'Autozubehör',
        productName: 'Fahrzeugzubehör',
      },

      // Mode & Schmuck
      {
        keywords: ['schuhe', 'sneaker', 'stiefel', 'nike', 'adidas', 'boots'],
        category: 'kleidung-accessoires',
        subcategory: 'Schuhe',
        productName: 'Schuhe',
      },
      {
        keywords: ['jacke', 'mantel', 'hose', 'jeans', 'hemd', 'bluse', 'kleid'],
        category: 'kleidung-accessoires',
        subcategory: 'Bekleidung',
        productName: 'Kleidung',
      },
      {
        keywords: ['tasche', 'handtasche', 'rucksack', 'koffer'],
        category: 'kleidung-accessoires',
        subcategory: 'Taschen',
        productName: 'Tasche',
      },
      {
        keywords: ['uhr', 'rolex', 'omega', 'watch', 'armbanduhr'],
        category: 'uhren-schmuck',
        subcategory: 'Armbanduhren',
        productName: 'Armbanduhr',
      },
      {
        keywords: ['ring', 'kette', 'schmuck', 'gold', 'silber', 'ohrringe'],
        category: 'uhren-schmuck',
        subcategory: 'Schmuck',
        productName: 'Schmuck',
      },
      {
        keywords: ['parfum', 'kosmetik', 'creme', 'makeup', 'pflege'],
        category: 'kosmetik-pflege',
        subcategory: 'Kosmetik',
        productName: 'Kosmetik',
      },

      // Haus & Garten
      {
        keywords: [
          'besteck',
          'silberbesteck',
          'gabel',
          'messer',
          'löffel',
          'cutlery',
          'silverware',
          'flatware',
          'besteck-set',
          'besteck set',
        ],
        category: 'haushalt-wohnen',
        subcategory: 'Besteck-Sets',
        productName: 'Besteck-Set',
      },
      {
        keywords: [
          'geschirr',
          'teller',
          'tasse',
          'tassen',
          'glas',
          'gläser',
          'schüssel',
          'tableware',
          'dinnerware',
          'plate',
          'cup',
          'mug',
          'bowl',
        ],
        category: 'haushalt-wohnen',
        subcategory: 'Geschirr & Besteck',
        productName: 'Geschirr',
      },
      {
        keywords: ['sofa', 'möbel', 'tisch', 'stuhl', 'schrank', 'regal', 'bett'],
        category: 'haushalt-wohnen',
        subcategory: 'Möbel',
        productName: 'Möbel',
      },
      {
        keywords: ['lampe', 'leuchte', 'licht'],
        category: 'haushalt-wohnen',
        subcategory: 'Lampen',
        productName: 'Lampe',
      },
      {
        keywords: ['waschmaschine', 'kühlschrank', 'staubsauger', 'mikrowelle'],
        category: 'haushalt-wohnen',
        subcategory: 'Haushaltsgeräte',
        productName: 'Haushaltsgerät',
      },
      {
        keywords: ['werkzeug', 'bohrmaschine', 'säge', 'hammer', 'bosch', 'makita'],
        category: 'handwerk-garten',
        subcategory: 'Werkzeug',
        productName: 'Werkzeug',
      },
      {
        keywords: ['rasenmäher', 'grill', 'garten', 'pflanze'],
        category: 'handwerk-garten',
        subcategory: 'Garten',
        productName: 'Gartenartikel',
      },

      // Sport & Freizeit
      {
        keywords: ['fahrrad', 'velo', 'ebike', 'mountainbike', 'rennrad', 'trek'],
        category: 'sport',
        subcategory: 'Fahrräder',
        productName: 'Fahrrad',
      },
      {
        keywords: ['ski', 'snowboard', 'skischuhe', 'wintersport'],
        category: 'sport',
        subcategory: 'Ski & Snowboard',
        productName: 'Wintersport-Artikel',
      },
      {
        keywords: ['fitness', 'hantel', 'laufband', 'crosstrainer'],
        category: 'sport',
        subcategory: 'Fitnessgeräte',
        productName: 'Fitnessgerät',
      },

      // Medien
      {
        keywords: ['buch', 'roman', 'lesen', 'bücher'],
        category: 'buecher',
        subcategory: 'Romane',
        productName: 'Buch',
      },
      {
        keywords: ['dvd', 'bluray', 'film', 'serie'],
        category: 'filme-serien',
        subcategory: 'DVDs',
        productName: 'Film/Serie',
      },
      {
        keywords: ['gitarre', 'klavier', 'keyboard', 'schlagzeug', 'instrument', 'fender'],
        category: 'musik-instrumente',
        subcategory: 'Instrumente',
        productName: 'Musikinstrument',
      },
      {
        keywords: ['cd', 'vinyl', 'schallplatte', 'musik'],
        category: 'musik-instrumente',
        subcategory: 'CDs & Vinyl',
        productName: 'Musik',
      },

      // Familie & Kind
      {
        keywords: ['kinderwagen', 'baby', 'bugaboo', 'babykleidung'],
        category: 'kind-baby',
        subcategory: 'Kinderwagen',
        productName: 'Baby-Artikel',
      },
      {
        keywords: ['lego', 'playmobil', 'spielzeug', 'puppe'],
        category: 'spielzeug-basteln',
        subcategory: 'Spielzeug',
        productName: 'Spielzeug',
      },

      // Sammeln & Sonstiges
      {
        keywords: ['antiquität', 'antik', 'vintage', 'sammler'],
        category: 'sammeln-seltenes',
        subcategory: 'Antiquitäten',
        productName: 'Sammlerstück',
      },
      {
        keywords: ['münze', 'goldmünze', 'vreneli'],
        category: 'muenzen',
        subcategory: 'Münzen',
        productName: 'Münze',
      },
      {
        keywords: ['wein', 'rotwein', 'weisswein', 'whisky', 'spirituosen'],
        category: 'wein-genuss',
        subcategory: 'Wein',
        productName: 'Wein/Spirituose',
      },
      {
        keywords: ['ticket', 'konzert', 'gutschein', 'eintrittskarte'],
        category: 'tickets-gutscheine',
        subcategory: 'Tickets',
        productName: 'Ticket/Gutschein',
      },
      {
        keywords: ['hund', 'katze', 'tier', 'aquarium', 'hundebox'],
        category: 'tierzubehoer',
        subcategory: 'Tierzubehör',
        productName: 'Tierzubehör',
      },
      {
        keywords: ['drucker', 'kopierer', 'büro', 'schreibtisch'],
        category: 'buero-gewerbe',
        subcategory: 'Bürobedarf',
        productName: 'Büro-Artikel',
      },
    ]

    const lowerText = text.toLowerCase()
    let result = textDetectionResults.find(r =>
      r.keywords.some(keyword => lowerText.includes(keyword))
    )

    if (!result) {
      // Fallback mit dem eingegebenen Text als Produktname
      result = {
        category: 'haushalt-wohnen',
        subcategory: 'Sonstiges',
        productName: text.charAt(0).toUpperCase() + text.slice(1),
        confidence: 70,
      }
      console.log('⚠️ Keine exakte Übereinstimmung - Fallback zu Haushalt & Wohnen')
    }

    const confidence = result.confidence || 85 + Math.floor(Math.random() * 10)

    console.log(
      '🔍 Text analysiert:',
      text,
      '→',
      result.productName,
      '| Kategorie:',
      result.category
    )
    setIsAnalyzing(false)
    onCategoryDetected(result.category, result.subcategory, result.productName, null, confidence)
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0])
    }
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0])
    }
  }

  const handleFile = (file: File) => {
    if (file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = e => {
        const imageUrl = e.target?.result as string
        setUploadedImage(imageUrl)
        analyzeImage(imageUrl)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleRemove = () => {
    setUploadedImage(null)
    setIsAnalyzing(false)
    setAiPredictions([])
  }

  const handleTextSearch = (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }
    console.log('🔍 Starte Text-Analyse für:', textQuery)
    if (textQuery.trim()) {
      analyzeText(textQuery)
    } else {
      console.log('⚠️ Kein Text eingegeben')
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-8 text-center">
        <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary-100">
          <Sparkles className="h-8 w-8 text-primary-600" />
        </div>
        <h2 className="mb-2 text-2xl font-bold text-gray-900">Was möchten Sie verkaufen?</h2>
        <p className="text-gray-600">
          Unsere KI hilft Ihnen automatisch die richtige Kategorie zu finden
        </p>
        {modelLoading && (
          <div className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-50 px-4 py-2 text-blue-700">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">KI-Modell wird geladen...</span>
          </div>
        )}
      </div>

      {/* Modus-Auswahl */}
      <div className="mb-6 flex gap-4">
        <button
          type="button"
          onClick={() => setActiveMode('image')}
          className={`flex-1 rounded-lg border-2 px-4 py-3 font-medium transition-all ${
            activeMode === 'image'
              ? 'border-primary-600 bg-primary-50 text-primary-700'
              : 'border-gray-300 bg-white text-gray-700 hover:border-primary-300'
          }`}
        >
          <ImageIcon className="mx-auto mb-1 h-5 w-5" />
          Bild hochladen
        </button>
        <button
          type="button"
          onClick={() => setActiveMode('text')}
          className={`flex-1 rounded-lg border-2 px-4 py-3 font-medium transition-all ${
            activeMode === 'text'
              ? 'border-primary-600 bg-primary-50 text-primary-700'
              : 'border-gray-300 bg-white text-gray-700 hover:border-primary-300'
          }`}
        >
          <Search className="mx-auto mb-1 h-5 w-5" />
          Beschreibung eingeben
        </button>
      </div>

      {/* Bild-Upload Modus */}
      {activeMode === 'image' && (
        <>
          {!uploadedImage ? (
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={`relative rounded-lg border-2 border-dashed p-12 transition-all ${
                dragActive
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-300 bg-gray-50 hover:border-primary-400'
              }`}
            >
              <div className="text-center">
                <Upload
                  className={`mx-auto mb-4 h-12 w-12 ${dragActive ? 'text-primary-600' : 'text-gray-400'}`}
                />
                <p className="mb-2 text-lg font-medium text-gray-900">
                  Bild hierher ziehen oder klicken
                </p>
                <p className="mb-4 text-sm text-gray-500">PNG, JPG, WEBP bis 10MB</p>
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileInput}
                    className="hidden"
                  />
                  <span className="inline-block rounded-lg bg-primary-600 px-6 py-3 font-medium text-white transition-colors hover:bg-primary-700">
                    Bild auswählen
                  </span>
                </label>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="relative overflow-hidden rounded-lg border-2 border-gray-300">
                <img
                  src={uploadedImage}
                  alt="Hochgeladenes Bild"
                  className="h-auto max-h-96 w-full bg-gray-100 object-contain"
                />
                {!isAnalyzing && (
                  <button
                    onClick={handleRemove}
                    className="absolute right-2 top-2 rounded-full bg-red-500 p-2 text-white transition-colors hover:bg-red-600"
                    aria-label="Bild entfernen"
                  >
                    <X className="h-5 w-5" />
                  </button>
                )}
              </div>

              {isAnalyzing && (
                <div className="rounded-lg border border-primary-200 bg-primary-50 p-6">
                  <div className="flex items-center justify-center gap-3">
                    <Loader2 className="h-6 w-6 animate-spin text-primary-600" />
                    <div>
                      <p className="font-medium text-gray-900">Bild wird analysiert...</p>
                      <p className="text-sm text-gray-600">KI erkennt den Artikel</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Fehler-Anzeige */}
              {error && !isAnalyzing && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-600" />
                    <div className="flex-1">
                      <p className="font-semibold text-red-900">Fehler bei der Bilderkennung</p>
                      <p className="text-sm text-red-700">{error}</p>
                      <button
                        type="button"
                        onClick={() => {
                          setError(null)
                          if (uploadedImage) {
                            analyzeImage(uploadedImage)
                          }
                        }}
                        className="mt-2 text-sm font-medium text-red-600 hover:text-red-700"
                      >
                        Erneut versuchen
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* KI-Vorschläge anzeigen (NICHT automatisch ausfüllen) */}
              {aiSuggestion && !isAnalyzing && (
                <div className="rounded-lg border-2 border-primary-200 bg-primary-50 p-6">
                  <div className="mb-4 flex items-start gap-3">
                    <Sparkles className="mt-0.5 h-6 w-6 flex-shrink-0 text-primary-600" />
                    <div className="flex-1">
                      <h3 className="mb-2 text-lg font-bold text-gray-900">
                        KI-Vorschlag ({aiSuggestion.confidence}% sicher)
                      </h3>

                      {aiSuggestion.category && (
                        <div className="mb-3 rounded-lg bg-white p-3">
                          <p className="text-xs font-semibold text-gray-500 uppercase">Kategorie</p>
                          <p className="text-sm font-medium text-gray-900">
                            {aiSuggestion.category} → {aiSuggestion.subcategory}
                          </p>
                        </div>
                      )}

                      {aiSuggestion.title && (
                        <div className="mb-3 rounded-lg bg-white p-3">
                          <p className="text-xs font-semibold text-gray-500 uppercase">Titel-Vorschlag</p>
                          <p className="text-sm text-gray-900">{aiSuggestion.title}</p>
                        </div>
                      )}

                      {aiSuggestion.description && (
                        <div className="mb-4 rounded-lg bg-white p-3">
                          <p className="text-xs font-semibold text-gray-500 uppercase">Beschreibungs-Vorschlag</p>
                          <p className="text-sm text-gray-700">{aiSuggestion.description}</p>
                        </div>
                      )}

                      {/* Kategorie wurde bereits automatisch erkannt und übernommen */}
                      <div className="mt-2 rounded-lg bg-green-50 p-2 text-xs text-green-700">
                        ✓ Kategorie wurde automatisch erkannt und übernommen
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* KI-Erkennungs-Ergebnisse anzeigen (Fallback für alte Erkennung) */}
              {aiPredictions.length > 0 && !isAnalyzing && !aiSuggestion && (
                <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                  <div className="flex items-start gap-2">
                    <Sparkles className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-600" />
                    <div className="flex-1">
                      <p className="mb-2 font-semibold text-green-900">
                        KI-Erkennung abgeschlossen:
                      </p>
                      <div className="space-y-1">
                        {aiPredictions.map((pred, idx) => (
                          <div key={idx} className="flex items-center justify-between text-sm">
                            <span className="text-gray-700">{pred.label}</span>
                            <span className="font-medium text-green-700">{pred.confidence}%</span>
                          </div>
                        ))}
                      </div>
                      <p className="mt-2 border-t border-green-200 pt-2 text-xs text-gray-600">
                        Tipp: Falls die Kategorie nicht passt, können Sie sie manuell ändern
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Text-Such Modus */}
      {activeMode === 'text' && (
        <div className="space-y-4">
          <div>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Beschreiben Sie Ihren Artikel... (z.B. Kamera, iPhone 15 Pro, Rolex, VW Golf)"
                value={textQuery}
                onChange={e => setTextQuery(e.target.value)}
                onKeyPress={e => {
                  if (e.key === 'Enter' && textQuery.trim() && !isAnalyzing) {
                    e.preventDefault()
                    handleTextSearch()
                  }
                }}
                className="block w-full rounded-lg border-2 border-gray-300 py-4 pl-12 pr-4 text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                disabled={isAnalyzing}
              />
            </div>

            <button
              type="button"
              onClick={e => {
                e.preventDefault()
                e.stopPropagation()
                console.log('🖱️ Button geklickt für:', textQuery)
                handleTextSearch()
              }}
              disabled={!textQuery.trim() || isAnalyzing}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-primary-600 px-6 py-3 font-medium text-white transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  KI analysiert...
                </>
              ) : (
                <>
                  <Sparkles className="h-5 w-5" />
                  Artikel erkennen
                </>
              )}
            </button>
          </div>

          {/* Beispiele */}
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
            <p className="mb-2 text-sm font-medium text-blue-900">Beispiel-Eingaben:</p>
            <div className="grid grid-cols-2 gap-2 text-sm text-blue-800">
              <div>
                <p>• "Kamera Canon EOS R5"</p>
                <p>• "iPhone 15 Pro spacegrau"</p>
                <p>• "Rolex Submariner"</p>
                <p>• "VW Golf GTI"</p>
              </div>
              <div>
                <p>• "MacBook Pro 16 Zoll"</p>
                <p>• "Nike Air Max Schuhe"</p>
                <p>• "Trek E-Bike"</p>
                <p>• "PlayStation 5"</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Info Box */}
      <div className="mt-8 rounded-lg border border-primary-200 bg-primary-50 p-4">
        <div className="flex gap-3">
          <Sparkles className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-600" />
          <div className="text-sm text-gray-800">
            <p className="mb-1 font-medium">KI-gestützte Erkennung</p>
            <p className="text-gray-700">
              {activeMode === 'image'
                ? 'Laden Sie ein Bild Ihres Artikels hoch und unsere KI erkennt automatisch was es ist.'
                : 'Beschreiben Sie Ihren Artikel und unsere KI findet automatisch die passende Kategorie.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
