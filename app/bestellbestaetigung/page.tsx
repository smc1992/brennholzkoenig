'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import OrderConfirmation from './OrderConfirmation';

function OrderConfirmationContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [orderData, setOrderData] = useState<{
    orderNumber: string;
    appliedDiscount?: {
      code: string;
      discountAmount: number;
    };
  } | null>(null);

  useEffect(() => {
    const orderNumber = searchParams.get('order');
    const discountCode = searchParams.get('discount_code');
    const discountAmount = searchParams.get('discount_amount');

    if (!orderNumber) {
      router.push('/');
      return;
    }

    const data: any = { orderNumber };
    
    if (discountCode && discountAmount) {
      data.appliedDiscount = {
        code: discountCode,
        discountAmount: parseFloat(discountAmount)
      };
    }

    setOrderData(data);
  }, [searchParams, router]);

  if (!orderData) {
    return (
      <div className="min-h-screen bg-[#F5F0E0] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 flex items-center justify-center bg-[#C04020] rounded-full mx-auto mb-4 animate-pulse">
            <i className="ri-loader-4-line text-2xl text-white animate-spin"></i>
          </div>
          <p className="text-lg font-medium text-[#1A1A1A]">Bestellbestätigung wird geladen...</p>
        </div>
      </div>
    );
  }

  return <OrderConfirmation {...orderData} />;
}

export default function OrderConfirmationPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#F5F0E0] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 flex items-center justify-center bg-[#C04020] rounded-full mx-auto mb-4 animate-pulse">
            <i className="ri-loader-4-line text-2xl text-white animate-spin"></i>
          </div>
          <p className="text-lg font-medium text-[#1A1A1A]">Lädt...</p>
        </div>
      </div>
    }>
      <OrderConfirmationContent />
    </Suspense>
  );
}