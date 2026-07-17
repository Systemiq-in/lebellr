import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';
import { 
  LayoutConfig, 
  Layer, 
  InventoryRow, 
  ColumnMapping,
  BorderLayer,
  TextLayer,
  BarcodeLayer,
  QrLayer,
  PricingLayer,
  ComplianceLayer,
  SafetyLayer
} from './types';
import { generateBarcodeVectors, validateBarcode } from './barcode';

// String token interpolation: e.g. "SKU: {{sku}}" -> "SKU: 12345"
export function interpolateTokens(template: string, row: InventoryRow, mapping: ColumnMapping): string {
  if (!template) return '';
  return template.replace(/\{\{([^}]+)\}\}/g, (match, tokenName) => {
    const trimmed = tokenName.trim();
    // 1. Try to find the token in the column mapping
    const mappedHeader = mapping[trimmed] || trimmed;
    // 2. Look up the value in the row
    const value = row[mappedHeader] !== undefined ? row[mappedHeader] : row[trimmed];
    return value !== undefined ? String(value) : '';
  });
}

// Convert point font size to physical units (mm or inches)
function ptToUnit(pt: number, unit: 'mm' | 'in'): number {
  const inches = pt / 72;
  return unit === 'mm' ? inches * 25.4 : inches;
}

// Helper to draw a polygon using path operations
function drawPDFPolygon(doc: jsPDF, points: { x: number; y: number }[], style: 'F' | 'FD' | 'D' = 'D') {
  if (points.length < 3) return;
  doc.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) {
    doc.lineTo(points[i].x, points[i].y);
  }
  doc.lineTo(points[0].x, points[0].y);
  if (style === 'FD') {
    doc.fillStroke();
  } else if (style === 'F') {
    doc.fill();
  } else {
    doc.stroke();
  }
}

// Helper to draw a GHS pictogram vector
function drawGHSDiamond(doc: jsPDF, x: number, y: number, size: number, type: string) {
  // 1. Draw Red Diamond border
  doc.setDrawColor('#FF0000');
  doc.setLineWidth(size * 0.08); // 8% thickness
  doc.setFillColor('#FFFFFF');
  
  const half = size / 2;
  // Draw diamond polygon: Top, Right, Bottom, Left
  drawPDFPolygon(
    doc,
    [
      { x: x + half, y: y },
      { x: x + size, y: y + half },
      { x: x + half, y: y + size },
      { x: x, y: y + half }
    ],
    'FD' // Fill and stroke
  );

  // 2. Draw black symbol inside (simplified vector shapes)
  doc.setFillColor('#000000');
  doc.setDrawColor('#000000');
  doc.setLineWidth(size * 0.03);

  const cx = x + half;
  const cy = y + half;
  const s = size * 0.35; // inner boundary scale

  if (type === 'exclamation') {
    // Exclamation mark: vertical bar & dot
    doc.rect(cx - size * 0.03, cy - s * 0.7, size * 0.06, s * 0.8, 'F');
    doc.circle(cx, cy + s * 0.5, size * 0.04, 'F');
  } else if (type === 'flame') {
    // Flame shape: three overlapping triangles/shapes
    drawPDFPolygon(doc, [
      { x: cx, y: cy - s },
      { x: cx - s * 0.5, y: cy + s * 0.2 },
      { x: cx - s * 0.2, y: cy + s * 0.6 },
      { x: cx + s * 0.2, y: cy + s * 0.6 },
      { x: cx + s * 0.5, y: cy + s * 0.2 }
    ], 'F');
    // Accent flame
    doc.setFillColor('#FFFFFF');
    drawPDFPolygon(doc, [
      { x: cx, y: cy - s * 0.3 },
      { x: cx - s * 0.25, y: cy + s * 0.3 },
      { x: cx + s * 0.25, y: cy + s * 0.3 }
    ], 'F');
  } else if (type === 'skull') {
    // Skull: circle and crossbones
    // Crossbones
    doc.line(cx - s, cy - s, cx + s, cy + s);
    doc.line(cx + s, cy - s, cx - s, cy + s);
    // Skull head
    doc.circle(cx, cy - s * 0.1, s * 0.45, 'F');
    // Jaw
    doc.rect(cx - s * 0.2, cy + s * 0.25, s * 0.4, s * 0.25, 'F');
    // Eye holes (white)
    doc.setFillColor('#FFFFFF');
    doc.circle(cx - s * 0.15, cy - s * 0.1, s * 0.1, 'F');
    doc.circle(cx + s * 0.15, cy - s * 0.1, s * 0.1, 'F');
  } else if (type === 'corrosive') {
    // Corrosive: surface line, pouring tubes
    // Surface
    doc.line(cx - s, cy + s * 0.4, cx + s, cy + s * 0.4);
    // Pouring tubes
    doc.line(cx - s * 0.6, cy - s * 0.6, cx - s * 0.2, cy);
    doc.line(cx + s * 0.6, cy - s * 0.6, cx + s * 0.2, cy);
    // Droplet circles
    doc.circle(cx - s * 0.15, cy + s * 0.1, s * 0.08, 'F');
    doc.circle(cx + s * 0.15, cy + s * 0.1, s * 0.08, 'F');
  } else if (type === 'health') {
    // Health Hazard: torso silhouette with exploding star
    // Torso outline
    doc.circle(cx, cy - s * 0.4, s * 0.25, 'F'); // head
    drawPDFPolygon(doc, [
      { x: cx - s * 0.5, y: cy + s * 0.6 },
      { x: cx + s * 0.5, y: cy + s * 0.6 },
      { x: cx + s * 0.3, y: cy - s * 0.1 },
      { x: cx - s * 0.3, y: cy - s * 0.1 }
    ], 'F');
    // Star (white cut out)
    doc.setFillColor('#FFFFFF');
    doc.circle(cx, cy + s * 0.1, s * 0.15, 'F');
  } else if (type === 'environment') {
    // Environment: dead fish and tree
    // Tree trunk
    doc.rect(cx + s * 0.2, cy - s * 0.5, s * 0.15, s * 0.9, 'F');
    // Leaves
    drawPDFPolygon(doc, [
      { x: cx + s * 0.28, y: cy - s * 0.8 },
      { x: cx + s * 0.05, y: cy - s * 0.4 },
      { x: cx + s * 0.5, y: cy - s * 0.4 }
    ], 'F');
    // Fish body
    doc.ellipse(cx - s * 0.3, cy + s * 0.3, s * 0.3, s * 0.15, 'F');
    // Tail
    drawPDFPolygon(doc, [
      { x: cx, y: cy + s * 0.15 },
      { x: cx - s * 0.1, y: cy + s * 0.3 },
      { x: cx, y: cy + s * 0.45 }
    ], 'F');
  } else if (type === 'gas') {
    // Gas cylinder: cylinder bottle shape
    doc.rect(cx - s * 0.2, cy - s * 0.6, s * 0.4, s * 1.1, 'F');
    doc.circle(cx, cy - s * 0.6, s * 0.2, 'F');
  }
}

// Generate the print document
export async function generateLabelsPDF(
  layout: LayoutConfig,
  layers: Layer[],
  rows: InventoryRow[],
  mapping: ColumnMapping
): Promise<jsPDF> {
  const isThermal = layout.preset.startsWith('thermal');
  
  // 1. Determine Page Dimensions
  // If thermal, page size matches label size exactly
  // If sheet, page size is standard A4 or A3
  let pageFormat: string | number[] = 'a4';
  let orientation: 'p' | 'l' = 'p';

  if (isThermal) {
    pageFormat = [layout.width, layout.height];
    orientation = layout.width > layout.height ? 'l' : 'p';
  } else {
    pageFormat = layout.preset === 'avery_2_5' || layout.preset === 'avery_3_10' || layout.preset === 'custom' 
      ? 'a4' 
      : 'a4'; // standard fallback
    // We can also allow customized page sizes. For sheets, we force A4 portrait for simplicity or match preset.
  }

  // Create jsPDF instance
  const doc = new jsPDF({
    orientation: orientation,
    unit: layout.unit,
    format: pageFormat
  });

  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();

  // Grid calculation for sheet labels
  const labelW = layout.width;
  const labelH = layout.height;
  const margin = layout.margin;
  const cols = layout.cols;
  const rowsCount = layout.rows;
  const colGap = layout.colGap;
  const rowGap = layout.rowGap;

  const labelsPerPage = isThermal ? 1 : cols * rowsCount;

  // Compile copies based on Quantity column
  const expandedRows: InventoryRow[] = [];
  rows.forEach((row) => {
    const qtyHeader = mapping.quantity;
    const qtyVal = parseInt(row[qtyHeader] || row['quantity'] || '1', 10);
    const copies = isNaN(qtyVal) || qtyVal < 1 ? 1 : qtyVal;
    for (let c = 0; c < copies; c++) {
      expandedRows.push(row);
    }
  });

  if (expandedRows.length === 0) {
    // Add dummy blank page if no rows
    return doc;
  }

  // Draw loop
  let currentItemIndex = 0;
  let pageNumber = 0;

  while (currentItemIndex < expandedRows.length) {
    if (pageNumber > 0) {
      doc.addPage(pageFormat, orientation);
    }
    pageNumber++;

    // Draw crop marks at corners if enabled (only for sheets)
    if (!isThermal && layout.printCropMarks) {
      doc.setDrawColor('#94a3b8');
      doc.setLineWidth(0.1);
      
      const size = 5; // length of mark lines in mm/in
      
      // Top-Left Margin Corner
      doc.line(margin, margin - size, margin, margin + size);
      doc.line(margin - size, margin, margin + size, margin);

      // Top-Right Margin Corner
      const trX = pageW - margin;
      doc.line(trX, margin - size, trX, margin + size);
      doc.line(trX - size, margin, trX + size, margin);

      // Bottom-Left Margin Corner
      const blY = pageH - margin;
      doc.line(margin, blY - size, margin, blY + size);
      doc.line(margin - size, blY, margin + size, blY);

      // Bottom-Right Margin Corner
      const brX = pageW - margin;
      const brY = pageH - margin;
      doc.line(brX, brY - size, brX, brY + size);
      doc.line(brX - size, brY, brX + size, brY);
    }

    if (isThermal) {
      // Thermal Roll: exactly 1 label per page, no margins/offsets
      const row = expandedRows[currentItemIndex];
      await drawSingleLabel(doc, 0, 0, labelW, labelH, layers, row, mapping, layout.unit);
      currentItemIndex++;
    } else {
      // Sheet labels: grid printing with possible skip offsets on first page
      for (let r = 0; r < rowsCount; r++) {
        for (let c = 0; c < cols; c++) {
          const cellIndex = r * cols + c;

          // Apply sheetOffset ONLY on the first page
          if (pageNumber === 1 && cellIndex < layout.sheetOffset) {
            // Draw a very light bleed/border if sheet preview helps, or nothing (blank placeholder)
            continue; 
          }

          if (currentItemIndex >= expandedRows.length) {
            break;
          }

          const row = expandedRows[currentItemIndex];
          
          // Calculate top-left physical coordinate of the cell
          const cellX = margin + c * (labelW + colGap);
          const cellY = margin + r * (labelH + rowGap);

          // Draw faint die-cut outline if enabled
          if (layout.printDieCutLines) {
            doc.setDrawColor('#cbd5e1');
            doc.setLineWidth(0.08);
            doc.setLineDashPattern([0.5, 0.5], 0);
            doc.rect(cellX, cellY, labelW, labelH, 'D');
            doc.setLineDashPattern([], 0); // reset
          }

          // Draw the label content at (cellX, cellY)
          await drawSingleLabel(doc, cellX, cellY, labelW, labelH, layers, row, mapping, layout.unit);
          
          currentItemIndex++;
        }
        if (currentItemIndex >= expandedRows.length) {
          break;
        }
      }
    }
  }

  return doc;
}

// Draw a single label cell
async function drawSingleLabel(
  doc: jsPDF,
  labelX: number,
  labelY: number,
  labelW: number,
  labelH: number,
  layers: Layer[],
  row: InventoryRow,
  mapping: ColumnMapping,
  unit: 'mm' | 'in'
) {
  // Sort layers: we should draw borders first, then other items, so layer order is preserved (bottom to top)
  const sortedLayers = [...layers].reverse(); // Assuming layers are listed top-to-bottom in UI, we draw bottom-to-top

  for (const layer of sortedLayers) {
    if (!layer.visible) continue;

    const lx = labelX + layer.x;
    const ly = labelY + layer.y;
    const lw = layer.width;
    const lh = layer.height;

    // --- BORDER / ACCENT BAND LAYER ---
    if (layer.type === 'border') {
      const b = layer as BorderLayer;
      let color = b.staticColor;

      // Determine dynamic color if configured
      if (b.colorType === 'dynamic' && b.dynamicColumn) {
        const val = String(row[mapping[b.dynamicColumn] || b.dynamicColumn] || '').trim();
        const rule = b.colorRules.find(r => r.value.trim().toLowerCase() === val.toLowerCase());
        if (rule) {
          color = rule.color;
        }
      }

      doc.setFillColor(color);
      doc.setDrawColor(color);
      doc.setLineWidth(b.thickness);

      if (b.borderType === 'full-border') {
        doc.rect(labelX, labelY, labelW, labelH, 'D'); // stroke boundary outline
      } else if (b.borderType === 'top-band') {
        doc.rect(labelX, labelY, labelW, b.thickness, 'F');
      } else if (b.borderType === 'left-band') {
        doc.rect(labelX, labelY, b.thickness, labelH, 'F');
      } else if (b.borderType === 'right-band') {
        doc.rect(labelX + labelW - b.thickness, labelY, b.thickness, labelH, 'F');
      } else if (b.borderType === 'bottom-band') {
        doc.rect(labelX, labelY + labelH - b.thickness, labelW, b.thickness, 'F');
      }
    }

    // --- TEXT LAYER ---
    else if (layer.type === 'text') {
      const t = layer as TextLayer;
      const text = interpolateTokens(t.template, row, mapping);
      if (!text) continue;

      // Configure font
      doc.setTextColor(t.color);
      doc.setFontSize(t.fontSize);
      
      let fontName = 'Helvetica';
      let fontType = 'normal';
      if (t.fontStyle === 'bold') fontType = 'bold';
      else if (t.fontStyle === 'italic') fontType = 'oblique';
      else if (t.fontStyle === 'bold-italic') fontType = 'bolditalic';
      
      doc.setFont(fontName, fontType);

      const splitLines = doc.splitTextToSize(text, lw);
      const factor = t.lineHeight || 1.2;
      const lineHeight = ptToUnit(t.fontSize, unit) * factor;
      const totalTextHeight = splitLines.length * lineHeight;

      // jsPDF y coordinate represents baseline. We offset y to start top-aligned inside box
      const charHeight = ptToUnit(t.fontSize, unit) * 0.85; // approx cap height
      
      let startY = ly;
      if (t.verticalAlign === 'middle') {
        startY = ly + (lh - totalTextHeight) / 2;
      } else if (t.verticalAlign === 'bottom') {
        startY = ly + lh - totalTextHeight;
      }

      let py = startY + charHeight;

      let px = lx;
      if (t.align === 'center') {
        px = lx + lw / 2;
      } else if (t.align === 'right') {
        px = lx + lw;
      }

      for (const line of splitLines) {
        // Only draw lines if they fit within the bounding box range (clipping simulation)
        if (py - charHeight >= ly && py - charHeight + lineHeight * 0.8 <= ly + lh) {
          doc.text(line, px, py, {
            align: t.align
          });
        }
        py += lineHeight;
      }
    }

    // --- BARCODE LAYER ---
    else if (layer.type === 'barcode') {
      const b = layer as BarcodeLayer;
      const mappedHeader = mapping[b.column] || b.column;
      const value = String(row[mappedHeader] !== undefined ? row[mappedHeader] : row[b.column] || '').trim();

      const validation = validateBarcode(value, b.format);
      if (!validation.isValid) {
        // Draw standard error indicator placeholder
        doc.setDrawColor('#FF0000');
        doc.setFillColor('#FFEEEE');
        doc.setLineWidth(0.3);
        doc.rect(lx, ly, lw, lh, 'FD');
        doc.setTextColor('#FF0000');
        doc.setFontSize(6);
        doc.setFont('Helvetica', 'bold');
        doc.text('BAD BARCODE', lx + lw/2, ly + lh/2, { align: 'center' });
        continue;
      }

      // Generate vector lines
      const barcodeData = generateBarcodeVectors(value, b.format);
      if (barcodeData.rects.length > 0) {
        const scale = lw / barcodeData.width;
        
        // Draw bars
        doc.setFillColor('#000000');
        const barH = b.includeText ? lh * 0.75 : lh;
        
        for (const bar of barcodeData.rects) {
          const bx = lx + bar.x * scale;
          const bw = bar.width * scale;
          doc.rect(bx, ly, bw, barH, 'F');
        }

        // Draw human readable text below bars
        if (b.includeText) {
          doc.setTextColor('#000000');
          doc.setFontSize(b.fontSize || 7);
          doc.setFont('Helvetica', 'normal');
          doc.text(
            barcodeData.displayValue, 
            lx + lw / 2, 
            ly + lh - ptToUnit(b.fontSize || 7, unit) * 0.1, 
            { align: 'center' }
          );
        }
      }
    }

    // --- QR CODE LAYER ---
    else if (layer.type === 'qrcode') {
      const q = layer as QrLayer;
      const text = interpolateTokens(q.template, row, mapping);
      if (!text) continue;

      try {
        // Generate QR code 2D matrix
        const qr = QRCode.create(text, { errorCorrectionLevel: 'M' });
        const modules = qr.modules;
        const size = modules.size;
        const blockSize = lw / size; // Assume square QR bounding box width

        doc.setFillColor('#000000');
        for (let r = 0; r < size; r++) {
          for (let c = 0; c < size; c++) {
            if (modules.get(c, r)) {
              doc.rect(
                lx + c * blockSize,
                ly + r * blockSize,
                blockSize + 0.01, // overlap slightly to prevent physical printing grid lines
                blockSize + 0.01,
                'F'
              );
            }
          }
        }
      } catch (err) {
        console.error('Failed to generate QR vector in PDF:', err);
      }
    }

    // --- PRICING LAYER ---
    else if (layer.type === 'pricing') {
      const p = layer as PricingLayer;
      const priceHeader = mapping[p.priceColumn] || p.priceColumn;
      const promoHeader = mapping[p.promoColumn] || p.promoColumn;
      
      const priceVal = parseFloat(row[priceHeader] || row[p.priceColumn]);
      const promoVal = parseFloat(row[promoHeader] || row[p.promoColumn]);

      const sizePt = parseFloat(p.fontSize) || 10;
      doc.setFontSize(sizePt);
      const charHeight = ptToUnit(sizePt, unit) * 0.85;

      const hasPromo = !isNaN(promoVal) && promoVal > 0 && promoVal < priceVal;

      if (hasPromo) {
        // Promoted layout: standard price with strikethrough + promo price
        const symbol = p.currencySymbol;
        const origStr = `${symbol}${priceVal.toFixed(2)}`;
        const promoStr = `${symbol}${promoVal.toFixed(2)}`;

        // 1. Draw promotional price in promoColor, larger size
        doc.setTextColor(p.promoColor);
        doc.setFont('Helvetica', 'bold');
        doc.text(promoStr, lx, ly + charHeight);

        // 2. Draw standard price in original color, smaller size, with strikeout
        const offsetWidth = doc.getTextWidth(promoStr) + ptToUnit(6, unit);
        doc.setTextColor(p.color);
        doc.setFontSize(sizePt * 0.7);
        doc.setFont('Helvetica', 'normal');
        
        const origY = ly + charHeight;
        doc.text(origStr, lx + offsetWidth, origY);

        // Strikethrough line
        const origW = doc.getTextWidth(origStr);
        doc.setDrawColor(p.color);
        doc.setLineWidth(ptToUnit(sizePt * 0.05, unit));
        doc.line(
          lx + offsetWidth,
          origY - (charHeight * 0.3),
          lx + offsetWidth + origW,
          origY - (charHeight * 0.3)
        );
      } else {
        // Standard layout: just standard price
        if (!isNaN(priceVal)) {
          doc.setTextColor(p.color);
          doc.setFont('Helvetica', 'bold');
          const symbol = p.currencySymbol;
          doc.text(`${symbol}${priceVal.toFixed(2)}`, lx, ly + charHeight);
        }
      }
    }

    // --- COMPLIANCE / INGREDIENTS LAYER (AUTO FONT SCALING) ---
    else if (layer.type === 'compliance') {
      const c = layer as ComplianceLayer;
      const mappedHeader = mapping[c.column] || c.column;
      const rawText = String(row[mappedHeader] !== undefined ? row[mappedHeader] : row[c.column] || '').trim();
      if (!rawText) continue;

      const fullText = c.heading ? `${c.heading} ${rawText}` : rawText;

      // Font size auto-scaling loop
      let activeFontSize = c.fontSizeMax;
      const fontName = 'Helvetica';
      const fontType = 'normal';
      
      doc.setTextColor(c.color);
      doc.setFont(fontName, fontType);

      // Binary search or loop downsizing until height matches bounding box
      while (activeFontSize >= c.fontSizeMin) {
        doc.setFontSize(activeFontSize);
        const splitLines = doc.splitTextToSize(fullText, lw);
        const lineHeight = ptToUnit(activeFontSize, unit) * 1.25; // 1.25 line height factor
        const totalHeight = splitLines.length * lineHeight;
        
        if (totalHeight <= lh || activeFontSize === c.fontSizeMin) {
          // Fits! Or hit floor. Draw it
          const charHeight = ptToUnit(activeFontSize, unit) * 0.85;
          let currentY = ly + charHeight;
          
          for (const line of splitLines) {
            if (currentY + ptToUnit(activeFontSize, unit) * 0.1 > ly + lh) {
              // Clamp overflow
              break;
            }
            doc.text(line, lx, currentY);
            currentY += lineHeight;
          }
          break;
        }
        activeFontSize -= 0.5; // step down font size
      }
    }

    // --- SAFETY LAYER (GHS ICONS) ---
    else if (layer.type === 'safety') {
      const s = layer as SafetyLayer;
      
      // Determine which symbols are active for this row
      const activeSymbols: string[] = [];
      s.mappings.forEach((m) => {
        const mappedHeader = mapping[m.column] || m.column;
        const val = String(row[mappedHeader] !== undefined ? row[mappedHeader] : row[m.column] || '').trim();
        
        let isActive = false;
        if (m.activeIf === 'true') {
          isActive = val.toLowerCase() === 'true' || val === '1' || val.toLowerCase() === 'yes';
        } else if (m.activeIf === 'non-empty') {
          isActive = val.length > 0;
        } else if (m.activeIf === 'match' && m.matchValue) {
          isActive = val.toLowerCase() === m.matchValue.toLowerCase();
        }

        if (isActive) {
          activeSymbols.push(m.symbol);
        }
      });

      // Draw horizontal series of active pictograms inside bounding box
      const symSize = s.symbolSize; // physical size
      const gap = symSize * 0.15;   // gap between diamonds

      activeSymbols.forEach((sym, idx) => {
        const sx = lx + idx * (symSize + gap);
        // Prevent drawing outside the safety layer bounding box
        if (sx + symSize <= lx + lw && ly + symSize <= ly + lh) {
          drawGHSDiamond(doc, sx, ly, symSize, sym);
        }
      });
    }
  }

  // --- Bleed guide / safe-zone visualization ---
  // In the real printed PDF, we usually do NOT output the safe zone guide unless explicitly asked or we draw cut outlines, 
  // but we can support drawing a very faint line for cutting if b.borderType = 'full-border' is enabled.
}
