
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

  // Entfernt: checkExistingAccount - Registrierte Kunden können Kontaktanfragen senden

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
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; background: linear-gradient(135deg, #f5f5f5, #e8e8e8); margin: 0; padding: 20px; }
            .container { max-width: 650px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 12px 40px rgba(0,0,0,0.15); }
            .header { background: linear-gradient(135deg, #C04020, #A03318); color: white; padding: 40px 30px; text-align: center; position: relative; }
            .header::before { content: '🔥'; font-size: 48px; display: block; margin-bottom: 10px; }
            .header h1 { margin: 0; font-size: 32px; font-weight: bold; text-shadow: 0 2px 4px rgba(0,0,0,0.3); }
            .header p { margin: 15px 0 0; opacity: 0.95; font-size: 18px; font-weight: 300; }
            .content { padding: 40px 30px; }
            .field-group { margin-bottom: 30px; border-left: 5px solid #D4A520; background: linear-gradient(135deg, #fafafa, #f0f0f0); padding: 20px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
            .field-label { font-weight: bold; color: #C04020; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; display: flex; align-items: center; }
            .field-label::before { content: '▶'; margin-right: 8px; color: #D4A520; }
            .field-value { font-size: 16px; color: #333; word-wrap: break-word; line-height: 1.7; }
            .field-value a { color: #C04020; text-decoration: none; font-weight: 600; }
            .field-value a:hover { text-decoration: underline; }
            .message-field { background: linear-gradient(135deg, #f0f8ff, #e6f3ff); border: 2px solid #D4A520; border-radius: 12px; padding: 25px; margin: 25px 0; position: relative; }
            .message-field::before { content: '💬'; position: absolute; top: -10px; left: 20px; background: white; padding: 0 10px; font-size: 20px; }
            .priority-high { border-left-color: #C04020; background: linear-gradient(135deg, #fff5f5, #ffe6e6); }
            .priority-high .field-label::before { content: '⭐'; }
            .footer { background: linear-gradient(135deg, #f8f9fa, #e9ecef); padding: 30px; text-align: center; border-top: 3px solid #D4A520; }
            .footer p { margin: 8px 0; color: #666; font-size: 14px; }
            .footer .company-name { font-size: 18px; font-weight: bold; color: #C04020; margin-bottom: 15px; }
            .footer .contact-info { background: white; padding: 15px; border-radius: 8px; margin: 15px 0; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
            .timestamp { color: #888; font-size: 12px; font-style: italic; background: #f0f0f0; padding: 8px 12px; border-radius: 20px; display: inline-block; }
            .logo { font-family: 'Georgia', serif; font-size: 28px; color: #D4A520; margin-bottom: 15px; font-weight: bold; text-shadow: 0 2px 4px rgba(0,0,0,0.3); }
            .action-buttons { margin: 25px 0; text-align: center; }
            .action-button { display: inline-block; background: #C04020; color: white; padding: 12px 25px; text-decoration: none; border-radius: 25px; font-weight: bold; margin: 0 10px; box-shadow: 0 4px 12px rgba(192,64,32,0.3); transition: all 0.3s ease; }
            .action-button:hover { background: #A03318; transform: translateY(-2px); }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">🔥 Brennholzkönig</div>
                <h1>Neue Kontaktanfrage</h1>
                <p>Eine neue Kundenanfrage ist eingegangen</p>
            </div>
            
            <div class="content">
                <div class="field-group priority-high">
                    <div class="field-label">👤 Kontaktdaten</div>
                    <div class="field-value">
                        <strong>Name:</strong> ${data.name}<br>
                        <strong>E-Mail:</strong> <a href="mailto:${data.email}">${data.email}</a><br>
                        ${data.phone ? `<strong>Telefon:</strong> <a href="tel:${data.phone}">${data.phone}</a><br>` : ''}
                    </div>
                </div>

                <div class="field-group">
                    <div class="field-label">📋 Betreff & Kategorie</div>
                    <div class="field-value">
                        <strong>Produktkategorie:</strong> <span style="background: #D4A520; color: white; padding: 4px 8px; border-radius: 4px; font-weight: bold;">${data.product}</span><br><br>
                        ${data.subject ? `<strong>Betreff Details:</strong> ${data.subject}<br>` : ''}
                    </div>
                </div>

                <div class="field-group message-field">
                    <div class="field-label">💬 Nachricht</div>
                    <div class="field-value" style="font-size: 16px; line-height: 1.8; background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #C04020;">
                        ${data.message.replace(/\\n/g, '<br>')}
                    </div>
                </div>

                <div class="field-group">
                    <div class="field-label">⏰ Eingangsdatum</div>
                    <div class="field-value">
                        <span class="timestamp">${currentDate}</span>
                    </div>
                </div>

                <div class="action-buttons">
                    <a href="mailto:${data.email}" class="action-button">📧 Antworten</a>
                    ${data.phone ? `<a href="tel:${data.phone}" class="action-button">📞 Anrufen</a>` : ''}
                </div>
            </div>

            <div class="footer">
                <div class="company-name">🔥 Brennholzkönig - Premium Brennholz</div>
                
                <div class="contact-info">
                    <p><strong>📞 Für Rückfragen:</strong> <a href="tel:${data.phone || '+49 176 71085234'}">${data.phone || '+49 176 71085234'}</a></p>
                    <p><strong>📧 Direkt antworten:</strong> <a href="mailto:${data.email}">${data.email}</a></p>
                </div>
                
                <p style="margin-top: 20px; font-size: 12px; color: #999;">
                    🤖 Automatisch generiert am ${currentDate}<br>
                    Diese E-Mail wurde über das Kontaktformular auf brennholz-koenig.de gesendet
                </p>
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

    // Registrierte Kunden können weiterhin Kontaktanfragen senden
    // Die Überprüfung auf existierende Konten wurde entfernt

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

      // Kontaktanfrage in Datenbank speichern
      const { data: contactData, error: contactError } = await supabase
        .from('contact_requests')
        .insert({
          name: formData.name,
          email: formData.email,
          phone: formData.phone || null,
          subject: formData.subject || null,
          message: formData.message,
          product_category: formData.product,
          status: 'new',
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (contactError) {
        console.error('Fehler beim Speichern der Kontaktanfrage:', contactError);
        throw new Error('Kontaktanfrage konnte nicht gespeichert werden. Bitte versuchen Sie es später erneut.');
      }

      console.log('Kontaktanfrage erfolgreich gespeichert:', contactData);

      // E-Mail-Versand im Hintergrund versuchen (ohne Fehler bei Problemen)
      try {
        const emailResponse = await fetch('/api/send-email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            to: 'info@brennholz-koenig.de',
            subject: `🔥 Neue Kontaktanfrage: ${formData.product} - ${formData.name}`,
            html: emailHtml,
            text: plainText,
            type: 'contact_form'
          })
        });

        if (!emailResponse.ok) {
          const errorData = await emailResponse.json().catch(() => ({ error: 'Unbekannter Fehler' }));
          console.warn(`E-Mail-Versand fehlgeschlagen (${emailResponse.status}):`, errorData);
        } else {
          const emailResult = await emailResponse.json();
          console.log('E-Mail erfolgreich versendet:', emailResult);
        }
      } catch (emailError) {
        console.warn('E-Mail-Versand fehlgeschlagen, aber Anfrage wurde gespeichert:', emailError);
      }

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
                    <option value="Industrieholz Buche Klasse 1">Industrieholz Buche Klasse 1</option>
                    <option value="Industrieholz Buche Klasse 2">Industrieholz Buche Klasse 2</option>
                    <option value="Scheitholz Buche 33cm">Scheitholz Buche 33cm</option>
                    <option value="Scheitholz Buche 25cm">Scheitholz Buche 25cm</option>
                    <option value="Scheitholz - Industrieholz Mix 33cm">Scheitholz - Industrieholz Mix 33cm</option>
                    <option value="Scheitholz Fichte 33cm">Scheitholz Fichte 33cm</option>
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
