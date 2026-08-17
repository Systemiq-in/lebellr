'use client';

import React, { useMemo, useState } from 'react';
import QRCode from 'qrcode';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Eye } from 'lucide-react';
import { 
  LayoutConfig, Layer, InventoryRow, ColumnMapping, 
  ColorMapRule, SafetySymbolType,
  TextLayer, BarcodeLayer, QrLayer, PricingLayer, ComplianceLayer, SafetyLayer
} from '../lib/types';
import { generateBarcodeVectors, validateBarcode } from '../lib/barcode';
import { interpolateTokens } from '../lib/pdf-generator';

interface CanvasPreviewProps {
  config: LayoutConfig;
  layers: Layer[];
  rows: InventoryRow[];
  mapping: ColumnMapping;
  selectedRowIndex: number;
  onSelectRowIndex: (idx: number) => void;
  selectedLayerId?: string | null;
  onSelectLayer?: (id: string | null) => void;
}

// Inline GHS SVG Symbols
function GHSSymbolSVG({ type }: { type: SafetySymbolType }) {
  // Common diamond boundary
  const diamond = (
    <polygon 
      points="20,2 38,20 20,38 2,20" 
      fill="#FFFFFF" 
      stroke="#FF0000" 
      strokeWidth="2.5" 
    />
  );

  let inner = null;
  if (type === 'exclamation') {
    inner = (
      <>
        <rect x="18.5" y="9" width="3" height="15" fill="#000000" rx="1" />
        <circle cx="20" cy="29" r="2.2" fill="#000000" />
      </>
    );
  } else if (type === 'flame') {
    inner = (
      <path 
        d="M20,7 C17,12 14,17 14,21 C14,25 16.5,28 20,28 C23.5,28 26,25 26,21 C26,16 23,11 20,7 Z M20,13 C21.5,16 23,19 23,21.5 C23,23.5 21.5,25 20,25 C18.5,25 17,23.5 17,21.5 C17,19 18.5,16 20,13 Z" 
        fill="#000000" 
      />
    );
  } else if (type === 'skull') {
    inner = (
      <>
        {/* Crossbones */}
        <path d="M7,12 L33,28 M33,12 L7,28" stroke="#000000" strokeWidth="2.5" strokeLinecap="round" />
        {/* Skull Head */}
        <circle cx="20" cy="18" r="7" fill="#000000" />
        <rect x="17.5" y="22" width="5" height="5" fill="#000000" rx="1" />
        {/* Eyes */}
        <circle cx="17.5" cy="17" r="1.5" fill="#FFFFFF" />
        <circle cx="22.5" cy="17" r="1.5" fill="#FFFFFF" />
      </>
    );
  } else if (type === 'corrosive') {
    inner = (
      <>
        <line x1="8" y1="26" x2="32" y2="26" stroke="#000000" strokeWidth="2" />
        <path d="M12,12 L17,20 M28,12 L23,20" stroke="#000000" strokeWidth="2" strokeLinecap="round" />
        <circle cx="14.5" cy="16" r="1.5" fill="#000000" />
        <circle cx="25.5" cy="16" r="1.5" fill="#000000" />
      </>
    );
  } else if (type === 'health') {
    inner = (
      <>
        <circle cx="20" cy="13" r="3.5" fill="#000000" />
        <path d="M14,29 C14,24 16,21 20,21 C24,21 26,24 26,29 Z" fill="#000000" />
        <polygon points="20,15 22,20 18,20" fill="#FFFFFF" />
      </>
    );
  } else if (type === 'environment') {
    inner = (
      <>
        {/* Dead Fish */}
        <path d="M12,27 C15,25 18,25 20,27 C22,25 25,25 28,27 L28,25 C26,23 23,23 20,25 C17,23 14,23 12,25 Z" fill="#000000" />
        {/* Tree */}
        <path d="M26,11 L31,20 L28,20 L28,25 L24,25 L24,20 L21,20 Z" fill="#000000" />
      </>
    );
  } else if (type === 'gas') {
    inner = (
      <rect x="17.5" y="10" width="5" height="20" rx="2" fill="#000000" />
    );
  }

  return (
    <svg viewBox="0 0 40 40" width="100%" height="100%">
      {diamond}
      {inner}
    </svg>
  );
}

// Shared canvas rendering context for layout performance checks to prevent DOM creation overhead
let sharedCanvas: HTMLCanvasElement | null = null;
let sharedCtx: CanvasRenderingContext2D | null = null;
const complianceFontSizeCache = new Map<string, number>();
const barcodeCache = new Map<string, any>();
const qrCodeCache = new Map<string, any>();

export default function CanvasPreview({
  config,
  layers,
  rows,
  mapping,
  selectedRowIndex,
  onSelectRowIndex,
  selectedLayerId = null,
  onSelectLayer,
}: CanvasPreviewProps) {
  const [zoom, setZoom] = useState(3.0); // Pixels per physical millimeter
  const [activePage, setActivePage] = useState(0);
  const [previewMode, setPreviewMode] = useState<'focused' | 'sheet'>('focused');

  const isThermal = config.preset.startsWith('thermal');

  // Convert physical value to pixel representation based on zoom scale
  const toPx = (val: number) => `${val * zoom}px`;

  // Standard paper size in mm
  const paperDimensions = useMemo(() => {
    if (isThermal) {
      return { width: config.width, height: config.height };
    }
    const format = config.pageFormat || 'a4';
    if (format === 'letter') return { width: 215.9, height: 279.4 };
    if (format === 'legal') return { width: 215.9, height: 355.6 };
    // Default A4 fallback
    return { width: 210, height: 297 };
  }, [isThermal, config]);

  // Total copies compiled based on quantity mapper
  const expandedRows = useMemo(() => {
    const list: { row: InventoryRow; originalIndex: number }[] = [];
    rows.forEach((row, idx) => {
      const qtyHeader = mapping.quantity;
      const qtyVal = parseInt(row[qtyHeader] || row['quantity'] || '1', 10);
      const copies = isNaN(qtyVal) || qtyVal < 1 ? 1 : qtyVal;
      for (let c = 0; c < copies; c++) {
        list.push({ row, originalIndex: idx });
      }
    });
    return list;
  }, [rows, mapping]);

  // Compute Avery layout pagination
  const labelsPerPage = isThermal ? 1 : (config.cols * config.rows);
  const totalPages = useMemo(() => {
    if (expandedRows.length === 0) return 1;
    if (isThermal) return expandedRows.length;
    
    // account for skipped cells on the first page
    const totalSlots = expandedRows.length + config.sheetOffset;
    return Math.max(1, Math.ceil(totalSlots / labelsPerPage));
  }, [expandedRows, labelsPerPage, config.sheetOffset, isThermal]);

  const handlePrevPage = () => setActivePage(p => Math.max(0, p - 1));
  const handleNextPage = () => setActivePage(p => Math.min(totalPages - 1, p + 1));

  // Build grid matrix of cells on active page
  const gridCells = useMemo(() => {
    const cells: { type: 'skip' | 'label'; row?: InventoryRow; originalIndex?: number }[] = [];
    
    if (isThermal) {
      const item = expandedRows[activePage];
      if (item) {
        cells.push({ type: 'label', row: item.row, originalIndex: item.originalIndex });
      }
      return cells;
    }

    const startIndex = activePage * labelsPerPage;
    for (let i = 0; i < labelsPerPage; i++) {
      const currentSlot = startIndex + i;
      
      // Page 1 skip offset padding
      if (activePage === 0 && currentSlot < config.sheetOffset) {
        cells.push({ type: 'skip' });
        continue;
      }

      // Read mapped item
      const listIndex = currentSlot - (activePage === 0 ? config.sheetOffset : config.sheetOffset);
      const item = expandedRows[listIndex];
      if (item) {
        cells.push({ type: 'label', row: item.row, originalIndex: item.originalIndex });
      } else {
        cells.push({ type: 'skip' });
      }
    }

    return cells;
  }, [isThermal, activePage, expandedRows, labelsPerPage, config.sheetOffset]);

  // Approximate compliance text auto-scaling in preview
  const getComplianceFontSize = (text: string, widthMm: number, heightMm: number, maxPt: number, minPt: number) => {
    if (typeof window === 'undefined') return maxPt;

    const cacheKey = `${text}_${widthMm}_${heightMm}_${maxPt}_${minPt}`;
    if (complianceFontSizeCache.has(cacheKey)) {
      return complianceFontSizeCache.get(cacheKey)!;
    }

    if (!sharedCanvas) {
      sharedCanvas = document.createElement('canvas');
      sharedCtx = sharedCanvas.getContext('2d');
    }
    const ctx = sharedCtx;
    if (!ctx) return maxPt;

    const widthPt = (widthMm / 25.4) * 72;
    const heightPt = (heightMm / 25.4) * 72;

    let size = maxPt;
    const words = text.split(/\s+/);

    while (size >= minPt) {
      ctx.font = `normal ${size}px Helvetica`;
      const lines = [];
      let currentLine = '';

      for (const word of words) {
        const test = currentLine ? currentLine + ' ' + word : word;
        if (ctx.measureText(test).width > widthPt && currentLine) {
          lines.push(currentLine);
          currentLine = word;
        } else {
          currentLine = test;
        }
      }
      if (currentLine) lines.push(currentLine);

      const computedHeight = lines.length * (size * 1.25);
      if (computedHeight <= heightPt) {
        complianceFontSizeCache.set(cacheKey, size);
        return size;
      }
      size -= 0.5;
    }
    complianceFontSizeCache.set(cacheKey, minPt);
    return minPt;
  };

  const renderLabelInner = (row: InventoryRow, originalIndex: number) => {
    return (
      <>
        {/* Safe Zone Red Bleed Border */}
        {config.showBleed && (
          <div
            className="absolute border border-dashed border-red-400 pointer-events-none z-50"
            style={{
              left: toPx(1.5),
              top: toPx(1.5),
              right: toPx(1.5),
              bottom: toPx(1.5),
            }}
          />
        )}

        {/* Render Each Design Layer */}
        {layers.map((layer) => {
          if (!layer.visible) return null;

          const isLayerSelected = selectedLayerId === layer.id;
          const activeClass = isLayerSelected 
            ? 'ring-1 ring-cyan-500 bg-cyan-50/5 z-20 shadow-[0_0_4px_rgba(6,182,212,0.3)]' 
            : 'hover:ring-1 hover:ring-slate-400 z-10';

          // Determine specific inner content
          let innerContent = null;

          // --- BORDER / ACCENT BAND ---
          if (layer.type === 'border') {
            const b = layer as any;
            let color = b.staticColor;

            if (b.colorType === 'dynamic' && b.dynamicColumn) {
              const val = String(row[mapping[b.dynamicColumn] || b.dynamicColumn] || '').trim();
              const rule = b.colorRules?.find((r: ColorMapRule) => r.value.toLowerCase() === val.toLowerCase());
              if (rule) {
                color = rule.color;
              }
            }

            if (b.borderType === 'full-border') {
              innerContent = (
                <div
                  className="w-full h-full"
                  style={{
                    border: `${b.thickness * (zoom / 2.83)}px solid ${color}`,
                  }}
                />
              );
            } else {
              const isTop = b.borderType === 'top-band';
              const isBottom = b.borderType === 'bottom-band';
              const isLeft = b.borderType === 'left-band';
              const isRight = b.borderType === 'right-band';

              innerContent = (
                <div
                  style={{
                    position: 'absolute',
                    left: isRight ? 'auto' : 0,
                    right: isRight ? 0 : 'auto',
                    top: isBottom ? 'auto' : 0,
                    bottom: isBottom ? 0 : 'auto',
                    width: (isLeft || isRight) ? toPx(b.thickness) : '100%',
                    height: (isTop || isBottom) ? toPx(b.thickness) : '100%',
                    backgroundColor: color,
                  }}
                />
              );
            }
          }

          // --- TEXT BLOCK ---
          else if (layer.type === 'text') {
            const t = layer as TextLayer;
            const text = interpolateTokens(t.template, row, mapping);
            const factor = t.lineHeight || 1.2;

            innerContent = (
              <div
                className="w-full h-full flex flex-col"
                style={{
                  color: t.color,
                  fontSize: `${t.fontSize * (zoom / 2.834)}px`, // pt scale
                  textAlign: t.align,
                  lineHeight: factor,
                  fontWeight: t.fontStyle?.includes('bold') ? 'bold' : 'normal',
                  fontStyle: t.fontStyle?.includes('italic') ? 'italic' : 'normal',
                  fontFamily: 'sans-serif',
                  justifyContent: t.verticalAlign === 'middle' ? 'center' : t.verticalAlign === 'bottom' ? 'flex-end' : 'flex-start',
                }}
              >
                {text}
              </div>
            );
          }

          // --- BARCODE ---
          else if (layer.type === 'barcode') {
            const b = layer as BarcodeLayer;
            const mappedHeader = mapping[b.column] || b.column;
            const value = String(row[mappedHeader] !== undefined ? row[mappedHeader] : row[b.column] || '').trim();

            const validation = validateBarcode(value, b.format);
            if (!validation.isValid) {
              innerContent = (
                <div className="w-full h-full bg-red-50/70 text-red-700 border border-dashed border-red-200 text-[8px] font-bold flex items-center justify-center text-center p-1">
                  INV BARCODE
                </div>
              );
            } else {
              const cacheKey = `${value}_${b.format}`;
              let barcode = barcodeCache.get(cacheKey);
              if (!barcode) {
                barcode = generateBarcodeVectors(value, b.format);
                barcodeCache.set(cacheKey, barcode);
              }
              if (barcode.rects.length > 0) {
                innerContent = (
                  <div className="w-full h-full flex flex-col justify-between">
                    <svg
                      viewBox={`0 0 ${barcode.width} ${barcode.height}`}
                      width="100%"
                      height={b.includeText ? '75%' : '100%'}
                      preserveAspectRatio="none"
                    >
                      {barcode.rects.map((r, ri) => (
                        <rect
                          key={ri}
                          x={r.x}
                          y={0}
                          width={r.width}
                          height={barcode.height}
                          fill="#000000"
                        />
                      ))}
                    </svg>
                    {b.includeText && (
                      <div
                        style={{
                          fontSize: `${(b.fontSize || 6) * (zoom / 2.83)}px`,
                          textAlign: 'center',
                          fontFamily: 'monospace',
                          fontWeight: 'bold',
                          color: '#000000',
                          lineHeight: '1',
                        }}
                      >
                        {barcode.displayValue}
                      </div>
                    )}
                  </div>
                );
              }
            }
          }

          // --- QR CODE ---
          else if (layer.type === 'qrcode') {
            const q = layer as QrLayer;
            const val = interpolateTokens(q.template, row, mapping);
            if (val) {
              let qrModules: any = qrCodeCache.get(val);
              if (qrModules === undefined) {
                try {
                  const code = QRCode.create(val, { errorCorrectionLevel: 'M' });
                  qrModules = code.modules;
                  qrCodeCache.set(val, qrModules);
                } catch (e) {
                  qrCodeCache.set(val, null);
                }
              }

              if (qrModules) {
                const size = qrModules.size;
                innerContent = (
                  <div className="w-full h-full relative" style={{ backgroundColor: '#ffffff' }}>
                    <svg
                      viewBox={`0 0 ${size} ${size}`}
                      width="100%"
                      height="100%"
                      shapeRendering="crispEdges"
                    >
                      {Array.from({ length: size }).map((_, r) =>
                        Array.from({ length: size }).map((_, c) => {
                          if (qrModules.get(c, r)) {
                            return (
                              <rect
                                key={`${r}-${c}`}
                                x={c}
                                y={r}
                                width={1.02}
                                height={1.02}
                                fill="#000000"
                              />
                            );
                          }
                          return null;
                        })
                      )}
                    </svg>
                  </div>
                );
              }
            }
          }

          // --- PRICING ---
          else if (layer.type === 'pricing') {
            const p = layer as PricingLayer;
            const priceHeader = mapping[p.priceColumn] || p.priceColumn;
            const promoHeader = mapping[p.promoColumn] || p.promoColumn;

            const priceVal = parseFloat(row[priceHeader] || row[p.priceColumn]);
            const promoVal = parseFloat(row[promoHeader] || row[p.promoColumn]);

            const sizePt = parseFloat(p.fontSize) || 10;
            const fontSizePx = sizePt * (zoom / 2.834);
            const hasPromo = !isNaN(promoVal) && promoVal > 0 && promoVal < priceVal;

            innerContent = (
              <div className="w-full h-full flex items-baseline flex-wrap" style={{ color: p.color }}>
                {hasPromo ? (
                  <>
                    <span style={{ fontSize: `${fontSizePx}px`, fontWeight: 'bold', marginRight: '6px', color: p.promoColor }}>
                      {p.currencySymbol}{promoVal.toFixed(2)}
                    </span>
                    <span className="line-through text-slate-400" style={{ fontSize: `${fontSizePx * 0.75}px` }}>
                      {p.currencySymbol}{priceVal.toFixed(2)}
                    </span>
                  </>
                ) : (
                  !isNaN(priceVal) && (
                    <span style={{ fontSize: `${fontSizePx}px`, fontWeight: 'bold', color: p.color }}>
                      {p.currencySymbol}{priceVal.toFixed(2)}
                    </span>
                  )
                )}
              </div>
            );
          }

          // --- COMPLIANCE ---
          else if (layer.type === 'compliance') {
            const c = layer as ComplianceLayer;
            const mappedHeader = mapping[c.column] || c.column;
            const rawText = String(row[mappedHeader] !== undefined ? row[mappedHeader] : row[c.column] || '').trim();
            if (rawText) {
              const fullText = c.heading ? `${c.heading} ${rawText}` : rawText;
              const sizePt = getComplianceFontSize(fullText, layer.width, layer.height, c.fontSizeMax, c.fontSizeMin);
              const fontSizePx = sizePt * (zoom / 2.834);

              innerContent = (
                <div
                  className="w-full h-full overflow-hidden leading-tight font-medium text-left"
                  style={{
                    color: c.color,
                    fontSize: `${fontSizePx}px`,
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                  }}
                >
                  {fullText}
                </div>
              );
            }
          }

          // --- SAFETY ---
          else if (layer.type === 'safety') {
            const s = layer as SafetyLayer;
            const activeSymbols: SafetySymbolType[] = [];

            s.mappings?.forEach((m) => {
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

            const sizePx = s.symbolSize * zoom;
            const gapPx = sizePx * 0.15;

            innerContent = (
              <div className="w-full h-full flex items-center" style={{ gap: `${gapPx}px` }}>
                {activeSymbols.map((sym, symIdx) => (
                  <div
                    key={symIdx}
                    style={{
                      width: `${sizePx}px`,
                      height: `${sizePx}px`,
                    }}
                  >
                    <GHSSymbolSVG type={sym} />
                  </div>
                ))}
              </div>
            );
          }

          return (
            <div
              key={layer.id}
              onClick={(e) => {
                e.stopPropagation();
                onSelectLayer?.(layer.id);
              }}
              className={`absolute select-none overflow-hidden transition-shadow duration-100 ${activeClass}`}
              style={{
                left: toPx(layer.x),
                top: toPx(layer.y),
                width: toPx(layer.width),
                height: toPx(layer.height),
                boxSizing: 'border-box',
              }}
            >
              {innerContent}
            </div>
          );
        })}
      </>
    );
  };

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Visual Workspace Toolbar */}
      <div className="bg-white border border-slate-200 p-3 rounded-lg flex items-center justify-between shadow-sm">
        
        {/* Preview Mode Selector */}
        <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200 select-none">
          <button
            type="button"
            onClick={() => setPreviewMode('focused')}
            className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
              previewMode === 'focused'
                ? 'bg-white text-slate-800 shadow-sm border border-slate-200/50'
                : 'text-slate-500 hover:text-slate-800'
            }`}
            title="Focus single label template (Lag-free editing)"
          >
            Focused Card
          </button>
          <button
            type="button"
            onClick={() => setPreviewMode('sheet')}
            className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
              previewMode === 'sheet'
                ? 'bg-white text-slate-800 shadow-sm border border-slate-200/50'
                : 'text-slate-500 hover:text-slate-800'
            }`}
            title="Show full printed sheet layout grid"
          >
            Full Sheet Grid
          </button>
        </div>

        {/* Page Switcher (only shown/active for Sheet Grid) */}
        {previewMode === 'sheet' ? (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrevPage}
              disabled={activePage === 0}
              className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-20 text-slate-650 hover:text-slate-900 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-[11px] font-mono text-slate-500">
              Sheet Page <span className="font-bold text-slate-800">{activePage + 1}</span> of <span className="font-bold text-slate-800">{totalPages}</span>
            </span>
            <button
              type="button"
              onClick={handleNextPage}
              disabled={activePage === totalPages - 1}
              className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-20 text-slate-650 hover:text-slate-900 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="text-[11px] font-mono text-slate-500 flex items-center gap-1">
            <span>Sticker Preview:</span>
            <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-700 font-bold">Zoom {Math.round(zoom * 33.3)}%</span>
          </div>
        )}

        <div className="text-[10px] text-slate-600 font-semibold bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
          Showing <span className="text-slate-900 font-bold">{expandedRows.length}</span> labels total
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setZoom(z => Math.max(1, z - 0.5))}
            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-650 hover:text-slate-900 transition-all"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-[10px] font-mono text-slate-500 w-12 text-center">
            {Math.round(zoom * 33.3)}%
          </span>
          <button
            type="button"
            onClick={() => setZoom(z => Math.min(6, z + 0.5))}
            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-650 hover:text-slate-900 transition-all"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Board Scroll Window */}
      <div className="flex-1 bg-slate-100 border border-slate-200 rounded-lg overflow-auto p-8 flex justify-center items-center min-h-[500px] bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:16px_16px]">
        {rows.length === 0 ? (
          <div className="my-auto text-center p-12">
            <Eye className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            <p className="text-slate-500 font-semibold text-xs leading-normal">
              No inventory data uploaded yet.<br />
              Upload a spreadsheet sheet in the left side to preview sheets.
            </p>
          </div>
        ) : previewMode === 'focused' ? (
          /* Focused Label Mode (1 element, extremely fast editing) */
          <div className="flex flex-col items-center gap-4 my-auto select-none">
            <div
              className="bg-white text-black shadow-2xl relative select-none border border-slate-300 rounded-lg outline outline-2 outline-slate-200/50"
              style={{
                width: toPx(config.width),
                height: toPx(config.height),
                boxSizing: 'border-box',
              }}
            >
              {expandedRows[selectedRowIndex] && renderLabelInner(expandedRows[selectedRowIndex].row, selectedRowIndex)}
            </div>
            <div className="text-[10px] font-semibold text-slate-400 bg-white border border-slate-200 px-3 py-1.5 rounded-full shadow-sm flex items-center gap-2 select-none">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-600 animate-ping" />
              <span>Editing Sticker #{selectedRowIndex + 1} • {expandedRows[selectedRowIndex]?.row[mapping.title || 'Product_Title'] || 'No Title'}</span>
            </div>
          </div>
        ) : (
          /* Scaled Sheet Paper Simulation */
          <div
            className="bg-white text-black shadow-lg relative select-none origin-top transition-all duration-200 border border-slate-300"
            style={{
              width: toPx(paperDimensions.width),
              height: toPx(paperDimensions.height),
              padding: toPx(isThermal ? 0 : config.margin),
              boxSizing: 'border-box',
            }}
          >
            {/* Page Watermark Grid */}
            <div className="absolute top-2 left-3 text-[10px] font-mono font-bold text-slate-400 pointer-events-none uppercase tracking-wider">
              {config.preset === 'custom' ? 'Custom Grid' : config.preset.toUpperCase()} ({paperDimensions.width}x{paperDimensions.height}mm)
            </div>

            {/* Grid Matrix of Labels */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${isThermal ? 1 : config.cols}, ${toPx(config.width)})`,
                gridTemplateRows: `repeat(${isThermal ? 1 : config.rows}, ${toPx(config.height)})`,
                columnGap: toPx(isThermal ? 0 : config.colGap),
                rowGap: toPx(isThermal ? 0 : config.rowGap),
                width: '100%',
                height: '100%',
              }}
            >
              {gridCells.map((cell, idx) => {
                // Skips / Placeholders
                if (cell.type === 'skip' || !cell.row) {
                  return (
                    <div
                      key={`skip-${idx}`}
                      className="border border-dashed border-slate-200 bg-slate-50/50 flex items-center justify-center text-[9px] font-bold text-slate-400"
                      style={{
                        width: toPx(config.width),
                        height: toPx(config.height),
                      }}
                    >
                      {idx < config.sheetOffset && activePage === 0 ? 'Skip Offset' : ''}
                    </div>
                  );
                }

                // Render Active Label
                const isSelected = selectedRowIndex === cell.originalIndex;
                const row = cell.row;

                return (
                  <div
                    key={`label-${idx}`}
                    onClick={() => onSelectRowIndex(cell.originalIndex!)}
                    className={`relative bg-white cursor-pointer transition-all overflow-hidden ${
                      isSelected 
                        ? 'ring-2 ring-slate-900 z-10 shadow-md' 
                        : 'border border-slate-200 hover:border-slate-350'
                    }`}
                    style={{
                      width: toPx(config.width),
                      height: toPx(config.height),
                      boxSizing: 'border-box',
                    }}
                  >
                    {renderLabelInner(row, cell.originalIndex!)}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
