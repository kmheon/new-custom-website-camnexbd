const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '..', 'src', 'pages', 'AdminDashboard.tsx');
let code = fs.readFileSync(targetFile, 'utf8');

// 1. Add states for orders & quotes filtering
const stateMarker = 'const [selectedOrderForInvoice, setSelectedOrderForInvoice] = useState<Order | null>(null);';
if (!code.includes(stateMarker)) {
  console.error('Could not find state marker in AdminDashboard.tsx');
  process.exit(1);
}

const operationsStates = `
  // Operations Hub States: Orders & Quotes Pipeline & Filters
  const [orderSearchQuery, setOrderSearchQuery] = useState('');
  const [orderStatusTab, setOrderStatusTab] = useState<'all' | 'action_needed' | 'confirmed' | 'processing' | 'dispatched' | 'delivered' | 'cancelled'>('all');
  const [orderPaymentFilter, setOrderPaymentFilter] = useState<string>('all');
  const [quoteSearchQuery, setQuoteSearchQuery] = useState('');
  const [quoteStatusTab, setQuoteStatusTab] = useState<'all' | 'pending' | 'contacted' | 'quoted' | 'approved' | 'rejected'>('all');
`;

code = code.replace(stateMarker, stateMarker + '\n' + operationsStates);

// 2. Find and replace the ORDERS MODULE block (lines ~3000-3115)
const ordersStartMarker = '{/* 6. ORDERS MODULE */}';
const customersStartMarker = '{/* CUSTOMERS & CRM MODULE */}';

const ordersStartIdx = code.indexOf(ordersStartMarker);
const customersStartIdx = code.indexOf(customersStartMarker);

if (ordersStartIdx === -1 || customersStartIdx === -1) {
  console.error('Could not locate orders module block');
  process.exit(1);
}

const newOrdersJsx = `{/* 6. OPERATIONS HUB: ORDERS & TIMELINE MODULE */}
          {activeModule === 'orders' && (() => {
            // Filter operational orders by tab and search
            const filteredOrders = operationalOrders.filter((o) => {
              // Status tab filter
              if (orderStatusTab === 'action_needed') {
                const needsAction = o.paymentStatus === 'unverified' || o.status === 'pending';
                if (!needsAction) return false;
              } else if (orderStatusTab !== 'all') {
                if (o.status !== orderStatusTab) return false;
              }

              // Payment method filter
              if (orderPaymentFilter !== 'all') {
                if (o.paymentMethod !== orderPaymentFilter) return false;
              }

              // Search query filter
              if (orderSearchQuery.trim()) {
                const q = orderSearchQuery.toLowerCase().trim();
                const num = (o.orderNumber || '').toLowerCase();
                const name = (o.customerName || '').toLowerCase();
                const phone = (o.customerPhone || '').toLowerCase();
                const trx = (o.paymentDetails?.transactionId || '').toLowerCase();
                const address = (o.deliveryAddress || '').toLowerCase();
                const courierTrack = (o.trackingNumber || '').toLowerCase();
                if (!num.includes(q) && !name.includes(q) && !phone.includes(q) && !trx.includes(q) && !address.includes(q) && !courierTrack.includes(q)) {
                  return false;
                }
              }

              return true;
            });

            // Summary metrics
            const unverifiedCount = operationalOrders.filter(o => o.paymentStatus === 'unverified').length;
            const pendingCount = operationalOrders.filter(o => o.status === 'pending').length;
            const dispatchedCount = operationalOrders.filter(o => o.status === 'dispatched').length;
            const deliveredCount = operationalOrders.filter(o => o.status === 'delivered').length;
            const totalPaidRevenue = operationalOrders
              .filter(o => o.paymentStatus === 'paid' && o.status !== 'cancelled')
              .reduce((sum, o) => sum + (Number(o.total) || 0), 0);

            return (
              <div className="space-y-6">
                {/* Header & Export */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold font-heading text-white flex items-center gap-2">
                      <ShoppingCart className="w-5 h-5 text-[#F15A24]" />
                      <span>Customer Orders & Logistics Fulfillment</span>
                    </h2>
                    <p className="text-xs text-slate-400">
                      Live dispatch operations, courier consignment integration, and transaction audit.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    <button
                      type="button"
                      onClick={() => refreshAllData()}
                      className="px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                      title="Refresh Orders"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Sync</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => window.open('/api/admin/orders/export?format=csv', '_blank')}
                      className="px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <FileText className="w-3.5 h-3.5 text-[#F15A24]" />
                      <span>Export CSV</span>
                    </button>
                  </div>
                </div>

                {/* KPI Metrics Summary Strip */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-slate-950 border border-slate-800/80 rounded-2xl p-4">
                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Volume</div>
                    <div className="text-2xl font-black text-white mt-1">{operationalOrders.length}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">{operationalOrders.length} total orders recorded</div>
                  </div>

                  <div className="bg-slate-950 border border-amber-500/30 rounded-2xl p-4 relative overflow-hidden">
                    <div className="text-[11px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>Action Needed</span>
                    </div>
                    <div className="text-2xl font-black text-amber-400 mt-1">{unverifiedCount + pendingCount}</div>
                    <div className="text-[11px] text-amber-500/80 mt-0.5">{unverifiedCount} unverified • {pendingCount} pending</div>
                  </div>

                  <div className="bg-slate-950 border border-sky-500/30 rounded-2xl p-4">
                    <div className="text-[11px] font-bold text-sky-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Truck className="w-3.5 h-3.5" />
                      <span>In Transit / Dispatched</span>
                    </div>
                    <div className="text-2xl font-black text-sky-300 mt-1">{dispatchedCount}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">{deliveredCount} delivered successfully</div>
                  </div>

                  <div className="bg-slate-950 border border-emerald-500/30 rounded-2xl p-4">
                    <div className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                      <CreditCard className="w-3.5 h-3.5" />
                      <span>Paid Revenue</span>
                    </div>
                    <div className="text-2xl font-black text-emerald-400 mt-1">৳{totalPaidRevenue.toLocaleString()}</div>
                    <div className="text-[11px] text-emerald-500/80 mt-0.5">Verified & collected funds</div>
                  </div>
                </div>

                {/* Pipeline Status Filter Tabs */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none border-b border-slate-800">
                  {[
                    { id: 'all', label: 'All Orders', count: operationalOrders.length },
                    { id: 'action_needed', label: 'Action Needed', count: unverifiedCount + pendingCount, alert: (unverifiedCount + pendingCount) > 0 },
                    { id: 'confirmed', label: 'Confirmed', count: operationalOrders.filter(o => o.status === 'confirmed').length },
                    { id: 'processing', label: 'Processing', count: operationalOrders.filter(o => o.status === 'processing').length },
                    { id: 'dispatched', label: 'Dispatched', count: dispatchedCount },
                    { id: 'delivered', label: 'Delivered', count: deliveredCount },
                    { id: 'cancelled', label: 'Cancelled', count: operationalOrders.filter(o => o.status === 'cancelled').length }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setOrderStatusTab(tab.id as any)}
                      className={\`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 \${
                        orderStatusTab === tab.id
                          ? 'bg-[#F15A24] text-white shadow-md shadow-[#F15A24]/20'
                          : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                      }\`}
                    >
                      <span>{tab.label}</span>
                      <span className={\`px-1.5 py-0.2 rounded-full text-[10px] font-black \${
                        orderStatusTab === tab.id
                          ? 'bg-white/20 text-white'
                          : tab.alert
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                          : 'bg-slate-800 text-slate-400'
                      }\`}>
                        {tab.count}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Search & Secondary Filter Bar */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="text"
                      value={orderSearchQuery}
                      onChange={(e) => setOrderSearchQuery(e.target.value)}
                      placeholder="Search by order #, customer name, phone, bKash TrxID, or consignment code..."
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-8 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#F15A24] transition-colors"
                    />
                    {orderSearchQuery && (
                      <button
                        type="button"
                        onClick={() => setOrderSearchQuery('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white text-xs px-1"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  <select
                    value={orderPaymentFilter}
                    onChange={(e) => setOrderPaymentFilter(e.target.value)}
                    className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-[#F15A24]"
                  >
                    <option value="all">All Payment Methods</option>
                    <option value="cod">Cash on Delivery</option>
                    <option value="bkash_manual">bKash (Send Money / Merchant)</option>
                    <option value="nagad_manual">Nagad</option>
                    <option value="bank_transfer">Corporate Bank Transfer</option>
                  </select>
                </div>

                {/* Orders Table */}
                <div className="bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-slate-900/80 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-800">
                        <tr>
                          <th className="p-3.5">Order Ref</th>
                          <th className="p-3.5">Customer & Contact</th>
                          <th className="p-3.5">Payment & Audit</th>
                          <th className="p-3.5">Logistics & Courier</th>
                          <th className="p-3.5">Amount (BDT)</th>
                          <th className="p-3.5">Order Status</th>
                          <th className="p-3.5 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/80 text-slate-300">
                        {filteredOrders.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="p-12 text-center text-slate-500">
                              <div className="flex flex-col items-center justify-center gap-2">
                                <ShoppingCart className="w-8 h-8 text-slate-600 stroke-[1.5]" />
                                <span className="font-semibold text-slate-400">No orders match the selected filters.</span>
                                {orderSearchQuery && (
                                  <button
                                    type="button"
                                    onClick={() => { setOrderSearchQuery(''); setOrderStatusTab('all'); }}
                                    className="text-xs text-[#F15A24] hover:underline font-bold mt-1"
                                  >
                                    Reset Filters
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ) : (
                          filteredOrders.map(o => {
                            const isPaid = o.paymentStatus === 'paid';
                            const isUnverified = o.paymentStatus === 'unverified';
                            const hasCourier = Boolean(o.trackingNumber || o.courierName);
                            const trackingUrl = o.courierTrackingUrl || (o.trackingNumber ? \`https://steadfast.com.bd/t/\${encodeURIComponent(o.trackingNumber)}\` : null);

                            return (
                              <tr key={o.id} className="hover:bg-slate-900/50 transition-colors">
                                {/* Order Number & Date */}
                                <td className="p-3.5 align-top">
                                  <div className="font-bold text-white font-mono text-[13px]">{o.orderNumber}</div>
                                  <div className="text-[11px] text-slate-500 mt-0.5">
                                    {o.createdAt ? new Date(o.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Recent'}
                                  </div>
                                  {Array.isArray(o.items) && o.items.length > 0 && (
                                    <span className="inline-block mt-1 text-[10px] text-slate-400 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                                      {o.items.length} item{o.items.length > 1 ? 's' : ''}
                                    </span>
                                  )}
                                </td>

                                {/* Customer Info */}
                                <td className="p-3.5 align-top">
                                  <div className="font-bold text-white text-[13px]">{o.customerName || 'Customer'}</div>
                                  <div className="text-slate-400 font-mono text-[11px] mt-0.5">{o.customerPhone}</div>
                                  {o.customerEmail && (
                                    <div className="text-slate-500 text-[11px] truncate max-w-[180px]">{o.customerEmail}</div>
                                  )}
                                  <div className="text-[11px] text-slate-400 line-clamp-1 mt-1 max-w-[220px]" title={o.deliveryAddress}>
                                    {o.deliveryAddress || 'Dhaka, Bangladesh'}
                                  </div>
                                </td>

                                {/* Payment Status & TrxID Audit */}
                                <td className="p-3.5 align-top">
                                  <div className="font-bold text-slate-200 capitalize">
                                    {o.paymentMethod === 'cod' ? 'Cash on Delivery' :
                                     o.paymentMethod === 'bkash_manual' ? 'bKash Send Money' :
                                     o.paymentMethod === 'nagad_manual' ? 'Nagad' :
                                     o.paymentMethod === 'bank_transfer' ? 'Bank Transfer' : (o.paymentMethod || 'Manual')}
                                  </div>

                                  {o.paymentDetails?.transactionId && (
                                    <div className="text-[11px] font-mono text-emerald-400 mt-0.5 flex items-center gap-1">
                                      <span className="text-slate-500">Trx:</span>
                                      <span className="font-bold">{o.paymentDetails.transactionId}</span>
                                    </div>
                                  )}

                                  {o.paymentDetails?.depositRef && (
                                    <div className="text-[11px] font-mono text-emerald-400">
                                      <span className="text-slate-500">Ref:</span> {o.paymentDetails.depositRef}
                                    </div>
                                  )}

                                  <div className="mt-1.5 flex items-center gap-1.5">
                                    {isUnverified ? (
                                      <>
                                        <span className="inline-block px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] font-bold">
                                          Unverified
                                        </span>
                                        <button
                                          type="button"
                                          onClick={async (e) => {
                                            e.stopPropagation();
                                            await orderService.updatePaymentStatus(o.id, 'paid');
                                            refreshAllData();
                                          }}
                                          className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-600 hover:text-white transition-colors"
                                          title="Verify payment receipt"
                                        >
                                          ✓ Verify
                                        </button>
                                      </>
                                    ) : (
                                      <span className={\`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold \${
                                        isPaid ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-slate-800 text-slate-400'
                                      }\`}>
                                        {isPaid ? 'Paid / Verified' : 'Unpaid'}
                                      </span>
                                    )}
                                  </div>
                                </td>

                                {/* Logistics, Courier & Tracking */}
                                <td className="p-3.5 align-top">
                                  {hasCourier ? (
                                    <div className="space-y-1">
                                      <div className="flex items-center gap-1.5">
                                        <Truck className="w-3.5 h-3.5 text-[#F15A24]" />
                                        <span className="font-bold text-white text-[11px]">{o.courierName || 'Courier'}</span>
                                      </div>
                                      {o.trackingNumber && (
                                        <div className="text-[11px] font-mono text-slate-300">
                                          #{o.trackingNumber}
                                        </div>
                                      )}
                                      {trackingUrl && (
                                        <a
                                          href={trackingUrl}
                                          target="_blank"
                                          rel="noreferrer"
                                          className="inline-flex items-center gap-1 text-[10px] font-bold text-sky-400 hover:text-sky-300 transition-colors"
                                        >
                                          <span>Track Live</span>
                                          <ExternalLink className="w-2.5 h-2.5" />
                                        </a>
                                      )}
                                    </div>
                                  ) : (
                                    <div className="space-y-1.5">
                                      <span className="inline-block text-[10px] font-semibold text-slate-500 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                                        Not Dispatched
                                      </span>
                                      <div>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setSelectedOrderForInvoice(o);
                                            setOrderInvoiceModalOpen(true);
                                          }}
                                          className="text-[10px] font-bold text-[#F15A24] hover:text-[#ff723f] flex items-center gap-1 transition-colors"
                                        >
                                          <Truck className="w-3 h-3" />
                                          <span>Dispatch Parcel</span>
                                        </button>
                                      </div>
                                    </div>
                                  )}

                                  {o.installation?.requested && (
                                    <div className="mt-1">
                                      <span className="inline-block px-1.5 py-0.5 rounded bg-orange-500/10 text-orange-400 border border-orange-500/20 text-[10px] font-bold">
                                        + Installation ({o.installation.preferredDate || 'Standard'})
                                      </span>
                                    </div>
                                  )}
                                </td>

                                {/* Total Amount */}
                                <td className="p-3.5 align-top font-bold text-[#F15A24] text-sm">
                                  ৳{Number(o.total || 0).toLocaleString()}
                                </td>

                                {/* Order Status Badge & Inline Selector */}
                                <td className="p-3.5 align-top">
                                  <select
                                    value={o.status}
                                    onChange={async (e) => {
                                      await orderService.updateOrderStatus(o.id, e.target.value, \`Admin updated status to \${e.target.value}\`);
                                      refreshAllData();
                                    }}
                                    className={\`text-xs font-bold rounded-lg px-2.5 py-1 border transition-colors cursor-pointer \${
                                      o.status === 'delivered' ? 'bg-emerald-950/80 border-emerald-600/50 text-emerald-300' :
                                      o.status === 'dispatched' ? 'bg-sky-950/80 border-sky-600/50 text-sky-300' :
                                      o.status === 'confirmed' ? 'bg-blue-950/80 border-blue-600/50 text-blue-300' :
                                      o.status === 'processing' ? 'bg-indigo-950/80 border-indigo-600/50 text-indigo-300' :
                                      o.status === 'cancelled' ? 'bg-red-950/80 border-red-800/50 text-red-400' :
                                      'bg-amber-950/80 border-amber-600/50 text-amber-300'
                                    }\`}
                                  >
                                    <option value="pending">Pending</option>
                                    <option value="confirmed">Confirmed</option>
                                    <option value="processing">Processing</option>
                                    <option value="dispatched">Dispatched</option>
                                    <option value="delivered">Delivered</option>
                                    <option value="cancelled">Cancelled</option>
                                  </select>
                                </td>

                                {/* Actions */}
                                <td className="p-3.5 align-top text-right">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedOrderForInvoice(o);
                                      setOrderInvoiceModalOpen(true);
                                    }}
                                    className="px-2.5 py-1.5 rounded-xl border border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-bold inline-flex items-center gap-1.5 transition-colors shadow-sm"
                                  >
                                    <FileText className="w-3.5 h-3.5 text-[#F15A24]" />
                                    <span>Inspect & Dispatch</span>
                                  </button>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            );
          })()}

          `;

code = code.slice(0, ordersStartIdx) + newOrdersJsx + code.slice(customersStartIdx);

// 3. Find and upgrade the QUOTES MODULE block
const quotesStartMarker = '{/* 7. QUOTES & SITE SURVEYS MODULE */}';
const specTemplatesStartMarker = '{/* 8. SPEC TEMPLATES MODULE */}';

const quotesStartIdx = code.indexOf(quotesStartMarker);
const specTemplatesStartIdx = code.indexOf(specTemplatesStartMarker);

if (quotesStartIdx !== -1 && specTemplatesStartIdx !== -1) {
  const newQuotesJsx = `{/* 7. OPERATIONS HUB: QUOTES & SITE SURVEYS MODULE */}
          {activeModule === 'quotes' && (() => {
            const filteredQuotes = operationalQuotes.filter((q) => {
              if (quoteStatusTab !== 'all' && q.status !== quoteStatusTab) return false;
              if (quoteSearchQuery.trim()) {
                const query = quoteSearchQuery.toLowerCase().trim();
                const qNum = (q.quoteNumber || q.id || '').toLowerCase();
                const name = (q.customerName || '').toLowerCase();
                const phone = (q.phone || '').toLowerCase();
                const address = (q.siteAddress || '').toLowerCase();
                const notes = (q.notes || '').toLowerCase();
                if (!qNum.includes(query) && !name.includes(query) && !phone.includes(query) && !address.includes(query) && !notes.includes(query)) {
                  return false;
                }
              }
              return true;
            });

            const pendingReviewCount = operationalQuotes.filter(q => q.status === 'pending').length;
            const quotedCount = operationalQuotes.filter(q => q.status === 'quoted').length;
            const approvedCount = operationalQuotes.filter(q => q.status === 'approved').length;

            return (
              <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold font-heading text-white flex items-center gap-2">
                      <FileText className="w-5 h-5 text-[#F15A24]" />
                      <span>Technical Consultations & B2B Quote Requests</span>
                    </h2>
                    <p className="text-xs text-slate-400">
                      Corporate inquiries, on-site survey requests, and camera count engineering in Dhaka.
                    </p>
                  </div>
                  <div className="text-xs font-bold text-slate-400 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
                    Total Inquiries: <span className="text-[#F15A24] font-black">{operationalQuotes.length}</span>
                  </div>
                </div>

                {/* Pipeline Tabs */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none border-b border-slate-800">
                  {[
                    { id: 'all', label: 'All Requests', count: operationalQuotes.length },
                    { id: 'pending', label: 'Pending Review', count: pendingReviewCount, alert: pendingReviewCount > 0 },
                    { id: 'contacted', label: 'Contacted', count: operationalQuotes.filter(q => q.status === 'contacted').length },
                    { id: 'quoted', label: 'Quoted', count: quotedCount },
                    { id: 'approved', label: 'Approved / Converted', count: approvedCount },
                    { id: 'rejected', label: 'Declined', count: operationalQuotes.filter(q => q.status === 'rejected').length }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setQuoteStatusTab(tab.id as any)}
                      className={\`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 \${
                        quoteStatusTab === tab.id
                          ? 'bg-[#F15A24] text-white shadow-md shadow-[#F15A24]/20'
                          : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                      }\`}
                    >
                      <span>{tab.label}</span>
                      <span className={\`px-1.5 py-0.2 rounded-full text-[10px] font-black \${
                        quoteStatusTab === tab.id
                          ? 'bg-white/20 text-white'
                          : tab.alert
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                          : 'bg-slate-800 text-slate-400'
                      }\`}>
                        {tab.count}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Search Bar */}
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    value={quoteSearchQuery}
                    onChange={(e) => setQuoteSearchQuery(e.target.value)}
                    placeholder="Search by quote ref, customer name, phone, area, or site notes..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-8 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#F15A24] transition-colors"
                  />
                  {quoteSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setQuoteSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white text-xs px-1"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Quotes Table */}
                <div className="bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-slate-900/80 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-800">
                        <tr>
                          <th className="p-3.5">Quote Ref</th>
                          <th className="p-3.5">Customer & Phone</th>
                          <th className="p-3.5">Service & Property</th>
                          <th className="p-3.5">Site Details & Cameras</th>
                          <th className="p-3.5">Status</th>
                          <th className="p-3.5 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/80 text-slate-300">
                        {filteredQuotes.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="p-12 text-center text-slate-500">
                              <div className="flex flex-col items-center justify-center gap-2">
                                <FileText className="w-8 h-8 text-slate-600 stroke-[1.5]" />
                                <span className="font-semibold text-slate-400">No quotation requests match the filter criteria.</span>
                              </div>
                            </td>
                          </tr>
                        ) : (
                          filteredQuotes.map(q => (
                            <tr key={q.id} className="hover:bg-slate-900/50 transition-colors">
                              <td className="p-3.5 font-bold text-white font-mono text-[13px]">{q.quoteNumber || q.id}</td>
                              <td className="p-3.5">
                                <div className="font-bold text-white text-[13px]">{q.customerName || 'Customer'}</div>
                                <div className="text-slate-400 font-mono text-[11px] mt-0.5">{q.phone || 'N/A'}</div>
                                {q.email && <div className="text-slate-500 text-[11px]">{q.email}</div>}
                              </td>
                              <td className="p-3.5">
                                <div className="font-bold text-[#F15A24] capitalize">{(q.serviceType || 'cctv_installation').replace(/_/g, ' ')}</div>
                                <div className="text-slate-400 capitalize">{q.propertyType || 'standard'} Premises</div>
                              </td>
                              <td className="p-3.5">
                                <div className="line-clamp-1 text-slate-300 font-medium">{q.siteAddress || 'Dhaka'}</div>
                                <div className="text-[11px] text-slate-400 mt-0.5">
                                  {q.cameraCount ? \`\${q.cameraCount} Cams\` : ''} {q.doorCount ? \`· \${q.doorCount} Doors\` : ''}
                                </div>
                                {q.notes && <div className="text-[11px] text-slate-500 line-clamp-1 italic mt-0.5">"{q.notes}"</div>}
                              </td>
                              <td className="p-3.5">
                                <select
                                  value={q.status}
                                  onChange={(e) => handleUpdateQuoteStatus(q.id, e.target.value as any)}
                                  className={\`text-xs font-bold rounded-lg px-2.5 py-1 border transition-colors cursor-pointer \${
                                    q.status === 'approved' ? 'bg-emerald-950/80 border-emerald-600/50 text-emerald-300' :
                                    q.status === 'quoted' ? 'bg-blue-950/80 border-blue-600/50 text-blue-300' :
                                    q.status === 'contacted' ? 'bg-sky-950/80 border-sky-600/50 text-sky-300' :
                                    q.status === 'rejected' ? 'bg-red-950/80 border-red-800/50 text-red-400' :
                                    'bg-amber-950/80 border-amber-600/50 text-amber-300'
                                  }\`}
                                >
                                  <option value="pending">Pending</option>
                                  <option value="contacted">Contacted</option>
                                  <option value="quoted">Quoted</option>
                                  <option value="approved">Approved</option>
                                  <option value="rejected">Rejected</option>
                                </select>
                              </td>
                              <td className="p-3.5 text-right flex items-center justify-end gap-2">
                                {q.status !== 'approved' && (
                                  <button
                                    type="button"
                                    onClick={async () => {
                                      try {
                                        const res = await fetch(\`/api/quotes/\${encodeURIComponent(q.id)}/convert-to-order\`, {
                                          method: 'POST'
                                        });
                                        if (res.ok) {
                                          refreshAllData();
                                          setActiveModule('orders');
                                        }
                                      } catch (e) {
                                        console.error(e);
                                      }
                                    }}
                                    className="px-2.5 py-1.5 rounded-xl border border-emerald-600/50 bg-emerald-950/40 hover:bg-emerald-600 text-emerald-300 hover:text-white text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                                    title="Convert this quotation request directly into a live order"
                                  >
                                    <ShoppingCart className="w-3.5 h-3.5" />
                                    <span>Convert to Order</span>
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            );
          })()}

          `;

  code = code.slice(0, quotesStartIdx) + newQuotesJsx + code.slice(specTemplatesStartIdx);
}

fs.writeFileSync(targetFile, code, 'utf8');
console.log('Successfully upgraded Operations Hub (Orders & Quotes) in AdminDashboard.tsx!');

