import jsPDF from 'jspdf';

interface UserProfile {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  country: string;
  nationality: string;
  full_address: string;
  birth_date: string;
  phone: string;
  account_type: string;
  id_document_number: string;
  account_number: string;
  routing_number: string;
  created_at: string;
  btc?: number;
  eth?: number;
  bnb?: number;
  usdt?: number;
  ltc?: number;
  usd?: number;
  is_activated?: boolean;
}

const countryLabels: Record<string, string> = {
  US: 'Estados Unidos', CA: 'Canadá', MX: 'México', GT: 'Guatemala',
  SV: 'El Salvador', HN: 'Honduras', NI: 'Nicaragua', CR: 'Costa Rica',
  PA: 'Panamá', CU: 'Cuba', DO: 'República Dominicana', CO: 'Colombia',
  VE: 'Venezuela', EC: 'Ecuador', PE: 'Perú', BR: 'Brasil', BO: 'Bolivia',
  PY: 'Paraguay', UY: 'Uruguay', AR: 'Argentina', CL: 'Chile', ES: 'España',
  PT: 'Portugal', FR: 'Francia', IT: 'Italia', DE: 'Alemania', GB: 'Reino Unido',
};

const accountTypeLabels: Record<string, string> = {
  savings: 'Cuenta de Ahorros',
  checking: 'Cuenta Corriente',
};

export const generateBankCertificate = (user: UserProfile) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const centerX = pageWidth / 2;
  const marginLeft = 25;
  const marginRight = pageWidth - 25;
  const contentWidth = marginRight - marginLeft;

  const refNumber = `QLB-${new Date().getFullYear()}-${Date.now().toString(36).toUpperCase().slice(-6)}`;
  
  const openingDate = new Date(user.created_at).toLocaleDateString('es-ES', {
    day: '2-digit', month: 'long', year: 'numeric'
  });
  
  const currentDate = new Date().toLocaleDateString('es-ES', {
    day: '2-digit', month: 'long', year: 'numeric'
  });

  let y = 25;

  // ===================== ENCABEZADO =====================
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(10, 40, 80);
  doc.text('QUANTUM LEDGER BUSINESS BANK', centerX, y, { align: 'center' });
  
  y += 7;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text('Plataforma de Gestión de Criptomonedas', centerX, y, { align: 'center' });

  y += 10;
  doc.setDrawColor(10, 40, 80);
  doc.setLineWidth(1);
  doc.line(marginLeft, y, marginRight, y);
  doc.setLineWidth(0.3);
  doc.line(marginLeft, y + 2, marginRight, y + 2);

  // ===================== TÍTULO =====================
  y += 18;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(0);
  doc.text('CONSTANCIA DE APERTURA DE CUENTA', centerX, y, { align: 'center' });

  y += 10;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100);
  doc.text(`Folio: ${refNumber}`, marginRight, y, { align: 'right' });

  // ===================== INTRODUCCIÓN =====================
  y += 15;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(40);
  
  const intro = `Por medio de la presente, QUANTUM LEDGER BUSINESS BANK hace constar que el/la Sr(a). ${user.full_name || '[Nombre no especificado]'} ha realizado con fecha ${openingDate} la apertura de una cuenta bancaria en nuestra institución, cumpliendo con todos los requisitos establecidos.`;
  
  const introLines = doc.splitTextToSize(intro, contentWidth);
  doc.text(introLines, marginLeft, y);
  y += introLines.length * 6 + 12;

  // ===================== DATOS DEL TITULAR =====================
  const boxStartY1 = y;
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(10, 40, 80);
  doc.text('DATOS DEL TITULAR', marginLeft + 5, y + 8);

  y += 18;
  doc.setFontSize(10);
  doc.setTextColor(50);

  const drawField = (label: string, value: string, yPos: number) => {
    doc.setFont('helvetica', 'bold');
    doc.text(label, marginLeft + 5, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(value || '-', marginLeft + 50, yPos);
  };

  drawField('Nombre:', user.full_name || '-', y);
  y += 7;
  drawField('Email:', user.email || '-', y);
  y += 7;
  drawField('Teléfono:', user.phone || '-', y);
  y += 7;
  drawField('Identificación:', user.id_document_number || '-', y);
  y += 7;
  drawField('Nacimiento:', user.birth_date || '-', y);
  y += 7;
  drawField('Nacionalidad:', countryLabels[user.nationality] || user.nationality || '-', y);
  y += 7;
  drawField('País:', countryLabels[user.country] || user.country || '-', y);
  y += 7;
  
  const address = user.full_address || '-';
  const shortAddress = address.length > 50 ? address.substring(0, 47) + '...' : address;
  drawField('Dirección:', shortAddress, y);

  const boxEndY1 = y + 8;
  
  // Dibujar caja alrededor de datos del titular
  doc.setFillColor(248, 249, 250);
  doc.setDrawColor(220, 220, 220);
  doc.roundedRect(marginLeft, boxStartY1, contentWidth, boxEndY1 - boxStartY1, 2, 2, 'S');

  // ===================== INFORMACIÓN DE CUENTA =====================
  y += 15;
  const boxStartY2 = y;
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(10, 40, 80);
  doc.text('INFORMACIÓN DE LA CUENTA', marginLeft + 5, y + 8);

  y += 18;
  doc.setFontSize(10);
  doc.setTextColor(50);

  drawField('Tipo:', accountTypeLabels[user.account_type] || 'Cuenta de Ahorros', y);
  y += 7;
  drawField('No. Cuenta:', user.account_number || 'Pendiente de asignación', y);
  y += 7;
  drawField('No. Ruta:', user.routing_number || 'Pendiente de asignación', y);
  y += 7;
  drawField('Moneda:', 'USD (Dólares Estadounidenses)', y);
  y += 7;
  const accountStatus = user.is_activated ? 'ACTIVA' : 'INACTIVA - Pendiente de activación';
  drawField('Estado:', accountStatus, y);
  
  // Balances si están disponibles
  if (user.usd !== undefined || user.btc !== undefined) {
    y += 10;
    doc.setFont('helvetica', 'bold');
    doc.text('Saldos disponibles:', marginLeft + 5, y);
    y += 7;
    doc.setFont('helvetica', 'normal');
    
    const balances = [];
    if (user.usd !== undefined && user.usd > 0) balances.push(`USD: $${user.usd.toLocaleString('en-US', { minimumFractionDigits: 2 })}`);
    if (user.usdt !== undefined && user.usdt > 0) balances.push(`USDT: ${user.usdt.toFixed(2)}`);
    if (user.btc !== undefined && user.btc > 0) balances.push(`BTC: ${user.btc.toFixed(8)}`);
    if (user.eth !== undefined && user.eth > 0) balances.push(`ETH: ${user.eth.toFixed(6)}`);
    if (user.bnb !== undefined && user.bnb > 0) balances.push(`BNB: ${user.bnb.toFixed(6)}`);
    if (user.ltc !== undefined && user.ltc > 0) balances.push(`LTC: ${user.ltc.toFixed(6)}`);
    
    if (balances.length > 0) {
      doc.text(balances.join('  |  '), marginLeft + 5, y);
    } else {
      doc.text('Sin saldos registrados', marginLeft + 5, y);
    }
  }

  const boxEndY2 = y + 8;
  
  // Dibujar caja alrededor de información de cuenta
  doc.setDrawColor(200, 215, 230);
  doc.roundedRect(marginLeft, boxStartY2, contentWidth, boxEndY2 - boxStartY2, 2, 2, 'S');

  // ===================== PÁGINA 2 =====================
  doc.addPage();
  y = 25;

  // Encabezado página 2
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(10, 40, 80);
  doc.text('QUANTUM LEDGER BUSINESS BANK', centerX, y, { align: 'center' });
  
  y += 8;
  doc.setDrawColor(10, 40, 80);
  doc.setLineWidth(0.5);
  doc.line(marginLeft, y, marginRight, y);

  // ===================== DECLARACIÓN =====================
  y += 20;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(10, 40, 80);
  doc.text('DECLARACIÓN', marginLeft, y);

  y += 12;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(40);

  const declaration = 'La cuenta se encuentra registrada a nombre exclusivo del titular antes descrito y está plenamente operativa para la realización de depósitos, transferencias, retiros y demás transacciones autorizadas conforme a la normativa interna y regulaciones financieras aplicables.';
  const declLines = doc.splitTextToSize(declaration, contentWidth);
  doc.text(declLines, marginLeft, y);

  // ===================== VALIDEZ =====================
  y += declLines.length * 6 + 20;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(10, 40, 80);
  doc.text('VALIDEZ DEL DOCUMENTO', marginLeft, y);

  y += 12;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(40);
  doc.text('La presente constancia se expide a solicitud del interesado, para los fines que estime', marginLeft, y);
  y += 6;
  doc.text('convenientes, incluyendo pero no limitándose a:', marginLeft, y);

  y += 12;
  const uses = [
    'Trámites corporativos y empresariales',
    'Procesos consulares o migratorios', 
    'Verificación de solvencia económica',
    'Presentación ante empresas u organismos receptores'
  ];
  
  uses.forEach((use) => {
    doc.text(`•  ${use}`, marginLeft + 10, y);
    y += 8;
  });

  y += 10;
  const verify = 'Se certifica que la información contenida en este documento es veraz, comprobable y puede ser verificada por la entidad receptora mediante el número de referencia indicado o a través de los canales oficiales del banco.';
  const verifyLines = doc.splitTextToSize(verify, contentWidth);
  doc.text(verifyLines, marginLeft, y);

  // ===================== FECHA DE EMISIÓN =====================
  y += verifyLines.length * 6 + 20;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(40);
  doc.text(`Fecha de emisión: ${currentDate}`, marginRight, y, { align: 'right' });

  // ===================== PIE DE PÁGINA =====================
  doc.setDrawColor(10, 40, 80);
  doc.setLineWidth(0.5);
  doc.line(marginLeft, pageHeight - 20, marginRight, pageHeight - 20);

  doc.setFontSize(8);
  doc.setTextColor(120);
  doc.setFont('helvetica', 'normal');
  doc.text('Documento electrónico con validez legal.', centerX, pageHeight - 14, { align: 'center' });
  doc.text(`Folio: ${refNumber}  |  Cuenta: ${user.account_number || 'N/A'}  |  Ruta: ${user.routing_number || 'N/A'}`, centerX, pageHeight - 9, { align: 'center' });

  // Guardar
  doc.save(`Constancia_${user.full_name.replace(/\s+/g, '_')}.pdf`);
};
