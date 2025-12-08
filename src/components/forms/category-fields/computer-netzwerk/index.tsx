import React from 'react'
import { SubcategoryFieldsProps } from '../shared/types'
import { DruckerFields } from './Drucker'
import { MonitoreFields } from './Monitore'
import { TastaturenFields } from './Tastaturen'
import { MaeuseFields } from './Maeuse'
import { TabletsFields } from './Tablets'
import { GrafikkartenFields } from './Grafikkarten'
import { ProzessorenFields } from './Prozessoren'
import { RAMFields } from './RAM'
import { NetzwerkHardwareFields } from './NetzwerkHardware'
import { SpeicherFields } from './Speicher'
import { WebcamsHeadsetsLautsprecherFields } from './WebcamsHeadsetsLautsprecher'
import { SmartHomeFields } from './SmartHome'
import { VRARFields } from './VRAR'
import { SmartTVsFields } from './SmartTVs'
import { StreamingFields } from './Streaming'
import { ComputerFields } from './Computer'

export function ComputerNetzwerkFields({ subcategory, formData, onChange, disabled }: SubcategoryFieldsProps) {
  // Drucker / Scanner / Multifunktionsgeräte
  if (
    subcategory === 'Drucker' ||
    subcategory === 'Scanner' ||
    subcategory === 'Multifunktionsgeräte'
  ) {
    return <DruckerFields formData={formData} onChange={onChange} disabled={disabled} />
  }

  // Monitore & Displays
  if (subcategory === 'Monitore & Displays' || subcategory === 'Gaming-Monitore') {
    return <MonitoreFields subcategory={subcategory} formData={formData} onChange={onChange} disabled={disabled} />
  }

  // Tastaturen
  if (subcategory === 'Tastaturen' || subcategory === 'Gaming-Tastaturen') {
    return <TastaturenFields formData={formData} onChange={onChange} disabled={disabled} />
  }

  // Mäuse
  if (subcategory === 'Mäuse' || subcategory === 'Gaming-Mäuse') {
    return <MaeuseFields formData={formData} onChange={onChange} disabled={disabled} />
  }

  // Tablets
  if (subcategory === 'Tablets') {
    return <TabletsFields formData={formData} onChange={onChange} disabled={disabled} />
  }

  // Grafikkarten
  if (subcategory === 'Grafikkarten') {
    return <GrafikkartenFields formData={formData} onChange={onChange} disabled={disabled} />
  }

  // Prozessoren
  if (subcategory === 'Prozessoren') {
    return <ProzessorenFields formData={formData} onChange={onChange} disabled={disabled} />
  }

  // RAM-Speicher
  if (subcategory === 'RAM-Speicher') {
    return <RAMFields formData={formData} onChange={onChange} disabled={disabled} />
  }

  // Netzwerk-Hardware
  if (
    subcategory === 'Router' ||
    subcategory === 'Switches' ||
    subcategory === 'WLAN-Adapter' ||
    subcategory === 'Netzwerk-Hardware'
  ) {
    return <NetzwerkHardwareFields formData={formData} onChange={onChange} disabled={disabled} />
  }

  // Speicher
  if (
    subcategory === 'NAS-Systeme' ||
    subcategory === 'Server & Storage' ||
    subcategory === 'Externe Festplatten' ||
    subcategory === 'SSDs'
  ) {
    return <SpeicherFields subcategory={subcategory} formData={formData} onChange={onChange} disabled={disabled} />
  }

  // Webcams / Headsets / Lautsprecher
  if (subcategory === 'Webcams' || subcategory === 'Headsets' || subcategory === 'Lautsprecher') {
    return <WebcamsHeadsetsLautsprecherFields subcategory={subcategory} formData={formData} onChange={onChange} disabled={disabled} />
  }

  // Smart Home & IoT
  if (subcategory === 'Smart Home & IoT' || subcategory === 'Smart Home') {
    return <SmartHomeFields formData={formData} onChange={onChange} disabled={disabled} />
  }

  // VR/AR Headsets
  if (subcategory === 'VR/AR Headsets' || subcategory === 'VR Headsets') {
    return <VRARFields formData={formData} onChange={onChange} disabled={disabled} />
  }

  // Smart TVs
  if (subcategory === 'Smart TVs' || subcategory === 'Fernseher') {
    return <SmartTVsFields formData={formData} onChange={onChange} disabled={disabled} />
  }

  // Streaming-Geräte
  if (subcategory === 'Streaming-Geräte' || subcategory === 'Streaming') {
    return <StreamingFields formData={formData} onChange={onChange} disabled={disabled} />
  }

  // Fallback: Standard Computer-Maske
  return <ComputerFields formData={formData} onChange={onChange} disabled={disabled} />
}

