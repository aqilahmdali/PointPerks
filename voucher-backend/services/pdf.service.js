const PDFDocument = require('pdfkit');

/**
 * Generate a voucher PDF as a buffer (matches PDFVoucherPage.jsx design)
 */
const generateVoucherPDF = (redemption, user, voucher) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 16 });
      const chunks = [];

      // Design tokens (match PDFVoucherPage.jsx)
      const C = {
        primary: '#022448',
        primaryContainer: '#1e3a5f',
        secondaryContainer: '#ffc641',
        onSecondaryContainer: '#715300',
        surface: '#f9f9f8',
        surfaceLow: '#f4f4f3',
        surfaceContainer: '#eeeeed',
        surfaceLowest: '#ffffff',
        outlineVariant: '#c4c6cf',
        onSurface: '#1a1c1c',
        onSurfaceVariant: '#43474e',
        onPrimary: '#ffffff',
        error: '#ba1a1a',
        success: '#386a20',
        successBg: '#c4f0c4',
      };

      // Extract data with fallbacks
      const v = voucher || redemption.voucherSnapshot || {};
      const code = redemption.redemptionCode || 'N/A';
      const qrData = redemption.qrCodeData || '';
      const merchant = v.merchant || 'Merchant';
      const discount = v.discountType === 'percentage'
        ? `${v.discountValue}% OFF`
        : `RM${v.discountValue} OFF`;
      const issuedDate = new Date(redemption.createdAt).toLocaleDateString('en-MY', { year: 'numeric', month: 'short', day: 'numeric' });
      const expiresDate = new Date(redemption.expiresAt).toLocaleDateString('en-MY', { year: 'numeric', month: 'short', day: 'numeric' }).toUpperCase();
      const statusLabel = redemption.status ? redemption.status.charAt(0).toUpperCase() + redemption.status.slice(1) : 'Active';
      const statusBg = redemption.status === 'used' ? C.surfaceContainer : (redemption.status === 'active' ? C.successBg : '#ffdad6');
      const statusColor = redemption.status === 'used' ? C.onSurfaceVariant : (redemption.status === 'active' ? C.success : C.error);
      const terms = v.terms || 'Non-refundable and cannot be exchanged for cash. Single use only. PointPerks is not responsible for lost or stolen codes.';

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Page background
      doc.rect(0, 0, doc.page.width, doc.page.height).fill(C.surfaceLow);

      // Main container dimensions (matching frontend 800px max-width)
      const pageWidth = doc.page.width - 32;
      const containerX = 16;
      const containerY = 16;

      // Two-column layout: left 33%, right 67%
      const stubWidth = pageWidth * 0.33;
      const valueWidth = pageWidth * 0.67;

      // ═══ LEFT COLUMN: STUB ═══
      doc.rect(containerX, containerY, stubWidth, 500).fill(C.primaryContainer);

      // Brand header
      doc.fillColor(C.onPrimary).font('Helvetica-Bold').fontSize(14).text('PointPerks', containerX + 20, containerY + 16, { width: stubWidth - 40 });

      // Merchant visual area (placeholder circle with QR-like pattern)
      const circleX = containerX + stubWidth / 2;
      const circleY = containerY + 100;
      const circleRadius = 45;
      doc.circle(circleX, circleY, circleRadius).fill(C.surfaceLowest).stroke(C.secondaryContainer);

      // Simple dot pattern inside circle (QR-like placeholder)
      doc.fillColor(C.primary);
      for (let i = 0; i < 5; i++) {
        for (let j = 0; j < 5; j++) {
          if (Math.random() > 0.3) {
            doc.circle(circleX - 30 + i * 15, circleY - 30 + j * 15, 2).fill();
          }
        }
      }

      // Merchant name
      doc.fillColor(C.onPrimary).font('Helvetica-Bold').fontSize(16).text(merchant, containerX + 20, circleY + circleRadius + 16, { width: stubWidth - 40, align: 'center' });

      // Discount badge
      const badgeY = circleY + circleRadius + 50;
      doc.rect(containerX + stubWidth / 2 - 40, badgeY, 80, 20).fill(C.secondaryContainer);
      doc.fillColor(C.onSecondaryContainer).font('Helvetica-Bold').fontSize(10).text(discount, containerX + stubWidth / 2 - 40, badgeY + 4, { width: 80, align: 'center' });

      // Issued date footer
      doc.fillColor(C.onPrimary).font('Helvetica').fontSize(10).text(`Issued: ${issuedDate}`, containerX + 20, containerY + 430, { width: stubWidth - 40, align: 'center' });

      // Verified icon (simple text placeholder)
      doc.font('Helvetica').fontSize(8).fillColor(C.onPrimary).text('✓ VERIFIED', containerX + 20, containerY + 455, { width: stubWidth - 40, align: 'center' });

      // ═══ RIGHT COLUMN: VALUE SIDE ═══
      const rightX = containerX + stubWidth;
      doc.rect(rightX, containerY, valueWidth, 500).fill(C.surfaceLowest);

      // Dashed line separator between columns
      doc.lineWidth(0.5).dash(2, { space: 2 }).strokeColor(C.outlineVariant);
      doc.moveTo(rightX, containerY).lineTo(rightX, containerY + 500).stroke().undash();

      // Header row: Code + Status | Expires
      const headerPadding = 20;
      doc.fillColor(C.onSurfaceVariant).font('Helvetica').fontSize(9).text('VOUCHER NUMBER', rightX + headerPadding, containerY + 16);
      doc.fillColor(C.primary).font('Helvetica-Bold').fontSize(18).text(code, rightX + headerPadding, containerY + 30, { width: valueWidth - 80 });

      // Status badge (below code)
      doc.rect(rightX + headerPadding, containerY + 55, 60, 16).fill(statusBg);
      doc.fillColor(statusColor).font('Helvetica-Bold').fontSize(8).text(statusLabel, rightX + headerPadding, containerY + 57, { width: 60, align: 'center' });

      // Expires (top right)
      doc.fillColor(C.onSurfaceVariant).font('Helvetica').fontSize(9).text('EXPIRES', rightX + valueWidth - headerPadding - 80, containerY + 16, { align: 'right' });
      doc.fillColor(C.error).font('Helvetica-Bold').fontSize(12).text(expiresDate, rightX + valueWidth - headerPadding - 80, containerY + 30, { width: 80, align: 'right' });

      // QR Section
      const qrY = containerY + 90;
      doc.rect(rightX + headerPadding, qrY, valueWidth - (2 * headerPadding), 140).fill(C.surfaceContainer).stroke(C.outlineVariant);

      const qrBoxX = rightX + headerPadding + 10;
      const qrBoxY = qrY + 10;
      const qrBoxSize = 80;
      doc.rect(qrBoxX, qrBoxY, qrBoxSize, qrBoxSize).fill(C.surfaceLowest).stroke(C.primary);

      // QR Code image or placeholder
      if (qrData && qrData.startsWith('data:image')) {
        try {
          const imgBuffer = Buffer.from(qrData.split(',')[1], 'base64');
          doc.image(imgBuffer, qrBoxX + 2, qrBoxY + 2, { width: qrBoxSize - 4, height: qrBoxSize - 4 });
        } catch (e) {
          // Fallback: dot pattern
          doc.fillColor(C.primary);
          for (let i = 0; i < 5; i++) {
            for (let j = 0; j < 5; j++) {
              if (Math.random() > 0.3) {
                doc.circle(qrBoxX + 12 + i * 12, qrBoxY + 12 + j * 12, 1.5).fill();
              }
            }
          }
        }
      }

      // QR text description
      doc.fillColor(C.onSurfaceVariant).font('Helvetica').fontSize(9).text('Scan at checkout point-of-sale', qrBoxX + qrBoxSize + 10, qrBoxY + 20, { width: valueWidth - headerPadding - qrBoxSize - 30 });

      // Dashed separator
      const separatorY = qrY + 150;
      doc.lineWidth(0.5).dash(2, { space: 2 }).strokeColor(C.outlineVariant);
      doc.moveTo(rightX + headerPadding, separatorY).lineTo(rightX + valueWidth - headerPadding, separatorY).stroke().undash();

      // Instructions grid (How to Use | Terms)
      const gridY = separatorY + 15;
      const gridHeight = 90;
      const gridColWidth = (valueWidth - (3 * headerPadding)) / 2;

      // Left grid cell: How to Use
      doc.rect(rightX + headerPadding, gridY, gridColWidth, gridHeight).fill(C.surfaceLow).stroke(C.outlineVariant);
      doc.fillColor(C.primary).font('Helvetica-Bold').fontSize(10).text('HOW TO USE', rightX + headerPadding + 10, gridY + 8);
      doc.fillColor(C.onSurfaceVariant).font('Helvetica').fontSize(8).text(
        '1. Present this PDF or printed copy.\n2. Ask the cashier to scan the QR code.\n3. Valid for in-store purchases only.',
        rightX + headerPadding + 10, gridY + 26, { width: gridColWidth - 20, lineGap: 2 }
      );

      // Right grid cell: Terms
      doc.rect(rightX + headerPadding + gridColWidth + 10, gridY, gridColWidth, gridHeight).fill(C.surfaceLow).stroke(C.outlineVariant);
      doc.fillColor(C.primary).font('Helvetica-Bold').fontSize(10).text('TERMS', rightX + headerPadding + gridColWidth + 20, gridY + 8);
      doc.fillColor(C.onSurfaceVariant).font('Helvetica').fontSize(8).text(
        terms,
        rightX + headerPadding + gridColWidth + 20, gridY + 26, { width: gridColWidth - 20, lineGap: 2 }
      );

      // Footer: Verification Hash
      const footerY = gridY + gridHeight + 15;
      doc.fillColor(C.onSurfaceVariant).font('Helvetica').fontSize(8).text('Verification Hash', rightX + headerPadding, footerY);
      const idStr = redemption._id?.toString() || '';
      doc.font('Courier').fontSize(7).fillColor(C.outlineVariant).text(`SHA256: ${idStr.slice(0, 8)}...${idStr.slice(-5)}`, rightX + headerPadding, footerY + 12);

      // Footer: Powered by PointPerks
      doc.fillColor(C.onSurfaceVariant).font('Helvetica').fontSize(8).text('Powered by PointPerks', rightX + valueWidth - headerPadding, footerY, { align: 'right' });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};

module.exports = { generateVoucherPDF };
