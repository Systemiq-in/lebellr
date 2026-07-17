'use client';

import React, { useRef, useState } from 'react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { Upload, FileSpreadsheet, Check, RefreshCw, AlertCircle } from 'lucide-react';
import { ColumnMapping, InventoryRow } from '../lib/types';

interface DataUploadProps {
  onDataLoaded: (rows: InventoryRow[], columns: string[], defaultMapping: ColumnMapping) => void;
  currentMapping: ColumnMapping;
  onMappingChange: (mapping: ColumnMapping) => void;
  headers: string[];
}

export default function DataUpload({
  onDataLoaded,
  currentMapping,
  onMappingChange,
  headers,
}: DataUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Smart Column Detection Rules
  const detectSmartMapping = (cols: string[]): ColumnMapping => {
    const defaultMap: ColumnMapping = {
      sku: '',
      title: '',
      price: '',
      promoPrice: '',
      quantity: '',
      ingredients: '',
      expiry: '',
      zone: '',
    };

    const lowercaseCols = cols.map(c => c.toLowerCase().trim().replace(/[-_]/g, ''));

    const searchRules: Record<keyof ColumnMapping, string[]> = {
      sku: ['sku', 'skuid', 'itemcode', 'productcode', 'id', 'code', 'partnumber'],
      title: ['name', 'title', 'productname', 'itemname', 'description', 'label'],
      price: ['price', 'mrp', 'rate', 'cost', 'retailprice', 'standardprice'],
      promoPrice: ['promoprice', 'saleprice', 'discountprice', 'offerprice', 'specialprice', 'promo'],
      quantity: ['qty', 'quantity', 'count', 'copies', 'stock', 'printqty', 'printcount'],
      ingredients: ['ingredients', 'ingredientslist', 'contents', 'composition', 'details', 'warnings', 'directions'],
      expiry: ['expiry', 'exp', 'expdate', 'expirydate', 'bestbefore', 'useby'],
      zone: ['zone', 'warehouse', 'bin', 'location', 'rack', 'warehousezone'],
    };

    (Object.keys(searchRules) as Array<keyof ColumnMapping>).forEach((key) => {
      const matchIndex = lowercaseCols.findIndex(col => 
        searchRules[key].some(rule => col.includes(rule) || rule.includes(col))
      );
      if (matchIndex !== -1) {
        defaultMap[key] = cols[matchIndex];
      } else {
        // Fallback: check exact or close fits
        const exactMatch = cols.find(col => col.toLowerCase().trim() === String(key).toLowerCase());
        if (exactMatch) {
          defaultMap[key] = exactMatch;
        }
      }
    });

    return defaultMap;
  };

  const handleFile = (file: File) => {
    setFileName(file.name);
    setParseError(null);

    const fileReader = new FileReader();
    const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');

    if (isExcel) {
      fileReader.onload = (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: 'binary' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const json = XLSX.utils.sheet_to_json(worksheet) as any[];

          if (json.length === 0) {
            throw new Error('The uploaded Excel sheet is empty.');
          }

          // Extract headers from first item keys
          const cols = Object.keys(json[0]).filter(k => !k.startsWith('__'));
          const formattedRows = json.map((r, idx) => ({
            ...r,
            __rowId: `row-${idx}-${Date.now()}`
          }));

          const smartMap = detectSmartMapping(cols);
          onDataLoaded(formattedRows, cols, smartMap);
        } catch (err: any) {
          setParseError(err.message || 'Failed to parse Excel file');
        }
      };
      fileReader.readAsBinaryString(file);
    } else {
      // CSV Parsing using PapaParse
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: true,
        complete: (results) => {
          if (results.errors.length > 0 && results.data.length === 0) {
            setParseError('Error parsing CSV file: ' + results.errors[0].message);
            return;
          }
          if (results.data.length === 0) {
            setParseError('The uploaded CSV is empty.');
            return;
          }

          const cols = results.meta.fields || [];
          const formattedRows = results.data.map((r: any, idx) => ({
            ...r,
            __rowId: `row-${idx}-${Date.now()}`
          }));

          const smartMap = detectSmartMapping(cols);
          onDataLoaded(formattedRows, cols, smartMap);
        },
        error: (err) => {
          setParseError('Failed to parse CSV: ' + err.message);
        }
      });
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const updateMapping = (key: keyof ColumnMapping, value: string) => {
    onMappingChange({
      ...currentMapping,
      [key]: value
    });
  };

  return (
    <div className="space-y-4">
      {/* Upload Drag & Drop Area */}
      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all duration-200 ${
          dragActive 
            ? 'border-slate-800 bg-slate-50' 
            : fileName 
            ? 'border-emerald-500 bg-emerald-50/30' 
            : 'border-slate-200 hover:border-slate-300 bg-white'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.xlsx,.xls"
          onChange={handleFileInputChange}
          className="hidden"
        />

        {fileName ? (
          <div className="flex flex-col items-center justify-center space-y-2">
            <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600">
              <Check className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-850">{fileName}</p>
              <p className="text-[10px] text-emerald-600 font-semibold mt-0.5">Spreadsheet parsed successfully</p>
            </div>
            <button 
              type="button" 
              className="text-[10px] font-bold text-slate-650 hover:text-slate-850 flex items-center gap-1 mt-2 mx-auto bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-md"
            >
              <RefreshCw className="w-3 h-3" />
              Replace File
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center space-y-3">
            <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-700">
                Drag & drop inventory sheet or <span className="text-slate-900 underline">browse</span>
              </p>
              <p className="text-[10px] text-slate-400 mt-1 font-semibold">Supports .csv, .xlsx, .xls</p>
            </div>
          </div>
        )}
      </div>

      {parseError && (
        <div className="flex items-start gap-2 bg-red-50 border border-red-150 text-red-700 rounded-lg p-3 text-[11px] font-semibold leading-relaxed">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
          <span>{parseError}</span>
        </div>
      )}

      {/* Smart Mapping Grid */}
      {headers.length > 0 && (
        <div className="bg-slate-50/60 rounded-xl border border-slate-200 p-4 space-y-3">
          <div className="flex items-center justify-between pb-1.5 border-b border-slate-200">
            <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <FileSpreadsheet className="w-4 h-4 text-slate-500" />
              Smart Column Mapping
            </h3>
            <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-150 px-2 py-0.5 rounded-full">
              Automated
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {(Object.keys(currentMapping) as Array<keyof ColumnMapping>).map((key) => {
              const keyStr = String(key);
              const displayLabel = keyStr.charAt(0).toUpperCase() + keyStr.slice(1).replace(/([A-Z])/g, ' $1');
              const mappedValue = currentMapping[key];
              const isMapped = mappedValue !== '';

              return (
                <div key={key} className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 flex items-center justify-between">
                    <span>{displayLabel}</span>
                    {isMapped && (
                      <span className="text-[8px] text-slate-400 font-mono">Matched</span>
                    )}
                  </label>
                  <select
                    value={mappedValue}
                    onChange={(e) => updateMapping(key, e.target.value)}
                    className={`w-full text-xs font-semibold px-2 py-1.5 rounded-lg border bg-white focus:outline-none transition-all ${
                      isMapped 
                        ? 'border-slate-400 text-slate-800' 
                        : 'border-slate-200 text-slate-400'
                    }`}
                  >
                    <option value="">-- Skip / Map Later --</option>
                    {headers.map(h => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
