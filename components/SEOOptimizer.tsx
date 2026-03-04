
'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface SEOData {
  meta_title: string;
  meta_description: string;
  focus_keywords: string;
}

interface SEOOptimizerProps {
  title: string;
  content: string;
  seoData: SEOData;
  onChange: (seoData: SEOData) => void;
}

export default function SEOOptimizer({ title, content, seoData, onChange }: SEOOptimizerProps) {
  const [analysis, setAnalysis] = useState({
    titleLength: 0,
    descriptionLength: 0,
    keywordDensity: 0,
    readabilityScore: 0,
    suggestions: [] as string[]
  });

  useEffect(() => {
    analyzeSEO();
  }, [title, content, seoData]);

  const analyzeSEO = () => {
    const titleLength = seoData.meta_title.length;
    const descriptionLength = seoData.meta_description.length;

    // Keyword-Dichte berechnen
    const keywords = seoData.focus_keywords.toLowerCase().split(',').map(k => k.trim()).filter(k => k);
    const contentLower = (title + ' ' + content).toLowerCase();
    const totalWords = contentLower.split(/\s+/).length;

    let keywordCount = 0;
    keywords.forEach(keyword => {
      const regex = new RegExp(keyword, 'gi');
      const matches = contentLower.match(regex);
      keywordCount += matches ? matches.length : 0;
    });

    const keywordDensity = totalWords > 0 ? (keywordCount / totalWords) * 100 : 0;

    // Lesbarkeits-Score (vereinfacht)
    const sentences = content.split(/[.!?]+/).length;
    const avgWordsPerSentence = sentences > 0 ? totalWords / sentences : 0;
    const readabilityScore = Math.max(0, Math.min(100, 100 - (avgWordsPerSentence - 15) * 2));

    // Verbesserungsvorschläge
    const suggestions = [];

    if (titleLength < 30) suggestions.push('Meta-Titel ist zu kurz (mindestens 30 Zeichen)');
    if (titleLength > 60) suggestions.push('Meta-Titel ist zu lang (maximal 60 Zeichen)');
    if (descriptionLength < 120) suggestions.push('Meta-Description ist zu kurz (mindestens 120 Zeichen)');
    if (descriptionLength > 160) suggestions.push('Meta-Description ist zu lang (maximal 160 Zeichen)');
    if (keywordDensity < 0.5) suggestions.push('Keyword-Dichte ist zu niedrig (mindestens 0.5%)');
    if (keywordDensity > 3) suggestions.push('Keyword-Dichte ist zu hoch (maximal 3%)');
    if (!seoData.meta_title.includes(keywords[0])) suggestions.push('Haupt-Keyword sollte im Meta-Titel stehen');
    if (!seoData.meta_description.includes(keywords[0])) suggestions.push('Haupt-Keyword sollte in der Meta-Description stehen');

    setAnalysis({
      titleLength,
      descriptionLength,
      keywordDensity,
      readabilityScore,
      suggestions
    });
  };

  const getScoreColor = (score: number, type: 'length' | 'density' | 'readability') => {
    switch (type) {
      case 'length':
        if (score >= 30 && score <= 60) return 'text-green-600';
        if (score >= 120 && score <= 160) return 'text-green-600';
        return 'text-red-600';
      case 'density':
        if (score >= 0.5 && score <= 3) return 'text-green-600';
        return 'text-red-600';
      case 'readability':
        if (score >= 70) return 'text-green-600';
        if (score >= 50) return 'text-yellow-600';
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const generateMetaTitle = () => {
    const keywords = seoData.focus_keywords.split(',')[0]?.trim();
    const generatedTitle = keywords
      ? `${title} - ${keywords} | Brennholzkönig`
      : `${title} | Brennholzkönig`;

    onChange({
      ...seoData,
      meta_title: generatedTitle.substring(0, 60)
    });
  };

  const generateMetaDescription = () => {
    const keywords = seoData.focus_keywords.split(',')[0]?.trim();
    const contentPreview = content.replace(/<[^>]*>/g, '').substring(0, 100);
    const generatedDescription = keywords
      ? `${contentPreview}... Erfahren Sie mehr über ${keywords} bei Brennholzkönig.`
      : `${contentPreview}... Mehr Informationen bei Brennholzkönig.`;

    onChange({
      ...seoData,
      meta_description: generatedDescription.substring(0, 160)
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center">
          <div className="w-8 h-8 flex items-center justify-center bg-purple-100 rounded-full mr-3">
            <i className="ri-seo-line text-purple-600"></i>
          </div>
          <div>
            <h3 className="text-lg font-bold text-[#1A1A1A]">SEO-Optimierung</h3>
            <p className="text-gray-600">Verbessern Sie die Suchmaschinenoptimierung</p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Focus Keywords */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Focus Keywords
            <span className="text-gray-500 ml-1">(durch Komma getrennt)</span>
          </label>
          <input
            type="text"
            value={seoData.focus_keywords}
            onChange={(e) => onChange({ ...seoData, focus_keywords: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            placeholder="brennholz, kaminholz, feuerholz"
          />
        </div>

        {/* Meta Title */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700">Meta-Titel</label>
            <button
              onClick={generateMetaTitle}
              className="text-sm text-purple-600 hover:text-purple-700 cursor-pointer"
            >
              <i className="ri-magic-line mr-1"></i>
              Automatisch generieren
            </button>
          </div>
          <input
            type="text"
            value={seoData.meta_title}
            onChange={(e) => onChange({ ...seoData, meta_title: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            placeholder="SEO-optimierter Titel für Suchmaschinen"
            maxLength={60}
          />
          <div className="flex items-center justify-between mt-2">
            <span className={`text-sm ${getScoreColor(analysis.titleLength, 'length')}`}>
              {analysis.titleLength}/60 Zeichen
            </span>
            <div className="w-32 bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${
                  analysis.titleLength >= 30 && analysis.titleLength <= 60
                    ? 'bg-green-500'
                    : 'bg-red-500'
                }`}
                style={{ width: `${Math.min(100, (analysis.titleLength / 60) * 100)}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Meta Description */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700">Meta-Description</label>
            <button
              onClick={generateMetaDescription}
              className="text-sm text-purple-600 hover:text-purple-700 cursor-pointer"
            >
              <i className="ri-magic-line mr-1"></i>
              Automatisch generieren
            </button>
          </div>
          <textarea
            value={seoData.meta_description}
            onChange={(e) => onChange({ ...seoData, meta_description: e.target.value })}
            rows={3}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            placeholder="Kurze Beschreibung für Suchmaschinen-Ergebnisse"
            maxLength={160}
          />
          <div className="flex items-center justify-between mt-2">
            <span className={`text-sm ${getScoreColor(analysis.descriptionLength, 'length')}`}>
              {analysis.descriptionLength}/160 Zeichen
            </span>
            <div className="w-32 bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${
                  analysis.descriptionLength >= 120 && analysis.descriptionLength <= 160
                    ? 'bg-green-500'
                    : 'bg-red-500'
                }`}
                style={{ width: `${Math.min(100, (analysis.descriptionLength / 160) * 100)}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* SEO Analysis */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-medium text-gray-800 mb-3">SEO-Analyse</h4>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="text-center">
              <div className={`text-2xl font-bold ${getScoreColor(analysis.keywordDensity, 'density')}`}>
                {analysis.keywordDensity.toFixed(1)}%
              </div>
              <div className="text-sm text-gray-600">Keyword-Dichte</div>
            </div>

            <div className="text-center">
              <div className={`text-2xl font-bold ${getScoreColor(analysis.readabilityScore, 'readability')}`}>
                {Math.round(analysis.readabilityScore)}
              </div>
              <div className="text-sm text-gray-600">Lesbarkeit</div>
            </div>

            <div className="text-center">
              <div
                className={`text-2xl font-bold ${
                  analysis.suggestions.length === 0 ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {analysis.suggestions.length}
              </div>
              <div className="text-sm text-gray-600">Verbesserungen</div>
            </div>
          </div>

          {/* Suggestions */}
          {analysis.suggestions.length > 0 && (
            <div>
              <h5 className="font-medium text-gray-800 mb-2">Verbesserungsvorschläge:</h5>
              <ul className="space-y-1">
                {analysis.suggestions.map((suggestion, index) => (
                  <li key={index} className="flex items-start text-sm text-gray-600">
                    <i className="ri-information-line text-blue-500 mr-2 mt-0.5 flex-shrink-0"></i>
                    {suggestion}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {analysis.suggestions.length === 0 && (
            <div className="text-center text-green-600">
              <i className="ri-check-line text-2xl mb-2"></i>
              <p className="text-sm font-medium">Alle SEO-Kriterien erfüllt!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
