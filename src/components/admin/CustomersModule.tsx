import React, { useState, useEffect } from 'react';
import { Users, Search, ShoppingBag, Eye, Calendar, Phone, Mail, Building, MapPin, CheckCircle2, Clock, X, AlertCircle } from 'lucide-react';
import { Button, Badge, Modal } from '../common/UI';
import { customerService, orderService } from '../../services';
import { Customer, Order } from '../../types';

export const CustomersModule: React.FC<{
  orders: Order[];
  onNavigateToOrder?: (orderId: string) => void;
}> = ({ orders: parentOrders, onNavigateToOrder }) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [orders, setOrders] = useState<Order[]>(parentOrders);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [selectedOrderDetail, setSelectedOrderDetail] = useState<Order | null>(null);

  const fetchCustomers = async () => {
    setIsLoading(true);
    try {
      const [custList, ordList] = await Promise.all([
        customerService.getCustomers(),
        orderService.getAllOrders()
      ]);
      setCustomers(custList);
      setOrders(ordList);
    } catch (err) {
      console.error('Failed to load customers', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const getCustomerOrders = (customer: Customer) => {
    const phoneClean = customer.phone.trim();
    const emailClean = (customer.email || '').trim().toLowerCase();
    return orders.filter(o => {
      if (o.customerId === customer.id) return true;
      if (o.customerPhone && o.customerPhone.includes(phoneClean)) return true;
      if (emailClean && o.customerEmail && o.customerEmail.toLowerCase() === emailClean) return true;
      return false;
    });
  };

  const filteredCustomers = customers.filter(c => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.phone.includes(q) ||
      (c.email && c.email.toLowerCase().includes(q)) ||
      (c.companyName && c.companyName.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold font-heading text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-[#F15A24]" />
            <span>Customers & Accounts</span>
          </h2>
          <p className="text-xs text-slate-400">
            Registered customer accounts, contact directories, and private order histories.
          </p>
        </div>

        <div className="text-xs text-slate-400">
          Total Registered: <strong className="text-white">{customers.length}</strong> accounts
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by name, phone, email, or company..."
            className="w-full bg-slate-950 border border-slate-800 text-xs text-white pl-9 pr-3 py-2 rounded-xl focus:border-[#F15A24] outline-none"
          />
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-slate-900/60 text-slate-400 font-bold uppercase">
            <tr>
              <th className="p-3.5">Customer</th>
              <th className="p-3.5">Contact Details</th>
              <th className="p-3.5">Account Type</th>
              <th className="p-3.5">Registered</th>
              <th className="p-3.5 text-center">Total Orders</th>
              <th className="p-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800 text-slate-300">
            {filteredCustomers.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-slate-500">
                  {isLoading ? 'Loading customers...' : 'No customer accounts registered yet.'}
                </td>
              </tr>
            ) : (
              filteredCustomers.map(c => {
                const custOrders = getCustomerOrders(c);
                const totalSpent = custOrders.reduce((sum, o) => sum + (o.total || 0), 0);

                return (
                  <tr key={c.id} className="hover:bg-slate-900/40 transition">
                    <td className="p-3.5">
                      <div className="font-bold text-white">{c.name}</div>
                      {c.companyName && (
                        <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <Building className="w-3 h-3 text-slate-500" />
                          <span>{c.companyName}</span>
                        </div>
                      )}
                    </td>

                    <td className="p-3.5 space-y-0.5">
                      <div className="flex items-center gap-1.5 font-mono text-slate-300">
                        <Phone className="w-3 h-3 text-slate-500" />
                        <a href={`tel:${c.phone}`} className="hover:text-[#F15A24]">{c.phone}</a>
                      </div>
                      {c.email && (
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                          <Mail className="w-3 h-3 text-slate-500" />
                          <span>{c.email}</span>
                        </div>
                      )}
                    </td>

                    <td className="p-3.5">
                      <Badge variant={c.customerType === 'business' ? 'orange' : 'gray'}>
                        {c.customerType === 'business' ? 'Corporate / B2B' : 'Individual'}
                      </Badge>
                    </td>

                    <td className="p-3.5 text-slate-400 text-[11px]">
                      {new Date(c.createdAt).toLocaleDateString()}
                    </td>

                    <td className="p-3.5 text-center">
                      <span className="font-bold text-white bg-slate-900 px-2 py-0.5 rounded-lg border border-slate-800">
                        {custOrders.length}
                      </span>
                      {totalSpent > 0 && (
                        <span className="block text-[10px] text-emerald-400 mt-0.5 font-semibold">
                          ৳{totalSpent.toLocaleString()}
                        </span>
                      )}
                    </td>

                    <td className="p-3.5 text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedCustomer(c);
                          setProfileModalOpen(true);
                        }}
                        className="text-xs"
                      >
                        <Eye className="w-3.5 h-3.5 mr-1" />
                        <span>Profile & Orders</span>
                      </Button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Customer Profile & Private Order History Modal */}
      {profileModalOpen && selectedCustomer && (
        <Modal
          isOpen={profileModalOpen}
          onClose={() => {
            setProfileModalOpen(false);
            setSelectedCustomer(null);
          }}
          title={`Customer: ${selectedCustomer.name}`}
          maxWidth="max-w-3xl"
        >
          <div className="space-y-6 text-slate-900 max-h-[80vh] overflow-y-auto pr-1">
            {/* Profile Overview Card */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Full Name</span>
                <span className="text-sm font-bold text-slate-900">{selectedCustomer.name}</span>
                {selectedCustomer.companyName && (
                  <span className="text-xs text-slate-500 block">{selectedCustomer.companyName}</span>
                )}
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Contact</span>
                <span className="text-xs font-mono font-bold text-slate-800 block">{selectedCustomer.phone}</span>
                <span className="text-xs text-slate-500 block">{selectedCustomer.email || 'No email on file'}</span>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Account Type & Date</span>
                <span className="text-xs font-semibold capitalize block">{selectedCustomer.customerType}</span>
                <span className="text-[11px] text-slate-400 block">
                  Member since {new Date(selectedCustomer.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>

            {/* Default Addresses */}
            {selectedCustomer.addresses && selectedCustomer.addresses.length > 0 && (
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">Saved Delivery Addresses</span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {selectedCustomer.addresses.map(a => (
                    <div key={a.id} className="bg-white p-2.5 rounded-lg border border-slate-200 text-xs">
                      <div className="font-bold text-slate-800 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-[#F15A24]" />
                        <span>{a.label}</span>
                      </div>
                      <div className="text-slate-600 mt-0.5">{a.addressLine}, {a.area}, {a.city}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Private Order History */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <ShoppingBag className="w-4 h-4 text-[#F15A24]" />
                  <span>Private Order History ({getCustomerOrders(selectedCustomer).length})</span>
                </h3>
              </div>

              {getCustomerOrders(selectedCustomer).length === 0 ? (
                <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 text-center text-xs text-slate-500">
                  This customer has not placed any online store orders yet.
                </div>
              ) : (
                <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100 overflow-hidden">
                  {getCustomerOrders(selectedCustomer).map(order => (
                    <div key={order.id} className="p-3.5 hover:bg-slate-50 transition space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-xs text-slate-900">{order.orderNumber}</span>
                          <span className="text-[11px] text-slate-500">
                            {new Date(order.createdAt).toLocaleDateString()}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <Badge variant={order.status === 'delivered' ? 'success' : order.status === 'cancelled' ? 'danger' : 'orange'}>
                            {order.status}
                          </Badge>
                          <Badge variant={order.paymentStatus === 'paid' ? 'success' : 'yellow'}>
                            {order.paymentStatus}
                          </Badge>
                          <span className="font-bold text-xs text-[#F15A24]">
                            ৳{order.total?.toLocaleString()}
                          </span>
                        </div>
                      </div>

                      {/* Items preview */}
                      <div className="text-xs text-slate-600 pl-2 border-l-2 border-slate-200 space-y-1">
                        {order.items.map((item, idx) => (
                          <div key={idx} className="flex justify-between">
                            <span>{item.quantity}x {item.name}</span>
                            <span className="font-mono text-slate-500">৳{item.totalPrice?.toLocaleString()}</span>
                          </div>
                        ))}
                      </div>

                      <div className="text-[11px] text-slate-500 flex items-center justify-between pt-1">
                        <span>Delivery: {order.deliveryCity} ({order.deliveryMethod.replace('_', ' ')})</span>
                        {order.deliveryAddress && (
                          <span className="truncate max-w-xs">{order.deliveryAddress}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setProfileModalOpen(false);
                  setSelectedCustomer(null);
                }}
              >
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

