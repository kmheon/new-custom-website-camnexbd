import React, { useState, useEffect } from 'react';
import {
  FileText, Printer, Check, X, Truck, Calendar, User, Phone, MapPin,
  CreditCard, Shield, Package, Save, ExternalLink
} from 'lucide-react';
import { Button, Modal, Badge } from '../common/UI';
import { orderService } from '../../services';
import { Order } from '../../types';

interface OrderDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
  onOrderUpdated: () => void;
}

export const OrderDetailModal: React.FC<OrderDetailModalProps> = ({
  isOpen,
  onClose,
  order,
  onOrderUpdated
}) => {
  const [internalNotes, setInternalNotes] = useState(order?.internalStaffNotes || '');
  const [courierName, setCourierName] = useState(order?.courierName || 'Steadfast Courier');
  const [trackingNumber, setTrackingNumber] = useState(order?.trackingNumber || '');
  const [estimatedDelivery, setEstimatedDelivery] = useState(order?.estimatedDeliveryDate || '');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [printMode, setPrintMode] = useState(false);

  useEffect(() => {
    if (order) {
      setInternalNotes(order.internalStaffNotes || '');
      setCourierName(order.courierName || 'Steadfast Courier');
      setTrackingNumber(order.trackingNumber || '');
      setEstimatedDelivery(order.estimatedDeliveryDate || '');
    }
  }, [order]);

  if (!isOpen || !order) return null;

  const handleSaveDetails = async () => {
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      const res = await fetch(`/api/orders/${encodeURIComponent(order.id)}/details`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          internalStaffNotes: internalNotes,
          courierName,
          trackingNumber,
          estimatedDeliveryDate: estimatedDelivery
        })
      });
      if (!res.ok) throw new Error('Failed to update order details');
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
      onOrderUpdated();
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Commercial Invoice & Order Management: ${order.orderNumber}`}
      maxWidth="max-w-4xl"
    >
      <div className="space-y-6 text-slate-900 max-h-[82vh] overflow-y-auto pr-1 print:p-0 print:max-h-none">
        {/* Printable Invoice Header */}
        <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-heading font-black text-xl text-slate-900">CamneX Bangladesh</span>
              <Badge variant="orange">Commercial Invoice</Badge>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Enterprise CCTV & Security Systems · Official Warranty Provider
            </p>
            <div className="text-xs font-mono font-bold text-slate-700 mt-1">
              Order Ref: <span className="text-[#F15A24]">{order.orderNumber}</span> · Date: {new Date(order.createdAt).toLocaleDateString()}
            </div>
          </div>

          <div className="flex items-center gap-2 print:hidden">
            <Button size="sm" variant="outline" onClick={handlePrint}>
              <Printer className="w-3.5 h-3.5 mr-1.5" />
              <span>Print Invoice</span>
            </Button>
          </div>
        </div>

        {/* Customer & Delivery Information Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase text-slate-600">
              <User className="w-3.5 h-3.5 text-[#F15A24]" />
              <span>Customer Information</span>
            </div>
            <div className="text-sm font-bold text-slate-900">{order.customerName}</div>
            <div className="text-xs text-slate-600 flex items-center gap-2">
              <Phone className="w-3.5 h-3.5 text-slate-400" />
              <span className="font-mono">{order.customerPhone}</span>
            </div>
            {order.customerEmail && (
              <div className="text-xs text-slate-600">{order.customerEmail}</div>
            )}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500">Payment Method:</span>
              <span className="font-bold uppercase text-slate-800">{order.paymentMethod?.replace('_', ' ')}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">Payment Status:</span>
              <Badge variant={order.paymentStatus === 'paid' ? 'success' : 'yellow'}>
                {order.paymentStatus}
              </Badge>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase text-slate-600">
              <MapPin className="w-3.5 h-3.5 text-[#F15A24]" />
              <span>Delivery & Courier Logistics</span>
            </div>
            <div className="text-xs font-bold text-slate-800">{order.deliveryCity}</div>
            <div className="text-xs text-slate-600 leading-relaxed">{order.deliveryAddress}</div>
            {order.installation?.requested && (
              <div className="p-2 bg-orange-50 border border-orange-200 rounded text-xs text-orange-800 font-bold">
                ✓ On-Site Installation Requested ({order.installation.preferredDate || 'Standard Schedule'})
              </div>
            )}
          </div>
        </div>

        {/* Order Items BOM Table */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-100 text-slate-600 font-bold uppercase text-[10px]">
              <tr>
                <th className="p-3">Item / Hardware Description</th>
                <th className="p-3 w-28">Model / SKU</th>
                <th className="p-3 w-16 text-center">Qty</th>
                <th className="p-3 w-28 text-right">Unit Price</th>
                <th className="p-3 w-28 text-right">Line Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {order.items.map((item, idx) => (
                <tr key={idx}>
                  <td className="p-3 font-medium text-slate-900">
                    <div>{item.name}</div>
                    {item.packageDetails && (
                      <div className="text-[11px] text-slate-500 mt-0.5">{item.packageDetails}</div>
                    )}
                  </td>
                  <td className="p-3 font-mono text-slate-600">{item.model || '—'}</td>
                  <td className="p-3 text-center font-bold text-slate-800">{item.quantity}</td>
                  <td className="p-3 text-right font-mono text-slate-600">৳{item.unitPrice?.toLocaleString()}</td>
                  <td className="p-3 text-right font-mono font-bold text-slate-900">৳{item.totalPrice?.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-slate-50 text-xs font-bold border-t border-slate-200">
              <tr>
                <td colSpan={4} className="p-2.5 text-right text-slate-600">Subtotal:</td>
                <td className="p-2.5 text-right font-mono">৳{order.subtotal?.toLocaleString()}</td>
              </tr>
              {order.deliveryFee > 0 && (
                <tr>
                  <td colSpan={4} className="p-2 text-right text-slate-600">Delivery Fee:</td>
                  <td className="p-2 text-right font-mono">৳{order.deliveryFee?.toLocaleString()}</td>
                </tr>
              )}
              <tr className="border-t border-slate-200 text-sm">
                <td colSpan={4} className="p-3 text-right text-slate-900">Commercial Total:</td>
                <td className="p-3 text-right font-mono text-[#F15A24] font-black">৳{order.total?.toLocaleString()}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Courier Dispatch & Internal Staff CRM Notes (Hidden during print) */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4 print:hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Truck className="w-4 h-4 text-[#F15A24]" />
              <span>Courier Tracking & Internal Staff Notes</span>
            </span>
            {saveSuccess && (
              <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                <Check className="w-3.5 h-3.5" />
                <span>Saved successfully</span>
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1">Courier Partner</label>
              <input
                type="text"
                value={courierName}
                onChange={(e) => setCourierName(e.target.value)}
                placeholder="e.g. Steadfast, Pathao, RedX, In-house Van"
                className="w-full bg-white border border-slate-300 text-xs p-2 rounded-lg text-slate-800"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1">Consignment / Tracking #</label>
              <input
                type="text"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                placeholder="e.g. SF-9021481"
                className="w-full bg-white border border-slate-300 text-xs p-2 rounded-lg font-mono text-slate-800"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1">Estimated Delivery</label>
              <input
                type="date"
                value={estimatedDelivery}
                onChange={(e) => setEstimatedDelivery(e.target.value)}
                className="w-full bg-white border border-slate-300 text-xs p-2 rounded-lg text-slate-800"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-600 block mb-1">
              Internal Staff CRM Notes (Private to CamneX Team)
            </label>
            <textarea
              rows={2}
              value={internalNotes}
              onChange={(e) => setInternalNotes(e.target.value)}
              placeholder="Record dispatch notes, technician assignments, warranty card serials..."
              className="w-full bg-white border border-slate-300 text-xs p-2 rounded-lg text-slate-800"
            />
          </div>

          <div className="flex justify-end">
            <Button size="sm" onClick={handleSaveDetails} disabled={isSaving}>
              <Save className="w-3.5 h-3.5 mr-1.5" />
              <span>{isSaving ? 'Saving...' : 'Save Logistics & Staff Notes'}</span>
            </Button>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="pt-3 border-t border-slate-200 flex justify-end print:hidden">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
};

