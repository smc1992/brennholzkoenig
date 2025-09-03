import jsPDF from 'jspdf';

// Erweitere jsPDF Interface für autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
    lastAutoTable: {
      finalY: number;
    };
  }
}

// Versuche autoTable zu importieren, aber mit Fallback
try {
  require('jspdf-autotable');
} catch (error) {
  console.warn('jspdf-autotable not available, using fallback table implementation');
}

interface InvoiceData {
  invoice_number: string;
  invoice_date: string;
  due_date: string;
  customer: {
    name: string;
    email: string;
    phone?: string;
    customer_number?: string;
    address: {
      street: string;
      house_number: string;
      postal_code: string;
      city: string;
    };
  };
  items: Array<{
    description: string;
    quantity: number;
    unit_price: number;
    total_price: number;
  }>;
  subtotal_amount: number;
  tax_amount: number;
  total_amount: number;
  tax_rate: number;
  payment_terms?: string;
  notes?: string;
}

interface CompanySettings {
  company_name: string;
  company_address_line1: string;
  company_address_line2?: string;
  company_postal_code: string;
  company_city: string;
  company_phone: string;
  company_email: string;
  company_website?: string;
  tax_id?: string;
  vat_rate?: number;
  bank_name?: string;
  bank_iban?: string;
  bank_bic?: string;
  invoice_prefix?: string;
  invoice_footer_text?: string;
  logo_url?: string;
  payment_terms?: string;
  payment_due_days?: number;
  late_fee_percentage?: number;
  company_ceo?: string;
  company_registration?: string;
  company_court?: string;
  invoice_notes?: string;
  terms_conditions_url?: string;
  privacy_policy_url?: string;
  invoice_template_style?: string;
  currency_code?: string;
  currency_symbol?: string;
  invoice_numbering_format?: string;
  company_fax?: string;
  company_mobile?: string;
  delivery_terms?: string;
  warranty_terms?: string;
  return_policy?: string;
  invoice_language?: string;
  show_tax_breakdown?: boolean;
  show_payment_qr_code?: boolean;
  company_slogan?: string;
  invoice_watermark?: string;
  signature_image_url?: string;
}

export class InvoicePDFGenerator {
  private doc: jsPDF;
  private pageWidth: number;
  private pageHeight: number;
  private margin: number = 20;
  private currentY: number = 20;

  constructor() {
    this.doc = new jsPDF('p', 'mm', 'a4'); // Explizit A4 Format
    this.pageWidth = this.doc.internal.pageSize.getWidth();
    this.pageHeight = this.doc.internal.pageSize.getHeight();
    this.margin = 15; // Kleinere Margins für mehr Platz
    this.currentY = this.margin;
  }

  public async generateInvoice(invoiceData: InvoiceData, companySettings: CompanySettings): Promise<Uint8Array> {
    // Reset Y position
    this.currentY = this.margin;
    
    await this.addHeader(companySettings);
    this.currentY += 10; // Abstand nach Header
    
    // Rechnungsdetails und Kundenadresse nebeneinander
    this.addInvoiceAndCustomerInfo(invoiceData, companySettings);
    this.currentY += 15; // Abstand nach Info-Bereich
    
    this.addItemsTable(invoiceData.items, invoiceData.tax_rate, companySettings);
    this.currentY += 10; // Abstand nach Tabelle
    
    this.addTotals(invoiceData, companySettings);
    this.currentY += 15; // Abstand nach Summen
    
    this.addPaymentInfo(companySettings, invoiceData.payment_terms);
    
    this.addFooter(companySettings);
    
    return new Uint8Array(this.doc.output('arraybuffer') as ArrayBuffer);
  }

  private async addHeader(settings: CompanySettings): Promise<void> {
    const headerStartY = this.currentY;
    let logoWidth = 0;
    let logoHeight = 0;
    
    // Logo links positionieren (falls vorhanden) - Professionelle Implementierung
    if (settings.logo_url) {
      try {
        console.log('🖼️ Loading logo from:', settings.logo_url);
        
        // Logo laden mit erweiterten Optionen
        const logoResponse = await fetch(settings.logo_url, {
          method: 'GET',
          headers: {
            'Accept': 'image/*'
          }
        });
        
        if (logoResponse.ok) {
          const logoBlob = await logoResponse.blob();
          console.log('📊 Logo loaded, size:', logoBlob.size, 'bytes, type:', logoBlob.type);
          
          // Erweiterte Größenbegrenzung (max 500KB für bessere Qualität)
          if (logoBlob.size <= 500000) {
            const logoBase64 = await this.blobToBase64(logoBlob);
            
            // Logo-Format automatisch erkennen
            let imageFormat = 'JPEG'; // Default
            if (logoBlob.type.includes('png')) {
              imageFormat = 'PNG';
            } else if (logoBlob.type.includes('gif')) {
              imageFormat = 'GIF';
            } else if (logoBlob.type.includes('webp')) {
              imageFormat = 'WEBP';
            }
            
            console.log('🎨 Detected image format:', imageFormat);
            
            // Logo-Dimensionen berechnen - Professionelle Größe
            const maxLogoWidth = 50;  // Größer für bessere Sichtbarkeit
            const maxLogoHeight = 35; // Proportional angepasst
            
            const img = new Image();
            img.src = logoBase64;
            
            await new Promise((resolve, reject) => {
              img.onload = () => {
                console.log('✅ Logo loaded successfully, dimensions:', img.naturalWidth, 'x', img.naturalHeight);
                resolve(true);
              };
              img.onerror = () => {
                console.error('❌ Failed to load logo image');
                reject(new Error('Logo image load failed'));
              };
              // Timeout nach 5 Sekunden
              setTimeout(() => reject(new Error('Logo load timeout')), 5000);
            });
            
            // Proportionale Skalierung mit besserer Logik
            const aspectRatio = img.naturalWidth / img.naturalHeight;
            
            if (aspectRatio > 1) {
              // Querformat: Breite begrenzen
              logoWidth = Math.min(maxLogoWidth, maxLogoHeight * aspectRatio);
              logoHeight = logoWidth / aspectRatio;
            } else {
              // Hochformat oder quadratisch: Höhe begrenzen
              logoHeight = Math.min(maxLogoHeight, maxLogoWidth / aspectRatio);
              logoWidth = logoHeight * aspectRatio;
            }
            
            console.log('📐 Calculated logo dimensions:', logoWidth, 'x', logoHeight);
            
            // Logo links oben platzieren mit verbesserter Positionierung
            this.doc.addImage(
              logoBase64,
              imageFormat,
              this.margin,
              headerStartY + 2, // Kleiner Offset für bessere Optik
              logoWidth,
              logoHeight
            );
            
            console.log('✅ Logo successfully added to PDF');
          } else {
            console.warn('⚠️ Logo too large:', logoBlob.size, 'bytes (max 500KB)');
            // Versuche trotzdem das Logo zu laden, aber mit reduzierter Qualität
             try {
               const logoBase64 = await this.blobToBase64(logoBlob);
               
               // Logo-Format automatisch erkennen (für große Logos)
               let largeImageFormat = 'JPEG'; // Default
               if (logoBlob.type.includes('png')) {
                 largeImageFormat = 'PNG';
               } else if (logoBlob.type.includes('gif')) {
                 largeImageFormat = 'GIF';
               } else if (logoBlob.type.includes('webp')) {
                 largeImageFormat = 'WEBP';
               }
               
               const img = new Image();
               img.src = logoBase64;
               
               await new Promise((resolve, reject) => {
                 img.onload = () => resolve(true);
                 img.onerror = () => reject(new Error('Large logo load failed'));
                 setTimeout(() => reject(new Error('Large logo timeout')), 3000);
               });
               
               // Kleinere Dimensionen für große Logos
               const aspectRatio = img.naturalWidth / img.naturalHeight;
               logoWidth = 40; // Reduzierte Größe
               logoHeight = logoWidth / aspectRatio;
               
               this.doc.addImage(
                 logoBase64,
                 largeImageFormat,
                 this.margin,
                 headerStartY + 2,
                 logoWidth,
                 logoHeight
               );
               console.log('✅ Large logo added with reduced size');
             } catch (largeLogoError) {
               console.error('❌ Large logo fallback failed:', largeLogoError);
               this.addTextLogo(headerStartY);
               logoWidth = 50;
               logoHeight = 35;
             }
          }
        } else {
          console.error('❌ Failed to fetch logo:', logoResponse.status, logoResponse.statusText);
          // Fallback bei Fetch-Fehler
          this.addTextLogo(headerStartY);
          logoWidth = 50;
          logoHeight = 35;
        }
      } catch (error) {
        console.error('💥 Logo loading error:', error);
        // Fallback: Verwende Text-Logo
        this.addTextLogo(headerStartY);
        logoWidth = 50; // Text-Logo Breite
        logoHeight = 35; // Text-Logo Höhe
      }
    } else {
      console.log('ℹ️ No logo URL provided, using text logo');
      // Fallback: Text-Logo
      this.addTextLogo(headerStartY);
      logoWidth = 50; // Text-Logo Breite
      logoHeight = 35; // Text-Logo Höhe
    }
    
    // Header vervollständigen mit Firmeninformationen
    this.completeHeader(settings, headerStartY, logoWidth, logoHeight);
  }
  
  private addTextLogo(startY: number): void {
    // Professionelles Text-Logo als Fallback
    const logoWidth = 50;
    const logoHeight = 35;
    
    // Hintergrund für Text-Logo
    this.doc.setFillColor(192, 64, 32); // Brennholzkönig Orange
    this.doc.rect(this.margin, startY + 2, logoWidth, logoHeight, 'F');
    
    // Text-Logo
    this.doc.setTextColor(255, 255, 255);
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('BRENNHOLZ', this.margin + 2, startY + 12);
    this.doc.text('KÖNIG', this.margin + 2, startY + 22);
    
    console.log('✅ Text logo added as fallback');
  }
  
  private completeHeader(settings: CompanySettings, headerStartY: number, logoWidth: number, logoHeight: number): void {
    // Firmeninformationen rechts positionieren
    const companyInfoX = this.pageWidth - this.margin - 80; // 80mm von rechts
    let yPos = headerStartY;
    
    // Firmenname (aus Rechnungseinstellungen)
    this.doc.setTextColor(0, 0, 0);
    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'bold');
    
    // Firmenname intelligent aufteilen
    if (settings.company_name.includes(' - ')) {
      const parts = settings.company_name.split(' - ');
      this.doc.text(parts[0], companyInfoX, yPos, { align: 'right' });
      yPos += 5;
      this.doc.text(parts[1], companyInfoX, yPos, { align: 'right' });
    } else {
      this.doc.text(settings.company_name, companyInfoX, yPos, { align: 'right' });
    }
    
    yPos += 8;
    
    // Firmenadresse (aus Rechnungseinstellungen)
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'normal');
    
    this.doc.text(settings.company_address_line1, companyInfoX, yPos, { align: 'right' });
    yPos += 4;
    
    if (settings.company_address_line2) {
      this.doc.text(settings.company_address_line2, companyInfoX, yPos, { align: 'right' });
      yPos += 4;
    }
    
    this.doc.text(`${settings.company_postal_code} ${settings.company_city}`, companyInfoX, yPos, { align: 'right' });
    yPos += 6;
    
    // Kontaktdaten (aus Rechnungseinstellungen)
    this.doc.text(`Tel: ${settings.company_phone}`, companyInfoX, yPos, { align: 'right' });
    yPos += 4;
    this.doc.text(`E-Mail: ${settings.company_email}`, companyInfoX, yPos, { align: 'right' });
    
    if (settings.company_website) {
      yPos += 4;
      this.doc.text(`Web: ${settings.company_website}`, companyInfoX, yPos, { align: 'right' });
    }
    
    if (settings.tax_id) {
      yPos += 4;
      this.doc.text(`USt-IdNr.: ${settings.tax_id}`, companyInfoX, yPos, { align: 'right' });
    }
    
    // Aktuelle Y-Position für nachfolgende Elemente setzen
    this.currentY = Math.max(headerStartY + logoHeight + 10, yPos + 10);
  }
  
  private addTextOnlyHeader(settings: CompanySettings): void {
    const startY = this.currentY;
    const headerHeight = 35;
    
    // Professioneller Header mit Corporate Design
    this.doc.setFillColor(192, 64, 32); // Brennholzkönig Orange
    this.doc.rect(this.margin, startY, this.pageWidth - 2 * this.margin, headerHeight, 'F');
    
    // Logo-Bereich mit Schatten-Effekt
    this.doc.setFillColor(160, 50, 25); // Dunkleres Orange für Logo
    this.doc.rect(this.margin, startY, 55, headerHeight, 'F');
    
    // Logo-Text mit besserer Typografie
    this.doc.setTextColor(255, 255, 255);
    this.doc.setFontSize(11);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('BRENNHOLZ', this.margin + 4, startY + 14);
    this.doc.text('KÖNIG', this.margin + 4, startY + 25);
    
    // Firmenname mit Zeilenumbruch
    this.doc.setTextColor(255, 255, 255);
    this.doc.setFontSize(15);
    this.doc.setFont('helvetica', 'bold');
    
    // Robuste Aufteilung des Firmennamens in zwei Zeilen
    // Erkenne verschiedene Trennzeichen und teile immer auf
    let firstName = 'Thorsten Vey';
    let companyName = 'Brennholzkönig';
    
    // Versuche verschiedene Trennzeichen
    if (settings.company_name.includes(' - ')) {
      const parts = settings.company_name.split(' - ');
      if (parts.length >= 2) {
        firstName = parts[0];
        companyName = parts[1];
      }
    } else if (settings.company_name.includes(' – ')) {
      const parts = settings.company_name.split(' – ');
      if (parts.length >= 2) {
        firstName = parts[0];
        companyName = parts[1];
      }
    } else if (settings.company_name.includes('-')) {
      const parts = settings.company_name.split('-');
      if (parts.length >= 2) {
        firstName = parts[0].trim();
        companyName = parts[1].trim();
      }
    } else if (settings.company_name.toLowerCase().includes('brennholzkönig')) {
      // Fallback: Erkenne 'Brennholzkönig' im Namen
      const index = settings.company_name.toLowerCase().indexOf('brennholzkönig');
      if (index > 0) {
        firstName = settings.company_name.substring(0, index).trim().replace(/[-–]$/, '').trim();
        companyName = settings.company_name.substring(index);
      }
    }
    
    // Immer zweizeilig darstellen
    this.doc.text(firstName, this.margin + 60, startY + 12);
    this.doc.text(companyName, this.margin + 60, startY + 22);
    
    // Slogan falls vorhanden
    if (settings.company_slogan) {
      this.doc.setFontSize(8);
      this.doc.setFont('helvetica', 'normal');
      this.doc.text(settings.company_slogan, this.margin + 60, startY + 30);
    }
    
    // Kontaktinformationen rechts - strukturiert
    const rightX = this.pageWidth - this.margin - 2;
    this.doc.setFontSize(7);
    this.doc.setFont('helvetica', 'normal');
    
    let contactY = startY + 6;
    
    // Telefon
    this.doc.text(`Tel: ${settings.company_phone}`, rightX, contactY, { align: 'right' });
    contactY += 5;
    
    // Mobile falls vorhanden
    if (settings.company_mobile && settings.company_mobile !== settings.company_phone) {
      this.doc.text(`Mobil: ${settings.company_mobile}`, rightX, contactY, { align: 'right' });
      contactY += 5;
    }
    
    // E-Mail
    this.doc.text(`E-Mail: ${settings.company_email}`, rightX, contactY, { align: 'right' });
    contactY += 5;
    
    // Website
    if (settings.company_website) {
      this.doc.text(`Web: ${settings.company_website}`, rightX, contactY, { align: 'right' });
      contactY += 5;
    }
    
    // USt-IdNr.
    if (settings.tax_id) {
      this.doc.text(`USt-IdNr.: ${settings.tax_id}`, rightX, contactY, { align: 'right' });
    }
    
    this.currentY = startY + headerHeight + 8;
    
    // Adresse wird nur im Footer angezeigt - keine redundante Ausgabe hier
    // Geschäftsführer und Registrierung (falls benötigt, können diese optional im Footer integriert werden)
    // Entfernt: Redundante Adressausgabe in der Mitte des Dokuments
    
    this.currentY += 5;
  }
  
  private blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result.split(',')[1]); // Remove data:image/jpeg;base64, prefix
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  private addInvoiceAndCustomerInfo(invoiceData: InvoiceData, settings: CompanySettings): void {
    const startY = this.currentY;
    const titleHeight = 22;
    
    // RECHNUNG Titel mit Corporate Design
    this.doc.setFillColor(50, 50, 50); // Dunkelgrau
    this.doc.rect(this.margin, startY, this.pageWidth - 2 * this.margin, titleHeight, 'F');
    
    // Gradient-Effekt simulieren
    this.doc.setFillColor(70, 70, 70);
    this.doc.rect(this.margin, startY, this.pageWidth - 2 * this.margin, 2, 'F');
    
    this.doc.setTextColor(255, 255, 255);
    this.doc.setFontSize(22);
    this.doc.setFont('helvetica', 'bold');
    
    // Rechnungstyp basierend auf Sprache
    const invoiceTitle = settings?.invoice_language === 'en' ? 'INVOICE' : 'RECHNUNG';
    const titleWidth = this.doc.getTextWidth(invoiceTitle);
    const titleX = (this.pageWidth - titleWidth) / 2;
    this.doc.text(invoiceTitle, titleX, startY + 16);
    
    const contentStartY = startY + titleHeight + 10;
    
    // Nebeneinander: Kundenadresse links, Rechnungsdetails rechts
    const boxHeight = 50;
    const leftBoxWidth = 90;
    const rightBoxWidth = 90;
    const spacing = 10;
    
    // Linke Box: Rechnungsadresse
    const leftX = this.margin;
    this.doc.setFillColor(248, 249, 250);
    this.doc.rect(leftX, contentStartY, leftBoxWidth, boxHeight, 'F');
    this.doc.setDrawColor(192, 64, 32);
    this.doc.setLineWidth(1);
    this.doc.rect(leftX, contentStartY, leftBoxWidth, boxHeight, 'S');
    
    // Header der Adressbox
    this.doc.setFillColor(192, 64, 32);
    this.doc.rect(leftX, contentStartY, leftBoxWidth, 8, 'F');
    this.doc.setTextColor(255, 255, 255);
    this.doc.setFontSize(8);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('RECHNUNGSADRESSE', leftX + 2, contentStartY + 6);
    
    // Kundeninformationen
    this.doc.setTextColor(0, 0, 0);
    this.doc.setFontSize(9);
    this.doc.setFont('helvetica', 'bold');
    
    let leftY = contentStartY + 15;
    this.doc.text(invoiceData.customer.name, leftX + 2, leftY);
    
    this.doc.setFontSize(8);
    this.doc.setFont('helvetica', 'normal');
    
    leftY += 5;
    this.doc.text(`${invoiceData.customer.address.street} ${invoiceData.customer.address.house_number}`, leftX + 2, leftY);
    
    leftY += 4;
    this.doc.text(`${invoiceData.customer.address.postal_code} ${invoiceData.customer.address.city}`, leftX + 2, leftY);
    
    if (invoiceData.customer.email) {
      leftY += 4;
      this.doc.text(`E-Mail: ${invoiceData.customer.email}`, leftX + 2, leftY);
    }
    
    if (invoiceData.customer.phone) {
      leftY += 4;
      this.doc.text(`Tel: ${invoiceData.customer.phone}`, leftX + 2, leftY);
    }
    
    // Rechte Box: Rechnungsdetails
    const rightX = this.pageWidth - this.margin - rightBoxWidth;
    this.doc.setFillColor(248, 249, 250);
    this.doc.rect(rightX, contentStartY, rightBoxWidth, boxHeight, 'F');
    this.doc.setDrawColor(192, 64, 32);
    this.doc.setLineWidth(1);
    this.doc.rect(rightX, contentStartY, rightBoxWidth, boxHeight, 'S');
    
    // Header der Detailbox
    this.doc.setFillColor(192, 64, 32);
    this.doc.rect(rightX, contentStartY, rightBoxWidth, 8, 'F');
    this.doc.setTextColor(255, 255, 255);
    this.doc.setFontSize(8);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('RECHNUNGSDETAILS', rightX + 2, contentStartY + 6);
    
    this.doc.setTextColor(0, 0, 0);
    this.doc.setFontSize(8);
    
    let rightY = contentStartY + 14;
    
    // Rechnungsnummer mit Präfix
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Rechnung Nr.:', rightX + 2, rightY);
    this.doc.setFont('helvetica', 'normal');
    const invoiceNumber = settings?.invoice_prefix ? 
      `${settings.invoice_prefix}${invoiceData.invoice_number}` : 
      invoiceData.invoice_number;
    this.doc.text(invoiceNumber, rightX + 35, rightY);
    
    rightY += 5;
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Datum:', rightX + 2, rightY);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text(new Date(invoiceData.invoice_date).toLocaleDateString('de-DE'), rightX + 35, rightY);
    
    rightY += 5;
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Fällig:', rightX + 2, rightY);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text(new Date(invoiceData.due_date).toLocaleDateString('de-DE'), rightX + 35, rightY);
    
    // Kundennummer falls vorhanden
    if (invoiceData.customer.customer_number) {
      rightY += 5;
      this.doc.setFont('helvetica', 'bold');
      this.doc.text('Kunden-Nr.:', rightX + 2, rightY);
      this.doc.setFont('helvetica', 'normal');
      this.doc.text(invoiceData.customer.customer_number, rightX + 35, rightY);
    }
    
    this.currentY = contentStartY + boxHeight + 8;
  }

  // Diese Methode wird nicht mehr verwendet, da die Kundeninfo jetzt in addInvoiceAndCustomerInfo integriert ist
  private addCustomerInfo(customer: InvoiceData['customer']): void {
    // Deprecated - Funktionalität wurde in addInvoiceAndCustomerInfo integriert
  }

  private addItemsTable(items: InvoiceData['items'], taxRate: number, settings?: CompanySettings): void {
    // Versuche autoTable zu verwenden, falls verfügbar
    if (typeof (this.doc as any).autoTable === 'function') {
      this.addAutoTable(items);
    } else {
      // Fallback: Manuelle Tabelle
      this.addManualTable(items);
    }
  }

  private addAutoTable(items: InvoiceData['items']): void {
    const tableData = items.map(item => [
      item.description,
      item.quantity.toString(),
      `€ ${item.unit_price.toFixed(2)}`,
         `€ ${item.total_price.toFixed(2)}`
    ]);

    try {
      (this.doc as any).autoTable({
        startY: this.currentY,
        head: [['Beschreibung', 'Menge', 'Einzelpreis', 'Gesamtpreis']],
        body: tableData,
        theme: 'grid',
        headStyles: {
          fillColor: [192, 64, 32], // Brennholzkönig Orange
          textColor: [255, 255, 255],
          fontStyle: 'bold'
        },
        styles: {
          fontSize: 10,
          cellPadding: 5
        },
        columnStyles: {
          0: { cellWidth: 80 },
          1: { cellWidth: 30, halign: 'center' },
          2: { cellWidth: 35, halign: 'right' },
          3: { cellWidth: 35, halign: 'right' }
        },
        margin: { left: this.margin, right: this.margin }
      });

      this.currentY = (this.doc as any).lastAutoTable.finalY + 10;
    } catch (error) {
      console.warn('autoTable failed, using manual table:', error);
      this.addManualTable(items);
    }
  }

  private addManualTable(items: InvoiceData['items']): void {
    const startY = this.currentY;
    const rowHeight = 15; // Kompaktere Zeilen
    const tableWidth = this.pageWidth - 2 * this.margin;
    const colWidths = [90, 20, 30, 30]; // Kompaktere Spaltenbreiten
    const colX = [
      this.margin,
      this.margin + colWidths[0],
      this.margin + colWidths[0] + colWidths[1],
      this.margin + colWidths[0] + colWidths[1] + colWidths[2]
    ];
    
    // Tabellen-Titel
    this.doc.setFillColor(50, 50, 50); // Dunkelgrau
    this.doc.rect(this.margin, startY, tableWidth, 10, 'F');
    this.doc.setTextColor(255, 255, 255);
    this.doc.setFontSize(9);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('POSITIONEN', this.margin + 3, startY + 7);
    
    const headerStartY = startY + 10;
    
    // Tabellen-Header
    this.doc.setFillColor(192, 64, 32); // Brennholzkönig Orange
    this.doc.rect(this.margin, headerStartY, tableWidth, rowHeight, 'F');
    
    // Header-Text
    this.doc.setTextColor(255, 255, 255);
    this.doc.setFontSize(8);
    this.doc.setFont('helvetica', 'bold');
    
    const headers = ['Beschreibung', 'Menge', 'Einzelpreis', 'Gesamtpreis'];
    headers.forEach((header, i) => {
      let textX: number;
      
      if (i === 0) {
        textX = colX[i] + 2;
        this.doc.text(header, textX, headerStartY + 10);
      } else {
        textX = colX[i] + (colWidths[i] / 2);
        const textWidth = this.doc.getTextWidth(header);
        this.doc.text(header, textX - (textWidth / 2), headerStartY + 10);
      }
    });
    
    // Spalten-Trennlinien im Header
    this.doc.setDrawColor(255, 255, 255);
    this.doc.setLineWidth(0.5);
    for (let i = 1; i < colX.length; i++) {
      this.doc.line(colX[i], headerStartY, colX[i], headerStartY + rowHeight);
    }
    
    // Datenzeilen
    this.doc.setTextColor(0, 0, 0);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setDrawColor(220, 220, 220);
    this.doc.setLineWidth(0.3);
    
    items.forEach((item, index) => {
      const y = headerStartY + rowHeight + (index * rowHeight);
      
      // Alternierende Zeilenfarben
      if (index % 2 === 1) {
        this.doc.setFillColor(250, 250, 250);
        this.doc.rect(this.margin, y, tableWidth, rowHeight, 'F');
      }
      
      // Zeilen-Rahmen
      this.doc.rect(this.margin, y, tableWidth, rowHeight, 'S');
      
      // Spalten-Trennlinien
      for (let i = 1; i < colX.length; i++) {
        this.doc.line(colX[i], y, colX[i], y + rowHeight);
      }
      
      // Zellinhalte
      const rowData = [
        item.description,
        item.quantity.toString(),
        `€ ${item.unit_price.toFixed(2)}`,
        `€ ${item.total_price.toFixed(2)}`
      ];
      
      rowData.forEach((data, i) => {
        let textX: number;
        let align: 'left' | 'center' | 'right';
        
        if (i === 0) {
          textX = colX[i] + 2;
          align = 'left';
        } else {
          textX = colX[i] + colWidths[i] - 2;
          align = 'right';
        }
        
        // Text kürzen falls zu lang
        let displayText = data;
        if (i === 0 && this.doc.getTextWidth(data) > colWidths[i] - 4) {
          while (this.doc.getTextWidth(displayText + '...') > colWidths[i] - 4 && displayText.length > 0) {
            displayText = displayText.slice(0, -1);
          }
          displayText += '...';
        }
        
        this.doc.setFontSize(8);
        this.doc.setFont('helvetica', 'normal');
        
        if (align === 'right') {
          this.doc.text(displayText, textX, y + 10, { align: 'right' });
        } else {
          this.doc.text(displayText, textX, y + 10);
        }
      });
    });
    
    this.currentY = headerStartY + rowHeight + (items.length * rowHeight) + 5;
  }

  private addTotals(invoiceData: InvoiceData, settings?: CompanySettings): void {
    const startY = this.currentY;
    const boxWidth = 80;
    const boxHeight = 35;
    const rightX = this.pageWidth - this.margin - boxWidth;
    
    // Kompakte Summen-Box
    this.doc.setFillColor(248, 249, 250);
    this.doc.rect(rightX, startY, boxWidth, boxHeight, 'F');
    this.doc.setDrawColor(192, 64, 32);
    this.doc.setLineWidth(0.5);
    this.doc.rect(rightX, startY, boxWidth, boxHeight, 'S');
    
    // Header der Summen-Box
    this.doc.setFillColor(192, 64, 32);
    this.doc.rect(rightX, startY, boxWidth, 8, 'F');
    this.doc.setTextColor(255, 255, 255);
    this.doc.setFontSize(8);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('SUMME', rightX + 2, startY + 6);
    
    // Summen-Details
    this.doc.setTextColor(0, 0, 0);
    this.doc.setFontSize(8);
    
    let yPos = startY + 14;
    
    // Nettobetrag
    this.doc.setFont('helvetica', 'normal');
    this.doc.text('Netto:', rightX + 2, yPos);
    this.doc.text(`€ ${invoiceData.subtotal_amount.toFixed(2)}`, rightX + boxWidth - 2, yPos, { align: 'right' });
     
     yPos += 5;
     this.doc.text(`MwSt. ${invoiceData.tax_rate}%:`, rightX + 2, yPos);
     this.doc.text(`€ ${invoiceData.tax_amount.toFixed(2)}`, rightX + boxWidth - 2, yPos, { align: 'right' });
     
     // Trennlinie
     yPos += 3;
     this.doc.setDrawColor(200, 200, 200);
     this.doc.line(rightX + 2, yPos, rightX + boxWidth - 2, yPos);
     
     // Gesamtbetrag
     yPos += 5;
     this.doc.setFont('helvetica', 'bold');
     this.doc.setFontSize(9);
     this.doc.text('Gesamt:', rightX + 2, yPos);
     this.doc.setTextColor(192, 64, 32);
     this.doc.text(`€ ${invoiceData.total_amount.toFixed(2)}`, rightX + boxWidth - 2, yPos, { align: 'right' });
    
    this.currentY = startY + boxHeight + 5;
  }

  private addPaymentInfo(settings: CompanySettings, paymentTerms?: string): void {
    const startY = this.currentY;
    const boxWidth = this.pageWidth - 2 * this.margin;
    const boxHeight = 35;
    
    // Professionelle Zahlungsinformations-Box
    this.doc.setFillColor(248, 249, 250);
    this.doc.rect(this.margin, startY, boxWidth, boxHeight, 'F');
    this.doc.setDrawColor(192, 64, 32); // Brennholzkönig Orange
    this.doc.setLineWidth(1);
    this.doc.rect(this.margin, startY, boxWidth, boxHeight, 'S');
    
    // Header der Zahlungsinfo-Box
    this.doc.setFillColor(192, 64, 32);
    this.doc.rect(this.margin, startY, boxWidth, 10, 'F');
    this.doc.setTextColor(255, 255, 255);
    this.doc.setFontSize(9);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('ZAHLUNGSINFORMATIONEN', this.margin + 3, startY + 7);
    
    // Zahlungsdetails strukturiert
    this.doc.setTextColor(0, 0, 0);
    this.doc.setFontSize(8);
    this.doc.setFont('helvetica', 'normal');
    
    let yPos = startY + 16;
    const leftCol = this.margin + 3;
    const rightCol = this.margin + (boxWidth / 2) + 3;
    
    // Linke Spalte - Bankdaten
    if (settings.bank_name && settings.bank_iban) {
      this.doc.setFont('helvetica', 'bold');
      this.doc.text('Bankverbindung:', leftCol, yPos);
      this.doc.setFont('helvetica', 'normal');
      yPos += 4;
      this.doc.text(settings.bank_name, leftCol, yPos);
      yPos += 3;
      this.doc.text(`IBAN: ${settings.bank_iban}`, leftCol, yPos);
      if (settings.bank_bic) {
        yPos += 3;
        this.doc.text(`BIC: ${settings.bank_bic}`, leftCol, yPos);
      }
    }
    
    // Rechte Spalte - Zahlungsbedingungen
    yPos = startY + 16;
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Zahlungsbedingungen:', rightCol, yPos);
    this.doc.setFont('helvetica', 'normal');
    yPos += 4;
    
    const terms = settings.payment_terms || paymentTerms || 'Zahlbar sofort ohne Abzug';
    this.doc.text(terms, rightCol, yPos);
    yPos += 3;
    
    if (settings.payment_due_days && settings.payment_due_days > 0) {
      this.doc.text(`Zahlungsziel: ${settings.payment_due_days} Tage`, rightCol, yPos);
      yPos += 3;
    }
    
    this.doc.text('Bitte Rechnungsnummer angeben', rightCol, yPos);
    
    this.currentY = startY + boxHeight + 8;
  }

  private addFooter(settings: CompanySettings): void {
    // Dynamische Footer-Position basierend auf Inhalt
    // Mindestens 50mm Abstand vom aktuellen Inhalt oder am Ende der Seite
    const minFooterY = this.currentY + 20; // Mindestabstand zum Inhalt
    const maxFooterY = this.pageHeight - 35; // Maximale Position vom unteren Rand
    const footerY = Math.max(minFooterY, maxFooterY);
    
    // Schmaler Balken mit Firmeninformationen
    const barHeight = 12;
    this.doc.setFillColor(240, 240, 240); // Hellgrauer Hintergrund
    this.doc.rect(this.margin, footerY, this.pageWidth - 2 * this.margin, barHeight, 'F');
    
    // Rahmen um den Balken
    this.doc.setDrawColor(200, 200, 200);
    this.doc.setLineWidth(0.3);
    this.doc.rect(this.margin, footerY, this.pageWidth - 2 * this.margin, barHeight, 'S');
    
    // Informationen in drei Spalten
    this.doc.setTextColor(0, 0, 0);
    this.doc.setFontSize(7);
    this.doc.setFont('helvetica', 'normal');
    
    const colWidth = (this.pageWidth - 2 * this.margin) / 3;
    const textY = footerY + 4;
    
    // Spalte 1: Adresse
    let col1X = this.margin + 2;
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Adresse:', col1X, textY);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text(`${settings.company_address_line1}, ${settings.company_postal_code} ${settings.company_city}`, col1X, textY + 4);
    
    // Spalte 2: Bankverbindung
    let col2X = this.margin + colWidth + 2;
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Bankverbindung:', col2X, textY);
    this.doc.setFont('helvetica', 'normal');
    const bankInfo = settings.bank_iban ? `${settings.bank_name || ''} • IBAN: ${settings.bank_iban}` : (settings.bank_name || 'Bankdaten in Einstellungen');
    this.doc.text(bankInfo, col2X, textY + 4);
    
    // Spalte 3: Steuerdaten
    let col3X = this.margin + 2 * colWidth + 2;
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Steuerdaten:', col3X, textY);
    this.doc.setFont('helvetica', 'normal');
    const taxInfo = settings.tax_id ? `USt-IdNr.: ${settings.tax_id}` : 'USt-IdNr. in Einstellungen';
    this.doc.text(taxInfo, col3X, textY + 4);
    
    // Trennlinien zwischen den Spalten
    this.doc.setDrawColor(200, 200, 200);
    this.doc.setLineWidth(0.2);
    this.doc.line(this.margin + colWidth, footerY + 1, this.margin + colWidth, footerY + barHeight - 1);
    this.doc.line(this.margin + 2 * colWidth, footerY + 1, this.margin + 2 * colWidth, footerY + barHeight - 1);
  }

  public static async downloadInvoicePDF(
    invoiceData: InvoiceData, 
    companySettings: CompanySettings, 
    filename?: string
  ): Promise<void> {
    const generator = new InvoicePDFGenerator();
    const pdfBytes = await generator.generateInvoice(invoiceData, companySettings);
    
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename || `Rechnung_${invoiceData.invoice_number}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
  }

  public static async generateInvoicePDFBlob(
    invoiceData: InvoiceData, 
    companySettings: CompanySettings
  ): Promise<Blob> {
    const generator = new InvoicePDFGenerator();
    const pdfBytes = await generator.generateInvoice(invoiceData, companySettings);
    
    return new Blob([pdfBytes], { type: 'application/pdf' });
  }
}