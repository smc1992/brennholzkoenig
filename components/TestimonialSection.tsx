'use client';

import React from 'react';

interface ReviewItem {
  name: string;
  initials?: string;
  role?: string;
  order_info?: string;
  rating: number;
  text: string;
  date?: string;
  verified?: boolean;
}

interface TestimonialSectionProps {
  badgeText?: string;
  title?: string;
  description?: string;
  imageUrl?: string;
  reviews?: ReviewItem[];
}

export default function TestimonialSection({
  badgeText,
  title,
  description,
  imageUrl,
  reviews = []
}: TestimonialSectionProps) {
  if (!title && !description && reviews.length === 0) {
    return null;
  }

  const renderStars = (count: number) => {
    const n = Math.max(0, Math.min(5, Math.round(count)));
    return (
      <div className="flex items-center">
        {Array.from({ length: 5 }).map((_, i) => (
          <svg key={i} className={`w-4 h-4 ${i < n ? 'text-yellow-500' : 'text-gray-300'}`} viewBox="0 0 20 20" fill="currentColor">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.176 0l-2.8 2.034c-.785.57-1.84-.197-1.54-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.88 8.72c-.783-.57-.38-1.81.588-1.81h3.462a1 1 0 00.95-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
    );
  };

  return (
    <section className="py-16 px-4 bg-wood-50">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          {badgeText && (
            <span className="inline-block bg-primary-600 text-white px-3 py-1 rounded-full text-sm font-semibold mb-4">
              {badgeText}
            </span>
          )}
          {title && (
            <h2 className="text-3xl md:text-4xl font-bold text-primary-700 mb-4">
              {title}
            </h2>
          )}
          {description && (
            <p className="text-lg text-wood-800 max-w-3xl mx-auto">
              {description}
            </p>
          )}
        </div>

        <div className="grid lg:grid-cols-3 gap-8 items-start">
          <div className="lg:col-span-1">
            {imageUrl ? (
              <div className="relative overflow-hidden rounded-2xl shadow-lg">
                <img src={imageUrl} alt="Bewertungen" className="w-full h-80 object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-lg h-80 flex items-center justify-center border border-gray-200">
                <div className="text-center text-gray-600">
                  <svg className="w-16 h-16 mx-auto mb-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M4 4a3 3 0 013-3h6a3 3 0 013 3v12a3 3 0 01-3 3H7a3 3 0 01-3-3V4zm3 3h6v2H7V7zm0 4h6v2H7v-2z" />
                  </svg>
                  <p className="font-semibold">Bewertungsbild</p>
                  <p className="text-sm">Bild kann im Admin gesetzt werden</p>
                </div>
              </div>
            )}
          </div>

          <div className="lg:col-span-2">
            <div className="grid md:grid-cols-2 gap-6">
              {reviews.slice(0, 6).map((rev, idx) => (
                <div key={idx} className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="text-primary-700 font-semibold">
                        {rev.name}
                      </div>
                      {rev.role && (
                        <div className="text-gray-600 text-sm">
                          {rev.role}
                        </div>
                      )}
                    </div>
                    {renderStars(rev.rating)}
                  </div>
                  <p className="text-wood-800 text-sm leading-relaxed mb-3">
                    {rev.text}
                  </p>
                  <div className="flex items-center justify-between text-xs text-gray-600">
                    <div>
                      {rev.order_info && <span className="mr-2">{rev.order_info}</span>}
                      {rev.date && <span>{rev.date}</span>}
                    </div>
                    {rev.verified && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full bg-green-100 text-green-700">
                        Verifiziert
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

