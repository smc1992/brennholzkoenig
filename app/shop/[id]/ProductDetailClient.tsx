'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Product, PricingTier } from '@/data/products/products-query';
import { SEOMetadata } from '@/components/SEOMetadata';
import WishlistButton from '@/components/WishlistButton';
import CartNotification from '@/components/CartNotification';
import ProductImageGalleryDisplay from '@/components/ProductImageGalleryDisplay';
import { getCDNUrl } from '@/utils/cdn';
import { trackAddToCart, trackViewProduct } from '@/components/GoogleAnalytics';
import { calculatePriceWithTiers } from '@/lib/pricing';

interface ProductDetailClientProps {
  product: Product;
  pricingTiers: PricingTier[];
  productId: string;
}

interface CartItem {
  id: string;
  name: string;
  category: string;
  price: string;
  basePrice: number;
  image_url: string;
  unit: string;
  quantity: number;
  stock_quantity: number;
}

interface NotificationData {
  productName: string;
  quantity: number;
}



export default function ProductDetailClient({ product: initialProduct, pricingTiers: initialPricingTiers, productId }: ProductDetailClientProps) {
  const router = useRouter();
  const [quantity, setQuantity] = useState<number>(3);
  const [isAddingToCart, setIsAddingToCart] = useState<boolean>(false);
  const [showNotification, setShowNotification] = useState<boolean>(false);
  const [notificationData, setNotificationData] = useState<NotificationData>({
    productName: '',
    quantity: 0
  });

  const minOrderQuantity = 3;
  
  // Hilfsfunktion für CDN-URLs mit stabiler Cache-Invalidierung
  const getImageUrl = (url: string) => {
    if (!url) return '';
    // Wenn es bereits eine vollständige URL ist, verwende sie direkt
    if (url.startsWith('http')) return url;
    // Wenn es bereits mit /images/ beginnt, füge stabiles Cache-Busting hinzu
    if (url.startsWith('/images/')) {
      const timestamp = initialProduct.updated_at ? new Date(initialProduct.updated_at).getTime() : 0;
      return `${url}?t=${timestamp}`;
    }
    // Wenn es eine CDN-URL ist, füge Cache-Busting hinzu
    if (url.startsWith('/api/cdn/')) {
      const timestamp = initialProduct.updated_at ? new Date(initialProduct.updated_at).getTime() : 0;
      return `${url}?t=${timestamp}`;
    }
    // Für andere Fälle verwende getCDNUrl
    return getCDNUrl(url);
  };
  
  // Verwende Server-Daten direkt
  const product = initialProduct;
  const pricingTiers = initialPricingTiers;
  
  // Track product view beim Laden der Seite
  useEffect(() => {
    trackViewProduct(
      product.id,
      product.name,
      product.category,
      product.price
    );
  }, [product.id, product.name, product.category, product.price]);
  const isLoading = false;
  const error = null;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-pergament flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#C04020] mx-auto mb-4"></div>
          <p className="text-[#1A1A1A] text-lg">Lade Produktdetails...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-pergament flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-[#C04020] mb-4">Fehler beim Laden</h1>
          <p className="text-[#1A1A1A] mb-4">Das Produkt konnte nicht geladen werden.</p>
          <button 
            onClick={() => router.push('/shop')}
            className="bg-[#C04020] text-white px-6 py-3 rounded-lg hover:bg-[#A03318] transition-colors"
          >
            Zurück zum Shop
          </button>
        </div>
      </div>
    );
  }

  const pricing = calculatePriceWithTiers(
    product.price, 
    quantity, 
    pricingTiers, 
    minOrderQuantity, 
    product.has_quantity_discount || false
  );

  const totalPrice = pricing.price * quantity;

  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity >= 1 && newQuantity <= (product.stock_quantity || 999)) {
      setQuantity(newQuantity);
    }
  };

  const handleAddToCart = async () => {
    if (!pricing.canOrder) return;
    
    // Lagerbestandsprüfung
    if (product.stock_quantity === 0) {
      alert('Dieses Produkt ist ausverkauft und kann nicht in den Warenkorb gelegt werden.');
      return;
    }
    
    if (quantity > product.stock_quantity) {
      alert(`Nur noch ${product.stock_quantity} ${product.unit} verfügbar. Bitte reduzieren Sie die Menge.`);
      return;
    }
    
    setIsAddingToCart(true);
    
    try {
      const cartItem: CartItem = {
        id: product.id,
        name: product.name,
        category: product.category,
        price: pricing.price.toFixed(2),
        basePrice: product.price,
        image_url: product.image_url,
        unit: product.unit,
        quantity: quantity,
        stock_quantity: product.stock_quantity
      };

      // Warenkorb aus localStorage laden
      const existingCart = JSON.parse(localStorage.getItem('cart') || '[]');
      
      // Prüfen ob Produkt bereits im Warenkorb
      const existingItemIndex = existingCart.findIndex((item: CartItem) => item.id === product.id);
      
      if (existingItemIndex > -1) {
        // Menge erhöhen
        existingCart[existingItemIndex].quantity += quantity;
      } else {
        // Neues Produkt hinzufügen
        existingCart.push(cartItem);
      }
      
      // Warenkorb speichern
      localStorage.setItem('cart', JSON.stringify(existingCart));
      
      // Google Analytics Event tracken
      trackAddToCart(
        product.id,
        product.name,
        product.category,
        quantity,
        pricing.price
      );
      
      // Notification anzeigen
      setNotificationData({
        productName: product.name,
        quantity: quantity
      });
      setShowNotification(true);
      
      // Notification nach 3 Sekunden ausblenden
      setTimeout(() => {
        setShowNotification(false);
      }, 3000);
      
    } catch (error) {
      console.error('Fehler beim Hinzufügen zum Warenkorb:', error);
    } finally {
      setIsAddingToCart(false);
    }
  };

  return (
    <>
      <SEOMetadata 
        pageSlug={`/shop/${productId}`}
        defaultTitle={product.meta_title || `${product.name} - Premium Brennholz`}
        defaultDescription={product.meta_description || product.description}
      />
      
      <div className="min-h-screen bg-pergament pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
            {/* Produktbilder */}
            <div>
              <div className="space-y-4">
                {/* Hauptbild */}
                 <div className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                   <img 
                     src={getImageUrl(product.image_url)} 
                     alt={product.name}
                     className="w-full h-full object-cover"
                   />
                 </div>
                 
                 {/* Zusätzliche Bilder */}
                 {product.additional_images && product.additional_images.length > 0 && (
                   <div className="grid grid-cols-3 gap-2">
                     {product.additional_images.slice(0, 6).map((imageUrl, index) => (
                       <div key={index} className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                         <img 
                           src={getImageUrl(imageUrl)} 
                           alt={`${product.name} - Bild ${index + 2}`}
                           className="w-full h-full object-cover cursor-pointer hover:opacity-80 transition-opacity"
                           onClick={() => {
                             // Hauptbild mit geklicktem Bild tauschen
                             const mainImage = document.querySelector('.aspect-square img') as HTMLImageElement;
                             if (mainImage) {
                               const currentSrc = mainImage.src;
                               mainImage.src = getImageUrl(imageUrl);
                               // Optional: Geklicktes Bild durch vorheriges Hauptbild ersetzen
                             }
                           }}
                         />
                       </div>
                     ))}
                   </div>
                 )}
              </div>
            </div>
            
            {/* Produktinformationen */}
            <div>
              <h1 className="text-3xl font-bold text-[#1A1A1A] mb-4">{product.name}</h1>
              <p className="text-gray-600 mb-6">{product.description}</p>
              
              {/* Lagerbestand */}
              <div className="mb-6">
                <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  product.stock_quantity <= 5 
                    ? 'bg-red-100 text-red-800' 
                    : product.stock_quantity <= 20 
                    ? 'bg-yellow-100 text-yellow-800' 
                    : 'bg-green-100 text-green-800'
                }`}>
                  <i className="ri-database-2-line mr-2"></i>
                  {product.stock_quantity} {product.unit} verfügbar
                </div>
                {product.stock_quantity <= 10 && (
                  <p className="text-orange-600 text-sm mt-2">
                    <i className="ri-alert-line mr-1"></i>
                    Nur noch wenige Einheiten verfügbar!
                  </p>
                )}
              </div>
              
              {/* Preisberechnung */}
              <div className="bg-white rounded-lg p-6 mb-6 shadow-md">
                <h3 className="text-xl font-bold text-[#1A1A1A] mb-4">Preiskalkulation</h3>
                
                {/* Mengen-Eingabe */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Menge ({product.unit})
                  </label>
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => handleQuantityChange(quantity - 1)}
                      disabled={quantity <= 1}
                      className="w-10 h-10 rounded-full bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                      <i className="ri-subtract-line"></i>
                    </button>
                    <input
                      type="number"
                      value={quantity}
                      onChange={(e) => handleQuantityChange(parseInt(e.target.value) || 1)}
                      min="1"
                      max={product.stock_quantity}
                      className="w-20 text-center border border-gray-300 rounded-md py-2"
                    />
                    <button
                      onClick={() => handleQuantityChange(quantity + 1)}
                      disabled={quantity >= (product.stock_quantity || 999)}
                      className="w-10 h-10 rounded-full bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                      <i className="ri-add-line"></i>
                    </button>
                  </div>
                </div>
                
                {/* Preisdetails */}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Grundpreis je {product.unit}:</span>
                    <span>€{product.price.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Aktueller Preis je {product.unit}:</span>
                    <span>€{pricing.price.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Preisanpassung:</span>
                    <span>{pricing.adjustmentText}</span>
                  </div>
                  <hr className="my-3" />
                  <div className="flex justify-between text-xl font-bold">
                    <span>Gesamtpreis:</span>
                    <span className="text-[#C04020]">€{totalPrice.toFixed(2)}</span>
                  </div>
                </div>
              </div>
              
              {/* Aktionsbuttons */}
              <div className="space-y-4">
                <button
                  onClick={handleAddToCart}
                  disabled={!pricing.canOrder || isAddingToCart || product.stock_quantity === 0}
                  className={`w-full py-4 px-6 rounded-lg font-bold text-lg transition-all ${
                    pricing.canOrder && !isAddingToCart && product.stock_quantity > 0
                      ? 'bg-[#C04020] hover:bg-[#A03318] text-white'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {isAddingToCart ? (
                    <>
                      <i className="ri-loader-4-line animate-spin mr-2"></i>
                      Wird hinzugefügt...
                    </>
                  ) : product.stock_quantity === 0 ? (
                    <>
                      <i className="ri-close-circle-line mr-2"></i>
                      Ausverkauft
                    </>
                  ) : pricing.canOrder ? (
                    <>
                      <i className="ri-shopping-cart-line mr-2"></i>
                      In den Warenkorb
                    </>
                  ) : (
                    <>
                      <i className="ri-information-line mr-2"></i>
                      {pricing.adjustmentText}
                    </>
                  )}
                </button>
                
                <WishlistButton productId={product.id} />
              </div>
              
              {/* Produktdetails */}
              {product.detailed_description && (
                <div className="mt-8">
                  <h3 className="text-xl font-bold text-[#1A1A1A] mb-4">Produktdetails</h3>
                  <p className="text-gray-700 leading-relaxed">{product.detailed_description}</p>
                </div>
              )}
              
              {/* Technische Daten */}
              {product.technical_specs && Object.keys(product.technical_specs).length > 0 && (
                <div className="mt-8">
                  <h3 className="text-xl font-bold text-[#1A1A1A] mb-4">Technische Daten</h3>
                  <div className="bg-white rounded-lg p-4 shadow-md">
                    {Object.entries(product.technical_specs).map(([key, value]) => (
                      <div key={key} className="flex justify-between py-2 border-b border-gray-200 last:border-b-0">
                        <span className="font-medium">{key}:</span>
                        <span>{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Features */}
              {product.features && product.features.length > 0 && (
                <div className="mt-8">
                  <h3 className="text-xl font-bold text-[#1A1A1A] mb-4">Eigenschaften</h3>
                  <ul className="space-y-2">
                    {product.features.map((feature, index) => (
                      <li key={index} className="flex items-center">
                        <i className="ri-check-line text-green-600 mr-2"></i>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Cart Notification */}
      {showNotification && (
        <div className="fixed top-24 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50">
          <div className="flex items-center">
            <i className="ri-check-line mr-2"></i>
            <span>{notificationData.quantity}x {notificationData.productName} zum Warenkorb hinzugefügt</span>
            <button 
              onClick={() => setShowNotification(false)}
              className="ml-4 text-white hover:text-gray-200"
            >
              <i className="ri-close-line"></i>
            </button>
          </div>
        </div>
      )}
    </>
  );
}