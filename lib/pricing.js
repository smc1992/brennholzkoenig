
// Zentrale Preiskalkulations-Logik für Frontend und Backend

export const calculatePriceWithTiers = (basePrice, quantity, pricingTiers = [], minOrderQuantity = 3) => {
  // Mindestbestellmenge prüfen
  if (quantity < minOrderQuantity) {
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
  
  if (quantity >= 3 && quantity <= 5) {
    // 30% Zuschlag für 3-5 SRM
    const surcharge = basePrice * 0.3;
    finalPrice = basePrice + surcharge;
    adjustmentText = '30% Zuschlag je SRM';
    adjustment = surcharge;
    tierName = 'Kleinmenge';
  } else if (quantity >= 6 && quantity < 25) {
    // Normalpreis für 6-24 SRM
    adjustmentText = 'Normalpreis';
    tierName = 'Standard';
  } else if (quantity >= 25) {
    // 2,50€ Rabatt für 25+ SRM
    finalPrice = basePrice - 2.5;
    adjustmentText = '€2,50 Rabatt je SRM';
    adjustment = -2.5;
    tierName = 'Mengenrabatt';
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

export const getPriceInfoForQuantity = (quantity, pricingTiers = [], minOrderQuantity = 3) => {
  if (quantity < minOrderQuantity) {
    return {
      info: `Mindestbestellung: ${minOrderQuantity} SRM`,
      color: 'text-red-600',
      canOrder: false
    };
  }

  let color = 'text-gray-600';
  let info = '';
  
  if (quantity >= 3 && quantity <= 5) {
    // 30% Zuschlag für 3-5 SRM
    info = '30% Zuschlag je SRM';
    color = 'text-red-600';
  } else if (quantity >= 6 && quantity < 25) {
    // Normalpreis für 6-24 SRM
    info = 'Normalpreis';
    color = 'text-gray-600';
  } else if (quantity >= 25) {
    // 2,50€ Rabatt für 25+ SRM
    info = '€2,50 Rabatt je SRM';
    color = 'text-green-600';
  }

  return {
    info,
    color,
    canOrder: true
  };
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
