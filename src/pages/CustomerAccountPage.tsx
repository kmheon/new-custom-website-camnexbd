import React, { useState, useEffect } from 'react';
import { User, Package, Clock, ShieldCheck, MapPin, FileText, LogOut, ArrowRight, CheckCircle2, Lock, Phone as PhoneIcon, Mail } from 'lucide-react';
import { SEO } from '../components/common/SEO';
import { Breadcrumbs, Button, Badge } from '../components/common/UI';
import { useCustomerAuthStore } from '../store';
import { Order } from '../types';

interface CustomerAccountPageProps {
  onNavigate: (route: string, param?: string) => void;
}

export const CustomerAccountPage: React.FC<CustomerAccountPageProps> = ({ onNavigate }) => {
  const {
    currentCustomer,
    isCustomerAuthenticated,
    checkCustomerAuth,
    login,
    register,
    logout,
    fetchMyOrders,
    isLoading,
    error
  } = useCustomerAuthStore();

  const [authChecked, setAuthChecked] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  // Form states
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const [regName, setRegName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');

  // Orders state
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  useEffect(() => {
    checkCustomerAuth().finally(() => setAuthChecked(true));
  }, []);

  useEffect(() => {
    if (isCustomerAuthenticated) {
      loadOrders();
    }
  }, [isCustomerAuthenticated]);

  const loadOrders = async () => {
    setLoadingOrders(true);
    try {
      const myOrders = await fetchMyOrders();
      setOrders(myOrders);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingOrders(false);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginIdentifier || !loginPassword) return;
    const ok = await login(loginIdentifier, loginPassword);
    if (ok) {
      setLoginPassword('');
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName || !regPhone || !regPassword) return;
    const ok = await register(regName, regPhone, regPassword, regEmail);
    if (ok) {
      setRegPassword('');
    }
  };

  if (!authChecked) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center text-slate-500 py-12">
        <div className="flex items-center gap-3 text-sm">
          <div className="w-5 h-5 border-2 border-[#F15A24] border-t-transparent rounded-full animate-spin"></div>
          <span>Checking account session...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#F8FAFC] min-h-screen py-6 sm:py-10">
      <SEO
        title="Customer Account & Order History | CamneX Bangladesh"
        description="Sign in to view your verified hardware purchases and live order tracking."
        noIndex={true}
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Breadcrumbs
          items={[
            { label: 'Home', onClick: () => onNavigate('home') },
            { label: 'My Account' }
          ]}
        />

        {!isCustomerAuthenticated ? (
          /* Authentication Screen */
          <div className="mt-8 bg-white border border-slate-200 shadow-sm rounded-2xl p-6 sm:p-10 max-w-md mx-auto">
            <div className="text-center mb-8">
              <div className="w-12 h-12 bg-orange-50 text-[#F15A24] rounded-2xl flex items-center justify-center mx-auto mb-3">
                <Lock className="w-6 h-6" />
              </div>
              <h1 className="text-2xl font-black text-[#111827] tracking-tight">
                {authMode === 'login' ? 'Customer Sign In' : 'Create Customer Account'}
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                {authMode === 'login'
                  ? 'Access your private order history and tracking updates'
                  : 'Register with your mobile number for fast checkout & order history'}
              </p>

              {/* Mode Toggle */}
              <div className="flex p-1 bg-slate-100 rounded-xl mt-5">
                <button
                  type="button"
                  onClick={() => setAuthMode('login')}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                    authMode === 'login' ? 'bg-white text-[#111827] shadow-sm' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => setAuthMode('register')}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                    authMode === 'register' ? 'bg-white text-[#111827] shadow-sm' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  Register
                </button>
              </div>
            </div>

            {error && (
              <div className="mb-5 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl">
                {error}
              </div>
            )}

            {authMode === 'login' ? (
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Phone Number or Email
                  </label>
                  <input
                    type="text"
                    required
                    value={loginIdentifier}
                    onChange={(e) => setLoginIdentifier(e.target.value)}
                    placeholder="e.g. 01711000000 or customer@email.com"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-[#F15A24] focus:bg-white transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Password</label>
                  <input
                    type="password"
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-[#F15A24] focus:bg-white transition-all"
                  />
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  fullWidth
                  loading={isLoading}
                  className="mt-2"
                >
                  Sign In to Account
                </Button>
              </form>
            ) : (
              <form onSubmit={handleRegisterSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="e.g. Mohammad Rahim"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-[#F15A24] focus:bg-white transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    required
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    placeholder="e.g. 01711000000"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-[#F15A24] focus:bg-white transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Email (Optional)</label>
                  <input
                    type="email"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="e.g. rahim@example.com"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-[#F15A24] focus:bg-white transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Password</label>
                  <input
                    type="password"
                    required
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Minimum 6 characters"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-[#F15A24] focus:bg-white transition-all"
                  />
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  fullWidth
                  loading={isLoading}
                  className="mt-2"
                >
                  Create Account
                </Button>
              </form>
            )}

            <div className="mt-6 pt-5 border-t border-slate-100 text-center">
              <span className="text-xs text-slate-500">Already placed an order as guest? </span>
              <button
                onClick={() => onNavigate('tracking')}
                className="text-xs text-[#F15A24] font-bold hover:underline"
              >
                Track by Order Number
              </button>
            </div>
          </div>
        ) : (
          /* Logged In Dashboard with Private Order History */
          <div className="mt-8 space-y-6">
            <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-[#0F172A] text-white flex items-center justify-center font-bold text-xl">
                  {currentCustomer?.name ? currentCustomer.name[0].toUpperCase() : 'C'}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-xl font-bold text-[#111827]">
                      {currentCustomer?.name}
                    </h1>
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      Verified
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                    {currentCustomer?.phone && (
                      <span className="flex items-center gap-1">
                        <PhoneIcon className="w-3 h-3" />
                        {currentCustomer.phone}
                      </span>
                    )}
                    {currentCustomer?.email && (
                      <span className="flex items-center gap-1">
                        <Mail className="w-3 h-3" />
                        {currentCustomer.email}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 self-end sm:self-auto">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onNavigate('tracking')}
                >
                  Track Order
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => logout()}
                  className="text-slate-500 hover:text-red-600"
                >
                  <LogOut className="w-4 h-4 mr-1.5" />
                  Sign Out
                </Button>
              </div>
            </div>

            {/* Private Order History Section */}
            <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-100">
                <div>
                  <h2 className="text-base font-bold text-[#111827]">Private Order History</h2>
                  <p className="text-xs text-slate-500">Hardware orders linked to your verified account</p>
                </div>
                <span className="text-xs font-bold text-slate-400">
                  {orders.length} {orders.length === 1 ? 'Order' : 'Orders'}
                </span>
              </div>

              {loadingOrders ? (
                <div className="py-12 text-center text-slate-400 text-sm">
                  <div className="w-6 h-6 border-2 border-[#F15A24] border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                  Loading your orders...
                </div>
              ) : orders.length === 0 ? (
                <div className="py-12 text-center space-y-3">
                  <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mx-auto">
                    <Package className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-800">No orders placed yet</h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    When you order surveillance or networking hardware, your invoices and tracking links will appear here.
                  </p>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => onNavigate('catalog')}
                    className="mt-2"
                  >
                    Browse Catalog
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.map((ord) => (
                    <div
                      key={ord.id}
                      className="p-5 rounded-xl border border-slate-200 hover:border-slate-300 transition-colors bg-slate-50/50"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200/60">
                        <div>
                          <span className="text-xs text-slate-500 font-mono">Invoice:</span>
                          <span className="font-bold text-sm text-[#111827] ml-1.5">{ord.orderNumber}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                            ord.status === 'delivered'
                              ? 'bg-emerald-100 text-emerald-800'
                              : ord.status === 'dispatched'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-orange-100 text-orange-800'
                          }`}>
                            {ord.status}
                          </span>
                          <span className="text-xs text-slate-400">
                            {new Date(ord.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      <div className="py-3 space-y-1.5">
                        {ord.items.map((it, idx) => (
                          <div key={idx} className="flex justify-between text-xs text-slate-700">
                            <span>{it.name} <span className="text-slate-400">× {it.quantity}</span></span>
                            <span className="font-semibold text-slate-900">৳{it.totalPrice.toLocaleString()}</span>
                          </div>
                        ))}
                      </div>

                      <div className="pt-3 border-t border-slate-200/60 flex items-center justify-between text-xs">
                        <div>
                          <span className="text-slate-500">Payment: </span>
                          <span className="font-bold uppercase text-slate-700">{ord.paymentMethod.replace('_', ' ')}</span>
                          <span className={`ml-1.5 font-semibold ${ord.paymentStatus === 'paid' ? 'text-emerald-600' : 'text-amber-600'}`}>
                            ({ord.paymentStatus})
                          </span>
                        </div>
                        <div className="flex items-center gap-4">
                          <div>
                            <span className="text-slate-500">Total: </span>
                            <span className="font-extrabold text-sm text-[#111827]">৳{ord.total.toLocaleString()}</span>
                          </div>
                          <button
                            onClick={() => onNavigate('tracking', ord.orderNumber)}
                            className="font-bold text-[#F15A24] hover:underline flex items-center gap-1"
                          >
                            <span>Live Track</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
