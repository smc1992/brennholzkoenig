
// Zentrale Preiskalkulations-Logik für Frontend und Backend

export const calculatePriceWithTiers = (basePrice, quantity, pricingTiers = [], minOrderQuantity = 3, hasQuantityDiscount = false, totalCartQuantity = null) => {
  // Verwende Gesamtmenge im Warenkorb für Mindestmengen-Prüfung wenn verfügbar
  const quantityForMinCheck = totalCartQuantity !== null ? totalCartQuantity : quantity;
  
  // Mindestbestellmenge prüfen
  if (quantityForMinCheck < minOrderQuantity) {
    return {
      price: basePrice,
      originalPrice: basePrice,
      adjustment: 0,
      adjustmentText: 'Unter Mindestbestellmenge',
      tierName: 'Ungültig',
      canOrder: false
    };
  }

  // Preise und Zuschläge/Rabatte basierend auf der Menge
  let finalPrice = basePrice;
  let adjustmentText = '';
  let adjustment = 0;
  let tierName = 'Standard';
  
  if (quantity >= 3 && quantity <= 6) {
    // 30% Zuschlag für 3-6 SRM
    const surcharge = basePrice * 0.3;
    finalPrice = basePrice + surcharge;
    adjustmentText = '30% Zuschlag je SRM';
    adjustment = surcharge;
    tierName = 'Kleinmenge';
  } else if (quantity >= 7 && quantity < 25) {
    // Normalpreis für 7-24 SRM
    adjustmentText = 'Normalpreis';
    tierName = 'Standard';
  } else if (quantity >= 25 && hasQuantityDiscount) {
    // 2,50€ Rabatt für 25+ SRM (nur wenn Produkt Mengenrabatt aktiviert hat)
    finalPrice = basePrice - 2.5;
    adjustmentText = '€2,50 Rabatt je SRM';
    adjustment = -2.5;
    tierName = 'Mengenrabatt';
  } else if (quantity >= 25 && !hasQuantityDiscount) {
    // Normalpreis für 25+ SRM (wenn kein Mengenrabatt aktiviert)
    adjustmentText = 'Normalpreis';
    tierName = 'Standard';
  }

  return {
    price: Math.max(0, Math.round(finalPrice * 100) / 100), // Auf 2 Dezimalstellen runden
    originalPrice: basePrice,
    adjustment: adjustment,
    adjustmentText,
    tierName: tierName,
    canOrder: true
  };
};

export const getQuantityRangeText = (minQuantity, maxQuantity) => {
  if (maxQuantity) {
    return `${minQuantity}-${maxQuantity} SRM`;
  }
  return `ab ${minQuantity} SRM`;
};

export const getPriceInfoForQuantity = (quantity, pricingTiers = [], minOrderQuantity = 3, hasQuantityDiscount = false, totalCartQuantity = null) => {
  // Verwende Gesamtmenge im Warenkorb für Mindestmengen-Prüfung wenn verfügbar
  const quantityForMinCheck = totalCartQuantity !== null ? totalCartQuantity : quantity;
  
  if (quantityForMinCheck < minOrderQuantity) {
    return {
      info: `Mindestbestellung: ${minOrderQuantity} SRM`,
      color: 'text-red-600',
      canOrder: false
    };
  }

  let color = 'text-gray-600';
  let info = '';
  
  if (quantity >= 3 && quantity <= 6) {
    // 30% Zuschlag für 3-6 SRM
    info = '30% Zuschlag je SRM';
    color = 'text-red-600';
  } else if (quantity >= 7 && quantity < 25) {
    // Normalpreis für 7-24 SRM
    info = 'Normalpreis';
    color = 'text-gray-600';
  } else if (quantity >= 25 && hasQuantityDiscount) {
    // 2,50€ Rabatt für 25+ SRM (nur wenn Produkt Mengenrabatt aktiviert hat)
    info = '€2,50 Rabatt je SRM';
    color = 'text-green-600';
  } else if (quantity >= 25 && !hasQuantityDiscount) {
    // Normalpreis für 25+ SRM (wenn kein Mengenrabatt aktiviert)
    info = 'Normalpreis';
    color = 'text-gray-600';
  }

  return {
    info,
    color,
    canOrder: true
  };
};

// Hilfsfunktion um die Gesamtmenge aller SRM-Artikel im Warenkorb zu berechnen
export const getTotalSRMQuantityInCart = () => {
  if (typeof window === 'undefined') return 0;
  
  try {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    return cart.reduce((total, item) => {
      // Nur SRM-Artikel zählen (unit === 'SRM')
      if (item.unit === 'SRM') {
        return total + (item.quantity || 0);
      }
      return total;
    }, 0);
  } catch (error) {
    console.error('Fehler beim Berechnen der Gesamtmenge im Warenkorb:', error);
    return 0;
  }
};

export const getDeliveryOptions = () => {
  return [
    {
      type: 'standard',
      name: 'Standard-Lieferung',
      price: 43.5,
      duration: '1-3 Wochen'
    },
    {
      type: 'express',
      name: 'Express-Lieferung',
      price: 139.0,
      duration: '24-48 Stunden'
    }
  ];
};
