import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Search, 
  Package, 
  Clock, 
  CheckCircle2, 
  Phone, 
  MapPin, 
  Truck, 
  ExternalLink, 
  Copy, 
  Check, 
  AlertCircle, 
  RotateCcw, 
  User, 
  MessageSquare, 
  HelpCircle, 
  Calendar, 
  ShieldCheck,
  ChevronRight,
  Shield,
  Layers,
  FileText
} from 'lucide-react';
import { SEO } from '../components/common/SEO';
import { Breadcrumbs, Button, Input, Badge, Alert } from '../components/common/UI';
import { orderService } from '../services';
import { useCustomerAuthStore } from '../store';
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
  const [copiedTracking, setCopiedTracking] = useState(false);
  const [myOrders, setMyOrders] = useState<Order[]>([]);
  const [isLoadingMyOrders, setIsLoadingMyOrders] = useState(false);

  const resultsRef = useRef<HTMLDivElement>(null);
  const { currentCustomer, isCustomerAuthenticated, checkCustomerAuth, fetchMyOrders } = useCustomerAuthStore();

  // On mount: check customer session and fetch their recent orders if authenticated
  useEffect(() => {
    let isMounted = true;
    (async () => {
      const isAuth = await checkCustomerAuth();
      if (isAuth && isMounted) {
        setIsLoadingMyOrders(true);
        try {
          const orders = await fetchMyOrders();
          if (isMounted && Array.isArray(orders)) {
            setMyOrders(orders);
          }
        } catch (_) {
          // Silent catch for orders
        } finally {
          if (isMounted) setIsLoadingMyOrders(false);
        }
      }
    })();
    return () => { isMounted = false; };
  }, [checkCustomerAuth, fetchMyOrders]);

  // Autofill phone if customer is logged in or if cached in localStorage from checkout
  useEffect(() => {
    if (isCustomerAuthenticated && currentCustomer?.phone && !phone) {
      setPhone(currentCustomer.phone);
    } else if (!phone && typeof window !== 'undefined' && window.localStorage) {
      const cachedPhone = window.localStorage.getItem('camnex_last_checkout_phone');
      if (cachedPhone) setPhone(cachedPhone);
      const cachedOrder = window.localStorage.getItem('camnex_last_checkout_order');
      if (!orderNumber && cachedOrder && !initialOrderNumber) setOrderNumber(cachedOrder);
    }
  }, [isCustomerAuthenticated, currentCustomer, phone, orderNumber, initialOrderNumber]);

  const handleSearch = useCallback(async (num = orderNumber, ph = phone) => {
    const trimmedNum = (num || '').trim();
    const trimmedPh = (ph || '').trim();

    if (!trimmedNum) {
      setError('Please provide your order reference number.');
      return;
    }

    // If not authenticated, require phone verification
    if (!isCustomerAuthenticated && !trimmedPh) {
      setError('Please enter your billing phone number to verify and track your order.');
      return;
    }

    setError('');
    setIsLoading(true);
    try {
      const found = await orderService.getOrderByNumber(trimmedNum, trimmedPh);
      if (found) {
        setSearchedOrder(found);
      } else {
        setSearchedOrder(null);
        setError('No order found matching the provided reference number and phone number. Please verify your details.');
      }
    } catch (err: any) {
      setSearchedOrder(null);
      setError(err.message || 'No order found matching the provided reference number and phone number. Please verify your details.');
    } finally {
      setIsLoading(false);
    }
  }, [orderNumber, phone, isCustomerAuthenticated]);

  useEffect(() => {
    if (initialOrderNumber) {
      setOrderNumber(initialOrderNumber);
      const activePhone = phone || (typeof window !== 'undefined' ? window.localStorage?.getItem('camnex_last_checkout_phone') : '') || '';
      if (activePhone) {
        setPhone(activePhone);
        handleSearch(initialOrderNumber, activePhone);
      }
    }
  }, [initialOrderNumber, phone, handleSearch]);

  // Scroll to results when order is retrieved
  useEffect(() => {
    if (searchedOrder && resultsRef.current) {
      resultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [searchedOrder]);

  const handleCopyTrackingNumber = (text: string) => {
    if (!navigator.clipboard) return;
    navigator.clipboard.writeText(text);
    setCopiedTracking(true);
    setTimeout(() => setCopiedTracking(false), 2000);
  };

  const handleResetSearch = () => {
    setSearchedOrder(null);
    setOrderNumber('');
    setError('');
  };

  // Helper to determine courier tracking URL if not directly sent by API
  const getCourierUrl = (order: Order): string | null => {
    if (order.courierTrackingUrl) return order.courierTrackingUrl;
    if (!order.trackingNumber) return null;
    const c = (order.courierName || '').toLowerCase();
    if (c.includes('steadfast')) {
      return `https://steadfast.com.bd/t/${encodeURIComponent(order.trackingNumber.trim())}`;
    }
    if (c.includes('pathao')) {
      return `https://merchant.pathao.com/tracking?consignment_id=${encodeURIComponent(order.trackingNumber.trim())}`;
    }
    return null;
  };

  const getStatusBadgeVariant = (status: string) => {
    const s = (status || '').toLowerCase();
    if (s === 'delivered' || s === 'installed' || s === 'completed') return 'success';
    if (s === 'dispatched' || s === 'shipped') return 'orange';
    if (s === 'processing' || s === 'confirmed') return 'primary';
    if (s === 'cancelled' || s === 'refunded') return 'danger';
    return 'warning'; // pending
  };

  return (
    <div className="bg-[#F8FAFC] py-8 sm:py-12">
      <SEO
        title="Track Your Order | CamneX Bangladesh"
        description="Enter your order details to check the latest available status of your CamneX order."
        canonicalPath="/tracking"
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <Breadcrumbs
          items={[
            { label: 'Home', onClick: () => onNavigate('home') },
            { label: 'Track Order' }
          ]}
        />

        {/* Page Heading & Supporting Text */}
        <div className="my-6 text-center max-w-xl mx-auto">
          <h1 className="text-2xl sm:text-3xl font-black text-[#111827] font-heading mb-2">
            Track Your Order
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Enter your order details to check the latest available status of your CamneX order.
          </p>
        </div>

        {/* Logged-in Customer Banner & Quick Order Picker */}
        {isCustomerAuthenticated && currentCustomer && (
          <div data-testid="customer-auth-banner" className="mb-8 bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl p-5 sm:p-6 text-white shadow-sm border border-slate-700">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#F15A24]/20 border border-[#F15A24]/40 flex items-center justify-center text-[#F15A24]">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Customer Account</div>
                  <div className="text-base font-bold text-white">
                    {currentCustomer.name || 'Verified Customer'}
                  </div>
                  <div className="text-xs text-slate-300">
                    {currentCustomer.phone || currentCustomer.email}
                  </div>
                </div>
              </div>
              <div className="text-xs text-slate-400 font-medium">
                1-Click Tracking Active
              </div>
            </div>

            {/* Recent Orders List */}
            {isLoadingMyOrders ? (
              <div className="mt-4 pt-4 border-t border-slate-800 text-xs text-slate-400 flex items-center gap-2">
                <div className="w-3.5 h-3.5 border-2 border-[#F15A24] border-t-transparent rounded-full animate-spin"></div>
                <span>Loading your order history...</span>
              </div>
            ) : myOrders.length > 0 ? (
              <div className="mt-4 pt-4 border-t border-slate-800" data-testid="customer-recent-orders">
                <div className="text-xs font-bold text-slate-300 mb-2 uppercase tracking-wider">
                  Your Recent Orders ({myOrders.length}):
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {myOrders.slice(0, 4).map((ord) => (
                    <div 
                      key={ord.orderNumber}
                      className="bg-slate-800/80 hover:bg-slate-800 border border-slate-700 rounded-xl p-3 flex items-center justify-between gap-2 transition-all cursor-pointer group"
                      onClick={() => {
                        setOrderNumber(ord.orderNumber);
                        setPhone(currentCustomer.phone || '');
                        handleSearch(ord.orderNumber, currentCustomer.phone || '');
                      }}
                    >
                      <div className="min-w-0">
                        <div className="font-mono text-xs font-bold text-white group-hover:text-[#F15A24] transition-colors truncate">
                          {ord.orderNumber}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {new Date(ord.createdAt).toLocaleDateString()} • {ord.items?.length || 1} item(s)
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge size="sm" variant={getStatusBadgeVariant(ord.status)}>
                          {ord.status.toUpperCase()}
                        </Badge>
                        <button
                          type="button"
                          data-testid={`track-recent-order-${ord.orderNumber}`}
                          className="px-2.5 py-1 text-[11px] font-bold bg-[#F15A24] text-white rounded-lg hover:bg-[#D94D1C] transition-colors inline-flex items-center gap-1"
                        >
                          <span>Track</span>
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        )}

        {/* Order Lookup Form */}
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
                label={isCustomerAuthenticated ? "Mobile Phone (Auto-verified)" : "Mobile Phone Number *"}
                placeholder="e.g. 017XXXXXXXX"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                data-testid="track-order-input-phone"
                required={!isCustomerAuthenticated}
              />
            </div>

            {error && (
              <div data-testid="track-order-error">
                <Alert type="warning">{error}</Alert>
              </div>
            )}

            <Button 
              size="md" 
              type="submit" 
              isLoading={isLoading} 
              data-testid="track-order-submit-btn" 
              className="w-full bg-[#F15A24] hover:bg-[#D94D1C] text-white font-bold"
            >
              <Search className="w-4 h-4 mr-2" />
              <span>Track Order</span>
            </Button>
          </form>
        </div>

        {/* Informational Guidance Cards before search (keeps layout compact, clean, and purposeful) */}
        {!searchedOrder && (
          <div data-testid="track-order-guide" className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto mb-8">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-orange-100/80 text-[#F15A24] flex items-center justify-center mb-3">
                <Truck className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-[#111827] mb-1 font-heading">
                Logistics & Couriers
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Orders are dispatched nationwide via courier partners including Steadfast and Pathao. Consignment tracking details become available once your parcel is dispatched and recorded.
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center mb-3">
                <Shield className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-[#111827] mb-1 font-heading">
                Two-Factor Security
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                To protect customer data privacy, order lookups require matching both your order reference code and the billing mobile phone number.
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-3">
                <Phone className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-[#111827] mb-1 font-heading">
                Dispatch Assistance
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Need help locating your order? Contact our Dhaka dispatch coordination desk directly at <strong className="text-slate-800">+880 1540-535150</strong>.
              </p>
            </div>
          </div>
        )}

        {/* Order Details & Results Display */}
        {searchedOrder && (
          <div 
            ref={resultsRef} 
            data-testid="track-order-results" 
            className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-8 animate-fade-in"
          >
            
            {/* Header Status & Search Another action */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-200 gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-slate-500">Order Reference:</span>
                  <button
                    type="button"
                    onClick={() => handleCopyTrackingNumber(searchedOrder.orderNumber)}
                    className="text-slate-400 hover:text-slate-600 transition-colors"
                    title="Copy Order Reference"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="text-xl sm:text-2xl font-black text-[#111827] font-heading mt-0.5">
                  {searchedOrder.orderNumber}
                </div>
                <div className="text-xs text-slate-400 mt-0.5">
                  Placed on {new Date(searchedOrder.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </div>
              </div>

              <div className="flex items-center sm:items-end flex-row sm:flex-col justify-between sm:justify-center gap-3">
                <div className="text-left sm:text-right">
                  <span className="text-xs text-slate-500 block mb-1">Current Status</span>
                  <Badge 
                    data-testid="track-order-status-badge" 
                    variant={getStatusBadgeVariant(searchedOrder.status)}
                    className="text-xs px-3 py-1 font-bold"
                  >
                    {searchedOrder.status.toUpperCase()}
                  </Badge>
                </div>
                <button
                  type="button"
                  data-testid="track-order-reset-btn"
                  onClick={handleResetSearch}
                  className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-[#F15A24] font-medium transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Search Another</span>
                </button>
              </div>
            </div>

            {/* Courier & Shipment Status Card */}
            <div data-testid="track-order-courier-card" className="rounded-2xl border overflow-hidden">
              {searchedOrder.trackingNumber ? (
                // Shipped / Consignment Assigned
                <div className="bg-gradient-to-r from-orange-50/70 via-white to-slate-50 p-5 sm:p-6 border-orange-200">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-[#F15A24]/10 text-[#F15A24] border border-[#F15A24]/20 flex items-center justify-center shrink-0 mt-0.5">
                        <Truck className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-base text-[#111827]">
                            {searchedOrder.courierName || 'Courier Partner'}
                          </span>
                          {searchedOrder.courierName?.toLowerCase().includes('steadfast') && (
                            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-md">
                              Steadfast Express
                            </span>
                          )}
                          {searchedOrder.courierName?.toLowerCase().includes('pathao') && (
                            <span className="px-2 py-0.5 bg-rose-100 text-rose-800 text-[10px] font-bold rounded-md">
                              Pathao Courier
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-slate-500 font-mono">Consignment No:</span>
                          <span className="font-mono text-xs font-bold text-[#111827] bg-white px-2 py-0.5 rounded border border-slate-200">
                            {searchedOrder.trackingNumber}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopyTrackingNumber(searchedOrder.trackingNumber || '')}
                            className="text-slate-400 hover:text-slate-600 transition-colors p-1"
                            title="Copy Tracking Number"
                          >
                            {copiedTracking ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                        {searchedOrder.estimatedDeliveryDate && (
                          <div className="flex items-center gap-1.5 text-xs text-slate-600 mt-2">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            <span>Estimated Delivery: <strong className="text-slate-800">{searchedOrder.estimatedDeliveryDate}</strong></span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Working Courier External Link */}
                    {getCourierUrl(searchedOrder) && (
                      <div className="sm:self-center">
                        <a
                          href={getCourierUrl(searchedOrder)!}
                          target="_blank"
                          rel="noopener noreferrer"
                          data-testid="track-order-courier-link"
                          className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-4 py-2.5 bg-[#111827] hover:bg-black text-white font-bold text-xs rounded-xl shadow-sm transition-all hover:translate-y-[-1px]"
                        >
                          <span>Track on {searchedOrder.courierName?.toLowerCase().includes('steadfast') ? 'Steadfast' : searchedOrder.courierName?.toLowerCase().includes('pathao') ? 'Pathao' : 'Courier'}</span>
                          <ExternalLink className="w-3.5 h-3.5 text-[#F15A24]" />
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                // Not yet dispatched / Preparation Stage
                <div className="bg-slate-50 p-5 sm:p-6 border-slate-200">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                      <Clock className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-[#111827]">
                        Shipment tracking will be available once your order is dispatched
                      </h4>
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                        Shipment preparing for dispatch. Your security equipment is currently being verified and prepared at our Dhaka technical lab. 
                        Courier tracking details and consignment reference will be recorded here once your order is dispatched to our courier partner.
                      </p>
                      <div className="mt-3 flex flex-wrap gap-4 text-xs text-slate-500">
                        <div>
                          <span className="font-semibold text-slate-700">Delivery & Fulfillment: </span>
                          <span>{searchedOrder.deliveryInfo?.method || searchedOrder.deliveryMethod || 'Standard Courier / Installation'}</span>
                        </div>
                        <div>
                          <span className="font-semibold text-slate-700">Destination: </span>
                          <span>{searchedOrder.deliveryInfo?.district || searchedOrder.deliveryCity || 'Dhaka'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Timeline Events */}
            <div data-testid="track-order-timeline">
              <h3 className="text-sm font-bold text-[#111827] uppercase tracking-wider mb-4 font-heading flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#F15A24]" />
                <span>Status Timeline</span>
              </h3>
              <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                {(searchedOrder.timeline || []).map((evt, idx) => (
                  <div key={idx} className="relative">
                    <div className="absolute -left-6 top-1 w-4 h-4 rounded-full bg-[#F15A24] border-2 border-white ring-2 ring-orange-500/20" />
                    <div>
                      <div className="text-sm font-bold text-[#111827]">
                        {evt.title || (typeof evt.status === 'string' ? evt.status.replace(/_/g, ' ').toUpperCase() : 'Status Update')}
                      </div>
                      {evt.note && <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{evt.note}</p>}
                      <div className="text-[10px] text-slate-400 mt-1 font-mono">
                        {new Date(evt.timestamp).toLocaleString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Items Summary */}
            {Array.isArray(searchedOrder.items) && searchedOrder.items.length > 0 && (
              <div className="pt-6 border-t border-slate-200" data-testid="track-order-items">
                <h3 className="text-sm font-bold text-[#111827] uppercase tracking-wider mb-4 font-heading flex items-center gap-2">
                  <Package className="w-4 h-4 text-[#F15A24]" />
                  <span>Hardware Ordered ({searchedOrder.items.length} item{searchedOrder.items.length > 1 ? 's' : ''})</span>
                </h3>
                <div className="space-y-3">
                  {searchedOrder.items.map((item, idx) => (
                    <div key={idx} className="p-3.5 bg-slate-50 hover:bg-slate-100/80 rounded-xl flex items-center justify-between gap-4 text-xs transition-colors">
                      <div className="flex items-center gap-3 min-w-0">
                        {item.image ? (
                          <img 
                            src={item.image} 
                            alt={item.name} 
                            className="w-11 h-11 object-contain rounded-lg bg-white p-1 border border-slate-200 shrink-0" 
                            onError={(e) => {
                              // Fallback on broken image
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="w-11 h-11 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-400 shrink-0">
                            <Package className="w-5 h-5 text-slate-400" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="font-bold text-[#111827] truncate">{item.name}</div>
                          {item.model && <div className="text-[11px] text-slate-500 font-mono mt-0.5">Model: {item.model}</div>}
                          {item.packageDetails && (
                            <span className="text-[10px] text-orange-600 font-bold block mt-0.5">{item.packageDetails}</span>
                          )}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="font-bold text-[#111827]">Qty: {item.quantity}</div>
                        {(item.totalPrice != null || item.unitPrice != null) && (
                          <div className="text-slate-600 font-medium mt-0.5">
                            ৳{((item.totalPrice != null ? item.totalPrice : (item.unitPrice || 0) * item.quantity)).toLocaleString()}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Financial Summary */}
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
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Payment Status:</span>
                    <span className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                      searchedOrder.paymentStatus === 'paid' 
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}>
                      {searchedOrder.paymentStatus === 'paid' ? 'Paid / Verified' : 'Pending Verification Upon Delivery'}
                    </span>
                  </div>
                  {searchedOrder.deliveryCharge != null && searchedOrder.deliveryCharge > 0 && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Delivery Fee:</span>
                      <span className="font-semibold text-slate-800">৳{searchedOrder.deliveryCharge.toLocaleString()}</span>
                    </div>
                  )}
                  {searchedOrder.total != null && (
                    <div className="flex justify-between items-baseline pt-3 border-t border-slate-200 text-sm font-bold">
                      <span className="text-slate-900">Total Amount:</span>
                      <span className="text-xl text-[#F15A24] font-black font-heading">
                        ৳{searchedOrder.total.toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Need Assistance Action Card */}
            <div data-testid="track-order-support-card" className="pt-6 border-t border-slate-200 bg-orange-50/50 p-5 rounded-2xl border border-orange-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h4 className="font-bold text-sm text-[#111827]">Questions regarding your order or dispatch?</h4>
                <p className="text-xs text-slate-600 mt-0.5">
                  Our Dhaka dispatch desk and technical coordinators are available to assist you.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                <Button
                  size="sm"
                  variant="outline"
                  data-testid="track-order-contact-btn"
                  onClick={() => onNavigate('contact')}
                  className="w-full sm:w-auto"
                >
                  <HelpCircle className="w-3.5 h-3.5 mr-1 text-slate-500" />
                  <span>Contact Support</span>
                </Button>
                <a
                  href="https://wa.me/8801540535150"
                  target="_blank"
                  rel="noopener noreferrer"
                  data-testid="track-order-whatsapp-btn"
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-600 text-white font-bold text-xs rounded-xl hover:bg-emerald-700 transition-colors w-full sm:w-auto"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>WhatsApp Support</span>
                </a>
                <a
                  href="tel:+8801540535150"
                  data-testid="track-order-call-btn"
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-[#F15A24] text-white font-bold text-xs rounded-xl hover:bg-[#D94D1C] transition-colors w-full sm:w-auto"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>Call Dispatch Desk</span>
                </a>
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};
