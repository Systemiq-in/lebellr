'use client';

import React, { useState, useEffect } from 'react';
import { 
  FileSpreadsheet, Sliders, Layers, Settings, ShieldAlert, 
  Download, Loader2, Sparkles, RefreshCw
} from 'lucide-react';
import { LayoutConfig, Layer, InventoryRow, ColumnMapping } from '../../lib/types';
import { generateLabelsPDF } from '../../lib/pdf-generator';

// Imported Components
import DataUpload from '../../components/data-upload';
import LayoutSettings from '../../components/layout-settings';
import LayersManager from '../../components/layers-manager';
import LayerEditor from '../../components/layer-editor';
import PreflightChecker from '../../components/preflight-checker';
import CanvasPreview from '../../components/canvas-preview';

// Industry-tailored mock inventory dataset
const MOCK_DATASET: InventoryRow[] = [
  {
    __rowId: 'mock-1',
    Item_SKU: '8809462-810012',
    Product_Title: 'Hydrating Peptide Ceramide Cream',
    Retail_Price: 42.00,
    Promo_Price: 34.99,
    Stock_Qty: 10,
    Ingredients_List: 'Water, Glycerin, Caprylic/Capric Triglyceride, Niacinamide, Ceramide NP, Ceramide AP, Phytosphingosine, Cholesterol, Sodium Hyaluronate, Xanthan Gum, Phenoxyethanol, Ethylhexylglycerin.',
    Expiry_Month: '11/2028',
    Hazard_Flammable: 'FALSE',
    Hazard_Toxic: 'FALSE',
    Zone_Code: 'Zone-C',
    Box_Size: 'M'
  },
  {
    __rowId: 'mock-2',
    Item_SKU: '8809462-810029',
    Product_Title: 'Ultra Concentrated Salicylic Serum',
    Retail_Price: 28.50,
    Promo_Price: 0.00,
    Stock_Qty: 5,
    Ingredients_List: 'Propylene Glycol, Salicylic Acid (2.0%), Alcohol Denat., Tocopheryl Acetate, Melaleuca Alternifolia (Tea Tree) Leaf Oil, Limonene.',
    Expiry_Month: '05/2027',
    Hazard_Flammable: 'TRUE',
    Hazard_Toxic: 'TRUE',
    Zone_Code: 'Zone-A',
    Box_Size: 'S'
  },
  {
    __rowId: 'mock-3',
    Item_SKU: '4901301-360098',
    Product_Title: 'Organic Peppermint Essential Oil',
    Retail_Price: 19.99,
    Promo_Price: 14.50,
    Stock_Qty: 12,
    Ingredients_List: '100% Pure Mentha Piperita (Peppermint) Herb Oil. Warning: Keep out of reach of children. Dilute properly before applying to skin.',
    Expiry_Month: '08/2029',
    Hazard_Flammable: 'TRUE',
    Hazard_Toxic: 'FALSE',
    Zone_Code: 'Zone-A',
    Box_Size: 'S'
  },
  {
    __rowId: 'mock-4',
    Item_SKU: '4901301-360155',
    Product_Title: 'Premium Cocoa Butter Body Melt Balm',
    Retail_Price: 35.00,
    Promo_Price: 0.00,
    Stock_Qty: 8,
    Ingredients_List: 'Theobroma Cacao (Cocoa) Seed Butter, Butyrospermum Parkii (Shea) Butter, Cocos Nucifera (Coconut) Oil, Beeswax, Tocopherol.',
    Expiry_Month: '02/2028',
    Hazard_Flammable: 'FALSE',
    Hazard_Toxic: 'FALSE',
    Zone_Code: 'Zone-B',
    Box_Size: 'L'
  },
  {
    __rowId: 'mock-5',
    Item_SKU: '4901301-360210',
    Product_Title: 'Heavy-Duty Industrial Degreaser Spray',
    Retail_Price: 59.99,
    Promo_Price: 49.99,
    Stock_Qty: 15,
    Ingredients_List: 'Sodium Hydroxide, Ethylene Glycol Monobutyl Ether, Surfactants, Corrosion Inhibitors, Fragrance, Aqua. Corrosive mixture.',
    Expiry_Month: '03/2030',
    Hazard_Flammable: 'FALSE',
    Hazard_Toxic: 'TRUE',
    Zone_Code: 'Zone-C',
    Box_Size: 'XL'
  }
];

const DEFAULT_MAPPING: ColumnMapping = {
  sku: 'Item_SKU',
  title: 'Product_Title',
  price: 'Retail_Price',
  promoPrice: 'Promo_Price',
  quantity: 'Stock_Qty',
  ingredients: 'Ingredients_List',
  expiry: 'Expiry_Month',
  zone: 'Zone_Code'
};

const DEFAULT_LAYOUT: LayoutConfig = {
  preset: 'avery_3_10',
  pageFormat: 'a4',
  unit: 'mm',
  width: 63.5,
  height: 25.4,
  margin: 7.2,
  cols: 3,
  rows: 10,
  colGap: 2.5,
  rowGap: 0,
  sheetOffset: 0,
  showBleed: true
};

const DEFAULT_LAYERS = (layout: LayoutConfig): Layer[] => [
  // 1. Border Layer (Dynamic top-band based on Warehouse Zone)
  {
    id: 'layer-border-band',
    name: 'Zone Color Band',
    type: 'border',
    visible: true,
    x: 0,
    y: 0,
    width: layout.width,
    height: layout.height,
    borderType: 'top-band',
    thickness: 2.5,
    colorType: 'dynamic',
    staticColor: '#4F46E5',
    dynamicColumn: 'Zone_Code',
    colorRules: [
      { value: 'Zone-A', color: '#EF4444' }, // Red for hazardous/flammable zones
      { value: 'Zone-B', color: '#10B981' }, // Green for general logistics
      { value: 'Zone-C', color: '#3B82F6' }  // Blue for cosmetics cold-chain
    ]
  },
  // 2. Product Name/Title Text Block
  {
    id: 'layer-title',
    name: 'Product Name Text',
    type: 'text',
    visible: true,
    x: 2.0,
    y: 3.5,
    width: 38.0,
    height: 6.0,
    template: '{{Product_Title}}',
    fontSize: 7.5,
    fontStyle: 'bold',
    color: '#0F172A',
    align: 'left'
  },
  // 3. Price Display (Promo Strikethrough)
  {
    id: 'layer-price',
    name: 'Price Badge',
    type: 'pricing',
    visible: true,
    x: 2.0,
    y: 9.5,
    width: 25.0,
    height: 4.5,
    priceColumn: 'Retail_Price',
    promoColumn: 'Promo_Price',
    currencySymbol: '$',
    fontSize: '9.0',
    color: '#475569',
    promoColor: '#DC2626'
  },
  // 4. Ingredients Compliance Block (Auto Font Scaling)
  {
    id: 'layer-compliance',
    name: 'Ingredients (Auto Scaled)',
    type: 'compliance',
    visible: true,
    x: 2.0,
    y: 14.5,
    width: 38.0,
    height: 9.5,
    column: 'Ingredients_List',
    heading: 'Ingr:',
    fontSizeMax: 6.0,
    fontSizeMin: 4.5,
    color: '#334155'
  },
  // 5. GHS Hazard Symbols (Safety Mapping)
  {
    id: 'layer-ghs',
    name: 'GHS Hazard Diamonds',
    type: 'safety',
    visible: true,
    x: 43.5,
    y: 3.5,
    width: 18.0,
    height: 6.0,
    symbolSize: 4.8,
    mappings: [
      { column: 'Hazard_Flammable', symbol: 'flame', activeIf: 'true' },
      { column: 'Hazard_Toxic', symbol: 'skull', activeIf: 'true' }
    ]
  },
  // 6. Vector Barcode (Code 128)
  {
    id: 'layer-barcode',
    name: 'Item Vector Barcode',
    type: 'barcode',
    visible: true,
    x: 42.5,
    y: 10.0,
    width: 19.0,
    height: 9.5,
    column: 'Item_SKU',
    format: 'code128',
    includeText: true,
    fontSize: 5.5
  },
  // 7. Vector QR Code (Prov tracking)
  {
    id: 'layer-qr',
    name: 'Provenance QR Code',
    type: 'qrcode',
    visible: true,
    x: 49.0,
    y: 20.0,
    width: 12.0,
    height: 12.0,
    template: 'https://trace.labellr.com/p/{{Item_SKU}}'
  }
];

export default function App() {
  const [activeTab, setActiveTab] = useState<'upload' | 'layout' | 'layers' | 'editor' | 'preflight'>('upload');
  const [rows, setRows] = useState<InventoryRow[]>(MOCK_DATASET);
  const [headers, setHeaders] = useState<string[]>(Object.keys(MOCK_DATASET[0]).filter(k => !k.startsWith('__')));
  const [mapping, setMapping] = useState<ColumnMapping>(DEFAULT_MAPPING);
  
  const [layoutConfig, setLayoutConfig] = useState<LayoutConfig>(DEFAULT_LAYOUT);
  const [layers, setLayers] = useState<Layer[]>([]);
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);
  
  const [selectedRowIndex, setSelectedRowIndex] = useState<number>(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Initialize with default layers
  useEffect(() => {
    setLayers(DEFAULT_LAYERS(DEFAULT_LAYOUT));
    setSelectedLayerId(DEFAULT_LAYERS(DEFAULT_LAYOUT)[1].id); // Select name text layer
    setMounted(true);
  }, []);

  // Update layout border sizes when physical dimensions change
  const handleLayoutConfigChange = (newConfig: LayoutConfig) => {
    setLayoutConfig(newConfig);

    // Update border layer geometry if present to cover the new label size
    setLayers(prev => 
      prev.map(l => 
        l.type === 'border' && l.id === 'layer-border-band'
          ? { ...l, width: newConfig.width, height: newConfig.height }
          : l
      )
    );
  };

  const handleDataLoaded = (newRows: InventoryRow[], newHeaders: string[], autoMapping: ColumnMapping) => {
    setRows(newRows);
    setHeaders(newHeaders);
    setMapping(autoMapping);
    setSelectedRowIndex(0);
    setActiveTab('layout'); // Advance tab to help flow
  };

  const handleSelectLayer = (id: string | null) => {
    setSelectedLayerId(id);
    if (id) {
      setActiveTab('editor'); // Jump to editor for adjustments
    }
  };

  const handleSingleLayerChange = (updatedLayer: Layer) => {
    setLayers(prev => prev.map(l => l.id === updatedLayer.id ? updatedLayer : l));
  };

  // Keyboard layer nudge handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedLayerId) return;

      // Ignore nudging if user is typing in inputs, textareas, or dropdowns
      const active = document.activeElement;
      if (active) {
        const tagName = active.tagName.toLowerCase();
        if (tagName === 'input' || tagName === 'textarea' || tagName === 'select') {
          return;
        }
      }

      const arrows = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];
      if (!arrows.includes(e.key)) return;

      e.preventDefault();
      
      const step = e.shiftKey ? 2.0 : 0.5;

      setLayers(prev => prev.map(l => {
        if (l.id !== selectedLayerId) return l;

        let newX = l.x;
        let newY = l.y;

        if (e.key === 'ArrowLeft') newX = Math.max(0, Number((l.x - step).toFixed(2)));
        if (e.key === 'ArrowRight') newX = Number((l.x + step).toFixed(2));
        if (e.key === 'ArrowUp') newY = Math.max(0, Number((l.y - step).toFixed(2)));
        if (e.key === 'ArrowDown') newY = Number((l.y + step).toFixed(2));

        return { ...l, x: newX, y: newY };
      }));
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedLayerId]);

  if (!mounted) {
    return null; // Prevent SSR hydration mismatch
  }

  const resetToDefaultSample = () => {
    if (window.confirm('Reset workspace to industry sample data? Any unsaved sheet or layers modifications will be lost.')) {
      setRows(MOCK_DATASET);
      setHeaders(Object.keys(MOCK_DATASET[0]).filter(k => !k.startsWith('__')));
      setMapping(DEFAULT_MAPPING);
      setLayoutConfig(DEFAULT_LAYOUT);
      setLayers(DEFAULT_LAYERS(DEFAULT_LAYOUT));
      setSelectedLayerId(DEFAULT_LAYERS(DEFAULT_LAYOUT)[1].id);
      setSelectedRowIndex(0);
      setActiveTab('upload');
    }
  };

  // Compile PDF client-side
  const handleDownloadPDF = async () => {
    if (rows.length === 0) return;
    try {
      setIsGenerating(true);
      const doc = await generateLabelsPDF(layoutConfig, layers, rows, mapping);
      doc.save(`labellr_print_${layoutConfig.preset.toLowerCase()}.pdf`);
    } catch (err: any) {
      alert('Error building print PDF: ' + err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const selectedLayer = layers.find(l => l.id === selectedLayerId) || null;

  return (
    <main className="flex h-screen bg-slate-50 text-slate-800 overflow-hidden font-sans">
      
      {/* Side Control Panel */}
      <aside className="w-[420px] shrink-0 border-r border-slate-200 bg-white flex flex-col h-full shadow-sm relative z-10">
        
        {/* Brand Header */}
        <div className="p-4 border-b border-slate-200 bg-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg overflow-hidden border border-slate-200 shadow-sm flex items-center justify-center bg-slate-50">
              <img src="/logo.png" alt="Labellr Logo" className="w-full h-full object-cover" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-slate-850 uppercase tracking-wider flex items-center gap-1.5">
                Labellr
                <span className="text-[9px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full uppercase">
                  Studio
                </span>
              </h1>
              <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Physical Label Designer & PDF Compiler</p>
            </div>
          </div>

          <button
            type="button"
            onClick={resetToDefaultSample}
            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-650 hover:text-slate-900 text-[10px] font-bold flex items-center gap-1 transition-all duration-[160ms] ease-[cubic-bezier(0.23,1,0.32,1)] active:scale-[0.97] border border-slate-200"
            title="Reset to industry demo template"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Reset Demo
          </button>
        </div>

        {/* Tab Navigation */}
        <nav className="flex border-b border-slate-200 bg-slate-50/50 px-2">
          <button
            onClick={() => setActiveTab('upload')}
            className={`py-3 px-2 flex-1 text-center text-[10px] font-bold border-b-2 transition-all duration-[160ms] ease-[cubic-bezier(0.23,1,0.32,1)] active:scale-[0.97] flex flex-col items-center gap-1 ${
              activeTab === 'upload'
                ? 'border-slate-900 text-slate-900 bg-white'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            1. Ingestion
          </button>

          <button
            onClick={() => setActiveTab('layout')}
            className={`py-3 px-2 flex-1 text-center text-[10px] font-bold border-b-2 transition-all duration-[160ms] ease-[cubic-bezier(0.23,1,0.32,1)] active:scale-[0.97] flex flex-col items-center gap-1 ${
              activeTab === 'layout'
                ? 'border-slate-900 text-slate-900 bg-white'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            <Sliders className="w-4 h-4" />
            2. Physical
          </button>

          <button
            onClick={() => setActiveTab('layers')}
            className={`py-3 px-2 flex-1 text-center text-[10px] font-bold border-b-2 transition-all duration-[160ms] ease-[cubic-bezier(0.23,1,0.32,1)] active:scale-[0.97] flex flex-col items-center gap-1 ${
              activeTab === 'layers'
                ? 'border-slate-900 text-slate-900 bg-white'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            <Layers className="w-4 h-4" />
            3. Stack ({layers.length})
          </button>

          <button
            onClick={() => setActiveTab('editor')}
            className={`py-3 px-2 flex-1 text-center text-[10px] font-bold border-b-2 transition-all duration-[160ms] ease-[cubic-bezier(0.23,1,0.32,1)] active:scale-[0.97] flex flex-col items-center gap-1 ${
              activeTab === 'editor'
                ? 'border-slate-900 text-slate-900 bg-white'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            <Settings className="w-4 h-4" />
            4. Edit Element
          </button>

          <button
            onClick={() => setActiveTab('preflight')}
            className={`py-3 px-2 flex-1 text-center text-[10px] font-bold border-b-2 transition-all duration-[160ms] ease-[cubic-bezier(0.23,1,0.32,1)] active:scale-[0.97] flex flex-col items-center gap-1 ${
              activeTab === 'preflight'
                ? 'border-slate-900 text-slate-900 bg-white'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            5. Pre-Flight
          </button>
        </nav>

        {/* Dynamic Tab Body */}
        <div className="flex-1 overflow-y-auto p-4 bg-white">
          
          {activeTab === 'upload' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div>
                <h2 className="text-xs font-bold text-slate-850 uppercase tracking-wider mb-1">
                  1. Spreadsheet Ingestion & Matching
                </h2>
                <p className="text-[10px] text-slate-400 leading-normal font-semibold">
                  Upload your products list (CSV or Excel). Labellr will automatically scan headers and match them to label variable tokens.
                </p>
              </div>
              <DataUpload
                onDataLoaded={handleDataLoaded}
                currentMapping={mapping}
                onMappingChange={setMapping}
                headers={headers}
              />
            </div>
          )}

          {activeTab === 'layout' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div>
                <h2 className="text-xs font-bold text-slate-850 uppercase tracking-wider mb-1">
                  2. Physical Dimensions & Gaps
                </h2>
                <p className="text-[10px] text-slate-400 leading-normal font-semibold">
                  Define the structural target for physical print layout. Choose standard thermal roll widths or A4/A3 multi-row Avery matrices.
                </p>
              </div>
              <LayoutSettings
                config={layoutConfig}
                onChange={handleLayoutConfigChange}
              />
            </div>
          )}

          {activeTab === 'layers' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div>
                <h2 className="text-xs font-bold text-slate-850 uppercase tracking-wider mb-1">
                  3. Content Elements Stack
                </h2>
                <p className="text-[10px] text-slate-400 leading-normal font-semibold">
                  Add content elements inside the label workspace. Reorder stack indices to control drawing layers depth.
                </p>
              </div>
              <LayersManager
                layers={layers}
                selectedLayerId={selectedLayerId}
                onSelectLayer={handleSelectLayer}
                onLayersChange={setLayers}
                layoutConfig={layoutConfig}
              />
            </div>
          )}

          {activeTab === 'editor' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div>
                <h2 className="text-xs font-bold text-slate-850 uppercase tracking-wider mb-1">
                  4. Layer Property Inspector
                </h2>
                <p className="text-[10px] text-slate-400 leading-normal font-semibold">
                  Highly customize position, widths, colors, fonts, and spreadsheet binding for the active element layer.
                </p>
              </div>
              <LayerEditor
                layer={selectedLayer}
                onLayerChange={handleSingleLayerChange}
                layoutConfig={layoutConfig}
                headers={headers}
              />
            </div>
          )}

          {activeTab === 'preflight' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div>
                <h2 className="text-xs font-bold text-slate-850 uppercase tracking-wider mb-1">
                  5. Pre-flight Quality Assurance
                </h2>
                <p className="text-[10px] text-slate-400 leading-normal font-semibold">
                  Labellr runs real-time syntax checking on barcodes, and calculates font overflow checks on all inventory rows.
                </p>
              </div>
              <PreflightChecker
                layers={layers}
                rows={rows}
                mapping={mapping}
                layoutConfig={layoutConfig}
                onSelectRowIndex={setSelectedRowIndex}
                selectedRowIndex={selectedRowIndex}
              />
            </div>
          )}

        </div>

        {/* Compile Footer Action */}
        <div className="p-4 border-t border-slate-200 bg-slate-50/50 space-y-2 shrink-0">
          <div className="flex justify-between items-center text-[10px] text-slate-500 font-bold px-1">
            <span>Total printable items:</span>
            <span className="font-extrabold text-slate-800">{rows.length} rows</span>
          </div>

          <button
            type="button"
            onClick={handleDownloadPDF}
            disabled={rows.length === 0 || isGenerating}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg bg-slate-900 hover:bg-slate-950 text-white font-bold text-xs shadow-sm transition-all duration-[160ms] ease-[cubic-bezier(0.23,1,0.32,1)] active:scale-[0.97] disabled:opacity-50 disabled:pointer-events-none"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin animate-duration-1000" />
                Compiling Vector PDF...
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                Download Print-Ready PDF
              </>
            )}
          </button>
        </div>
      </aside>

      {/* Center visual layout preview workspace */}
      <section className="flex-1 bg-slate-100 flex flex-col h-full overflow-hidden">
        
        {/* Preview Header / Row selector bar */}
        <div className="h-14 border-b border-slate-200 bg-white px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Preview Row:</span>
            {rows.length > 0 ? (
              <select
                value={selectedRowIndex}
                onChange={(e) => setSelectedRowIndex(parseInt(e.target.value) || 0)}
                className="text-xs font-bold px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-800 focus:outline-none focus:border-slate-400"
              >
                {rows.map((row, idx) => {
                  const label = String(row[mapping.title || 'Product_Title'] || row.title || row.name || `Item ${idx + 1}`);
                  const sku = String(row[mapping.sku || 'Item_SKU'] || '');
                  return (
                    <option key={row.__rowId} value={idx}>
                      {idx + 1}. {label.slice(0, 32)}{label.length > 32 ? '...' : ''} {sku ? `(${sku})` : ''}
                    </option>
                  );
                })}
              </select>
            ) : (
              <span className="text-xs text-slate-400 font-semibold">No sheet uploaded</span>
            )}
          </div>

          <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-400">
            <Sparkles className="w-3.5 h-3.5 text-slate-500 animate-pulse" />
            <span>100% Client-Side Compiler</span>
          </div>
        </div>

        {/* Scaled Preview Sheet container */}
        <div className="flex-1 overflow-hidden relative">
          <CanvasPreview
            config={layoutConfig}
            layers={layers}
            rows={rows}
            mapping={mapping}
            selectedRowIndex={selectedRowIndex}
            onSelectRowIndex={setSelectedRowIndex}
            selectedLayerId={selectedLayerId}
            onSelectLayer={handleSelectLayer}
          />
        </div>
      </section>

    </main>
  );
}
