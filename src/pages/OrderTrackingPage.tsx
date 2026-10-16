import React, { useState, useEffect, useCallback } from 'react';
import { Search, Package, Clock, CheckCircle2, Phone, MapPin, Truck } from 'lucide-react';
import { SEO } from '../components/common/SEO';
import { Breadcrumbs, Button, Input, Badge, Alert } from '../components/common/UI';
import { orderService } from '../services';
import { Order } from '../types';

interface OrderTrackingPageProps {
  initialOrderNumber?: string;
  onNavigate: (route: string, param?: string) => void;
}

export const OrderTrackingPage: React.FC<OrderTrackingPageProps> = ({ initialOrderNumber = '', onNavigate }) => {
  const [orderNumber, setOrderNumber] = useState(initialOrderNumber);
  const [phone, setPhone] = useState('');
  const [searchedOrder, setSearchedOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = useCallback(async (num = orderNumber, ph = phone) => {
    if (!num.trim()) {
      setError('Please provide your order reference number.');
      return;
    }
    setError('');
    setIsLoading(true);
    try {
      const found = await orderService.getOrderByNumber(num.trim(), ph.trim());
      if (found) {
        setSearchedOrder(found);
      } else {
        setSearchedOrder(null);
        setError('No order found matching these details. Please verify your reference number.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [orderNumber, phone]);

  useEffect(() => {
    if (initialOrderNumber) {
      handleSearch(initialOrderNumber, '');
    }
  }, [initialOrderNumber, handleSearch]);

  return (
    <div className="bg-[#F8FAFC] min-h-screen py-6 sm:py-10">
      <SEO
        title="Live Order Tracking & Status | CamneX Bangladesh"
        description="Check real-time dispatch and installation status of your security order."
        canonicalPath="/tracking"
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <Breadcrumbs
          items={[
            { label: 'Home', onClick: () => onNavigate('home') },
            { label: 'Track Order' }
          ]}
        />

        <div className="my-6 text-center max-w-xl mx-auto">
          <h1 className="text-2xl sm:text-3xl font-black text-[#111827] font-heading mb-2">
            Track Your Hardware Order
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Enter your order reference code (e.g. CNX-ORD-...) received during checkout.
          </p>
        </div>

        {/* Tracking Search Form */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm max-w-2xl mx-auto mb-8">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSearch();
            }}
            className="space-y-4"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Order Number *"
                placeholder="e.g. CNX-ORD-202610-1042"
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
                data-testid="track-order-input-number"
                required
              />
              <Input
                label="Mobile Phone Number *"
                placeholder="e.g. 017XXXXXXXX"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                data-testid="track-order-input-phone"
                required
              />
            </div>

            {error && <Alert type="warning">{error}</Alert>}

            <Button size="md" type="submit" isLoading={isLoading} data-testid="track-order-submit-btn" className="w-full">
              <Search className="w-4 h-4 mr-2" />
              <span>Lookup Order Timeline</span>
            </Button>
          </form>
        </div>

        {/* Order Details & Timeline Display */}
        {searchedOrder && (
          <div data-testid="track-order-results" className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-8 animate-fade-in">
            
            {/* Header Status */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-200 gap-4">
              <div>
                <span className="text-xs font-mono text-slate-500">Order Reference:</span>
                <div className="text-xl font-black text-[#111827] font-heading">
                  {searchedOrder.orderNumber}
                </div>
                <div className="text-xs text-slate-400 mt-0.5">
                  Placed on {new Date(searchedOrder.createdAt).toLocaleDateString()}
                </div>
              </div>

              <div className="text-left sm:text-right">
                <span className="text-xs text-slate-500 block mb-1">Current Status</span>
                <Badge data-testid="track-order-status-badge" variant={searchedOrder.status === 'delivered' || searchedOrder.status === 'installed' ? 'success' : 'orange'}>
                  {searchedOrder.status.toUpperCase()}
                </Badge>
              </div>
            </div>

            {/* Delivery & Fulfillment Information */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-orange-100 text-[#F15A24] flex items-center justify-center shrink-0">
                  <Truck className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-[#111827]">Delivery & Fulfillment</div>
                  <div className="text-slate-500">
                    Method: {searchedOrder.deliveryInfo?.method || searchedOrder.deliveryMethod || 'Standard Courier / Installation'}
                  </div>
                </div>
              </div>
              <div className="text-slate-600 sm:text-right">
                <span className="font-medium text-slate-700">Destination: </span>
                <span>{searchedOrder.deliveryInfo?.district || 'Dhaka'}</span>
              </div>
            </div>

            {/* Timeline Events */}
            <div data-testid="track-order-timeline">
              <h3 className="text-sm font-bold text-[#111827] uppercase tracking-wider mb-4 font-heading">
                Status Timeline
              </h3>
              <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                {(searchedOrder.timeline || []).map((evt, idx) => (
                  <div key={idx} className="relative">
                    <div className="absolute -left-6 top-1 w-4 h-4 rounded-full bg-[#F15A24] border-2 border-white ring-2 ring-orange-500/20" />
                    <div>
                      <div className="text-sm font-bold text-[#111827]">
                        {evt.title || (typeof evt.status === 'string' ? evt.status.replace(/_/g, ' ').toUpperCase() : 'Status Update')}
                      </div>
                      {evt.note && <p className="text-xs text-slate-600 mt-0.5">{evt.note}</p>}
                      <div className="text-[10px] text-slate-400 mt-1 font-mono">
                        {new Date(evt.timestamp).toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Items Summary */}
            {Array.isArray(searchedOrder.items) && searchedOrder.items.length > 0 && (
              <div className="pt-6 border-t border-slate-200">
                <h3 className="text-sm font-bold text-[#111827] uppercase tracking-wider mb-4 font-heading">
                  Hardware Ordered ({searchedOrder.items.length} items)
                </h3>
                <div className="space-y-3">
                  {searchedOrder.items.map((item, idx) => (
                    <div key={idx} className="p-3 bg-slate-50 rounded-xl flex items-center justify-between text-xs">
                      <div>
                        <div className="font-bold text-[#111827]">{item.name}</div>
                        {item.model && <div className="text-[11px] text-slate-500 font-mono">Model: {item.model}</div>}
                        {item.packageDetails && (
                          <span className="text-[10px] text-orange-600 font-bold block">{item.packageDetails}</span>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-[#111827]">Qty: {item.quantity}</div>
                        {item.totalPrice != null && (
                          <div className="text-slate-500">৳{item.totalPrice.toLocaleString()}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-4 mt-4 border-t border-slate-200 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Payment Method:</span>
                    <span className="font-bold text-[#111827]">
                      {searchedOrder.paymentMethod === 'cod' ? 'Cash on Delivery (COD)' :
                       searchedOrder.paymentMethod === 'bkash_manual' ? 'bKash Send Money' :
                       searchedOrder.paymentMethod === 'nagad_manual' ? 'Nagad' :
                       searchedOrder.paymentMethod === 'bank_transfer' ? 'Corporate Bank Transfer' :
                       typeof searchedOrder.paymentMethod === 'string' ? searchedOrder.paymentMethod : 'Official Payment'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Payment Status:</span>
                    <span className={`font-bold ${searchedOrder.paymentStatus === 'paid' ? 'text-emerald-600' : 'text-amber-600'}`}>
                      {searchedOrder.paymentStatus === 'paid' ? 'Paid / Verified' : 'Pending Verification Upon Delivery / Audit'}
                    </span>
                  </div>
                  {searchedOrder.total != null && (
                    <div className="flex justify-between items-baseline pt-2 border-t border-slate-200 text-sm font-bold">
                      <span>Total:</span>
                      <span className="text-xl text-[#F15A24] font-black font-heading">
                        ৳{searchedOrder.total.toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Need Assistance Action Card */}
            <div className="pt-6 border-t border-slate-200 bg-orange-50/50 p-5 rounded-2xl border border-orange-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h4 className="font-bold text-sm text-[#111827]">Questions regarding your order or dispatch?</h4>
                <p className="text-xs text-slate-600 mt-0.5">
                  Our Dhaka dispatch and technical coordination desk is ready to assist you.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  data-testid="track-order-contact-btn"
                  onClick={() => onNavigate('contact')}
                >
                  Contact Support
                </Button>
                <a
                  href="tel:+8801540535150"
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-[#F15A24] text-white font-bold text-xs rounded-xl hover:bg-[#D94D1C] transition-colors"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>Call Desk</span>
                </a>
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};
