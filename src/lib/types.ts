export type PhysicalUnit = 'mm' | 'in';

export interface InventoryRow {
  __rowId: string;
  [key: string]: any;
}

export interface ColumnMapping {
  sku: string;
  title: string;
  price: string;
  promoPrice: string;
  quantity: string;
  ingredients: string;
  expiry: string;
  zone: string;
  [key: string]: string; // Support arbitrary dynamic mappings
}

export type PresetType = 
  | 'thermal_2_1' 
  | 'thermal_3_2' 
  | 'thermal_4_6' 
  | 'avery_3_10' 
  | 'avery_2_5' 
  | 'custom';

export type PageFormat = 'a4' | 'letter' | 'legal';

export interface LayoutConfig {
  preset: PresetType;
  pageFormat: PageFormat;
  unit: PhysicalUnit;
  width: number;
  height: number;
  margin: number;
  cols: number;
  rows: number;
  colGap: number;
  rowGap: number;
  sheetOffset: number; // Skip count on the first sheet
  showBleed: boolean;  // Draw safe-zone guide (1.5mm inside boundary)
  printCropMarks?: boolean;
  printDieCutLines?: boolean;
}

export type LayerType = 
  | 'text' 
  | 'barcode' 
  | 'qrcode' 
  | 'compliance' 
  | 'pricing' 
  | 'safety' 
  | 'border';

export interface BaseLayer {
  id: string;
  name: string;
  type: LayerType;
  visible: boolean;
  x: number;       // Position in physical units (mm or in)
  y: number;       // Position in physical units
  width: number;   // Size in physical units
  height: number;  // Size in physical units
}

export interface TextLayer extends BaseLayer {
  type: 'text';
  template: string; // "Batch: {{Batch_Num}}"
  fontSize: number;  // in points (e.g. 10)
  fontStyle: 'normal' | 'bold' | 'italic' | 'bold-italic';
  color: string;     // Hex
  align: 'left' | 'center' | 'right';
  verticalAlign?: 'top' | 'middle' | 'bottom';
  lineHeight?: number;
}

export type BarcodeFormat = 'code128' | 'ean13' | 'upca';

export interface BarcodeLayer extends BaseLayer {
  type: 'barcode';
  column: string;
  format: BarcodeFormat;
  includeText: boolean;
  fontSize: number;
}

export interface QrLayer extends BaseLayer {
  type: 'qrcode';
  template: string; // e.g. "https://my.co/p/{{SKU}}"
}

export interface PricingLayer extends BaseLayer {
  type: 'pricing';
  priceColumn: string;
  promoColumn: string;
  currencySymbol: string;
  fontSize: string; // e.g. "12"
  color: string;      // Standard color
  promoColor: string; // Sale color
}

export interface ComplianceLayer extends BaseLayer {
  type: 'compliance';
  column: string;     // Column with ingredients/directions
  heading: string;    // Text title like "INGREDIENTS:"
  fontSizeMax: number; // Starting font size (e.g. 10pt)
  fontSizeMin: number; // Bottom limit (e.g. 6pt)
  color: string;
}

export type SafetySymbolType = 
  | 'flame' 
  | 'health' 
  | 'corrosive' 
  | 'exclamation' 
  | 'skull' 
  | 'environment' 
  | 'gas';

export interface SafetyMapping {
  column: string;
  symbol: SafetySymbolType;
  activeIf: 'true' | 'non-empty' | 'match';
  matchValue?: string;
}

export interface SafetyLayer extends BaseLayer {
  type: 'safety';
  mappings: SafetyMapping[];
  symbolSize: number; // physical size of each square symbol in mm/in
}

export interface ColorMapRule {
  value: string;
  color: string;
}

export interface BorderLayer extends BaseLayer {
  type: 'border';
  borderType: 'full-border' | 'top-band' | 'left-band' | 'right-band' | 'bottom-band';
  thickness: number;
  colorType: 'static' | 'dynamic';
  staticColor: string;
  dynamicColumn: string;
  colorRules: ColorMapRule[];
}

export type Layer = 
  | TextLayer 
  | BarcodeLayer 
  | QrLayer 
  | PricingLayer 
  | ComplianceLayer 
  | SafetyLayer 
  | BorderLayer;
