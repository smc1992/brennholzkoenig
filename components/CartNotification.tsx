'use client';

import { useState, useEffect } from 'react';

interface CartNotificationProps {
  isVisible: boolean;
  productName: string;
  quantity: number;
  onClose: () => void;
}

export default function CartNotification({ isVisible, productName, quantity, onClose }: CartNotificationProps) {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onClose();
      }, 4000); // Auto-close after 4 seconds

      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  if (!isVisible) return null;

  return (
    <div className="fixed top-4 right-4 z-50 animate-slide-in-right">
      <div className="bg-white border-l-4 border-green-500 rounded-lg shadow-lg p-4 max-w-sm min-w-[320px]">
        <div className="flex items-start">
          <div className="w-8 h-8 flex items-center justify-center bg-green-500 rounded-full mr-3 flex-shrink-0">
            <i className="ri-check-line text-white text-sm"></i>
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <h4 className="text-sm font-bold text-green-800">
                Zum Warenkorb hinzugefügt!
              </h4>
              <button
                onClick={onClose}
                className="w-5 h-5 flex items-center justify-center text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <i className="ri-close-line text-sm"></i>
              </button>
            </div>
            <p className="text-sm text-gray-700 mb-2">
              <span className="font-medium">{quantity} SRM {productName}</span> wurde erfolgreich hinzugefügt.
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                className="text-xs text-green-600 hover:text-green-800 font-medium cursor-pointer"
              >
                Weiter einkaufen
              </button>
              <span className="text-gray-300">•</span>
              <a
                href="/warenkorb"
                className="text-xs text-green-600 hover:text-green-800 font-medium cursor-pointer"
              >
                Zum Warenkorb
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}