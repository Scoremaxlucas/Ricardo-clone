import Link from 'next/link'

const brands = [
  // Premium Marken
  { name: 'Rolex', slug: 'rolex', textLogo: 'ROLEX' },
  { name: 'Omega', slug: 'omega', textLogo: 'OMEGA' },
  { name: 'Patek Philippe', slug: 'patek-philippe', textLogo: 'P.P.' },
  { name: 'Audemars Piguet', slug: 'audemars-piguet', textLogo: 'AP' },
  { name: 'Richard Mille', slug: 'richard-mille', textLogo: 'RM' },

  // Schweizer Luxusmarken
  { name: 'Breitling', slug: 'breitling', textLogo: 'BREITLING' },
  { name: 'Tag Heuer', slug: 'tag-heuer', textLogo: 'TAG HEUER' },
  { name: 'Cartier', slug: 'cartier', textLogo: 'CARTIER' },
  { name: 'IWC', slug: 'iwc', textLogo: 'IWC' },
  { name: 'Panerai', slug: 'panerai', textLogo: 'PANERAI' },
  { name: 'Tudor', slug: 'tudor', textLogo: 'TUDOR' },
  { name: 'Vacheron Constantin', slug: 'vacheron-constantin', textLogo: 'VC' },
  { name: 'Jaeger-LeCoultre', slug: 'jaeger-lecoultre', textLogo: 'JLC' },
  { name: 'Blancpain', slug: 'blancpain', textLogo: 'BLANCPAIN' },
  { name: 'Hublot', slug: 'hublot', textLogo: 'HUBLOT' },
  { name: 'Bell & Ross', slug: 'bell-ross', textLogo: 'B&R' },
  { name: 'Zenith', slug: 'zenith', textLogo: 'ZENITH' },

  // Schweizer Mikrobrands
  { name: 'Fortis', slug: 'fortis', textLogo: 'FORTIS' },
  { name: 'Frederique Constant', slug: 'frederique-constant', textLogo: 'FC' },
  { name: 'Rado', slug: 'rado', textLogo: 'RADO' },
  { name: 'Longines', slug: 'longines', textLogo: 'LONGINES' },
  { name: 'Hamilton', slug: 'hamilton', textLogo: 'HAMILTON' },
  { name: 'Tissot', slug: 'tissot', textLogo: 'TISSOT' },
  { name: 'Eterna', slug: 'eterna', textLogo: 'ETERNA' },
  { name: 'Glycine', slug: 'glycine', textLogo: 'GLYCINE' },
  { name: 'Oris', slug: 'oris', textLogo: 'ORIS' },
  { name: 'Maurice Lacroix', slug: 'maurice-lacroix', textLogo: 'M.L' },
  { name: 'Revue Thommen', slug: 'revue-thommen', textLogo: 'R.T.' },

  // Französische Marken
  { name: 'Yema', slug: 'yema', textLogo: 'YEMA' },
  { name: 'Louis Erard', slug: 'louis-erard', textLogo: 'L.E.' },
  { name: 'Lip', slug: 'lip', textLogo: 'LIP' },
  { name: 'Breguet', slug: 'breguet', textLogo: 'BREGUET' },

  // Deutsche Marken
  { name: 'Sinn', slug: 'sinn', textLogo: 'SINN' },
  { name: 'Steinhart', slug: 'steinhart', textLogo: 'STEINHART' },
  { name: 'Laco', slug: 'laco', textLogo: 'LACO' },
  { name: 'Tutima', slug: 'tutima', textLogo: 'TUTIMA' },
  { name: 'Junghans', slug: 'junghans', textLogo: 'JUNGHANS' },
  { name: 'Glashütte Original', slug: 'glashutte-original', textLogo: 'G.O.' },
  { name: 'Lange & Söhne', slug: 'lange-soehne', textLogo: 'A.LANGE' },
  { name: 'Mühle-Glashütte', slug: 'muhle-glashutte', textLogo: 'MÜHLE' },
  { name: 'Nomos', slug: 'nomos', textLogo: 'NOMOS' },
  { name: 'Stowa', slug: 'stowa', textLogo: 'STOWA' },

  // Japanische Marken
  { name: 'Grand Seiko', slug: 'grand-seiko', textLogo: 'GRAND SEIKO' },
  { name: 'Seiko', slug: 'seiko', textLogo: 'SEIKO' },
  { name: 'Citizen', slug: 'citizen', textLogo: 'CITIZEN' },
  { name: 'Casio', slug: 'casio', textLogo: 'CASIO' },

  // Smartwatches
  { name: 'Apple Watch', slug: 'apple', textLogo: 'APPLE' },
  { name: 'Samsung Galaxy Watch', slug: 'samsung', textLogo: 'SAMSUNG' },
]

export default function BrandsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <h1 className="mb-4 text-4xl font-bold text-gray-900">Marken</h1>
          <p className="text-lg text-gray-600">
            Entdecken Sie Artikel von den weltweit führenden Marken
          </p>
        </div>

        <div className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {brands.map(brand => (
            <Link
              key={brand.slug}
              href={`/categories/${brand.slug}`}
              className="group flex min-h-[140px] flex-col items-center justify-center rounded-lg border-2 border-gray-200 bg-white p-6 transition-all duration-200 hover:border-primary-500 hover:shadow-lg"
            >
              <div className="text-center">
                <div className="mb-2 text-2xl font-bold text-gray-800 transition-colors group-hover:text-primary-600">
                  {brand.textLogo}
                </div>
                <div className="text-xs text-gray-600">{brand.name}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
