
'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';

// Using the centralized Supabase client from lib/supabase.ts

export default function ContactForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
    product: 'Allgemeine Anfrage'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState('');
  const [emailError, setEmailError] = useState('');
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.2 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // Robuste E-Mail-Validierung
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const strictEmailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

    if (!email || email.trim() === '') return false;
    if (email.length < 5 || email.length > 254) return false;
    if (!email.includes('@') || !email.includes('.')) return false;

    const parts = email.split('@');
    if (parts.length !== 2) return false;

    const [localPart, domainPart] = parts;
    if (!localPart || !domainPart) return false;
    if (localPart.length > 64) return false;

    const domainParts = domainPart.split('.');
    if (domainParts.length < 2) return false;
    if (domainParts.some(part => !part || part.length === 0)) return false;

    return emailRegex.test(email) && strictEmailRegex.test(email);
  };

  // Überprüfung auf existierendes Konto
  const checkExistingAccount = async (email: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('id')
        .eq('email', email.toLowerCase().trim())
        .limit(1);

      if (error) {
        console.error('Fehler bei Kontoprüfung:', error);
        return false;
      }

      return data && data.length > 0;
    } catch (error) {
      console.error('Fehler bei Kontoprüfung:', error);
      return false;
    }
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const email = e.target.value;
    setFormData(prev => ({ ...prev, email }));
    setEmailError('');

    if (email.trim() !== '') {
      if (!validateEmail(email)) {
        setEmailError('Bitte geben Sie eine gültige E-Mail-Adresse ein (z.B. name@domain.de)');
        return;
      }
    }
  };

  // E-Mail HTML-Template erstellen
  const createEmailTemplate = (data: typeof formData): string => {
    const currentDate = new Date().toLocaleDateString('de-DE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    return `
    <!DOCTYPE html>
    <html lang="de">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Neue Kontaktanfrage - Brennholzkönig</title>
        <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; background-color: #f5f5f5; margin: 0; padding: 20px; }
            .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 8px 32px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #C04020, #A03318); color: white; padding: 30px; text-align: center; }
            .header h1 { margin: 0; font-size: 28px; font-weight: bold; }
            .header p { margin: 10px 0 0; opacity: 0.9; font-size: 16px; }
            .content { padding: 30px; }
            .field-group { margin-bottom: 25px; border-left: 4px solid #D4A520; padding-left: 15px; background: #fafafa; padding: 15px; border-radius: 8px; }
            .field-label { font-weight: bold; color: #C04020; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 5px; }
            .field-value { font-size: 16px; color: #333; word-wrap: break-word; }
            .message-field { background: #f0f8ff; border: 1px solid #e0e8f0; border-radius: 8px; padding: 20px; margin: 20px 0; }
            .priority-high { border-left-color: #C04020; background: #fff5f5; }
            .footer { background: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #eee; }
            .footer p { margin: 5px 0; color: #666; font-size: 14px; }
            .timestamp { color: #888; font-size: 12px; font-style: italic; }
            .logo { font-family: "Pacifico", serif; font-size: 24px; color: #D4A520; margin-bottom: 10px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">Brennholzkönig</div>
                <h1> Neue Kontaktanfrage</h1>
                <p>Eine neue Kundenanfrage ist eingegangen</p>
            </div>
            
            <div class="content">
                <div class="field-group priority-high">
                    <div class="field-label"> Kontaktdaten</div>
                    <div class="field-value">
                        <strong>Name:</strong> ${data.name}<br>
                        <strong>E-Mail:</strong> <a href="mailto:${data.email}">${data.email}</a><br>
                        ${data.phone ? `<strong>Telefon:</strong> <a href="tel:${data.phone}">${data.phone}</a><br>` : ''}
                    </div>
                </div>

                <div class="field-group">
                    <div class="field-label"> Betreff & Kategorie</div>
                    <div class="field-value">
                        <strong>Produktkategorie:</strong> ${data.product}<br>
                        ${data.subject ? `<strong>Betreff Details:</strong> ${data.subject}<br>` : ''}
                    </div>
                </div>

                <div class="field-group message-field">
                    <div class="field-label"> Nachricht</div>
                    <div class="field-value">${data.message.replace(/\\n/g, '<br>')}</div>
                </div>

                <div class="field-group">
                    <div class="field-label"> Eingangsdatum</div>
                    <div class="field-value timestamp">${currentDate}</div>
                </div>
            </div>

            <div class="footer">
                <p><strong>Brennholzkönig - Premium Brennholz</strong></p>
                <p> Für Rückfragen: <a href="tel:${data.phone || '+49 176 71085234'}">${data.phone || '+49 176 71085234'}</a></p>
                <p> Antworten Sie direkt auf diese E-Mail: <a href="mailto:${data.email}">${data.email}</a></p>
                <p class="timestamp">Automatisch generiert am ${currentDate}</p>
            </div>
        </div>
    </body>
    </html>
    `;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('');
    setEmailError('');

    // Finale Validierung
    if (!validateEmail(formData.email)) {
      setEmailError('Bitte geben Sie eine gültige E-Mail-Adresse ein');
      setIsSubmitting(false);
      return;
    }

    const accountExists = await checkExistingAccount(formData.email);
    if (accountExists) {
      setEmailError('Diese E-Mail-Adresse ist bereits registriert');
      setIsSubmitting(false);
      return;
    }

    try {
      // E-Mail-Template erstellen
      const emailHtml = createEmailTemplate(formData);
      const plainText = `
Neue Kontaktanfrage - Brennholzkönig

Name: ${formData.name}
E-Mail: ${formData.email}
Telefon: ${formData.phone || 'Nicht angegeben'}
Produktkategorie: ${formData.product}
Betreff Details: ${formData.subject || 'Nicht angegeben'}

Nachricht:
${formData.message}

Eingegangen am: ${new Date().toLocaleString('de-DE')}
      `.trim();

      // E-Mail an Geschäftsleitung senden
      const { data, error } = await supabase.functions.invoke('send-email', {
        body: {
          to: 'info@brennholz-koenig.de',
          subject: ` Neue Kontaktanfrage: ${formData.product} - ${formData.name}`,
          html: emailHtml,
          text: plainText,
          type: 'contact_form'
        }
      });

      if (error) {
        console.error('E-Mail-Versand-Fehler:', error);
        throw new Error('E-Mail konnte nicht gesendet werden. Bitte versuchen Sie es später erneut.');
      }

      console.log('E-Mail erfolgreich gesendet:', data);

      // Erfolgsmeldung anzeigen
      setSubmitStatus('success');
      setFormData({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: '',
        product: 'Allgemeine Anfrage'
      });

      // Analytics Event
      await supabase
        .from('analytics_events')
        .insert({
          event_type: 'contact_form_submitted',
          event_data: {
            product_category: formData.product,
            has_phone: !!formData.phone,
            message_length: formData.message.length,
            timestamp: new Date().toISOString()
          },
          user_id: null,
          session_id: null
        });

    } catch (error) {
      console.error('Formular-Fehler:', error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  return (
    <section ref={sectionRef} className="py-8 sm:py-12 lg:py-16 bg-gradient-to-br from-[#F5F0E0] to-white overflow-hidden">
      <div className="w-full max-w-full px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto lg:mx-0 w-full">
          {/* Premium Badge */}
          <div className={`inline-flex items-center bg-[#D4A520] text-[#1A1A1A] px-3 sm:px-4 py-2 rounded-full font-bold text-xs sm:text-sm mb-4 sm:mb-6 transition-all duration-1000 transform ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}>
            <i className="ri-fire-line mr-2 flex-shrink-0"></i>
            <span className="whitespace-nowrap">70% HÖHERER HEIZWERT GARANTIERT</span>
          </div>

          <h2 className={`text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-[#1A1A1A] mb-3 sm:mb-4 transition-all duration-1000 delay-200 transform ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'} leading-tight`} style={{ fontFamily: 'Inter, Arial, sans-serif' }}>
            NACHRICHT <span className="text-[#C04020]">SENDEN</span>
          </h2>

          <p className={`text-sm sm:text-base lg:text-lg text-gray-700 mb-6 sm:mb-8 transition-all duration-1000 delay-400 transform ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`} style={{ fontFamily: 'Inter, Arial, sans-serif' }}>
            Lassen Sie sich von unseren Brennholz-Experten beraten. <strong>Kostenlos und unverbindlich!</strong>
          </p>

          {/* Erfolgsmeldung */}
          {submitStatus === 'success' && (
            <div className="bg-gradient-to-r from-[#F5F0E0] to-[#F0E8D0] border border-[#D4A520] text-[#1A1A1A] px-4 sm:px-6 py-4 rounded-xl mb-6 sm:mb-8 shadow-lg">
              <div className="flex items-center">
                <div className="w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center bg-[#D4A520] rounded-full mr-3 flex-shrink-0">
                  <i className="ri-check-line text-white text-sm sm:text-base"></i>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-sm sm:text-base">Nachricht erfolgreich gesendet!</p>
                  <p className="text-xs sm:text-sm">Wir melden uns innerhalb von 24 Stunden bei Ihnen. Ihre Anfrage wurde an info@brennholz-koenig.de weitergeleitet.</p>
                </div>
              </div>
            </div>
          )}

          {/* Fehlermeldung */}
          {submitStatus === 'error' && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 sm:px-6 py-4 rounded-xl mb-6 sm:mb-8">
              <div className="flex items-center">
                <div className="w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center bg-red-500 rounded-full mr-3 flex-shrink-0">
                  <i className="ri-error-warning-line text-white text-sm sm:text-base"></i>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-sm sm:text-base">Fehler beim Senden</p>
                  <p className="text-xs sm:text-sm">Bitte versuchen Sie es später erneut oder rufen Sie uns direkt an.</p>
                </div>
              </div>
            </div>
          )}

          <div className={`bg-white rounded-2xl shadow-2xl p-4 sm:p-6 lg:p-8 transition-all duration-1000 delay-600 transform ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}>
            <form id="contact-form" onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                <div className="transition-all duration-300">
                  <label htmlFor="name" className="block text-sm font-bold text-gray-800 mb-2">
                    Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full px-3 sm:px-4 py-3 sm:py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#C04020] focus:border-[#C04020] transition-all duration-300 text-sm font-medium hover:border-[#D4A520]"
                    placeholder="Ihr vollständiger Name"
                  />
                </div>
                <div className="transition-all duration-300">
                  <label htmlFor="email" className="block text-sm font-bold text-gray-800 mb-2">
                    E-Mail *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleEmailChange}
                    required
                    className={`w-full px-3 sm:px-4 py-3 sm:py-4 border-2 rounded-xl focus:ring-2 focus:ring-[#C04020] transition-all duration-300 text-sm font-medium hover:border-[#D4A520] ${emailError ? 'border-red-500 focus:border-red-500' : 'border-gray-200 focus:border-[#C04020]'}`}
                    placeholder="ihre@email.de"
                  />
                  {emailError && (
                    <div className="mt-2 flex items-start space-x-2">
                      <i className="ri-error-warning-line text-red-500 text-sm mt-0.5 flex-shrink-0"></i>
                      <p className="text-red-600 text-sm font-medium">{emailError}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                <div className="transition-all duration-300">
                  <label htmlFor="phone" className="block text-sm font-bold text-gray-800 mb-2">
                    Telefon
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full px-3 sm:px-4 py-3 sm:py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#C04020] focus:border-[#C04020] transition-all duration-300 text-sm font-medium hover:border-[#D4A520]"
                    placeholder="+49 176 71085234"
                  />
                </div>
                <div className="transition-all duration-300">
                  <label htmlFor="product" className="block text-sm font-bold text-gray-800 mb-2">
                    Betreff
                  </label>
                  <select
                    id="product"
                    name="product"
                    value={formData.product}
                    onChange={handleChange}
                    className="w-full px-3 sm:px-4 py-3 sm:py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#C04020] focus:border-[#C04020] transition-all duration-300 text-sm font-medium pr-8 cursor-pointer hover:border-[#D4A520]"
                  >
                    <option value="Allgemeine Anfrage">Allgemeine Anfrage</option>
                    <option value="Kaminholz Buche">Kaminholz Buche - Premium</option>
                    <option value="Ofenholz Eiche">Ofenholz Eiche - Extra Stark</option>
                    <option value="Brennholz Mix">Brennholz Mix - Bestseller</option>
                    <option value="Anzündholz">Anzündholz - Trocken</option>
                    <option value="Holzbriketts">Holzbriketts - Langbrenner</option>
                    <option value="Premium Pellets">Premium Pellets</option>
                    <option value="Lieferung & Preise">Lieferung & Preise</option>
                    <option value="Beratung">Persönliche Beratung</option>
                  </select>
                </div>
              </div>

              <div className="transition-all duration-300">
                <label htmlFor="subject" className="block text-sm font-bold text-gray-800 mb-2">
                  Betreff Details
                </label>
                <input
                  type="text"
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  className="w-full px-3 sm:px-4 py-3 sm:py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#C04020] focus:border-[#C04020] transition-all duration-300 text-sm font-medium hover:border-[#D4A520]"
                  placeholder="Kurze Beschreibung Ihres Anliegens"
                />
              </div>

              <div className="transition-all duration-300">
                <label htmlFor="message" className="block text-sm font-bold text-gray-800 mb-2">
                  Ihre Nachricht *
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows={6}
                  maxLength={500}
                  className="w-full px-3 sm:px-4 py-3 sm:py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#C04020] focus:border-[#C04020] transition-all duration-300 text-sm font-medium resize-vertical hover:border-[#D4A520]"
                  placeholder="Beschreiben Sie Ihre Anfrage oder Ihren Brennholzbedarf. Wie viele Schüttraummeter benötigen Sie? Wann soll geliefert werden?"
                ></textarea>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mt-2 gap-2">
                  <div className="text-xs text-gray-500">
                    {formData.message.length}/500 Zeichen
                  </div>
                  {formData.message.length > 450 && (
                    <div className="text-xs text-orange-600 font-medium">
                      {500 - formData.message.length} Zeichen verbleibend
                    </div>
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || formData.message.length > 500 || emailError !== ''}
                className="w-full bg-gradient-to-r from-[#C04020] to-[#A03318] text-white py-4 sm:py-5 px-6 sm:px-8 rounded-xl font-bold text-sm sm:text-base lg:text-lg hover:from-[#A03318] hover:to-[#8B2914] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap cursor-pointer shadow-2xl"
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center">
                    <i className="ri-loader-4-line animate-spin mr-2 sm:mr-3 text-lg sm:text-xl flex-shrink-0"></i>
                    <span className="truncate">Wird gesendet...</span>
                  </span>
                ) : (
                  <span className="flex items-center justify-center">
                    <i className="ri-send-plane-line mr-2 sm:mr-3 text-lg sm:text-xl flex-shrink-0"></i>
                    <span className="text-center">Jetzt kostenlose Beratung anfordern</span>
                  </span>
                )}
              </button>

              <div className="bg-[#F5F0E0] rounded-xl p-3 sm:p-4">
                <div className="flex items-start">
                  <div className="w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center bg-[#D4A520] rounded-full mr-3 mt-0.5 flex-shrink-0">
                    <i className="ri-shield-check-line text-white text-xs sm:text-sm"></i>
                  </div>
                  <div className="text-xs text-gray-600 min-w-0 flex-1">
                    <p className="font-bold mb-1">100% Datenschutz garantiert</p>
                    <p>* Pflichtfelder. Ihre Daten werden vertraulich behandelt und nicht an Dritte weitergegeben. Wir verwenden Ihre Kontaktdaten ausschließlich zur Bearbeitung Ihrer Anfrage.</p>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
