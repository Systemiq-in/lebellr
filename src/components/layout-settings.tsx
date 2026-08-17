'use client';

import React from 'react';
import { Sliders, Compass } from 'lucide-react';
import { LayoutConfig, PresetType, PhysicalUnit, PageFormat } from '../lib/types';

interface LayoutSettingsProps {
  config: LayoutConfig;
  onChange: (config: LayoutConfig) => void;
}

export default function LayoutSettings({ config, onChange }: LayoutSettingsProps) {
  // Preset definitions in physical metric values (mm)
  const presets: Record<Exclude<PresetType, 'custom'>, Omit<LayoutConfig, 'preset' | 'unit' | 'sheetOffset' | 'showBleed' | 'pageFormat'>> = {
    thermal_2_1: {
      width: 50.8,
      height: 25.4,
      margin: 0,
      cols: 1,
      rows: 1,
      colGap: 0,
      rowGap: 0
    },
    thermal_3_2: {
      width: 76.2,
      height: 50.8,
      margin: 0,
      cols: 1,
      rows: 1,
      colGap: 0,
      rowGap: 0
    },
    thermal_4_6: {
      width: 101.6,
      height: 152.4,
      margin: 0,
      cols: 1,
      rows: 1,
      colGap: 0,
      rowGap: 0
    },
    avery_3_10: {
      width: 63.5,
      height: 25.4,
      margin: 7.2,
      cols: 3,
      rows: 10,
      colGap: 2.5,
      rowGap: 0
    },
    avery_2_5: {
      width: 99.1,
      height: 57.0,
      margin: 8.5,
      cols: 2,
      rows: 5,
      colGap: 2.5,
      rowGap: 0
    }
  };

  const handlePresetChange = (preset: PresetType) => {
    if (preset === 'custom') {
      onChange({
        ...config,
        preset: 'custom'
      });
      return;
    }

    const details = presets[preset];
    const unitScale = config.unit === 'in' ? 1 / 25.4 : 1;

    onChange({
      ...config,
      preset,
      width: Number((details.width * unitScale).toFixed(2)),
      height: Number((details.height * unitScale).toFixed(2)),
      margin: Number((details.margin * unitScale).toFixed(2)),
      cols: details.cols,
      rows: details.rows,
      colGap: Number((details.colGap * unitScale).toFixed(2)),
      rowGap: Number((details.rowGap * unitScale).toFixed(2))
    });
  };

  const handleUnitChange = (newUnit: PhysicalUnit) => {
    if (newUnit === config.unit) return;

    // Convert values
    const conversion = newUnit === 'mm' ? 25.4 : 1 / 25.4;
    const format = (val: number) => Number((val * conversion).toFixed(2));

    onChange({
      ...config,
      unit: newUnit,
      width: format(config.width),
      height: format(config.height),
      margin: format(config.margin),
      colGap: format(config.colGap),
      rowGap: format(config.rowGap)
    });
  };

  const updateVal = (key: keyof LayoutConfig, value: any) => {
    onChange({
      ...config,
      [key]: value
    });
  };

  const isThermal = config.preset.startsWith('thermal');
  const isCustom = config.preset === 'custom';

  return (
    <div className="space-y-4">
      {/* Target Presets */}
      <div className="space-y-2">
        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
          Select Physical Layout Preset
        </label>
        <div className="grid grid-cols-2 gap-2">
          {/* Thermal Roll Presets */}
          <button
            type="button"
            onClick={() => handlePresetChange('thermal_2_1')}
            className={`p-2.5 rounded-lg border text-left flex flex-col justify-between transition-all ${
              config.preset === 'thermal_2_1'
                ? 'border-slate-900 bg-slate-900 text-white shadow-sm'
                : 'border-slate-200 bg-white text-slate-700 hover:border-slate-350 hover:bg-slate-50'
            }`}
          >
            <span className="text-[11px] font-bold">Thermal Roll 2x1"</span>
            <span className={`text-[9px] ${config.preset === 'thermal_2_1' ? 'text-slate-300' : 'text-slate-400'}`}>Single Column, 50x25mm</span>
          </button>

          <button
            type="button"
            onClick={() => handlePresetChange('thermal_3_2')}
            className={`p-2.5 rounded-lg border text-left flex flex-col justify-between transition-all ${
              config.preset === 'thermal_3_2'
                ? 'border-slate-900 bg-slate-900 text-white shadow-sm'
                : 'border-slate-200 bg-white text-slate-700 hover:border-slate-350 hover:bg-slate-50'
            }`}
          >
            <span className="text-[11px] font-bold">Thermal Roll 3x2"</span>
            <span className={`text-[9px] ${config.preset === 'thermal_3_2' ? 'text-slate-300' : 'text-slate-400'}`}>Single Column, 76x50mm</span>
          </button>

          <button
            type="button"
            onClick={() => handlePresetChange('thermal_4_6')}
            className={`p-2.5 rounded-lg border text-left flex flex-col justify-between transition-all ${
              config.preset === 'thermal_4_6'
                ? 'border-slate-900 bg-slate-900 text-white shadow-sm'
                : 'border-slate-200 bg-white text-slate-700 hover:border-slate-350 hover:bg-slate-50'
            }`}
          >
            <span className="text-[11px] font-bold">Shipping Roll 4x6"</span>
            <span className={`text-[9px] ${config.preset === 'thermal_4_6' ? 'text-slate-300' : 'text-slate-400'}`}>Single Column, 101x152mm</span>
          </button>

          {/* Avery Matrix Presets */}
          <button
            type="button"
            onClick={() => handlePresetChange('avery_3_10')}
            className={`p-2.5 rounded-lg border text-left flex flex-col justify-between transition-all ${
              config.preset === 'avery_3_10'
                ? 'border-slate-900 bg-slate-900 text-white shadow-sm'
                : 'border-slate-200 bg-white text-slate-700 hover:border-slate-350 hover:bg-slate-50'
            }`}
          >
            <span className="text-[11px] font-bold">Avery 3x10 Sheet</span>
            <span className={`text-[9px] ${config.preset === 'avery_3_10' ? 'text-slate-300' : 'text-slate-400'}`}>30 Labels, A4 Grid Matrix</span>
          </button>

          <button
            type="button"
            onClick={() => handlePresetChange('avery_2_5')}
            className={`p-2.5 rounded-lg border text-left flex flex-col justify-between transition-all ${
              config.preset === 'avery_2_5'
                ? 'border-slate-900 bg-slate-900 text-white shadow-sm'
                : 'border-slate-200 bg-white text-slate-700 hover:border-slate-350 hover:bg-slate-50'
            }`}
          >
            <span className="text-[11px] font-bold">Avery 2x5 Sheet</span>
            <span className={`text-[9px] ${config.preset === 'avery_2_5' ? 'text-slate-300' : 'text-slate-400'}`}>10 Labels, A4 Grid Matrix</span>
          </button>

          <button
            type="button"
            onClick={() => handlePresetChange('custom')}
            className={`p-2.5 rounded-lg border text-left flex flex-col justify-between transition-all ${
              config.preset === 'custom'
                ? 'border-slate-900 bg-slate-900 text-white shadow-sm'
                : 'border-slate-200 bg-white text-slate-700 hover:border-slate-350 hover:bg-slate-50'
            }`}
          >
            <span className="text-[11px] font-bold flex items-center gap-1">
              <Compass className={`w-3 h-3 ${config.preset === 'custom' ? 'text-white' : 'text-slate-400'}`} />
              Custom Layout
            </span>
            <span className={`text-[9px] ${config.preset === 'custom' ? 'text-slate-300' : 'text-slate-400'}`}>User Defined Dimensions</span>
          </button>
        </div>
      </div>

      <hr className="border-slate-200" />

      {/* Grid Settings Detail */}
      <div className="bg-slate-50/60 rounded-xl border border-slate-200 p-4 space-y-4">
        <div className="flex items-center justify-between pb-1.5 border-b border-slate-200">
          <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
            <Sliders className="w-4 h-4 text-slate-500" />
            Grid Parameters
          </h3>

          {/* Unit Toggle */}
          <div className="flex bg-slate-200/50 p-0.5 rounded-lg border border-slate-200">
            <button
              type="button"
              onClick={() => handleUnitChange('mm')}
              className={`px-2 py-0.5 text-[9px] font-bold rounded ${
                config.unit === 'mm'
                  ? 'bg-white text-slate-800 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Metric (mm)
            </button>
            <button
              type="button"
              onClick={() => handleUnitChange('in')}
              className={`px-2 py-0.5 text-[9px] font-bold rounded ${
                config.unit === 'in'
                  ? 'bg-white text-slate-800 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Imperial (in)
            </button>
          </div>
        </div>

        {/* Inputs */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] font-bold text-slate-500 block mb-1">
              Label Width ({config.unit})
            </label>
            <input
              type="number"
              step="0.01"
              value={config.width}
              disabled={!isCustom}
              onChange={(e) => updateVal('width', parseFloat(e.target.value) || 0)}
              className="w-full text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-800 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-500 block mb-1">
              Label Height ({config.unit})
            </label>
            <input
              type="number"
              step="0.01"
              value={config.height}
              disabled={!isCustom}
              onChange={(e) => updateVal('height', parseFloat(e.target.value) || 0)}
              className="w-full text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-800 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
            />
          </div>

          {!isThermal && (
            <>
              <div>
                <label className="text-[10px] font-bold text-slate-500 block mb-1">
                  Sheet Format
                </label>
                <select
                  value={config.pageFormat || 'a4'}
                  onChange={(e) => updateVal('pageFormat', e.target.value as PageFormat)}
                  className="w-full text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-800 focus:outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                >
                  <option value="a4">A4 (210 x 297mm)</option>
                  <option value="letter">US Letter (8.5 x 11")</option>
                  <option value="legal">US Legal (8.5 x 14")</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 block mb-1">
                  Grid Columns
                </label>
                <input
                  type="number"
                  value={config.cols}
                  disabled={!isCustom}
                  onChange={(e) => updateVal('cols', parseInt(e.target.value) || 1)}
                  className="w-full text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-800 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 block mb-1">
                  Grid Rows
                </label>
                <input
                  type="number"
                  value={config.rows}
                  disabled={!isCustom}
                  onChange={(e) => updateVal('rows', parseInt(e.target.value) || 1)}
                  className="w-full text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-800 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 block mb-1">
                  Page Margin ({config.unit})
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={config.margin}
                  disabled={!isCustom}
                  onChange={(e) => updateVal('margin', parseFloat(e.target.value) || 0)}
                  className="w-full text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-800 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 block mb-1">
                  Column Gap ({config.unit})
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={config.colGap}
                  disabled={!isCustom}
                  onChange={(e) => updateVal('colGap', parseFloat(e.target.value) || 0)}
                  className="w-full text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-800 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 block mb-1">
                  Row Gap ({config.unit})
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={config.rowGap}
                  disabled={!isCustom}
                  onChange={(e) => updateVal('rowGap', parseFloat(e.target.value) || 0)}
                  className="w-full text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-800 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                />
              </div>
            </>
          )}
        </div>

        {/* Toggles & Waste Mitigations */}
        <div className="space-y-3 pt-2 border-t border-slate-200">
          {!isThermal && (
            <div className="flex items-center justify-between">
              <div>
                <label className="text-[10px] font-bold text-slate-700 block">
                  Sheet Print Offset
                </label>
                <span className="text-[9px] text-slate-400 block leading-tight">
                  Skip used stickers (e.g. skip first 5)
                </span>
              </div>
              <input
                type="number"
                min="0"
                max={(config.cols * config.rows) - 1}
                value={config.sheetOffset}
                onChange={(e) => updateVal('sheetOffset', Math.max(0, parseInt(e.target.value) || 0))}
                className="w-16 text-center text-xs font-bold px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-850 focus:outline-none focus:border-slate-400"
              />
            </div>
          )}

          <div className="flex items-center justify-between">
            <div>
              <label className="text-[10px] font-bold text-slate-700 block">
                Show Safe Zone Guide
              </label>
              <span className="text-[9px] text-slate-400 block leading-tight">
                Simulate 1.5mm edge-bleed margin in preview
              </span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer select-none">
              <input
                type="checkbox"
                checked={config.showBleed}
                onChange={(e) => updateVal('showBleed', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-400 after:border-slate-350 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-slate-900 peer-checked:after:bg-white peer-checked:after:border-slate-900"></div>
            </label>
          </div>

          {!isThermal && (
            <>
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-[10px] font-bold text-slate-700 block">
                    Sheet Print Crop Marks
                  </label>
                  <span className="text-[9px] text-slate-400 block leading-tight">
                    Draw alignment markers in PDF margins
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={!!config.printCropMarks}
                    onChange={(e) => updateVal('printCropMarks', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-400 after:border-slate-350 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-slate-900 peer-checked:after:bg-white peer-checked:after:border-slate-900"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-[10px] font-bold text-slate-700 block">
                    Sticker Die-Cut Guides
                  </label>
                  <span className="text-[9px] text-slate-400 block leading-tight">
                    Draw faint dashed outlines around labels in PDF
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={!!config.printDieCutLines}
                    onChange={(e) => updateVal('printDieCutLines', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-400 after:border-slate-350 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-slate-900 peer-checked:after:bg-white peer-checked:after:border-slate-900"></div>
                </label>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
