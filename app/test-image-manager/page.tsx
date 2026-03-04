'use client';

import { useState } from 'react';
import ProductImageManager from '@/components/ProductImageManager';

interface ImageItem {
  id: string;
  seoSlug: string;
  storageFilename: string;
  url: string;
  mappingId?: number;
  isMain?: boolean;
}

export default function TestImageManagerPage() {
  const [productData, setProductData] = useState({
    id: 1,
    name: 'Industrieholz Buche Klasse 1',
    category: 'Industrieholz',
    wood_type: 'Buche',
    size: '25cm'
  });
  
  const [images, setImages] = useState<ImageItem[]>([]);

  const handleImagesChange = (newImages: ImageItem[]) => {
    setImages(newImages);
    console.log('Bilder geändert:', newImages);
  };

  const handleProductDataChange = (field: string, value: string | number) => {
    setProductData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            Bildmanagement-System Test
          </h1>
          
          {/* Produktdaten-Formular */}
          <div className="mb-8 p-4 bg-gray-50 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Produktdaten</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Produkt-ID
                </label>
                <input
                  type="number"
                  value={productData.id}
                  onChange={(e) => handleProductDataChange('id', parseInt(e.target.value) || 1)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-[#C04020]"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Produktname *
                </label>
                <input
                  type="text"
                  value={productData.name}
                  onChange={(e) => handleProductDataChange('name', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-[#C04020]"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Kategorie
                </label>
                <select
                  value={productData.category}
                  onChange={(e) => handleProductDataChange('category', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-[#C04020]"
                >
                  <option value="Industrieholz">Industrieholz</option>
                  <option value="Scheitholz">Scheitholz</option>
                  <option value="Brennholz">Brennholz</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Holzart
                </label>
                <select
                  value={productData.wood_type}
                  onChange={(e) => handleProductDataChange('wood_type', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-[#C04020]"
                >
                  <option value="Buche">Buche</option>
                  <option value="Eiche">Eiche</option>
                  <option value="Fichte">Fichte</option>
                  <option value="Birke">Birke</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Größe
                </label>
                <select
                  value={productData.size}
                  onChange={(e) => handleProductDataChange('size', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-[#C04020]"
                >
                  <option value="25cm">25cm</option>
                  <option value="33cm">33cm</option>
                  <option value="50cm">50cm</option>
                </select>
              </div>
            </div>
          </div>
          
          {/* Bildmanagement */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Bildmanagement</h2>
            <ProductImageManager
              productData={productData}
              onImagesChange={handleImagesChange}
              maxImages={6}
              showMainImageSelector={true}
            />
          </div>
          
          {/* Debug-Informationen */}
          <div className="p-4 bg-gray-100 rounded-lg">
            <h3 className="text-lg font-semibold mb-2">Debug-Informationen</h3>
            <div className="space-y-2">
              <div>
                <strong>Anzahl Bilder:</strong> {images.length}
              </div>
              <div>
                <strong>Hauptbild:</strong> {images.find(img => img.isMain)?.seoSlug || 'Keines'}
              </div>
              <div>
                <strong>SEO-Slugs:</strong>
                <ul className="list-disc list-inside ml-4">
                  {images.map(img => (
                    <li key={img.id} className={img.isMain ? 'font-bold text-green-600' : ''}>
                      {img.seoSlug} {img.isMain && '(Hauptbild)'}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
          
          {/* Funktionen */}
          <div className="mt-8 p-4 bg-blue-50 rounded-lg">
            <h3 className="text-lg font-semibold mb-2 text-blue-800">Verfügbare Funktionen</h3>
            <ul className="list-disc list-inside space-y-1 text-blue-700">
              <li>✅ <strong>Upload:</strong> Drag & Drop oder Datei-Auswahl</li>
              <li>✅ <strong>SEO-freundliche URLs:</strong> Automatische Generierung basierend auf Produktdaten</li>
              <li>✅ <strong>Löschen:</strong> Einzelne Bilder mit Bestätigung löschen</li>
              <li>✅ <strong>Hauptbild:</strong> Erstes Bild oder manuell auswählbar</li>
              <li>✅ <strong>Real-time Updates:</strong> Sofortige Aktualisierung der Bildliste</li>
              <li>✅ <strong>Validierung:</strong> Dateityp, Größe und Produktname-Prüfung</li>
              <li>✅ <strong>Storage Management:</strong> Automatisches Löschen aus Supabase Storage</li>
              <li>✅ <strong>Database Sync:</strong> Synchronisation mit image_mappings Tabelle</li>
            </ul>
          </div>
          
          {/* API-Endpunkte */}
          <div className="mt-4 p-4 bg-green-50 rounded-lg">
            <h3 className="text-lg font-semibold mb-2 text-green-800">API-Endpunkte</h3>
            <ul className="list-disc list-inside space-y-1 text-green-700">
              <li><code className="bg-white px-2 py-1 rounded">POST /api/upload/product-image</code> - Bild hochladen</li>
              <li><code className="bg-white px-2 py-1 rounded">DELETE /api/delete/product-image</code> - Bild löschen</li>
              <li><code className="bg-white px-2 py-1 rounded">GET /images/[seoSlug]</code> - SEO-freundliche Bild-URLs</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}