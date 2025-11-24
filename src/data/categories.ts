import {
  Car,
  Laptop,
  Shirt,
  Home,
  Bike,
  Baby,
  BookOpen,
  Gamepad2,
  Sparkles,
  Package,
  Building2,
  Briefcase,
  Wrench,
  Tent,
  Heart,
  Plane,
  Flower2,
  Ship,
  Dog,
  Apple,
  Stethoscope,
  Zap,
  Square,
  Palette,
  Camera,
  Music,
  Utensils,
  Smartphone,
  Sofa,
  Dumbbell,
  Watch,
  Lightbulb,
  PlayCircle,
  FileText,
  CircleDollarSign,
} from 'lucide-react'

export interface CategoryConfig {
  name: string
  icon: any // Lucide icon component
  color: string // Helvenda color class
  slug: string
}

// Helvenda Brand Colors: Primary teal variations + accent yellow for special categories
const colors = {
  primary: 'bg-primary-600', // Main teal
  primaryLight: 'bg-primary-500',
  primaryDark: 'bg-primary-700',
  accent: 'bg-accent-400', // Yellow accent
  accentDark: 'bg-accent-500',
}

export const categoryConfig: Record<string, CategoryConfig> = {
  'auto-motorrad': {
    name: 'Auto & Motorrad',
    icon: Car,
    color: colors.primaryDark,
    slug: 'auto-motorrad',
  },
  'computer-netzwerk': {
    name: 'Computer & Netzwerk',
    icon: Laptop,
    color: colors.primary,
    slug: 'computer-netzwerk',
  },
  'sport': {
    name: 'Sport',
    icon: Dumbbell,
    color: colors.primaryLight,
    slug: 'sport',
  },
  'uhren-schmuck': {
    name: 'Uhren & Schmuck',
    icon: Watch,
    color: colors.accent,
    slug: 'uhren-schmuck',
  },
  'kleidung-accessoires': {
    name: 'Kleidung & Accessoires',
    icon: Shirt,
    color: colors.primary,
    slug: 'kleidung-accessoires',
  },
  'haushalt-wohnen': {
    name: 'Haushalt & Wohnen',
    icon: Home,
    color: colors.primaryLight,
    slug: 'haushalt-wohnen',
  },
  'kind-baby': {
    name: 'Kind & Baby',
    icon: Baby,
    color: colors.accent,
    slug: 'kind-baby',
  },
  'buecher': {
    name: 'Bücher',
    icon: BookOpen,
    color: colors.primaryDark,
    slug: 'buecher',
  },
  'games-konsolen': {
    name: 'Games & Konsolen',
    icon: Gamepad2,
    color: colors.primary,
    slug: 'games-konsolen',
  },
  'sammeln-seltenes': {
    name: 'Sammeln & Seltenes',
    icon: Sparkles,
    color: colors.accentDark,
    slug: 'sammeln-seltenes',
  },
  'immobilien': {
    name: 'Immobilien',
    icon: Building2,
    color: colors.primaryDark,
    slug: 'immobilien',
  },
  'jobs-karriere': {
    name: 'Jobs & Karriere',
    icon: Briefcase,
    color: colors.primary,
    slug: 'jobs-karriere',
  },
  'dienstleistungen': {
    name: 'Dienstleistungen',
    icon: Wrench,
    color: colors.primaryLight,
    slug: 'dienstleistungen',
  },
  'camping-outdoor': {
    name: 'Camping & Outdoor',
    icon: Tent,
    color: colors.primary,
    slug: 'camping-outdoor',
  },
  'wellness-gesundheit': {
    name: 'Wellness & Gesundheit',
    icon: Heart,
    color: colors.primaryLight,
    slug: 'wellness-gesundheit',
  },
  'reise-urlaub': {
    name: 'Reise & Urlaub',
    icon: Plane,
    color: colors.primary,
    slug: 'reise-urlaub',
  },
  'garten-pflanzen': {
    name: 'Garten & Pflanzen',
    icon: Flower2,
    color: colors.primaryLight,
    slug: 'garten-pflanzen',
  },
  'boote-schiffe': {
    name: 'Boote & Schiffe',
    icon: Ship,
    color: colors.primary,
    slug: 'boote-schiffe',
  },
  'musik-instrumente': {
    name: 'Musik & Instrumente',
    icon: Music,
    color: colors.primaryDark,
    slug: 'musik-instrumente',
  },
  'foto-video': {
    name: 'Foto & Video',
    icon: Camera,
    color: colors.primary,
    slug: 'foto-video',
  },
  'tiere-zubehoer': {
    name: 'Tiere & Zubehör',
    icon: Dog,
    color: colors.primaryLight,
    slug: 'tiere-zubehoer',
  },
  'tiere': {
    name: 'Tiere',
    icon: Dog,
    color: colors.primaryLight,
    slug: 'tiere',
  },
  'elektronik': {
    name: 'Elektronik',
    icon: Smartphone,
    color: colors.primary,
    slug: 'elektronik',
  },
  'moebel': {
    name: 'Möbel',
    icon: Sofa,
    color: colors.primaryDark,
    slug: 'moebel',
  },
  'kunst-antiquitaeten': {
    name: 'Kunst & Antiquitäten',
    icon: Palette,
    color: colors.accent,
    slug: 'kunst-antiquitaeten',
  },
  'kunst-handwerk': {
    name: 'Kunst & Handwerk',
    icon: Palette,
    color: colors.accent,
    slug: 'kunst-handwerk',
  },
  'lebensmittel-getraenke': {
    name: 'Lebensmittel & Getränke',
    icon: Utensils,
    color: colors.primaryLight,
    slug: 'lebensmittel-getraenke',
  },
  'lebensmittel': {
    name: 'Lebensmittel',
    icon: Apple,
    color: colors.primaryLight,
    slug: 'lebensmittel',
  },
  'medizin-gesundheit': {
    name: 'Medizin & Gesundheit',
    icon: Stethoscope,
    color: colors.primary,
    slug: 'medizin-gesundheit',
  },
  'flugzeuge': {
    name: 'Flugzeuge',
    icon: Plane,
    color: colors.primaryDark,
    slug: 'flugzeuge',
  },
  'smart-home': {
    name: 'Smart Home',
    icon: Lightbulb,
    color: colors.primary,
    slug: 'smart-home',
  },
  'elektrogeraete': {
    name: 'Elektrogeräte',
    icon: Zap,
    color: colors.accent,
    slug: 'elektrogeraete',
  },
  'baustoffe': {
    name: 'Baustoffe',
    icon: Square,
    color: colors.primaryDark,
    slug: 'baustoffe',
  },
  'fahrzeugzubehoer': {
    name: 'Fahrzeugzubehör',
    icon: Wrench,
    color: colors.primaryLight,
    slug: 'fahrzeugzubehoer',
  },
  'filme-serien': {
    name: 'Filme & Serien',
    icon: PlayCircle,
    color: colors.primary,
    slug: 'filme-serien',
  },
  'foto-optik': {
    name: 'Foto & Optik',
    icon: Camera,
    color: colors.primary,
    slug: 'foto-optik',
  },
  'handy-telefon': {
    name: 'Handy, Festnetz & Funk',
    icon: Smartphone,
    color: colors.primary,
    slug: 'handy-telefon',
  },
  'kosmetik-pflege': {
    name: 'Kosmetik & Pflege',
    icon: Heart,
    color: colors.accent,
    slug: 'kosmetik-pflege',
  },
  'modellbau-hobby': {
    name: 'Modellbau & Hobby',
    icon: Package,
    color: colors.primaryLight,
    slug: 'modellbau-hobby',
  },
  'muenzen': {
    name: 'Münzen',
    icon: CircleDollarSign,
    color: colors.accent,
    slug: 'muenzen',
  },
  'spielzeug-basteln': {
    name: 'Spielzeug & Basteln',
    icon: Baby,
    color: colors.accent,
    slug: 'spielzeug-basteln',
  },
  'tickets-gutscheine': {
    name: 'Tickets & Gutscheine',
    icon: FileText,
    color: colors.primary,
    slug: 'tickets-gutscheine',
  },
  'tierzubehoer': {
    name: 'Tierzubehör',
    icon: Dog,
    color: colors.primaryLight,
    slug: 'tierzubehoer',
  },
  'wein-genuss': {
    name: 'Wein & Genuss',
    icon: Utensils,
    color: colors.primaryDark,
    slug: 'wein-genuss',
  },
  'buero-gewerbe': {
    name: 'Büro & Gewerbe',
    icon: Briefcase,
    color: colors.primary,
    slug: 'buero-gewerbe',
  },
  'handwerk-garten': {
    name: 'Handwerk & Garten',
    icon: Wrench,
    color: colors.primaryLight,
    slug: 'handwerk-garten',
  },
}

// Helper function to get category config with fallback
export function getCategoryConfig(slug: string): CategoryConfig {
  return (
    categoryConfig[slug] || {
      name: slug,
      icon: Package,
      color: colors.primary,
      slug,
    }
  )
}

// Get icon component for a category
export function getCategoryIcon(slug: string) {
  return getCategoryConfig(slug).icon
}

// Get color for a category
export function getCategoryColor(slug: string) {
  return getCategoryConfig(slug).color
}

