import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { ProductChat } from '@/components/chat/ProductChat';
import { FavoriteButton } from '@/components/favorites/FavoriteButton';
import { BidComponent } from '@/components/bids/BidComponent';
import { getShippingLabel } from '@/lib/shipping';

interface Props {
  params: { id: string };
}

export default async function ProductPage({ params }: Props) {
  const watch = await prisma.watch.findUnique({ where: { id: params.id } });
  if (!watch) {
    return (
      <div className="p-8">
        <div className="max-w-3xl mx-auto">
          <p className="text-gray-700">Angebot nicht gefunden.</p>
          <Link href="/" className="text-primary-600 underline">Zurück zur Startseite</Link>
        </div>
      </div>
    );
  }

  // Prüfe ob Auktion abgelaufen ist und verarbeite sie falls nötig
  if (watch.auctionEnd && new Date(watch.auctionEnd) <= new Date()) {
    const hasPurchase = await prisma.purchase.findFirst({
      where: { watchId: watch.id }
    });
    
    // Wenn keine Purchase existiert, aber Auktion abgelaufen ist und Gebote vorhanden
    if (!hasPurchase) {
      const highestBid = await prisma.bid.findFirst({
        where: { watchId: watch.id },
        orderBy: { amount: 'desc' }
      });
      
      if (highestBid) {
        // Erstelle Purchase für Gewinner
        await prisma.purchase.create({
          data: {
            watchId: watch.id,
            buyerId: highestBid.userId
          }
        });
      }
    }
  }

  const images: string[] = watch.images ? JSON.parse(watch.images) : [];
  const conditionMap: Record<string, string> = {
    'fabrikneu-verklebt': 'Fabrikneu und verklebt',
    'ungetragen': 'Ungetragen',
    'leichte-tragespuren': 'Leichte Tragespuren (Mikrokratzer aber keine Dellen oder grössere Kratzer)',
    'tragespuren': 'Tragespuren (grössere Kratzer, teilweise leichte Dellen)',
    'stark-gebraucht': 'Stark gebraucht',
  };

  const lieferumfang = (() => {
    if (watch.fullset) return 'Fullset (Box, Papiere, alle Glieder und Kaufbeleg)';
    const hasBox = (watch as any).box === true;
    const hasPapers = (watch as any).papers === true;
    if (hasBox && hasPapers) return 'Nur Box und Papiere';
    if (hasBox) return 'Nur Box';
    if (hasPapers) return 'Nur Papiere';
    return 'Keine Angaben';
  })();

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="text-sm text-gray-600 mb-4">
          <Link href="/" className="text-primary-600 hover:text-primary-700">← Zurück zur Startseite</Link>
          <span className="mx-2">·</span>
          <Link href="/search" className="text-primary-600 hover:text-primary-700">Zur Suche</Link>
        </div>
        <div className="bg-white rounded-lg shadow p-8 mb-12">
          <div className="relative mb-8">
            {images.length > 0 ? (
              <img src={images[0]} alt={watch.title} className="w-full h-72 object-cover rounded" />
            ) : (
              <div className="w-full h-72 bg-gray-200 rounded flex items-center justify-center text-gray-500">Kein Bild</div>
            )}
            {/* Favoriten-Button oben rechts auf dem Bild */}
            <div className="absolute top-4 right-4">
              <FavoriteButton watchId={watch.id} />
            </div>
          </div>
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900">{watch.title}</h1>
          </div>
          <div className="mb-8 space-y-3">
            {watch.buyNowPrice ? (
              <>
                <div>
                  <div className="text-sm text-gray-600 mb-1">Startpreis (Auktion)</div>
                  <div className="text-2xl text-primary-700 font-semibold">CHF {new Intl.NumberFormat('de-CH').format(watch.price)}</div>
                </div>
                <div className="border-t pt-3">
                  <div className="text-sm text-gray-600 mb-1">Sofortpreis (Jetzt kaufen)</div>
                  <div className="text-2xl text-green-700 font-semibold">CHF {new Intl.NumberFormat('de-CH').format(watch.buyNowPrice)}</div>
                </div>
              </>
            ) : (
              <div>
                <div className="text-sm text-gray-600 mb-1">Preis</div>
                <div className="text-2xl text-primary-700 font-semibold">CHF {new Intl.NumberFormat('de-CH').format(watch.price)}</div>
              </div>
            )}
          </div>
          {/* ALLE Felder einzeln untereinander! */}
          <div className="space-y-4 text-lg">
            {watch.brand && (
              <div>
                <span className="font-semibold text-gray-800">Marke:</span> <span className="text-gray-900">{watch.brand}</span>
              </div>
            )}
            {watch.model && (
              <div>
                <span className="font-semibold text-gray-800">Modell:</span> <span className="text-gray-900">{watch.model}</span>
              </div>
            )}
            {(watch as any).referenceNumber && (
              <div>
                <span className="font-semibold text-gray-800">Referenznummer:</span> <span className="text-gray-900">{(watch as any).referenceNumber}</span>
              </div>
            )}
            {typeof watch.year === 'number' && (
              <div>
                <span className="font-semibold text-gray-800">Baujahr:</span> <span className="text-gray-900">{watch.year}</span>
              </div>
            )}
            {watch.condition && (
              <div>
                <span className="font-semibold text-gray-800">Zustand:</span> <span className="text-gray-900">{conditionMap[watch.condition] ?? watch.condition}</span>
              </div>
            )}
            {watch.material && (
              <div>
                <span className="font-semibold text-gray-800">Material:</span> <span className="text-gray-900">{watch.material}</span>
              </div>
            )}
            {watch.movement && (
              <div>
                <span className="font-semibold text-gray-800">Uhrwerk:</span> <span className="text-gray-900">{watch.movement}</span>
              </div>
            )}
            {typeof (watch as any).caseDiameter === 'number' && (
              <div>
                <span className="font-semibold text-gray-800">Gehäusedurchmesser:</span> <span className="text-gray-900">{(watch as any).caseDiameter} mm</span>
              </div>
            )}
            {watch.lastRevision && (
              <div>
                <span className="font-semibold text-gray-800">Letzte Revision:</span> <span className="text-gray-900">{new Date(watch.lastRevision as any).toLocaleDateString('de-CH')}</span>
              </div>
            )}
            {watch.accuracy && (
              <div>
                <span className="font-semibold text-gray-800">Ganggenauigkeit:</span> <span className="text-gray-900">{watch.accuracy}</span>
              </div>
            )}
            {lieferumfang && (
              <div>
                <span className="font-semibold text-gray-800">Lieferumfang:</span> <span className="text-gray-900">{lieferumfang}</span>
              </div>
            )}
            {(watch as any).warranty && (
              <div>
                <span className="font-semibold text-gray-800">Garantie:</span> <span className="text-gray-900">{(watch as any).warranty}</span>
              </div>
            )}
            {((watch as any).warrantyMonths || (watch as any).warrantyYears) && (
              <div>
                <span className="font-semibold text-gray-800">Garantie-Dauer:</span> <span className="text-gray-900">{(watch as any).warrantyMonths ? `${(watch as any).warrantyMonths} Monate` : ''} {(watch as any).warrantyYears ? `${(watch as any).warrantyYears} Jahre` : ''}</span>
              </div>
            )}
            {(watch as any).warrantyDescription && (
              <div>
                <span className="font-semibold text-gray-800">Garantie Beschreibung:</span> <span className="text-gray-900">{(watch as any).warrantyDescription}</span>
              </div>
            )}
            {(watch as any).shippingMethod && (() => {
              try {
                const shippingMethods = JSON.parse((watch as any).shippingMethod)
                return (
                  <div>
                    <span className="font-semibold text-gray-800">Lieferart:</span> <span className="text-gray-900">{getShippingLabel(shippingMethods)}</span>
                  </div>
                )
              } catch {
                // Fallback für alte Daten (String statt Array)
                return (
                  <div>
                    <span className="font-semibold text-gray-800">Lieferart:</span> <span className="text-gray-900">{getShippingLabel((watch as any).shippingMethod)}</span>
                  </div>
                )
              }
            })()}
          </div>
          {watch.description && (
            <div className="bg-gray-50 rounded p-6 border border-gray-100 mt-8">
              <h2 className="text-xl font-bold text-gray-900 mb-2">Beschreibung</h2>
              <p className="text-gray-800 leading-relaxed whitespace-pre-line">{watch.description}</p>
            </div>
          )}
        </div>

        {/* Gebotskomponente */}
        <BidComponent 
          watchId={watch.id}
          startPrice={watch.price}
          buyNowPrice={watch.buyNowPrice || null}
          auctionEnd={watch.auctionEnd || null}
          sellerId={watch.sellerId}
          shippingMethod={(watch as any).shippingMethod ? (() => {
            try {
              return JSON.parse((watch as any).shippingMethod)
            } catch {
              return (watch as any).shippingMethod // Fallback für alte Daten
            }
          })() : null}
        />

        {/* Chat-Komponente */}
        <ProductChat watchId={watch.id} sellerId={watch.sellerId} />
      </div>
      <Footer />
    </div>
  );
}