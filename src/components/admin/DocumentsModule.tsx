import React, { useState, useEffect } from 'react';
import {
  FileText,
  Plus,
  Trash2,
  Download,
  ExternalLink,
  Search,
  Filter,
  RefreshCw,
  FolderTree,
  Package,
  HardDrive,
  CheckCircle2,
  AlertCircle,
  X
} from 'lucide-react';
import { DocumentItem, Category, Product } from '../../types';
import { apiFetch } from '../../services/apiClient';
import { DataTable } from './framework/DataTable';
import { ConfirmDialog } from './framework/ConfirmDialog';
import { Badge, Button } from '../common/UI';

export const DocumentsModule: React.FC = () => {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<DocumentItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Form Fields
  const [title, setTitle] = useState('');
  const [docType, setDocType] = useState<'datasheet' | 'user_manual' | 'firmware' | 'catalog' | 'certificate'>('datasheet');
  const [fileUrl, setFileUrl] = useState('');
  const [fileSize, setFileSize] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [productId, setProductId] = useState('');

  const fetchDocuments = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await apiFetch<DocumentItem[]>('/admin/documents');
      setDocuments(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load technical documents');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDependencies = async () => {
    try {
      const [cats, prods] = await Promise.all([
        apiFetch<Category[]>('/categories').catch(() => []),
        apiFetch<Product[]>('/products').catch(() => [])
      ]);
      setCategories(cats);
      setProducts(prods);
    } catch (e) {
      // Non-critical
    }
  };

  useEffect(() => {
    fetchDocuments();
    fetchDependencies();
  }, []);

  const handleOpenCreate = () => {
    setTitle('');
    setDocType('datasheet');
    setFileUrl('');
    setFileSize('');
    setCategoryId('');
    setProductId('');
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSaveDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setFormError('Document title is required.');
      return;
    }
    if (!fileUrl.trim()) {
      setFormError('File URL is required (PDF, ZIP, or document link).');
      return;
    }

    setIsSubmitting(true);
    setFormError(null);
    try {
      const created = await apiFetch<DocumentItem>('/admin/documents', {
        method: 'POST',
        body: JSON.stringify({
          title: title.trim(),
          doc_type: docType,
          file_url: fileUrl.trim(),
          file_size: fileSize.trim() || undefined,
          category_id: categoryId || undefined,
          product_id: productId || undefined,
          mime_type: fileUrl.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'application/octet-stream'
        })
      });

      setDocuments(prev => [created, ...prev]);
      setIsModalOpen(false);
    } catch (err: any) {
      setFormError(err.message || 'Failed to register document.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteDocument = async () => {
    if (!deleteTarget) return;
    try {
      await apiFetch(`/admin/documents/${deleteTarget.id}`, { method: 'DELETE' });
      setDocuments(prev => prev.filter(d => d.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err: any) {
      alert(err.message || 'Failed to delete document.');
    }
  };

  const filteredDocs = documents.filter(doc => {
    if (filterType !== 'all' && doc.doc_type !== filterType) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return doc.title.toLowerCase().includes(q) || (doc.file_url && doc.file_url.toLowerCase().includes(q));
    }
    return true;
  });

  const getDocTypeBadge = (type: string) => {
    switch (type) {
      case 'datasheet':
        return <Badge variant="info">Datasheet</Badge>;
      case 'user_manual':
        return <Badge variant="orange">User Manual</Badge>;
      case 'firmware':
        return <Badge variant="warning">Firmware</Badge>;
      case 'catalog':
        return <Badge variant="success">Catalog</Badge>;
      case 'certificate':
        return <Badge variant="info">Certificate</Badge>;
      default:
        return <Badge variant="gray">{type}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold font-heading text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#F15A24]" />
            <span>Technical Documents & Downloads</span>
          </h2>
          <p className="text-xs text-slate-400">
            Manage official product datasheets, user manuals, firmware releases, compliance certificates, and catalogs with download tracking.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={fetchDocuments}
            variant="outline"
            disabled={isLoading}
            className="border-slate-800 text-slate-300"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          <Button
            size="sm"
            onClick={handleOpenCreate}
            className="bg-[#F15A24] hover:bg-[#D94D1C] text-white"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Add Document
          </Button>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-rose-950/40 border border-rose-800/80 rounded-xl text-xs text-rose-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-950 p-3 rounded-2xl border border-slate-800">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search documents by title or URL..."
            className="w-full bg-slate-900 border border-slate-800 text-xs text-white pl-9 pr-3 py-2 rounded-xl focus:border-[#F15A24] outline-none"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-3.5 h-3.5 text-slate-500" />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            aria-label="Filter documents by type"
            className="bg-slate-900 border border-slate-800 text-xs text-white px-3 py-2 rounded-xl focus:border-[#F15A24] outline-none"
          >
            <option value="all">All Document Types</option>
            <option value="datasheet">Datasheets</option>
            <option value="user_manual">User Manuals</option>
            <option value="firmware">Firmware</option>
            <option value="catalog">Catalogs</option>
            <option value="certificate">Certificates</option>
          </select>

          <span className="text-xs text-slate-400 ml-2">
            Total: <strong className="text-white">{filteredDocs.length}</strong>
          </span>
        </div>
      </div>

      {/* Documents DataTable */}
      <DataTable<DocumentItem>
        data={filteredDocs}
        isLoading={isLoading}
        idField="id"
        columns={[
          {
            key: 'title',
            header: 'Document Title',
            render: (doc: DocumentItem) => (
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5 font-bold text-white">
                  <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate max-w-xs">{doc.title}</span>
                </div>
                <div className="text-[11px] text-slate-500 font-mono truncate max-w-sm">
                  {doc.file_url}
                </div>
              </div>
            )
          },
          {
            key: 'doc_type',
            header: 'Type',
            render: (doc: DocumentItem) => getDocTypeBadge(doc.doc_type)
          },
          {
            key: 'relations',
            header: 'Bound Context',
            render: (doc: DocumentItem) => {
              const cat = categories.find(c => c.id === doc.category_id);
              const prod = products.find(p => p.id === doc.product_id);
              if (!cat && !prod) return <span className="text-slate-500 text-[11px]">Global / General</span>;
              return (
                <div className="space-y-0.5 text-[11px]">
                  {cat && (
                    <div className="flex items-center gap-1 text-slate-300">
                      <FolderTree className="w-3 h-3 text-[#F15A24]" />
                      <span>{cat.name}</span>
                    </div>
                  )}
                  {prod && (
                    <div className="flex items-center gap-1 text-slate-400">
                      <Package className="w-3 h-3 text-cyan-400" />
                      <span className="truncate max-w-[150px]">{prod.name}</span>
                    </div>
                  )}
                </div>
              );
            }
          },
          {
            key: 'file_size',
            header: 'Size',
            render: (doc: DocumentItem) => (
              <span className="text-slate-300 font-mono text-[11px]">
                {doc.file_size || 'N/A'}
              </span>
            )
          },
          {
            key: 'download_count',
            header: 'Downloads',
            render: (doc: DocumentItem) => (
              <div className="flex items-center gap-1.5 font-mono text-xs text-emerald-400">
                <Download className="w-3 h-3 text-slate-500" />
                <span>{(doc.download_count || 0).toLocaleString()}</span>
              </div>
            )
          },
          {
            key: 'actions',
            header: 'Actions',
            render: (doc: DocumentItem) => (
              <div className="flex items-center justify-end gap-1.5">
                <a
                  href={`/api/documents/${doc.id}/download`}
                  target="_blank"
                  rel="noreferrer"
                  className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition"
                  title="Test Download & Increment Counter"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>

                <button
                  onClick={() => setDeleteTarget(doc)}
                  className="p-1.5 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 border border-transparent hover:border-rose-900/50 transition"
                  title="Delete Document"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )
          }
        ]}
      />

      {/* Add Document Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#F15A24]" />
                Register Technical Document
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveDocument} className="space-y-4">
              {formError && (
                <div className="p-3 bg-rose-950/40 border border-rose-800 text-xs text-rose-300 rounded-xl">
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Document Title *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Hikvision DS-2CD2043G2-I Datasheet Specification"
                  className="w-full bg-slate-950 border border-slate-800 text-xs text-white p-2.5 rounded-xl focus:border-[#F15A24] outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Document Type *
                  </label>
                  <select
                    value={docType}
                    onChange={(e) => setDocType(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 text-xs text-white p-2.5 rounded-xl focus:border-[#F15A24] outline-none"
                  >
                    <option value="datasheet">Product Datasheet</option>
                    <option value="user_manual">User Manual / Quick Guide</option>
                    <option value="firmware">Firmware Release</option>
                    <option value="catalog">Product Catalog / Brochure</option>
                    <option value="certificate">ISO / CE / Compliance Certificate</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    File Size (e.g. 2.4 MB)
                  </label>
                  <input
                    type="text"
                    value={fileSize}
                    onChange={(e) => setFileSize(e.target.value)}
                    placeholder="e.g. 1.8 MB"
                    className="w-full bg-slate-950 border border-slate-800 text-xs text-white p-2.5 rounded-xl focus:border-[#F15A24] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  File URL or Path *
                </label>
                <input
                  type="text"
                  value={fileUrl}
                  onChange={(e) => setFileUrl(e.target.value)}
                  placeholder="https://... or /uploads/... or /documents/spec.pdf"
                  className="w-full bg-slate-950 border border-slate-800 text-xs text-white p-2.5 rounded-xl font-mono focus:border-[#F15A24] outline-none"
                  required
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Can be a direct static link, uploaded file in Media Library, or vendor PDF URL.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-800/80">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Link to Category (Optional)
                  </label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-xs text-white p-2.5 rounded-xl focus:border-[#F15A24] outline-none"
                  >
                    <option value="">-- No Category Binding --</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Link to Specific Product (Optional)
                  </label>
                  <select
                    value={productId}
                    onChange={(e) => setProductId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-xs text-white p-2.5 rounded-xl focus:border-[#F15A24] outline-none"
                  >
                    <option value="">-- No Specific Product --</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-[#F15A24] text-white hover:bg-[#D94D1C]"
                >
                  {isSubmitting ? 'Saving...' : 'Save Document'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteTarget && (
        <ConfirmDialog
          isOpen={!!deleteTarget}
          title="Delete Technical Document"
          message={`Are you sure you want to delete "${deleteTarget.title}"? The file record will be removed from the public download catalog.`}
          confirmLabel="Delete Document"
          variant="danger"
          onConfirm={handleDeleteDocument}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
};
