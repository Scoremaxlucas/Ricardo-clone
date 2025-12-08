import React from 'react'

interface CategoryFieldsProps {
  category: string
  subcategory?: string
  formData: any
  onChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => void
  disabled?: boolean
}

export function CategoryFields({
  category,
  subcategory,
  formData,
  onChange,
  disabled = false,
}: CategoryFieldsProps) {
  // Debug: Log what we receive
  console.log('[CategoryFields] category:', category, 'subcategory:', subcategory, 'type:', typeof category, typeof subcategory)

  // BÜCHER, FILME & MUSIK - PRÜFE ZUERST! (wird von KI verwendet)
  if (category === 'buecher-filme-musik') {
    console.log('[CategoryFields] Matched buecher-filme-musik category, subcategory:', subcategory)
    // BÜCHER (alle Unterkategorien)
    if (
      subcategory?.includes('Bücher') ||
      subcategory === 'Bücher' ||
      subcategory === 'Romane & Erzählungen' ||
      subcategory === 'Kinder- & Jugendbücher' ||
      subcategory === 'Sachbücher' ||
      subcategory === 'Kochbücher' ||
      subcategory === 'Comics & Manga' ||
      subcategory === 'Reiseführer' ||
      subcategory === 'Fachbücher' ||
      subcategory === 'Hörbücher' ||
      subcategory === 'Zeitschriften' ||
      subcategory === 'Antiquarische Bücher' ||
      !subcategory // Fallback wenn keine Unterkategorie
    ) {
      console.log('[CategoryFields] Showing Buch-Details for buecher-filme-musik')
      return (
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-gray-900">Buch-Details</h3>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Autor *</label>
              <input
                type="text"
                name="author"
                value={formData.author || ''}
                onChange={onChange}
                disabled={disabled}
                className={`w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 ${disabled ? 'cursor-not-allowed bg-gray-100' : ''}`}
                placeholder="z.B. Max Mustermann"
                required
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Titel *</label>
              <input
                type="text"
                name="title"
                value={formData.title || formData.model || ''}
                onChange={onChange}
                disabled={disabled}
                className={`w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 ${disabled ? 'cursor-not-allowed bg-gray-100' : ''}`}
                placeholder="Buchtitel"
                required
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Verlag</label>
              <input
                type="text"
                name="publisher"
                value={formData.publisher || ''}
                onChange={onChange}
                disabled={disabled}
                className={`w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 ${disabled ? 'cursor-not-allowed bg-gray-100' : ''}`}
                placeholder="z.B. Suhrkamp, Fischer"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Erscheinungsjahr</label>
              <input
                type="number"
                name="year"
                value={formData.year || ''}
                onChange={onChange}
                disabled={disabled}
                className={`w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 ${disabled ? 'cursor-not-allowed bg-gray-100' : ''}`}
                placeholder="z.B. 2020"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">ISBN</label>
              <input
                type="text"
                name="isbn"
                value={formData.isbn || ''}
                onChange={onChange}
                disabled={disabled}
                className={`w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 ${disabled ? 'cursor-not-allowed bg-gray-100' : ''}`}
                placeholder="z.B. 978-3-12345-678-9"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Sprache</label>
              <select
                name="language"
                value={formData.language || ''}
                onChange={onChange}
                disabled={disabled}
                className={`w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 ${disabled ? 'cursor-not-allowed bg-gray-100' : ''}`}
              >
                <option value="">Bitte wählen</option>
                <option value="deutsch">Deutsch</option>
                <option value="englisch">Englisch</option>
                <option value="französisch">Französisch</option>
                <option value="italienisch">Italienisch</option>
                <option value="spanisch">Spanisch</option>
                <option value="andere">Andere</option>
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Buchtyp</label>
              <select
                name="bookType"
                value={formData.bookType || ''}
                onChange={onChange}
                disabled={disabled}
                className={`w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 ${disabled ? 'cursor-not-allowed bg-gray-100' : ''}`}
              >
                <option value="">Bitte wählen</option>
                <option value="hardcover">Hardcover</option>
                <option value="paperback">Taschenbuch</option>
                <option value="ebook">E-Book</option>
                <option value="hoerbuch">Hörbuch</option>
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Seitenzahl</label>
              <input
                type="number"
                name="pages"
                value={formData.pages || ''}
                onChange={onChange}
                disabled={disabled}
                className={`w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 ${disabled ? 'cursor-not-allowed bg-gray-100' : ''}`}
                placeholder="z.B. 320"
              />
            </div>
          </div>
        </div>
      )
    }
    // FILME & SERIEN
    if (subcategory?.includes('Film') || subcategory?.includes('Serie') || subcategory === 'Filme-Serien') {
      return (
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-gray-900">Film/Serie-Details</h3>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Titel *</label>
              <input
                type="text"
                name="title"
                value={formData.title || formData.model || ''}
                onChange={onChange}
                disabled={disabled}
                className={`w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 ${disabled ? 'cursor-not-allowed bg-gray-100' : ''}`}
                placeholder="Film- oder Serientitel"
                required
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Format</label>
              <select
                name="format"
                value={formData.format || ''}
                onChange={onChange}
                disabled={disabled}
                className={`w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 ${disabled ? 'cursor-not-allowed bg-gray-100' : ''}`}
              >
                <option value="">Bitte wählen</option>
                <option value="dvd">DVD</option>
                <option value="blu-ray">Blu-ray</option>
                <option value="4k-uhd">4K UHD</option>
                <option value="digital">Digital</option>
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Erscheinungsjahr</label>
              <input
                type="number"
                name="year"
                value={formData.year || ''}
                onChange={onChange}
                disabled={disabled}
                className={`w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 ${disabled ? 'cursor-not-allowed bg-gray-100' : ''}`}
                placeholder="z.B. 2020"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Genre</label>
              <input
                type="text"
                name="genre"
                value={formData.genre || ''}
                onChange={onChange}
                disabled={disabled}
                className={`w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 ${disabled ? 'cursor-not-allowed bg-gray-100' : ''}`}
                placeholder="z.B. Action, Drama, Komödie"
              />
            </div>
          </div>
        </div>
      )
    }
    // MUSIK
    if (subcategory?.includes('Musik') || subcategory === 'Musik') {
      return (
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-gray-900">Musik-Details</h3>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Künstler/Interpret *</label>
              <input
                type="text"
                name="artist"
                value={formData.artist || formData.brand || ''}
                onChange={onChange}
                disabled={disabled}
                className={`w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 ${disabled ? 'cursor-not-allowed bg-gray-100' : ''}`}
                placeholder="z.B. The Beatles, Taylor Swift"
                required
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Album-Titel *</label>
              <input
                type="text"
                name="title"
                value={formData.title || formData.model || ''}
                onChange={onChange}
                disabled={disabled}
                className={`w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 ${disabled ? 'cursor-not-allowed bg-gray-100' : ''}`}
                placeholder="Album- oder Single-Titel"
                required
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Format</label>
              <select
                name="format"
                value={formData.format || ''}
                onChange={onChange}
                disabled={disabled}
                className={`w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 ${disabled ? 'cursor-not-allowed bg-gray-100' : ''}`}
              >
                <option value="">Bitte wählen</option>
                <option value="cd">CD</option>
                <option value="vinyl">Vinyl/Schallplatte</option>
                <option value="kassette">Kassette</option>
                <option value="digital">Digital</option>
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Erscheinungsjahr</label>
              <input
                type="number"
                name="year"
                value={formData.year || ''}
                onChange={onChange}
                disabled={disabled}
                className={`w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 ${disabled ? 'cursor-not-allowed bg-gray-100' : ''}`}
                placeholder="z.B. 2020"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Genre</label>
              <input
                type="text"
                name="genre"
                value={formData.genre || ''}
                onChange={onChange}
                disabled={disabled}
                className={`w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 ${disabled ? 'cursor-not-allowed bg-gray-100' : ''}`}
                placeholder="z.B. Pop, Rock, Jazz, Klassik"
              />
            </div>
          </div>
        </div>
      )
    }
    // Standard für Bücher/Filme/Musik ohne spezifische Unterkategorie
    // Wenn keine Unterkategorie vorhanden ist, zeigen wir die Buch-Felder als Standard
    // (da Bücher die häufigste Kategorie in dieser Gruppe sind)
    return (
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-gray-900">Buch-Details</h3>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Autor *</label>
            <input
              type="text"
              name="author"
              value={formData.author || ''}
              onChange={onChange}
              disabled={disabled}
              className={`w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 ${disabled ? 'cursor-not-allowed bg-gray-100' : ''}`}
              placeholder="z.B. Max Mustermann"
              required
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Titel *</label>
            <input
              type="text"
              name="title"
              value={formData.title || formData.model || ''}
              onChange={onChange}
              disabled={disabled}
              className={`w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 ${disabled ? 'cursor-not-allowed bg-gray-100' : ''}`}
              placeholder="Buchtitel"
              required
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Verlag</label>
            <input
              type="text"
              name="publisher"
              value={formData.publisher || ''}
              onChange={onChange}
              disabled={disabled}
              className={`w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 ${disabled ? 'cursor-not-allowed bg-gray-100' : ''}`}
              placeholder="z.B. Suhrkamp, Fischer"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Erscheinungsjahr</label>
            <input
              type="number"
              name="year"
              value={formData.year || ''}
              onChange={onChange}
              disabled={disabled}
              className={`w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 ${disabled ? 'cursor-not-allowed bg-gray-100' : ''}`}
              placeholder="z.B. 2020"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">ISBN</label>
            <input
              type="text"
              name="isbn"
              value={formData.isbn || ''}
              onChange={onChange}
              disabled={disabled}
              className={`w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 ${disabled ? 'cursor-not-allowed bg-gray-100' : ''}`}
              placeholder="z.B. 978-3-12345-678-9"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Sprache</label>
            <select
              name="language"
              value={formData.language || ''}
              onChange={onChange}
              disabled={disabled}
              className={`w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 ${disabled ? 'cursor-not-allowed bg-gray-100' : ''}`}
            >
              <option value="">Bitte wählen</option>
              <option value="deutsch">Deutsch</option>
              <option value="englisch">Englisch</option>
              <option value="französisch">Französisch</option>
              <option value="italienisch">Italienisch</option>
              <option value="spanisch">Spanisch</option>
              <option value="andere">Andere</option>
            </select>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Buchtyp</label>
            <select
              name="bookType"
              value={formData.bookType || ''}
              onChange={onChange}
              disabled={disabled}
              className={`w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 ${disabled ? 'cursor-not-allowed bg-gray-100' : ''}`}
            >
              <option value="">Bitte wählen</option>
              <option value="hardcover">Hardcover</option>
              <option value="paperback">Taschenbuch</option>
              <option value="ebook">E-Book</option>
              <option value="hoerbuch">Hörbuch</option>
            </select>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Seitenzahl</label>
            <input
              type="number"
              name="pages"
              value={formData.pages || ''}
              onChange={onChange}
              disabled={disabled}
              className={`w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 ${disabled ? 'cursor-not-allowed bg-gray-100' : ''}`}
              placeholder="z.B. 320"
            />
          </div>
        </div>
      </div>
    )
  }

  // BÜCHER (vollständige Version) - FALLBACK für direkte 'buecher' Kategorie
  if (category === 'buecher') {
    console.log('[CategoryFields] Matched buecher category')
    return (
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-gray-900">Buch-Details</h3>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Autor *</label>
            <input
              type="text"
              name="author"
              value={formData.author || ''}
              onChange={onChange}
              disabled={disabled}
              className={`w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 ${disabled ? 'cursor-not-allowed bg-gray-100' : ''}`}
              placeholder="z.B. J.K. Rowling, Max Frisch"
              required
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Titel *</label>
            <input
              type="text"
              name="title"
              value={formData.title || formData.model || ''}
              onChange={onChange}
              disabled={disabled}
              className={`w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 ${disabled ? 'cursor-not-allowed bg-gray-100' : ''}`}
              placeholder="Buchtitel"
              required
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Verlag</label>
            <input
              type="text"
              name="publisher"
              value={formData.publisher || ''}
              onChange={onChange}
              disabled={disabled}
              className={`w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 ${disabled ? 'cursor-not-allowed bg-gray-100' : ''}`}
              placeholder="z.B. Suhrkamp, Fischer, Carlsen"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Erscheinungsjahr</label>
            <input
              type="number"
              name="year"
              value={formData.year || ''}
              onChange={onChange}
              disabled={disabled}
              className={`w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 ${disabled ? 'cursor-not-allowed bg-gray-100' : ''}`}
              placeholder="z.B. 2020"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">ISBN</label>
            <input
              type="text"
              name="isbn"
              value={formData.isbn || ''}
              onChange={onChange}
              disabled={disabled}
              className={`w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 ${disabled ? 'cursor-not-allowed bg-gray-100' : ''}`}
              placeholder="z.B. 978-3-12345-678-9"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Sprache</label>
            <select
              name="language"
              value={formData.language || ''}
              onChange={onChange}
              disabled={disabled}
              className={`w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 ${disabled ? 'cursor-not-allowed bg-gray-100' : ''}`}
            >
              <option value="">Bitte wählen</option>
              <option value="deutsch">Deutsch</option>
              <option value="englisch">Englisch</option>
              <option value="französisch">Französisch</option>
              <option value="italienisch">Italienisch</option>
              <option value="spanisch">Spanisch</option>
              <option value="andere">Andere</option>
            </select>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Buchtyp</label>
            <select
              name="bookType"
              value={formData.bookType || ''}
              onChange={onChange}
              disabled={disabled}
              className={`w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 ${disabled ? 'cursor-not-allowed bg-gray-100' : ''}`}
            >
              <option value="">Bitte wählen</option>
              <option value="hardcover">Hardcover</option>
              <option value="paperback">Taschenbuch</option>
              <option value="ebook">E-Book</option>
              <option value="hoerbuch">Hörbuch</option>
            </select>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Seitenzahl</label>
            <input
              type="number"
              name="pages"
              value={formData.pages || ''}
              onChange={onChange}
              disabled={disabled}
              className={`w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 ${disabled ? 'cursor-not-allowed bg-gray-100' : ''}`}
              placeholder="z.B. 320"
            />
          </div>
        </div>
      </div>
    )
  }

  // AUTO & MOTORRAD
  if (category === 'auto-motorrad') {
    return (
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-gray-900">Fahrzeug-Details</h3>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Marke *</label>
            <input
              type="text"
              name="brand"
              value={formData.brand || ''}
              onChange={onChange}
              disabled={disabled}
              className={`w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 ${disabled ? 'cursor-not-allowed bg-gray-100' : ''}`}
              placeholder="z.B. VW, BMW, Mercedes"
              required
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Modell *</label>
            <input
              type="text"
              name="model"
              value={formData.model || ''}
              onChange={onChange}
              disabled={disabled}
              className={`w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 ${disabled ? 'cursor-not-allowed bg-gray-100' : ''}`}
              placeholder="z.B. Golf, 3er, C-Klasse"
              required
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Baujahr</label>
            <input
              type="number"
              name="year"
              value={formData.year || ''}
              onChange={onChange}
              disabled={disabled}
              className={`w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 ${disabled ? 'cursor-not-allowed bg-gray-100' : ''}`}
              placeholder="z.B. 2020"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Kilometerstand</label>
            <input
              type="number"
              name="mileage"
              value={formData.mileage || ''}
              onChange={onChange}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500"
              placeholder="z.B. 45000"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Getriebe</label>
            <select
              name="transmission"
              value={formData.transmission || ''}
              onChange={onChange}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Bitte wählen</option>
              <option value="manuell">Manuell</option>
              <option value="automatik">Automatik</option>
            </select>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Treibstoff</label>
            <select
              name="fuel"
              value={formData.fuel || ''}
              onChange={onChange}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Bitte wählen</option>
              <option value="benzin">Benzin</option>
              <option value="diesel">Diesel</option>
              <option value="elektro">Elektro</option>
              <option value="hybrid">Hybrid</option>
            </select>
          </div>
        </div>
      </div>
    )
  }

  // FAHRZEUGZUBEHÖR
  if (category === 'fahrzeugzubehoer') {
    return (
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-gray-900">Zubehör-Details</h3>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Marke</label>
            <input
              type="text"
              name="brand"
              value={formData.brand || ''}
              onChange={onChange}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500"
              placeholder="z.B. Thule, Blaupunkt"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Kompatibilität</label>
            <input
              type="text"
              name="compatibility"
              value={formData.compatibility || ''}
              onChange={onChange}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500"
              placeholder="z.B. Für VW Golf"
            />
          </div>
        </div>
      </div>
    )
  }

  // COMPUTER & NETZWERK
  if (category === 'computer-netzwerk') {
    // DRUCKER / SCANNER / MULTIFUNKTIONSGERÄTE
    if (
      subcategory === 'Drucker' ||
      subcategory === 'Scanner' ||
      subcategory === 'Multifunktionsgeräte'
    ) {
      return (
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-gray-900">
            {subcategory === 'Drucker'
              ? 'Drucker-Details'
              : subcategory === 'Scanner'
                ? 'Scanner-Details'
                : 'Multifunktionsgerät-Details'}
          </h3>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Marke *</label>
              <input
                type="text"
                name="brand"
                value={formData.brand || ''}
                onChange={onChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500"
                placeholder="z.B. HP, Canon, Epson, Brother"
                required
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Modell *</label>
              <input
                type="text"
                name="model"
                value={formData.model || ''}
                onChange={onChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500"
                placeholder="z.B. OfficeJet Pro 9015, PIXMA TS3750"
                required
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Drucktyp</label>
              <select
                name="printType"
                value={formData.printType || ''}
                onChange={onChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Bitte wählen</option>
                <option value="tintenstrahldrucker">Tintenstrahldrucker</option>
                <option value="laserdrucker">Laserdrucker</option>
                <option value="farblaserdrucker">Farblaserdrucker</option>
                <option value="sw-laserdrucker">S/W Laserdrucker</option>
                <option value="3d-drucker">3D-Drucker</option>
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Funktionen</label>
              <input
                type="text"
                name="printerFeatures"
                value={formData.printerFeatures || ''}
                onChange={onChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500"
                placeholder="z.B. Drucken, Scannen, Kopieren, Faxen"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Konnektivität</label>
              <input
                type="text"
                name="connectivity"
                value={formData.connectivity || ''}
                onChange={onChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500"
                placeholder="z.B. WLAN, USB, Ethernet"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Druckgeschwindigkeit (Seiten/Min)
              </label>
              <input
                type="text"
                name="printSpeed"
                value={formData.printSpeed || ''}
                onChange={onChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500"
                placeholder="z.B. 15 S/W, 10 Farbe"
              />
            </div>
          </div>
        </div>
      )
    }

    // MONITORE & DISPLAYS
    if (subcategory === 'Monitore & Displays' || subcategory === 'Gaming-Monitore') {
      return (
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-gray-900">
            {subcategory === 'Gaming-Monitore' ? 'Gaming-Monitor-Details' : 'Monitor-Details'}
          </h3>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Marke *</label>
              <input
                type="text"
                name="brand"
                value={formData.brand || ''}
                onChange={onChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500"
                placeholder="z.B. Samsung, LG, Dell, BenQ"
                required
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Modell *</label>
              <input
                type="text"
                name="model"
                value={formData.model || ''}
                onChange={onChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500"
                placeholder="z.B. Odyssey G7, UltraSharp U2723DE"
                required
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Bildschirmgröße *
              </label>
              <input
                type="text"
                name="screenSize"
                value={formData.screenSize || ''}
                onChange={onChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500"
                placeholder="z.B. 27 Zoll, 32"
                required
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Auflösung *</label>
              <select
                name="resolution"
                value={formData.resolution || ''}
                onChange={onChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500"
                required
              >
                <option value="">Bitte wählen</option>
                <option value="1920x1080">Full HD (1920x1080)</option>
                <option value="2560x1440">QHD (2560x1440)</option>
                <option value="3840x2160">4K UHD (3840x2160)</option>
                <option value="5120x2880">5K (5120x2880)</option>
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Bildwiederholrate
              </label>
              <input
                type="text"
                name="refreshRate"
                value={formData.refreshRate || ''}
                onChange={onChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500"
                placeholder="z.B. 60Hz, 144Hz, 240Hz"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Panel-Typ</label>
              <select
                name="panelType"
                value={formData.panelType || ''}
                onChange={onChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Bitte wählen</option>
                <option value="ips">IPS</option>
                <option value="va">VA</option>
                <option value="tn">TN</option>
                <option value="oled">OLED</option>
              </select>
            </div>
          </div>
        </div>
      )
    }

    // TASTATUREN & MÄUSE
    if (
      subcategory === 'Tastaturen' ||
      subcategory === 'Gaming-Tastaturen' ||
      subcategory === 'Mäuse' ||
      subcategory === 'Gaming-Mäuse'
    ) {
      const isKeyboard = subcategory?.includes('Tastatur')
      return (
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-gray-900">
            {isKeyboard ? 'Tastatur-Details' : 'Maus-Details'}
          </h3>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Marke *</label>
              <input
                type="text"
                name="brand"
                value={formData.brand || ''}
                onChange={onChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500"
                placeholder="z.B. Logitech, Razer, Corsair"
                required
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Modell *</label>
              <input
                type="text"
                name="model"
                value={formData.model || ''}
                onChange={onChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500"
                placeholder={
                  isKeyboard ? 'z.B. MX Keys, K70 RGB' : 'z.B. MX Master 3, DeathAdder V2'
                }
                required
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Verbindung</label>
              <select
                name="connectionType"
                value={formData.connectionType || ''}
                onChange={onChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Bitte wählen</option>
                <option value="kabellos">Kabellos</option>
                <option value="bluetooth">Bluetooth</option>
                <option value="usb">USB</option>
                <option value="usb-c">USB-C</option>
              </select>
            </div>
            {!isKeyboard && (
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  DPI (Auflösung)
                </label>
                <input
                  type="text"
                  name="dpi"
                  value={formData.dpi || ''}
                  onChange={onChange}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500"
                  placeholder="z.B. 16000 DPI"
                />
              </div>
            )}
            {isKeyboard && (
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">Layout</label>
                <select
                  name="keyboardLayout"
                  value={formData.keyboardLayout || ''}
                  onChange={onChange}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Bitte wählen</option>
                  <option value="qwertz-ch">QWERTZ (CH)</option>
                  <option value="qwertz-de">QWERTZ (DE)</option>
                  <option value="qwerty-us">QWERTY (US)</option>
                  <option value="azerty-fr">AZERTY (FR)</option>
                </select>
              </div>
            )}
          </div>
        </div>
      )
    }

    // TABLETS
    if (subcategory === 'Tablets') {
      return (
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-gray-900">Tablet-Details</h3>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Marke *</label>
              <input
                type="text"
                name="brand"
                value={formData.brand || ''}
                onChange={onChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500"
                placeholder="z.B. Apple, Samsung, Lenovo"
                required
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Modell *</label>
              <input
                type="text"
                name="model"
                value={formData.model || ''}
                onChange={onChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500"
                placeholder="z.B. iPad Pro 12.9, Galaxy Tab S9"
                required
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Bildschirmgröße
              </label>
              <input
                type="text"
                name="screenSize"
                value={formData.screenSize || ''}
                onChange={onChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500"
                placeholder="z.B. 11 Zoll, 12.9 Zoll"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Speicher</label>
              <input
                type="text"
                name="storage"
                value={formData.storage || ''}
                onChange={onChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500"
                placeholder="z.B. 128GB, 256GB, 512GB"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Konnektivität</label>
              <select
                name="connectivity"
                value={formData.connectivity || ''}
                onChange={onChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Bitte wählen</option>
                <option value="wifi">Wi-Fi</option>
                <option value="wifi-cellular">Wi-Fi + Cellular</option>
              </select>
            </div>
          </div>
        </div>
      )
    }

    // GRAFIKKARTEN
    if (subcategory === 'Grafikkarten') {
      return (
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-gray-900">Grafikkarten-Details</h3>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Hersteller *</label>
              <input
                type="text"
                name="brand"
                value={formData.brand || ''}
                onChange={onChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500"
                placeholder="z.B. NVIDIA, AMD"
                required
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Modell *</label>
              <input
                type="text"
                name="model"
                value={formData.model || ''}
                onChange={onChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500"
                placeholder="z.B. RTX 4090, RX 7900 XTX"
                required
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Videospeicher (VRAM)
              </label>
              <input
                type="text"
                name="vram"
                value={formData.vram || ''}
                onChange={onChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500"
                placeholder="z.B. 8GB, 12GB, 24GB"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Chipsatz</label>
              <input
                type="text"
                name="chipset"
                value={formData.chipset || ''}
                onChange={onChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500"
                placeholder="z.B. GeForce RTX 4090, Radeon RX 7900 XTX"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Anschlüsse</label>
              <input
                type="text"
                name="ports"
                value={formData.ports || ''}
                onChange={onChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500"
                placeholder="z.B. 3x DisplayPort, 1x HDMI"
              />
            </div>
          </div>
        </div>
      )
    }

    // PROZESSOREN (CPUs)
    if (subcategory === 'Prozessoren') {
      return (
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-gray-900">Prozessor-Details</h3>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Hersteller *</label>
              <select
                name="brand"
                value={formData.brand || ''}
                onChange={onChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500"
                required
              >
                <option value="">Bitte wählen</option>
                <option value="Intel">Intel</option>
                <option value="AMD">AMD</option>
                <option value="Apple">Apple</option>
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Modell *</label>
              <input
                type="text"
                name="model"
                value={formData.model || ''}
                onChange={onChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500"
                placeholder="z.B. Core i9-14900K, Ryzen 9 7950X"
                required
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Sockel</label>
              <input
                type="text"
                name="socket"
                value={formData.socket || ''}
                onChange={onChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500"
                placeholder="z.B. LGA1700, AM5"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Kerne / Threads
              </label>
              <input
                type="text"
                name="coresThreads"
                value={formData.coresThreads || ''}
                onChange={onChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500"
                placeholder="z.B. 16 Kerne / 32 Threads"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Taktfrequenz</label>
              <input
                type="text"
                name="clockSpeed"
                value={formData.clockSpeed || ''}
                onChange={onChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500"
                placeholder="z.B. 3.0 GHz - 5.8 GHz Boost"
              />
            </div>
          </div>
        </div>
      )
    }

    // RAM-SPEICHER
    if (subcategory === 'RAM-Speicher') {
      return (
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-gray-900">RAM-Details</h3>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Marke *</label>
              <input
                type="text"
                name="brand"
                value={formData.brand || ''}
                onChange={onChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500"
                placeholder="z.B. Corsair, G.Skill, Kingston"
                required
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Modell *</label>
              <input
                type="text"
                name="model"
                value={formData.model || ''}
                onChange={onChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500"
                placeholder="z.B. Vengeance RGB, Trident Z"
                required
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Kapazität *</label>
              <input
                type="text"
                name="ramCapacity"
                value={formData.ramCapacity || ''}
                onChange={onChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500"
                placeholder="z.B. 16GB (2x8GB), 32GB (4x8GB)"
                required
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Typ *</label>
              <select
                name="ramType"
                value={formData.ramType || ''}
                onChange={onChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500"
                required
              >
                <option value="">Bitte wählen</option>
                <option value="DDR5">DDR5</option>
                <option value="DDR4">DDR4</option>
                <option value="DDR3">DDR3</option>
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Taktfrequenz</label>
              <input
                type="text"
                name="ramSpeed"
                value={formData.ramSpeed || ''}
                onChange={onChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500"
                placeholder="z.B. 3200 MHz, 6000 MHz"
              />
            </div>
          </div>
        </div>
      )
    }

    // NETZWERK-HARDWARE (Router, Switches, WLAN-Adapter)
    if (
      subcategory === 'Router' ||
      subcategory === 'Switches' ||
      subcategory === 'WLAN-Adapter' ||
      subcategory === 'Netzwerk-Hardware'
    ) {
      return (
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-gray-900">Netzwerk-Details</h3>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Marke *</label>
              <input
                type="text"
                name="brand"
                value={formData.brand || ''}
                onChange={onChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500"
                placeholder="z.B. Cisco, Netgear, TP-Link, Ubiquiti"
                required
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Modell *</label>
              <input
                type="text"
                name="model"
                value={formData.model || ''}
                onChange={onChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500"
                placeholder="z.B. Nighthawk RAX200, UniFi Dream Machine"
                required
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Standard / Geschwindigkeit
              </label>
              <input
                type="text"
                name="networkSpeed"
                value={formData.networkSpeed || ''}
                onChange={onChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500"
                placeholder="z.B. Wi-Fi 6E, 10 Gigabit, AX6000"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Anzahl Ports (bei Switches/Router)
              </label>
              <input
                type="text"
                name="ports"
                value={formData.ports || ''}
                onChange={onChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500"
                placeholder="z.B. 8 Ports, 24 Ports, 48 Ports"
              />
            </div>
          </div>
        </div>
      )
    }

    // NAS-SYSTEME / SERVER & STORAGE / EXTERNE FESTPLATTEN / SSDs
    if (
      subcategory === 'NAS-Systeme' ||
      subcategory === 'Server & Storage' ||
      subcategory === 'Externe Festplatten' ||
      subcategory === 'SSDs'
    ) {
      return (
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-gray-900">Speicher-Details</h3>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Marke *</label>
              <input
                type="text"
                name="brand"
                value={formData.brand || ''}
                onChange={onChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500"
                placeholder="z.B. Synology, QNAP, Samsung, WD"
                required
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Modell *</label>
              <input
                type="text"
                name="model"
                value={formData.model || ''}
                onChange={onChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500"
                placeholder="z.B. DS923+, 980 PRO, My Passport"
                required
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Kapazität *</label>
              <input
                type="text"
                name="storageCapacity"
                value={formData.storageCapacity || ''}
                onChange={onChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500"
                placeholder="z.B. 1TB, 4TB, 16TB"
                required
              />
            </div>
            {subcategory === 'NAS-Systeme' && (
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Anzahl Laufwerksschächte
                </label>
                <input
                  type="text"
                  name="driveBays"
                  value={formData.driveBays || ''}
                  onChange={onChange}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500"
                  placeholder="z.B. 2-Bay, 4-Bay, 8-Bay"
                />
              </div>
            )}
            {(subcategory === 'SSDs' || subcategory === 'Externe Festplatten') && (
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Schnittstelle
                </label>
                <select
                  name="interface"
                  value={formData.interface || ''}
                  onChange={onChange}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Bitte wählen</option>
                  <option value="usb-c">USB-C</option>
                  <option value="usb-3.0">USB 3.0</option>
                  <option value="thunderbolt">Thunderbolt</option>
                  <option value="nvme">NVMe</option>
                  <option value="sata">SATA</option>
                </select>
              </div>
            )}
          </div>
        </div>
      )
    }

    // WEBCAMS / HEADSETS / LAUTSPRECHER
    if (subcategory === 'Webcams' || subcategory === 'Headsets' || subcategory === 'Lautsprecher') {
      return (
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-gray-900">
            {subcategory === 'Webcams'
              ? 'Webcam-Details'
              : subcategory === 'Headsets'
                ? 'Headset-Details'
                : 'Lautsprecher-Details'}
          </h3>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Marke *</label>
              <input
                type="text"
                name="brand"
                value={formData.brand || ''}
                onChange={onChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500"
                placeholder="z.B. Logitech, Sony, Bose, Razer"
                required
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Modell *</label>
              <input
                type="text"
                name="model"
                value={formData.model || ''}
                onChange={onChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500"
                placeholder={
                  subcategory === 'Webcams'
                    ? 'z.B. Brio 4K, StreamCam'
                    : subcategory === 'Headsets'
                      ? 'z.B. WH-1000XM5, QuietComfort 45'
                      : 'z.B. Sonos One, HomePod'
                }
                required
              />
            </div>
            {subcategory === 'Webcams' && (
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">Auflösung</label>
                <select
                  name="resolution"
                  value={formData.resolution || ''}
                  onChange={onChange}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Bitte wählen</option>
                  <option value="720p">720p HD</option>
                  <option value="1080p">1080p Full HD</option>
                  <option value="4k">4K UHD</option>
                </select>
              </div>
            )}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Verbindung</label>
              <input
                type="text"
                name="connectivity"
                value={formData.connectivity || ''}
                onChange={onChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500"
                placeholder="z.B. USB, Bluetooth, Kabellos"
              />
            </div>
          </div>
        </div>
      )
    }

    // SMART HOME & IOT
    if (subcategory === 'Smart Home & IoT' || subcategory === 'Smart Home') {
      return (
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-gray-900">Smart Home-Details</h3>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Marke *</label>
              <input
                type="text"
                name="brand"
                value={formData.brand || ''}
                onChange={onChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500"
                placeholder="z.B. Philips Hue, Amazon, Google"
                required
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Produkttyp</label>
              <select
                name="smartHomeType"
                value={formData.smartHomeType || ''}
                onChange={onChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Bitte wählen</option>
                <option value="smart-light">Smart Light</option>
                <option value="smart-thermostat">Smart Thermostat</option>
                <option value="smart-lock">Smart Lock</option>
                <option value="smart-security">Smart Security</option>
                <option value="smart-speaker">Smart Speaker</option>
                <option value="smart-hub">Smart Hub</option>
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Kompatibilität</label>
              <input
                type="text"
                name="compatibility"
                value={formData.compatibility || ''}
                onChange={onChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500"
                placeholder="z.B. Alexa, Google Home, HomeKit"
              />
            </div>
          </div>
        </div>
      )
    }

    // VR/AR HEADSETS
    if (subcategory === 'VR/AR Headsets' || subcategory === 'VR Headsets') {
      return (
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-gray-900">VR/AR Headset-Details</h3>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Marke *</label>
              <input
                type="text"
                name="brand"
                value={formData.brand || ''}
                onChange={onChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500"
                placeholder="z.B. Meta, HTC, Valve"
                required
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Modell *</label>
              <input
                type="text"
                name="model"
                value={formData.model || ''}
                onChange={onChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500"
                placeholder="z.B. Quest 3, Vive Pro 2"
                required
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Auflösung</label>
              <input
                type="text"
                name="resolution"
                value={formData.resolution || ''}
                onChange={onChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500"
                placeholder="z.B. 2064x2208 pro Auge"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Tracking</label>
              <select
                name="tracking"
                value={formData.tracking || ''}
                onChange={onChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Bitte wählen</option>
                <option value="inside-out">Inside-Out</option>
                <option value="outside-in">Outside-In</option>
                <option value="hand-tracking">Hand Tracking</option>
              </select>
            </div>
          </div>
        </div>
      )
    }

    // SMART TVs
    if (subcategory === 'Smart TVs' || subcategory === 'Fernseher') {
      return (
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-gray-900">Smart TV-Details</h3>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Marke *</label>
              <input
                type="text"
                name="brand"
                value={formData.brand || ''}
                onChange={onChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500"
                placeholder="z.B. Samsung, LG, Sony"
                required
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Modell *</label>
              <input
                type="text"
                name="model"
                value={formData.model || ''}
                onChange={onChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500"
                placeholder="z.B. QLED 65 Zoll, OLED55 Zoll"
                required
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Bildschirmgröße (Zoll) *
              </label>
              <input
                type="number"
                name="screenSize"
                value={formData.screenSize || ''}
                onChange={onChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500"
                placeholder="z.B. 55, 65, 75"
                required
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Auflösung *</label>
              <select
                name="resolution"
                value={formData.resolution || ''}
                onChange={onChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500"
                required
              >
                <option value="">Bitte wählen</option>
                <option value="4k">4K UHD</option>
                <option value="8k">8K UHD</option>
                <option value="1080p">Full HD</option>
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Smart TV System
              </label>
              <input
                type="text"
                name="smartSystem"
                value={formData.smartSystem || ''}
                onChange={onChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500"
                placeholder="z.B. Tizen, webOS, Android TV"
              />
            </div>
          </div>
        </div>
      )
    }

    // STREAMING-GERÄTE
    if (subcategory === 'Streaming-Geräte' || subcategory === 'Streaming') {
      return (
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-gray-900">Streaming-Gerät-Details</h3>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Marke *</label>
              <input
                type="text"
                name="brand"
                value={formData.brand || ''}
                onChange={onChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500"
                placeholder="z.B. Apple TV, Chromecast, Fire TV"
                required
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Modell *</label>
              <input
                type="text"
                name="model"
                value={formData.model || ''}
                onChange={onChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500"
                placeholder="z.B. Apple TV 4K, Chromecast Ultra"
                required
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Max. Auflösung</label>
              <select
                name="maxResolution"
                value={formData.maxResolution || ''}
                onChange={onChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Bitte wählen</option>
                <option value="4k">4K</option>
                <option value="1080p">Full HD</option>
                <option value="720p">HD</option>
              </select>
            </div>
          </div>
        </div>
      )
    }

    // NOTEBOOKS & LAPTOPS / DESKTOP-PCs / GAMING-PCs (Standard Computer-Maske)
    return (
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-gray-900">Computer-Details</h3>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Marke *</label>
            <input
              type="text"
              name="brand"
              value={formData.brand || ''}
              onChange={onChange}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500"
              placeholder="z.B. Apple, Dell, HP"
              required
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Modell *</label>
            <input
              type="text"
              name="model"
              value={formData.model || ''}
              onChange={onChange}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500"
              placeholder="z.B. MacBook Pro 16"
              required
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Prozessor</label>
            <input
              type="text"
              name="processor"
              value={formData.processor || ''}
              onChange={onChange}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500"
              placeholder="z.B. M3 Max, Intel i7"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">RAM</label>
            <input
              type="text"
              name="ram"
              value={formData.ram || ''}
              onChange={onChange}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500"
              placeholder="z.B. 16GB, 32GB"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Speicher</label>
            <input
              type="text"
              name="storage"
              value={formData.storage || ''}
              onChange={onChange}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500"
              placeholder="z.B. 512GB SSD, 1TB"
            />
          </div>
        </div>
      </div>
    )
  }

  // HANDY, FESTNETZ & FUNK
  if (category === 'handy-telefon') {
    // SMARTWATCHES
    if (subcategory === 'Smartwatches') {
      return (
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-gray-900">Smartwatch-Details</h3>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Marke *</label>
              <input
                type="text"
                name="brand"
                value={formData.brand || ''}
                onChange={onChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500"
                placeholder="z.B. Apple, Samsung, Garmin"
                required
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Modell *</label>
              <input
                type="text"
                name="model"
                value={formData.model || ''}
                onChange={onChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500"
                placeholder="z.B. Apple Watch Series 9, Galaxy Watch 6"
                required
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Gehäusegröße</label>
              <input
                type="text"
                name="caseSize"
                value={formData.caseSize || ''}
                onChange={onChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500"
                placeholder="z.B. 41mm, 45mm, 40mm, 44mm"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Material</label>
              <input
                type="text"
                name="material"
                value={formData.material || ''}
                onChange={onChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500"
                placeholder="z.B. Aluminium, Edelstahl, Titan"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Konnektivität</label>
              <select
                name="connectivity"
                value={formData.connectivity || ''}
                onChange={onChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Bitte wählen</option>
                <option value="gps">GPS</option>
                <option value="gps-cellular">GPS + Cellular</option>
              </select>
            </div>
          </div>
        </div>
      )
    }

    // IPHONES (speziell)
    if (subcategory === 'iPhones') {
      return (
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-gray-900">iPhone-Details</h3>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Modell *</label>
              <select
                name="model"
                value={formData.model || ''}
                onChange={onChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500"
                required
              >
                <option value="">Bitte wählen</option>
                <option value="iPhone 15 Pro Max">iPhone 15 Pro Max</option>
                <option value="iPhone 15 Pro">iPhone 15 Pro</option>
                <option value="iPhone 15 Plus">iPhone 15 Plus</option>
                <option value="iPhone 15">iPhone 15</option>
                <option value="iPhone 14 Pro Max">iPhone 14 Pro Max</option>
                <option value="iPhone 14 Pro">iPhone 14 Pro</option>
                <option value="iPhone 14">iPhone 14</option>
                <option value="iPhone 13">iPhone 13</option>
                <option value="iPhone SE">iPhone SE</option>
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Speicher *</label>
              <select
                name="storage"
                value={formData.storage || ''}
                onChange={onChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500"
                required
              >
                <option value="">Bitte wählen</option>
                <option value="128GB">128GB</option>
                <option value="256GB">256GB</option>
                <option value="512GB">512GB</option>
                <option value="1TB">1TB</option>
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Farbe</label>
              <input
                type="text"
                name="color"
                value={formData.color || ''}
                onChange={onChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500"
                placeholder="z.B. Natur Titan, Schwarz Titan, Blau"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Batteriezustand (%)
              </label>
              <input
                type="number"
                name="batteryHealth"
                value={formData.batteryHealth || ''}
                onChange={onChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500"
                placeholder="z.B. 95, 85, 100"
                min="0"
                max="100"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">SIM-Lock</label>
              <select
                name="simLock"
                value={formData.simLock || ''}
                onChange={onChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Bitte wählen</option>
                <option value="ohne">Ohne SIM-Lock</option>
                <option value="mit">Mit SIM-Lock</option>
              </select>
            </div>
          </div>
        </div>
      )
    }

    // SMARTPHONES (Standard)
    return (
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-gray-900">Smartphone-Details</h3>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Marke *</label>
            <input
              type="text"
              name="brand"
              value={formData.brand || ''}
              onChange={onChange}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500"
              placeholder="z.B. Samsung, Google, Xiaomi"
              required
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Modell *</label>
            <input
              type="text"
              name="model"
              value={formData.model || ''}
              onChange={onChange}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500"
              placeholder="z.B. Galaxy S23 Ultra, Pixel 8 Pro"
              required
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Speicher</label>
            <input
              type="text"
              name="storage"
              value={formData.storage || ''}
              onChange={onChange}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500"
              placeholder="z.B. 256GB, 512GB"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Farbe</label>
            <input
              type="text"
              name="color"
              value={formData.color || ''}
              onChange={onChange}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500"
              placeholder="z.B. Phantom Black, Cloud White"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Batteriezustand (%)
            </label>
            <input
              type="number"
              name="batteryHealth"
              value={formData.batteryHealth || ''}
              onChange={onChange}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500"
              placeholder="z.B. 95"
              min="0"
              max="100"
            />
          </div>
        </div>
      </div>
    )
  }

  // FOTO & OPTIK
  if (category === 'foto-optik') {
    // OBJEKTIVE
    if (subcategory === 'Objektive') {
      return (
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-gray-900">Objektiv-Details</h3>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Marke *</label>
              <input
                type="text"
                name="brand"
                value={formData.brand || ''}
                onChange={onChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500"
                placeholder="z.B. Canon, Nikon, Sony, Sigma"
                required
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Modell *</label>
              <input
                type="text"
                name="model"
                value={formData.model || ''}
                onChange={onChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500"
                placeholder="z.B. RF 24-70mm f/2.8L, FE 85mm f/1.4 GM"
                required
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Brennweite *</label>
              <input
                type="text"
                name="focalLength"
                value={formData.focalLength || ''}
                onChange={onChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500"
                placeholder="z.B. 24-70mm, 50mm, 70-200mm"
                required
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Max. Blende *</label>
              <input
                type="text"
                name="aperture"
                value={formData.aperture || ''}
                onChange={onChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500"
                placeholder="z.B. f/1.4, f/2.8, f/4"
                required
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Anschluss / Mount
              </label>
              <input
                type="text"
                name="mount"
                value={formData.mount || ''}
                onChange={onChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500"
                placeholder="z.B. Canon RF, Sony E, Nikon Z"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Bildstabilisator
              </label>
              <select
                name="imageStabilization"
                value={formData.imageStabilization || ''}
                onChange={onChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Bitte wählen</option>
                <option value="ja">Ja (IS/VR/OSS)</option>
                <option value="nein">Nein</option>
              </select>
            </div>
          </div>
        </div>
      )
    }

    // DROHNEN
    if (subcategory === 'Drohnen mit Kamera' || subcategory === 'Drohnen') {
      return (
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-gray-900">Drohnen-Details</h3>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Marke *</label>
              <input
                type="text"
                name="brand"
                value={formData.brand || ''}
                onChange={onChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500"
                placeholder="z.B. DJI, Autel, Parrot"
                required
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Modell *</label>
              <input
                type="text"
                name="model"
                value={formData.model || ''}
                onChange={onChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500"
                placeholder="z.B. Mavic 3 Pro, Mini 3 Pro"
                required
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Kamera-Auflösung
              </label>
              <input
                type="text"
                name="cameraResolution"
                value={formData.cameraResolution || ''}
                onChange={onChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500"
                placeholder="z.B. 4K 60fps, 5.1K 50fps"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Flugzeit (Minuten)
              </label>
              <input
                type="text"
                name="flightTime"
                value={formData.flightTime || ''}
                onChange={onChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500"
                placeholder="z.B. 34 Min, 46 Min"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Max. Reichweite
              </label>
              <input
                type="text"
                name="maxRange"
                value={formData.maxRange || ''}
                onChange={onChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500"
                placeholder="z.B. 15km, 10km"
              />
            </div>
          </div>
        </div>
      )
    }

    // KAMERAS (Standard)
    return (
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-gray-900">Kamera-Details</h3>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Marke *</label>
            <input
              type="text"
              name="brand"
              value={formData.brand || ''}
              onChange={onChange}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500"
              placeholder="z.B. Canon, Nikon, Sony"
              required
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Modell *</label>
            <input
              type="text"
              name="model"
              value={formData.model || ''}
              onChange={onChange}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500"
              placeholder="z.B. EOS R5, A7 IV"
              required
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Megapixel</label>
            <input
              type="text"
              name="megapixels"
              value={formData.megapixels || ''}
              onChange={onChange}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500"
              placeholder="z.B. 45MP, 24MP"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Sensorformat</label>
            <select
              name="sensorFormat"
              value={formData.sensorFormat || ''}
              onChange={onChange}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Bitte wählen</option>
              <option value="vollformat">Vollformat</option>
              <option value="aps-c">APS-C</option>
              <option value="micro-four-thirds">Micro Four Thirds</option>
            </select>
          </div>
        </div>
      </div>
    )
  }

  // GAMES & SPIELKONSOLEN
  if (category === 'games-konsolen') {
    return (
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-gray-900">Gaming-Details</h3>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Plattform *</label>
            <select
              name="platform"
              value={formData.platform || ''}
              onChange={onChange}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500"
              required
            >
              <option value="">Bitte wählen</option>
              <option value="ps5">PlayStation 5</option>
              <option value="ps4">PlayStation 4</option>
              <option value="xbox-series">Xbox Series X/S</option>
              <option value="xbox-one">Xbox One</option>
              <option value="switch">Nintendo Switch</option>
              <option value="pc">PC</option>
            </select>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Spiel/Konsole *</label>
            <input
              type="text"
              name="gameName"
              value={formData.gameName || ''}
              onChange={onChange}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500"
              placeholder="z.B. PlayStation 5, FIFA 24"
              required
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Edition</label>
            <input
              type="text"
              name="edition"
              value={formData.edition || ''}
              onChange={onChange}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500"
              placeholder="z.B. Digital Edition, Deluxe"
            />
          </div>
        </div>
      </div>
    )
  }

  // KLEIDUNG & ACCESSOIRES
  if (category === 'kleidung-accessoires') {
    // SCHUHE (Alle Schuh-Kategorien)
    if (
      subcategory?.includes('schuhe') ||
      subcategory?.includes('Sneakers') ||
      subcategory?.includes('Stiefel') ||
      subcategory === 'Boots' ||
      subcategory === 'Sandalen' ||
      subcategory === 'Pumps'
    ) {
      return (
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-gray-900">Schuh-Details</h3>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Marke *</label>
              <input
                type="text"
                name="brand"
                value={formData.brand || ''}
                onChange={onChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500"
                placeholder="z.B. Nike, Adidas, Louboutin"
                required
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Modell</label>
              <input
                type="text"
                name="model"
                value={formData.model || ''}
                onChange={onChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500"
                placeholder="z.B. Air Max 90, Stan Smith"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Schuhgröße *</label>
              <input
                type="text"
                name="shoeSize"
                value={formData.shoeSize || ''}
                onChange={onChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500"
                placeholder="z.B. 42, 39, 10.5 US"
                required
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Farbe</label>
              <input
                type="text"
                name="color"
                value={formData.color || ''}
                onChange={onChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500"
                placeholder="z.B. Schwarz, Weiß, Rot"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Material</label>
              <input
                type="text"
                name="material"
                value={formData.material || ''}
                onChange={onChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500"
                placeholder="z.B. Leder, Wildleder, Textil"
              />
            </div>
          </div>
        </div>
      )
    }

    // TASCHEN (Handtaschen, Rucksäcke, Koffer)
    if (
      subcategory?.includes('Taschen') ||
      subcategory?.includes('Rucksäcke') ||
      subcategory?.includes('Koffer') ||
      subcategory === 'Clutches' ||
      subcategory === 'Trolleys'
    ) {
      return (
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-gray-900">Taschen-Details</h3>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Marke *</label>
              <input
                type="text"
                name="brand"
                value={formData.brand || ''}
                onChange={onChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500"
                placeholder="z.B. Louis Vuitton, Samsonite, Fjällräven"
                required
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Modell</label>
              <input
                type="text"
                name="model"
                value={formData.model || ''}
                onChange={onChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500"
                placeholder="z.B. Neverfull, Kånken"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Material *</label>
              <input
                type="text"
                name="material"
                value={formData.material || ''}
                onChange={onChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500"
                placeholder="z.B. Leder, Canvas, Nylon"
                required
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Farbe</label>
              <input
                type="text"
                name="color"
                value={formData.color || ''}
                onChange={onChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500"
                placeholder="z.B. Schwarz, Braun, Beige"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Größe/Volumen</label>
              <input
                type="text"
                name="bagSize"
                value={formData.bagSize || ''}
                onChange={onChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500"
                placeholder="z.B. Medium, 20L, 55cm"
              />
            </div>
          </div>
        </div>
      )
    }

    // SONNENBRILLEN
    if (subcategory === 'Sonnenbrillen' || subcategory === 'Markensonnenbrillen') {
      return (
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-gray-900">Sonnenbrillen-Details</h3>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Marke *</label>
              <input
                type="text"
                name="brand"
                value={formData.brand || ''}
                onChange={onChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500"
                placeholder="z.B. Ray-Ban, Oakley, Gucci"
                required
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Modell *</label>
              <input
                type="text"
                name="model"
                value={formData.model || ''}
                onChange={onChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500"
                placeholder="z.B. Wayfarer, Aviator, GG0061S"
                required
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Rahmenform</label>
              <select
                name="frameShape"
                value={formData.frameShape || ''}
                onChange={onChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Bitte wählen</option>
                <option value="rechteckig">Rechteckig</option>
                <option value="rund">Rund</option>
                <option value="aviator">Aviator</option>
                <option value="wayfarer">Wayfarer</option>
                <option value="cat-eye">Cat-Eye</option>
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Farbe</label>
              <input
                type="text"
                name="color"
                value={formData.color || ''}
                onChange={onChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500"
                placeholder="z.B. Schwarz, Braun, Gold"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">UV-Schutz</label>
              <select
                name="uvProtection"
                value={formData.uvProtection || ''}
                onChange={onChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Bitte wählen</option>
                <option value="UV400">UV400</option>
                <option value="100%">100% UV-Schutz</option>
              </select>
            </div>
          </div>
        </div>
      )
    }

    // ACCESSOIRES (Gürtel, Schals, Mützen, Handschuhe, Schulbedarf, etc.)
    if (
      subcategory?.includes('Gürtel') ||
      subcategory?.includes('Schals') ||
      subcategory?.includes('Tücher') ||
      subcategory?.includes('Mützen') ||
      subcategory?.includes('Caps') ||
      subcategory?.includes('Handschuhe') ||
      subcategory?.includes('Krawatten') ||
      subcategory?.includes('Fliegen') ||
      subcategory?.includes('Schmuck') ||
      subcategory?.includes('Schulbedarf') || // Schulbedarf wie Federmäppchen sind Accessoires
      subcategory?.includes('Accessoires') ||
      subcategory === 'Gürtel' ||
      subcategory === 'Ledergürtel' ||
      subcategory === 'Schals & Tücher' ||
      subcategory === 'Seidenschals' ||
      subcategory === 'Mützen & Caps' ||
      subcategory === 'Wintermützen' ||
      subcategory === 'Baseballcaps' ||
      subcategory === 'Handschuhe' ||
      subcategory === 'Lederhandschuhe' ||
      subcategory === 'Krawatten' ||
      subcategory === 'Fliegen' ||
      subcategory === 'Schmuck' ||
      subcategory === 'Goldschmuck' ||
      subcategory === 'Silberschmuck' ||
      subcategory === 'Ringe' ||
      subcategory === 'Ketten' ||
      subcategory === 'Ohrringe' ||
      subcategory === 'Schulbedarf'
    ) {
      return (
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-gray-900">Accessoires-Details</h3>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Marke *</label>
              <input
                type="text"
                name="brand"
                value={formData.brand || ''}
                onChange={onChange}
                disabled={disabled}
                className={`w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 ${disabled ? 'cursor-not-allowed bg-gray-100' : ''}`}
                placeholder="z.B. Gucci, Hermès, Milan"
                required
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
                className={`w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 ${disabled ? 'cursor-not-allowed bg-gray-100' : ''}`}
                placeholder="z.B. Modellbezeichnung"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Material</label>
              <input
                type="text"
                name="material"
                value={formData.material || ''}
                onChange={onChange}
                disabled={disabled}
                className={`w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 ${disabled ? 'cursor-not-allowed bg-gray-100' : ''}`}
                placeholder="z.B. Leder, Seide, Baumwolle, Kunststoff"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Farbe</label>
              <input
                type="text"
                name="color"
                value={formData.color || ''}
                onChange={onChange}
                disabled={disabled}
                className={`w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 ${disabled ? 'cursor-not-allowed bg-gray-100' : ''}`}
                placeholder="z.B. Schwarz, Rot, Regenbogen"
              />
            </div>
            {/* Größe nur für bestimmte Accessoires (z.B. Gürtel) */}
            {(subcategory?.includes('Gürtel') || subcategory === 'Gürtel' || subcategory === 'Ledergürtel') && (
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">Größe</label>
                <input
                  type="text"
                  name="size"
                  value={formData.size || ''}
                  onChange={onChange}
                  disabled={disabled}
                  className={`w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 ${disabled ? 'cursor-not-allowed bg-gray-100' : ''}`}
                  placeholder="z.B. 90cm, 100cm, L"
                />
              </div>
            )}
          </div>
        </div>
      )
    }

    // KLEIDUNG STANDARD (Damenbekleidung, Herrenbekleidung, etc.)
    return (
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-gray-900">Kleidungs-Details</h3>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Marke</label>
            <input
              type="text"
              name="brand"
              value={formData.brand || ''}
              onChange={onChange}
              disabled={disabled}
              className={`w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 ${disabled ? 'cursor-not-allowed bg-gray-100' : ''}`}
              placeholder="z.B. Zara, H&M, Hugo Boss"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Größe *</label>
            <input
              type="text"
              name="size"
              value={formData.size || ''}
              onChange={onChange}
              disabled={disabled}
              className={`w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 ${disabled ? 'cursor-not-allowed bg-gray-100' : ''}`}
              placeholder="z.B. M, 42, L"
              required
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Farbe</label>
            <input
              type="text"
              name="color"
              value={formData.color || ''}
              onChange={onChange}
              disabled={disabled}
              className={`w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 ${disabled ? 'cursor-not-allowed bg-gray-100' : ''}`}
              placeholder="z.B. Schwarz, Blau"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Material</label>
            <input
              type="text"
              name="material"
              value={formData.material || ''}
              onChange={onChange}
              disabled={disabled}
              className={`w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 ${disabled ? 'cursor-not-allowed bg-gray-100' : ''}`}
              placeholder="z.B. Baumwolle, Leder, Wolle"
            />
          </div>
        </div>
      </div>
    )
  }

  // UHREN & SCHMUCK
  if (category === 'uhren-schmuck') {
    return (
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-gray-900">Uhren/Schmuck-Details</h3>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Marke *</label>
            <input
              type="text"
              name="brand"
              value={formData.brand || ''}
              onChange={onChange}
              disabled={disabled}
              className={`w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 ${disabled ? 'cursor-not-allowed bg-gray-100' : ''}`}
              placeholder="z.B. Rolex, Omega, Cartier"
              required
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Modell *</label>
            <input
              type="text"
              name="model"
              value={formData.model || ''}
              onChange={onChange}
              disabled={disabled}
              className={`w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 ${disabled ? 'cursor-not-allowed bg-gray-100' : ''}`}
              placeholder="z.B. Submariner, Speedmaster"
              required
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Material</label>
            <input
              type="text"
              name="material"
              value={formData.material || ''}
              onChange={onChange}
              disabled={disabled}
              className={`w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 ${disabled ? 'cursor-not-allowed bg-gray-100' : ''}`}
              placeholder="z.B. Edelstahl, Gold 18K"
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
              className={`w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 ${disabled ? 'cursor-not-allowed bg-gray-100' : ''}`}
              placeholder="z.B. 2022"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Referenznummer</label>
            <input
              type="text"
              name="referenceNumber"
              value={formData.referenceNumber || ''}
              onChange={onChange}
              disabled={disabled}
              className={`w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 ${disabled ? 'cursor-not-allowed bg-gray-100' : ''}`}
              placeholder="z.B. 126610LN"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Gehäusedurchmesser (mm)
            </label>
            <input
              type="number"
              name="caseDiameter"
              value={formData.caseDiameter || ''}
              onChange={onChange}
              disabled={disabled}
              className={`w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 ${disabled ? 'cursor-not-allowed bg-gray-100' : ''}`}
              placeholder="z.B. 41"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Uhrwerk</label>
            <input
              type="text"
              name="movement"
              value={formData.movement || ''}
              onChange={onChange}
              disabled={disabled}
              className={`w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 ${disabled ? 'cursor-not-allowed bg-gray-100' : ''}`}
              placeholder="z.B. Automatik, Quarz"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Letzte Revision</label>
            <input
              type="date"
              name="lastRevision"
              value={formData.lastRevision || ''}
              onChange={onChange}
              disabled={disabled}
              className={`w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 ${disabled ? 'cursor-not-allowed bg-gray-100' : ''}`}
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Ganggenauigkeit</label>
            <input
              type="text"
              name="accuracy"
              value={formData.accuracy || ''}
              onChange={onChange}
              disabled={disabled}
              className={`w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 ${disabled ? 'cursor-not-allowed bg-gray-100' : ''}`}
              placeholder="z.B. +2/-2 Sekunden pro Tag"
            />
          </div>
        </div>
      </div>
    )
  }

  // HAUSHALT & WOHNEN
  if (category === 'haushalt-wohnen') {
    // MÖBEL (Sofas, Tische, Schränke, Betten)
    if (
      subcategory?.includes('Möbel') ||
      subcategory?.includes('Sofas') ||
      subcategory?.includes('Tische') ||
      subcategory?.includes('Schränke') ||
      subcategory?.includes('Betten') ||
      subcategory === 'Couches' ||
      subcategory === 'Sessel' ||
      subcategory === 'Stühle' ||
      subcategory === 'Regale' ||
      subcategory === 'Kommoden'
    ) {
      return (
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-gray-900">Möbel-Details</h3>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Marke</label>
              <input
                type="text"
                name="brand"
                value={formData.brand || ''}
                onChange={onChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500"
                placeholder="z.B. IKEA, USM, Vitra"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Modell/Name</label>
              <input
                type="text"
                name="model"
                value={formData.model || ''}
                onChange={onChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500"
                placeholder="z.B. Ektorp, Haller, Panton Chair"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Maße (L×B×H) *</label>
              <input
                type="text"
                name="dimensions"
                value={formData.dimensions || ''}
                onChange={onChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500"
                placeholder="z.B. 200×90×80 cm"
                required
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Material</label>
              <input
                type="text"
                name="material"
                value={formData.material || ''}
                onChange={onChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500"
                placeholder="z.B. Eiche, Leder, Stoff"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Farbe</label>
              <input
                type="text"
                name="color"
                value={formData.color || ''}
                onChange={onChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500"
                placeholder="z.B. Grau, Weiß, Braun"
              />
            </div>
          </div>
        </div>
      )
    }

    // HAUSHALTSGERÄTE (Waschmaschinen, Kühlschränke, Staubsauger, etc.)
    if (
      subcategory?.includes('Haushaltsgeräte') ||
      subcategory?.includes('Wasch') ||
      subcategory?.includes('Kühl') ||
      subcategory?.includes('Staubsauger') ||
      subcategory === 'Trockner' ||
      subcategory === 'Geschirrspüler'
    ) {
      return (
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-gray-900">Haushaltsgerät-Details</h3>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Marke *</label>
              <input
                type="text"
                name="brand"
                value={formData.brand || ''}
                onChange={onChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500"
                placeholder="z.B. Miele, Bosch, Siemens"
                required
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Modell *</label>
              <input
                type="text"
                name="model"
                value={formData.model || ''}
                onChange={onChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500"
                placeholder="z.B. WMH 260 WPS, KGN39VLDA"
                required
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Energieeffizienz
              </label>
              <select
                name="energyRating"
                value={formData.energyRating || ''}
                onChange={onChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Bitte wählen</option>
                <option value="A+++">A+++</option>
                <option value="A++">A++</option>
                <option value="A+">A+</option>
                <option value="A">A</option>
                <option value="B">B</option>
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Baujahr</label>
              <input
                type="number"
                name="year"
                value={formData.year || ''}
                onChange={onChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500"
                placeholder="z.B. 2022, 2020"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Farbe</label>
              <input
                type="text"
                name="color"
                value={formData.color || ''}
                onChange={onChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500"
                placeholder="z.B. Weiß, Edelstahl, Schwarz"
              />
            </div>
          </div>
        </div>
      )
    }

    // LAMPEN & LEUCHTEN
    if (subcategory?.includes('Lampen') || subcategory?.includes('lampen')) {
      return (
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-gray-900">Lampen-Details</h3>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Marke</label>
              <input
                type="text"
                name="brand"
                value={formData.brand || ''}
                onChange={onChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500"
                placeholder="z.B. Philips Hue, Artemide, IKEA"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Modell</label>
              <input
                type="text"
                name="model"
                value={formData.model || ''}
                onChange={onChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500"
                placeholder="z.B. Tolomeo, Hue Go"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Leuchtmittel</label>
              <select
                name="lightType"
                value={formData.lightType || ''}
                onChange={onChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Bitte wählen</option>
                <option value="led">LED</option>
                <option value="halogen">Halogen</option>
                <option value="glühbirne">Glühbirne</option>
                <option value="smart">Smart LED</option>
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Farbe</label>
              <input
                type="text"
                name="color"
                value={formData.color || ''}
                onChange={onChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500"
                placeholder="z.B. Schwarz, Weiß, Chrom"
              />
            </div>
          </div>
        </div>
      )
    }

    // KÜCHENGERÄTE (Kaffeemaschinen, Mixer, Toaster, etc.)
    if (
      subcategory?.includes('Küchengeräte') ||
      subcategory === 'Kaffeemaschinen' ||
      subcategory === 'Mixer' ||
      subcategory === 'Toaster' ||
      subcategory === 'Backöfen'
    ) {
      return (
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-gray-900">Küchengerät-Details</h3>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Marke *</label>
              <input
                type="text"
                name="brand"
                value={formData.brand || ''}
                onChange={onChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500"
                placeholder="z.B. Nespresso, KitchenAid, WMF"
                required
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Modell *</label>
              <input
                type="text"
                name="model"
                value={formData.model || ''}
                onChange={onChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500"
                placeholder="z.B. Vertuo Plus, Artisan, Thermomix TM6"
                required
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Leistung (Watt)
              </label>
              <input
                type="text"
                name="power"
                value={formData.power || ''}
                onChange={onChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500"
                placeholder="z.B. 1500W, 800W"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Farbe</label>
              <input
                type="text"
                name="color"
                value={formData.color || ''}
                onChange={onChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500"
                placeholder="z.B. Schwarz, Rot, Edelstahl"
              />
            </div>
          </div>
        </div>
      )
    }

    // GESCHIRR & BESTECK (Besteck-Sets, Teller, Tassen, Gläser)
    if (
      subcategory === 'Besteck-Sets' ||
      subcategory === 'Geschirr & Besteck' ||
      subcategory === 'Teller' ||
      subcategory === 'Tassen' ||
      subcategory === 'Gläser'
    ) {
      return (
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-gray-900">Besteck/Geschirr-Details</h3>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Material</label>
              <input
                type="text"
                name="material"
                value={formData.material || ''}
                onChange={onChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500"
                placeholder="z.B. Edelstahl, Silber, Porzellan, Keramik"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Anzahl der Teile
              </label>
              <input
                type="text"
                name="pieceCount"
                value={formData.pieceCount || ''}
                onChange={onChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500"
                placeholder="z.B. 24-teilig, 12-teilig"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Design/Stil</label>
              <input
                type="text"
                name="design"
                value={formData.design || ''}
                onChange={onChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500"
                placeholder="z.B. Modern, Klassisch, Vintage"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Marke (optional)
              </label>
              <input
                type="text"
                name="brand"
                value={formData.brand || ''}
                onChange={onChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500"
                placeholder="z.B. WMF, Zwilling, IKEA"
              />
            </div>
          </div>
        </div>
      )
    }

    // HAUSHALT STANDARD
    return (
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-gray-900">Haushalt-Details</h3>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Marke</label>
            <input
              type="text"
              name="brand"
              value={formData.brand || ''}
              onChange={onChange}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500"
              placeholder="z.B. IKEA, Miele, Bosch"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Maße (L×B×H)</label>
            <input
              type="text"
              name="dimensions"
              value={formData.dimensions || ''}
              onChange={onChange}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500"
              placeholder="z.B. 200×90×80 cm"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Farbe</label>
            <input
              type="text"
              name="color"
              value={formData.color || ''}
              onChange={onChange}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500"
              placeholder="z.B. Grau, Weiß"
            />
          </div>
        </div>
      </div>
    )
  }

  // HANDWERK & GARTEN
  if (category === 'handwerk-garten') {
    // ELEKTROWERKZEUGE / HANDWERKZEUGE
    if (subcategory === 'Elektrowerkzeuge' || subcategory === 'Handwerkzeuge') {
      return (
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-gray-900">Werkzeug-Details</h3>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Marke *</label>
              <input
                type="text"
                name="brand"
                value={formData.brand || ''}
                onChange={onChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500"
                placeholder="z.B. Bosch, Makita, Hilti, DeWalt"
                required
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Modell *</label>
              <input
                type="text"
                name="model"
                value={formData.model || ''}
                onChange={onChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500"
                placeholder="z.B. GSB 18V-55, DHP453"
                required
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Werkzeugtyp *</label>
              <input
                type="text"
                name="toolType"
                value={formData.toolType || ''}
                onChange={onChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500"
                placeholder="z.B. Bohrmaschine, Akkuschrauber, Säge"
                required
              />
            </div>
            {subcategory === 'Elektrowerkzeuge' && (
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Spannung / Leistung
                </label>
                <input
                  type="text"
                  name="power"
                  value={formData.power || ''}
                  onChange={onChange}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500"
                  placeholder="z.B. 18V, 2000W, 20V"
                />
              </div>
            )}
          </div>
        </div>
      )
    }

    // RASENMÄHER / GARTENGERÄTE
    if (subcategory === 'Rasenmäher' || subcategory?.includes('Garten')) {
      return (
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-gray-900">Gartengeräte-Details</h3>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Marke *</label>
              <input
                type="text"
                name="brand"
                value={formData.brand || ''}
                onChange={onChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500"
                placeholder="z.B. Husqvarna, Bosch, Gardena"
                required
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Modell *</label>
              <input
                type="text"
                name="model"
                value={formData.model || ''}
                onChange={onChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500"
                placeholder="z.B. Automower 315X, Rotak 43"
                required
              />
            </div>
            {subcategory === 'Rasenmäher' && (
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">Antriebsart</label>
                <select
                  name="driveType"
                  value={formData.driveType || ''}
                  onChange={onChange}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Bitte wählen</option>
                  <option value="akku">Akku</option>
                  <option value="benzin">Benzin</option>
                  <option value="elektro">Elektro</option>
                  <option value="roboter">Mähroboter</option>
                </select>
              </div>
            )}
          </div>
        </div>
      )
    }

    // HANDWERK & GARTEN STANDARD
    return (
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-gray-900">Werkzeug/Garten-Details</h3>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Marke</label>
            <input
              type="text"
              name="brand"
              value={formData.brand || ''}
              onChange={onChange}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500"
              placeholder="z.B. Bosch, Makita, Gardena"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Leistung</label>
            <input
              type="text"
              name="power"
              value={formData.power || ''}
              onChange={onChange}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500"
              placeholder="z.B. 2000W, 18V"
            />
          </div>
        </div>
      </div>
    )
  }

  // SPORT
  if (category === 'sport') {
    // FAHRRÄDER (E-Bikes, Mountainbikes, Rennvelos, Citybikes)
    if (
      subcategory === 'Fahrräder' ||
      subcategory === 'E-Bikes' ||
      subcategory === 'Mountainbikes' ||
      subcategory === 'Rennvelos' ||
      subcategory === 'Citybikes'
    ) {
      return (
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-gray-900">Fahrrad-Details</h3>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Marke *</label>
              <input
                type="text"
                name="brand"
                value={formData.brand || ''}
                onChange={onChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500"
                placeholder="z.B. Trek, Scott, Canyon, Specialized"
                required
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Modell *</label>
              <input
                type="text"
                name="model"
                value={formData.model || ''}
                onChange={onChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500"
                placeholder="z.B. Fuel EX 9.8, Powerfly 5"
                required
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Rahmengröße *</label>
              <input
                type="text"
                name="frameSize"
                value={formData.frameSize || ''}
                onChange={onChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500"
                placeholder="z.B. M (18.5), L (19.5), 54cm"
                required
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Radgröße</label>
              <input
                type="text"
                name="wheelSize"
                value={formData.wheelSize || ''}
                onChange={onChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500"
                placeholder="z.B. 29 Zoll, 27.5, 26"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Schaltung</label>
              <input
                type="text"
                name="gears"
                value={formData.gears || ''}
                onChange={onChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500"
                placeholder="z.B. Shimano XT 12-fach, SRAM GX Eagle"
              />
            </div>
            {subcategory === 'E-Bikes' && (
              <>
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">Motor</label>
                  <input
                    type="text"
                    name="motor"
                    value={formData.motor || ''}
                    onChange={onChange}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500"
                    placeholder="z.B. Bosch Performance CX, Shimano Steps"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Akku-Kapazität
                  </label>
                  <input
                    type="text"
                    name="batteryCapacity"
                    value={formData.batteryCapacity || ''}
                    onChange={onChange}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500"
                    placeholder="z.B. 625Wh, 500Wh"
                  />
                </div>
              </>
            )}
          </div>
        </div>
      )
    }

    // SKI & SNOWBOARD
    if (
      subcategory === 'Ski & Snowboard' ||
      subcategory === 'Ski' ||
      subcategory === 'Snowboards' ||
      subcategory === 'Skischuhe'
    ) {
      const isSki = subcategory?.includes('Ski') && !subcategory?.includes('Snowboard')
      const isBoots = subcategory === 'Skischuhe'
      return (
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-gray-900">
            {isBoots ? 'Skischuh-Details' : isSki ? 'Ski-Details' : 'Snowboard-Details'}
          </h3>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Marke *</label>
              <input
                type="text"
                name="brand"
                value={formData.brand || ''}
                onChange={onChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500"
                placeholder={
                  isBoots ? 'z.B. Salomon, Rossignol, Atomic' : 'z.B. Atomic, K2, Burton, Nitro'
                }
                required
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Modell *</label>
              <input
                type="text"
                name="model"
                value={formData.model || ''}
                onChange={onChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500"
                placeholder="z.B. Redster X9, Custom Flying V"
                required
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                {isBoots ? 'Schuhgröße *' : 'Länge *'}
              </label>
              <input
                type="text"
                name={isBoots ? 'shoeSize' : 'length'}
                value={formData[isBoots ? 'shoeSize' : 'length'] || ''}
                onChange={onChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500"
                placeholder={
                  isBoots
                    ? 'z.B. 42, 27.5 (Mondopoint)'
                    : isSki
                      ? 'z.B. 170cm, 180cm'
                      : 'z.B. 156cm, 162cm'
                }
                required
              />
            </div>
            {!isBoots && (
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">Level</label>
                <select
                  name="skillLevel"
                  value={formData.skillLevel || ''}
                  onChange={onChange}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Bitte wählen</option>
                  <option value="anfaenger">Anfänger</option>
                  <option value="fortgeschritten">Fortgeschritten</option>
                  <option value="expert">Expert</option>
                </select>
              </div>
            )}
          </div>
        </div>
      )
    }

    // FITNESS (Laufbänder, Crosstrainer, Hanteln, Fitnessbänke)
    if (
      subcategory === 'Fitnessgeräte' ||
      subcategory === 'Laufbänder' ||
      subcategory === 'Crosstrainer' ||
      subcategory === 'Hanteln' ||
      subcategory === 'Fitnessbänke'
    ) {
      return (
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-gray-900">Fitnessgeräte-Details</h3>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Marke *</label>
              <input
                type="text"
                name="brand"
                value={formData.brand || ''}
                onChange={onChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500"
                placeholder="z.B. Technogym, Life Fitness, Bowflex"
                required
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Modell *</label>
              <input
                type="text"
                name="model"
                value={formData.model || ''}
                onChange={onChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500"
                placeholder="z.B. Run 600, Synchro Forma"
                required
              />
            </div>
            {subcategory === 'Hanteln' && (
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">Gewicht *</label>
                <input
                  type="text"
                  name="weight"
                  value={formData.weight || ''}
                  onChange={onChange}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500"
                  placeholder="z.B. 2x 20kg, Set 5-30kg"
                  required
                />
              </div>
            )}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Zustand *</label>
              <select
                name="condition"
                value={formData.condition || ''}
                onChange={onChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500"
                required
              >
                <option value="">Bitte wählen</option>
                <option value="neu">Neu</option>
                <option value="wie-neu">Wie neu</option>
                <option value="sehr-gut">Sehr gut</option>
                <option value="gut">Gut</option>
                <option value="gebraucht">Gebraucht</option>
              </select>
            </div>
          </div>
        </div>
      )
    }

    // SPORT STANDARD
    return (
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-gray-900">Sport-Details</h3>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Marke</label>
            <input
              type="text"
              name="brand"
              value={formData.brand || ''}
              onChange={onChange}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500"
              placeholder="z.B. Nike, Adidas, Wilson"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Größe/Rahmengröße
            </label>
            <input
              type="text"
              name="size"
              value={formData.size || ''}
              onChange={onChange}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500"
              placeholder="z.B. 42, L, M"
            />
          </div>
        </div>
      </div>
    )
  }

  // KIND & BABY
  if (category === 'kind-baby') {
    return (
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-gray-900">Kind/Baby-Details</h3>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Alter/Größe</label>
            <input
              type="text"
              name="size"
              value={formData.size || ''}
              onChange={onChange}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500"
              placeholder="z.B. 0-6 Monate, 98-104"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Marke</label>
            <input
              type="text"
              name="brand"
              value={formData.brand || ''}
              onChange={onChange}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500"
              placeholder="z.B. Bugaboo, Fisher-Price"
            />
          </div>
        </div>
      </div>
    )
  }

  // BÜCHER (vollständige Version)
  if (category === 'buecher') {
    return (
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-gray-900">Buch-Details</h3>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Autor *</label>
            <input
              type="text"
              name="author"
              value={formData.author || ''}
              onChange={onChange}
              disabled={disabled}
              className={`w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 ${disabled ? 'cursor-not-allowed bg-gray-100' : ''}`}
              placeholder="z.B. J.K. Rowling, Max Frisch"
              required
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Titel *</label>
            <input
              type="text"
              name="title"
              value={formData.title || formData.model || ''}
              onChange={onChange}
              disabled={disabled}
              className={`w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 ${disabled ? 'cursor-not-allowed bg-gray-100' : ''}`}
              placeholder="Buchtitel"
              required
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Verlag</label>
            <input
              type="text"
              name="publisher"
              value={formData.publisher || ''}
              onChange={onChange}
              disabled={disabled}
              className={`w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 ${disabled ? 'cursor-not-allowed bg-gray-100' : ''}`}
              placeholder="z.B. Suhrkamp, Fischer, Carlsen"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Erscheinungsjahr</label>
            <input
              type="number"
              name="year"
              value={formData.year || ''}
              onChange={onChange}
              disabled={disabled}
              className={`w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 ${disabled ? 'cursor-not-allowed bg-gray-100' : ''}`}
              placeholder="z.B. 2020"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">ISBN</label>
            <input
              type="text"
              name="isbn"
              value={formData.isbn || ''}
              onChange={onChange}
              disabled={disabled}
              className={`w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 ${disabled ? 'cursor-not-allowed bg-gray-100' : ''}`}
              placeholder="z.B. 978-3-12345-678-9"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Sprache</label>
            <select
              name="language"
              value={formData.language || ''}
              onChange={onChange}
              disabled={disabled}
              className={`w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 ${disabled ? 'cursor-not-allowed bg-gray-100' : ''}`}
            >
              <option value="">Bitte wählen</option>
              <option value="deutsch">Deutsch</option>
              <option value="englisch">Englisch</option>
              <option value="französisch">Französisch</option>
              <option value="italienisch">Italienisch</option>
              <option value="spanisch">Spanisch</option>
              <option value="andere">Andere</option>
            </select>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Buchtyp</label>
            <select
              name="bookType"
              value={formData.bookType || ''}
              onChange={onChange}
              disabled={disabled}
              className={`w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 ${disabled ? 'cursor-not-allowed bg-gray-100' : ''}`}
            >
              <option value="">Bitte wählen</option>
              <option value="hardcover">Hardcover</option>
              <option value="paperback">Taschenbuch</option>
              <option value="ebook">E-Book</option>
              <option value="hoerbuch">Hörbuch</option>
            </select>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Seitenzahl</label>
            <input
              type="number"
              name="pages"
              value={formData.pages || ''}
              onChange={onChange}
              disabled={disabled}
              className={`w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 ${disabled ? 'cursor-not-allowed bg-gray-100' : ''}`}
              placeholder="z.B. 320"
            />
          </div>
        </div>
      </div>
    )
  }

  // FILME & SERIEN
  if (category === 'filme-serien') {
    return (
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-gray-900">Film-Details</h3>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Format *</label>
            <select
              name="format"
              value={formData.format || ''}
              onChange={onChange}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500"
              required
            >
              <option value="">Bitte wählen</option>
              <option value="dvd">DVD</option>
              <option value="bluray">Blu-ray</option>
              <option value="4k">4K Ultra HD</option>
              <option value="vhs">VHS</option>
            </select>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Sprache</label>
            <select
              name="language"
              value={formData.language || ''}
              onChange={onChange}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Bitte wählen</option>
              <option value="deutsch">Deutsch</option>
              <option value="englisch">Englisch</option>
              <option value="ov">Original mit Untertiteln</option>
            </select>
          </div>
        </div>
      </div>
    )
  }

  // MUSIK & MUSIKINSTRUMENTE
  if (category === 'musik-instrumente') {
    // GITARREN (Alle Typen)
    if (
      subcategory === 'Gitarren' ||
      subcategory === 'E-Gitarren' ||
      subcategory === 'Akustikgitarren' ||
      subcategory === 'Bassgitarren'
    ) {
      return (
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-gray-900">Gitarren-Details</h3>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Marke *</label>
              <input
                type="text"
                name="brand"
                value={formData.brand || ''}
                onChange={onChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500"
                placeholder="z.B. Fender, Gibson, Ibanez, Taylor"
                required
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Modell *</label>
              <input
                type="text"
                name="model"
                value={formData.model || ''}
                onChange={onChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500"
                placeholder="z.B. Stratocaster, Les Paul, Precision Bass"
                required
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Baujahr</label>
              <input
                type="number"
                name="year"
                value={formData.year || ''}
                onChange={onChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500"
                placeholder="z.B. 2020, 1985"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Typ</label>
              <select
                name="guitarType"
                value={formData.guitarType || ''}
                onChange={onChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Bitte wählen</option>
                <option value="6-saitig">6-saitig</option>
                <option value="7-saitig">7-saitig</option>
                <option value="12-saitig">12-saitig</option>
                <option value="links">Linkshänder</option>
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Korpus-Material
              </label>
              <input
                type="text"
                name="bodyMaterial"
                value={formData.bodyMaterial || ''}
                onChange={onChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500"
                placeholder="z.B. Mahagoni, Esche, Linde"
              />
            </div>
          </div>
        </div>
      )
    }

    // KLAVIERE & KEYBOARDS
    if (
      subcategory === 'Klaviere & Keyboards' ||
      subcategory === 'Keyboards & Pianos' ||
      subcategory === 'E-Pianos'
    ) {
      return (
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-gray-900">Klavier/Keyboard-Details</h3>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Marke *</label>
              <input
                type="text"
                name="brand"
                value={formData.brand || ''}
                onChange={onChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500"
                placeholder="z.B. Yamaha, Roland, Kawai, Steinway"
                required
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Modell *</label>
              <input
                type="text"
                name="model"
                value={formData.model || ''}
                onChange={onChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500"
                placeholder="z.B. P-125, FP-30X, Clavinova CVP"
                required
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Anzahl Tasten</label>
              <select
                name="keyCount"
                value={formData.keyCount || ''}
                onChange={onChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Bitte wählen</option>
                <option value="88">88 Tasten (Vollgröße)</option>
                <option value="76">76 Tasten</option>
                <option value="61">61 Tasten</option>
                <option value="49">49 Tasten</option>
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Typ</label>
              <select
                name="pianoType"
                value={formData.pianoType || ''}
                onChange={onChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Bitte wählen</option>
                <option value="akustisch">Akustisches Klavier</option>
                <option value="digital">Digitalpiano</option>
                <option value="stage">Stage Piano</option>
                <option value="keyboard">Keyboard</option>
              </select>
            </div>
          </div>
        </div>
      )
    }

    // DJ-EQUIPMENT & STUDIO
    if (subcategory === 'DJ-Equipment' || subcategory === 'Studio-Equipment') {
      return (
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-gray-900">
            {subcategory === 'DJ-Equipment' ? 'DJ-Equipment-Details' : 'Studio-Equipment-Details'}
          </h3>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Marke *</label>
              <input
                type="text"
                name="brand"
                value={formData.brand || ''}
                onChange={onChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500"
                placeholder="z.B. Pioneer, Native Instruments, Focusrite"
                required
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Modell *</label>
              <input
                type="text"
                name="model"
                value={formData.model || ''}
                onChange={onChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500"
                placeholder="z.B. DDJ-1000, Kontrol S4, Scarlett 2i2"
                required
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Gerätetyp</label>
              <input
                type="text"
                name="equipmentType"
                value={formData.equipmentType || ''}
                onChange={onChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500"
                placeholder="z.B. DJ Controller, Audio Interface, Mixer"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Kanäle/Eingänge
              </label>
              <input
                type="text"
                name="channels"
                value={formData.channels || ''}
                onChange={onChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500"
                placeholder="z.B. 4-Kanal, 8 Eingänge"
              />
            </div>
          </div>
        </div>
      )
    }

    // MUSIK STANDARD (CDs, Vinyl, etc.)
    return (
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-gray-900">Musik-Details</h3>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Typ *</label>
            <select
              name="musicType"
              value={formData.musicType || ''}
              onChange={onChange}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500"
              required
            >
              <option value="">Bitte wählen</option>
              <option value="instrument">Musikinstrument</option>
              <option value="cd">CD</option>
              <option value="vinyl">Vinyl</option>
              <option value="equipment">Equipment</option>
            </select>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Marke/Künstler</label>
            <input
              type="text"
              name="brand"
              value={formData.brand || ''}
              onChange={onChange}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500"
              placeholder="z.B. Yamaha, Pink Floyd"
            />
          </div>
        </div>
      </div>
    )
  }

  // SAMMELN & SELTENES
  if (category === 'sammeln-seltenes') {
    return (
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-gray-900">Sammlerstück-Details</h3>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Epoche/Herkunft</label>
            <input
              type="text"
              name="origin"
              value={formData.origin || ''}
              onChange={onChange}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500"
              placeholder="z.B. 19. Jahrhundert, China"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Material</label>
            <input
              type="text"
              name="material"
              value={formData.material || ''}
              onChange={onChange}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500"
              placeholder="z.B. Porzellan, Bronze"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Echtheit bestätigt
            </label>
            <select
              name="authenticated"
              value={formData.authenticated || ''}
              onChange={onChange}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Bitte wählen</option>
              <option value="ja">Ja, mit Zertifikat</option>
              <option value="nein">Nein</option>
            </select>
          </div>
        </div>
      </div>
    )
  }

  // MÜNZEN
  if (category === 'muenzen') {
    return (
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-gray-900">Münzen-Details</h3>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Land/Währung</label>
            <input
              type="text"
              name="currency"
              value={formData.currency || ''}
              onChange={onChange}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500"
              placeholder="z.B. Schweiz, Euro"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Prägejahr</label>
            <input
              type="number"
              name="year"
              value={formData.year || ''}
              onChange={onChange}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500"
              placeholder="z.B. 1950"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Material</label>
            <select
              name="material"
              value={formData.material || ''}
              onChange={onChange}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Bitte wählen</option>
              <option value="gold">Gold</option>
              <option value="silber">Silber</option>
              <option value="bronze">Bronze</option>
            </select>
          </div>
        </div>
      </div>
    )
  }

  // TIERZUBEHÖR
  if (category === 'tierzubehoer') {
    return (
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-gray-900">Tierzubehör-Details</h3>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Tierart *</label>
            <select
              name="petType"
              value={formData.petType || ''}
              onChange={onChange}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500"
              required
            >
              <option value="">Bitte wählen</option>
              <option value="hund">Hund</option>
              <option value="katze">Katze</option>
              <option value="vogel">Vogel</option>
              <option value="pferd">Pferd</option>
              <option value="aquarium">Aquarium</option>
            </select>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Größe</label>
            <input
              type="text"
              name="size"
              value={formData.size || ''}
              onChange={onChange}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500"
              placeholder="z.B. S, M, L"
            />
          </div>
        </div>
      </div>
    )
  }

  // WEIN & GENUSS
  if (category === 'wein-genuss') {
    return (
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-gray-900">Wein/Genuss-Details</h3>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Typ *</label>
            <select
              name="wineType"
              value={formData.wineType || ''}
              onChange={onChange}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500"
              required
            >
              <option value="">Bitte wählen</option>
              <option value="rotwein">Rotwein</option>
              <option value="weisswein">Weisswein</option>
              <option value="champagner">Champagner</option>
              <option value="whisky">Whisky</option>
              <option value="sonstiges">Sonstiges</option>
            </select>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Jahrgang</label>
            <input
              type="number"
              name="vintage"
              value={formData.vintage || ''}
              onChange={onChange}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500"
              placeholder="z.B. 2015"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Region/Herkunft</label>
            <input
              type="text"
              name="region"
              value={formData.region || ''}
              onChange={onChange}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500"
              placeholder="z.B. Bordeaux, Schottland"
            />
          </div>
        </div>
      </div>
    )
  }

  // TICKETS & GUTSCHEINE
  if (category === 'tickets-gutscheine') {
    return (
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-gray-900">Ticket/Gutschein-Details</h3>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Art *</label>
            <select
              name="ticketType"
              value={formData.ticketType || ''}
              onChange={onChange}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500"
              required
            >
              <option value="">Bitte wählen</option>
              <option value="konzert">Konzert</option>
              <option value="sport">Sport</option>
              <option value="theater">Theater/Musical</option>
              <option value="gutschein">Gutschein</option>
            </select>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Veranstaltung/Wert
            </label>
            <input
              type="text"
              name="eventName"
              value={formData.eventName || ''}
              onChange={onChange}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500"
              placeholder="z.B. Ed Sheeran Konzert / CHF 100"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Datum (falls Ticket)
            </label>
            <input
              type="date"
              name="eventDate"
              value={formData.eventDate || ''}
              onChange={onChange}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>
      </div>
    )
  }

  // BÜRO & GEWERBE
  if (category === 'buero-gewerbe') {
    return (
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-gray-900">Büro/Gewerbe-Details</h3>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Marke</label>
            <input
              type="text"
              name="brand"
              value={formData.brand || ''}
              onChange={onChange}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500"
              placeholder="z.B. Canon, Brother, USM"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Zustand *</label>
            <select
              name="businessCondition"
              value={formData.businessCondition || ''}
              onChange={onChange}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500"
              required
            >
              <option value="">Bitte wählen</option>
              <option value="neu">Neu</option>
              <option value="gebraucht">Gebraucht</option>
              <option value="refurbished">Refurbished</option>
            </select>
          </div>
        </div>
      </div>
    )
  }

  // KOSMETIK & PFLEGE
  if (category === 'kosmetik-pflege') {
    return (
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-gray-900">Kosmetik-Details</h3>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Marke</label>
            <input
              type="text"
              name="brand"
              value={formData.brand || ''}
              onChange={onChange}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500"
              placeholder="z.B. Chanel, Dior, L'Oréal"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Inhalt/Größe</label>
            <input
              type="text"
              name="volume"
              value={formData.volume || ''}
              onChange={onChange}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500"
              placeholder="z.B. 50ml, 100ml"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Geöffnet?</label>
            <select
              name="opened"
              value={formData.opened || ''}
              onChange={onChange}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Bitte wählen</option>
              <option value="nein">Nein, originalversiegelt</option>
              <option value="ja">Ja, geöffnet</option>
            </select>
          </div>
        </div>
      </div>
    )
  }

  // MODELLBAU & HOBBY
  if (category === 'modellbau-hobby') {
    return (
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-gray-900">Modellbau-Details</h3>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Marke</label>
            <input
              type="text"
              name="brand"
              value={formData.brand || ''}
              onChange={onChange}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500"
              placeholder="z.B. Märklin, Tamiya"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Maßstab</label>
            <input
              type="text"
              name="scale"
              value={formData.scale || ''}
              onChange={onChange}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500"
              placeholder="z.B. 1:87, 1:10"
            />
          </div>
        </div>
      </div>
    )
  }

  // SPIELZEUG & BASTELN
  if (category === 'spielzeug-basteln') {
    return (
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-gray-900">Spielzeug-Details</h3>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Marke</label>
            <input
              type="text"
              name="brand"
              value={formData.brand || ''}
              onChange={onChange}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500"
              placeholder="z.B. LEGO, Playmobil"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Altersempfehlung</label>
            <input
              type="text"
              name="ageRange"
              value={formData.ageRange || ''}
              onChange={onChange}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500"
              placeholder="z.B. 6-12 Jahre, 3+"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Vollständig?</label>
            <select
              name="complete"
              value={formData.complete || ''}
              onChange={onChange}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Bitte wählen</option>
              <option value="ja">Ja, komplett</option>
              <option value="nein">Nein, unvollständig</option>
            </select>
          </div>
        </div>
      </div>
    )
  }

  // ============================================
  // NEUE KATEGORIEN
  // ============================================

  // IMMOBILIEN
  if (category === 'immobilien') {
    if (
      subcategory === 'Wohnungen' ||
      subcategory === 'Häuser' ||
      subcategory === 'Gewerbeimmobilien'
    ) {
      return (
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-gray-900">Immobilien-Details</h3>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Zimmer *</label>
              <input
                type="number"
                name="rooms"
                value={formData.rooms || ''}
                onChange={onChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500"
                placeholder="z.B. 3.5"
                required
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Wohnfläche (m²) *
              </label>
              <input
                type="number"
                name="livingArea"
                value={formData.livingArea || ''}
                onChange={onChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500"
                placeholder="z.B. 120"
                required
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Grundstücksfläche (m²)
              </label>
              <input
                type="number"
                name="landArea"
                value={formData.landArea || ''}
                onChange={onChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500"
                placeholder="z.B. 500"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Baujahr</label>
              <input
                type="number"
                name="year"
                value={formData.year || ''}
                onChange={onChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500"
                placeholder="z.B. 1995"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Adresse</label>
              <input
                type="text"
                name="address"
                value={formData.address || ''}
                onChange={onChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500"
                placeholder="z.B. Musterstrasse 123, 8000 Zürich"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Objekttyp</label>
              <select
                name="propertyType"
                value={formData.propertyType || ''}
                onChange={onChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Bitte wählen</option>
                <option value="einfamilienhaus">Einfamilienhaus</option>
                <option value="mehrfamilienhaus">Mehrfamilienhaus</option>
                <option value="eigentumswohnung">Eigentumswohnung</option>
                <option value="mietwohnung">Mietwohnung</option>
                <option value="villa">Villa</option>
                <option value="ferienhaus">Ferienhaus</option>
                <option value="gewerbe">Gewerbe</option>
              </select>
            </div>
          </div>
        </div>
      )
    }
    if (subcategory === 'Grundstücke') {
      return (
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-gray-900">Grundstück-Details</h3>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Grundstücksfläche (m²) *
              </label>
              <input
                type="number"
                name="landArea"
                value={formData.landArea || ''}
                onChange={onChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500"
                placeholder="z.B. 1000"
                required
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Nutzung</label>
              <select
                name="landUse"
                value={formData.landUse || ''}
                onChange={onChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Bitte wählen</option>
                <option value="bauland">Bauland</option>
                <option value="landwirtschaft">Landwirtschaft</option>
                <option value="wald">Wald</option>
                <option value="gewässer">Gewässer</option>
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Adresse</label>
              <input
                type="text"
                name="address"
                value={formData.address || ''}
                onChange={onChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500"
                placeholder="z.B. Musterstrasse 123, 8000 Zürich"
              />
            </div>
          </div>
        </div>
      )
    }
  }

  // JOBS & KARRIERE
  if (category === 'jobs-karriere') {
    return (
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-gray-900">Job-Details</h3>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Stellenbezeichnung *
            </label>
            <input
              type="text"
              name="jobTitle"
              value={formData.jobTitle || ''}
              onChange={onChange}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500"
              placeholder="z.B. Software Engineer"
              required
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Arbeitszeit</label>
            <select
              name="workTime"
              value={formData.workTime || ''}
              onChange={onChange}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Bitte wählen</option>
              <option value="vollzeit">Vollzeit</option>
              <option value="teilzeit">Teilzeit</option>
              <option value="pensum">Pensum</option>
              <option value="freelance">Freelance</option>
            </select>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Branche</label>
            <input
              type="text"
              name="industry"
              value={formData.industry || ''}
              onChange={onChange}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500"
              placeholder="z.B. IT, Finanz, Handel"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Standort</label>
            <input
              type="text"
              name="location"
              value={formData.location || ''}
              onChange={onChange}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500"
              placeholder="z.B. Zürich, Bern, Remote"
            />
          </div>
        </div>
      </div>
    )
  }

  // DIENSTLEISTUNGEN
  if (category === 'dienstleistungen') {
    return (
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-gray-900">Dienstleistungs-Details</h3>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Dienstleistungsart *
            </label>
            <select
              name="serviceType"
              value={formData.serviceType || ''}
              onChange={onChange}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500"
              required
            >
              <option value="">Bitte wählen</option>
              <option value="handwerk">Handwerk</option>
              <option value="beratung">Beratung</option>
              <option value="reparatur">Reparatur</option>
              <option value="reinigung">Reinigung</option>
              <option value="umzug">Umzug</option>
              <option value="garten">Garten</option>
              <option value="sonstiges">Sonstiges</option>
            </select>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Einzugsgebiet</label>
            <input
              type="text"
              name="serviceArea"
              value={formData.serviceArea || ''}
              onChange={onChange}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500"
              placeholder="z.B. Zürich und Umgebung"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Erfahrung</label>
            <input
              type="text"
              name="experience"
              value={formData.experience || ''}
              onChange={onChange}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500"
              placeholder="z.B. 10 Jahre Erfahrung"
            />
          </div>
        </div>
      </div>
    )
  }

  // CAMPING & OUTDOOR
  if (category === 'camping-outdoor') {
    if (subcategory === 'Zelte' || subcategory === 'Camping-Ausrüstung') {
      return (
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-gray-900">Camping-Details</h3>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Marke</label>
              <input
                type="text"
                name="brand"
                value={formData.brand || ''}
                onChange={onChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500"
                placeholder="z.B. Coleman, Quechua"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Personenanzahl</label>
              <input
                type="number"
                name="capacity"
                value={formData.capacity || ''}
                onChange={onChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500"
                placeholder="z.B. 4 Personen"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Gewicht (kg)</label>
              <input
                type="number"
                name="weight"
                value={formData.weight || ''}
                onChange={onChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500"
                placeholder="z.B. 8.5"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Material</label>
              <input
                type="text"
                name="material"
                value={formData.material || ''}
                onChange={onChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500"
                placeholder="z.B. Polyester, Aluminium"
              />
            </div>
          </div>
        </div>
      )
    }
  }

  // WELLNESS & GESUNDHEIT
  if (category === 'wellness-gesundheit') {
    return (
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-gray-900">Wellness-Details</h3>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Marke</label>
            <input
              type="text"
              name="brand"
              value={formData.brand || ''}
              onChange={onChange}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500"
              placeholder="z.B. Beurer, HoMedics"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Typ</label>
            <select
              name="wellnessType"
              value={formData.wellnessType || ''}
              onChange={onChange}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Bitte wählen</option>
              <option value="massagegeraet">Massagegerät</option>
              <option value="sauna">Sauna</option>
              <option value="infrarot">Infrarot</option>
              <option value="fitness">Fitness-Equipment</option>
              <option value="sonstiges">Sonstiges</option>
            </select>
          </div>
        </div>
      </div>
    )
  }

  // REISE & URLAUB
  if (category === 'reise-urlaub') {
    return (
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-gray-900">Reise-Details</h3>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Reiseziel</label>
            <input
              type="text"
              name="destination"
              value={formData.destination || ''}
              onChange={onChange}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500"
              placeholder="z.B. Mallorca, Thailand"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Reisedatum</label>
            <input
              type="date"
              name="travelDate"
              value={formData.travelDate || ''}
              onChange={onChange}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Anzahl Personen</label>
            <input
              type="number"
              name="capacity"
              value={formData.capacity || ''}
              onChange={onChange}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500"
              placeholder="z.B. 2"
            />
          </div>
        </div>
      </div>
    )
  }

  // GARTEN & PFLANZEN
  if (category === 'garten-pflanzen') {
    if (subcategory === 'Pflanzen' || subcategory === 'Samen') {
      return (
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-gray-900">Pflanzen-Details</h3>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Pflanzenart</label>
              <input
                type="text"
                name="plantType"
                value={formData.plantType || ''}
                onChange={onChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500"
                placeholder="z.B. Tomate, Rose, Ficus"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Größe</label>
              <input
                type="text"
                name="size"
                value={formData.size || ''}
                onChange={onChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500"
                placeholder="z.B. 30cm, Topf 15cm"
              />
            </div>
          </div>
        </div>
      )
    }
  }

  // BOOTE & SCHIFFE
  if (category === 'boote-schiffe') {
    return (
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-gray-900">Boot-Details</h3>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Marke *</label>
            <input
              type="text"
              name="brand"
              value={formData.brand || ''}
              onChange={onChange}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500"
              placeholder="z.B. Bavaria, Beneteau"
              required
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Modell *</label>
            <input
              type="text"
              name="model"
              value={formData.model || ''}
              onChange={onChange}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500"
              placeholder="z.B. Oceanis 40"
              required
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Baujahr</label>
            <input
              type="number"
              name="year"
              value={formData.year || ''}
              onChange={onChange}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500"
              placeholder="z.B. 2018"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Länge (m)</label>
            <input
              type="number"
              name="length"
              value={formData.length || ''}
              onChange={onChange}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500"
              placeholder="z.B. 12.5"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Bootstyp</label>
            <select
              name="boatType"
              value={formData.boatType || ''}
              onChange={onChange}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Bitte wählen</option>
              <option value="segelyacht">Segelyacht</option>
              <option value="motoryacht">Motoryacht</option>
              <option value="sportboot">Sportboot</option>
              <option value="schlauchboot">Schlauchboot</option>
              <option value="kajak">Kajak</option>
              <option value="kanu">Kanu</option>
            </select>
          </div>
        </div>
      </div>
    )
  }

  // TIERE
  if (category === 'tiere') {
    return (
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-gray-900">Tier-Details</h3>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Tierart *</label>
            <select
              name="animalType"
              value={formData.animalType || ''}
              onChange={onChange}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500"
              required
            >
              <option value="">Bitte wählen</option>
              <option value="hund">Hund</option>
              <option value="katze">Katze</option>
              <option value="pferd">Pferd</option>
              <option value="vogel">Vogel</option>
              <option value="nager">Nager</option>
              <option value="reptil">Reptil</option>
              <option value="fisch">Fisch</option>
              <option value="sonstiges">Sonstiges</option>
            </select>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Rasse</label>
            <input
              type="text"
              name="breed"
              value={formData.breed || ''}
              onChange={onChange}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500"
              placeholder="z.B. Golden Retriever, Perser"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Alter</label>
            <input
              type="text"
              name="age"
              value={formData.age || ''}
              onChange={onChange}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500"
              placeholder="z.B. 2 Jahre"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Geschlecht</label>
            <select
              name="gender"
              value={formData.gender || ''}
              onChange={onChange}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Bitte wählen</option>
              <option value="maennlich">Männlich</option>
              <option value="weiblich">Weiblich</option>
            </select>
          </div>
        </div>
      </div>
    )
  }

  // LEBENSMITTEL & GETRÄNKE (erweitert)
  if (category === 'lebensmittel') {
    return (
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-gray-900">Lebensmittel-Details</h3>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Produkttyp</label>
            <select
              name="foodType"
              value={formData.foodType || ''}
              onChange={onChange}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Bitte wählen</option>
              <option value="bio">Bio-Produkte</option>
              <option value="regional">Regionale Produkte</option>
              <option value="delikatessen">Delikatessen</option>
              <option value="getraenke">Getränke</option>
              <option value="sonstiges">Sonstiges</option>
            </select>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Haltbarkeitsdatum
            </label>
            <input
              type="date"
              name="expiryDate"
              value={formData.expiryDate || ''}
              onChange={onChange}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>
      </div>
    )
  }

  // MEDIZIN & GESUNDHEIT
  if (category === 'medizin-gesundheit') {
    return (
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-gray-900">Medizin-Details</h3>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Produkttyp</label>
            <select
              name="medicalType"
              value={formData.medicalType || ''}
              onChange={onChange}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Bitte wählen</option>
              <option value="hilfsmittel">Hilfsmittel</option>
              <option value="pflege">Pflegeprodukte</option>
              <option value="fitness">Fitness-Equipment</option>
              <option value="sonstiges">Sonstiges</option>
            </select>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Marke</label>
            <input
              type="text"
              name="brand"
              value={formData.brand || ''}
              onChange={onChange}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500"
              placeholder="z.B. Beurer, Medisana"
            />
          </div>
        </div>
      </div>
    )
  }

  // FAHRRÄDER (inkl. E-Bikes)
  if (category === 'fahrraeder') {
    return (
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-gray-900">Fahrrad-Details</h3>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Marke *</label>
            <input
              type="text"
              name="brand"
              value={formData.brand || ''}
              onChange={onChange}
              disabled={disabled}
              className={`w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 ${disabled ? 'cursor-not-allowed bg-gray-100' : ''}`}
              placeholder="z.B. Trek, Specialized, Giant"
              required
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Modell *</label>
            <input
              type="text"
              name="model"
              value={formData.model || ''}
              onChange={onChange}
              disabled={disabled}
              className={`w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 ${disabled ? 'cursor-not-allowed bg-gray-100' : ''}`}
              placeholder="z.B. Powerfly, Stumpjumper, Defy"
              required
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Baujahr</label>
            <input
              type="number"
              name="year"
              value={formData.year || ''}
              onChange={onChange}
              disabled={disabled}
              className={`w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 ${disabled ? 'cursor-not-allowed bg-gray-100' : ''}`}
              placeholder="z.B. 2023"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Rahmengrösse</label>
            <input
              type="text"
              name="frameSize"
              value={formData.frameSize || ''}
              onChange={onChange}
              disabled={disabled}
              className={`w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 ${disabled ? 'cursor-not-allowed bg-gray-100' : ''}`}
              placeholder="z.B. M, L, 54cm, 58cm"
            />
          </div>
          {(subcategory?.includes('E-Bike') || subcategory?.includes('Elektro')) && (
            <>
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">Akkukapazität</label>
                <input
                  type="text"
                  name="batteryCapacity"
                  value={formData.batteryCapacity || ''}
                  onChange={onChange}
                  disabled={disabled}
                  className={`w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 ${disabled ? 'cursor-not-allowed bg-gray-100' : ''}`}
                  placeholder="z.B. 500Wh, 625Wh"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">Reichweite</label>
                <input
                  type="text"
                  name="range"
                  value={formData.range || ''}
                  onChange={onChange}
                  disabled={disabled}
                  className={`w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 ${disabled ? 'cursor-not-allowed bg-gray-100' : ''}`}
                  placeholder="z.B. 80km, 120km"
                />
              </div>
            </>
          )}
        </div>
      </div>
    )
  }

  // ELEKTRONIK (generisch für alle Elektronik-Artikel)
  if (category === 'elektronik') {
    return (
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-gray-900">Elektronik-Details</h3>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Marke *</label>
            <input
              type="text"
              name="brand"
              value={formData.brand || ''}
              onChange={onChange}
              disabled={disabled}
              className={`w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 ${disabled ? 'cursor-not-allowed bg-gray-100' : ''}`}
              placeholder="z.B. Apple, Samsung, Sony"
              required
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Modell *</label>
            <input
              type="text"
              name="model"
              value={formData.model || ''}
              onChange={onChange}
              disabled={disabled}
              className={`w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 ${disabled ? 'cursor-not-allowed bg-gray-100' : ''}`}
              placeholder="z.B. iPhone 15 Pro, Galaxy S23"
              required
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Speicherkapazität</label>
            <input
              type="text"
              name="storage"
              value={formData.storage || ''}
              onChange={onChange}
              disabled={disabled}
              className={`w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 ${disabled ? 'cursor-not-allowed bg-gray-100' : ''}`}
              placeholder="z.B. 256GB, 512GB, 1TB"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Farbe</label>
            <input
              type="text"
              name="color"
              value={formData.color || ''}
              onChange={onChange}
              disabled={disabled}
              className={`w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 ${disabled ? 'cursor-not-allowed bg-gray-100' : ''}`}
              placeholder="z.B. Schwarz, Silber, Spacegrau"
            />
          </div>
        </div>
      </div>
    )
  }

  // Für alle anderen Kategorien: Generische Standard-Felder
  if (category && category.trim() !== '') {
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
              className={`w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 ${disabled ? 'cursor-not-allowed bg-gray-100' : ''}`}
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
              className={`w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 ${disabled ? 'cursor-not-allowed bg-gray-100' : ''}`}
              placeholder="Modell (optional)"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Baujahr</label>
            <input
              type="number"
              name="year"
              value={formData.year || ''}
              onChange={onChange}
              disabled={disabled}
              className={`w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 ${disabled ? 'cursor-not-allowed bg-gray-100' : ''}`}
              placeholder="z.B. 2023"
            />
          </div>
        </div>
      </div>
    )
  }

  // SPORT & FREIZEIT (erweitert für alle Sportarten)
  if (category === 'sport-freizeit' || category === 'sport') {
    // Fahrräder werden bereits oben behandelt, hier andere Sportarten
    if (
      subcategory === 'Fahrräder' ||
      subcategory === 'E-Bikes' ||
      subcategory === 'Mountainbikes' ||
      subcategory === 'Rennvelos' ||
      subcategory === 'Citybikes'
    ) {
      // Wird bereits oben behandelt, überspringen
    } else {
      return (
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-gray-900">Sport-Artikel-Details</h3>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Marke</label>
              <input
                type="text"
                name="brand"
                value={formData.brand || ''}
                onChange={onChange}
                disabled={disabled}
                className={`w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 ${disabled ? 'cursor-not-allowed bg-gray-100' : ''}`}
                placeholder="z.B. Nike, Adidas, Puma"
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
                className={`w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 ${disabled ? 'cursor-not-allowed bg-gray-100' : ''}`}
                placeholder="Modellbezeichnung"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Grösse</label>
              <input
                type="text"
                name="size"
                value={formData.size || ''}
                onChange={onChange}
                disabled={disabled}
                className={`w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 ${disabled ? 'cursor-not-allowed bg-gray-100' : ''}`}
                placeholder="z.B. M, L, XL, 42, 44"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Material</label>
              <input
                type="text"
                name="material"
                value={formData.material || ''}
                onChange={onChange}
                disabled={disabled}
                className={`w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 ${disabled ? 'cursor-not-allowed bg-gray-100' : ''}`}
                placeholder="z.B. Carbon, Aluminium, Kunststoff"
              />
            </div>
            {(subcategory?.includes('Ski') || subcategory?.includes('Snowboard')) && (
              <>
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">Länge</label>
                  <input
                    type="text"
                    name="length"
                    value={formData.length || ''}
                    onChange={onChange}
                    disabled={disabled}
                    className={`w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 ${disabled ? 'cursor-not-allowed bg-gray-100' : ''}`}
                    placeholder="z.B. 170cm, 165cm"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">Bindung</label>
                  <input
                    type="text"
                    name="binding"
                    value={formData.binding || ''}
                    onChange={onChange}
                    disabled={disabled}
                    className={`w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 ${disabled ? 'cursor-not-allowed bg-gray-100' : ''}`}
                    placeholder="z.B. Marker, Salomon"
                  />
                </div>
              </>
            )}
            {(subcategory?.includes('Fitness') || subcategory?.includes('Hanteln')) && (
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">Gewicht</label>
                <input
                  type="text"
                  name="weight"
                  value={formData.weight || ''}
                  onChange={onChange}
                  disabled={disabled}
                  className={`w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 ${disabled ? 'cursor-not-allowed bg-gray-100' : ''}`}
                  placeholder="z.B. 10kg, 20kg"
                />
              </div>
            )}
          </div>
        </div>
      )
    }
  }

  // FOTO & VIDEO (falls nicht bereits behandelt)
  if (category === 'foto-video' || category === 'foto-optik') {
    // Wird bereits oben behandelt, hier nur Fallback falls nötig
    if (!subcategory) {
      return (
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-gray-900">Foto/Video-Details</h3>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Marke *</label>
              <input
                type="text"
                name="brand"
                value={formData.brand || ''}
                onChange={onChange}
                disabled={disabled}
                className={`w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 ${disabled ? 'cursor-not-allowed bg-gray-100' : ''}`}
                placeholder="z.B. Canon, Nikon, Sony"
                required
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Modell *</label>
              <input
                type="text"
                name="model"
                value={formData.model || ''}
                onChange={onChange}
                disabled={disabled}
                className={`w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 ${disabled ? 'cursor-not-allowed bg-gray-100' : ''}`}
                placeholder="z.B. EOS R5, D850, Alpha 7 IV"
                required
              />
            </div>
          </div>
        </div>
      )
    }
  }

  // MÖBEL (falls als separate Kategorie)
  if (category === 'moebel') {
    return (
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-gray-900">Möbel-Details</h3>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Marke/Hersteller</label>
            <input
              type="text"
              name="brand"
              value={formData.brand || ''}
              onChange={onChange}
              disabled={disabled}
              className={`w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 ${disabled ? 'cursor-not-allowed bg-gray-100' : ''}`}
              placeholder="z.B. IKEA, Vitra, Kartell"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Modell/Serie</label>
            <input
              type="text"
              name="model"
              value={formData.model || ''}
              onChange={onChange}
              disabled={disabled}
              className={`w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 ${disabled ? 'cursor-not-allowed bg-gray-100' : ''}`}
              placeholder="z.B. Ektorp, Eames Chair"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Material</label>
            <input
              type="text"
              name="material"
              value={formData.material || ''}
              onChange={onChange}
              disabled={disabled}
              className={`w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 ${disabled ? 'cursor-not-allowed bg-gray-100' : ''}`}
              placeholder="z.B. Holz, Leder, Stoff, Metall"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Farbe</label>
            <input
              type="text"
              name="color"
              value={formData.color || ''}
              onChange={onChange}
              disabled={disabled}
              className={`w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 ${disabled ? 'cursor-not-allowed bg-gray-100' : ''}`}
              placeholder="z.B. Schwarz, Weiss, Natur"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Abmessungen (B x T x H)</label>
            <input
              type="text"
              name="dimensions"
              value={formData.dimensions || ''}
              onChange={onChange}
              disabled={disabled}
              className={`w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 ${disabled ? 'cursor-not-allowed bg-gray-100' : ''}`}
              placeholder="z.B. 200 x 90 x 80 cm"
            />
          </div>
        </div>
      </div>
    )
  }

  // KUNST & ANTIQUITÄTEN
  if (category === 'kunst-antiquitaeten' || category === 'kunst-handwerk') {
    return (
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-gray-900">Kunst-Details</h3>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Künstler</label>
            <input
              type="text"
              name="artist"
              value={formData.artist || formData.brand || ''}
              onChange={onChange}
              disabled={disabled}
              className={`w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 ${disabled ? 'cursor-not-allowed bg-gray-100' : ''}`}
              placeholder="Künstlername"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Titel des Werks</label>
            <input
              type="text"
              name="title"
              value={formData.title || formData.model || ''}
              onChange={onChange}
              disabled={disabled}
              className={`w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 ${disabled ? 'cursor-not-allowed bg-gray-100' : ''}`}
              placeholder="Titel des Kunstwerks"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Entstehungsjahr</label>
            <input
              type="number"
              name="year"
              value={formData.year || ''}
              onChange={onChange}
              disabled={disabled}
              className={`w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 ${disabled ? 'cursor-not-allowed bg-gray-100' : ''}`}
              placeholder="z.B. 1950"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Technik/Material</label>
            <input
              type="text"
              name="technique"
              value={formData.technique || formData.material || ''}
              onChange={onChange}
              disabled={disabled}
              className={`w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 ${disabled ? 'cursor-not-allowed bg-gray-100' : ''}`}
              placeholder="z.B. Öl auf Leinwand, Aquarell, Bronze"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Abmessungen</label>
            <input
              type="text"
              name="dimensions"
              value={formData.dimensions || ''}
              onChange={onChange}
              disabled={disabled}
              className={`w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 ${disabled ? 'cursor-not-allowed bg-gray-100' : ''}`}
              placeholder="z.B. 50 x 70 cm"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Signiert</label>
            <select
              name="signed"
              value={formData.signed || ''}
              onChange={onChange}
              disabled={disabled}
              className={`w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 ${disabled ? 'cursor-not-allowed bg-gray-100' : ''}`}
            >
              <option value="">Bitte wählen</option>
              <option value="ja">Ja</option>
              <option value="nein">Nein</option>
              <option value="unbekannt">Unbekannt</option>
            </select>
          </div>
        </div>
      </div>
    )
  }

  // LEBENSMITTEL & GETRÄNKE
  if (category === 'lebensmittel' || category === 'lebensmittel-getraenke') {
    return (
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-gray-900">Lebensmittel-Details</h3>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Marke/Hersteller</label>
            <input
              type="text"
              name="brand"
              value={formData.brand || ''}
              onChange={onChange}
              disabled={disabled}
              className={`w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 ${disabled ? 'cursor-not-allowed bg-gray-100' : ''}`}
              placeholder="Marke oder Hersteller"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Menge/Grösse</label>
            <input
              type="text"
              name="size"
              value={formData.size || ''}
              onChange={onChange}
              disabled={disabled}
              className={`w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 ${disabled ? 'cursor-not-allowed bg-gray-100' : ''}`}
              placeholder="z.B. 500g, 1 Liter, 6 Stück"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Ablaufdatum</label>
            <input
              type="date"
              name="expiryDate"
              value={formData.expiryDate || ''}
              onChange={onChange}
              disabled={disabled}
              className={`w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 ${disabled ? 'cursor-not-allowed bg-gray-100' : ''}`}
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Herkunft</label>
            <input
              type="text"
              name="origin"
              value={formData.origin || ''}
              onChange={onChange}
              disabled={disabled}
              className={`w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 ${disabled ? 'cursor-not-allowed bg-gray-100' : ''}`}
              placeholder="z.B. Schweiz, Italien, Bio"
            />
          </div>
        </div>
      </div>
    )
  }

  // WEIN & GENUSS
  if (category === 'wein-genuss') {
    return (
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-gray-900">Wein & Genuss-Details</h3>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Weingut/Hersteller</label>
            <input
              type="text"
              name="brand"
              value={formData.brand || ''}
              onChange={onChange}
              disabled={disabled}
              className={`w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 ${disabled ? 'cursor-not-allowed bg-gray-100' : ''}`}
              placeholder="z.B. Domaine de la Romanée-Conti"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Jahrgang</label>
            <input
              type="number"
              name="year"
              value={formData.year || ''}
              onChange={onChange}
              disabled={disabled}
              className={`w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 ${disabled ? 'cursor-not-allowed bg-gray-100' : ''}`}
              placeholder="z.B. 2018"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Rebsorte</label>
            <input
              type="text"
              name="grapeVariety"
              value={formData.grapeVariety || ''}
              onChange={onChange}
              disabled={disabled}
              className={`w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 ${disabled ? 'cursor-not-allowed bg-gray-100' : ''}`}
              placeholder="z.B. Pinot Noir, Chardonnay"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Region</label>
            <input
              type="text"
              name="region"
              value={formData.region || ''}
              onChange={onChange}
              disabled={disabled}
              className={`w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 ${disabled ? 'cursor-not-allowed bg-gray-100' : ''}`}
              placeholder="z.B. Burgund, Bordeaux, Wallis"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Inhalt</label>
            <input
              type="text"
              name="size"
              value={formData.size || ''}
              onChange={onChange}
              disabled={disabled}
              className={`w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 ${disabled ? 'cursor-not-allowed bg-gray-100' : ''}`}
              placeholder="z.B. 0.75 Liter, 1.5 Liter"
            />
          </div>
        </div>
      </div>
    )
  }

  // BAUSTOFFE
  if (category === 'baustoffe') {
    return (
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-gray-900">Baustoff-Details</h3>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Material</label>
            <input
              type="text"
              name="material"
              value={formData.material || ''}
              onChange={onChange}
              disabled={disabled}
              className={`w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 ${disabled ? 'cursor-not-allowed bg-gray-100' : ''}`}
              placeholder="z.B. Beton, Holz, Stein"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Menge</label>
            <input
              type="text"
              name="quantity"
              value={formData.quantity || ''}
              onChange={onChange}
              disabled={disabled}
              className={`w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 ${disabled ? 'cursor-not-allowed bg-gray-100' : ''}`}
              placeholder="z.B. 10 m², 50 kg, 100 Stück"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Abmessungen</label>
            <input
              type="text"
              name="dimensions"
              value={formData.dimensions || ''}
              onChange={onChange}
              disabled={disabled}
              className={`w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 ${disabled ? 'cursor-not-allowed bg-gray-100' : ''}`}
              placeholder="z.B. 20 x 30 x 5 cm"
            />
          </div>
        </div>
      </div>
    )
  }

  // FLUGZEUGE
  if (category === 'flugzeuge') {
    return (
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-gray-900">Flugzeug-Details</h3>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Hersteller *</label>
            <input
              type="text"
              name="brand"
              value={formData.brand || ''}
              onChange={onChange}
              disabled={disabled}
              className={`w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 ${disabled ? 'cursor-not-allowed bg-gray-100' : ''}`}
              placeholder="z.B. Cessna, Piper, Boeing"
              required
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Modell *</label>
            <input
              type="text"
              name="model"
              value={formData.model || ''}
              onChange={onChange}
              disabled={disabled}
              className={`w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 ${disabled ? 'cursor-not-allowed bg-gray-100' : ''}`}
              placeholder="z.B. 172, PA-28"
              required
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Baujahr</label>
            <input
              type="number"
              name="year"
              value={formData.year || ''}
              onChange={onChange}
              disabled={disabled}
              className={`w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 ${disabled ? 'cursor-not-allowed bg-gray-100' : ''}`}
              placeholder="z.B. 2015"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Flugstunden</label>
            <input
              type="number"
              name="flightHours"
              value={formData.flightHours || ''}
              onChange={onChange}
              disabled={disabled}
              className={`w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 ${disabled ? 'cursor-not-allowed bg-gray-100' : ''}`}
              placeholder="z.B. 1500"
            />
          </div>
        </div>
      </div>
    )
  }

  // SMART HOME
  if (category === 'smart-home') {
    return (
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-gray-900">Smart Home-Details</h3>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Marke *</label>
            <input
              type="text"
              name="brand"
              value={formData.brand || ''}
              onChange={onChange}
              disabled={disabled}
              className={`w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 ${disabled ? 'cursor-not-allowed bg-gray-100' : ''}`}
              placeholder="z.B. Philips Hue, Amazon Echo, Google Nest"
              required
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Modell *</label>
            <input
              type="text"
              name="model"
              value={formData.model || ''}
              onChange={onChange}
              disabled={disabled}
              className={`w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 ${disabled ? 'cursor-not-allowed bg-gray-100' : ''}`}
              placeholder="Modellbezeichnung"
              required
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Kompatibilität</label>
            <input
              type="text"
              name="compatibility"
              value={formData.compatibility || ''}
              onChange={onChange}
              disabled={disabled}
              className={`w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 ${disabled ? 'cursor-not-allowed bg-gray-100' : ''}`}
              placeholder="z.B. Alexa, Google Home, HomeKit"
            />
          </div>
        </div>
      </div>
    )
  }

  // ELEKTROGERÄTE
  if (category === 'elektrogeraete') {
    return (
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-gray-900">Elektrogerät-Details</h3>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Marke *</label>
            <input
              type="text"
              name="brand"
              value={formData.brand || ''}
              onChange={onChange}
              disabled={disabled}
              className={`w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 ${disabled ? 'cursor-not-allowed bg-gray-100' : ''}`}
              placeholder="z.B. Bosch, Siemens, Miele"
              required
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Modell *</label>
            <input
              type="text"
              name="model"
              value={formData.model || ''}
              onChange={onChange}
              disabled={disabled}
              className={`w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 ${disabled ? 'cursor-not-allowed bg-gray-100' : ''}`}
              placeholder="Modellbezeichnung"
              required
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Energieeffizienz</label>
            <select
              name="energyRating"
              value={formData.energyRating || ''}
              onChange={onChange}
              disabled={disabled}
              className={`w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 ${disabled ? 'cursor-not-allowed bg-gray-100' : ''}`}
            >
              <option value="">Bitte wählen</option>
              <option value="A+++">A+++</option>
              <option value="A++">A++</option>
              <option value="A+">A+</option>
              <option value="A">A</option>
              <option value="B">B</option>
              <option value="C">C</option>
            </select>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Baujahr</label>
            <input
              type="number"
              name="year"
              value={formData.year || ''}
              onChange={onChange}
              disabled={disabled}
              className={`w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 ${disabled ? 'cursor-not-allowed bg-gray-100' : ''}`}
              placeholder="z.B. 2020"
            />
          </div>
        </div>
      </div>
    )
  }

  // Für alle anderen Kategorien: Generische Standard-Felder
  // ABER: Nicht für Buch-Kategorien - diese sollten bereits oben behandelt worden sein
  if (
    category &&
    category.trim() !== '' &&
    category !== 'buecher' &&
    category !== 'buecher-filme-musik'
  ) {
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
              className={`w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 ${disabled ? 'cursor-not-allowed bg-gray-100' : ''}`}
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
              className={`w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 ${disabled ? 'cursor-not-allowed bg-gray-100' : ''}`}
              placeholder="Modell (optional)"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Baujahr</label>
            <input
              type="number"
              name="year"
              value={formData.year || ''}
              onChange={onChange}
              disabled={disabled}
              className={`w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 ${disabled ? 'cursor-not-allowed bg-gray-100' : ''}`}
              placeholder="z.B. 2023"
            />
          </div>
        </div>
      </div>
    )
  }

  // ============================================
  // FEHLENDE UNTERKATEGORIEN - SYSTEMATISCH HINZUGEFÜGT
  // ============================================
  
  // AUTO & MOTORRAD - Fehlende Unterkategorien
  if (category === 'auto-motorrad') {
    // Autos
    if (subcategory === 'Autos' || subcategory === 'Pkw') {
      return (
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-gray-900">Auto-Details</h3>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Marke *</label>
              <input
                type="text"
                name="brand"
                value={formData.brand || ''}
                onChange={onChange}
                disabled={disabled}
                className={`w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 ${disabled ? 'cursor-not-allowed bg-gray-100' : ''}`}
                placeholder="z.B. VW, BMW, Mercedes"
                required
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Modell *</label>
              <input
                type="text"
                name="model"
                value={formData.model || ''}
                onChange={onChange}
                disabled={disabled}
                className={`w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 ${disabled ? 'cursor-not-allowed bg-gray-100' : ''}`}
                placeholder="z.B. Golf, 3er, C-Klasse"
                required
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Baujahr *</label>
              <input
                type="number"
                name="year"
                value={formData.year || ''}
                onChange={onChange}
                disabled={disabled}
                className={`w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 ${disabled ? 'cursor-not-allowed bg-gray-100' : ''}`}
                placeholder="z.B. 2020"
                required
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Kilometerstand</label>
              <input
                type="number"
                name="mileage"
                value={formData.mileage || ''}
                onChange={onChange}
                disabled={disabled}
                className={`w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 ${disabled ? 'cursor-not-allowed bg-gray-100' : ''}`}
                placeholder="z.B. 50000"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Kraftstoff</label>
              <select
                name="fuelType"
                value={formData.fuelType || ''}
                onChange={onChange}
                disabled={disabled}
                className={`w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 ${disabled ? 'cursor-not-allowed bg-gray-100' : ''}`}
              >
                <option value="">Bitte wählen</option>
                <option value="benzin">Benzin</option>
                <option value="diesel">Diesel</option>
                <option value="elektro">Elektro</option>
                <option value="hybrid">Hybrid</option>
                <option value="erdgas">Erdgas</option>
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Getriebe</label>
              <select
                name="transmission"
                value={formData.transmission || ''}
                onChange={onChange}
                disabled={disabled}
                className={`w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 ${disabled ? 'cursor-not-allowed bg-gray-100' : ''}`}
              >
                <option value="">Bitte wählen</option>
                <option value="manuell">Manuell</option>
                <option value="automatik">Automatik</option>
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Leistung (PS)</label>
              <input
                type="number"
                name="power"
                value={formData.power || ''}
                onChange={onChange}
                disabled={disabled}
                className={`w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 ${disabled ? 'cursor-not-allowed bg-gray-100' : ''}`}
                placeholder="z.B. 150"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Hubraum (cm³)</label>
              <input
                type="number"
                name="displacement"
                value={formData.displacement || ''}
                onChange={onChange}
                disabled={disabled}
                className={`w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 ${disabled ? 'cursor-not-allowed bg-gray-100' : ''}`}
                placeholder="z.B. 2000"
              />
            </div>
          </div>
        </div>
      )
    }
    
    // Autozubehör
    if (subcategory === 'Autozubehör' || subcategory === 'Fahrzeugzubehör') {
      return (
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-gray-900">Autozubehör-Details</h3>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Marke/Hersteller</label>
              <input
                type="text"
                name="brand"
                value={formData.brand || ''}
                onChange={onChange}
                disabled={disabled}
                className={`w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 ${disabled ? 'cursor-not-allowed bg-gray-100' : ''}`}
                placeholder="z.B. Thule, Bosch, Hella"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Produkttyp</label>
              <select
                name="productType"
                value={formData.productType || ''}
                onChange={onChange}
                disabled={disabled}
                className={`w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 ${disabled ? 'cursor-not-allowed bg-gray-100' : ''}`}
              >
                <option value="">Bitte wählen</option>
                <option value="dachbox">Dachbox</option>
                <option value="fahrradtraeger">Fahrradträger</option>
                <option value="felgen">Felgen & Reifen</option>
                <option value="navigationsgeraet">Navigationsgerät</option>
                <option value="winterreifen">Winterreifen</option>
                <option value="sommerreifen">Sommerreifen</option>
                <option value="andere">Andere</option>
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Kompatibilität</label>
              <input
                type="text"
                name="compatibility"
                value={formData.compatibility || ''}
                onChange={onChange}
                disabled={disabled}
                className={`w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 ${disabled ? 'cursor-not-allowed bg-gray-100' : ''}`}
                placeholder="z.B. für VW Golf, universell"
              />
            </div>
          </div>
        </div>
      )
    }
    
    // Felgen & Reifen
    if (subcategory === 'Felgen & Reifen') {
      return (
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-gray-900">Felgen & Reifen-Details</h3>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Marke</label>
              <input
                type="text"
                name="brand"
                value={formData.brand || ''}
                onChange={onChange}
                disabled={disabled}
                className={`w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 ${disabled ? 'cursor-not-allowed bg-gray-100' : ''}`}
                placeholder="z.B. BBS, OZ, Michelin"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Typ</label>
              <select
                name="type"
                value={formData.type || ''}
                onChange={onChange}
                disabled={disabled}
                className={`w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 ${disabled ? 'cursor-not-allowed bg-gray-100' : ''}`}
              >
                <option value="">Bitte wählen</option>
                <option value="felgen">Felgen</option>
                <option value="reifen">Reifen</option>
                <option value="komplettraeder">Kompletträder</option>
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Grösse</label>
              <input
                type="text"
                name="size"
                value={formData.size || ''}
                onChange={onChange}
                disabled={disabled}
                className={`w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 ${disabled ? 'cursor-not-allowed bg-gray-100' : ''}`}
                placeholder="z.B. 17x7.5, 225/45R17"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Lochkreis</label>
              <input
                type="text"
                name="boltPattern"
                value={formData.boltPattern || ''}
                onChange={onChange}
                disabled={disabled}
                className={`w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 ${disabled ? 'cursor-not-allowed bg-gray-100' : ''}`}
                placeholder="z.B. 5x112"
              />
            </div>
          </div>
        </div>
      )
    }
    
    // Motorräder
    if (subcategory === 'Motorräder' || subcategory === 'Motorräder & Roller') {
      return (
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-gray-900">Motorrad-Details</h3>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Marke *</label>
              <input
                type="text"
                name="brand"
                value={formData.brand || ''}
                onChange={onChange}
                disabled={disabled}
                className={`w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 ${disabled ? 'cursor-not-allowed bg-gray-100' : ''}`}
                placeholder="z.B. Honda, Yamaha, BMW"
                required
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Modell *</label>
              <input
                type="text"
                name="model"
                value={formData.model || ''}
                onChange={onChange}
                disabled={disabled}
                className={`w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 ${disabled ? 'cursor-not-allowed bg-gray-100' : ''}`}
                placeholder="z.B. CBR600RR, R1, S1000RR"
                required
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Baujahr *</label>
              <input
                type="number"
                name="year"
                value={formData.year || ''}
                onChange={onChange}
                disabled={disabled}
                className={`w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 ${disabled ? 'cursor-not-allowed bg-gray-100' : ''}`}
                placeholder="z.B. 2020"
                required
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Kilometerstand</label>
              <input
                type="number"
                name="mileage"
                value={formData.mileage || ''}
                onChange={onChange}
                disabled={disabled}
                className={`w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 ${disabled ? 'cursor-not-allowed bg-gray-100' : ''}`}
                placeholder="z.B. 15000"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Hubraum (cm³)</label>
              <input
                type="number"
                name="displacement"
                value={formData.displacement || ''}
                onChange={onChange}
                disabled={disabled}
                className={`w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 ${disabled ? 'cursor-not-allowed bg-gray-100' : ''}`}
                placeholder="z.B. 600, 1000"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Leistung (PS)</label>
              <input
                type="number"
                name="power"
                value={formData.power || ''}
                onChange={onChange}
                disabled={disabled}
                className={`w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 ${disabled ? 'cursor-not-allowed bg-gray-100' : ''}`}
                placeholder="z.B. 100"
              />
            </div>
          </div>
        </div>
      )
    }
    
    // Nutzfahrzeuge
    if (subcategory === 'Nutzfahrzeuge') {
      return (
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-gray-900">Nutzfahrzeug-Details</h3>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Marke *</label>
              <input
                type="text"
                name="brand"
                value={formData.brand || ''}
                onChange={onChange}
                disabled={disabled}
                className={`w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 ${disabled ? 'cursor-not-allowed bg-gray-100' : ''}`}
                placeholder="z.B. Mercedes, MAN, Iveco"
                required
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Modell *</label>
              <input
                type="text"
                name="model"
                value={formData.model || ''}
                onChange={onChange}
                disabled={disabled}
                className={`w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 ${disabled ? 'cursor-not-allowed bg-gray-100' : ''}`}
                placeholder="z.B. Sprinter, TGE, Daily"
                required
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Baujahr *</label>
              <input
                type="number"
                name="year"
                value={formData.year || ''}
                onChange={onChange}
                disabled={disabled}
                className={`w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 ${disabled ? 'cursor-not-allowed bg-gray-100' : ''}`}
                placeholder="z.B. 2020"
                required
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Kilometerstand</label>
              <input
                type="number"
                name="mileage"
                value={formData.mileage || ''}
                onChange={onChange}
                disabled={disabled}
                className={`w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 ${disabled ? 'cursor-not-allowed bg-gray-100' : ''}`}
                placeholder="z.B. 100000"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Nutzlast (kg)</label>
              <input
                type="number"
                name="payload"
                value={formData.payload || ''}
                onChange={onChange}
                disabled={disabled}
                className={`w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 ${disabled ? 'cursor-not-allowed bg-gray-100' : ''}`}
                placeholder="z.B. 3500"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Fahrzeugtyp</label>
              <select
                name="vehicleType"
                value={formData.vehicleType || ''}
                onChange={onChange}
                disabled={disabled}
                className={`w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 ${disabled ? 'cursor-not-allowed bg-gray-100' : ''}`}
              >
                <option value="">Bitte wählen</option>
                <option value="transporter">Transporter</option>
                <option value="lieferwagen">Lieferwagen</option>
                <option value="lkw">LKW</option>
                <option value="bus">Bus</option>
                <option value="andere">Andere</option>
              </select>
            </div>
          </div>
        </div>
      )
    }
  }

  // Keine Kategorie ausgewählt
  return null
}
