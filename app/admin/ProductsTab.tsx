'use client';
import { useState, useEffect, FormEvent, ChangeEvent } from "react";
import { supabase } from '@/lib/supabase';
import ProductImageManager from '@/components/ProductImageManager';

interface Product {
  id: string;
  name: string;
  description?: string;
  detailed_description?: string;
  category: string;
  price: string | number;
  original_price?: string | number | null;
  stock_quantity: number;
  min_stock_level: number;
  unit: string;
  image_url: string;
  additional_images?: string[];
  features?: string[];
  specifications?: Record<string, any>;
  in_stock: boolean;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
  slug?: string;
  has_quantity_discount?: boolean;
}

interface InventoryMovement {
  id?: string;
  product_id: string;
  movement_type: 'in' | 'out';
  quantity: number;
  reason: string;
  notes?: string;
  created_by: string;
  created_at: string;
  order_reference?: string;
}

interface StockChange {
  quantity: number;
  reason: string;
  notes: string;
}

interface ProductFormData {
  id?: number;
  name: string;
  category: string;
  wood_type: string;
  size: string;
}

// Produktionsreife ProductsTab - keine Fallback-Daten mehr

export default function ProductsTab() {
  // Starte mit leerem Array - werden durch echte Daten geladen
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [newProductData, setNewProductData] = useState<ProductFormData>({
    name: '',
    category: '',
    wood_type: 'Buche',
    size: '25cm'
  });
  const [newProductImages, setNewProductImages] = useState<any[]>([]);
  const [newProductMainImage, setNewProductMainImage] = useState<string>('');
  const [editProductData, setEditProductData] = useState<ProductFormData>({
    name: '',
    category: '',
    wood_type: 'Buche',
    size: '25cm'
  });
  const [editProductImages, setEditProductImages] = useState<any[]>([]);
  const [editProductMainImage, setEditProductMainImage] = useState<string>('');
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("Alle");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [inventoryModal, setInventoryModal] = useState<Product | null>(null);
  const [stockChange, setStockChange] = useState<StockChange>({
    quantity: 0,
    reason: "",
    notes: "",
  });
  const [inventoryHistory, setInventoryHistory] = useState<InventoryMovement[]>([]);
  const [editImageUrl, setEditImageUrl] = useState<string>('');
  const [showHistory, setShowHistory] = useState<string | null>(null);

  const [categories, setCategories] = useState<string[]>(["Alle"]);

  // -------------------------------------------------------------------------
  // Data loading
  // -------------------------------------------------------------------------
  useEffect(() => {
    loadProducts();
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('product_categories')
        .select('name')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      
      const categoryNames = data?.map((cat: any) => cat.name as string) || [];
      setCategories(["Alle", ...categoryNames]);
    } catch (error) {
      console.error('❌ Error loading categories:', error);
      // Keine Fallback-Kategorien - zeige nur "Alle"
      setCategories(["Alle"]);
    }
  };

  useEffect(() => {
    filterProducts();
  }, [products, searchTerm, selectedCategory]);

  const loadProducts = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("is_active", true)
        .order("name");

      if (error) {
        console.error('❌ Error loading products:', error);
        setProducts([]);
        setFilteredProducts([]);
      } else {
        const typedData = (data || []) as unknown as Product[];
        setProducts(typedData);
        setFilteredProducts(typedData);
        console.log('✅ Production products loaded:', typedData.length, 'items');
      }
    } catch (err) {
      console.error("❌ Error loading production products:", err);
      // Keine Fallback-Daten - zeige leere Arrays
      setProducts([]);
      setFilteredProducts([]);
    } finally {
      setIsLoading(false);
    }
  };

  const filterProducts = () => {
    let filtered = products;

    if (selectedCategory !== "Alle") {
      filtered = filtered.filter(
        (product) => product.category === selectedCategory
      );
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (product) =>
          product.name?.toLowerCase().includes(term) ||
          product.category?.toLowerCase().includes(term) ||
          product.description?.toLowerCase().includes(term)
      );
    }

    setFilteredProducts(filtered);
  };

  // -------------------------------------------------------------------------
  // Update product
  // -------------------------------------------------------------------------
  const updateProduct = async (productData: Partial<Product>) => {
    try {
      // Use images from ProductImageGallery
      const updatedData = {
        ...productData,
        image_url: editProductMainImage,
        additional_images: editProductImages.filter(img => !img.isMain).map(img => img.url),
        wood_type: editProductData.wood_type,
        size: editProductData.size,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from("products")
        .update(updatedData)
        .eq("id", editingProduct?.id || '');

      if (error) throw error;

      setIsEditModalOpen(false);
      setEditingProduct(null);
      setEditImageUrl('');
      setEditProductData({ name: '', category: '', wood_type: 'Buche', size: '25cm' });
      setEditProductImages([]);
      setEditProductMainImage('');
      await loadProducts();
      alert("Produkt erfolgreich aktualisiert!");
    } catch (err) {
      console.error("Error updating product:", err);
      alert("Fehler beim Aktualisieren des Produkts");
    }
  };

  // -------------------------------------------------------------------------
  // Stock handling
  // -------------------------------------------------------------------------
  const updateStock = async () => {
    if (!stockChange.quantity || !stockChange.reason || !inventoryModal) {
      alert("Bitte alle Felder ausfüllen");
      return;
    }

    try {
      const movement_type = stockChange.quantity > 0 ? "in" : "out";
      const abs_quantity = Math.abs(stockChange.quantity);

      // Log the inventory movement
      const { error: movementError } = await supabase
        .from("inventory_movements")
        .insert({
          product_id: inventoryModal.id,
          movement_type,
          quantity: abs_quantity,
          reason: stockChange.reason,
          notes: stockChange.notes,
          created_by: "Admin",
        });

      if (movementError) throw movementError;

      // Update product stock
      if (!inventoryModal) return;
      
      const newStock = inventoryModal.stock_quantity + stockChange.quantity;
      const { error: updateError } = await supabase
        .from("products")
        .update({
          stock_quantity: Math.max(0, newStock),
          in_stock: newStock > 0,
          updated_at: new Date().toISOString(),
        })
        .eq("id", inventoryModal.id);

      if (updateError) throw updateError;

      setInventoryModal(null);
      setStockChange({ quantity: 0, reason: "", notes: "" });
      await loadProducts();
      alert("Lagerbestand erfolgreich aktualisiert!");
    } catch (err) {
      console.error("Error updating stock:", err);
      alert("Fehler beim Aktualisieren des Lagerbestands");
    }
  };

  // -------------------------------------------------------------------------
  // Inventory history
  // -------------------------------------------------------------------------
  const loadInventoryHistory = async (productId: string) => {
    try {
      const { data, error } = await supabase
        .from("inventory_movements")
        .select("*")
        .eq("product_id", productId)
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) throw error;
      const typedData = data as unknown as InventoryMovement[];
      setInventoryHistory(typedData || []);
      setShowHistory(productId);
    } catch (err) {
      console.error("Error loading inventory history:", err);
    }
  };

  const getMovementTypeText = (type: string): string => (type === "in" ? "Zugang" : "Abgang");

  const getMovementTypeColor = (type: string): string =>
    type === "in"
      ? "text-green-600 bg-green-100"
      : "text-red-600 bg-red-100";

  const getReasonText = (reason: string): string => {
    const reasons: Record<string, string> = {
      restock: "Nachlieferung",
      sale: "Verkauf",
      adjustment: "Korrektur",
      damaged: "Beschädigt",
      returned: "Rückgabe",
    };
    return reasons[reason] || reason;
  };

  // -------------------------------------------------------------------------
  // Low‑stock helpers
  // -------------------------------------------------------------------------
  const getLowStockProducts = () =>
    products.filter((product) => product.stock_quantity <= product.min_stock_level);

  const getStockStatusColor = (product: Product): string => {
    if (product.stock_quantity === 0) return "text-red-600 bg-red-100";
    if (product.stock_quantity <= product.min_stock_level)
      return "text-orange-600 bg-orange-100";
    return "text-green-600 bg-green-100";
  };

  const getStockStatusText = (product: Product): string => {
    if (product.stock_quantity === 0) return "Ausverkauft";
    if (product.stock_quantity <= product.min_stock_level) return "Niedrig";
    return "Verfügbar";
  };

  // -------------------------------------------------------------------------
  // Duplicate product
  // -------------------------------------------------------------------------
  const duplicateProduct = async (productId: string) => {
    if (!confirm("Möchten Sie dieses Produkt wirklich duplizieren?")) return;

    setIsLoading(true);
    try {
      const { data: originalProduct, error: fetchError } = await supabase
        .from("products")
        .select("*")
        .eq("id", productId)
        .single();

      if (fetchError) throw fetchError;

      // Generate unique slug by adding timestamp
      const timestamp = Date.now();
      const baseSlug = originalProduct.slug || (originalProduct.name as string).toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const newSlug = `${baseSlug}-kopie-${timestamp}`;

      const { id, created_at, updated_at, ...productData } = originalProduct;
      const duplicatedProduct = {
        ...productData,
        name: `${originalProduct.name} - Kopie`,
        slug: newSlug,
        is_active: false,
      };

      const { error: insertError } = await supabase
        .from("products")
        .insert([duplicatedProduct]);

      if (insertError) throw insertError;

      alert("Produkt erfolgreich dupliziert!");
      await loadProducts();
    } catch (err: any) {
      console.error("Error duplicating product:", err);
      alert("Fehler beim Duplizieren des Produkts: " + (err.message || err));
    } finally {
      setIsLoading(false);
    }
  };

  const deleteProduct = async (productToDelete: Product): Promise<void> => {
    if (!confirm(`Sind Sie sicher, dass Sie das Produkt "${productToDelete.name}" löschen möchten? Diese Aktion kann nicht rückgängig gemacht werden.`)) {
      return;
    }

    setIsLoading(true);
    try {
      const { data: orderItems, error: orderCheckError } = await supabase
        .from("order_items")
        .select("id")
        .ilike("product_name", `%${productToDelete.name}%`)
        .limit(1);

      if (orderCheckError) throw orderCheckError;

      if (orderItems && orderItems.length > 0) {
        alert(
          "Dieses Produkt kann nicht gelöscht werden, da es bereits in Bestellungen verwendet wird. Deaktivieren Sie es stattdessen."
        );
        setIsLoading(false);
        return;
      }
      
      const { error: deleteError } = await supabase
        .from("products")
        .delete()
        .eq("id", productToDelete.id);

      if (deleteError) throw deleteError;

      alert("Produkt erfolgreich gelöscht!");
      await loadProducts();
    } catch (err: any) {
      console.error("Error deleting product:", err);
      alert("Fehler beim Löschen des Produkts: " + (err.message || err));
    } finally {
      setIsLoading(false);
    }
  }

  // -------------------------------------------------------------------------
  // Rendering
  // -------------------------------------------------------------------------
  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-8 text-center">
        <div className="w-12 h-12 flex items-center justify-center bg-[#C04020] rounded-full mx-auto mb-4 animate-pulse">
          <i className="ri-product-hunt-line text-2xl text-white"></i>
        </div>
        <p className="text-lg font-medium text-gray-700">Lade Produkte...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Low Stock Alert */}
      {getLowStockProducts().length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6">
          <div className="flex items-center mb-4">
            <div className="w-6 h-6 flex items-center justify-center bg-red-500 rounded-full mr-3">
              <i className="ri-alert-line text-white text-sm"></i>
            </div>
            <h3 className="text-lg font-bold text-red-800">Lagerbestand-Warnung</h3>
          </div>
          <div className="space-y-2">
            {getLowStockProducts().map((product) => (
              <div
                key={product.id}
                className="flex justify-between items-center bg-red-100 p-3 rounded-lg"
              >
                <div>
                  <span className="font-medium text-red-800">{product.name}</span>
                  <span className="text-sm text-red-600 ml-2">
                    ({product.category})
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-red-800 font-bold">{product.stock_quantity} SRM</div>
                  <div className="text-xs text-red-600">
                    Min: {product.min_stock_level} SRM
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <div className="w-5 h-5 flex items-center justify-center text-gray-400">
                  <i className="ri-search-line"></i>
                </div>
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#C04020] transition-colors"
                placeholder="Suche nach Produktname, Kategorie oder Beschreibung..."
              />
            </div>
          </div>

          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-[#C04020] transition-colors cursor-pointer pr-8"
            >
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors cursor-pointer whitespace-nowrap mr-2"
          >
            <i className="ri-add-line mr-2"></i>Neues Produkt
          </button>
          
          <button
            onClick={loadProducts}
            className="bg-[#C04020] hover:bg-[#A03318] text-white px-4 py-2 rounded-lg font-medium transition-colors cursor-pointer whitespace-nowrap"
          >
            <i className="ri-refresh-line mr-2"></i>Aktualisieren
          </button>
        </div>
      </div>

      {/* Products List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-[#1A1A1A)">
              Produkte ({filteredProducts.length})
            </h2>
            <div className="text-sm text-gray-500">
              Gesamt: {products.length} aktive Produkte
            </div>
          </div>
        </div>

        {filteredProducts.length === 0 ? (
          <div className="p-8 text-center">
            <div className="w-16 h-16 flex items-center justify-center bg-gray-100 rounded-full mx-auto mb-4">
              <i className="ri-product-hunt-line text-2xl text-gray-400"></i>
            </div>
            <h3 className="text-lg font-medium text-gray-600 mb-2">
              {products.length === 0 ? "Noch keine Produkte" : "Keine Produkte gefunden"}
            </h3>
            <p className="text-gray-500">
              {products.length === 0
                ? "Produkte werden hier angezeigt."
                : "Versuchen Sie andere Suchkriterien oder Filter."}
            </p>
          </div>
        ) : (
          <div className="admin-table-container">
            <table className="min-w-full admin-table">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Produkt
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Kategorie
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Preis
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Lagerbestand
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Aktionen
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <img
                          src={product.image_url}
                          alt={product.name?.toString() || "Product"}
                          className="w-12 h-12 rounded-lg object-cover mr-4"
                        />
                        <div>
                          <div className="text-sm font-bold text-[#1A1A1A]">
                            {product.name?.toString() || ""}
                          </div>
                          <div className="text-xs text-gray-500 max-w-xs truncate">
                            {product.description?.toString() || ""}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-xs font-bold text-[#C04020] uppercase tracking-wider">
                        {product.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-[#C04020]">
                        €{parseFloat(product.price.toString()).toFixed(2)}
                      </div>
                      {product.original_price && (
                        <div className="text-xs text-gray-400 line-through">
                          €{parseFloat(product.original_price.toString()).toFixed(2)}
                        </div>
                      )}
                      <div className="text-xs text-gray-500">{product.unit}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-[#1A1A1A]">
                        {product.stock_quantity} SRM
                      </div>
                      <div className="text-xs text-gray-500">
                        Min: {product.min_stock_level} SRM
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-bold rounded-full ${getStockStatusColor(
                          product
                        )}`}
                      >
                        {getStockStatusText(product)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setEditingProduct(product);
                              setEditImageUrl(product.image_url?.toString() || '');
                              setEditProductData({
                                id: parseInt(product.id),
                                name: product.name,
                                category: product.category,
                                wood_type: product.name.toLowerCase().includes('eiche') ? 'Eiche' : 
                                          product.name.toLowerCase().includes('birke') ? 'Birke' :
                                          product.name.toLowerCase().includes('fichte') ? 'Fichte' : 'Buche',
                                size: product.name.match(/(\d+)\s*cm/i)?.[1] + 'cm' || '25cm'
                              });
                              // Initialize images for gallery
                              const initialImages = [];
                              if (product.image_url) {
                                initialImages.push({
                                  id: 'main-' + Date.now(),
                                  url: product.image_url,
                                  seoSlug: '',
                                  storageFilename: '',
                                  isMain: true
                                });
                              }
                              if (product.additional_images) {
                                product.additional_images.forEach((url, index) => {
                                  initialImages.push({
                                    id: 'additional-' + index + '-' + Date.now(),
                                    url: url,
                                    seoSlug: '',
                                    storageFilename: '',
                                    isMain: false
                                  });
                                });
                              }
                              setEditProductImages(initialImages);
                              setEditProductMainImage(product.image_url?.toString() || '');
                              setIsEditModalOpen(true);
                            }}
                            className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600 transition-colors cursor-pointer whitespace-nowrap"
                            title="Bearbeiten"
                          >
                            <i className="ri-edit-line mr-1"></i>Bearbeiten
                          </button>
                          <button
                            onClick={() => duplicateProduct(product.id)}
                            className="bg-yellow-500 text-white px-3 py-1 rounded text-sm hover:bg-yellow-600 transition-colors cursor-pointer whitespace-nowrap"
                            title="Duplizieren"
                          >
                            <i className="ri-file-copy-line mr-1"></i>Duplizieren
                          </button>
                          <button
                            onClick={() => deleteProduct(product)}
                            className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600 transition-colors cursor-pointer whitespace-nowrap"
                            title="Löschen"
                          >
                            <i className="ri-delete-bin-line mr-1"></i>Löschen
                          </button>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <button
                            onClick={() => setInventoryModal(product)}
                            className="text-green-600 hover:text-green-800 cursor-pointer"
                            title="Lagerbestand anpassen"
                          >
                            <i className="ri-stock-line mr-1"></i>Lager
                          </button>
                          <button
                            onClick={() => loadInventoryHistory(product.id)}
                            className="text-purple-600 hover:text-purple-800 cursor-pointer"
                            title="Lagerhistorie anzeigen"
                          >
                            <i className="ri-history-line mr-1"></i>Historie
                          </button>
                          <button
                            onClick={() =>
                              setSelectedProduct(
                                selectedProduct?.id === product.id ? null : product
                              )
                            }
                            className="text-[#C04020] hover:text-[#A03318] cursor-pointer"
                            title="Produktdetails anzeigen"
                          >
                            <i className="ri-eye-line mr-1"></i>Details
                          </button>
                        </div>
                      </div>
                    </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>

    {/* Product Edit Modal */}
    {isEditModalOpen && editingProduct && (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-[#1A1A1A)">
                Produkt bearbeiten: {editingProduct.name}
              </h2>
              <button
                onClick={() => {
                  setIsEditModalOpen(false);
                  setEditingProduct(null);
                  setEditImageUrl('');
                }}
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <i className="ri-close-line text-2xl"></i>
              </button>
            </div>
          </div>

          <form
            onSubmit={(e: FormEvent<HTMLFormElement>) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const data = Object.fromEntries(formData.entries());

              // Convert features (textarea) into an array
              const featuresValue = data.features?.toString() || "";
              const features: string[] = featuresValue
                ? featuresValue.split("\\n").filter((f: string) => f.trim() !== "")
                : [];

              // Parse specifications JSON
              let specifications: Record<string, any> = {};
              try {
                const specsValue = data.specifications?.toString() || "{}";
                specifications = JSON.parse(specsValue);
              } catch (err) {
                alert(
                  "Fehler in den technischen Daten - bitte korrektes JSON-Format verwenden"
                );
                return;
              }

              const priceValue = data.price?.toString() || "0";
              const originalPriceValue = data.original_price?.toString() || "";
              const stockQuantityValue = data.stock_quantity?.toString() || "0";
              const minStockLevelValue = data.min_stock_level?.toString() || "0";
              
              // Use the state value for image_url
              updateProduct({
                name: data.name?.toString() || "",
                category: data.category?.toString() || "",
                description: data.description?.toString(),
                detailed_description: data.detailed_description?.toString(),
                image_url: editImageUrl,
                price: parseFloat(priceValue),
                original_price: originalPriceValue ? parseFloat(originalPriceValue) : null,
                stock_quantity: parseInt(stockQuantityValue, 10),
                min_stock_level: parseInt(minStockLevelValue, 10),
                unit: data.unit?.toString() || "",
                features,
                specifications,
                in_stock: parseInt(stockQuantityValue, 10) > 0,
                has_quantity_discount: data.has_quantity_discount === 'on',
              });
            }}
            className="p-6 space-y-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Produktname
                </label>
                <input
                  type="text"
                  name="name"
                  value={editProductData.name}
                  onChange={(e) => {
                    const newName = e.target.value;
                    setEditProductData(prev => ({
                      ...prev,
                      name: newName,
                      wood_type: newName.toLowerCase().includes('eiche') ? 'Eiche' : 
                                 newName.toLowerCase().includes('birke') ? 'Birke' :
                                 newName.toLowerCase().includes('fichte') ? 'Fichte' : 'Buche',
                      size: newName.match(/(\d+)\s*cm/i)?.[1] + 'cm' || '25cm'
                    }));
                  }}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-[#C04020]"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Kategorie
                </label>
                <select
                  name="category"
                  value={editProductData.category}
                  onChange={(e) => setEditProductData(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-[#C04020] cursor-pointer pr-8"
                  required
                >
                  {categories.slice(1).map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Preis (€)
                </label>
                <input
                  type="number"
                  step="0.01"
                  name="price"
                  defaultValue={editingProduct.price}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-[#C04020]"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ursprungspreis (€) - optional
                </label>
                <input
                  type="number"
                  step="0.01"
                  name="original_price"
                  defaultValue={editingProduct?.original_price || ""}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-[#C04020]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Einheit
                </label>
                <select
                  name="unit"
                  defaultValue={editingProduct.unit || "SRM"}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-[#C04020]"
                >
                  <option value="SRM">SRM</option>
                  <option value="RM">RM</option>
                  <option value="FM">FM</option>
                  <option value="kg">kg</option>
                  <option value="Stück">Stück</option>
                  <option value="Palette">Palette</option>
                  <option value="m³">m³</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Lagerbestand ({editingProduct.unit || "SRM"})
                </label>
                <input
                  type="number"
                  name="stock_quantity"
                  defaultValue={editingProduct.stock_quantity}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-[#C04020]"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mindestbestand ({editingProduct.unit || "SRM"})
                </label>
                <input
                  type="number"
                  name="min_stock_level"
                  defaultValue={editingProduct.min_stock_level}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-[#C04020]"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    name="has_quantity_discount"
                    id="has_quantity_discount"
                    defaultChecked={editingProduct.has_quantity_discount || false}
                    className="w-4 h-4 text-[#C04020] bg-gray-100 border-gray-300 rounded focus:ring-[#C04020] focus:ring-2"
                  />
                  <label htmlFor="has_quantity_discount" className="text-sm font-medium text-gray-700">
                    Mengenrabatt ab 25 SRM aktivieren
                  </label>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Wenn aktiviert, erhalten Kunden €2,50 Rabatt pro SRM bei Bestellungen ab 25 SRM für dieses Produkt.
                </p>
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Produktbilder</label>
              <ProductImageManager
                productData={editProductData}
                onImagesChange={(images: any) => {
                  setEditProductImages(images);
                  const mainImage = images.find((img: any) => img.isMain) || images[0];
                  if (mainImage) {
                    setEditProductMainImage(mainImage.url);
                    setEditImageUrl(mainImage.url);
                  }
                }}
                maxImages={6}
                showMainImageSelector={true}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Kurzbeschreibung
              </label>
              <textarea
                name="description"
                rows={3}
                defaultValue={editingProduct.description}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-[#C04020]"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Detailbeschreibung
              </label>
              <textarea
                name="detailed_description"
                rows={4}
                defaultValue={editingProduct.detailed_description}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-[#C04020]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Eigenschaften (eine pro Zeile)
              </label>
              <textarea
                name="features"
                rows={4}
                defaultValue={editingProduct.features ? editingProduct.features.join("\\n") : ""}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-[#C04020]"
                placeholder="Eigenschaft 1\\nEigenschaft 2\\n..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Technische Daten (JSON Format)
              </label>
              <textarea
                name="specifications"
                rows={4}
                defaultValue={JSON.stringify(
                  editingProduct.specifications || {},
                  null,
                  2
                )}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-[#C04020] font-mono text-sm"
                placeholder={`{"Holzart": "Buche", "Restfeuchte": "< 20%"}`}
              />
            </div>

            <div className="flex gap-4 pt-4 border-t border-gray-200">
              <button
                type="submit"
                className="bg-[#C04020] hover:bg-[#A03318] text-white px-6 py-3 rounded-lg font-bold transition-colors cursor-pointer whitespace-nowrap"
              >
                Änderungen speichern
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsEditModalOpen(false);
                  setEditingProduct(null);
                  setEditImageUrl('');
                }}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-bold transition-colors cursor-pointer whitespace-nowrap"
              >
                Abbrechen
              </button>
            </div>
          </form>
        </div>
      </div>
    )}

    {/* Inventory Modal */}
    {inventoryModal && (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl max-w-md w-full">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-[#1A1A1A)">
                Lagerbestand ändern
              </h2>
              <button
                onClick={() => {
                  setInventoryModal(null);
                  setStockChange({ quantity: 0, reason: "", notes: "" });
                }}
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <i className="ri-close-line text-xl"></i>
              </button>
            </div>
          </div>

          <div className="p-6 space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-bold text-[#1A1A1A] mb-2">{inventoryModal.name}</h3>
              <div className="text-sm text-gray-600">
                <div>
                  Aktueller Bestand:{" "}
                  <span className="font-bold">{inventoryModal.stock_quantity} SRM</span>
                </div>
                <div>
                  Mindestbestand:{" "}
                  <span className="font-bold">{inventoryModal.min_stock_level} SRM</span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Änderung (+/- SRM)
              </label>
              <input
                type="number"
                value={stockChange.quantity}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setStockChange((prev) => ({
                    ...prev,
                    quantity: parseInt(e.target.value, 10) || 0,
                  }))
                }
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-[#C04020]"
                placeholder="z.B. +10 oder -5"
              />
              <div className="text-xs text-gray-500 mt-1">
                Neuer Bestand:{" "}
                {Math.max(0, inventoryModal.stock_quantity + stockChange.quantity).toString()} SRM
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Grund
              </label>
              <select
                value={stockChange.reason}
                onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                  setStockChange((prev) => ({ ...prev, reason: e.target.value }))
                }
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-[#C04020] cursor-pointer pr-8"
              >
                <option value="">Grund wählen...</option>
                <option value="restock">Nachlieferung</option>
                <option value="sale">Verkauf</option>
                <option value="adjustment">Korrektur</option>
                <option value="damaged">Beschädigt</option>
                <option value="returned">Rückgabe</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notizen (optional)
              </label>
              <textarea
                value={stockChange.notes}
                onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
                  setStockChange((prev) => ({ ...prev, notes: e.target.value }))
                }
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-[#C04020]"
                rows={2}
                placeholder="Zusätzliche Informationen..."
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                onClick={updateStock}
                disabled={!stockChange.quantity || !stockChange.reason}
                className={`flex-1 py-3 px-4 rounded-lg font-bold transition-colors cursor-pointer whitespace-nowrap ${
                  stockChange.quantity && stockChange.reason
                    ? "bg-[#C04020] hover:bg-[#A03318] text-white"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }`}
              >
                Bestand aktualisieren
              </button>
              <button
                onClick={() => {
                  setInventoryModal(null);
                  setStockChange({ quantity: 0, reason: "", notes: "" });
                }}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-3 rounded-lg font-bold transition-colors cursor-pointer whitespace-nowrap"
              >
                Abbrechen
              </button>
            </div>
          </div>
        </div>
      </div>
    )}

    {/* Inventory History Modal */}
    {showHistory && (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-[#1A1A1A)">Lagerhistorie</h2>
              <button
                onClick={() => {
                  setShowHistory(null);
                  setInventoryHistory([]);
                }}
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <i className="ri-close-line text-xl"></i>
              </button>
            </div>
          </div>

          <div className="p-6">
            <div className="mb-4">
              <h3 className="font-bold text-[#1A1A1A]">
                {products.find((p) => p.id === showHistory)?.name}
              </h3>
              <p className="text-sm text-gray-600">
                Aktueller Bestand:{" "}
                {products.find((p) => p.id === showHistory)?.stock_quantity} SRM
              </p>
            </div>

            {inventoryHistory.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 flex items-center justify-center bg-gray-100 rounded-full mx-auto mb-4">
                  <i className="ri-history-line text-2xl text-gray-400"></i>
                </div>
                <p className="text-gray-500">Keine Lagerbewegungen vorhanden</p>
              </div>
            ) : (
              <div className="space-y-3">
                {inventoryHistory.map((movement) => (
                  <div
                    key={movement.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center space-x-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold ${getMovementTypeColor(
                          movement.movement_type
                        )}`}
                      >
                        {getMovementTypeText(movement.movement_type)}
                      </span>
                      <div>
                        <div className="font-medium text-[#1A1A1A]">
                          {movement.movement_type === "in" ? "+" : "-"}{" "}
                          {movement.quantity.toString()} SRM
                        </div>
                        <div className="text-sm text-gray-600">
                          {getReasonText(movement.reason)}
                        </div>
                        {movement.notes && (
                          <div className="text-xs text-gray-500 mt-1">
                            {movement.notes}
                          </div>
                        )}
                        {movement.order_reference && (
                          <div className="text-xs text-blue-600 mt-1">
                            Bestellung: {movement.order_reference}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                        <div className="text-sm text-gray-600">
                          {new Date(movement.created_at).toLocaleDateString("de-DE")}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(movement.created_at).toLocaleTimeString("de-DE", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                        <div className="text-xs text-gray-400">
                          von {movement.created_by}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
      </div>
    )}

    {/* Add Product Modal */}
    {isAddModalOpen && (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-[#1A1A1A]">Neues Produkt hinzufügen</h2>
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  setNewProductData({ name: '', category: '', wood_type: 'Buche', size: '25cm' });
                  setNewProductImages([]);
                  setNewProductMainImage('');
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <i className="ri-close-line text-2xl"></i>
              </button>
            </div>
          </div>

          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const formData = new FormData(e.target as HTMLFormElement);
              
              try {
                const productData = {
                  name: formData.get('name') as string,
                  category: formData.get('category') as string,
                  description: formData.get('description') as string,
                  detailed_description: formData.get('detailed_description') as string,
                  price: parseFloat(formData.get('price') as string),
                  original_price: formData.get('original_price') ? parseFloat(formData.get('original_price') as string) : null,
                  unit: formData.get('unit') as string,
                  stock_quantity: parseInt(formData.get('stock_quantity') as string),
                  min_stock_level: parseInt(formData.get('min_stock_level') as string),
                  image_url: newProductMainImage,
                  additional_images: newProductImages.filter(img => !img.isMain).map(img => img.url),
                  features: (formData.get('features') as string).split('\n').filter(f => f.trim()),
                  specifications: formData.get('specifications') ? JSON.parse(formData.get('specifications') as string) : {},
                  wood_type: formData.get('wood_type') as string,
                   size: formData.get('size') as string,
                   in_stock: true,
                   is_active: true,
                   has_quantity_discount: formData.get('has_quantity_discount') === 'on',
                  slug: (formData.get('name') as string).toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')
                };

                const { error } = await supabase.from('products').insert([productData]);
                if (error) throw error;

                alert('Produkt erfolgreich erstellt!');
                setIsAddModalOpen(false);
                setNewProductData({ name: '', category: '', wood_type: 'Buche', size: '25cm' });
                setNewProductImages([]);
                setNewProductMainImage('');
                await loadProducts();
              } catch (error) {
                console.error('Error creating product:', error);
                alert('Fehler beim Erstellen des Produkts');
              }
            }}
            className="p-6 space-y-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Produktname *</label>
                <input
                  type="text"
                  name="name"
                  required
                  value={newProductData.name}
                  onChange={(e) => {
                    const newName = e.target.value;
                    setNewProductData(prev => ({
                      ...prev,
                      name: newName,
                      wood_type: newName.toLowerCase().includes('eiche') ? 'Eiche' : 
                                 newName.toLowerCase().includes('birke') ? 'Birke' :
                                 newName.toLowerCase().includes('fichte') ? 'Fichte' : 'Buche',
                      size: newName.match(/(\d+)\s*cm/i)?.[1] + 'cm' || '25cm'
                    }));
                  }}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-[#C04020]"
                  placeholder="z.B. Premium Buchenholz"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Kategorie *</label>
                <select
                  name="category"
                  required
                  value={newProductData.category}
                  onChange={(e) => setNewProductData(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-[#C04020]"
                >
                  <option value="">Kategorie wählen...</option>
                  <option value="Premium Buche">Premium Buche</option>
                  <option value="Premium Eiche">Premium Eiche</option>
                  <option value="Premium Birke">Premium Birke</option>
                  <option value="Mischholz">Mischholz</option>
                  <option value="Anzündholz">Anzündholz</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Preis (€) *</label>
                <input
                  type="number"
                  step="0.01"
                  name="price"
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-[#C04020]"
                  placeholder="29.90"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Ursprungspreis (€)</label>
                <input
                  type="number"
                  step="0.01"
                  name="original_price"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-[#C04020]"
                  placeholder="39.90"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Einheit *</label>
                <select
                  name="unit"
                  defaultValue="pro SRM"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-[#C04020]"
                >
                  <option value="pro SRM">pro SRM</option>
                  <option value="pro Tonne">pro Tonne</option>
                  <option value="pro Stück">pro Stück</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Lagerbestand (SRM) *</label>
                <input
                  type="number"
                  name="stock_quantity"
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-[#C04020]"
                  placeholder="100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Mindestbestand (SRM) *</label>
                <input
                  type="number"
                  name="min_stock_level"
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-[#C04020]"
                  placeholder="10"
                />
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Produktbilder</label>
              <ProductImageManager
                productData={newProductData}
                onImagesChange={(images: any) => {
                  setNewProductImages(images);
                  const mainImage = images.find((img: any) => img.isMain) || images[0];
                  if (mainImage) {
                    setNewProductMainImage(mainImage.url);
                  }
                }}
                maxImages={6}
                showMainImageSelector={true}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Kurzbeschreibung *</label>
              <textarea
                name="description"
                rows={3}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-[#C04020]"
                placeholder="Kurze Produktbeschreibung..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Detailbeschreibung</label>
              <textarea
                name="detailed_description"
                rows={4}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-[#C04020]"
                placeholder="Ausführliche Produktbeschreibung..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Eigenschaften (eine pro Zeile)</label>
              <textarea
                name="features"
                rows={4}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-[#C04020]"
                placeholder="Kammergetrocknet\nRestfeuchte < 20%\nNachhaltiger Anbau\n..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Technische Daten (JSON Format)</label>
              <textarea
                name="specifications"
                rows={4}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-[#C04020] font-mono text-sm"
                placeholder='{"Holzart": "Buche", "Restfeuchte": "< 20%", "Scheitlänge": "25-33 cm"}'
              />
            </div>

            <div className="md:col-span-2">
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  name="has_quantity_discount"
                  id="new_has_quantity_discount"
                  className="w-4 h-4 text-[#C04020] bg-gray-100 border-gray-300 rounded focus:ring-[#C04020] focus:ring-2"
                />
                <label htmlFor="new_has_quantity_discount" className="text-sm font-medium text-gray-700">
                  Mengenrabatt ab 25 SRM aktivieren
                </label>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Wenn aktiviert, erhalten Kunden €2,50 Rabatt pro SRM bei Bestellungen ab 25 SRM für dieses Produkt.
              </p>
            </div>

            {/* Hidden fields */}
            <input type="hidden" name="wood_type" value={newProductData.wood_type} />
            <input type="hidden" name="size" value={newProductData.size} />

            <div className="flex gap-4 pt-4 border-t border-gray-200">
              <button
                type="submit"
                className="bg-[#C04020] hover:bg-[#A03318] text-white px-6 py-3 rounded-lg font-bold transition-colors flex-1"
              >
                Produkt erstellen
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsAddModalOpen(false);
                  setNewProductData({ name: '', category: '', wood_type: 'Buche', size: '25cm' });
                  setNewProductImages([]);
                  setNewProductMainImage('');
                }}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-bold transition-colors"
              >
                Abbrechen
              </button>
            </div>
          </form>
        </div>
      </div>
    )}

    {/* Product Details Modal */}
    {selectedProduct && (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-[#1A1A1A]">Produktdetails: {selectedProduct.name}</h2>
              <button
                onClick={() => setSelectedProduct(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <i className="ri-close-line text-2xl"></i>
              </button>
            </div>
          </div>

          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <img
                  src={selectedProduct.image_url}
                  alt={selectedProduct.name}
                  className="w-full h-64 object-cover rounded-lg"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/placeholder-image.jpg';
                  }}
                />
                {selectedProduct.additional_images && selectedProduct.additional_images.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Zusätzliche Bilder:</h4>
                    <div className="grid grid-cols-3 gap-2">
                      {selectedProduct.additional_images.map((url, index) => (
                        <img
                          key={index}
                          src={url}
                          alt={`${selectedProduct.name} ${index + 1}`}
                          className="w-full h-20 object-cover rounded"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/placeholder-image.jpg';
                          }}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{selectedProduct.name}</h3>
                  <p className="text-sm text-gray-600">{selectedProduct.category}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-gray-500">Preis:</span>
                    <p className="font-bold text-lg text-[#C04020]">€{selectedProduct.price} {selectedProduct.unit}</p>
                    {selectedProduct.original_price && (
                      <p className="text-sm text-gray-500 line-through">€{selectedProduct.original_price}</p>
                    )}
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Lagerbestand:</span>
                    <p className="font-bold">{selectedProduct.stock_quantity} {selectedProduct.unit}</p>
                    <p className="text-xs text-gray-500">Min: {selectedProduct.min_stock_level} {selectedProduct.unit}</p>
                  </div>
                </div>

                <div>
                  <span className="text-sm text-gray-500">Status:</span>
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-bold rounded-full ml-2 ${
                      selectedProduct.is_active ? 'text-green-600 bg-green-100' : 'text-red-600 bg-red-100'
                    }`}
                  >
                    {selectedProduct.is_active ? 'Aktiv' : 'Inaktiv'}
                  </span>
                </div>

                {selectedProduct.slug && (
                  <div>
                    <span className="text-sm text-gray-500">SEO-Slug:</span>
                    <p className="font-mono text-sm">{selectedProduct.slug}</p>
                  </div>
                )}
              </div>
            </div>

            {selectedProduct.description && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Beschreibung:</h4>
                <p className="text-gray-600">{selectedProduct.description}</p>
              </div>
            )}

            {selectedProduct.detailed_description && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Detailbeschreibung:</h4>
                <p className="text-gray-600">{selectedProduct.detailed_description}</p>
              </div>
            )}

            {selectedProduct.features && selectedProduct.features.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Eigenschaften:</h4>
                <ul className="list-disc list-inside space-y-1">
                  {selectedProduct.features.map((feature, index) => (
                    <li key={index} className="text-gray-600">{feature}</li>
                  ))}
                </ul>
              </div>
            )}

            {selectedProduct.specifications && Object.keys(selectedProduct.specifications).length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Technische Daten:</h4>
                <div className="bg-gray-50 rounded-lg p-4">
                  <pre className="text-sm text-gray-600 whitespace-pre-wrap">
                    {JSON.stringify(selectedProduct.specifications, null, 2)}
                  </pre>
                </div>
              </div>
            )}

            <div className="flex gap-4 pt-4 border-t border-gray-200">
              <button
                onClick={() => {
                  setSelectedProduct(null);
                  setEditingProduct(selectedProduct);
                  setEditImageUrl(selectedProduct.image_url?.toString() || '');
                  setEditProductData({
                    id: parseInt(selectedProduct.id),
                    name: selectedProduct.name,
                    category: selectedProduct.category,
                    wood_type: selectedProduct.name.toLowerCase().includes('eiche') ? 'Eiche' : 
                              selectedProduct.name.toLowerCase().includes('birke') ? 'Birke' :
                              selectedProduct.name.toLowerCase().includes('fichte') ? 'Fichte' : 'Buche',
                    size: selectedProduct.name.match(/(\d+)\s*cm/i)?.[1] + 'cm' || '25cm'
                  });
                  const initialImages = [];
                  if (selectedProduct.image_url) {
                    initialImages.push({
                      id: 'main-' + Date.now(),
                      url: selectedProduct.image_url,
                      seoSlug: '',
                      storageFilename: '',
                      isMain: true
                    });
                  }
                  if (selectedProduct.additional_images) {
                    selectedProduct.additional_images.forEach((url, index) => {
                      initialImages.push({
                        id: 'additional-' + index + '-' + Date.now(),
                        url: url,
                        seoSlug: '',
                        storageFilename: '',
                        isMain: false
                      });
                    });
                  }
                  setEditProductImages(initialImages);
                  setEditProductMainImage(selectedProduct.image_url?.toString() || '');
                  setIsEditModalOpen(true);
                }}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                <i className="ri-edit-line mr-2"></i>Bearbeiten
              </button>
              <button
                onClick={() => {
                  setSelectedProduct(null);
                  duplicateProduct(selectedProduct.id);
                }}
                className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                <i className="ri-file-copy-line mr-2"></i>Duplizieren
              </button>
              <button
                onClick={() => setSelectedProduct(null)}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors"
              >
                Schließen
              </button>
            </div>
          </div>
        </div>
      </div>
    )}
    </div>
  );
}
