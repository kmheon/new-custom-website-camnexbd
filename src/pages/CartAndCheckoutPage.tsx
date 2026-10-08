import React, { useState, useEffect } from 'react';
import { ShoppingBag, Trash2, ArrowRight, CheckCircle2, ShieldCheck, Truck, Wrench, CreditCard, Smartphone, Building2, Check, Banknote, AlertCircle } from 'lucide-react';
import { SEO } from '../components/common/SEO';
import { Breadcrumbs, Button, Input, Select, Badge, Card, Alert, Modal } from '../components/common/UI';
import { useCartStore } from '../store';
import { cartService, orderService, cmsService } from '../services';
import { DeliveryMethod, PaymentMethod, Order, PaymentDetails, SiteSettings } from '../types';

interface CartAndCheckoutPageProps {
  onNavigate: (route: string, param?: string) => void;
  initialStep?: 'cart' | 'checkout';
}

export const CartAndCheckoutPage: React.FC<CartAndCheckoutPageProps> = ({
  onNavigate,
  initialStep = 'cart'
}) => {
  const { items, updateQuantity, removeItem, clearCart } = useCartStore();
  const [step, setStep] = useState<'cart' | 'checkout'>(initialStep);
  
  // Checkout Form State
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryCity, setDeliveryCity] = useState('Dhaka');
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>('inside_dhaka');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cod');
  const [mfsSenderNumber, setMfsSenderNumber] = useState('');
  const [mfsTrxId, setMfsTrxId] = useState('');
  const [bankDepositRef, setBankDepositRef] = useState('');
  const [selectedBank, setSelectedBank] = useState('City Bank Ltd');
  const [requestInstallation, setRequestInstallation] = useState(false);
  const [preferredDate, setPreferredDate] = useState('');
  const [orderNotes, setOrderNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdOrder, setCreatedOrder] = useState<Order | null>(null);
  const [formError, setFormError] = useState('');
  const [siteSettings, setSiteSettings] = useState<SiteSettings | null>(null);

  useEffect(() => {
    cmsService.getSiteSettings().then(setSiteSettings).catch(() => {});
  }, []);

  const hasCod = Boolean(siteSettings?.enableCashOnDelivery);
  const hasBkash = Boolean(siteSettings?.bkashMerchantNumber && siteSettings.bkashMerchantNumber.trim().length > 0);
  const hasNagad = Boolean(siteSettings?.nagadMerchantNumber && siteSettings.nagadMerchantNumber.trim().length > 0);
  const hasBank = Boolean(siteSettings?.bankDetails && siteSettings.bankDetails.bankName && siteSettings.bankDetails.accountNumber);
  const hasAnyPaymentMethod = hasCod || hasBkash || hasNagad || hasBank;

  useEffect(() => {
    if (!hasAnyPaymentMethod) {
      return;
    }
    const isCurrentValid =
      (paymentMethod === 'cod' && hasCod) ||
      (paymentMethod === 'bkash_manual' && hasBkash) ||
      (paymentMethod === 'nagad_manual' && hasNagad) ||
      (paymentMethod === 'bank_transfer' && hasBank);

    if (!isCurrentValid) {
      if (hasCod) setPaymentMethod('cod');
      else if (hasBkash) setPaymentMethod('bkash_manual');
      else if (hasNagad) setPaymentMethod('nagad_manual');
      else if (hasBank) setPaymentMethod('bank_transfer');
    }
  }, [hasCod, hasBkash, hasNagad, hasBank, hasAnyPaymentMethod, paymentMethod]);

  // Summary computation
  const [summary, setSummary] = useState({
    subtotal: 0,
    deliveryFee: 0,
    installationFee: 0,
    tax: 0,
    total: 0
  });

  useEffect(() => {
    const subtotal = items.reduce((sum, item) => sum + (item.pricePerUnit * item.quantity), 0);
    const deliveryFee = deliveryMethod === 'store_pickup'
      ? 0
      : deliveryMethod === 'outside_dhaka'
      ? (siteSettings?.deliveryFeeOutsideDhaka != null && siteSettings.deliveryFeeOutsideDhaka > 0 ? siteSettings.deliveryFeeOutsideDhaka : 0)
      : (siteSettings?.deliveryFeeInsideDhaka != null && siteSettings.deliveryFeeInsideDhaka > 0 ? siteSettings.deliveryFeeInsideDhaka : 0);
    const totalQty = items.reduce((sum, i) => sum + i.quantity, 0);
    const installationFee = requestInstallation && siteSettings?.installationBaseFee != null && siteSettings.installationBaseFee > 0
      ? siteSettings.installationBaseFee * totalQty
      : 0;
    const tax = 0;
    const total = subtotal + deliveryFee + installationFee + tax;
    setSummary({ subtotal, deliveryFee, installationFee, tax, total });
  }, [items, deliveryMethod, requestInstallation, siteSettings]);

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasAnyPaymentMethod) {
      setFormError('Payment methods are not yet configured on this store. Please contact our support desk directly.');
      return;
    }

    if (!customerName.trim() || !customerPhone.trim() || !deliveryAddress.trim()) {
      setFormError('Please enter your full name, phone number, and delivery address.');
      return;
    }

    if (paymentMethod === 'cod' && !hasCod) {
      setFormError('Cash on Delivery is currently disabled.');
      return;
    }

    if (paymentMethod === 'bkash_manual' && (!mfsSenderNumber.trim() || !mfsTrxId.trim())) {
      setFormError('Please enter your bKash sender number and the 10-character Transaction ID (TrxID).');
      return;
    }

    if (paymentMethod === 'nagad_manual' && (!mfsSenderNumber.trim() || !mfsTrxId.trim())) {
      setFormError('Please enter your Nagad sender number and the Transaction ID (TrxID).');
      return;
    }

    if (paymentMethod === 'bank_transfer' && !bankDepositRef.trim()) {
      setFormError('Please enter your bank transfer reference or deposit slip number.');
      return;
    }

    setFormError('');
    setIsSubmitting(true);

    try {
      const isManualMfsOrBank = paymentMethod === 'bkash_manual' || paymentMethod === 'nagad_manual' || paymentMethod === 'bank_transfer';
      const paymentDetails: PaymentDetails = {
        method: paymentMethod,
        senderNumber: (paymentMethod === 'bkash_manual' || paymentMethod === 'nagad_manual') ? mfsSenderNumber.trim() : undefined,
        transactionId: (paymentMethod === 'bkash_manual' || paymentMethod === 'nagad_manual') ? mfsTrxId.trim().toUpperCase() : undefined,
        bankName: paymentMethod === 'bank_transfer' ? (siteSettings?.bankDetails?.bankName || selectedBank) : undefined,
        depositRef: paymentMethod === 'bank_transfer' ? bankDepositRef.trim() : undefined
      };

      const order = await orderService.createOrder({
        customerName,
        customerPhone,
        customerEmail,
        deliveryAddress,
        deliveryCity,
        deliveryMethod,
        deliveryFee: summary.deliveryFee,
        installation: {
          requested: requestInstallation,
          preferredDate,
          estimatedFee: summary.installationFee,
          siteNotes: orderNotes
        },
        paymentMethod,
        paymentStatus: isManualMfsOrBank ? 'unverified' : 'unpaid',
        paymentDetails,
        items: items.map(i => ({
          productId: i.productId,
          name: i.product.name,
          model: i.product.modelNumber,
          quantity: i.quantity,
          unitPrice: i.pricePerUnit,
          totalPrice: i.pricePerUnit * i.quantity,
          image: i.product.primaryImage,
          packageDetails: i.packageConfig ? `${i.packageConfig.cameraCount} Cams (${i.packageConfig.formFactor})` : undefined
        })),
        subtotal: summary.subtotal,
        tax: summary.tax,
        total: summary.total,
        notes: orderNotes
      });

      setCreatedOrder(order);
      await clearCart();
    } catch (err: any) {
      setFormError(err.message || 'Failed to place order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (createdOrder) {
    return (
      <div className="bg-[#F8FAFC] min-h-screen py-16">
        <SEO title="Order Confirmed | CamneX Bangladesh" description="Your order has been placed successfully." />
        <div className="max-w-2xl mx-auto px-4 text-center">
          <div className="bg-white p-8 sm:p-10 rounded-2xl border border-slate-200 shadow-xl space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <Badge variant="success">Order Placed Successfully</Badge>

            <h1 className="text-2xl sm:text-3xl font-black text-[#111827] font-heading">
              Thank You, {createdOrder.customerName}!
            </h1>

            <p className="text-sm text-slate-600">
              Your order has been recorded in our dispatch queue. Our Dhaka engineering desk will contact you on <strong className="text-[#111827]">{createdOrder.customerPhone}</strong> to confirm scheduling.
            </p>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-left text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Order Number:</span>
                <span className="font-mono font-bold text-[#F15A24] text-sm">{createdOrder.orderNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Total Amount:</span>
                <span className="font-bold text-[#111827]">৳{createdOrder.total.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Payment Method:</span>
                <span className="font-bold text-[#111827]">
                  {createdOrder.paymentMethod === 'cod' ? 'Cash on Delivery (COD)' :
                   createdOrder.paymentMethod === 'bkash_manual' ? 'bKash Send Money' :
                   createdOrder.paymentMethod === 'nagad_manual' ? 'Nagad' :
                   createdOrder.paymentMethod === 'bank_transfer' ? `Bank Transfer (${createdOrder.paymentDetails?.bankName || 'Corporate'})` :
                   'Online Payment Gateway'}
                </span>
              </div>
              {createdOrder.paymentDetails?.transactionId && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Transaction ID (TrxID):</span>
                  <span className="font-mono font-bold text-emerald-600">{createdOrder.paymentDetails.transactionId}</span>
                </div>
              )}
              {createdOrder.paymentDetails?.senderNumber && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Sender Mobile:</span>
                  <span className="font-mono text-slate-800">{createdOrder.paymentDetails.senderNumber}</span>
                </div>
              )}
              {createdOrder.paymentDetails?.depositRef && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Deposit Slip / Ref:</span>
                  <span className="font-mono font-bold text-emerald-600">{createdOrder.paymentDetails.depositRef}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-slate-500">Payment Status:</span>
                <span className={`font-bold ${createdOrder.paymentStatus === 'paid' ? 'text-emerald-600' : 'text-amber-600'}`}>
                  {createdOrder.paymentStatus === 'paid' ? 'Verified / Paid' : 'Verification Pending on Dispatch/Audit'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Delivery Address:</span>
                <span className="font-medium text-slate-700">{createdOrder.deliveryAddress}</span>
              </div>
            </div>

            {createdOrder.paymentStatus === 'unverified' && (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-left text-xs text-amber-800 space-y-1">
                <div className="font-bold text-amber-900 flex items-center gap-1.5">
                  <span>⚠️ Payment Unverified (Pending Accounts Audit)</span>
                </div>
                <p>
                  Your transaction details (TrxID / Bank Reference) have been logged with status <strong>unverified</strong>. Our accounts team in Dhaka will verify transaction receipt on official ledgers before dispatching hardware.
                </p>
                <p className="text-[11px] text-amber-700 pt-1">
                  Tip: You can send a screenshot of your payment to WhatsApp at <strong className="font-mono text-amber-900">+880 1540-535150</strong> to expedite dispatch.
                </p>
              </div>
            )}

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button size="md" onClick={() => onNavigate('tracking', createdOrder.orderNumber)}>
                Track Order Status
              </Button>
              <Button variant="outline" size="md" onClick={() => onNavigate('catalog')}>
                Continue Shopping
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#F8FAFC] min-h-screen py-6 sm:py-10">
      <SEO
        title={step === 'checkout' ? "Checkout | CamneX Bangladesh" : "Shopping Cart | CamneX Bangladesh"}
        description="Review your hardware cart and complete single-page checkout."
        canonicalPath="/cart"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <Breadcrumbs
          items={[
            { label: 'Home', onClick: () => onNavigate('home') },
            { label: 'Shopping Cart', onClick: () => setStep('cart') },
            ...(step === 'checkout' ? [{ label: 'Checkout' }] : [])
          ]}
        />

        <div className="my-6">
          <h1 className="text-2xl sm:text-3xl font-black text-[#111827] font-heading">
            {step === 'checkout' ? 'Single-Page Checkout' : 'Review Shopping Cart'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {items.length} hardware {items.length === 1 ? 'item' : 'items'} in your cart
          </p>
        </div>

        {items.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center space-y-4 my-8">
            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
              <ShoppingBag className="w-8 h-8" />
            </div>
            <h2 className="text-lg font-bold text-[#111827]">Your cart is currently empty</h2>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Browse our CCTV cameras, Turbo HD DVRs, and package bundles to add hardware to your order.
            </p>
            <Button size="md" onClick={() => onNavigate('catalog')}>
              Explore Catalog
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 my-6">
            
            {/* Left Column: Cart Items OR Checkout Form */}
            <div className="lg:col-span-8 space-y-6">
              
              {step === 'cart' ? (
                /* Cart Items List */
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden divide-y divide-slate-100">
                  {items.map((item) => (
                    <div key={item.id} className="p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      
                      <div className="flex items-center gap-4">
                        <img
                          src={item.product.primaryImage}
                          alt={item.product.name}
                          className="w-16 h-16 object-cover rounded-xl bg-slate-100 flex-shrink-0"
                        />
                        <div>
                          <div className="text-[11px] font-mono text-slate-400">{item.product.modelNumber}</div>
                          <h3
                            onClick={() => onNavigate('product', item.productId)}
                            className="font-bold text-sm text-[#111827] hover:text-[#F15A24] cursor-pointer transition-colors font-heading"
                          >
                            {item.product.name}
                          </h3>
                          {item.packageConfig && (
                            <span className="text-xs text-orange-600 font-semibold block mt-0.5">
                              Turnkey Bundle: {item.packageConfig.cameraCount} Cams · {item.packageConfig.formFactor.toUpperCase()}
                            </span>
                          )}
                          <div className="text-xs font-bold text-[#F15A24] mt-1">
                            ৳{item.pricePerUnit.toLocaleString()}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto">
                        {/* Quantity Stepper */}
                        <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="px-2.5 py-1 bg-slate-100 text-xs font-bold"
                          >
                            -
                          </button>
                          <span className="px-3 py-1 text-xs font-bold min-w-6 text-center">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="px-2.5 py-1 bg-slate-100 text-xs font-bold"
                          >
                            +
                          </button>
                        </div>

                        <div className="text-right">
                          <div className="text-sm font-black text-[#111827] font-heading">
                            ৳{(item.pricePerUnit * item.quantity).toLocaleString()}
                          </div>
                        </div>

                        <button
                          onClick={() => removeItem(item.id)}
                          className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg transition-colors"
                          aria-label="Remove item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                    </div>
                  ))}

                  <div className="p-4 bg-slate-50 flex items-center justify-between">
                    <button
                      onClick={() => onNavigate('catalog')}
                      className="text-xs font-bold text-[#F15A24] hover:underline"
                    >
                      ← Continue Shopping
                    </button>
                    <button
                      onClick={() => clearCart()}
                      className="text-xs text-slate-500 hover:text-red-600 font-medium"
                    >
                      Clear Cart
                    </button>
                  </div>
                </div>
              ) : (
                /* Checkout Form */
                <form onSubmit={handlePlaceOrder} className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
                  
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <h2 className="font-bold text-base text-[#111827] font-heading">
                      1. Contact & Delivery Information
                    </h2>
                    <button
                      type="button"
                      onClick={() => setStep('cart')}
                      className="text-xs font-bold text-[#F15A24] hover:underline"
                    >
                      Edit Cart
                    </button>
                  </div>

                  {formError && (
                    <Alert type="danger">{formError}</Alert>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label="Full Name *"
                      required
                      placeholder="e.g. Tanvir Ahmed"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                    />
                    <Input
                      label="Mobile Phone Number *"
                      required
                      placeholder="e.g. 01712-XXXXXX"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                    />
                    <Input
                      label="Email Address (Optional)"
                      type="email"
                      placeholder="e.g. name@company.com"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                    />
                    <Input
                      label="City / District *"
                      value={deliveryCity}
                      onChange={(e) => setDeliveryCity(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                      Street Address & Apartment / Suite *
                    </label>
                    <textarea
                      rows={2}
                      required
                      placeholder="e.g. House 14, Road 5, Block C, Banani, Dhaka"
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                      className="w-full bg-white border border-slate-300 text-sm text-slate-900 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-[#F15A24]"
                    />
                  </div>

                  {/* Delivery Selection */}
                  <div className="pt-4 border-t border-slate-100 space-y-3">
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                      2. Delivery Method
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {[
                        {
                          id: 'inside_dhaka',
                          label: 'Inside Dhaka',
                          fee: siteSettings?.deliveryFeeInsideDhaka != null && siteSettings.deliveryFeeInsideDhaka > 0 ? `৳${siteSettings.deliveryFeeInsideDhaka}` : 'To be confirmed',
                          note: '24–48 hours delivery'
                        },
                        {
                          id: 'outside_dhaka',
                          label: 'Outside Dhaka',
                          fee: siteSettings?.deliveryFeeOutsideDhaka != null && siteSettings.deliveryFeeOutsideDhaka > 0 ? `৳${siteSettings.deliveryFeeOutsideDhaka}` : 'Courier at actual',
                          note: 'Courier service'
                        },
                        {
                          id: 'store_pickup',
                          label: 'Store Pickup',
                          fee: 'Free',
                          note: 'Chandrima Model Town'
                        }
                      ].map((d) => (
                        <div
                          key={d.id}
                          onClick={() => setDeliveryMethod(d.id as any)}
                          className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                            deliveryMethod === d.id
                              ? 'border-[#F15A24] bg-orange-50/30 ring-1 ring-[#F15A24]'
                              : 'border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <div className="flex justify-between items-center text-xs font-bold mb-1">
                            <span>{d.label}</span>
                            <span className="text-[#F15A24]">{d.fee}</span>
                          </div>
                          <span className="text-[11px] text-slate-500">{d.note}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Installation Option */}
                  <div className="pt-4 border-t border-slate-100 space-y-3">
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                      3. Professional Installation
                    </span>
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-start gap-3">
                      <input
                        type="checkbox"
                        id="check-install"
                        checked={requestInstallation}
                        onChange={(e) => setRequestInstallation(e.target.checked)}
                        className="w-4 h-4 text-[#F15A24] rounded mt-0.5"
                      />
                      <label htmlFor="check-install" className="text-xs cursor-pointer">
                        <strong className="text-[#111827] block">
                          Include On-Site Installation {siteSettings?.installationBaseFee != null && siteSettings.installationBaseFee > 0 ? `(+৳${siteSettings.installationBaseFee} / device)` : '(Quoted on site survey)'}
                        </strong>
                        <span className="text-slate-500">Concealed cabling, testing, and Hik-Connect smartphone setup in Dhaka.</span>
                      </label>
                    </div>

                    {requestInstallation && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                        <Input
                          label="Preferred Installation Date"
                          type="date"
                          value={preferredDate}
                          onChange={(e) => setPreferredDate(e.target.value)}
                        />
                        <Input
                          label="Site Instructions"
                          placeholder="e.g. Duplex residence, 2nd floor"
                          value={orderNotes}
                          onChange={(e) => setOrderNotes(e.target.value)}
                        />
                      </div>
                    )}
                  </div>

                  {/* Payment Selection */}
                  <div className="pt-4 border-t border-slate-100 space-y-3">
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                      4. Payment Method
                    </span>

                    {!hasAnyPaymentMethod && (
                      <div className="p-4 bg-amber-50 border border-amber-300 rounded-2xl text-amber-900 text-xs flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <div className="font-bold text-sm text-amber-950">Payments Not Configured</div>
                          <p className="mt-1 text-amber-800 leading-relaxed">
                            No payment methods are currently active or configured on this store. Checkout is temporarily unavailable. Please contact our Dhaka office directly via phone or WhatsApp to request an official quotation or coordinate hardware dispatch.
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* COD Option (Only if enabled by admin) */}
                      {hasCod && (
                        <div
                          onClick={() => setPaymentMethod('cod')}
                          className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                            paymentMethod === 'cod'
                              ? 'border-[#F15A24] bg-orange-50/20 ring-1 ring-[#F15A24]'
                              : 'border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <div className="w-8 h-8 rounded-lg bg-[#111827] text-white flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5">
                            COD
                          </div>
                          <div className="flex-1">
                            <div className="text-xs font-bold text-[#111827] flex items-center justify-between">
                              <span>Cash on Delivery</span>
                              {paymentMethod === 'cod' && <span className="text-[#F15A24] text-[10px] font-bold">Selected</span>}
                            </div>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              Pay in cash upon inspection and delivery at your premises.
                            </p>
                          </div>
                        </div>
                      )}

                      {/* bKash Option (Only if configured by admin) */}
                      {hasBkash && (
                        <div
                          onClick={() => setPaymentMethod('bkash_manual')}
                          className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                            paymentMethod === 'bkash_manual'
                              ? 'border-[#E2136E] bg-pink-50/30 ring-1 ring-[#E2136E]'
                              : 'border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <div className="w-8 h-8 rounded-lg bg-[#E2136E] text-white flex items-center justify-center font-extrabold text-[11px] flex-shrink-0 mt-0.5">
                            bK
                          </div>
                          <div className="flex-1">
                            <div className="text-xs font-bold text-[#111827] flex items-center justify-between">
                              <span>bKash (Send Money)</span>
                              {paymentMethod === 'bkash_manual' && <span className="text-[#E2136E] text-[10px] font-bold">Selected</span>}
                            </div>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              Transfer via bKash App or USSD to {siteSettings?.bkashMerchantNumber}.
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Nagad Option (Only if configured by admin) */}
                      {hasNagad && (
                        <div
                          onClick={() => setPaymentMethod('nagad_manual')}
                          className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                            paymentMethod === 'nagad_manual'
                              ? 'border-[#F7941D] bg-amber-50/30 ring-1 ring-[#F7941D]'
                              : 'border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <div className="w-8 h-8 rounded-lg bg-[#F7941D] text-white flex items-center justify-center font-extrabold text-[11px] flex-shrink-0 mt-0.5">
                            Nagad
                          </div>
                          <div className="flex-1">
                            <div className="text-xs font-bold text-[#111827] flex items-center justify-between">
                              <span>Nagad Payment</span>
                              {paymentMethod === 'nagad_manual' && <span className="text-[#F7941D] text-[10px] font-bold">Selected</span>}
                            </div>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              Send payment to Nagad Account {siteSettings?.nagadMerchantNumber}.
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Corporate Bank Transfer (Only if configured by admin) */}
                      {hasBank && (
                        <div
                          onClick={() => setPaymentMethod('bank_transfer')}
                          className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                            paymentMethod === 'bank_transfer'
                              ? 'border-[#111827] bg-slate-100 ring-1 ring-[#111827]'
                              : 'border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <div className="w-8 h-8 rounded-lg bg-slate-700 text-white flex items-center justify-center flex-shrink-0 mt-0.5">
                            <Building2 className="w-4 h-4" />
                          </div>
                          <div className="flex-1">
                            <div className="text-xs font-bold text-[#111827] flex items-center justify-between">
                              <span>Bank Transfer (BEFTN/NPSB)</span>
                              {paymentMethod === 'bank_transfer' && <span className="text-slate-800 text-[10px] font-bold">Selected</span>}
                            </div>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              Direct corporate bank transfer with deposit slip.
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Online Card Gateway (Disabled - Offline until production merchant setup) */}
                      <div
                        className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 opacity-60 cursor-not-allowed flex items-start gap-3 select-none"
                      >
                        <div className="w-8 h-8 rounded-lg bg-slate-400 text-white flex items-center justify-center flex-shrink-0 mt-0.5">
                          <CreditCard className="w-4 h-4" />
                        </div>
                        <div className="flex-1">
                          <div className="text-xs font-bold text-slate-600 flex items-center justify-between">
                            <span>Debit / Credit Card & Gateway</span>
                            <span className="text-slate-500 text-[10px] uppercase font-semibold">Disabled</span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            Online card gateway integration pending official merchant agreement. Currently offline.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* MFS Input Fields (bKash / Nagad) */}
                    {(paymentMethod === 'bkash_manual' || paymentMethod === 'nagad_manual') && (
                      <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 mt-3 animate-fade-in">
                        <div className="flex items-start gap-2.5 text-xs text-slate-700">
                          <Smartphone className="w-4 h-4 text-[#F15A24] flex-shrink-0 mt-0.5" />
                          <div>
                            <strong>Instructions:</strong> Please send <strong className="text-[#F15A24]">৳{summary.total.toLocaleString()}</strong> to CamneX official account <strong className="font-mono bg-white px-1.5 py-0.5 rounded border border-slate-300">
                              {paymentMethod === 'bkash_manual' ? siteSettings?.bkashMerchantNumber : siteSettings?.nagadMerchantNumber}
                            </strong> ({paymentMethod === 'bkash_manual' ? 'bKash' : 'Nagad'}), then enter your sender number and 10-character TrxID below:
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <Input
                            label="Your Sender Phone Number *"
                            placeholder="e.g. 01712-XXXXXX"
                            value={mfsSenderNumber}
                            onChange={(e) => setMfsSenderNumber(e.target.value)}
                            required
                          />
                          <Input
                            label="Transaction ID (TrxID) *"
                            placeholder="e.g. BL8A3X9K72"
                            value={mfsTrxId}
                            onChange={(e) => setMfsTrxId(e.target.value)}
                            required
                          />
                        </div>
                      </div>
                    )}

                    {/* Bank Transfer Details */}
                    {paymentMethod === 'bank_transfer' && siteSettings?.bankDetails && (
                      <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 mt-3 animate-fade-in text-xs">
                        <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-1">
                          <div className="font-bold text-[#111827]">CamneX Bangladesh Corporate Account</div>
                          <div className="text-slate-600">Bank: <strong>{siteSettings.bankDetails.bankName}</strong></div>
                          <div className="text-slate-600">Account Name: <strong>{siteSettings.bankDetails.accountName}</strong></div>
                          <div className="text-slate-600">Account No: <strong className="font-mono text-slate-900">{siteSettings.bankDetails.accountNumber}</strong></div>
                          {siteSettings.bankDetails.branch && (
                            <div className="text-slate-600">Branch: <strong>{siteSettings.bankDetails.branch}</strong></div>
                          )}
                          {siteSettings.bankDetails.routingNumber && (
                            <div className="text-slate-600">Routing No: <strong className="font-mono text-slate-900">{siteSettings.bankDetails.routingNumber}</strong></div>
                          )}
                        </div>

                        <div>
                          <Input
                            label="Deposit Reference / Slip No *"
                            placeholder="e.g. DEP-94821 or Online Transfer Ref"
                            value={bankDepositRef}
                            onChange={(e) => setBankDepositRef(e.target.value)}
                            required
                          />
                        </div>
                      </div>
                    )}

                  </div>

                  <Button
                    size="lg"
                    type="submit"
                    isLoading={isSubmitting}
                    disabled={isSubmitting || !hasAnyPaymentMethod}
                    className="w-full mt-4"
                  >
                    {!hasAnyPaymentMethod
                      ? "Checkout Unavailable (Payments Not Configured)"
                      : `Confirm & Place Order (৳${summary.total.toLocaleString()})`}
                  </Button>

                </form>
              )}

            </div>

            {/* Right Column: Order Summary (4-col) */}
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
                <h3 className="font-bold text-base text-[#111827] font-heading pb-3 border-b border-slate-100">
                  Order Summary
                </h3>

                <div className="space-y-3 text-xs sm:text-sm">
                  <div className="flex justify-between text-slate-600">
                    <span>Hardware Subtotal:</span>
                    <span className="font-bold text-[#111827]">৳{summary.subtotal.toLocaleString()}</span>
                  </div>

                  <div className="flex justify-between text-slate-600">
                    <span>Delivery Charge ({deliveryMethod.replace(/_/g, ' ')}):</span>
                    {deliveryMethod === 'store_pickup' ? (
                      <span className="font-bold text-emerald-600">Free (Pickup)</span>
                    ) : summary.deliveryFee > 0 ? (
                      <span className="font-bold text-[#111827]">৳{summary.deliveryFee.toLocaleString()}</span>
                    ) : (
                      <span className="font-semibold text-slate-500 text-xs">To be confirmed</span>
                    )}
                  </div>

                  {requestInstallation && (
                    <div className="flex justify-between text-slate-600">
                      <span>Installation Service Fee:</span>
                      {summary.installationFee > 0 ? (
                        <span className="font-bold text-[#F15A24]">৳{summary.installationFee.toLocaleString()}</span>
                      ) : (
                        <span className="font-semibold text-slate-500 text-xs">Quoted on survey</span>
                      )}
                    </div>
                  )}

                  <div className="flex justify-between text-slate-600">
                    <span>VAT / Tax:</span>
                    <span className="font-bold text-slate-400">Included</span>
                  </div>

                  <div className="pt-3 border-t border-slate-200 flex justify-between items-baseline">
                    <span className="text-sm font-bold text-[#111827]">Total Payable:</span>
                    <span className="text-2xl font-black text-[#F15A24] font-heading">
                      ৳{summary.total.toLocaleString()}
                    </span>
                  </div>
                </div>

                {step === 'cart' ? (
                  <Button
                    size="lg"
                    onClick={() => setStep('checkout')}
                    className="w-full"
                  >
                    <span>Proceed to Checkout</span>
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                ) : null}

                <div className="pt-2 text-[11px] text-slate-500 space-y-1.5 border-t border-slate-100">
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Official Manufacturer Serial Numbers</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Truck className="w-3.5 h-3.5 text-blue-600" />
                    <span>Secure Packaging & Fast Dispatch</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};
