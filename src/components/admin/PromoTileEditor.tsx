import React from 'react';
import { PromoTileConfig } from '../../types';
import { PromoTile } from '../common/PromoTile';
import { ImagePickerField } from './ImagePickerField';

interface PromoTileEditorProps {
  value?: PromoTileConfig;
  onChange: (updated: PromoTileConfig) => void;
  categoryName?: string;
}

export const PromoTileEditor: React.FC<PromoTileEditorProps> = ({
  value,
  onChange,
  categoryName = ''
}) => {
  const config: PromoTileConfig = value || {
    enabled: false,
    headline: '',
    subtext: '',
    buttonText: 'View all',
    link: '',
    bgStyle: 'orange',
    image: ''
  };

  const update = (field: keyof PromoTileConfig, val: any) => {
    onChange({
      ...config,
      [field]: val
    });
  };

  return (
    <div className="bg-orange-50/60 p-4 rounded-xl border border-orange-200/90 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-xs font-bold text-orange-950 uppercase tracking-wide">
            Row Promo Tile (Banner Tile)
          </h4>
          <p className="text-[11px] text-slate-600">
            Displays a banner tile as the first item in this row on desktop, and a strip above the row on mobile.
          </p>
        </div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={!!config.enabled}
            onChange={(e) => update('enabled', e.target.checked)}
            className="rounded border-slate-300 text-orange-600 focus:ring-orange-500 w-4 h-4"
          />
          <span className="text-xs font-bold text-slate-800">
            {config.enabled ? 'Enabled' : 'Disabled'}
          </span>
        </label>
      </div>

      {config.enabled && (
        <div className="space-y-3 pt-2 border-t border-orange-200/70">
          {/* Headline & Subtext */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-700">Headline (Max 40 chars)</label>
                <span className={`text-[10px] font-mono ${(config.headline || '').length > 40 ? 'text-rose-600 font-bold' : 'text-slate-400'}`}>
                  {(config.headline || '').length}/40
                </span>
              </div>
              <input
                type="text"
                maxLength={40}
                value={config.headline || ''}
                onChange={(e) => update('headline', e.target.value)}
                placeholder="e.g. Smart Wi-Fi Cameras"
                className="w-full bg-white border border-slate-300 text-xs p-2 rounded"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-700">Subtext (Optional, max 60 chars)</label>
                <span className={`text-[10px] font-mono ${(config.subtext || '').length > 60 ? 'text-rose-600 font-bold' : 'text-slate-400'}`}>
                  {(config.subtext || '').length}/60
                </span>
              </div>
              <input
                type="text"
                maxLength={60}
                value={config.subtext || ''}
                onChange={(e) => update('subtext', e.target.value)}
                placeholder="e.g. Direct phone alerts & wireless storage"
                className="w-full bg-white border border-slate-300 text-xs p-2 rounded"
              />
            </div>
          </div>

          {/* Button Text & Link */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-700">Button Text (Max 24 chars)</label>
                <span className={`text-[10px] font-mono ${(config.buttonText || '').length > 24 ? 'text-rose-600 font-bold' : 'text-slate-400'}`}>
                  {(config.buttonText || '').length}/24
                </span>
              </div>
              <input
                type="text"
                maxLength={24}
                value={config.buttonText || ''}
                onChange={(e) => update('buttonText', e.target.value)}
                placeholder="e.g. Explore Wi-Fi cameras"
                className="w-full bg-white border border-slate-300 text-xs p-2 rounded"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Link Destination</label>
              <input
                type="text"
                value={config.link || ''}
                onChange={(e) => update('link', e.target.value)}
                placeholder="e.g. /category/wifi-cameras or /catalog"
                className="w-full bg-white border border-slate-300 text-xs p-2 rounded font-mono"
              />
            </div>
          </div>

          {/* Background Style */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Background Style</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => update('bgStyle', 'orange')}
                className={`py-2 px-3 rounded-lg text-xs font-bold border transition-all ${
                  (config.bgStyle || 'orange') === 'orange'
                    ? 'bg-[#F15A24] text-white border-[#F15A24] shadow-sm'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                }`}
              >
                Brand Orange
              </button>
              <button
                type="button"
                onClick={() => update('bgStyle', 'dark')}
                className={`py-2 px-3 rounded-lg text-xs font-bold border transition-all ${
                  config.bgStyle === 'dark'
                    ? 'bg-[#141210] text-white border-[#141210] shadow-sm'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                }`}
              >
                Dark
              </button>
              <button
                type="button"
                onClick={() => update('bgStyle', 'tint')}
                className={`py-2 px-3 rounded-lg text-xs font-bold border transition-all ${
                  config.bgStyle === 'tint'
                    ? 'bg-[#FAF7F2] text-[#111827] border-orange-300 shadow-sm'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                }`}
              >
                Soft Tint
              </button>
            </div>
          </div>

          <ImagePickerField
            label="Image URL (Transparent PNG required)"
            value={config.image || ''}
            onChange={(url) => update('image', url)}
            placeholder="e.g. /images/hero/hikvision-bullet.png"
            helperText="Use a transparent PNG with no background or border. The image will bleed past the bottom-right corner. If left blank, category SVG illustration will be used."
            theme="light"
            modalTitle="Select Promo Tile Image from Media Library"
          />

          {/* Live Preview (Desktop and Mobile) */}
          <div className="pt-3 border-t border-orange-200/70 space-y-2">
            <span className="text-xs font-bold text-slate-700 block">Live Preview</span>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start bg-slate-900/10 p-3 rounded-xl">
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Desktop Tile (Card Width):
                </span>
                <div className="w-[280px] h-[440px] max-w-full">
                  <PromoTile
                    config={config}
                    categoryName={categoryName}
                    onNavigate={() => {}}
                    isMobileStrip={false}
                  />
                </div>
              </div>

              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Mobile Strip (Banner Width):
                </span>
                <div className="w-full max-w-[340px]">
                  <PromoTile
                    config={config}
                    categoryName={categoryName}
                    onNavigate={() => {}}
                    isMobileStrip={true}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

