import jsPDF from 'jspdf';

export interface TransactionReceiptData {
  type: 'deposit' | 'withdrawal';
  crypto: string;
  amount: number;
  usd_value: number;
  description?: string;
  transaction_hash?: string;
  created_at: string;
  issued_by?: string;
  user: {
    full_name: string;
    email: string;
    phone?: string;
    account_number?: string;
    routing_number?: string;
    country?: string;
  };
}

const cryptoLabels: Record<string, string> = {
  USD: 'US Dollars',
  USDT: 'Tether (USDT)',
  BTC: 'Bitcoin (BTC)',
  ETH: 'Ethereum (ETH)',
  BNB: 'Binance Coin (BNB)',
  LTC: 'Litecoin (LTC)',
};

const countryLabels: Record<string, string> = {
  US: 'United States',
  CA: 'Canada',
  MX: 'Mexico',
  GT: 'Guatemala',
  SV: 'El Salvador',
  HN: 'Honduras',
  NI: 'Nicaragua',
  CR: 'Costa Rica',
  PA: 'Panama',
  CU: 'Cuba',
  DO: 'Dominican Republic',
  CO: 'Colombia',
  VE: 'Venezuela',
  EC: 'Ecuador',
  PE: 'Peru',
  BR: 'Brazil',
  BO: 'Bolivia',
  PY: 'Paraguay',
  UY: 'Uruguay',
  AR: 'Argentina',
  CL: 'Chile',
  ES: 'Spain',
  PT: 'Portugal',
  FR: 'France',
  IT: 'Italy',
  DE: 'Germany',
  GB: 'United Kingdom',
};

export const generateTransactionReceipt = (data: TransactionReceiptData) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - 2 * margin;
  const centerX = pageWidth / 2;
  
  // Generate reference number
  const refNumber = `TXN-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
  
  // Format date in English
  const transactionDate = new Date(data.created_at);
  const formattedDate = transactionDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  let y = 20;

  // ========== HEADER ==========
  doc.setFillColor(20, 60, 120);
  doc.rect(0, 0, pageWidth, 45, 'F');
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(255, 255, 255);
  doc.text('QUANTUM LEDGER BUSINESS BANK', centerX, 25, { align: 'center' });
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Trusted Financial Solutions', centerX, 35, { align: 'center' });

  y = 60;

  // ========== RECEIPT TITLE ==========
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(20, 60, 120);
  const title = data.type === 'deposit' ? 'DEPOSIT RECEIPT' : 'WITHDRAWAL RECEIPT';
  doc.text(title, centerX, y, { align: 'center' });

  y += 8;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(`Reference: ${refNumber}`, centerX, y, { align: 'center' });
  
  y += 5;
  doc.text(formattedDate, centerX, y, { align: 'center' });

  y += 15;

  // ========== TRANSACTION DETAILS ==========
  const drawSection = (startY: number, title: string, items: { label: string; value: string; highlight?: boolean }[]) => {
    const padding = 8;
    const rowHeight = 9;
    const headerHeight = 20;
    const boxHeight = headerHeight + (items.length * rowHeight) + padding;
    
    // Box background
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(margin, startY, contentWidth, boxHeight, 2, 2, 'FD');
    
    // Header bar
    doc.setFillColor(20, 60, 120);
    doc.roundedRect(margin, startY, contentWidth, headerHeight, 2, 2, 'F');
    doc.rect(margin, startY + 10, contentWidth, 10, 'F'); // Cover bottom corners
    
    // Header text
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(255, 255, 255);
    doc.text(title, margin + 10, startY + 13);
    
    // Content
    let contentY = startY + headerHeight + 8;
    const labelX = margin + 10;
    const valueX = margin + 70;
    
    items.forEach((item) => {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(71, 85, 105);
      doc.text(item.label, labelX, contentY);
      
      doc.setFont('helvetica', 'normal');
      if (item.highlight) {
        doc.setTextColor(34, 197, 94);
      } else {
        doc.setTextColor(30, 41, 59);
      }
      
      // Handle long text
      const maxWidth = contentWidth - 80;
      const lines = doc.splitTextToSize(item.value, maxWidth);
      doc.text(lines[0], valueX, contentY);
      
      contentY += rowHeight;
    });
    
    return startY + boxHeight;
  };

  // Transaction items
  const transactionItems: { label: string; value: string; highlight?: boolean }[] = [
    { label: 'Type:', value: data.type === 'deposit' ? 'Deposit' : 'Withdrawal' },
    { label: 'Currency:', value: cryptoLabels[data.crypto] || data.crypto },
    { label: 'Amount:', value: `${data.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })} ${data.crypto}` },
    { label: 'USD Value:', value: `$${data.usd_value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` },
    { label: 'Status:', value: 'Completed', highlight: true },
  ];

  if (data.issued_by) {
    transactionItems.push({ label: 'Issued by:', value: data.issued_by });
  }

  y = drawSection(y, 'TRANSACTION DETAILS', transactionItems);
  y += 10;

  // ========== USER DETAILS ==========
  const userItems: { label: string; value: string }[] = [
    { label: 'Name:', value: data.user.full_name },
    { label: 'Email:', value: data.user.email },
  ];

  if (data.user.account_number) {
    userItems.push({ label: 'Account #:', value: data.user.account_number });
  }
  if (data.user.phone) {
    userItems.push({ label: 'Phone:', value: data.user.phone });
  }
  if (data.user.country) {
    userItems.push({ label: 'Country:', value: countryLabels[data.user.country] || data.user.country });
  }

  y = drawSection(y, 'ACCOUNT HOLDER INFORMATION', userItems);
  y += 10;

  // ========== DESCRIPTION (if exists) ==========
  if (data.description && data.description.trim()) {
    const descLines = doc.splitTextToSize(data.description, contentWidth - 20);
    const descBoxHeight = 28 + (descLines.length * 6);
    
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(margin, y, contentWidth, descBoxHeight, 2, 2, 'FD');
    
    doc.setFillColor(20, 60, 120);
    doc.roundedRect(margin, y, contentWidth, 20, 2, 2, 'F');
    doc.rect(margin, y + 10, contentWidth, 10, 'F');
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(255, 255, 255);
    doc.text('DESCRIPTION', margin + 10, y + 13);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(30, 41, 59);
    doc.text(descLines, margin + 10, y + 30);
    
    y += descBoxHeight + 10;
  }

  // ========== TRANSACTION HASH (if exists) ==========
  if (data.transaction_hash) {
    doc.setFillColor(254, 249, 195);
    doc.setDrawColor(234, 179, 8);
    doc.roundedRect(margin, y, contentWidth, 22, 2, 2, 'FD');
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(113, 63, 18);
    doc.text('Transaction Hash:', margin + 10, y + 10);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(data.transaction_hash, margin + 10, y + 17);
    
    y += 27;
  }

  // ========== FOOTER ==========
  const footerY = Math.max(y + 15, pageHeight - 35);
  
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.5);
  doc.line(margin, footerY, pageWidth - margin, footerY);
  
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('This document is an official transaction receipt issued by Quantum Ledger Business Bank.', centerX, footerY + 8, { align: 'center' });
  doc.text('For any inquiries, please contact our customer service.', centerX, footerY + 14, { align: 'center' });
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text(`Ref: ${refNumber} | Account: ${data.user.account_number || 'N/A'}`, centerX, footerY + 22, { align: 'center' });

  // Save PDF
  const fileName = `Receipt_${data.type === 'deposit' ? 'Deposit' : 'Withdrawal'}_${data.user.full_name.replace(/\s+/g, '_')}_${Date.now()}.pdf`;
  doc.save(fileName);
};
