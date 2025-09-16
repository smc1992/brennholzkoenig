
'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

// Using the centralized Supabase client from lib/supabase.ts

interface MediaFile {
  id: string;
  filename: string;
  stored_filename: string;
  url: string;
  size: number;
  mime_type: string;
  category: string;
  uploadedat: string;
  created_at: string;
  // Optional fields for compatibility
  file_name?: string;
  original_name?: string;
  file_path?: string;
  file_url?: string;
  file_size?: number;
  usage_type?: string;
  alt_text?: string;
  folder_id?: string;
}

interface ImageFolder {
  id: string;
  name: string;
  description: string;
  parent_id?: string;
  created_at: string;
}

interface WebsiteImage {
  id: string;
  source: string;
  sourceId: string | number;
  sourceName: string;
  imageType: string;
  url: string;
  filename: string;
  category: string;
  usage: string;
  canReplace: boolean;
}

const USAGE_TYPES = [
  { id: 'hero', name: 'Hero-Bereiche', description: 'Hauptbilder für Hero-Sektionen' },
  { id: 'products', name: 'Produktbilder', description: 'Bilder für Brennholzprodukte' },
  { id: 'about', name: 'Über Uns', description: 'Team- und Unternehmensbilder' },
  { id: 'testimonials', name: 'Kundenstimmen', description: 'Kundenfotos und -bewertungen' },
  { id: 'process', name: 'Prozesse', description: 'Arbeitsabläufe und Produktion' },
  { id: 'warehouse', name: 'Lager & Logistik', description: 'Lagerbilder und Lieferung' },
  { id: 'quality', name: 'Qualität', description: 'Qualitätsbilder und Zertifikate' },
  { id: 'contact', name: 'Kontakt', description: 'Standort und Kontaktbilder' },
  { id: 'backgrounds', name: 'Hintergründe', description: 'Hintergrundbilder für Sektionen' },
  { id: 'icons', name: 'Icons & Symbole', description: 'Grafische Elemente' },
  { id: 'banners', name: 'Banner & Werbung', description: 'Werbebanner und Promotions' }
];

export default function MediaTab() {
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [folders, setFolders] = useState<ImageFolder[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedFolder, setSelectedFolder] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showImageEditor, setShowImageEditor] = useState(false);
  const [editingImage, setEditingImage] = useState<MediaFile | null>(null);
  const [websiteImages, setWebsiteImages] = useState<any[]>([]);
  const [activeView, setActiveView] = useState<'uploaded' | 'website'>('uploaded');
  const [loadingWebsiteImages, setLoadingWebsiteImages] = useState(false);
  const [showImageViewer, setShowImageViewer] = useState(false);
  const [viewingImage, setViewingImage] = useState<any>(null);
  const [replacingImage, setReplacingImage] = useState<any>(null);

  useEffect(() => {
    loadMediaFiles();
    loadFolders();
    loadWebsiteImages();
  }, []);

  const loadWebsiteImages = async () => {
    setLoadingWebsiteImages(true);
    try {
      // Lade alle Bilder, die aktuell auf der Website verwendet werden
      const [productsData, heroData, contentData, blogData, staticImages, componentImages, renderedImages] = await Promise.all([
        // Produktbilder
        supabase
          .from('products')
          .select('id, name, image_url, additional_images')
          .not('image_url', 'is', null),
        
        // Hero-Bilder und andere Content-Bilder aus app_settings
        supabase
          .from('app_settings')
          .select('setting_key, setting_value'),
        
        // Media Files aus Datenbank
        supabase
          .from('media_files')
          .select('*')
          .order('created_at', { ascending: false }),
          
        // Blog-Bilder (falls Blog-System vorhanden)
         supabase
           .from('blog_posts')
           .select('id, title, featured_image, content')
           .not('featured_image', 'is', null)
           .limit(100)
           .then((result: any) => result).catch(() => ({ data: [] })),
          
        // Statische Bilder aus public-Ordner scannen
         fetch('/api/scan-static-images')
           .then(res => res.json())
           .catch(() => ({ images: [] })),
           
         // Component-Bilder und weitere Assets scannen
         fetch('/api/scan-component-images')
           .then(res => res.json())
           .catch(() => ({ images: [] })),
           
         // Gerenderte Bilder und tatsächlich verwendete Assets
         fetch('/api/scan-rendered-images')
           .then(res => res.json())
           .catch(() => ({ images: [] }))
      ]);

      const websiteImagesList: WebsiteImage[] = [];

      // Produktbilder verarbeiten
      if (productsData.data) {
        productsData.data.forEach((product: any) => {
          if (product.image_url) {
            websiteImagesList.push({
              id: `product-main-${product.id}`,
              source: 'product',
              sourceId: product.id,
              sourceName: product.name,
              imageType: 'Hauptbild',
              url: product.image_url,
              filename: product.image_url.split('/').pop() || 'unknown',
              category: 'products',
              usage: 'Produktbild (Hauptbild)',
              canReplace: true
            });
          }
          
          // Zusätzliche Produktbilder
          if (product.additional_images && Array.isArray(product.additional_images)) {
            product.additional_images.forEach((imgUrl: string, index: number) => {
              websiteImagesList.push({
                id: `product-additional-${product.id}-${index}`,
                source: 'product',
                sourceId: product.id,
                sourceName: product.name,
                imageType: `Zusatzbild ${index + 1}`,
                url: imgUrl,
                filename: imgUrl.split('/').pop() || 'unknown',
                category: 'products',
                usage: `Produktbild (Zusatzbild ${index + 1})`,
                canReplace: true
              });
            });
          }
        });
      }

      // Content-Bilder aus Settings verarbeiten
      if (heroData.data) {
        heroData.data.forEach((setting: any) => {
          if (setting.setting_value && (setting.setting_value.includes('http') || setting.setting_value.includes('/images/') || setting.setting_value.includes('.jpg') || setting.setting_value.includes('.png') || setting.setting_value.includes('.webp'))) {
            websiteImagesList.push({
              id: `setting-${setting.setting_key}`,
              source: 'settings',
              sourceId: setting.setting_key,
              sourceName: setting.setting_key,
              imageType: 'Content-Bild',
              url: setting.setting_value,
              filename: setting.setting_value.split('/').pop() || 'unknown',
              category: 'content',
              usage: `Website-Einstellung (${setting.setting_key})`,
              canReplace: true
            });
          }
        });
      }

      // Blog-Bilder verarbeiten
      if (blogData.data && Array.isArray(blogData.data)) {
        blogData.data.forEach((post: any) => {
          if (post.featured_image) {
            websiteImagesList.push({
              id: `blog-featured-${post.id}`,
              source: 'blog',
              sourceId: post.id,
              sourceName: post.title,
              imageType: 'Featured Image',
              url: post.featured_image,
              filename: post.featured_image.split('/').pop() || 'unknown',
              category: 'blog',
              usage: `Blog-Beitrag (${post.title})`,
              canReplace: true
            });
          }
          
          // Bilder im Content extrahieren
          if (post.content) {
            const imgRegex = /<img[^>]+src="([^"]+)"/g;
            let match;
            let imgIndex = 0;
            while ((match = imgRegex.exec(post.content)) !== null) {
              websiteImagesList.push({
                id: `blog-content-${post.id}-${imgIndex}`,
                source: 'blog',
                sourceId: post.id,
                sourceName: post.title,
                imageType: `Content-Bild ${imgIndex + 1}`,
                url: match[1],
                filename: match[1].split('/').pop() || 'unknown',
                category: 'blog',
                usage: `Blog-Content (${post.title})`,
                canReplace: false
              });
              imgIndex++;
            }
          }
        });
      }

      // Statische Bilder verarbeiten
      if (staticImages.images && Array.isArray(staticImages.images)) {
        staticImages.images.forEach((imagePath: string, index: number) => {
          websiteImagesList.push({
            id: `static-${index}`,
            source: 'static',
            sourceId: imagePath,
            sourceName: imagePath.split('/').pop() || 'unknown',
            imageType: 'Statisches Bild',
            url: imagePath,
            filename: imagePath.split('/').pop() || 'unknown',
            category: 'static',
            usage: `Statische Datei (${imagePath})`,
            canReplace: false
          });
        });
      }

      // Media Files aus Datenbank hinzufügen
       if (contentData.data && Array.isArray(contentData.data)) {
         contentData.data.forEach((media: any) => {
           websiteImagesList.push({
             id: `media-${media.id}`,
             source: 'media_files',
             sourceId: media.id,
             sourceName: media.filename || media.original_name || 'Unbekannt',
             imageType: 'Upload',
             url: media.url || media.file_url || '',
             filename: media.filename || media.stored_filename || 'unknown',
             category: media.category || 'general',
             usage: `Hochgeladene Datei (${media.category || 'Allgemein'})`,
             canReplace: true
           });
         });
       }

       // Component-Bilder und weitere Assets hinzufügen
       if (componentImages.images && Array.isArray(componentImages.images)) {
         componentImages.images.forEach((imagePath: string, index: number) => {
           websiteImagesList.push({
             id: `component-${index}`,
             source: 'components',
             sourceId: imagePath,
             sourceName: imagePath.split('/').pop() || 'unknown',
             imageType: 'Component-Asset',
             url: imagePath,
             filename: imagePath.split('/').pop() || 'unknown',
             category: 'components',
             usage: `Frontend-Asset (${imagePath})`,
             canReplace: false
           });
         });
       }

       // Zusätzliche Bildquellen aus verschiedenen Tabellen
       try {
         const additionalSources = await Promise.all([
           // Kunden-Avatars oder Testimonial-Bilder
           supabase.from('customers').select('id, first_name, last_name, avatar_url').not('avatar_url', 'is', null).limit(50).then((result: any) => result).catch(() => ({ data: [] })),
           // Team-Mitglieder Bilder
           supabase.from('team_members').select('id, name, photo_url').not('photo_url', 'is', null).limit(50).then((result: any) => result).catch(() => ({ data: [] })),
           // Galerie-Bilder
           supabase.from('gallery_images').select('*').limit(100).then((result: any) => result).catch(() => ({ data: [] })),
           // Zertifikate und Auszeichnungen
           supabase.from('certificates').select('id, name, image_url').not('image_url', 'is', null).limit(50).then((result: any) => result).catch(() => ({ data: [] }))
         ]);

         const [customers, teamMembers, galleryImages, certificates] = additionalSources;

         // Kunden-Avatars
         if (customers.data && Array.isArray(customers.data)) {
           customers.data.forEach((customer: any) => {
             websiteImagesList.push({
               id: `customer-${customer.id}`,
               source: 'customers',
               sourceId: customer.id,
               sourceName: `${customer.first_name} ${customer.last_name}`,
               imageType: 'Avatar',
               url: customer.avatar_url,
               filename: customer.avatar_url.split('/').pop() || 'unknown',
               category: 'customers',
               usage: `Kunden-Avatar (${customer.first_name} ${customer.last_name})`,
               canReplace: true
             });
           });
         }

         // Team-Mitglieder
         if (teamMembers.data && Array.isArray(teamMembers.data)) {
           teamMembers.data.forEach((member: any) => {
             websiteImagesList.push({
               id: `team-${member.id}`,
               source: 'team',
               sourceId: member.id,
               sourceName: member.name,
               imageType: 'Team-Foto',
               url: member.photo_url,
               filename: member.photo_url.split('/').pop() || 'unknown',
               category: 'team',
               usage: `Team-Mitglied (${member.name})`,
               canReplace: true
             });
           });
         }

         // Galerie-Bilder
         if (galleryImages.data && Array.isArray(galleryImages.data)) {
           galleryImages.data.forEach((image: any) => {
             websiteImagesList.push({
               id: `gallery-${image.id}`,
               source: 'gallery',
               sourceId: image.id,
               sourceName: image.title || image.description || 'Galerie-Bild',
               imageType: 'Galerie',
               url: image.image_url || image.url,
               filename: (image.image_url || image.url).split('/').pop() || 'unknown',
               category: 'gallery',
               usage: `Galerie-Bild (${image.title || 'Unbenannt'})`,
               canReplace: true
             });
           });
         }

         // Zertifikate
         if (certificates.data && Array.isArray(certificates.data)) {
           certificates.data.forEach((cert: any) => {
             websiteImagesList.push({
               id: `certificate-${cert.id}`,
               source: 'certificates',
               sourceId: cert.id,
               sourceName: cert.name,
               imageType: 'Zertifikat',
               url: cert.image_url,
               filename: cert.image_url.split('/').pop() || 'unknown',
               category: 'certificates',
               usage: `Zertifikat (${cert.name})`,
               canReplace: true
             });
           });
         }
       } catch (error) {
          console.log('Zusätzliche Bildquellen nicht verfügbar:', error);
        }

        // Gerenderte Bilder hinzufügen (tatsächlich verwendete Assets)
        if (renderedImages.images && Array.isArray(renderedImages.images)) {
          renderedImages.images.forEach((imageUrl: string, index: number) => {
            const detail = renderedImages.details?.find((d: any) => d.url === imageUrl);
            websiteImagesList.push({
              id: `rendered-${index}`,
              source: 'rendered',
              sourceId: imageUrl,
              sourceName: imageUrl.split('/').pop() || 'unknown',
              imageType: detail?.type || 'Gerendert',
              url: imageUrl,
              filename: imageUrl.split('/').pop() || 'unknown',
              category: 'rendered',
              usage: `Gerenderte Website (${detail?.context || 'Unbekannt'})`,
              canReplace: !imageUrl.startsWith('http') || imageUrl.includes('readdy.ai')
            });
          });
        }

      setWebsiteImages(websiteImagesList);
    } catch (error) {
      console.error('Fehler beim Laden der Website-Bilder:', error);
    } finally {
      setLoadingWebsiteImages(false);
    }
  };

  const loadFolders = async () => {
    try {
      const { data, error } = await supabase
        .from('image_folders')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      setFolders(data || []);
    } catch (error) {
      console.error('Fehler beim Laden der Ordner:', error);
    }
  };

  const loadMediaFiles = async () => {
    try {
      const { data, error } = await supabase
        .from('media_files')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMediaFiles(data || []);
    } catch (error) {
      console.error('Fehler beim Laden der Medien:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, usageType: string, folderId?: string) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);

    try {
      for (const file of Array.from(files)) {
        // Datei auf Server hochladen
        const formData = new FormData();
        formData.append('file', file);
        formData.append('category', usageType);

        const uploadResponse = await fetch('/api/upload-media', {
          method: 'POST',
          body: formData,
        });

        if (!uploadResponse.ok) {
          throw new Error('Upload fehlgeschlagen');
        }

        const uploadResult = await uploadResponse.json();

        // Metadaten in Datenbank speichern
        const { error: dbError } = await supabase
          .from('media_files')
          .insert({
            filename: file.name,
            stored_filename: uploadResult.fileName,
            url: uploadResult.fileUrl,
            size: file.size,
            mime_type: file.type,
            category: usageType
          });

        if (dbError) throw dbError;
      }

      await loadMediaFiles();
      await loadWebsiteImages(); // Aktualisiere auch Website-Bilder
      alert('Dateien erfolgreich hochgeladen!');
    } catch (error) {
      console.error('Upload-Fehler:', error);
      alert('Fehler beim Hochladen der Dateien');
    } finally {
      setUploading(false);
    }
  };

  const replaceWebsiteImage = async (websiteImage: any, newImageUrl: string) => {
    try {
      if (websiteImage.source === 'product') {
        // Produktbild ersetzen
        if (websiteImage.imageType === 'Hauptbild') {
          const { error } = await supabase
            .from('products')
            .update({ image_url: newImageUrl })
            .eq('id', websiteImage.sourceId);
          
          if (error) throw error;
        } else {
          // Zusatzbild ersetzen - lade aktuelle additional_images und ersetze das spezifische
          const { data: product } = await supabase
            .from('products')
            .select('additional_images')
            .eq('id', websiteImage.sourceId)
            .single();
          
          if (product && product.additional_images) {
            const updatedImages = [...product.additional_images];
            const imageIndex = parseInt(websiteImage.imageType.split(' ')[1]) - 1;
            updatedImages[imageIndex] = newImageUrl;
            
            const { error } = await supabase
              .from('products')
              .update({ additional_images: updatedImages })
              .eq('id', websiteImage.sourceId);
            
            if (error) throw error;
          }
        }
      } else if (websiteImage.source === 'settings') {
        // Setting-Bild ersetzen
        const { error } = await supabase
          .from('app_settings')
          .update({ setting_value: newImageUrl })
          .eq('setting_key', websiteImage.sourceId);
        
        if (error) throw error;
      } else if (websiteImage.source === 'blog') {
        // Blog-Bild ersetzen
        if (websiteImage.imageType === 'Featured Image') {
          const { error } = await supabase
            .from('blog_posts')
            .update({ featured_image: newImageUrl })
            .eq('id', websiteImage.sourceId);
          
          if (error) throw error;
        }
      }
      
      // Frontend-Cache invalidieren für sofortige Aktualisierung
      if (typeof window !== 'undefined') {
        // Service Worker Cache leeren
        if ('serviceWorker' in navigator && 'caches' in window) {
          caches.keys().then(cacheNames => {
            cacheNames.forEach(cacheName => {
              if (cacheName.includes('images') || cacheName.includes('static')) {
                caches.delete(cacheName);
              }
            });
          });
        }
        
        // Browser-Cache für spezifische URL invalidieren
        const timestamp = Date.now();
        const images = document.querySelectorAll(`img[src*="${websiteImage.url.split('?')[0]}"]`);
        images.forEach(img => {
          const currentSrc = (img as HTMLImageElement).src;
          (img as HTMLImageElement).src = newImageUrl + (newImageUrl.includes('?') ? '&' : '?') + 't=' + timestamp;
        });
        
        // CSS-Background-Images aktualisieren
        const elements = document.querySelectorAll('*');
        elements.forEach(el => {
          const style = window.getComputedStyle(el);
          if (style.backgroundImage && style.backgroundImage.includes(websiteImage.url)) {
            (el as HTMLElement).style.backgroundImage = style.backgroundImage.replace(websiteImage.url, newImageUrl + '?t=' + timestamp);
          }
        });
      }
      
      await loadWebsiteImages(); // Aktualisiere die Anzeige
    } catch (error) {
      console.error('Fehler beim Ersetzen des Bildes:', error);
      throw error;
    }
  };

  const copyImageUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    alert('URL kopiert!');
  };

  const deleteImage = async (imageId: string) => {
    if (!confirm('Sind Sie sicher, dass Sie dieses Bild löschen möchten?')) {
      return;
    }
    
    try {
      const { error } = await supabase
        .from('media_files')
        .delete()
        .eq('id', imageId);
      
      if (error) throw error;
      
      await loadMediaFiles();
      alert('Bild erfolgreich gelöscht!');
    } catch (error) {
      console.error('Fehler beim Löschen:', error);
      alert('Fehler beim Löschen des Bildes');
    }
  };

  const updateImageSettings = async () => {
    if (!editingImage) return;

    try {
      const { error } = await supabase
        .from('media_files')
        .update({
          alt_text: editingImage.alt_text,
          usage_type: editingImage.usage_type
        })
        .eq('id', editingImage.id);

      if (error) throw error;

      await loadMediaFiles();
      setShowImageEditor(false);
      setEditingImage(null);
      alert('Bild-Einstellungen aktualisiert!');
    } catch (error) {
      console.error('Fehler beim Aktualisieren:', error);
      alert('Fehler beim Aktualisieren der Einstellungen');
    }
  };

  const filteredFiles = mediaFiles.filter(file => {
    const matchesCategory = selectedCategory === 'all' || file.usage_type === selectedCategory || file.category === selectedCategory;
    const matchesFolder = selectedFolder === 'all' || file.folder_id === selectedFolder;
    const matchesSearch = (file.original_name || file.filename || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (file.alt_text || '').toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesFolder && matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-xl">Medien werden geladen...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">Website-Bilder verwalten</h2>
            <button
              onClick={() => loadWebsiteImages()}
              disabled={loadingWebsiteImages}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
            >
              <i className="ri-refresh-line mr-2"></i>
              {loadingWebsiteImages ? 'Aktualisiere...' : 'Aktualisieren'}
            </button>
          </div>
          
          {/* Tab Navigation */}
          <div className="flex space-x-1 mb-4">
            <button
              onClick={() => setActiveView('uploaded')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeView === 'uploaded'
                  ? 'bg-orange-100 text-orange-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <i className="ri-upload-line mr-2"></i>
              Hochgeladene Medien ({mediaFiles.length})
            </button>
            <button
              onClick={() => setActiveView('website')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeView === 'website'
                  ? 'bg-orange-100 text-orange-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <i className="ri-global-line mr-2"></i>
              Website-Bilder ({websiteImages.length})
            </button>
          </div>
          
          <div className="text-sm text-gray-600">
            {activeView === 'uploaded' 
              ? `${mediaFiles.length} Dateien | ${(mediaFiles.reduce((total, file) => total + (file.size || file.file_size || 0), 0) / 1024 / 1024).toFixed(1)} MB`
              : `${websiteImages.length} Bilder aktuell auf der Website verwendet`
            }
          </div>
        </div>

        {/* Filter und Suche - nur für hochgeladene Medien */}
        {activeView === 'uploaded' && (
          <div className="p-6 border-b">
            <div className="flex gap-4 items-center flex-wrap">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="border rounded-lg px-3 py-2"
              >
                <option value="all">Alle Kategorien</option>
                {USAGE_TYPES.map(type => (
                  <option key={type.id} value={type.id}>{type.name}</option>
                ))}
              </select>

              <select
                value={selectedFolder}
                onChange={(e) => setSelectedFolder(e.target.value)}
                className="border rounded-lg px-3 py-2"
              >
                <option value="all">Alle Ordner</option>
                {folders.map(folder => (
                  <option key={folder.id} value={folder.id}>{folder.name}</option>
                ))}
              </select>

              <input
                type="text"
                placeholder="Bilder suchen..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="border rounded-lg px-3 py-2 flex-1 max-w-md"
              />
            </div>
          </div>
        )}

       {/* Hidden File Input für Ersetzung */}
       <input
         id="replace-file-input"
         type="file"
         accept="image/*"
         className="hidden"
         onChange={async (e) => {
           const file = e.target.files?.[0];
           if (!file || !replacingImage) return;
           
           try {
             // Upload neue Datei
             const formData = new FormData();
             formData.append('file', file);
             formData.append('category', replacingImage.category);
             
             const uploadResponse = await fetch('/api/upload-media', {
               method: 'POST',
               body: formData,
             });
             
             if (!uploadResponse.ok) throw new Error('Upload fehlgeschlagen');
             
             const uploadResult = await uploadResponse.json();
             
             // Ersetze das Bild auf der Website
             await replaceWebsiteImage(replacingImage, uploadResult.fileUrl);
             
             // Cache-Busting für sofortige Frontend-Aktualisierung
             if (typeof window !== 'undefined') {
               // Alle img-Tags mit der alten URL finden und aktualisieren
               const images = document.querySelectorAll(`img[src="${replacingImage.url}"]`);
               images.forEach(img => {
                 (img as HTMLImageElement).src = uploadResult.fileUrl + '?t=' + Date.now();
               });
               
               // Browser-Cache invalidieren
               if ('caches' in window) {
                 caches.keys().then(names => {
                   names.forEach(name => {
                     caches.delete(name);
                   });
                 });
               }
             }
             
             setReplacingImage(null);
             alert('Bild erfolgreich ersetzt! Die Änderung ist sofort im Frontend sichtbar.');
           } catch (error) {
             console.error('Fehler beim Ersetzen:', error);
             alert('Fehler beim Ersetzen des Bildes');
           }
         }}
       />

       {/* Image Viewer Modal */}
       {showImageViewer && viewingImage && (
         <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
           <div className="bg-white rounded-lg max-w-4xl max-h-full overflow-auto">
             <div className="p-4 border-b flex items-center justify-between">
               <div>
                 <h3 className="text-lg font-bold">{viewingImage.sourceName}</h3>
                 <p className="text-sm text-gray-600">{viewingImage.usage}</p>
               </div>
               <button
                 onClick={() => {
                   setShowImageViewer(false);
                   setViewingImage(null);
                 }}
                 className="text-gray-500 hover:text-gray-700 text-2xl"
               >
                 <i className="ri-close-line"></i>
               </button>
             </div>
             
             <div className="p-4">
               <div className="mb-4">
                 <img
                   src={viewingImage.url}
                   alt={viewingImage.filename}
                   className="max-w-full max-h-96 mx-auto rounded-lg shadow-lg"
                   onError={(e) => {
                     (e.target as HTMLImageElement).src = '/api/placeholder?width=400&height=300&text=Bild+nicht+verfügbar';
                   }}
                 />
               </div>
               
               <div className="grid grid-cols-2 gap-4 text-sm">
                 <div>
                   <strong>Dateiname:</strong> {viewingImage.filename}
                 </div>
                 <div>
                   <strong>Quelle:</strong> {viewingImage.source}
                 </div>
                 <div>
                   <strong>Kategorie:</strong> {viewingImage.category}
                 </div>
                 <div>
                   <strong>Typ:</strong> {viewingImage.imageType}
                 </div>
                 <div className="col-span-2">
                   <strong>URL:</strong> 
                   <input
                     type="text"
                     value={viewingImage.url}
                     readOnly
                     className="w-full mt-1 p-2 border rounded bg-gray-50 text-xs"
                     onClick={(e) => (e.target as HTMLInputElement).select()}
                   />
                 </div>
               </div>
               
               <div className="flex gap-2 mt-4">
                 <button
                   onClick={() => copyImageUrl(viewingImage.url)}
                   className="flex-1 bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition-colors"
                 >
                   <i className="ri-link mr-2"></i>
                   URL kopieren
                 </button>
                 
                 {viewingImage.canReplace && (
                   <button
                     onClick={() => {
                       setReplacingImage(viewingImage);
                       setShowImageViewer(false);
                       setViewingImage(null);
                       document.getElementById('replace-file-input')?.click();
                     }}
                     className="flex-1 bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600 transition-colors"
                   >
                     <i className="ri-image-edit-line mr-2"></i>
                     Bild ersetzen
                   </button>
                 )}
                 
                 <button
                   onClick={() => window.open(viewingImage.url, '_blank')}
                   className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
                 >
                   <i className="ri-external-link-line mr-2"></i>
                   Öffnen
                 </button>
               </div>
             </div>
           </div>
         </div>
       )}
      </div>

      {/* Content Area */}
      {activeView === 'uploaded' ? (
        <div className="space-y-6">
          {/* Upload-Bereiche mit Ordner-Integration */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {folders.map(folder => (
              <div key={folder.id} className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-blue-400 transition-colors">
                <div className="text-center">
                  <div className="mb-2">
                    <i className="ri-folder-line text-3xl text-gray-400"></i>
                  </div>
                  <h3 className="font-semibold text-gray-700 mb-1">{folder.name}</h3>
                  <p className="text-xs text-gray-500 mb-3">{folder.description}</p>
                  <label className="cursor-pointer bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors inline-block">
                    <i className="ri-upload-line mr-2"></i>
                    Upload
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleFileUpload(e, 'general', folder.id)}
                      disabled={uploading}
                    />
                  </label>
                </div>
              </div>
            ))}
          </div>

          {/* Bilder-Grid für hochgeladene Medien */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filteredFiles.map(file => (
              <div key={file.id} className="group relative bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
                <div className="aspect-square overflow-hidden">
                  <img
                    src={file.url || file.file_url}
                    alt={file.alt_text || file.filename}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                  />
                </div>

                <div className="p-3">
                  <div className="text-xs text-gray-500 mb-1">
                    {USAGE_TYPES.find(t => t.id === file.usage_type)?.name || file.usage_type}
                  </div>
                  <div className="text-sm font-medium truncate mb-2">{file.original_name || file.filename}</div>

                  <div className="flex gap-1">
                    <button
                      onClick={() => copyImageUrl(file.url || file.file_url || '')}
                      className="flex-1 bg-green-500 text-white px-2 py-1 rounded text-xs hover:bg-green-600 transition-colors"
                      title="URL kopieren"
                    >
                      <i className="ri-link mr-1"></i>URL
                    </button>
                    <button
                      onClick={() => {
                        setEditingImage(file);
                        setShowImageEditor(true);
                      }}
                      className="flex-1 bg-blue-500 text-white px-2 py-1 rounded text-xs hover:bg-blue-600 transition-colors"
                      title="Bearbeiten"
                    >
                      <i className="ri-edit-line mr-1"></i>Edit
                    </button>
                    <button
                      onClick={() => deleteImage(file.id)}
                      className="bg-red-500 text-white px-2 py-1 rounded text-xs hover:bg-red-600 transition-colors"
                      title="Löschen"
                    >
                      <i className="ri-delete-bin-line"></i>
                    </button>
                  </div>
                </div>

                {/* Image Info Overlay */}
                <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                  {((file.size || file.file_size || 0) / 1024).toFixed(0)}KB
                </div>
              </div>
            ))}
          </div>

          {filteredFiles.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <i className="ri-image-line text-6xl mb-4"></i>
              <div className="text-xl mb-2">Keine Bilder gefunden</div>
              <div>Laden Sie Bilder in den entsprechenden Kategorien hoch</div>
            </div>
          )}
        </div>
      ) : (
        /* Website-Bilder Tab */
        <div className="space-y-6">
          {/* Filter für Website-Bilder */}
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="flex gap-4 items-center flex-wrap">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="border rounded-lg px-3 py-2"
              >
                <option value="all">Alle Quellen</option>
                 <option value="products">Produktbilder</option>
                 <option value="content">Content-Bilder</option>
                 <option value="blog">Blog-Bilder</option>
                 <option value="static">Statische Bilder</option>
                 <option value="components">Component-Assets</option>
                 <option value="rendered">Gerenderte Bilder</option>
                 <option value="media_files">Uploads</option>
                 <option value="customers">Kunden-Avatars</option>
                 <option value="team">Team-Fotos</option>
                 <option value="gallery">Galerie-Bilder</option>
                 <option value="certificates">Zertifikate</option>
              </select>
              
              <input
                type="text"
                placeholder="Website-Bilder suchen..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="border rounded-lg px-3 py-2 flex-1 max-w-md"
              />
              
              <div className="text-sm text-gray-600">
                {websiteImages.filter(img => {
                  const matchesCategory = selectedCategory === 'all' || img.category === selectedCategory;
                  const matchesSearch = img.sourceName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                      img.filename.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                      img.usage.toLowerCase().includes(searchTerm.toLowerCase());
                  return matchesCategory && matchesSearch;
                }).length} von {websiteImages.length} Bildern
              </div>
            </div>
          </div>
          
          {loadingWebsiteImages ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-xl">Website-Bilder werden geladen...</div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {websiteImages.filter(image => {
                const matchesCategory = selectedCategory === 'all' || image.category === selectedCategory;
                const matchesSearch = image.sourceName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                    image.filename.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                    image.usage.toLowerCase().includes(searchTerm.toLowerCase());
                return matchesCategory && matchesSearch;
              }).map(image => (
                <div key={image.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="aspect-video overflow-hidden">
                    <img
                      src={image.url}
                      alt={image.filename}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                        {image.category}
                      </span>
                      <span className="text-xs text-gray-500">
                        {image.imageType}
                      </span>
                    </div>
                    
                    <h3 className="font-medium text-gray-900 mb-1 truncate">
                      {image.sourceName}
                    </h3>
                    
                    <p className="text-sm text-gray-600 mb-3">
                      {image.usage}
                    </p>
                    
                    <div className="flex gap-2">
                      <button
                        onClick={() => copyImageUrl(image.url)}
                        className="flex-1 bg-green-500 text-white px-3 py-2 rounded text-sm hover:bg-green-600 transition-colors"
                      >
                        <i className="ri-link mr-1"></i>
                        URL kopieren
                      </button>
                      
                      {image.canReplace && (
                        <div className="relative">
                          <label className="cursor-pointer bg-orange-500 text-white px-3 py-2 rounded text-sm hover:bg-orange-600 transition-colors inline-block">
                            <i className="ri-image-edit-line mr-1"></i>
                            Ersetzen
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                
                                // Upload neue Datei
                                const formData = new FormData();
                                formData.append('file', file);
                                formData.append('category', image.category);
                                
                                try {
                                  const uploadResponse = await fetch('/api/upload-media', {
                                    method: 'POST',
                                    body: formData,
                                  });
                                  
                                  if (!uploadResponse.ok) throw new Error('Upload fehlgeschlagen');
                                  
                                  const uploadResult = await uploadResponse.json();
                                  
                                  // Ersetze das Bild auf der Website
                                  await replaceWebsiteImage(image, uploadResult.fileUrl);
                                } catch (error) {
                                  console.error('Fehler beim Ersetzen:', error);
                                  alert('Fehler beim Ersetzen des Bildes');
                                }
                              }}
                            />
                          </label>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {!loadingWebsiteImages && websiteImages.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <i className="ri-global-line text-6xl mb-4"></i>
              <div className="text-xl mb-2">Keine Website-Bilder gefunden</div>
              <div>Es wurden keine Bilder auf der Website erkannt</div>
            </div>
          )}
        </div>
      )}



      {/* Image Editor Modal */}
      {showImageEditor && editingImage && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">Bild bearbeiten</h3>
                <button
                  onClick={() => setShowImageEditor(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <i className="ri-close-line text-2xl"></i>
                </button>
              </div>

              <div className="space-y-4">
                <div className="aspect-video overflow-hidden rounded-lg bg-gray-100">
                  <img
                    src={editingImage.url || editingImage.file_url}
                    alt={editingImage.alt_text || editingImage.filename}
                    className="w-full h-full object-contain"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Verwendungszweck</label>
                    <select
                      value={editingImage.usage_type}
                      onChange={(e) => setEditingImage({...editingImage, usage_type: e.target.value})}
                      className="w-full border rounded-lg px-3 py-2"
                    >
                      {USAGE_TYPES.map(type => (
                        <option key={type.id} value={type.id}>{type.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Alt-Text</label>
                    <input
                      type="text"
                      value={editingImage.alt_text}
                      onChange={(e) => setEditingImage({...editingImage, alt_text: e.target.value})}
                      className="w-full border rounded-lg px-3 py-2"
                      placeholder="Beschreibung für das Bild"
                    />
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <strong>Dateiname:</strong> {editingImage.original_name || editingImage.filename}
                    </div>
                    <div>
                      <strong>Größe:</strong> {((editingImage.size || editingImage.file_size || 0) / 1024).toFixed(0)} KB
                    </div>
                    <div>
                      <strong>Typ:</strong> {editingImage.mime_type}
                    </div>
                    <div>
                      <strong>Hochgeladen:</strong> {new Date(editingImage.created_at).toLocaleDateString('de-DE')}
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="text-sm font-medium mb-2">URL für Frontend:</div>
                  <div className="bg-white border rounded px-3 py-2 font-mono text-sm break-all">
                    {editingImage.url || editingImage.file_url}
                  </div>
                  <button
                    onClick={() => copyImageUrl(editingImage.url || editingImage.file_url || '')}
                    className="mt-2 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
                  >
                    <i className="ri-clipboard-line mr-2"></i>
                    URL kopieren
                  </button>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={updateImageSettings}
                    className="flex-1 bg-green-500 text-white py-2 px-4 rounded-lg hover:bg-green-600 transition-colors"
                  >
                    <i className="ri-save-line mr-2"></i>
                    Änderungen speichern
                  </button>
                  <button
                    onClick={() => setShowImageEditor(false)}
                    className="bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-gray-600 transition-colors"
                  >
                    Abbrechen
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
