'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface LoyaltyMember {
  id: string;
  customer_id: string;
  tier: string;
  points_balance: number;
  total_earned: number;
  total_redeemed: number;
}

interface PointsRedemptionProps {
  customerId: string;
  orderTotal: number;
  onPointsApplied: (pointsUsed: number, discount: number) => void;
  onPointsRemoved: () => void;
}

export default function PointsRedemption({ 
  customerId, 
  orderTotal, 
  onPointsApplied, 
  onPointsRemoved 
}: PointsRedemptionProps) {
  const [loyaltyData, setLoyaltyData] = useState<LoyaltyMember | null>(null);
  const [pointsToUse, setPointsToUse] = useState(0);
  const [isApplied, setIsApplied] = useState(false);
  const [loading, setLoading] = useState(true);

  // Conversion rate: 100 points = 1 EUR
  const POINTS_TO_EURO_RATE = 100;
  const MIN_REDEMPTION_POINTS = 100;

  useEffect(() => {
    fetchLoyaltyData();
  }, [customerId]);

  const fetchLoyaltyData = async () => {
    try {
      const { data: loyaltyData } = await supabase
        .from('loyalty_members')
        .select('*')
        .eq('customer_id', customerId)
        .single();

      if (loyaltyData) {
        setLoyaltyData(loyaltyData as LoyaltyMember);
      }
    } catch (error) {
      console.error('Fehler beim Laden der Loyalty-Daten:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateDiscount = (points: number) => {
    return points / POINTS_TO_EURO_RATE;
  };

  const getMaxUsablePoints = () => {
    if (!loyaltyData) return 0;
    
    // Maximum points that can be used (up to 50% of order total)
    const maxDiscountAmount = orderTotal * 0.5;
    const maxPointsForDiscount = maxDiscountAmount * POINTS_TO_EURO_RATE;
    
    return Math.min(loyaltyData.points_balance, maxPointsForDiscount);
  };

  const handleApplyPoints = () => {
    if (pointsToUse < MIN_REDEMPTION_POINTS) return;
    
    const discount = calculateDiscount(pointsToUse);
    setIsApplied(true);
    onPointsApplied(pointsToUse, discount);
  };

  const handleRemovePoints = () => {
    setIsApplied(false);
    setPointsToUse(0);
    onPointsRemoved();
  };

  const handlePointsChange = (value: number) => {
    const maxPoints = getMaxUsablePoints();
    const validPoints = Math.max(0, Math.min(value, maxPoints));
    setPointsToUse(validPoints);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-10 bg-gray-200 rounded mb-4"></div>
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
        </div>
      </div>
    );
  }

  if (!loyaltyData || loyaltyData.points_balance < MIN_REDEMPTION_POINTS) {
    return (
      <div className="bg-gray-50 rounded-lg border border-gray-200 p-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center">
            <i className="ri-medal-line text-gray-400"></i>
          </div>
          <div>
            <h3 className="font-medium text-gray-900">Treuepunkte</h3>
            <p className="text-sm text-gray-500">
              {loyaltyData 
                ? `Sie haben ${loyaltyData.points_balance} Punkte (Mindestens ${MIN_REDEMPTION_POINTS} erforderlich)`
                : 'Nicht verfügbar'
              }
            </p>
          </div>
        </div>
      </div>
    );
  }

  const maxUsablePoints = getMaxUsablePoints();
  const currentDiscount = calculateDiscount(pointsToUse);

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
            <i className="ri-medal-line text-orange-600"></i>
          </div>
          <div>
            <h3 className="font-medium text-gray-900">Treuepunkte einlösen</h3>
            <p className="text-sm text-gray-500">
              Verfügbar: {loyaltyData.points_balance} Punkte
            </p>
          </div>
        </div>
        {isApplied && (
          <button
            onClick={handleRemovePoints}
            className="text-red-600 hover:text-red-700 text-sm font-medium"
          >
            Entfernen
          </button>
        )}
      </div>

      {!isApplied ? (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Punkte verwenden (100 Punkte = 1€)
            </label>
            <div className="flex items-center space-x-3">
              <input
                type="number"
                min={MIN_REDEMPTION_POINTS}
                max={maxUsablePoints}
                step={100}
                value={pointsToUse}
                onChange={(e) => handlePointsChange(parseInt(e.target.value) || 0)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                placeholder={`Min. ${MIN_REDEMPTION_POINTS}`}
              />
              <button
                onClick={() => handlePointsChange(maxUsablePoints)}
                className="px-3 py-2 text-sm text-orange-600 hover:text-orange-700 font-medium"
              >
                Maximum
              </button>
            </div>
            <div className="flex justify-between text-sm text-gray-500 mt-1">
              <span>Min: {MIN_REDEMPTION_POINTS} Punkte</span>
              <span>Max: {maxUsablePoints} Punkte</span>
            </div>
          </div>

          {pointsToUse > 0 && (
            <div className="bg-orange-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Rabatt:</span>
                <span className="font-medium text-orange-600">
                  -{currentDiscount.toFixed(2)}€
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Verwendete Punkte:</span>
                <span className="font-medium text-gray-900">{pointsToUse}</span>
              </div>
            </div>
          )}

          <button
            onClick={handleApplyPoints}
            disabled={pointsToUse < MIN_REDEMPTION_POINTS}
            className="w-full px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {pointsToUse < MIN_REDEMPTION_POINTS 
              ? `Mindestens ${MIN_REDEMPTION_POINTS} Punkte erforderlich`
              : `${pointsToUse} Punkte einlösen (-${currentDiscount.toFixed(2)}€)`
            }
          </button>

          <div className="text-xs text-gray-500 space-y-1">
            <p>• 100 Punkte = 1€ Rabatt</p>
            <p>• Maximal 50% des Bestellwerts einlösbar</p>
            <p>• Mindesteinlösung: {MIN_REDEMPTION_POINTS} Punkte</p>
          </div>
        </div>
      ) : (
        <div className="bg-green-50 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <i className="ri-check-line text-green-600"></i>
            </div>
            <div className="flex-1">
              <p className="font-medium text-green-900">
                {pointsToUse} Punkte angewendet
              </p>
              <p className="text-sm text-green-700">
                Rabatt: -{currentDiscount.toFixed(2)}€
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}