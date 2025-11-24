import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { ProductPageClient } from '@/components/product/ProductPageClient';

interface Props {
  params: { id: string };
}

export default async function ProductPage({ params }: Props) {
  // Prüfe ob params.id eine Artikelnummer ist (numerisch)
  const isArticleNumber = /^\d{6,10}$/.test(params.id)
  
  const watch = await prisma.watch.findUnique({ 
    where: isArticleNumber 
      ? { articleNumber: parseInt(params.id) }
      : { id: params.id },
    include: {
      seller: {
        select: {
          id: true,
          name: true,
          email: true,
          city: true,
          postalCode: true,
          verified: true
        }
      }
    }
  });
  
  // Wenn Artikelnummer gefunden, aber URL noch nicht korrekt, redirect
  if (watch && isArticleNumber && watch.id !== params.id) {
    redirect(`/products/${watch.id}`)
  }
  
  if (!watch) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <ProductPageClient watch={null} images={[]} conditionMap={{}} lieferumfang="" seller={null} />
        <Footer />
      </div>
    );
  }

  // Prüfe ob Auktion abgelaufen ist und verarbeite sie falls nötig
  if (watch.auctionEnd && new Date(watch.auctionEnd) <= new Date()) {
    const hasPurchase = await prisma.purchase.findFirst({
      where: { watchId: watch.id }
    });
    
    if (!hasPurchase) {
      const highestBid = await prisma.bid.findFirst({
        where: { watchId: watch.id },
        orderBy: { amount: 'desc' }
      });
      
      if (highestBid) {
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
    'wie-neu': 'Wie neu',
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

  const seller = watch.seller || { 
    id: watch.sellerId, 
    name: 'Unbekannt', 
    email: '', 
    city: 'Zürich', 
    postalCode: '8000', 
    verified: false 
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-[1400px] mx-auto px-4 py-8">
        <ProductPageClient 
          watch={watch}
          images={images}
          conditionMap={conditionMap}
          lieferumfang={lieferumfang}
          seller={seller}
        />
      </div>
      <Footer />
    </div>
  );
}

