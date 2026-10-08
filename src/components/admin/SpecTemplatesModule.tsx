import React, { useState } from 'react';
import { Sliders, Plus, Edit3, Trash2, Check, X, ArrowUp, ArrowDown, HelpCircle, Layers } from 'lucide-react';
import { Button, Modal, Badge } from '../common/UI';
import { specTemplateService } from '../../services';
import { SpecTemplate, SpecFieldDefinition, SpecFieldType, Category } from '../../types';

interface SpecTemplatesModuleProps {
  templates: SpecTemplate[];
  categories: Category[];
  onTemplatesUpdated: () => void;
}

export const SpecTemplatesModule: React.FC<SpecTemplatesModuleProps> = ({
  templates,
  categories,
  onTemplatesUpdated
}) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<SpecTemplate | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleCreateNew = () => {
    const defaultCat = categories[0]?.slug || 'cctv-cameras';
    setEditingTemplate({
      id: `tpl-${Date.now()}`,
      name: '',
      categorySlug: defaultCat,
      fields: [
        {
          id: `f-${Date.now()}-1`,
          name: 'Resolution',
          key: 'resolution',
          type: 'enum',
          options: ['2MP (1080p)', '4MP (2K)', '8MP (4K)'],
          filterable: true,
          comparable: true,
          showInHighlights: true,
          order: 1
        }
      ]
    });
    setModalOpen(true);
  };

  const handleEdit = (tpl: SpecTemplate) => {
    setEditingTemplate(JSON.parse(JSON.stringify(tpl)));
    setModalOpen(true);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete template "${name}"? Existing products using this template will preserve their raw specs.`)) {
      return;
    }
    try {
      await specTemplateService.deleteTemplate(id);
      onTemplatesUpdated();
    } catch (err: any) {
      alert(err.message || 'Failed to delete template');
    }
  };

  const handleAddField = () => {
    if (!editingTemplate) return;
    const newField: SpecFieldDefinition = {
      id: `f-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: '',
      key: '',
      type: 'text',
      filterable: false,
      comparable: false,
      showInHighlights: false,
      order: editingTemplate.fields.length + 1
    };
    setEditingTemplate({
      ...editingTemplate,
      fields: [...editingTemplate.fields, newField]
    });
  };

  const handleRemoveField = (fieldId: string) => {
    if (!editingTemplate) return;
    setEditingTemplate({
      ...editingTemplate,
      fields: editingTemplate.fields.filter(f => f.id !== fieldId)
    });
  };

  const handleUpdateField = (fieldId: string, updates: Partial<SpecFieldDefinition>) => {
    if (!editingTemplate) return;
    setEditingTemplate({
      ...editingTemplate,
      fields: editingTemplate.fields.map(f => {
        if (f.id === fieldId) {
          const updated = { ...f, ...updates };
          // Auto-generate key if name changes and key is empty or matches previous slug
          if (updates.name && (!f.key || f.key === f.name.toLowerCase().replace(/[^a-z0-9]+/g, '_'))) {
            updated.key = updates.name.toLowerCase().replace(/[^a-z0-9]+/g, '_');
          }
          return updated;
        }
        return f;
      })
    });
  };

  const handleMoveField = (index: number, direction: 'up' | 'down') => {
    if (!editingTemplate) return;
    const fields = [...editingTemplate.fields];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= fields.length) return;

    const temp = fields[index];
    fields[index] = fields[targetIdx];
    fields[targetIdx] = temp;

    // re-assign order
    fields.forEach((f, idx) => { f.order = idx + 1; });

    setEditingTemplate({ ...editingTemplate, fields });
  };

  const handleSave = async () => {
    if (!editingTemplate) return;
    setError(null);

    if (!editingTemplate.name.trim()) {
      setError('Template name is required.');
      return;
    }
    if (!editingTemplate.categorySlug.trim()) {
      setError('Category slug is required.');
      return;
    }

    // Validate fields
    for (const f of editingTemplate.fields) {
      if (!f.name.trim()) {
        setError('All fields must have a name.');
        return;
      }
      if (!f.key.trim()) {
        setError(`Field "${f.name}" is missing a specification key.`);
        return;
      }
    }

    setIsSaving(true);
    try {
      await specTemplateService.saveTemplate(editingTemplate);
      onTemplatesUpdated();
      setModalOpen(false);
      setEditingTemplate(null);
    } catch (err: any) {
      setError(err.message || 'Failed to save specification template');
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
            <Sliders className="w-5 h-5 text-[#F15A24]" />
            <span>Category Specification Templates</span>
          </h2>
          <p className="text-xs text-slate-400">
            Define dynamic technical specifications, comparison tables, and faceted search filters per product category.
          </p>
        </div>

        <Button size="sm" onClick={handleCreateNew} className="bg-[#F15A24] text-white hover:bg-[#D94D1C]">
          <Plus className="w-4 h-4 mr-1.5" />
          <span>+ Create Spec Template</span>
        </Button>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map(t => (
          <div
            key={t.id}
            className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4 flex flex-col justify-between hover:border-slate-700 transition"
          >
            <div className="space-y-2">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-sm text-white">{t.name}</h3>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Category Slug: <span className="font-mono text-slate-300">{t.categorySlug}</span>
                  </div>
                </div>
                <Badge variant="orange">{t.fields.length} Fields</Badge>
              </div>

              {/* Field Summary */}
              <div className="pt-2 border-t border-slate-800/80 space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {t.fields.map(f => (
                  <div
                    key={f.id}
                    className="flex items-center justify-between bg-slate-900/80 px-2.5 py-1.5 rounded-lg text-xs"
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="font-medium text-slate-200">{f.name}</span>
                      {f.unit && <span className="text-[10px] text-slate-400">({f.unit})</span>}
                    </div>

                    <div className="flex items-center gap-1.5">
                      {f.filterable && (
                        <span className="text-[9px] bg-slate-800 text-amber-300 px-1 py-0.5 rounded font-bold">
                          Filter
                        </span>
                      )}
                      {f.showInHighlights && (
                        <span className="text-[9px] bg-orange-950 text-orange-300 px-1 py-0.5 rounded font-bold">
                          Hero
                        </span>
                      )}
                      <span className="text-[10px] text-slate-500 font-mono">[{f.type}]</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
              <button
                onClick={() => handleDelete(t.id, t.name)}
                className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>

              <Button size="sm" variant="outline" onClick={() => handleEdit(t)}>
                <Edit3 className="w-3.5 h-3.5 mr-1" />
                <span>Edit Builder</span>
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* INTERACTIVE SPEC TEMPLATE BUILDER MODAL */}
      {modalOpen && editingTemplate && (
        <Modal
          isOpen={modalOpen}
          onClose={() => {
            setModalOpen(false);
            setEditingTemplate(null);
          }}
          title={editingTemplate.name ? `Edit Spec Template: ${editingTemplate.name}` : 'Create Specification Template'}
          maxWidth="max-w-4xl"
        >
          <div className="space-y-6 text-slate-900 max-h-[82vh] overflow-y-auto pr-1">
            {error && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs p-3 rounded-xl flex items-center justify-between">
                <span>{error}</span>
                <button type="button" onClick={() => setError(null)}><X className="w-4 h-4" /></button>
              </div>
            )}

            {/* Template Core Info */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Template Name *</label>
                <input
                  type="text"
                  value={editingTemplate.name}
                  onChange={e => setEditingTemplate({ ...editingTemplate, name: e.target.value })}
                  placeholder="e.g. Network Switches & PoE"
                  className="w-full bg-white border border-slate-300 text-xs p-2.5 rounded-lg font-bold"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Target Category Slug *</label>
                <input
                  type="text"
                  value={editingTemplate.categorySlug}
                  onChange={e => setEditingTemplate({ ...editingTemplate, categorySlug: e.target.value })}
                  placeholder="e.g. network-switches"
                  className="w-full bg-white border border-slate-300 text-xs p-2.5 rounded-lg font-mono font-medium"
                />
              </div>
            </div>

            {/* Interactive Fields Builder */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                    Dynamic Specification Fields ({editingTemplate.fields.length})
                  </h3>
                  <p className="text-[10px] text-slate-500">
                    Configure data types, units, and faceted search filter flags for each attribute.
                  </p>
                </div>

                <Button size="sm" onClick={handleAddField} className="bg-[#F15A24] text-white">
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  <span>Add Field</span>
                </Button>
              </div>

              <div className="space-y-3">
                {editingTemplate.fields.map((field, idx) => (
                  <div
                    key={field.id}
                    className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-3 shadow-sm"
                  >
                    {/* Top Row: Reorder, Name, Key, Type, Unit, Delete */}
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="flex items-center gap-0.5 text-slate-400">
                        <button
                          type="button"
                          onClick={() => handleMoveField(idx, 'up')}
                          disabled={idx === 0}
                          className="p-1 hover:text-slate-800 disabled:opacity-30"
                          title="Move up"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveField(idx, 'down')}
                          disabled={idx === editingTemplate.fields.length - 1}
                          className="p-1 hover:text-slate-800 disabled:opacity-30"
                          title="Move down"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="flex-1 min-w-[140px]">
                        <input
                          type="text"
                          value={field.name}
                          onChange={e => handleUpdateField(field.id, { name: e.target.value })}
                          placeholder="Field Name (e.g. PoE Ports)"
                          className="w-full bg-slate-50 border border-slate-300 text-xs p-2 rounded-lg font-bold"
                        />
                      </div>

                      <div className="flex-1 min-w-[120px]">
                        <input
                          type="text"
                          value={field.key}
                          onChange={e => handleUpdateField(field.id, { key: e.target.value })}
                          placeholder="Key (e.g. poe_ports)"
                          className="w-full bg-slate-50 border border-slate-300 text-xs p-2 rounded-lg font-mono"
                        />
                      </div>

                      <div className="w-28">
                        <select
                          value={field.type}
                          onChange={e => handleUpdateField(field.id, { type: e.target.value as SpecFieldType })}
                          className="w-full bg-slate-50 border border-slate-300 text-xs p-2 rounded-lg font-medium"
                        >
                          <option value="text">Text</option>
                          <option value="number">Number</option>
                          <option value="boolean">Boolean (Yes/No)</option>
                          <option value="enum">Dropdown List</option>
                          <option value="unit">Measurement</option>
                        </select>
                      </div>

                      <div className="w-20">
                        <input
                          type="text"
                          value={field.unit || ''}
                          onChange={e => handleUpdateField(field.id, { unit: e.target.value })}
                          placeholder="Unit (MP)"
                          className="w-full bg-slate-50 border border-slate-300 text-xs p-2 rounded-lg"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveField(field.id)}
                        className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition"
                        title="Delete Field"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Enum Options Editor (if type is enum) */}
                    {field.type === 'enum' && (
                      <div className="pl-6 border-l-2 border-orange-200 space-y-1">
                        <label className="text-[11px] font-bold text-slate-600 block">
                          Dropdown Options (comma-separated):
                        </label>
                        <input
                          type="text"
                          value={(field.options || []).join(', ')}
                          onChange={e => {
                            const opts = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
                            handleUpdateField(field.id, { options: opts });
                          }}
                          placeholder="e.g. 2MP (1080p), 4MP (2K), 8MP (4K)"
                          className="w-full bg-slate-50 border border-slate-300 text-xs p-2 rounded-lg"
                        />
                      </div>
                    )}

                    {/* Flags / Toggles Row */}
                    <div className="flex flex-wrap items-center gap-4 text-xs pt-1 border-t border-slate-100">
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={!!field.filterable}
                          onChange={e => handleUpdateField(field.id, { filterable: e.target.checked })}
                          className="w-3.5 h-3.5 text-[#F15A24] rounded"
                        />
                        <span className="font-semibold text-slate-700">Faceted Filter</span>
                        <span className="text-[10px] text-slate-400">(Show in category sidebar)</span>
                      </label>

                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={!!field.comparable}
                          onChange={e => handleUpdateField(field.id, { comparable: e.target.checked })}
                          className="w-3.5 h-3.5 text-[#F15A24] rounded"
                        />
                        <span className="font-semibold text-slate-700">Comparable</span>
                        <span className="text-[10px] text-slate-400">(Comparison matrix)</span>
                      </label>

                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={!!field.showInHighlights}
                          onChange={e => handleUpdateField(field.id, { showInHighlights: e.target.checked })}
                          className="w-3.5 h-3.5 text-[#F15A24] rounded"
                        />
                        <span className="font-semibold text-slate-700">Hero Highlight Chip</span>
                        <span className="text-[10px] text-slate-400">(Banner badges)</span>
                      </label>

                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={!!field.required}
                          onChange={e => handleUpdateField(field.id, { required: e.target.checked })}
                          className="w-3.5 h-3.5 text-[#F15A24] rounded"
                        />
                        <span className="font-semibold text-slate-700">Required</span>
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
              <Button
                variant="ghost"
                onClick={() => {
                  setModalOpen(false);
                  setEditingTemplate(null);
                }}
                disabled={isSaving}
              >
                Cancel
              </Button>

              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="bg-[#F15A24] text-white hover:bg-[#D94D1C]"
              >
                <Check className="w-4 h-4 mr-1.5" />
                <span>{isSaving ? 'Saving Template...' : 'Save Spec Template'}</span>
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

