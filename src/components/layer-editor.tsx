'use client';

import React, { useState } from 'react';
import { 
  Sliders, ShieldAlert, Sparkles, Plus, Trash2 
} from 'lucide-react';
import { 
  Layer, LayoutConfig, ColumnMapping, BarcodeFormat, 
  SafetySymbolType, ColorMapRule, SafetyMapping 
} from '../lib/types';

interface LayerEditorProps {
  layer: Layer | null;
  onLayerChange: (layer: Layer) => void;
  layoutConfig: LayoutConfig;
  headers: string[];
}

export default function LayerEditor({
  layer,
  onLayerChange,
  layoutConfig,
  headers,
}: LayerEditorProps) {
  const [newRuleValue, setNewRuleValue] = useState('');
  const [newRuleColor, setNewRuleColor] = useState('#EF4444');

  const renderColumnOptions = () => (
    <>
      <optgroup label="Logical Mappings (Resilient to Uploads)">
        <option value="sku">Logical SKU / Code</option>
        <option value="title">Logical Product Title</option>
        <option value="price">Logical Retail Price</option>
        <option value="promoPrice">Logical Promo Price</option>
        <option value="quantity">Logical Print Quantity</option>
        <option value="ingredients">Logical Ingredients List</option>
        <option value="expiry">Logical Expiry Date</option>
        <option value="zone">Logical Logistics Zone</option>
      </optgroup>
      {headers.length > 0 && (
        <optgroup label="Physical Sheet Columns">
          {headers.map(h => (
            <option key={h} value={h}>{h}</option>
          ))}
        </optgroup>
      )}
    </>
  );

  if (!layer) {
    return (
      <div className="h-full flex items-center justify-center text-center p-6 border border-dashed border-slate-200 rounded-lg bg-slate-50/50 text-slate-400 text-xs font-semibold">
        Select a layer from the stack to configure its properties.
      </div>
    );
  }

  const updateLayerVal = (key: string, value: any) => {
    onLayerChange({
      ...layer,
      [key]: value
    } as Layer);
  };

  const injectToken = (token: string) => {
    if (layer.type === 'text' || layer.type === 'qrcode') {
      const current = (layer as any).template || '';
      updateLayerVal('template', current + `{{${token}}}`);
    }
  };

  const addSafetyMapping = () => {
    if (layer.type !== 'safety') return;
    const current = (layer.mappings || []) as SafetyMapping[];
    const newMap: SafetyMapping = {
      column: headers[0] || '',
      symbol: 'flame',
      activeIf: 'true'
    };
    updateLayerVal('mappings', [...current, newMap]);
  };

  const removeSafetyMapping = (idx: number) => {
    if (layer.type !== 'safety') return;
    const current = [...layer.mappings];
    current.splice(idx, 1);
    updateLayerVal('mappings', current);
  };

  const updateSafetyMapping = (idx: number, key: keyof SafetyMapping, val: any) => {
    if (layer.type !== 'safety') return;
    const current = layer.mappings.map((m, i) => i === idx ? { ...m, [key]: val } : m);
    updateLayerVal('mappings', current);
  };

  const addColorRule = () => {
    if (layer.type !== 'border' || !newRuleValue.trim()) return;
    const current = (layer.colorRules || []) as ColorMapRule[];
    
    // Check duplication
    if (current.some(r => r.value.toLowerCase() === newRuleValue.trim().toLowerCase())) return;

    const newRule: ColorMapRule = {
      value: newRuleValue.trim(),
      color: newRuleColor
    };

    updateLayerVal('colorRules', [...current, newRule]);
    setNewRuleValue('');
  };

  const removeColorRule = (val: string) => {
    if (layer.type !== 'border') return;
    const current = layer.colorRules.filter(r => r.value !== val);
    updateLayerVal('colorRules', current);
  };

  return (
    <div className="space-y-4">
      {/* Geometry Settings */}
      <div className="bg-slate-50/60 rounded-xl border border-slate-200 p-4 space-y-3">
        <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5 pb-2 border-b border-slate-200">
          <Sliders className="w-3.5 h-3.5 text-slate-500" />
          Layer Geometry ({layoutConfig.unit})
        </h3>

        <div>
          <label className="text-[10px] font-bold text-slate-500 block mb-1">Layer Label Name</label>
          <input
            type="text"
            value={layer.name}
            onChange={(e) => updateLayerVal('name', e.target.value)}
            className="w-full text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-800 focus:outline-none focus:border-slate-400"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] font-bold text-slate-500 block mb-1">Position X (Left)</label>
            <input
              type="number"
              step="0.1"
              value={layer.x}
              onChange={(e) => updateLayerVal('x', parseFloat(e.target.value) || 0)}
              className="w-full text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-800 focus:outline-none focus:border-slate-400"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-500 block mb-1">Position Y (Top)</label>
            <input
              type="number"
              step="0.1"
              value={layer.y}
              onChange={(e) => updateLayerVal('y', parseFloat(e.target.value) || 0)}
              className="w-full text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-800 focus:outline-none focus:border-slate-400"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-500 block mb-1">Width</label>
            <input
              type="number"
              step="0.1"
              value={layer.width}
              onChange={(e) => updateLayerVal('width', parseFloat(e.target.value) || 0)}
              className="w-full text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-800 focus:outline-none focus:border-slate-400"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-500 block mb-1">Height</label>
            <input
              type="number"
              step="0.1"
              value={layer.height}
              onChange={(e) => updateLayerVal('height', parseFloat(e.target.value) || 0)}
              className="w-full text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-800 focus:outline-none focus:border-slate-400"
            />
          </div>
        </div>

        {/* Quick Position Nudge Pad */}
        <div className="pt-3 border-t border-slate-200">
          <label className="text-[9px] font-bold text-slate-400 block mb-2 uppercase tracking-wide">
            Position Nudge Control (0.5 units)
          </label>
          <div className="flex items-center gap-3">
            <div className="grid grid-cols-3 gap-1 w-28 shrink-0">
              <div />
              <button
                type="button"
                onClick={() => updateLayerVal('y', Math.max(0, Number((layer.y - 0.5).toFixed(2))))}
                className="p-1 rounded bg-slate-100 hover:bg-slate-250 border border-slate-200 text-slate-700 flex items-center justify-center text-xs font-bold focus:outline-none transition-colors cursor-pointer"
                title="Nudge Up"
              >
                ▲
              </button>
              <div />
              
              <button
                type="button"
                onClick={() => updateLayerVal('x', Math.max(0, Number((layer.x - 0.5).toFixed(2))))}
                className="p-1 rounded bg-slate-100 hover:bg-slate-250 border border-slate-200 text-slate-700 flex items-center justify-center text-xs font-bold focus:outline-none transition-colors cursor-pointer"
                title="Nudge Left"
              >
                ◀
              </button>
              <div className="bg-slate-50 border border-slate-200 rounded flex items-center justify-center text-[9px] font-mono text-slate-500">
                Move
              </div>
              <button
                type="button"
                onClick={() => updateLayerVal('x', Number((layer.x + 0.5).toFixed(2)))}
                className="p-1 rounded bg-slate-100 hover:bg-slate-250 border border-slate-200 text-slate-700 flex items-center justify-center text-xs font-bold focus:outline-none transition-colors cursor-pointer"
                title="Nudge Right"
              >
                ▶
              </button>

              <div />
              <button
                type="button"
                onClick={() => updateLayerVal('y', Number((layer.y + 0.5).toFixed(2)))}
                className="p-1 rounded bg-slate-100 hover:bg-slate-250 border border-slate-200 text-slate-700 flex items-center justify-center text-xs font-bold focus:outline-none transition-colors cursor-pointer"
                title="Nudge Down"
              >
                ▼
              </button>
              <div />
            </div>
            
            <div className="text-[10px] text-slate-400 font-semibold leading-normal">
              Click arrows to nudge element X/Y. Or click directly on the preview and use keyboard arrows.
            </div>
          </div>
        </div>
      </div>

      {/* Specific Layer Editors */}
      <div className="bg-slate-50/60 rounded-xl border border-slate-200 p-4 space-y-4">
        <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5 pb-2 border-b border-slate-200">
          <Sparkles className="w-3.5 h-3.5 text-slate-500" />
          Element Configuration
        </h3>

        {/* --- TEXT LAYER CONFIG --- */}
        {layer.type === 'text' && (
          <div className="space-y-3">
            <div>
              <label className="text-[10px] font-bold text-slate-500 block mb-1">Text Template</label>
              <textarea
                value={(layer as any).template}
                onChange={(e) => updateLayerVal('template', e.target.value)}
                placeholder="Batch: {{Batch_Num}}"
                rows={2}
                className="w-full text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-800 focus:outline-none focus:border-slate-400 resize-none"
              />
            </div>

            {/* Token Injector Tags */}
            {headers.length > 0 && (
              <div className="space-y-1">
                <span className="text-[9px] font-bold text-slate-400 block uppercase">Click to Insert Dynamic Column:</span>
                <div className="flex flex-wrap gap-1 max-h-[80px] overflow-y-auto">
                  {headers.map(h => (
                    <button
                      key={h}
                      type="button"
                      onClick={() => injectToken(h)}
                      className="px-1.5 py-0.5 rounded bg-slate-200 hover:bg-slate-900 hover:text-white text-[9px] font-mono text-slate-650 transition-colors"
                    >
                      {h}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold text-slate-500 block mb-1">Font Size (pt)</label>
                <input
                  type="number"
                  value={(layer as any).fontSize}
                  onChange={(e) => updateLayerVal('fontSize', parseInt(e.target.value) || 8)}
                  className="w-full text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-800 focus:outline-none focus:border-slate-400"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 block mb-1">Font Style</label>
                <select
                  value={(layer as any).fontStyle}
                  onChange={(e) => updateLayerVal('fontStyle', e.target.value)}
                  className="w-full text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-850 focus:outline-none focus:border-slate-400"
                >
                  <option value="normal">Normal</option>
                  <option value="bold">Bold</option>
                  <option value="italic">Italic</option>
                  <option value="bold-italic">Bold Italic</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 block mb-1">Text Alignment</label>
                <select
                  value={(layer as any).align}
                  onChange={(e) => updateLayerVal('align', e.target.value)}
                  className="w-full text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-850 focus:outline-none focus:border-slate-400"
                >
                  <option value="left">Left</option>
                  <option value="center">Center</option>
                  <option value="right">Right</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 block mb-1">Vertical Alignment</label>
                <select
                  value={(layer as any).verticalAlign || 'top'}
                  onChange={(e) => updateLayerVal('verticalAlign', e.target.value)}
                  className="w-full text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-850 focus:outline-none focus:border-slate-400"
                >
                  <option value="top">Top</option>
                  <option value="middle">Middle</option>
                  <option value="bottom">Bottom</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 block mb-1">Line Height</label>
                <select
                  value={String((layer as any).lineHeight || '1.2')}
                  onChange={(e) => updateLayerVal('lineHeight', parseFloat(e.target.value) || 1.2)}
                  className="w-full text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-850 focus:outline-none focus:border-slate-400"
                >
                  <option value="1.0">1.0x (Dense)</option>
                  <option value="1.2">1.2x (Standard)</option>
                  <option value="1.4">1.4x (Spacious)</option>
                  <option value="1.6">1.6x (Wide)</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 block mb-1">Color (Hex)</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={(layer as any).color}
                    onChange={(e) => updateLayerVal('color', e.target.value)}
                    className="w-8 h-8 rounded border border-slate-200 bg-white p-0.5 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={(layer as any).color}
                    onChange={(e) => updateLayerVal('color', e.target.value)}
                    className="flex-1 text-xs font-mono px-2.5 py-1 rounded-lg border border-slate-200 bg-white text-slate-850 focus:outline-none focus:border-slate-400"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* --- BARCODE LAYER CONFIG --- */}
        {layer.type === 'barcode' && (
          <div className="space-y-3">
            <div>
              <label className="text-[10px] font-bold text-slate-500 block mb-1">Mapped Barcode Column</label>
              <select
                value={(layer as any).column}
                onChange={(e) => updateLayerVal('column', e.target.value)}
                className="w-full text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-850 focus:outline-none"
              >
                <option value="">-- Select Column --</option>
                {renderColumnOptions()}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold text-slate-500 block mb-1">Barcode Standard</label>
                <select
                  value={(layer as any).format}
                  onChange={(e) => updateLayerVal('format', e.target.value)}
                  className="w-full text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-850 focus:outline-none"
                >
                  <option value="code128">Code 128 (Alphanumeric)</option>
                  <option value="ean13">EAN-13 (13 Digits)</option>
                  <option value="upca">UPC-A (12 Digits)</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 block mb-1">Human Text Size (pt)</label>
                <input
                  type="number"
                  value={(layer as any).fontSize}
                  onChange={(e) => updateLayerVal('fontSize', parseInt(e.target.value) || 6)}
                  className="w-full text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-850 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="show-barcode-text"
                checked={(layer as any).includeText}
                onChange={(e) => updateLayerVal('includeText', e.target.checked)}
                className="w-4 h-4 rounded border-slate-200 bg-white text-slate-900 cursor-pointer"
              />
              <label htmlFor="show-barcode-text" className="text-xs font-semibold text-slate-650 cursor-pointer select-none">
                Show Human Readable Number below Bars
              </label>
            </div>
          </div>
        )}

        {/* --- QR CODE LAYER CONFIG --- */}
        {layer.type === 'qrcode' && (
          <div className="space-y-3">
            <div>
              <label className="text-[10px] font-bold text-slate-500 block mb-1">QR Value Template</label>
              <textarea
                value={(layer as any).template}
                onChange={(e) => updateLayerVal('template', e.target.value)}
                placeholder="https://mysite.com/p/{{sku}}"
                rows={2}
                className="w-full text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-850 focus:outline-none resize-none"
              />
            </div>

            {/* Token Injector Tags */}
            {headers.length > 0 && (
              <div className="space-y-1">
                <span className="text-[9px] font-bold text-slate-400 block uppercase">Insert Data Token:</span>
                <div className="flex flex-wrap gap-1 max-h-[80px] overflow-y-auto">
                  {headers.map(h => (
                    <button
                      key={h}
                      type="button"
                      onClick={() => injectToken(h)}
                      className="px-1.5 py-0.5 rounded bg-slate-200 hover:bg-slate-900 hover:text-white text-[9px] font-mono text-slate-650"
                    >
                      {h}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* --- PRICING LAYER CONFIG --- */}
        {layer.type === 'pricing' && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold text-slate-500 block mb-1">Standard Price Column</label>
                <select
                  value={(layer as any).priceColumn}
                  onChange={(e) => updateLayerVal('priceColumn', e.target.value)}
                  className="w-full text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-850 focus:outline-none"
                >
                  <option value="">-- Select Price --</option>
                  {renderColumnOptions()}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 block mb-1">Promotional Price Column</label>
                <select
                  value={(layer as any).promoColumn}
                  onChange={(e) => updateLayerVal('promoColumn', e.target.value)}
                  className="w-full text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-850 focus:outline-none"
                >
                  <option value="">-- Skip / Map Promo --</option>
                  {renderColumnOptions()}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 block mb-1">Currency Symbol</label>
                <input
                  type="text"
                  value={(layer as any).currencySymbol}
                  onChange={(e) => updateLayerVal('currencySymbol', e.target.value)}
                  className="w-full text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-850 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 block mb-1">Font Size (pt)</label>
                <input
                  type="text"
                  value={(layer as any).fontSize}
                  onChange={(e) => updateLayerVal('fontSize', e.target.value)}
                  className="w-full text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-850 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 block mb-1">Standard Color</label>
                <input
                  type="color"
                  value={(layer as any).color}
                  onChange={(e) => updateLayerVal('color', e.target.value)}
                  className="w-full h-8 rounded border border-slate-200 bg-white p-0.5 cursor-pointer"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 block mb-1">Promotional Color</label>
                <input
                  type="color"
                  value={(layer as any).promoColor}
                  onChange={(e) => updateLayerVal('promoColor', e.target.value)}
                  className="w-full h-8 rounded border border-slate-200 bg-white p-0.5 cursor-pointer"
                />
              </div>
            </div>
          </div>
        )}

        {/* --- COMPLIANCE / INGREDIENTS CONFIG --- */}
        {layer.type === 'compliance' && (
          <div className="space-y-3">
            <div>
              <label className="text-[10px] font-bold text-slate-500 block mb-1">Compliance Text Column</label>
              <select
                value={(layer as any).column}
                onChange={(e) => updateLayerVal('column', e.target.value)}
                className="w-full text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-850 focus:outline-none"
              >
                <option value="">-- Select Column --</option>
                {renderColumnOptions()}
              </select>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-500 block mb-1">Heading Prefix</label>
              <input
                type="text"
                value={(layer as any).heading}
                onChange={(e) => updateLayerVal('heading', e.target.value)}
                placeholder="INGREDIENTS:"
                className="w-full text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-850 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold text-slate-500 block mb-1">Max Font Size (pt)</label>
                <input
                  type="number"
                  value={(layer as any).fontSizeMax}
                  onChange={(e) => updateLayerVal('fontSizeMax', parseInt(e.target.value) || 10)}
                  className="w-full text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-850 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 block mb-1">Min Floor (pt)</label>
                <input
                  type="number"
                  value={(layer as any).fontSizeMin}
                  onChange={(e) => updateLayerVal('fontSizeMin', parseInt(e.target.value) || 6)}
                  className="w-full text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-850 focus:outline-none"
                />
              </div>

              <div className="col-span-2">
                <label className="text-[10px] font-bold text-slate-500 block mb-1">Text Color</label>
                <input
                  type="color"
                  value={(layer as any).color}
                  onChange={(e) => updateLayerVal('color', e.target.value)}
                  className="w-full h-8 rounded border border-slate-200 bg-white p-0.5 cursor-pointer"
                />
              </div>
            </div>
          </div>
        )}

        {/* --- SAFETY Pictograms CONFIG --- */}
        {layer.type === 'safety' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-1 border-b border-slate-200">
              <span className="text-[10px] font-bold text-slate-500 uppercase">ISO / GHS Flag Mappings</span>
              <button
                type="button"
                onClick={addSafetyMapping}
                className="px-2 py-0.5 rounded bg-slate-850 hover:bg-slate-950 text-white font-bold text-[9px] flex items-center gap-1 transition-colors"
              >
                <Plus className="w-2.5 h-2.5" />
                Add Mapping
              </button>
            </div>

            <div className="space-y-3 max-h-[160px] overflow-y-auto pr-1">
              {((layer as any).mappings || []).map((m: SafetyMapping, idx: number) => (
                <div key={idx} className="p-2 border border-slate-200 bg-white rounded-lg space-y-2 relative">
                  <button
                    type="button"
                    onClick={() => removeSafetyMapping(idx)}
                    className="absolute top-1.5 right-1.5 text-slate-400 hover:text-red-500 p-0.5 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>

                  <div className="grid grid-cols-2 gap-2 pr-6">
                    <div>
                      <label className="text-[9px] font-bold text-slate-500 block mb-0.5">Sheet Column</label>
                      <select
                        value={m.column}
                        onChange={(e) => updateSafetyMapping(idx, 'column', e.target.value)}
                        className="w-full text-[10px] font-semibold px-2 py-1 rounded-lg border border-slate-200 bg-white text-slate-880 focus:outline-none"
                      >
                        <option value="">-- Select Column --</option>
                        {renderColumnOptions()}
                      </select>
                    </div>

                    <div>
                      <label className="text-[9px] font-bold text-slate-500 block mb-0.5">GHS Symbol</label>
                      <select
                        value={m.symbol}
                        onChange={(e) => updateSafetyMapping(idx, 'symbol', e.target.value as SafetySymbolType)}
                        className="w-full text-[10px] font-semibold px-2 py-1 rounded-lg border border-slate-200 bg-white text-slate-800 focus:outline-none"
                      >
                        <option value="flame">Flame (Flammable)</option>
                        <option value="health">Health Hazard</option>
                        <option value="corrosive">Corrosive</option>
                        <option value="exclamation">Irritant (!)</option>
                        <option value="skull">Toxic (Skull)</option>
                        <option value="environment">Aquatic (Fish)</option>
                        <option value="gas">Gas Cylinder</option>
                      </select>
                    </div>

                    <div className="col-span-2">
                      <label className="text-[9px] font-bold text-slate-500 block mb-0.5">Trigger Condition</label>
                      <div className="flex gap-2">
                        <select
                           value={m.activeIf}
                           onChange={(e) => updateSafetyMapping(idx, 'activeIf', e.target.value)}
                           className="flex-1 text-[10px] font-semibold px-2 py-1 rounded-lg border border-slate-200 bg-white text-slate-800 focus:outline-none"
                        >
                          <option value="true">Column is TRUE / 1 / YES</option>
                          <option value="non-empty">Column contains any text</option>
                          <option value="match">Column matches value...</option>
                        </select>
                        
                        {m.activeIf === 'match' && (
                          <input
                            type="text"
                            value={m.matchValue || ''}
                            onChange={(e) => updateSafetyMapping(idx, 'matchValue', e.target.value)}
                            placeholder="Value"
                            className="w-20 text-[10px] font-semibold px-2 py-1 rounded-lg border border-slate-200 bg-white text-slate-800 focus:outline-none"
                          />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-500 block mb-1">
                Symbol Size ({layoutConfig.unit})
              </label>
              <input
                type="number"
                step="0.1"
                value={(layer as any).symbolSize}
                onChange={(e) => updateLayerVal('symbolSize', parseFloat(e.target.value) || 4)}
                className="w-full text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-850 focus:outline-none"
              />
            </div>
          </div>
        )}

        {/* --- BORDER / BAND LAYER CONFIG --- */}
        {layer.type === 'border' && (
          <div className="space-y-3">
            <div>
              <label className="text-[10px] font-bold text-slate-500 block mb-1">Border Geometry Type</label>
              <select
                value={(layer as any).borderType}
                onChange={(e) => updateLayerVal('borderType', e.target.value)}
                className="w-full text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-850 focus:outline-none"
              >
                <option value="full-border">Full Card Boundary Outline</option>
                <option value="top-band">Top Edge Accent Band</option>
                <option value="left-band">Left Edge Accent Band</option>
                <option value="right-band">Right Edge Accent Band</option>
                <option value="bottom-band">Bottom Edge Accent Band</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-500 block mb-1">
                Band/Border Thickness ({layoutConfig.unit})
              </label>
              <input
                type="number"
                step="0.1"
                value={(layer as any).thickness}
                onChange={(e) => updateLayerVal('thickness', parseFloat(e.target.value) || 1)}
                className="w-full text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-850 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-500 block mb-1">Color Mode</label>
              <select
                value={(layer as any).colorType}
                onChange={(e) => updateLayerVal('colorType', e.target.value)}
                className="w-full text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-850 focus:outline-none"
              >
                <option value="static">Static Uniform Color</option>
                <option value="dynamic">Dynamic Color Mapped to Column</option>
              </select>
            </div>

            {(layer as any).colorType === 'static' ? (
              <div>
                <label className="text-[10px] font-bold text-slate-500 block mb-1">Static Border Color</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={(layer as any).staticColor}
                    onChange={(e) => updateLayerVal('staticColor', e.target.value)}
                    className="w-8 h-8 rounded border border-slate-200 bg-white p-0.5 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={(layer as any).staticColor}
                    onChange={(e) => updateLayerVal('staticColor', e.target.value)}
                    className="flex-1 text-xs font-mono px-2.5 py-1 rounded-lg border border-slate-200 bg-white text-slate-850 focus:outline-none"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-1">Dynamic Driver Column</label>
                  <select
                    value={(layer as any).dynamicColumn}
                    onChange={(e) => updateLayerVal('dynamicColumn', e.target.value)}
                    className="w-full text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-850 focus:outline-none"
                  >
                    <option value="">-- Select Column --</option>
                    {renderColumnOptions()}
                  </select>
                </div>

                {/* Add Rule */}
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase border-b border-slate-200 pb-1">
                    Value to Color Map Rules
                  </span>
                  
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="e.g. Zone A, XL"
                      value={newRuleValue}
                      onChange={(e) => setNewRuleValue(e.target.value)}
                      className="flex-1 text-xs font-semibold px-2 py-1 rounded-lg border border-slate-200 bg-white text-slate-800 focus:outline-none"
                    />
                    <input
                      type="color"
                      value={newRuleColor}
                      onChange={(e) => setNewRuleColor(e.target.value)}
                      className="w-8 h-8 rounded border border-slate-200 bg-white p-0.5 cursor-pointer"
                    />
                    <button
                      type="button"
                      onClick={addColorRule}
                      className="px-2.5 py-1 rounded-lg bg-slate-850 hover:bg-slate-950 text-white font-bold text-xs transition-colors"
                    >
                      Add
                    </button>
                  </div>
                </div>

                {/* Rules List */}
                <div className="space-y-1.5 max-h-[120px] overflow-y-auto pr-1">
                  {((layer as any).colorRules || []).map((rule: ColorMapRule) => (
                    <div
                      key={rule.value}
                      className="flex items-center justify-between p-2 border border-slate-200 bg-white rounded-lg text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className="w-3.5 h-3.5 rounded-full border border-slate-200"
                          style={{ backgroundColor: rule.color }}
                        />
                        <span className="font-bold font-mono text-slate-650">{rule.value}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeColorRule(rule.value)}
                        className="text-slate-400 hover:text-red-500 p-0.5 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
