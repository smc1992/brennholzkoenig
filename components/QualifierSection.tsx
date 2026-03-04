'use client';

import React from 'react';

interface QualifierSectionProps {
  badgeText?: string;
  title?: string;
  description?: string;
  suitableFor?: string[];
  notSuitableFor?: string[];
  imageUrl?: string;
}

export default function QualifierSection({
  badgeText,
  title,
  description,
  suitableFor = [],
  notSuitableFor = [],
  imageUrl
}: QualifierSectionProps) {
  const normalize = (list: any[]): string[] => {
    if (!Array.isArray(list)) return [];
    return list.map((item: any) => {
      if (typeof item === 'string') return item;
      if (item && typeof item === 'object') {
        return item.title ?? item.name ?? item.description ?? '';
      }
      return String(item ?? '');
    }).filter(Boolean);
  };

  const safeSuitable = normalize(suitableFor);
  const safeNotSuitable = normalize(notSuitableFor);

  if (!title && !description && safeSuitable.length === 0 && safeNotSuitable.length === 0) {
    return null;
  }

  return (
    <section className="py-16 px-4 bg-gradient-to-b from-white to-wood-50">
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

        <div className="grid lg:grid-cols-2 gap-10 items-start">
          <div className="space-y-8">
            {safeSuitable.length > 0 && (
              <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
                <h3 className="text-xl font-bold text-primary-700 mb-4">Geeignet für</h3>
                <ul className="space-y-3">
                  {safeSuitable.map((item, idx) => (
                    <li key={idx} className="flex items-start">
                      <span className="mr-2 text-green-600">●</span>
                      <span className="text-wood-800">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {safeNotSuitable.length > 0 && (
              <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
                <h3 className="text-xl font-bold text-primary-700 mb-4">Nicht geeignet für</h3>
                <ul className="space-y-3">
                  {safeNotSuitable.map((item, idx) => (
                    <li key={idx} className="flex items-start">
                      <span className="mr-2 text-red-600">●</span>
                      <span className="text-wood-800">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="relative">
            {imageUrl ? (
              <div className="relative overflow-hidden rounded-2xl shadow-lg">
                <img src={imageUrl} alt="Qualität" className="w-full h-96 object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
              </div>
            ) : (
              <div className="bg-wood-100 rounded-2xl shadow-lg h-96 flex items-center justify-center">
                <div className="text-center text-gray-600">
                  <svg className="w-16 h-16 mx-auto mb-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 2a8 8 0 100 16 8 8 0 000-16zm3 5l-4 6-2-2" clipRule="evenodd" />
                  </svg>
                  <p className="font-semibold">Qualitätsabbildung</p>
                  <p className="text-sm">Bild kann im Admin gesetzt werden</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

