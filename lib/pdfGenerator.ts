import jsPDF from 'jspdf';
import 'jspdf-autotable';

interface InvoiceData {
  invoice_number: string;
  invoice_date: string;
  due_date: string;
  customer: {
    name: string;
    email: string;
    phone?: string;
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
  bank_name?: string;
  bank_iban?: string;
  bank_bic?: string;
  invoice_footer_text?: string;
}

export class InvoicePDFGenerator {
  private doc: jsPDF;
  private pageWidth: number;
  private pageHeight: number;
  private margin: number = 20;
  private currentY: number = 20;

  constructor() {
    this.doc = new jsPDF();
    this.pageWidth = this.doc.internal.pageSize.getWidth();
    this.pageHeight = this.doc.internal.pageSize.getHeight();
  }

  public generateInvoice(invoiceData: InvoiceData, companySettings: CompanySettings): Uint8Array {
    this.addHeader(companySettings);
    this.addInvoiceInfo(invoiceData);
    this.addCustomerInfo(invoiceData.customer);
    this.addItemsTable(invoiceData.items, invoiceData.tax_rate);
    this.addTotals(invoiceData);
    this.addPaymentInfo(companySettings, invoiceData.payment_terms);
    this.addFooter(companySettings);
    
    return this.doc.output('arraybuffer') as Uint8Array;
  }

  private addHeader(settings: CompanySettings): void {
    // Logo Platzhalter (kann später durch echtes Logo ersetzt werden)
    this.doc.setFillColor(192, 64, 32); // Brennholzkönig Orange
    this.doc.rect(this.margin, this.currentY, 40, 20, 'F');
    
    this.doc.setTextColor(255, 255, 255);
    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('BRENNHOLZ', this.margin + 2, this.currentY + 8);
    this.doc.text('KÖNIG', this.margin + 2, this.currentY + 16);
    
    // Firmeninformationen
    this.doc.setTextColor(0, 0, 0);
    this.doc.setFontSize(16);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(settings.company_name, this.margin + 50, this.currentY + 8);
    
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'normal');
    let yPos = this.currentY + 16;
    this.doc.text(settings.company_address_line1, this.margin + 50, yPos);
    
    if (settings.company_address_line2) {
      yPos += 4;
      this.doc.text(settings.company_address_line2, this.margin + 50, yPos);
    }
    
    yPos += 4;
    this.doc.text(`${settings.company_postal_code} ${settings.company_city}`, this.margin + 50, yPos);
    
    yPos += 8;
    this.doc.text(`Tel: ${settings.company_phone}`, this.margin + 50, yPos);
    yPos += 4;
    this.doc.text(`E-Mail: ${settings.company_email}`, this.margin + 50, yPos);
    
    if (settings.company_website) {
      yPos += 4;
      this.doc.text(`Web: ${settings.company_website}`, this.margin + 50, yPos);
    }
    
    this.currentY = Math.max(this.currentY + 25, yPos + 10);
  }

  private addInvoiceInfo(invoiceData: InvoiceData): void {
    // RECHNUNG Titel
    this.doc.setFontSize(20);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('RECHNUNG', this.pageWidth - this.margin - 50, this.currentY);
    
    this.currentY += 15;
    
    // Rechnungsdetails
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'normal');
    
    const rightX = this.pageWidth - this.margin - 60;
    this.doc.text(`Rechnungsnummer: ${invoiceData.invoice_number}`, rightX, this.currentY);
    this.currentY += 5;
    this.doc.text(`Rechnungsdatum: ${new Date(invoiceData.invoice_date).toLocaleDateString('de-DE')}`, rightX, this.currentY);
    this.currentY += 5;
    this.doc.text(`Fälligkeitsdatum: ${new Date(invoiceData.due_date).toLocaleDateString('de-DE')}`, rightX, this.currentY);
    
    this.currentY += 15;
  }

  private addCustomerInfo(customer: InvoiceData['customer']): void {
    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Rechnungsadresse:', this.margin, this.currentY);
    
    this.currentY += 8;
    
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text(customer.name, this.margin, this.currentY);
    this.currentY += 5;
    this.doc.text(`${customer.address.street} ${customer.address.house_number}`, this.margin, this.currentY);
    this.currentY += 5;
    this.doc.text(`${customer.address.postal_code} ${customer.address.city}`, this.margin, this.currentY);
    
    if (customer.email) {
      this.currentY += 5;
      this.doc.text(`E-Mail: ${customer.email}`, this.margin, this.currentY);
    }
    
    if (customer.phone) {
      this.currentY += 5;
      this.doc.text(`Tel: ${customer.phone}`, this.margin, this.currentY);
    }
    
    this.currentY += 15;
  }

  private addItemsTable(items: InvoiceData['items'], taxRate: number): void {
    const tableData = items.map(item => [
      item.description,
      item.quantity.toString(),
      `€${item.unit_price.toFixed(2)}`,
      `€${item.total_price.toFixed(2)}`
    ]);

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
  }

  private addTotals(invoiceData: InvoiceData): void {
    const rightX = this.pageWidth - this.margin - 60;
    const leftX = rightX - 40;
    
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'normal');
    
    // Nettobetrag
    this.doc.text('Nettobetrag:', leftX, this.currentY);
    this.doc.text(`€${invoiceData.subtotal_amount.toFixed(2)}`, rightX, this.currentY, { align: 'right' });
    this.currentY += 6;
    
    // MwSt.
    this.doc.text(`MwSt. (${invoiceData.tax_rate}%):`, leftX, this.currentY);
    this.doc.text(`€${invoiceData.tax_amount.toFixed(2)}`, rightX, this.currentY, { align: 'right' });
    this.currentY += 6;
    
    // Linie
    this.doc.line(leftX, this.currentY, rightX, this.currentY);
    this.currentY += 4;
    
    // Gesamtbetrag
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Gesamtbetrag:', leftX, this.currentY);
    this.doc.text(`€${invoiceData.total_amount.toFixed(2)}`, rightX, this.currentY, { align: 'right' });
    
    this.currentY += 15;
  }

  private addPaymentInfo(settings: CompanySettings, paymentTerms?: string): void {
    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Zahlungsinformationen:', this.margin, this.currentY);
    
    this.currentY += 8;
    
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'normal');
    
    if (paymentTerms) {
      this.doc.text(`Zahlungsbedingungen: ${paymentTerms}`, this.margin, this.currentY);
      this.currentY += 5;
    }
    
    if (settings.bank_name && settings.bank_iban) {
      this.doc.text('Bankverbindung:', this.margin, this.currentY);
      this.currentY += 5;
      this.doc.text(`Bank: ${settings.bank_name}`, this.margin + 5, this.currentY);
      this.currentY += 4;
      this.doc.text(`IBAN: ${settings.bank_iban}`, this.margin + 5, this.currentY);
      
      if (settings.bank_bic) {
        this.currentY += 4;
        this.doc.text(`BIC: ${settings.bank_bic}`, this.margin + 5, this.currentY);
      }
    }
    
    if (settings.tax_id) {
      this.currentY += 8;
      this.doc.text(`Umsatzsteuer-ID: ${settings.tax_id}`, this.margin, this.currentY);
    }
    
    this.currentY += 15;
  }

  private addFooter(settings: CompanySettings): void {
    if (settings.invoice_footer_text) {
      // Footer am Ende der Seite
      const footerY = this.pageHeight - 30;
      
      this.doc.setFontSize(10);
      this.doc.setFont('helvetica', 'italic');
      this.doc.text(settings.invoice_footer_text, this.pageWidth / 2, footerY, { align: 'center' });
    }
  }

  public static async downloadInvoicePDF(
    invoiceData: InvoiceData, 
    companySettings: CompanySettings, 
    filename?: string
  ): Promise<void> {
    const generator = new InvoicePDFGenerator();
    const pdfBytes = generator.generateInvoice(invoiceData, companySettings);
    
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
    const pdfBytes = generator.generateInvoice(invoiceData, companySettings);
    
    return new Blob([pdfBytes], { type: 'application/pdf' });
  }
}