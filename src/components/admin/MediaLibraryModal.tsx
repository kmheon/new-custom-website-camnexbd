import React, { useState, useEffect, useRef } from 'react';
import { UploadCloud, Image as ImageIcon, Trash2, Copy, Check, X, Search, AlertCircle, RefreshCw } from 'lucide-react';
import { Button, Modal, Badge, Alert } from '../common/UI';
import { mediaService } from '../../services';
import { MediaItem } from '../../types';

interface MediaLibraryViewProps {
  onSelectImage?: (url: string) => void;
  isPickerMode?: boolean;
}

export const MediaLibraryView: React.FC<MediaLibraryViewProps> = ({ onSelectImage, isPickerMode = false }) => {
  const [mediaList, setMediaList] = useState<MediaItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [previewItem, setPreviewItem] = useState<MediaItem | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchMedia = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const items = await mediaService.getMedia();
      setMediaList(items);
    } catch (err: any) {
      setError(err.message || 'Failed to load media');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMedia();
  }, []);

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];

    // Client-side validations
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml'];
    if (!allowedTypes.includes(file.type)) {
      setError('Invalid file type: Please upload PNG, JPG, WebP, or SVG images.');
      return;
    }
    const maxBytes = 5 * 1024 * 1024; // 5 MB
    if (file.size > maxBytes) {
      setError('File too large: Image size must not exceed 5 MB.');
      return;
    }

    setUploading(true);
    setError(null);
    try {
      const uploaded = await mediaService.uploadMedia(file);
      setMediaList(prev => [uploaded, ...prev]);
      if (isPickerMode && onSelectImage) {
        onSelectImage(uploaded.url);
      }
    } catch (err: any) {
      setError(err.message || 'Upload failed');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"? This file will be removed permanently.`)) {
      return;
    }
    try {
      await mediaService.deleteMedia(id);
      setMediaList(prev => prev.filter(m => m.id !== id));
      if (previewItem?.id === id) setPreviewItem(null);
    } catch (err: any) {
      setError(err.message || 'Failed to delete file');
    }
  };

  const handleCopyUrl = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '0 KB';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const filteredMedia = mediaList.filter(m => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (m.original_name || m.filename).toLowerCase().includes(q) || m.url.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6">
      {/* Header & Upload Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold font-heading text-white flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-[#F15A24]" />
            <span>Media Library</span>
          </h2>
          <p className="text-xs text-slate-400">
            Upload and manage hardware product photography, category banners, and hero assets (PNG, JPG, WebP, SVG up to 5 MB).
          </p>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => handleFileUpload(e.target.files)}
            accept="image/png,image/jpeg,image/webp,image/svg+xml"
            className="hidden"
          />
          <Button
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="bg-[#F15A24] hover:bg-[#D94D1C] text-white"
          >
            <UploadCloud className="w-4 h-4 mr-1.5" />
            <span>{uploading ? 'Uploading...' : 'Upload Image'}</span>
          </Button>

          <Button variant="outline" size="sm" onClick={fetchMedia} disabled={isLoading}>
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="danger">
          <div className="flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="text-slate-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
        </Alert>
      )}

      {/* Upload Drag & Drop Zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
        onDrop={(e) => {
          e.preventDefault();
          e.stopPropagation();
          handleFileUpload(e.dataTransfer.files);
        }}
        onClick={() => fileInputRef.current?.click()}
        className="border-2 border-dashed border-slate-700 hover:border-[#F15A24] bg-slate-950/60 hover:bg-slate-900/60 rounded-2xl p-6 text-center cursor-pointer transition-colors"
      >
        <UploadCloud className="w-8 h-8 text-[#F15A24] mx-auto mb-2 opacity-80" />
        <p className="text-sm font-bold text-white mb-1">
          {uploading ? 'Processing & validating image...' : 'Click or drag image file here to upload'}
        </p>
        <p className="text-xs text-slate-400">
          Strict security check: PNG, JPG, WebP, SVG magic bytes validation &bull; Max 5 MB
        </p>
      </div>

      {/* Search & Stats Bar */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by filename..."
            className="w-full bg-slate-950 border border-slate-800 text-xs text-white pl-9 pr-3 py-2 rounded-xl focus:border-[#F15A24] outline-none"
          />
        </div>

        <div className="text-xs text-slate-400">
          Showing <strong className="text-white">{filteredMedia.length}</strong> of {mediaList.length} files
        </div>
      </div>

      {/* Media Gallery Grid */}
      {filteredMedia.length === 0 ? (
        <div className="bg-slate-950 rounded-2xl border border-slate-800 p-12 text-center text-slate-400">
          <ImageIcon className="w-10 h-10 mx-auto text-slate-600 mb-2 opacity-50" />
          <p className="text-sm font-bold text-white mb-1">No media files found</p>
          <p className="text-xs">Upload your product images and banners above.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {filteredMedia.map((item) => (
            <div
              key={item.id}
              className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden group hover:border-slate-700 transition flex flex-col"
            >
              <div
                className="relative aspect-square bg-slate-900/60 flex items-center justify-center p-2 cursor-pointer overflow-hidden"
                onClick={() => {
                  if (isPickerMode && onSelectImage) {
                    onSelectImage(item.url);
                  } else {
                    setPreviewItem(item);
                  }
                }}
              >
                <img
                  src={item.url}
                  alt={item.original_name || item.filename}
                  className="max-h-full max-w-full object-contain transition group-hover:scale-105"
                  loading="lazy"
                />

                {isPickerMode && (
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                    <span className="text-xs font-bold text-white bg-[#F15A24] px-3 py-1.5 rounded-lg shadow">
                      Select Image
                    </span>
                  </div>
                )}
              </div>

              <div className="p-2.5 flex-1 flex flex-col justify-between border-t border-slate-800/80 bg-slate-950">
                <div className="mb-2">
                  <p className="text-xs font-bold text-white truncate" title={item.original_name || item.filename}>
                    {item.original_name || item.filename}
                  </p>
                  <p className="text-[10px] text-slate-500 font-mono">
                    {formatFileSize(item.size)}
                  </p>
                </div>

                <div className="flex items-center justify-between gap-1 pt-1.5 border-t border-slate-800/60">
                  {isPickerMode ? (
                    <Button
                      size="sm"
                      className="w-full text-[11px] py-1 bg-[#F15A24] text-white"
                      onClick={() => onSelectImage && onSelectImage(item.url)}
                    >
                      Pick
                    </Button>
                  ) : (
                    <>
                      <button
                        onClick={() => handleCopyUrl(item.url, item.id)}
                        className="text-[10px] text-slate-400 hover:text-white flex items-center gap-1 px-1.5 py-1 rounded bg-slate-900 hover:bg-slate-800 transition"
                        title="Copy image URL"
                      >
                        {copiedId === item.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedId === item.id ? 'Copied' : 'Copy'}</span>
                      </button>

                      <button
                        onClick={() => handleDelete(item.id, item.original_name || item.filename)}
                        className="text-[10px] text-rose-400 hover:text-rose-300 p-1 rounded hover:bg-rose-950/40 transition"
                        title="Delete image"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Image Preview Modal */}
      {previewItem && (
        <Modal
          isOpen={!!previewItem}
          onClose={() => setPreviewItem(null)}
          title={previewItem.original_name || previewItem.filename}
          maxWidth="max-w-2xl"
        >
          <div className="space-y-4">
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex items-center justify-center max-h-[60vh] overflow-hidden">
              <img
                src={previewItem.url}
                alt=""
                className="max-h-[50vh] max-w-full object-contain"
              />
            </div>

            <div className="bg-slate-100 p-3 rounded-xl space-y-1 text-xs text-slate-700">
              <div className="flex justify-between">
                <span className="font-bold">File URL:</span>
                <span className="font-mono text-slate-900 select-all">{previewItem.url}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-bold">Size:</span>
                <span>{formatFileSize(previewItem.size)}</span>
              </div>
              {previewItem.mime_type && (
                <div className="flex justify-between">
                  <span className="font-bold">MIME:</span>
                  <span className="font-mono">{previewItem.mime_type}</span>
                </div>
              )}
            </div>

            <div className="flex justify-between items-center pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleCopyUrl(previewItem.url, previewItem.id)}
              >
                {copiedId === previewItem.id ? <Check className="w-4 h-4 mr-1 text-emerald-500" /> : <Copy className="w-4 h-4 mr-1" />}
                <span>{copiedId === previewItem.id ? 'URL Copied!' : 'Copy URL'}</span>
              </Button>

              <Button
                variant="danger"
                size="sm"
                onClick={() => handleDelete(previewItem.id, previewItem.original_name || previewItem.filename)}
              >
                <Trash2 className="w-4 h-4 mr-1" />
                <span>Delete File</span>
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export const MediaPickerModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSelect: (url: string) => void;
  title?: string;
}> = ({ isOpen, onClose, onSelect, title = 'Select Image from Media Library' }) => {
  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      maxWidth="max-w-4xl"
    >
      <div className="max-h-[75vh] overflow-y-auto pr-1">
        <MediaLibraryView
          isPickerMode={true}
          onSelectImage={(url) => {
            onSelect(url);
            onClose();
          }}
        />
      </div>
    </Modal>
  );
};

