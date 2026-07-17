'use client';

import React, { useMemo } from 'react';
import { AlertTriangle, CheckCircle, ShieldAlert } from 'lucide-react';
import { Layer, LayoutConfig, ColumnMapping, InventoryRow } from '../lib/types';
import { validateBarcode } from '../lib/barcode';
import { interpolateTokens } from '../lib/pdf-generator';

interface PreflightCheckerProps {
  layers: Layer[];
  rows: InventoryRow[];
  mapping: ColumnMapping;
  layoutConfig: LayoutConfig;
  onSelectRowIndex: (idx: number) => void;
  selectedRowIndex: number;
}

interface PreflightIssue {
  rowIndex: number;
  rowName: string;
  type: 'barcode' | 'overflow';
  layerName: string;
  message: string;
}

export default function PreflightChecker({
  layers,
  rows,
  mapping,
  layoutConfig,
  onSelectRowIndex,
  selectedRowIndex,
}: PreflightCheckerProps) {

  // Measure text and calculate overflow issues on all data rows
  const issues = useMemo<PreflightIssue[]>(() => {
    if (rows.length === 0 || layers.length === 0) return [];

    const list: PreflightIssue[] = [];

    // Setup temporary offscreen canvas context for width measurements
    let ctx: CanvasRenderingContext2D | null = null;
    if (typeof window !== 'undefined') {
      const canvas = document.createElement('canvas');
      ctx = canvas.getContext('2d');
    }

    // Helper: convert physical dimensions to points (pt)
    const toPoints = (val: number) => {
      return layoutConfig.unit === 'mm' ? (val / 25.4) * 72 : val * 72;
    };

    rows.forEach((row, rIdx) => {
      // Find a row description label
      const rowNameHeader = mapping.title || 'Item Name';
      const rowName = String(row[rowNameHeader] || row['title'] || row['name'] || `Row ${rIdx + 1}`);

      layers.forEach((layer) => {
        if (!layer.visible) return;

        const lwPt = toPoints(layer.width);
        const lhPt = toPoints(layer.height);

        // 1. BARCODE VALIDATION
        if (layer.type === 'barcode') {
          const b = layer;
          const mappedHeader = mapping[b.column] || b.column;
          const value = String(row[mappedHeader] !== undefined ? row[mappedHeader] : row[b.column] || '').trim();

          if (!value) {
            list.push({
              rowIndex: rIdx,
              rowName,
              type: 'barcode',
              layerName: layer.name,
              message: `Barcode column "${mappedHeader || b.column}" is empty.`
            });
          } else {
            const validation = validateBarcode(value, b.format);
            if (!validation.isValid) {
              list.push({
                rowIndex: rIdx,
                rowName,
                type: 'barcode',
                layerName: layer.name,
                message: `Barcode format error: ${validation.error} (value: "${value}")`
              });
            }
          }
        }

        // 2. TEXT & COMPLIANCE OVERFLOW CHECK
        else if (layer.type === 'text') {
          const t = layer;
          const text = interpolateTokens(t.template, row, mapping);
          if (text && ctx) {
            // Split and wrap text
            ctx.font = `${t.fontStyle.includes('bold') ? 'bold' : 'normal'} ${t.fontSize}px Helvetica`;
            const words = text.split(/\s+/);
            const lines: string[] = [];
            let currentLine = '';

            for (const word of words) {
              const testLine = currentLine ? currentLine + ' ' + word : word;
              const w = ctx.measureText(testLine).width;
              if (w > lwPt && currentLine) {
                lines.push(currentLine);
                currentLine = word;
              } else {
                currentLine = testLine;
              }
            }
            if (currentLine) lines.push(currentLine);

            const lineHeight = t.fontSize * 1.25;
            const totalHeight = lines.length * lineHeight;

            if (totalHeight > lhPt) {
              list.push({
                rowIndex: rIdx,
                rowName,
                type: 'overflow',
                layerName: layer.name,
                message: `Text overflows vertical box by approx ${Math.round(totalHeight - lhPt)}pt (${lines.length} lines required).`
              });
            }
          }
        }

        // 3. COMPLIANCE TEXT AUTO-SCALE FAILURE CHECK
        else if (layer.type === 'compliance') {
          const c = layer;
          const mappedHeader = mapping[c.column] || c.column;
          const rawText = String(row[mappedHeader] !== undefined ? row[mappedHeader] : row[c.column] || '').trim();
          if (rawText && ctx) {
            const fullText = c.heading ? `${c.heading} ${rawText}` : rawText;

            // Try smallest font size (minFloor) to see if it still overflows
            ctx.font = `normal ${c.fontSizeMin}px Helvetica`;
            const words = fullText.split(/\s+/);
            const lines: string[] = [];
            let currentLine = '';

            for (const word of words) {
              const testLine = currentLine ? currentLine + ' ' + word : word;
              const w = ctx.measureText(testLine).width;
              if (w > lwPt && currentLine) {
                lines.push(currentLine);
                currentLine = word;
              } else {
                currentLine = testLine;
              }
            }
            if (currentLine) lines.push(currentLine);

            const lineHeight = c.fontSizeMin * 1.25;
            const totalHeight = lines.length * lineHeight;

            if (totalHeight > lhPt) {
              list.push({
                rowIndex: rIdx,
                rowName,
                type: 'overflow',
                layerName: layer.name,
                message: `Compliance block overflows bounding box even at minimum scaled size of ${c.fontSizeMin}pt.`
              });
            }
          }
        }
      });
    });

    return list;
  }, [layers, rows, mapping, layoutConfig]);

  const barcodeIssues = issues.filter(i => i.type === 'barcode');
  const overflowIssues = issues.filter(i => i.type === 'overflow');

  return (
    <div className="space-y-4">
      {/* Overview Card */}
      <div className="bg-slate-50/60 rounded-xl border border-slate-200 p-4 space-y-3">
        <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5 pb-2 border-b border-slate-200">
          <ShieldAlert className="w-4 h-4 text-slate-500" />
          Pre-Flight Quality Checklist
        </h3>

        <div className="grid grid-cols-2 gap-3 text-center">
          <div className="p-3 rounded-lg border border-slate-200 bg-white">
            <span className="text-[10px] font-bold text-slate-400 block uppercase">Barcode Errors</span>
            <span className={`text-lg font-bold block mt-1 ${barcodeIssues.length > 0 ? 'text-red-650 font-black' : 'text-emerald-600'}`}>
              {barcodeIssues.length}
            </span>
          </div>

          <div className="p-3 rounded-lg border border-slate-200 bg-white">
            <span className="text-[10px] font-bold text-slate-400 block uppercase">Text Overflows</span>
            <span className={`text-lg font-bold block mt-1 ${overflowIssues.length > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
              {overflowIssues.length}
            </span>
          </div>
        </div>

        {issues.length === 0 ? (
          <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-150 text-emerald-800 p-3 rounded-lg text-xs font-bold">
            <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>Pre-flight checks passed! Design is safe to print.</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 bg-amber-50 border border-amber-150 text-amber-800 p-3 rounded-lg text-xs font-bold leading-normal">
            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
            <span>Found {issues.length} potential layout/syntax issues. Fix them before bulk printing.</span>
          </div>
        )}
      </div>

      {/* Issues List */}
      {issues.length > 0 && (
        <div className="bg-slate-50/60 rounded-xl border border-slate-200 p-4 space-y-2">
          <span className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider">
            Detected Pre-Flight Issues
          </span>

          <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
            {issues.map((issue, idx) => {
              const isActivePreview = selectedRowIndex === issue.rowIndex;
              
              return (
                <div
                  key={idx}
                  onClick={() => onSelectRowIndex(issue.rowIndex)}
                  className={`p-2.5 rounded-lg border text-left cursor-pointer transition-all ${
                    isActivePreview
                      ? 'border-slate-400 bg-white ring-2 ring-slate-100'
                      : 'border-slate-200 bg-white hover:border-slate-350'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="font-extrabold text-[10px] text-slate-800 truncate">
                      {issue.rowName}
                    </span>
                    <span className={`text-[8px] font-bold uppercase px-1.5 py-0.5 rounded-full border ${
                      issue.type === 'barcode' 
                        ? 'bg-red-50 text-red-700 border-red-200' 
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}>
                      {issue.type}
                    </span>
                  </div>

                  <p className="text-[10px] text-slate-500 font-semibold mb-1">
                    Layer: <span className="text-slate-700 font-bold">{issue.layerName}</span>
                  </p>

                  <p className="text-[10px] text-slate-600 leading-normal font-medium">
                    {issue.message}
                  </p>

                  {isActivePreview && (
                    <span className="text-[8px] text-slate-500 font-bold block mt-1.5 text-right">
                      Active Preview Node
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
