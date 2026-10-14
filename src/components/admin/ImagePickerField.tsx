import React, { useState, useRef, useEffect } from 'react';
import { Image as ImageIcon, UploadCloud, X, AlertCircle, ExternalLink, RefreshCw, Check } from 'lucide-react';
import { MediaPickerModal } from './MediaLibraryModal';
import { mediaService } from '../../services';

export interface ImagePickerFieldProps {
  label?: string;
  value: string;
  onChange: (url: string) => void;
  placeholder?: string;
  helperText?: string;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  theme?: 'light' | 'dark';
  allowUpload?: boolean;
  folder?: string;
  modalTitle?: string;
  id?: string;
  name?: string;
  className?: string;
  previewHeight?: string;
  previewFit?: 'contain' | 'cover';
  showTransparencyChecker?: boolean;
  presets?: Array<{ label: string; url: string }>;
}

/**
 * Validates whether an image URL is safe for external link navigation.
 * Permits valid HTTP/HTTPS URLs and approved local absolute paths beginning with single '/'.
 * Rejects unsafe schemes like javascript:, data:, vbscript:, and protocol-relative '//'.
 */
export const isSafeLinkUrl = (url?: string): boolean => {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  if (!trimmed) return false;

  // Local absolute path starting with '/' but not protocol-relative '//' or '/\'
  if (trimmed.startsWith('/') && !trimmed.startsWith('//') && !trimmed.startsWith('/\\')) {
    return true;
  }

  // HTTP or HTTPS URL
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    try {
      const parsed = new URL(trimmed);
      return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
      return false;
    }
  }

  return false;
};

export const ImagePickerField: React.FC<ImagePickerFieldProps> = ({
  label,
  value,
  onChange,
  placeholder = 'https://... or /images/... or /uploads/...',
  helperText,
  error,
  disabled = false,
  required = false,
  theme = 'dark',
  allowUpload = true,
  modalTitle,
  id,
  name,
  className = '',
  previewHeight = 'h-24',
  previewFit = 'contain',
  showTransparencyChecker = true,
  presets
}) => {
  const [imageLoadError, setImageLoadError] = useState(false);
  const [isImageLoading, setIsImageLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [useCheckerPattern, setUseCheckerPattern] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // When value changes from outside or selection, reset error state
  useEffect(() => {
    setImageLoadError(false);
    setUploadError(null);
    if (value && value.trim()) {
      setIsImageLoading(true);
    } else {
      setIsImageLoading(false);
    }
  }, [value]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];

    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setUploadError('Invalid format: Only PNG, JPG, or WebP images are accepted.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }
    const maxBytes = 5 * 1024 * 1024; // 5 MB
    if (file.size > maxBytes) {
      setUploadError('File exceeds 5 MB upload limit.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setIsUploading(true);
    setUploadError(null);
    try {
      const uploaded = await mediaService.uploadMedia(file);
      if (uploaded && uploaded.url) {
        onChange(uploaded.url);
      }
    } catch (err: any) {
      setUploadError(err.message || 'Image upload failed. Please try again.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const isDark = theme === 'dark';

  const isTransparentFormat = value && (
    value.toLowerCase().endsWith('.png') ||
    value.toLowerCase().endsWith('.svg') ||
    value.toLowerCase().endsWith('.webp')
  );

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <div className="flex items-center justify-between">
          <label
            htmlFor={id}
            className={`text-xs font-bold block ${isDark ? 'text-slate-300' : 'text-slate-700'}`}
          >
            {label} {required && <span className="text-rose-500">*</span>}
          </label>
          {presets && presets.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className={`text-[10px] font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Presets:
              </span>
              {presets.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  disabled={disabled}
                  onClick={() => onChange(preset.url)}
                  className={`text-[10px] px-2 py-0.5 rounded font-mono transition-colors ${
                    isDark
                      ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Main Input Row */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <input
            id={id}
            name={name}
            type="text"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            disabled={disabled}
            required={required}
            className={`w-full px-3 py-2 text-xs rounded-xl font-mono focus:outline-none transition-colors pr-8 ${
              isDark
                ? 'bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:border-[#F15A24]'
                : 'bg-white border border-slate-300 text-slate-900 placeholder-slate-400 focus:border-[#F15A24]'
            } ${error || imageLoadError ? 'border-rose-500' : ''}`}
          />
          {value && !disabled && (
            <button
              type="button"
              onClick={() => onChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 p-0.5 rounded transition-colors"
              title="Clear image URL"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {/* Browse Media Library Button */}
          <button
            type="button"
            disabled={disabled}
            onClick={() => setIsPickerOpen(true)}
            className={`px-3 py-2 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors border shadow-xs ${
              isDark
                ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
            }`}
            title="Browse existing images from the Media Library"
          >
            <ImageIcon className="w-3.5 h-3.5 text-[#F15A24]" />
            <span>Browse Library</span>
          </button>

          {/* Direct Upload Button */}
          {allowUpload && (
            <>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp"
                onChange={handleFileChange}
                className="hidden"
                disabled={disabled || isUploading}
              />
              <button
                type="button"
                disabled={disabled || isUploading}
                onClick={() => fileInputRef.current?.click()}
                className={`px-3 py-2 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors border shadow-xs ${
                  isDark
                    ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                } ${isUploading ? 'opacity-60 cursor-not-allowed' : ''}`}
                title="Upload image directly to the Media Library"
              >
                {isUploading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#F15A24]" />
                    <span>Uploading...</span>
                  </>
                ) : (
                  <>
                    <UploadCloud className="w-3.5 h-3.5 text-[#F15A24]" />
                    <span>Upload</span>
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Upload Error Banner */}
      {uploadError && (
        <div className="p-2 bg-rose-950/60 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-400" />
          <span>{uploadError}</span>
        </div>
      )}

      {/* Helper text */}
      {helperText && !uploadError && (
        <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          {helperText}
        </p>
      )}

      {/* Live Preview Panel */}
      {value && value.trim() && (
        <div
          className={`p-2.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
            isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}
        >
          <div className="flex items-center gap-3 min-w-0">
            {/* Thumbnail Box */}
            <div
              className={`relative ${previewHeight} w-24 shrink-0 rounded-lg border overflow-hidden flex items-center justify-center p-1 ${
                isDark ? 'border-slate-700/80' : 'border-slate-300'
              } ${useCheckerPattern ? 'bg-[linear-gradient(45deg,#1e293b_25%,transparent_25%),linear-gradient(-45deg,#1e293b_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#1e293b_75%),linear-gradient(-45deg,transparent_75%,#1e293b_75%)] bg-[size:12px_12px] bg-slate-900' : (isDark ? 'bg-slate-900' : 'bg-white')}`}
            >
              {isImageLoading && !imageLoadError && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                  <RefreshCw className="w-4 h-4 animate-spin text-slate-400" />
                </div>
              )}

              {imageLoadError ? (
                <div className="flex flex-col items-center justify-center text-rose-400 text-center p-1">
                  <AlertCircle className="w-5 h-5 mb-0.5" />
                  <span className="text-[9px] font-bold leading-tight">Load Error</span>
                </div>
              ) : (
                <img
                  src={value}
                  alt="Preview"
                  className={`max-h-full max-w-full ${previewFit === 'cover' ? 'object-cover w-full h-full' : 'object-contain'}`}
                  onLoad={() => setIsImageLoading(false)}
                  onError={() => {
                    setIsImageLoading(false);
                    setImageLoadError(true);
                  }}
                />
              )}
            </div>

            {/* URL Meta & State */}
            <div className="min-w-0 flex-1">
              {imageLoadError ? (
                <div className="space-y-0.5">
                  <p className="text-xs font-bold text-rose-400 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>Unavailable or Broken Image URL</span>
                  </p>
                  <p className={`text-[11px] truncate ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    The URL could not be resolved. Please check the path or select another image.
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                      <Check className="w-2.5 h-2.5" />
                      <span>Ready</span>
                    </span>
                    {isTransparentFormat && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-500/30">
                        Alpha Transparent
                      </span>
                    )}
                  </div>
                  <p className={`text-xs font-mono truncate ${isDark ? 'text-slate-300' : 'text-slate-700'}`} title={value}>
                    {value}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Controls: External View & Checkerboard Toggle */}
          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
            {showTransparencyChecker && (
              <button
                type="button"
                onClick={() => setUseCheckerPattern(!useCheckerPattern)}
                className={`text-[10px] font-medium px-2 py-1 rounded transition-colors border ${
                  useCheckerPattern
                    ? 'bg-[#F15A24]/20 border-[#F15A24]/40 text-[#F15A24]'
                    : (isDark ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200')
                }`}
                title="Toggle checkerboard background to inspect transparency"
              >
                Checkerboard
              </button>
            )}

            {!imageLoadError && isSafeLinkUrl(value) && (
              <a
                href={value}
                target="_blank"
                rel="noopener noreferrer"
                className={`p-1.5 rounded transition-colors border ${
                  isDark
                    ? 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700'
                    : 'bg-slate-100 border-slate-300 text-slate-700 hover:text-slate-900 hover:bg-slate-200'
                }`}
                title="Open image in new tab"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        </div>
      )}

      {/* Modal Popup */}
      <MediaPickerModal
        isOpen={isPickerOpen}
        onClose={() => setIsPickerOpen(false)}
        onSelect={(url) => {
          onChange(url);
          setIsPickerOpen(false);
        }}
        title={modalTitle || (label ? `Select ${label}` : 'Select Image from Media Library')}
      />
    </div>
  );
};

