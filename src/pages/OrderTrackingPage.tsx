import React, { useState, useEffect } from 'react';
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

  useEffect(() => {
    if (initialOrderNumber) {
      handleSearch(initialOrderNumber, '');
    }
  }, [initialOrderNumber]);

  const handleSearch = async (num = orderNumber, ph = phone) => {
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
  };

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
                required
              />
              <Input
                label="Phone Number (Optional verification)"
                placeholder="e.g. 01712-XXXXXX"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>

            {error && <Alert type="warning">{error}</Alert>}

            <Button size="md" type="submit" isLoading={isLoading} className="w-full">
              <Search className="w-4 h-4 mr-2" />
              <span>Lookup Order Timeline</span>
            </Button>
          </form>
        </div>

        {/* Order Details & Timeline Display */}
        {searchedOrder && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-8 animate-fade-in">
            
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
                <Badge variant={searchedOrder.status === 'delivered' ? 'success' : 'orange'}>
                  {searchedOrder.status.toUpperCase()}
                </Badge>
              </div>
            </div>

            {/* Timeline Events */}
            <div>
              <h3 className="text-sm font-bold text-[#111827] uppercase tracking-wider mb-4 font-heading">
                Status Timeline
              </h3>
              <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                {searchedOrder.timeline.map((evt, idx) => (
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
            <div className="pt-6 border-t border-slate-200">
              <h3 className="text-sm font-bold text-[#111827] uppercase tracking-wider mb-4 font-heading">
                Hardware Ordered ({searchedOrder.items.length} items)
              </h3>
              <div className="space-y-3">
                {searchedOrder.items.map((item, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 rounded-xl flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-[#111827]">{item.name}</div>
                      <div className="text-[11px] text-slate-500 font-mono">Model: {item.model}</div>
                      {item.packageDetails && (
                        <span className="text-[10px] text-orange-600 font-bold block">{item.packageDetails}</span>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-[#111827]">Qty: {item.quantity}</div>
                      <div className="text-slate-500">৳{item.totalPrice.toLocaleString()}</div>
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
                     searchedOrder.paymentMethod === 'bank_transfer' ? `Bank Transfer (${searchedOrder.paymentDetails?.bankName || 'Corporate'})` :
                     'Online Payment Gateway'}
                  </span>
                </div>
                {searchedOrder.paymentDetails?.transactionId && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Transaction ID (TrxID):</span>
                    <span className="font-mono font-bold text-emerald-600">{searchedOrder.paymentDetails.transactionId}</span>
                  </div>
                )}
                {searchedOrder.paymentDetails?.depositRef && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Bank Deposit Ref:</span>
                    <span className="font-mono font-bold text-emerald-600">{searchedOrder.paymentDetails.depositRef}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-500">Payment Status:</span>
                  <span className={`font-bold ${searchedOrder.paymentStatus === 'paid' ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {searchedOrder.paymentStatus === 'paid' ? 'Paid / Verified' : 'Pending Verification Upon Delivery / Audit'}
                  </span>
                </div>
                <div className="flex justify-between items-baseline pt-2 border-t border-slate-200 text-sm font-bold">
                  <span>Total Payable:</span>
                  <span className="text-xl text-[#F15A24] font-black font-heading">
                    ৳{searchedOrder.total.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};
