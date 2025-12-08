import React from 'react'
import { CategoryFieldsProps } from './shared/types'
import { AutoMotorradFields } from './auto-motorrad'
import { BuecherFilmeMusikFields } from './buecher-filme-musik'
import { ComputerNetzwerkFields } from './computer-netzwerk'
import { HandyTelefonFields } from './handy-telefon'
import { UhrenSchmuckFields } from './uhren-schmuck'
import { FotoOptikFields } from './foto-optik'
import { GamesKonsolenFields } from './games-konsolen'
import { SportFields } from './sport'
import { KleidungAccessoiresFields } from './kleidung-accessoires'
import { HaushaltWohnenFields } from './haushalt-wohnen'
import { HandwerkGartenFields } from './handwerk-garten'
import { KindBabyFields } from './kind-baby'
import { MusikInstrumenteFields } from './musik-instrumente'
import { SammelnSeltenesFields } from './sammeln-seltenes'
import { MuenzenFields } from './muenzen'
import { TierzubehoerFields } from './tierzubehoer'
import { WeinGenussFields } from './wein-genuss'
import { TicketsGutscheineFields } from './tickets-gutscheine'
import { BueroGewerbeFields } from './buero-gewerbe'
import { KosmetikPflegeFields } from './kosmetik-pflege'
import { ModellbauHobbyFields } from './modellbau-hobby'
import { SpielzeugBastelnFields } from './spielzeug-basteln'
import { ImmobilienCategoryFields } from './immobilien'
import { JobsKarriereFields } from './jobs-karriere'
import { DienstleistungenFields } from './dienstleistungen'
import { CampingOutdoorFields } from './camping-outdoor'
import { WellnessGesundheitFields } from './wellness-gesundheit'
import { ReiseUrlaubFields } from './reise-urlaub'
import { GartenPflanzenFields } from './garten-pflanzen'
import { BooteSchiffeFields } from './boote-schiffe'
import { TiereFields } from './tiere'
import { LebensmittelFields } from './lebensmittel'
import { BaseFormFields } from './shared/BaseFormFields'

export function CategoryFields({
  category,
  subcategory,
  formData,
  onChange,
  disabled = false,
}: CategoryFieldsProps) {
  // BÜCHER, FILME & MUSIK
  if (category === 'buecher-filme-musik') {
    return (
      <BuecherFilmeMusikFields
        subcategory={subcategory}
        formData={formData}
        onChange={onChange}
        disabled={disabled}
      />
    )
  }

  // AUTO & MOTORRAD
  if (category === 'auto-motorrad' || category === 'fahrzeugzubehoer') {
    return (
      <AutoMotorradFields
        subcategory={subcategory}
        formData={formData}
        onChange={onChange}
        disabled={disabled}
      />
    )
  }

  // COMPUTER & NETZWERK
  if (category === 'computer-netzwerk') {
    return (
      <ComputerNetzwerkFields
        subcategory={subcategory}
        formData={formData}
        onChange={onChange}
        disabled={disabled}
      />
    )
  }

  // HANDY & TELEFON
  if (category === 'handy-telefon') {
    return (
      <HandyTelefonFields
        subcategory={subcategory}
        formData={formData}
        onChange={onChange}
        disabled={disabled}
      />
    )
  }

  // UHREN & SCHMUCK
  if (category === 'uhren-schmuck') {
    return (
      <UhrenSchmuckFields
        formData={formData}
        onChange={onChange}
        disabled={disabled}
      />
    )
  }

  // FOTO & OPTIK
  if (category === 'foto-optik' || category === 'foto-video') {
    return (
      <FotoOptikFields
        subcategory={subcategory}
        formData={formData}
        onChange={onChange}
        disabled={disabled}
      />
    )
  }

  // GAMES & KONSOLEN
  if (category === 'games-konsolen') {
    return (
      <GamesKonsolenFields
        formData={formData}
        onChange={onChange}
        disabled={disabled}
      />
    )
  }

  // SPORT
  if (category === 'sport' || category === 'sport-freizeit') {
    return (
      <SportFields
        formData={formData}
        onChange={onChange}
        disabled={disabled}
      />
    )
  }

  // KLEIDUNG & ACCESSOIRES
  if (category === 'kleidung-accessoires') {
    return <KleidungAccessoiresFields subcategory={subcategory} formData={formData} onChange={onChange} disabled={disabled} />
  }

  // HAUSHALT & WOHNEN
  if (category === 'haushalt-wohnen') {
    return <HaushaltWohnenFields subcategory={subcategory} formData={formData} onChange={onChange} disabled={disabled} />
  }

  // HANDWERK & GARTEN
  if (category === 'handwerk-garten') {
    return <HandwerkGartenFields subcategory={subcategory} formData={formData} onChange={onChange} disabled={disabled} />
  }

  // KIND & BABY
  if (category === 'kind-baby') {
    return <KindBabyFields subcategory={subcategory} formData={formData} onChange={onChange} disabled={disabled} />
  }

  // MUSIK-INSTRUMENTE
  if (category === 'musik-instrumente') {
    return <MusikInstrumenteFields subcategory={subcategory} formData={formData} onChange={onChange} disabled={disabled} />
  }

  // SAMMELN & SELTENES
  if (category === 'sammeln-seltenes') {
    return <SammelnSeltenesFields subcategory={subcategory} formData={formData} onChange={onChange} disabled={disabled} />
  }

  // MÜNZEN
  if (category === 'muenzen') {
    return <MuenzenFields subcategory={subcategory} formData={formData} onChange={onChange} disabled={disabled} />
  }

  // TIERZUBEHÖR
  if (category === 'tierzubehoer') {
    return <TierzubehoerFields subcategory={subcategory} formData={formData} onChange={onChange} disabled={disabled} />
  }

  // WEIN & GENUSS
  if (category === 'wein-genuss') {
    return <WeinGenussFields subcategory={subcategory} formData={formData} onChange={onChange} disabled={disabled} />
  }

  // TICKETS & GUTSCHEINE
  if (category === 'tickets-gutscheine') {
    return <TicketsGutscheineFields subcategory={subcategory} formData={formData} onChange={onChange} disabled={disabled} />
  }

  // BÜRO & GEWERBE
  if (category === 'buero-gewerbe') {
    return <BueroGewerbeFields subcategory={subcategory} formData={formData} onChange={onChange} disabled={disabled} />
  }

  // KOSMETIK & PFLEGE
  if (category === 'kosmetik-pflege') {
    return <KosmetikPflegeFields subcategory={subcategory} formData={formData} onChange={onChange} disabled={disabled} />
  }

  // MODELLBAU & HOBBY
  if (category === 'modellbau-hobby') {
    return <ModellbauHobbyFields subcategory={subcategory} formData={formData} onChange={onChange} disabled={disabled} />
  }

  // SPIELZEUG & BASTELN
  if (category === 'spielzeug-basteln') {
    return <SpielzeugBastelnFields subcategory={subcategory} formData={formData} onChange={onChange} disabled={disabled} />
  }

  // IMMOBILIEN
  if (category === 'immobilien') {
    return <ImmobilienCategoryFields subcategory={subcategory} formData={formData} onChange={onChange} disabled={disabled} />
  }

  // JOBS & KARRIERE
  if (category === 'jobs-karriere') {
    return <JobsKarriereFields subcategory={subcategory} formData={formData} onChange={onChange} disabled={disabled} />
  }

  // DIENSTLEISTUNGEN
  if (category === 'dienstleistungen') {
    return <DienstleistungenFields subcategory={subcategory} formData={formData} onChange={onChange} disabled={disabled} />
  }

  // CAMPING & OUTDOOR
  if (category === 'camping-outdoor') {
    return <CampingOutdoorFields subcategory={subcategory} formData={formData} onChange={onChange} disabled={disabled} />
  }

  // WELLNESS & GESUNDHEIT
  if (category === 'wellness-gesundheit') {
    return <WellnessGesundheitFields subcategory={subcategory} formData={formData} onChange={onChange} disabled={disabled} />
  }

  // REISE & URLAUB
  if (category === 'reise-urlaub') {
    return <ReiseUrlaubFields subcategory={subcategory} formData={formData} onChange={onChange} disabled={disabled} />
  }

  // GARTEN & PFLANZEN
  if (category === 'garten-pflanzen') {
    return <GartenPflanzenFields subcategory={subcategory} formData={formData} onChange={onChange} disabled={disabled} />
  }

  // BOOTE & SCHIFFE
  if (category === 'boote-schiffe') {
    return <BooteSchiffeFields subcategory={subcategory} formData={formData} onChange={onChange} disabled={disabled} />
  }

  // TIERE
  if (category === 'tiere') {
    return <TiereFields subcategory={subcategory} formData={formData} onChange={onChange} disabled={disabled} />
  }

  // LEBENSMITTEL
  if (category === 'lebensmittel') {
    return <LebensmittelFields subcategory={subcategory} formData={formData} onChange={onChange} disabled={disabled} />
  }

  // Fallback: Generische Maske wenn keine spezifische Implementierung vorhanden
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">Artikel-Details</h3>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">Marke</label>
          <input
            type="text"
            name="brand"
            value={formData.brand || ''}
            onChange={onChange}
            disabled={disabled}
            className={`w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 ${
              disabled ? 'cursor-not-allowed bg-gray-100' : ''
            }`}
            placeholder="Marke (optional)"
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">Modell</label>
          <input
            type="text"
            name="model"
            value={formData.model || ''}
            onChange={onChange}
            disabled={disabled}
            className={`w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 ${
              disabled ? 'cursor-not-allowed bg-gray-100' : ''
            }`}
            placeholder="Modell (optional)"
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">Jahr</label>
          <input
            type="number"
            name="year"
            value={formData.year || ''}
            onChange={onChange}
            disabled={disabled}
            className={`w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 ${
              disabled ? 'cursor-not-allowed bg-gray-100' : ''
            }`}
            placeholder="z.B. 2023"
          />
        </div>
      </div>
    </div>
  )
}
