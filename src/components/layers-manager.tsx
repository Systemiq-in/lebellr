'use client';

import React from 'react';
import { 
  Layers, Eye, EyeOff, Trash2, ArrowUp, ArrowDown, 
  Type, Barcode, QrCode, DollarSign, Info, ShieldAlert, Frame
} from 'lucide-react';
import { Layer, LayerType, LayoutConfig } from '../lib/types';

interface LayersManagerProps {
  layers: Layer[];
  selectedLayerId: string | null;
  onSelectLayer: (id: string | null) => void;
  onLayersChange: (layers: Layer[]) => void;
  layoutConfig: LayoutConfig;
}

export default function LayersManager({
  layers,
  selectedLayerId,
  onSelectLayer,
  onLayersChange,
  layoutConfig,
}: LayersManagerProps) {

  const getLayerIcon = (type: LayerType) => {
    switch (type) {
      case 'text': return <Type className="w-3.5 h-3.5" />;
      case 'barcode': return <Barcode className="w-3.5 h-3.5" />;
      case 'qrcode': return <QrCode className="w-3.5 h-3.5" />;
      case 'pricing': return <DollarSign className="w-3.5 h-3.5" />;
      case 'compliance': return <Info className="w-3.5 h-3.5" />;
      case 'safety': return <ShieldAlert className="w-3.5 h-3.5" />;
      case 'border': return <Frame className="w-3.5 h-3.5" />;
    }
  };

  const addLayer = (type: LayerType) => {
    const id = `${type}-${Date.now()}`;
    const name = `New ${type.charAt(0).toUpperCase() + type.slice(1)} Layer`;
    
    // Default size and positions within physical bounds
    const defaultWidth = Number((layoutConfig.width * 0.8).toFixed(1));
    const defaultHeight = Number((layoutConfig.height * 0.2).toFixed(1));
    const defaultX = Number((layoutConfig.width * 0.1).toFixed(1));
    const defaultY = Number((layoutConfig.height * 0.1).toFixed(1));

    let newLayer: Layer;

    switch (type) {
      case 'text':
        newLayer = {
          id, name, type, visible: true,
          x: defaultX, y: defaultY, width: defaultWidth, height: defaultHeight,
          template: 'Enter text or {{Column}}',
          fontSize: 10, fontStyle: 'normal', color: '#000000', align: 'left'
        };
        break;
      case 'barcode':
        newLayer = {
          id, name, type, visible: true,
          x: defaultX, y: defaultY, width: defaultWidth, height: Number((layoutConfig.height * 0.25).toFixed(1)),
          column: '', format: 'code128', includeText: true, fontSize: 8
        };
        break;
      case 'qrcode':
        newLayer = {
          id, name, type, visible: true,
          x: defaultX, y: defaultY, width: Number((layoutConfig.height * 0.3).toFixed(1)), height: Number((layoutConfig.height * 0.3).toFixed(1)),
          template: '{{sku}}'
        };
        break;
      case 'pricing':
        newLayer = {
          id, name, type, visible: true,
          x: defaultX, y: defaultY, width: defaultWidth, height: defaultHeight,
          priceColumn: '', promoColumn: '', currencySymbol: '$', fontSize: '12', color: '#000000', promoColor: '#EF4444'
        };
        break;
      case 'compliance':
        newLayer = {
          id, name, type, visible: true,
          x: defaultX, y: defaultY, width: defaultWidth, height: Number((layoutConfig.height * 0.35).toFixed(1)),
          column: '', heading: 'Ingredients:', fontSizeMax: 9, fontSizeMin: 6, color: '#1E293B'
        };
        break;
      case 'safety':
        newLayer = {
          id, name, type, visible: true,
          x: defaultX, y: defaultY, width: defaultWidth, height: Number((layoutConfig.height * 0.2).toFixed(1)),
          mappings: [], symbolSize: 6
        };
        break;
      case 'border':
        newLayer = {
          id, name, type, visible: true,
          x: 0, y: 0, width: layoutConfig.width, height: layoutConfig.height,
          borderType: 'full-border', thickness: 1, colorType: 'static', staticColor: '#1E293B', dynamicColumn: '', colorRules: []
        };
        break;
    }

    onLayersChange([newLayer, ...layers]);
    onSelectLayer(id);
  };

  const deleteLayer = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = layers.filter(l => l.id !== id);
    onLayersChange(updated);
    if (selectedLayerId === id) {
      onSelectLayer(updated[0]?.id || null);
    }
  };

  const toggleVisibility = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onLayersChange(
      layers.map(l => l.id === id ? { ...l, visible: !l.visible } : l)
    );
  };

  const moveLayer = (index: number, direction: 'up' | 'down', e: React.MouseEvent) => {
    e.stopPropagation();
    const nextIndex = direction === 'up' ? index - 1 : index + 1;
    if (nextIndex < 0 || nextIndex >= layers.length) return;

    const copy = [...layers];
    const temp = copy[index];
    copy[index] = copy[nextIndex];
    copy[nextIndex] = temp;

    onLayersChange(copy);
  };

  return (
    <div className="space-y-4">
      {/* Quick Add Grid */}
      <div className="space-y-2">
        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
          Add Design Element
        </label>
        <div className="grid grid-cols-3 gap-1.5">
          <button
            type="button"
            onClick={() => addLayer('text')}
            className="p-1.5 rounded-lg border border-slate-200 bg-white hover:border-slate-350 hover:bg-slate-50 text-slate-700 text-[10px] font-bold flex items-center justify-center gap-1 transition-all"
          >
            <Type className="w-3.5 h-3.5 text-slate-500" />
            Text
          </button>
          <button
            type="button"
            onClick={() => addLayer('barcode')}
            className="p-1.5 rounded-lg border border-slate-200 bg-white hover:border-slate-350 hover:bg-slate-50 text-slate-700 text-[10px] font-bold flex items-center justify-center gap-1 transition-all"
          >
            <Barcode className="w-3.5 h-3.5 text-slate-500" />
            Barcode
          </button>
          <button
            type="button"
            onClick={() => addLayer('qrcode')}
            className="p-1.5 rounded-lg border border-slate-200 bg-white hover:border-slate-350 hover:bg-slate-50 text-slate-700 text-[10px] font-bold flex items-center justify-center gap-1 transition-all"
          >
            <QrCode className="w-3.5 h-3.5 text-slate-500" />
            QR Code
          </button>
          <button
            type="button"
            onClick={() => addLayer('pricing')}
            className="p-1.5 rounded-lg border border-slate-200 bg-white hover:border-slate-350 hover:bg-slate-50 text-slate-700 text-[10px] font-bold flex items-center justify-center gap-1 transition-all"
          >
            <DollarSign className="w-3.5 h-3.5 text-slate-500" />
            Pricing
          </button>
          <button
            type="button"
            onClick={() => addLayer('compliance')}
            className="p-1.5 rounded-lg border border-slate-200 bg-white hover:border-slate-350 hover:bg-slate-50 text-slate-700 text-[10px] font-bold flex items-center justify-center gap-1 transition-all"
          >
            <Info className="w-3.5 h-3.5 text-slate-500" />
            Compliance
          </button>
          <button
            type="button"
            onClick={() => addLayer('safety')}
            className="p-1.5 rounded-lg border border-slate-200 bg-white hover:border-slate-350 hover:bg-slate-50 text-slate-700 text-[10px] font-bold flex items-center justify-center gap-1 transition-all"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-slate-500" />
            Safety
          </button>
          <button
            type="button"
            onClick={() => addLayer('border')}
            className="col-span-3 p-1.5 rounded-lg border border-slate-200 bg-white hover:border-slate-350 hover:bg-slate-50 text-slate-700 text-[10px] font-bold flex items-center justify-center gap-1 transition-all"
          >
            <Frame className="w-3.5 h-3.5 text-slate-500" />
            Add Borders & Color Accent Bands
          </button>
        </div>
      </div>

      <hr className="border-slate-200" />

      {/* Layer List */}
      <div className="space-y-2">
        <div className="flex items-center justify-between pb-1.5">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
            <Layers className="w-3.5 h-3.5" />
            Active Layers Stack
          </label>
          <span className="text-[9px] text-slate-400 font-mono">Depth (Z-Order)</span>
        </div>

        {layers.length === 0 ? (
          <div className="text-center py-6 border border-slate-200 rounded-lg bg-slate-50/50 text-slate-500 text-xs font-semibold">
            No design layers added yet.
          </div>
        ) : (
          <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
            {layers.map((layer, index) => {
              const isSelected = selectedLayerId === layer.id;

              return (
                <div
                  key={layer.id}
                  onClick={() => onSelectLayer(layer.id)}
                  className={`flex items-center justify-between p-2.5 rounded-lg border text-xs cursor-pointer select-none transition-all ${
                    isSelected
                      ? 'border-slate-900 bg-slate-900 text-white shadow-sm'
                      : 'border-slate-200 bg-white text-slate-750 hover:border-slate-350'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`${isSelected ? 'text-slate-300' : 'text-slate-550'} shrink-0`}>
                      {getLayerIcon(layer.type)}
                    </span>
                    <span className="font-bold truncate text-[11px]">{layer.name}</span>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {/* Move Up */}
                    <button
                      type="button"
                      disabled={index === 0}
                      onClick={(e) => moveLayer(index, 'up', e)}
                      className={`p-1 rounded transition-colors ${
                        isSelected 
                          ? 'hover:bg-slate-800 disabled:opacity-20 text-slate-300 hover:text-white' 
                          : 'hover:bg-slate-100 disabled:opacity-20 text-slate-400 hover:text-slate-800'
                      }`}
                    >
                      <ArrowUp className="w-3 h-3" />
                    </button>
                    {/* Move Down */}
                    <button
                      type="button"
                      disabled={index === layers.length - 1}
                      onClick={(e) => moveLayer(index, 'down', e)}
                      className={`p-1 rounded transition-colors ${
                        isSelected 
                          ? 'hover:bg-slate-800 disabled:opacity-20 text-slate-300 hover:text-white' 
                          : 'hover:bg-slate-100 disabled:opacity-20 text-slate-400 hover:text-slate-800'
                      }`}
                    >
                      <ArrowDown className="w-3 h-3" />
                    </button>
                    {/* Visibility */}
                    <button
                      type="button"
                      onClick={(e) => toggleVisibility(layer.id, e)}
                      className={`p-1 rounded transition-colors ${
                        isSelected 
                          ? 'hover:bg-slate-800 text-slate-300 hover:text-white' 
                          : 'hover:bg-slate-100 text-slate-400 hover:text-slate-850'
                      }`}
                    >
                      {layer.visible ? (
                        <Eye className="w-3.5 h-3.5" />
                      ) : (
                        <EyeOff className={`w-3.5 h-3.5 ${isSelected ? 'text-slate-500' : 'text-slate-350'}`} />
                      )}
                    </button>
                    {/* Delete */}
                    <button
                      type="button"
                      onClick={(e) => deleteLayer(layer.id, e)}
                      className={`p-1 rounded transition-colors ${
                        isSelected 
                          ? 'hover:bg-red-900/50 text-slate-300 hover:text-red-300' 
                          : 'hover:bg-red-50 text-slate-400 hover:text-red-650'
                      }`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
