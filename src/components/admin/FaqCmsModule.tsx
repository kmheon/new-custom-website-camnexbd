import React, { useState, useEffect } from 'react';
import { HelpCircle, Plus, Edit3, Trash2, Check, X, RefreshCw } from 'lucide-react';
import { Button, Modal, Badge, Alert } from '../common/UI';
import { cmsService } from '../../services';
import { FaqItem } from '../../types';

const COMMON_FAQ_CATEGORIES = [
  'CCTV Installation & Setup',
  'Warranty & Support',
  'Delivery & Payments',
  'Products & Compatibility',
  'Networking & Wi-Fi',
  'General Inquiries'
];

export const FaqCmsModule: React.FC = () => {
  const [faqs, setFaqs] = useState<FaqItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingFaq, setEditingFaq] = useState<Partial<FaqItem> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const fetchFaqs = async () => {
    setIsLoading(true);
    try {
      const data = await cmsService.getFaqs();
      setFaqs(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load FAQs');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFaqs();
  }, []);

  const handleCreateNew = () => {
    setEditingFaq({
      id: `faq-${Date.now()}`,
      question: '',
      category: 'CCTV Installation & Setup',
      answer: ''
    });
    setModalOpen(true);
  };

  const handleEdit = (item: FaqItem) => {
    setEditingFaq({ ...item });
    setModalOpen(true);
  };

  const handleDelete = async (id: string, question: string) => {
    if (!confirm(`Are you sure you want to delete FAQ: "${question}"?`)) {
      return;
    }
    try {
      await cmsService.deleteFaq(id);
      setFaqs(prev => prev.filter(f => f.id !== id));
    } catch (err: any) {
      alert(err.message || 'Failed to delete FAQ');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFaq || !editingFaq.question?.trim()) {
      setError('Question is required.');
      return;
    }
    if (!editingFaq.answer?.trim()) {
      setError('Answer is required.');
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      const saved = await cmsService.saveFaq({
        ...editingFaq,
        question: editingFaq.question.trim(),
        category: editingFaq.category?.trim() || 'General Inquiries',
        answer: editingFaq.answer.trim()
      } as FaqItem);

      setFaqs(prev => {
        const idx = prev.findIndex(f => f.id === saved.id);
        if (idx !== -1) {
          const updated = [...prev];
          updated[idx] = saved;
          return updated;
        }
        return [...prev, saved];
      });

      setModalOpen(false);
      setEditingFaq(null);
    } catch (err: any) {
      setError(err.message || 'Failed to save FAQ');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold font-heading text-white flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-[#F15A24]" />
            <span>Frequently Asked Questions (FAQ)</span>
          </h2>
          <p className="text-xs text-slate-400">
            Manage customer FAQ answers rendered on product pages, support portal, and checkout assistance.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button size="sm" onClick={handleCreateNew} className="bg-[#F15A24] text-white hover:bg-[#D94D1C]">
            <Plus className="w-4 h-4 mr-1.5" />
            <span>+ Add FAQ</span>
          </Button>

          <Button variant="outline" size="sm" onClick={fetchFaqs} disabled={isLoading}>
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* FAQs List */}
      <div className="space-y-3">
        {faqs.length === 0 ? (
          <div className="bg-slate-950 rounded-2xl border border-slate-800 p-8 text-center text-slate-500 text-xs">
            {isLoading ? 'Loading FAQs...' : 'No FAQs added yet. Click "+ Add FAQ" to create one.'}
          </div>
        ) : (
          faqs.map(faq => (
            <div
              key={faq.id}
              className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2 hover:border-slate-700 transition"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="orange">{faq.category}</Badge>
                    <h3 className="font-bold text-sm text-white">{faq.question}</h3>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed pl-1">{faq.answer}</p>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <Button size="sm" variant="outline" onClick={() => handleEdit(faq)} className="text-xs">
                    <Edit3 className="w-3.5 h-3.5 mr-1" />
                    <span>Edit</span>
                  </Button>
                  <button
                    onClick={() => handleDelete(faq.id, faq.question)}
                    className="text-xs text-rose-400 hover:text-rose-300 p-1.5 rounded hover:bg-rose-950/40"
                    title="Delete FAQ"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* FAQ EDITOR MODAL */}
      {modalOpen && editingFaq && (
        <Modal
          isOpen={modalOpen}
          onClose={() => {
            setModalOpen(false);
            setEditingFaq(null);
          }}
          title={editingFaq.id ? 'Edit FAQ Item' : 'Create FAQ Item'}
          maxWidth="max-w-xl"
        >
          <form onSubmit={handleSave} className="space-y-4 text-slate-900">
            {error && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs p-3 rounded-xl flex items-center justify-between">
                <span>{error}</span>
                <button type="button" onClick={() => setError(null)}><X className="w-4 h-4" /></button>
              </div>
            )}

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Category</label>
              <input
                type="text"
                list="faq-categories"
                value={editingFaq.category || ''}
                onChange={e => setEditingFaq({ ...editingFaq, category: e.target.value })}
                placeholder="e.g. CCTV Installation & Setup"
                className="w-full bg-white border border-slate-300 text-xs p-2 rounded-lg"
              />
              <datalist id="faq-categories">
                {COMMON_FAQ_CATEGORIES.map((cat, i) => (
                  <option key={i} value={cat} />
                ))}
              </datalist>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Question *</label>
              <input
                type="text"
                value={editingFaq.question || ''}
                onChange={e => setEditingFaq({ ...editingFaq, question: e.target.value })}
                placeholder="e.g. Do your CCTV systems support remote live viewing from smartphones?"
                className="w-full bg-white border border-slate-300 text-xs p-2.5 rounded-lg font-bold"
                required
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Answer *</label>
              <textarea
                rows={4}
                value={editingFaq.answer || ''}
                onChange={e => setEditingFaq({ ...editingFaq, answer: e.target.value })}
                placeholder="Provide accurate, helpful information based strictly on CamneX business capabilities..."
                className="w-full bg-white border border-slate-300 text-xs p-2.5 rounded-lg"
                required
              />
            </div>

            <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setModalOpen(false);
                  setEditingFaq(null);
                }}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving} className="bg-[#F15A24] text-white hover:bg-[#D94D1C]">
                <Check className="w-4 h-4 mr-1.5" />
                <span>{isSaving ? 'Saving...' : 'Save FAQ'}</span>
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

