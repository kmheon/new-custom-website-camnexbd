import React, { useState, useEffect } from 'react';
import {
  Tag,
  Plus,
  Trash2,
  Edit3,
  Search,
  CheckCircle2,
  XCircle,
  Percent,
  Calendar,
  AlertCircle,
  RefreshCw,
  Eye,
  SlidersHorizontal,
  DollarSign
} from 'lucide-react';
import { Coupon } from '../../types';
import { apiFetch } from '../../services/apiClient';
import { DataTable } from './framework/DataTable';
import { FormShell } from './framework/FormShell';
import { ConfirmDialog } from './framework/ConfirmDialog';
import { Badge, Button } from '../common/UI';

export const CouponsModule: React.FC = () => {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'percent' | 'fixed'>('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Coupon | null>(null);

  // Form Fields
  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState<'percent' | 'fixed'>('percent');
  const [discountValue, setDiscountValue] = useState<number>(10);
  const [minOrderAmount, setMinOrderAmount] = useState<number>(0);
  const [maxDiscountAmount, setMaxDiscountAmount] = useState<number | ''>('');
  const [scopeType, setScopeType] = useState<'all' | 'category' | 'product' | 'package'>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [usageLimit, setUsageLimit] = useState<number | ''>('');
  const [isActive, setIsActive] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Validation Test Sandbox
  const [testCode, setTestCode] = useState('');
  const [testSubtotal, setTestSubtotal] = useState<number>(5000);
  const [testResult, setTestResult] = useState<{ valid: boolean; message: string; discountAmount?: number } | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  const fetchCoupons = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await apiFetch<Coupon[]>('/admin/coupons');
      setCoupons(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load coupons');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const handleOpenCreate = () => {
    setEditingCoupon(null);
    setCode('');
    setDiscountType('percent');
    setDiscountValue(10);
    setMinOrderAmount(0);
    setMaxDiscountAmount('');
    setScopeType('all');
    setStartDate('');
    setEndDate('');
    setUsageLimit('');
    setIsActive(true);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (c: Coupon) => {
    setEditingCoupon(c);
    setCode(c.code);
    setDiscountType(c.discount_type);
    setDiscountValue(c.discount_value);
    setMinOrderAmount(c.min_order_amount || 0);
    setMaxDiscountAmount(c.max_discount_amount ?? '');
    setScopeType(c.scope_type || 'all');
    setStartDate(c.start_date ? c.start_date.substring(0, 10) : '');
    setEndDate(c.end_date ? c.end_date.substring(0, 10) : '');
    setUsageLimit(c.usage_limit ?? '');
    setIsActive(Boolean(c.is_active));
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) {
      setFormError('Coupon code is required.');
      return;
    }
    if (discountValue <= 0) {
      setFormError('Discount value must be greater than zero.');
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    const payload = {
      code: code.trim().toUpperCase(),
      discount_type: discountType,
      discount_value: Number(discountValue),
      min_order_amount: Number(minOrderAmount) || 0,
      max_discount_amount: maxDiscountAmount === '' ? null : Number(maxDiscountAmount),
      scope_type: scopeType,
      start_date: startDate ? new Date(startDate).toISOString() : null,
      end_date: endDate ? new Date(endDate).toISOString() : null,
      usage_limit: usageLimit === '' ? null : Number(usageLimit),
      is_active: isActive ? 1 : 0
    };

    try {
      if (editingCoupon) {
        await apiFetch(`/admin/coupons/${editingCoupon.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
      } else {
        await apiFetch('/admin/coupons', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
      }
      setIsModalOpen(false);
      fetchCoupons();
    } catch (err: any) {
      setFormError(err.message || 'Failed to save coupon.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await apiFetch(`/admin/coupons/${deleteTarget.id}`, { method: 'DELETE' });
      setDeleteTarget(null);
      fetchCoupons();
    } catch (err: any) {
      alert(err.message || 'Failed to delete coupon.');
    }
  };

  const handleValidateTest = async () => {
    if (!testCode.trim()) return;
    setIsValidating(true);
    setTestResult(null);
    try {
      const res = await apiFetch<any>('/coupons/validate', {
        method: 'POST',
        body: JSON.stringify({ code: testCode.trim(), subtotal: testSubtotal })
      });
      setTestResult({
        valid: true,
        message: res.message || 'Coupon valid!',
        discountAmount: res.discountAmount
      });
    } catch (err: any) {
      setTestResult({ valid: false, message: err.message || 'Coupon invalid or conditions not met.' });
    } finally {
      setIsValidating(false);
    }
  };

  const filteredCoupons = coupons.filter(c => {
    const matchesSearch = c.code.toLowerCase().includes(searchQuery.toLowerCase().trim());
    const matchesType = filterType === 'all' || c.discount_type === filterType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold font-heading text-white flex items-center gap-2">
            <Tag className="w-5 h-5 text-[#F15A24]" />
            Promotional Offers & Coupons CMS
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Create percentage or fixed BDT discount vouchers with basket thresholds, usage caps, and expiration schedules.
          </p>
        </div>

        <Button
          onClick={handleOpenCreate}
          size="sm"
          className="bg-[#F15A24] hover:bg-[#D94D1C] text-white flex items-center gap-1.5 shadow-md"
        >
          <Plus className="w-4 h-4" />
          Create Coupon
        </Button>
      </div>

      {/* Live Sandbox & Checkout Validator */}
      <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
            <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-400" />
            Checkout Engine Sandbox & Simulator
          </span>
          <span className="text-[11px] text-slate-500">Test client coupon validation against live database rules</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
          <div className="sm:col-span-5">
            <label className="text-[11px] font-bold text-slate-400 block mb-1">Coupon Code to Test</label>
            <input
              type="text"
              value={testCode}
              onChange={(e) => setTestCode(e.target.value)}
              placeholder="e.g. CAMNEX2026"
              className="w-full bg-slate-900 border border-slate-700 text-white p-2 rounded text-xs font-mono font-bold uppercase"
            />
          </div>

          <div className="sm:col-span-4">
            <label className="text-[11px] font-bold text-slate-400 block mb-1">Simulated Basket Subtotal (৳)</label>
            <input
              type="number"
              value={testSubtotal}
              onChange={(e) => setTestSubtotal(parseInt(e.target.value) || 0)}
              className="w-full bg-slate-900 border border-slate-700 text-white p-2 rounded text-xs font-mono"
            />
          </div>

          <div className="sm:col-span-3">
            <Button
              type="button"
              onClick={handleValidateTest}
              disabled={isValidating || !testCode.trim()}
              size="sm"
              className="w-full bg-slate-800 hover:bg-slate-700 text-white border border-slate-700"
            >
              {isValidating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : 'Evaluate Rule'}
            </Button>
          </div>
        </div>

        {testResult && (
          <div className={`p-3 rounded-xl border text-xs flex items-center justify-between ${
            testResult.valid
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
          }`}>
            <span className="font-medium">{testResult.message}</span>
            {testResult.discountAmount != null && (
              <span className="font-mono font-bold text-emerald-400 text-sm">
                -৳{testResult.discountAmount.toLocaleString()}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-950 p-3 rounded-xl border border-slate-800">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search coupon code..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs"
          />
        </div>

        <div className="flex items-center gap-2">
          {(['all', 'percent', 'fixed'] as const).map(t => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition ${
                filterType === t
                  ? 'bg-[#F15A24] text-white'
                  : 'text-slate-400 hover:text-white bg-slate-900'
              }`}
            >
              {t === 'all' ? 'All Types' : t === 'percent' ? '% Percentage' : 'Fixed BDT'}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-[#F15A24]" />
            Loading promotional coupons...
          </div>
        ) : filteredCoupons.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs space-y-2">
            <Tag className="w-8 h-8 mx-auto text-slate-600 mb-2" />
            <p className="font-semibold text-slate-300">No promotional coupons found.</p>
            <p className="text-slate-500">Create a new coupon code to enable checkout discounts.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/60 text-slate-400 uppercase text-[10px] tracking-wider">
                  <th className="p-4">Coupon Code</th>
                  <th className="p-4">Discount Value</th>
                  <th className="p-4">Basket Threshold</th>
                  <th className="p-4">Usage Count</th>
                  <th className="p-4">Schedule / Validity</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredCoupons.map((c) => {
                  const isExpired = c.end_date && new Date(c.end_date) < new Date();

                  return (
                    <tr key={c.id} className="hover:bg-slate-900/40 transition">
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-white text-sm bg-slate-900 px-2 py-1 rounded border border-slate-800 text-[#F15A24]">
                            {c.code}
                          </span>
                        </div>
                      </td>

                      <td className="p-4">
                        <span className="font-bold text-white font-mono text-sm">
                          {c.discount_type === 'percent' ? `${c.discount_value}% OFF` : `৳${c.discount_value.toLocaleString()} OFF`}
                        </span>
                        {c.max_discount_amount && (
                          <span className="block text-[10px] text-slate-400 font-mono">
                            Max Cap: ৳{c.max_discount_amount.toLocaleString()}
                          </span>
                        )}
                      </td>

                      <td className="p-4">
                        {c.min_order_amount && c.min_order_amount > 0 ? (
                          <span className="font-mono text-slate-300">
                            Min: ৳{c.min_order_amount.toLocaleString()}
                          </span>
                        ) : (
                          <span className="text-slate-500 italic">No minimum</span>
                        )}
                      </td>

                      <td className="p-4">
                        <span className="font-mono text-white">
                          {c.usage_count}
                          {c.usage_limit ? ` / ${c.usage_limit}` : ' (unlimited)'}
                        </span>
                      </td>

                      <td className="p-4">
                        {c.end_date ? (
                          <span className={`text-[11px] font-mono ${isExpired ? 'text-rose-400 font-bold' : 'text-slate-300'}`}>
                            {isExpired ? 'Expired: ' : 'Until: '}
                            {new Date(c.end_date).toLocaleDateString()}
                          </span>
                        ) : (
                          <span className="text-slate-500 italic">No expiry</span>
                        )}
                      </td>

                      <td className="p-4">
                        <Badge variant={!c.is_active ? 'gray' : isExpired ? 'danger' : 'success'}>
                          {!c.is_active ? 'Inactive' : isExpired ? 'Expired' : 'Active'}
                        </Badge>
                      </td>

                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenEdit(c)}
                            className="p-1 text-slate-400 hover:text-white transition"
                            title="Edit Coupon"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(c)}
                            className="p-1 text-slate-500 hover:text-rose-400 transition"
                            title="Delete Coupon"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CREATE / EDIT COUPON MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Tag className="w-4 h-4 text-[#F15A24]" />
                {editingCoupon ? 'Edit Promotional Coupon' : 'Create New Promotional Coupon'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              {formError && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-lg">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="text-slate-400 font-bold block mb-1">Coupon Code (Uppercase)</label>
                  <input
                    type="text"
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder="e.g. CCTV2026, EIDBONANZA"
                    className="w-full bg-slate-950 border border-slate-700 text-white p-2.5 rounded-lg text-xs font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="text-slate-400 font-bold block mb-1">Discount Type</label>
                  <select
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 text-white p-2.5 rounded-lg text-xs"
                  >
                    <option value="percent">Percentage (%)</option>
                    <option value="fixed">Fixed Amount (৳)</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-400 font-bold block mb-1">
                    {discountType === 'percent' ? 'Discount Percentage (%)' : 'Discount Amount (৳)'}
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={discountType === 'percent' ? 100 : 1000000}
                    value={discountValue}
                    onChange={(e) => setDiscountValue(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-700 text-white p-2.5 rounded-lg text-xs font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="text-slate-400 font-bold block mb-1">Minimum Order Amount (৳)</label>
                  <input
                    type="number"
                    min={0}
                    value={minOrderAmount}
                    onChange={(e) => setMinOrderAmount(parseFloat(e.target.value) || 0)}
                    placeholder="0 = No minimum"
                    className="w-full bg-slate-950 border border-slate-700 text-white p-2.5 rounded-lg text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="text-slate-400 font-bold block mb-1">Max Discount Cap (৳)</label>
                  <input
                    type="number"
                    min={0}
                    value={maxDiscountAmount}
                    onChange={(e) => setMaxDiscountAmount(e.target.value === '' ? '' : parseFloat(e.target.value) || 0)}
                    placeholder="Optional max limit"
                    className="w-full bg-slate-950 border border-slate-700 text-white p-2.5 rounded-lg text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="text-slate-400 font-bold block mb-1">Schedule Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 text-white p-2 rounded-lg text-xs"
                  />
                </div>

                <div>
                  <label className="text-slate-400 font-bold block mb-1">Schedule End Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 text-white p-2 rounded-lg text-xs"
                  />
                </div>

                <div>
                  <label className="text-slate-400 font-bold block mb-1">Total Usage Limit</label>
                  <input
                    type="number"
                    min={1}
                    value={usageLimit}
                    onChange={(e) => setUsageLimit(e.target.value === '' ? '' : parseInt(e.target.value) || 1)}
                    placeholder="Leave blank for unlimited"
                    className="w-full bg-slate-950 border border-slate-700 text-white p-2.5 rounded-lg text-xs font-mono"
                  />
                </div>

                <div className="flex items-center gap-2 pt-6">
                  <input
                    type="checkbox"
                    id="couponIsActive"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="w-4 h-4 rounded text-[#F15A24] focus:ring-[#F15A24]"
                  />
                  <label htmlFor="couponIsActive" className="font-bold text-white cursor-pointer">
                    Coupon is Active
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-800">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isSubmitting}
                  className="bg-[#F15A24] hover:bg-[#D94D1C] text-white flex items-center gap-1.5"
                >
                  {isSubmitting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : null}
                  {editingCoupon ? 'Save Changes' : 'Create Coupon'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE DIALOG */}
      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        title="Delete Coupon Voucher"
        message={`Are you sure you want to permanently delete coupon "${deleteTarget?.code}"? Customers will no longer be able to apply this code at checkout.`}
        confirmPhrase="DELETE COUPON"
        confirmLabel="Permanently Delete"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};

