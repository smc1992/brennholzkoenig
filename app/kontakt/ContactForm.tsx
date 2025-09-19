
'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { trackContact, trackQuoteRequest } from '@/components/GoogleAnalytics';

interface ContactFormData {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  product: string;
}

export default function ContactForm() {
  const router = useRouter();
  const [formData, setFormData] = useState<ContactFormData>({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
    product: 'Allgemeine Anfrage'
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'success' | 'error' | ''>('');
  const [emailError, setEmailError] = useState('');
  const [isVisible, setIsVisible] = useState(false);
  const formRef = useRef<HTMLDivElement>(null);

  // Intersection Observer für Animation
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    if (formRef.current) {
      observer.observe(formRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // E-Mail-Validierung
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const email = e.target.value;
    setFormData(prev => ({ ...prev, email }));
    
    if (email && !validateEmail(email)) {
      setEmailError('Bitte geben Sie eine gültige E-Mail-Adresse ein');
    } else {
      setEmailError('');
    }
  };

  // E-Mail-Template erstellen
  const createEmailTemplate = (data: ContactFormData): string => {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Neue Kontaktanfrage - Brennholzkönig</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #C04020; color: white; padding: 20px; text-align: center; }
        .content { background: #f9f9f9; padding: 20px; }
        .field { margin-bottom: 15px; }
        .label { font-weight: bold; color: #C04020; }
        .value { margin-top: 5px; }
        .footer { background: #333; color: white; padding: 15px; text-align: center; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔥 Neue Kontaktanfrage</h1>
            <p>Brennholzkönig - Premium Brennholz</p>
        </div>
        <div class="content">
            <div class="field">
                <div class="label">Name:</div>
                <div class="value">${data.name}</div>
            </div>
            <div class="field">
                <div class="label">E-Mail:</div>
                <div class="value">${data.email}</div>
            </div>
            <div class="field">
                <div class="label">Telefon:</div>
                <div class="value">${data.phone || 'Nicht angegeben'}</div>
            </div>
            <div class="field">
                <div class="label">Produktkategorie:</div>
                <div class="value">${data.product}</div>
            </div>
            <div class="field">
                <div class="label">Betreff Details:</div>
                <div class="value">${data.subject || 'Nicht angegeben'}</div>
            </div>
            <div class="field">
                <div class="label">Nachricht:</div>
                <div class="value">${data.message}</div>
            </div>
            <div class="field">
                <div class="label">Eingegangen am:</div>
                <div class="value">${new Date().toLocaleString('de-DE')}</div>
            </div>
        </div>
        <div class="footer">
            <p>Diese E-Mail wurde automatisch über das Kontaktformular auf brennholz-koenig.de generiert.</p>
        </div>
    </div>
</body>
</html>
    `.trim();
  };

  // Submit-Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmitting) return;
    
    // Validierung
    if (!formData.name.trim() || !formData.email.trim() || !formData.message.trim()) {
      setSubmitStatus('error');
      return;
    }
    
    if (!validateEmail(formData.email)) {
      setEmailError('Bitte geben Sie eine gültige E-Mail-Adresse ein');
      return;
    }
    
    setIsSubmitting(true);
    setSubmitStatus('');
    
    try {
      // 1. Kontaktanfrage in Supabase speichern
      const { data: contactData, error: contactError } = await supabase
        .from('contact_requests')
        .insert([{
          name: formData.name.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim() || null,
          subject: formData.subject.trim() || null,
          message: formData.message.trim(),
          product: formData.product,
          status: 'new',
          created_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (contactError) {
        console.error('Fehler beim Speichern der Kontaktanfrage:', contactError);
        throw new Error('Fehler beim Speichern der Kontaktanfrage');
      }

      // 2. E-Mail senden und Analytics parallel ausführen
      const emailHtml = createEmailTemplate(formData);
      
      const [emailResult, analyticsResult] = await Promise.allSettled([
        // E-Mail senden
        fetch('/api/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: 'info@brennholz-koenig.de',
            subject: `Neue Kontaktanfrage: ${formData.product} - ${formData.name}`,
            html: emailHtml,
            replyTo: formData.email,
            type: 'contact_form'
          })
        }),
        
        // Analytics Event (optional)
        supabase.from('analytics_events').insert([{
          event_type: 'contact_form_submission',
          event_data: {
            product: formData.product,
            has_phone: !!formData.phone,
            has_subject: !!formData.subject,
            message_length: formData.message.length
          },
          created_at: new Date().toISOString()
        }])
      ]);

      // E-Mail-Ergebnis prüfen
      if (emailResult.status === 'fulfilled') {
        const emailResponse = await emailResult.value.json();
        if (!emailResponse.success) {
          throw new Error(emailResponse.message || 'E-Mail konnte nicht gesendet werden');
        }
        console.log('E-Mail erfolgreich versendet:', emailResponse);
      } else {
        console.error('E-Mail-Fehler:', emailResult.reason);
        throw new Error('E-Mail konnte nicht gesendet werden');
      }

      // Analytics-Fehler nur loggen, nicht blockieren
      if (analyticsResult.status === 'rejected') {
        console.warn('Analytics-Event konnte nicht gespeichert werden:', analyticsResult.reason);
      }

      // Google Analytics Event tracken
      trackContact('contact_form', 'website');

      // Track quote request if it's a product or price inquiry
      if (['Preise', 'Kaminholz', 'Brennholz', 'Anzündholz', 'Holzbriketts', 'Lieferung'].includes(formData.product)) {
        trackQuoteRequest(formData.product, 1, 'contact_form');
      }

      // Erfolg - zur Bestätigungsseite navigieren
      router.push('/kontakt/bestaetigung');
      
    } catch (error: any) {
      console.error('Fehler beim Absenden:', error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section 
      ref={formRef}
      className={`py-16 bg-gradient-to-br from-amber-50 to-orange-50 transition-all duration-1000 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      }`}
    >
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-amber-100">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Kontaktieren Sie uns
              </h2>
              <p className="text-gray-600">
                Haben Sie Fragen zu unserem Premium Brennholz? Wir helfen Ihnen gerne weiter!
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Name */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Name *
                </label>
                <input
                  type="text"
                  id="name"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-colors"
                  placeholder="Ihr vollständiger Name"
                />
              </div>

              {/* E-Mail */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  E-Mail-Adresse *
                </label>
                <input
                  type="email"
                  id="email"
                  required
                  value={formData.email}
                  onChange={handleEmailChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-colors ${
                    emailError ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="ihre.email@beispiel.de"
                />
                {emailError && (
                  <p className="mt-1 text-sm text-red-600">{emailError}</p>
                )}
              </div>

              {/* Telefon */}
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                  Telefonnummer (optional)
                </label>
                <input
                  type="tel"
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-colors"
                  placeholder="+49 123 456789"
                />
              </div>

              {/* Produktkategorie */}
              <div>
                <label htmlFor="product" className="block text-sm font-medium text-gray-700 mb-2">
                  Produktkategorie
                </label>
                <select
                  id="product"
                  value={formData.product}
                  onChange={(e) => setFormData(prev => ({ ...prev, product: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-colors"
                >
                  <option value="Allgemeine Anfrage">Allgemeine Anfrage</option>
                  <option value="Kaminholz">Kaminholz</option>
                  <option value="Brennholz">Brennholz</option>
                  <option value="Anzündholz">Anzündholz</option>
                  <option value="Holzbriketts">Holzbriketts</option>
                  <option value="Lieferung">Lieferung</option>
                  <option value="Preise">Preise</option>
                  <option value="Sonstiges">Sonstiges</option>
                </select>
              </div>

              {/* Betreff Details */}
              <div>
                <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                  Betreff Details (optional)
                </label>
                <input
                  type="text"
                  id="subject"
                  value={formData.subject}
                  onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-colors"
                  placeholder="Kurze Beschreibung Ihres Anliegens"
                />
              </div>

              {/* Nachricht */}
              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                  Ihre Nachricht *
                </label>
                <textarea
                  id="message"
                  required
                  rows={5}
                  value={formData.message}
                  onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-colors resize-vertical"
                  placeholder="Beschreiben Sie Ihr Anliegen ausführlich..."
                />
              </div>

              {/* Status-Meldungen */}
              {submitStatus === 'error' && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-800">
                    Es ist ein Fehler aufgetreten. Bitte versuchen Sie es erneut oder kontaktieren Sie uns direkt.
                  </p>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting || !!emailError}
                className={`w-full py-4 px-6 rounded-lg font-semibold text-white transition-all duration-300 ${
                  isSubmitting || emailError
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 transform hover:scale-[1.02] shadow-lg hover:shadow-xl'
                }`}
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Wird gesendet...
                  </span>
                ) : (
                  'Nachricht senden'
                )}
              </button>

              {/* Datenschutz-Hinweis */}
              <p className="text-xs text-gray-500 text-center">
                Mit dem Absenden stimmen Sie unserer{' '}
                <a href="/datenschutz" className="text-amber-600 hover:text-amber-700 underline">
                  Datenschutzerklärung
                </a>{' '}
                zu. Ihre Daten werden vertraulich behandelt.
              </p>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
