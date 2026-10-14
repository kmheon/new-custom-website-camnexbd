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
  const [activeFolder, setActiveFolder] = useState<string>('all');
  const [showUnusedOnly, setShowUnusedOnly] = useState(false);
  const [unusedIds, setUnusedIds] = useState<Set<string>>(new Set());
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [previewItem, setPreviewItem] = useState<MediaItem | null>(null);

  // Metadata editing state
  const [editingAltText, setEditingAltText] = useState('');
  const [editingFolder, setEditingFolder] = useState('');
  const [isSavingMeta, setIsSavingMeta] = useState(false);
  const [metaSaveMessage, setMetaSaveMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchMedia = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const items = await mediaService.getMedia();
      setMediaList(items);
      // Fetch unused media IDs
      try {
        const unusedRes = await (mediaService as any).getUnusedMedia();
        if (unusedRes && unusedRes.unusedMedia) {
          setUnusedIds(new Set(unusedRes.unusedMedia.map((m: any) => m.id)));
        }
      } catch (e) {
        // Non-critical
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load media');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMedia();
  }, []);

  const handleSelectPreview = (item: MediaItem) => {
    setPreviewItem(item);
    setEditingAltText(item.alt_text || '');
    setEditingFolder(item.folder || '');
    setMetaSaveMessage(null);
  };

  const handleSaveMetadata = async () => {
    if (!previewItem) return;
    setIsSavingMeta(true);
    setMetaSaveMessage(null);
    try {
      const updated = await (mediaService as any).updateMedia(previewItem.id, {
        alt_text: editingAltText.trim(),
        folder: editingFolder.trim()
      });
      setMediaList(prev => prev.map(m => m.id === previewItem.id ? { ...m, ...updated } : m));
      setPreviewItem(prev => prev ? { ...prev, ...updated } : null);
      setMetaSaveMessage('Metadata saved successfully!');
      setTimeout(() => setMetaSaveMessage(null), 2500);
    } catch (err: any) {
      setError(err.message || 'Failed to update media metadata');
    } finally {
      setIsSavingMeta(false);
    }
  };

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

  const availableFolders = Array.from(new Set(mediaList.map(m => m.folder).filter(Boolean))) as string[];

  const filteredMedia = mediaList.filter(m => {
    if (showUnusedOnly && !unusedIds.has(m.id)) return false;
    if (activeFolder !== 'all' && m.folder !== activeFolder) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (m.original_name || m.filename).toLowerCase().includes(q) ||
      m.url.toLowerCase().includes(q) ||
      (m.alt_text && m.alt_text.toLowerCase().includes(q)) ||
      (m.folder && m.folder.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      {/* Header & Upload Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold font-heading text-white flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-[#F15A24]" />
            <span>Media Library & Assets</span>
          </h2>
          <p className="text-xs text-slate-400">
            Upload and manage hardware product photography, category banners, alt-text for SEO, and folders (PNG, JPG, WebP, SVG up to 5 MB).
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

      {/* Search, Folder Filter & Unused Report Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3 bg-slate-950 p-3 rounded-2xl border border-slate-800">
        <div className="relative flex-1 w-full md:max-w-xs">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search filename, alt text, folder..."
            className="w-full bg-slate-900 border border-slate-800 text-xs text-white pl-9 pr-3 py-2 rounded-xl focus:border-[#F15A24] outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {availableFolders.length > 0 && (
            <select
              value={activeFolder}
              onChange={(e) => setActiveFolder(e.target.value)}
              aria-label="Filter media by folder"
              className="bg-slate-900 border border-slate-800 text-xs text-white px-3 py-2 rounded-xl focus:border-[#F15A24] outline-none"
            >
              <option value="all">All Folders</option>
              {availableFolders.map((f) => (
                <option key={f} value={f}>Folder: {f}</option>
              ))}
            </select>
          )}

          <button
            onClick={() => setShowUnusedOnly(prev => !prev)}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border ${
              showUnusedOnly
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                : 'bg-slate-900 text-slate-400 hover:text-white border-slate-800'
            }`}
          >
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Unused Media Report</span>
            {unusedIds.size > 0 && (
              <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-500 text-slate-950 font-bold">
                {unusedIds.size}
              </span>
            )}
          </button>

          <span className="text-xs text-slate-400 ml-auto md:ml-2">
            Showing <strong className="text-white">{filteredMedia.length}</strong> of {mediaList.length}
          </span>
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
                    handleSelectPreview(item);
                  }
                }}
              >
                <img
                  src={item.url}
                  alt={item.alt_text || item.original_name || item.filename}
                  className="max-h-full max-w-full object-contain transition group-hover:scale-105"
                  loading="lazy"
                />

                {/* Badges Overlay */}
                <div className="absolute top-1.5 left-1.5 flex flex-col gap-1 items-start">
                  {item.folder && (
                    <span className="px-1.5 py-0.5 rounded bg-slate-950/80 text-[9px] font-bold text-sky-300 border border-slate-700">
                      {item.folder}
                    </span>
                  )}
                  {unusedIds.has(item.id) && (
                    <span className="px-1.5 py-0.5 rounded bg-amber-500/90 text-[9px] font-bold text-slate-950">
                      Unused
                    </span>
                  )}
                </div>

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
                  {item.alt_text && (
                    <p className="text-[10px] text-slate-400 italic truncate mt-0.5" title={item.alt_text}>
                      alt: "{item.alt_text}"
                    </p>
                  )}
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

      {/* Image Preview & Metadata Modal */}
      {previewItem && (
        <Modal
          isOpen={!!previewItem}
          onClose={() => setPreviewItem(null)}
          title={previewItem.original_name || previewItem.filename}
          maxWidth="max-w-2xl"
        >
          <div className="space-y-4">
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex items-center justify-center max-h-[40vh] overflow-hidden">
              <img
                src={previewItem.url}
                alt={previewItem.alt_text || ''}
                className="max-h-[35vh] max-w-full object-contain"
              />
            </div>

            {metaSaveMessage && (
              <div className="p-2.5 bg-emerald-950/40 border border-emerald-800 text-xs text-emerald-300 rounded-xl flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400" />
                <span>{metaSaveMessage}</span>
              </div>
            )}

            {/* SEO Alt-Text & Folder Inputs */}
            <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800 space-y-3">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">SEO & Organization Metadata</h4>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Folder / Tag (e.g. products, hero, brands)
                  </label>
                  <input
                    type="text"
                    value={editingFolder}
                    onChange={(e) => setEditingFolder(e.target.value)}
                    placeholder="e.g. products"
                    className="w-full bg-slate-950 border border-slate-800 text-xs text-white p-2 rounded-lg focus:border-[#F15A24] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Image Status
                  </label>
                  <div className="p-2 rounded-lg bg-slate-950 border border-slate-800 text-xs">
                    {unusedIds.has(previewItem.id) ? (
                      <span className="text-amber-400 font-bold">Unused (Safe to remove or reassign)</span>
                    ) : (
                      <span className="text-emerald-400 font-bold">In Active Use (Protected from delete)</span>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  Alt-Text for SEO & Accessibility
                </label>
                <input
                  type="text"
                  value={editingAltText}
                  onChange={(e) => setEditingAltText(e.target.value)}
                  placeholder="e.g. Hikvision DS-2CD2043G2-I 4MP Bullet IP Camera outdoor perspective"
                  className="w-full bg-slate-950 border border-slate-800 text-xs text-white p-2 rounded-lg focus:border-[#F15A24] outline-none"
                />
              </div>

              <div className="flex justify-end pt-1">
                <Button
                  size="sm"
                  onClick={handleSaveMetadata}
                  disabled={isSavingMeta}
                  className="bg-[#F15A24] hover:bg-[#D94D1C] text-white text-xs py-1.5"
                >
                  {isSavingMeta ? 'Saving...' : 'Save Image Metadata'}
                </Button>
              </div>
            </div>

            <div className="bg-slate-950/70 p-3 rounded-xl space-y-1 text-xs text-slate-400 border border-slate-800">
              <div className="flex justify-between">
                <span className="font-bold text-slate-300">File URL:</span>
                <span className="font-mono text-white select-all">{previewItem.url}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-bold text-slate-300">Size:</span>
                <span className="text-white">{formatFileSize(previewItem.size)}</span>
              </div>
              {previewItem.mime_type && (
                <div className="flex justify-between">
                  <span className="font-bold text-slate-300">MIME:</span>
                  <span className="font-mono text-white">{previewItem.mime_type}</span>
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

