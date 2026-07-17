import JsBarcode from 'jsbarcode';
import { BarcodeFormat } from './types';

// Calculate EAN-13 Checksum
export function calculateEanChecksum(digits: string): number {
  let sum = 0;
  for (let i = 0; i < digits.length; i++) {
    const digit = parseInt(digits[i], 10);
    // Weighted sum: even positions (from right) multiplied by 3
    // Since we check the first 12 digits of EAN-13:
    // Index 0 (odd) weight 1, Index 1 (even) weight 3, etc.
    const weight = i % 2 === 0 ? 1 : 3;
    sum += digit * weight;
  }
  const remainder = sum % 10;
  return remainder === 0 ? 0 : 10 - remainder;
}

// Calculate UPC-A Checksum
export function calculateUpcChecksum(digits: string): number {
  let sum = 0;
  for (let i = 0; i < digits.length; i++) {
    const digit = parseInt(digits[i], 10);
    // UPC-A: first index is multiplied by 3, second by 1
    const weight = i % 2 === 0 ? 3 : 1;
    sum += digit * weight;
  }
  const remainder = sum % 10;
  return remainder === 0 ? 0 : 10 - remainder;
}

// Check syntax and formats for barcodes
export function validateBarcode(text: string, format: BarcodeFormat): { isValid: boolean; error?: string } {
  if (!text) {
    return { isValid: false, error: 'Value is empty' };
  }

  const cleaned = text.trim();

  if (format === 'ean13') {
    if (!/^\d+$/.test(cleaned)) {
      return { isValid: false, error: 'EAN-13 must contain digits only' };
    }
    if (cleaned.length !== 12 && cleaned.length !== 13) {
      return { isValid: false, error: 'EAN-13 must be 12 or 13 digits long' };
    }
    
    if (cleaned.length === 13) {
      const checksum = calculateEanChecksum(cleaned.slice(0, 12));
      const lastDigit = parseInt(cleaned[12], 10);
      if (checksum !== lastDigit) {
        return { isValid: false, error: `Invalid EAN-13 checksum. Expected last digit to be ${checksum}` };
      }
    }
    return { isValid: true };
  }

  if (format === 'upca') {
    if (!/^\d+$/.test(cleaned)) {
      return { isValid: false, error: 'UPC-A must contain digits only' };
    }
    if (cleaned.length !== 11 && cleaned.length !== 12) {
      return { isValid: false, error: 'UPC-A must be 11 or 12 digits long' };
    }

    if (cleaned.length === 12) {
      const checksum = calculateUpcChecksum(cleaned.slice(0, 11));
      const lastDigit = parseInt(cleaned[11], 10);
      if (checksum !== lastDigit) {
        return { isValid: false, error: `Invalid UPC-A checksum. Expected last digit to be ${checksum}` };
      }
    }
    return { isValid: true };
  }

  if (format === 'code128') {
    // Code 128 can encode all 128 ASCII characters
    if (!/^[\x00-\x7F]+$/.test(cleaned)) {
      return { isValid: false, error: 'Code 128 must contain ASCII characters only' };
    }
    return { isValid: true };
  }

  return { isValid: true };
}
export interface BarcodeRect {
  x: number;
  width: number;
}

// Memory cache for barcode vectors to avoid expensive JsBarcode overhead
const barcodeCache = new Map<string, { rects: BarcodeRect[]; width: number; height: number; displayValue: string }>();

// Get vector bar rectangles from JsBarcode
export function generateBarcodeVectors(text: string, format: BarcodeFormat): { rects: BarcodeRect[]; width: number; height: number; displayValue: string } {
  const cleaned = text.trim();
  let textToEncode = cleaned;

  // Auto-append checksum if missing
  if (format === 'ean13' && cleaned.length === 12) {
    textToEncode = cleaned + calculateEanChecksum(cleaned);
  } else if (format === 'upca' && cleaned.length === 11) {
    textToEncode = cleaned + calculateUpcChecksum(cleaned);
  }

  const cacheKey = `${textToEncode}_${format}`;
  if (barcodeCache.has(cacheKey)) {
    return barcodeCache.get(cacheKey)!;
  }

  // Create temporary in-memory SVG
  if (typeof document !== 'undefined') {
    try {
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      JsBarcode(svg, textToEncode, {
        format: format === 'code128' ? 'CODE128' : format === 'ean13' ? 'EAN13' : 'UPC',
        displayValue: false,
        height: 50,
        margin: 0,
        flat: true,
      });

      const rectElements = svg.querySelectorAll('rect');
      const rects: BarcodeRect[] = [];
      let maxRight = 0;

      rectElements.forEach((rect) => {
        const rx = parseFloat(rect.getAttribute('x') || '0');
        const rwidth = parseFloat(rect.getAttribute('width') || '0');
        rects.push({ x: rx, width: rwidth });
        if (rx + rwidth > maxRight) {
          maxRight = rx + rwidth;
        }
      });

      const result = {
        rects,
        width: maxRight,
        height: 50,
        displayValue: textToEncode,
      };

      barcodeCache.set(cacheKey, result);
      return result;
    } catch (err) {
      console.error('Failed to generate barcode via JsBarcode:', err);
    }
  }

  // Fallback if running outside browser or error
  return {
    rects: [],
    width: 100,
    height: 50,
    displayValue: textToEncode,
  };
}
