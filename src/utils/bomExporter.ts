import { LetterheadTemplateConfig } from '../types';

export interface BomExportItem {
  role: string;
  name: string;
  model: string;
  sku: string;
  qty: number;
  unitPrice: number | null;
  lineTotal: number | null;
  warrantyText?: string;
  specs?: string;
}

export interface BomExportData {
  referenceNumber: string;
  issueDate: string;
  validUntilDate: string;
  systemArch: string;
  cameraCount: number;
  cameraCategory?: string;
  formFactor: string;
  nightVision: string;
  storageOption: string;
  cableLengthMeters?: number;
  items: BomExportItem[];
  totalPrice: number | null;
  pricedSubtotal: number;
  unpricedCount: number;
  quotationReason?: string | null;
  customer?: {
    name?: string;
    phone?: string;
    email?: string;
    company?: string;
    address?: string;
    district?: string;
    thana?: string;
  };
}

export const DEFAULT_LETTERHEAD: LetterheadTemplateConfig = {
  id: 'tmpl-camnex-default',
  name: 'Official CamneX Bangladesh Letterhead',
  isDefault: true,
  companyName: 'CamneX Bangladesh',
  tagline: 'Certified Security Systems Integrator & Authorized Hikvision Partner',
  phone: '+880 1317-251000',
  email: 'info@camnexbd.com',
  website: 'https://camnexbd.com',
  address: 'Block A, Chandrima Model Town, Main Rd, Dhaka 1207, Bangladesh',
  primaryColor: '#F15A24',
  secondaryColor: '#111827',
  validityDays: 7,
  disclaimerText: 'Prices are in BDT and valid for 7 calendar days. 10m/camera cable allocation standard included. Site conduit piping and physical installation quoted separately.'
};

/**
 * Generates an official, print-ready, professional HTML/PDF document with CamneX Letterhead.
 */
export function generateLetterheadHtml(data: BomExportData, template: LetterheadTemplateConfig = DEFAULT_LETTERHEAD): string {
  const isQuoteRequired = data.totalPrice === null || data.unpricedCount > 0;
  const archLabel = data.systemArch === 'ip' ? 'IP PoE Digital Network' : data.systemArch === 'wireless' ? 'Wi-Fi Smart Wireless' : 'Analogue Turbo HD';
  const nvLabel = data.nightVision === 'ir' ? 'Pure Infrared (IR)' : data.nightVision === 'hybrid' ? 'Smart Hybrid Light' : 'Full Color (ColorVu)';

  const itemRows = data.items.map((item, idx) => {
    const priceStr = item.lineTotal !== null ? `৳${item.lineTotal.toLocaleString()} BDT` : '<span style="color:#D97706;font-weight:700;">Quote Required</span>';
    const unitStr = item.unitPrice !== null ? `৳${item.unitPrice.toLocaleString()}` : '—';
    const warrantyBadge = item.warrantyText ? `<span style="display:inline-block;padding:2px 8px;border-radius:9999px;font-size:10px;background-color:#ECFDF5;color:#065F46;border:1px solid #A7F3D0;font-weight:600;">${item.warrantyText}</span>` : '—';

    return `
      <tr style="border-bottom: 1px solid #E5E7EB; background-color: ${idx % 2 === 0 ? '#FFFFFF' : '#F9FAFB'};">
        <td style="padding: 10px 12px; font-size: 11px; color: #6B7280; font-family: monospace;">${idx + 1}</td>
        <td style="padding: 10px 12px; text-align: left;">
          <div style="font-weight: 700; color: #111827; font-size: 12px;">${escapeHtml(item.name)}</div>
          <div style="font-size: 11px; color: #4B5563; margin-top: 2px;">
            <span style="font-family: monospace; font-weight: 600; color: #F15A24;">Model: ${escapeHtml(item.model)}</span>
            <span style="color: #9CA3AF; margin: 0 4px;">|</span>
            <span style="color: #6B7280;">SKU: ${escapeHtml(item.sku)}</span>
          </div>
          ${item.specs ? `<div style="font-size: 10.5px; color: #6B7280; margin-top: 3px; font-style: italic;">${escapeHtml(item.specs)}</div>` : ''}
        </td>
        <td style="padding: 10px 12px; text-align: center; font-weight: 700; color: #111827; font-size: 12px;">${item.qty}</td>
        <td style="padding: 10px 12px; text-align: right; font-size: 11.5px; color: #374151;">${unitStr}</td>
        <td style="padding: 10px 12px; text-align: right; font-size: 12px; font-weight: 700; color: #111827;">${priceStr}</td>
        <td style="padding: 10px 12px; text-align: center;">${warrantyBadge}</td>
      </tr>
    `;
  }).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>CamneX Bill of Materials — ${escapeHtml(data.referenceNumber)}</title>
  <style>
    @page {
      size: A4;
      margin: 15mm 15mm 15mm 15mm;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #111827;
      background: #FFFFFF;
      margin: 0;
      padding: 24px;
      line-height: 1.45;
      font-size: 12px;
    }
    .header-bar {
      border-top: 6px solid #F15A24;
      padding-top: 16px;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 24px;
      border-bottom: 2px solid #111827;
      padding-bottom: 16px;
    }
    .company-title {
      font-size: 24px;
      font-weight: 900;
      letter-spacing: -0.5px;
      color: #111827;
      margin: 0;
    }
    .company-title span {
      color: #F15A24;
    }
    .tagline {
      font-size: 11px;
      font-weight: 600;
      color: #4B5563;
      margin-top: 3px;
    }
    .contact-info {
      font-size: 11px;
      color: #4B5563;
      line-height: 1.4;
      text-align: right;
    }
    .doc-badge {
      display: inline-block;
      padding: 4px 10px;
      background-color: #111827;
      color: #FFFFFF;
      font-weight: 800;
      font-size: 11px;
      letter-spacing: 0.5px;
      text-transform: uppercase;
      border-radius: 4px;
      margin-bottom: 6px;
    }
    .meta-box {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      background-color: #F9FAFB;
      border: 1px solid #E5E7EB;
      border-radius: 8px;
      padding: 14px 16px;
      margin-bottom: 20px;
    }
    .meta-group {
      font-size: 11.5px;
    }
    .meta-group strong {
      color: #111827;
      display: inline-block;
      min-width: 140px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 12px;
      font-size: 11.5px;
    }
    th {
      background-color: #111827;
      color: #FFFFFF;
      font-weight: 700;
      text-transform: uppercase;
      font-size: 10.5px;
      letter-spacing: 0.5px;
      padding: 10px 12px;
    }
    .summary-card {
      margin-top: 20px;
      padding: 16px;
      background-color: #F8FAFC;
      border: 1px solid #E2E8F0;
      border-radius: 8px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .total-highlight {
      font-size: 22px;
      font-weight: 900;
      color: #F15A24;
    }
    .footer-note {
      margin-top: 28px;
      padding-top: 14px;
      border-top: 1px solid #E5E7EB;
      font-size: 10px;
      color: #6B7280;
      line-height: 1.5;
      text-align: center;
    }
    @media print {
      body { padding: 0; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <!-- Header with Letterhead -->
  <div class="header-bar">
    <div>
      <h1 class="company-title">Camne<span>X</span> Bangladesh</h1>
      <div class="tagline">${escapeHtml(template.tagline)}</div>
      <div style="font-size: 11px; color: #6B7280; margin-top: 4px;">
        ${escapeHtml(template.address)}
      </div>
    </div>
    <div class="contact-info">
      <div class="doc-badge">Technical Bill of Materials</div>
      <div><strong>Hotline:</strong> ${escapeHtml(template.phone)}</div>
      <div><strong>Email:</strong> ${escapeHtml(template.email)}</div>
      <div><strong>Web:</strong> ${escapeHtml(template.website)}</div>
    </div>
  </div>

  <!-- Document Meta & System Configuration -->
  <div class="meta-box">
    <div class="meta-group">
      <div><strong>Document Ref:</strong> <span style="font-family: monospace; font-weight: 700; color: #F15A24;">${escapeHtml(data.referenceNumber)}</span></div>
      <div><strong>Issue Date:</strong> ${escapeHtml(data.issueDate)}</div>
      <div><strong>Price Validity:</strong> <span style="color: #059669; font-weight: 700;">7 Calendar Days (Valid Until ${escapeHtml(data.validUntilDate)})</span></div>
      <div><strong>System Architecture:</strong> ${escapeHtml(archLabel)}</div>
    </div>
    <div class="meta-group">
      <div><strong>Camera Deployment:</strong> ${data.cameraCount}x Cameras (${escapeHtml(data.formFactor.toUpperCase())})</div>
      <div><strong>Night Vision Mode:</strong> ${escapeHtml(nvLabel)}</div>
      <div><strong>Recording Storage:</strong> ${escapeHtml(data.storageOption.toUpperCase())} Surveillance Grade</div>
      ${data.customer?.name ? `<div><strong>Client Name:</strong> ${escapeHtml(data.customer.name)}</div>` : ''}
    </div>
  </div>

  <!-- Itemized BOM Table -->
  <table>
    <thead>
      <tr>
        <th style="width: 32px; text-align: center;">#</th>
        <th style="text-align: left;">Item Description & Specifications</th>
        <th style="width: 48px; text-align: center;">Qty</th>
        <th style="width: 90px; text-align: right;">Unit Price</th>
        <th style="width: 100px; text-align: right;">Line Total</th>
        <th style="width: 120px; text-align: center;">Warranty</th>
      </tr>
    </thead>
    <tbody>
      ${itemRows}
    </tbody>
  </table>

  <!-- Pricing Financial Summary -->
  <div class="summary-card">
    <div style="font-size: 11px; color: #4B5563; max-width: 460px;">
      <strong style="color: #111827; display: block; margin-bottom: 2px;">Warranty & Installation Policy:</strong>
      All Western Digital Purple and Seagate SkyHawk HDDs include 3-Year Official Replacement Warranty. Cameras & Recorders include 1–2 Year Official Warranty. Cable runs include 10m/camera copper standard.
    </div>
    <div style="text-align: right;">
      <div style="font-size: 11px; text-transform: uppercase; font-weight: 700; color: #6B7280;">
        ${isQuoteRequired ? 'Priced Hardware Subtotal' : 'Turnkey Hardware Total'}
      </div>
      <div class="total-highlight">
        ৳${(data.totalPrice !== null ? data.totalPrice : data.pricedSubtotal).toLocaleString()} BDT
      </div>
      ${isQuoteRequired ? `<div style="font-size: 11px; font-weight: 700; color: #D97706;">+ ${data.unpricedCount} Custom Item(s) Pending Technical Survey</div>` : `<div style="font-size: 10px; color: #059669; font-weight: 700;">✓ Guaranteed Turnkey Equipment Total</div>`}
    </div>
  </div>

  <!-- Disclaimers and Footer -->
  <div class="footer-note">
    <p style="margin: 0 0 4px 0;"><strong>Official Notice:</strong> ${escapeHtml(template.disclaimerText)}</p>
    <p style="margin: 0;">CamneX Bangladesh · Corporate Office: Dhaka, Bangladesh · Authorized Surveillance Engineering · Support: ${escapeHtml(template.phone)}</p>
  </div>
</body>
</html>`;
}

function escapeHtml(str: string = ''): string {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Generates an official plain-text BOM export.
 */
export function generateBomText(data: BomExportData, template: LetterheadTemplateConfig = DEFAULT_LETTERHEAD): string {
  const lines = [
    '================================================================================',
    `${template.companyName.toUpperCase()} — OFFICIAL TECHNICAL BILL OF MATERIALS (BOM)`,
    template.tagline,
    `Corporate Office: ${template.address} | Hotline: ${template.phone} | Web: ${template.website}`,
    '================================================================================',
    `Reference Number   : ${data.referenceNumber}`,
    `Date of Issue      : ${data.issueDate}`,
    `BOM Validity       : 7 Calendar Days (Valid Until: ${data.validUntilDate})`,
    `System Architecture: ${data.systemArch === 'ip' ? 'IP Network (PoE Digital)' : data.systemArch === 'wireless' ? 'Wi-Fi Smart Wireless' : 'Analogue Turbo HD'}`,
    `Camera Quantity    : ${data.cameraCount} Cameras (${data.formFactor.toUpperCase()})`,
    `Night Vision Mode  : ${data.nightVision === 'ir' ? 'Pure Infrared (IR)' : data.nightVision === 'hybrid' ? 'Smart Hybrid Light' : 'Full Color (ColorVu)'}`,
    `Recording Storage  : ${data.storageOption.toUpperCase()} Surveillance Grade HDD`,
    '--------------------------------------------------------------------------------',
    'ITEMIZED HARDWARE BREAKDOWN:',
    '--------------------------------------------------------------------------------'
  ];

  data.items.forEach((item, idx) => {
    const priceStr = item.lineTotal !== null ? `৳${item.lineTotal.toLocaleString()} BDT` : 'Quotation Required';
    const unitStr = item.unitPrice !== null ? `(@ ৳${item.unitPrice.toLocaleString()}/ea)` : '(Price on quotation)';
    lines.push(`${idx + 1}. [${item.role}] ${item.name}`);
    lines.push(`   Model: ${item.model} | SKU: ${item.sku}`);
    lines.push(`   Quantity: ${item.qty} ${unitStr} -> Line Total: ${priceStr}`);
    if (item.specs) lines.push(`   Specs: ${item.specs}`);
    if (item.warrantyText) lines.push(`   Warranty: ${item.warrantyText}`);
    lines.push('');
  });

  lines.push('--------------------------------------------------------------------------------');
  lines.push(`TOTAL CONFIRMED EQUIPMENT PRICE: ${data.totalPrice !== null ? `৳${data.totalPrice.toLocaleString()} BDT` : `৳${data.pricedSubtotal.toLocaleString()} BDT (+ ${data.unpricedCount} custom quote items)`}`);
  lines.push('--------------------------------------------------------------------------------');
  lines.push(`NOTE: ${template.disclaimerText}`);
  lines.push('================================================================================');

  return lines.join('\n');
}

/**
 * Downloads the professional BOM in PDF or DOCX format.
 */
export function downloadBomDocument(
  data: BomExportData,
  template: LetterheadTemplateConfig = DEFAULT_LETTERHEAD,
  format: 'pdf' | 'docx' | 'txt' = 'pdf'
): boolean {
  try {
    const cleanRef = data.referenceNumber.replace(/[^a-zA-Z0-9_-]/g, '_');
    const filename = `CamneX-BOM-${data.cameraCount}C-${cleanRef}`;

    if (format === 'txt') {
      const text = generateBomText(data, template);
      const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${filename}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      return true;
    }

    if (format === 'docx') {
      // Professional Word document export using standard Office HTML container
      const htmlContent = generateLetterheadHtml(data, template);
      const wordDocument = `
        <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
        <head><title>CamneX BOM</title></head>
        <body>${htmlContent}</body>
        </html>
      `;
      const blob = new Blob(['\ufeff', wordDocument], {
        type: 'application/msword;charset=utf-8'
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${filename}.doc`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      return true;
    }

    // PDF format: Create print-ready window or standard PDF blob
    const html = generateLetterheadHtml(data, template);
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    
    // Also trigger file download for direct file saving
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    return true;
  } catch (err) {
    console.error('Failed to export BOM document:', err);
    return false;
  }
}
