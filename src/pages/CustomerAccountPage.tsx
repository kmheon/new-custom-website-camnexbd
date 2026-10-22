import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Package,
  Clock,
  ShieldCheck,
  MapPin,
  FileText,
  LogOut,
  ArrowRight,
  CheckCircle2,
  Lock,
  Phone as PhoneIcon,
  Mail,
  Smartphone,
  AlertCircle,
  Info,
  X,
  KeyRound,
  RefreshCw,
  ShieldAlert,
  User,
  Heart,
  Plus,
  Trash2,
  Edit3,
  Truck,
  Building2,
  ExternalLink,
  ChevronRight,
  Calendar,
  CreditCard,
  Check,
  ShoppingBag,
  SlidersHorizontal,
  Search,
  Home
} from 'lucide-react';
import { SEO } from '../components/common/SEO';
import { Breadcrumbs, Button, Badge } from '../components/common/UI';
import { TurnstileWidget } from '../components/common/TurnstileWidget';
import { CustomerVerificationModal } from '../components/common/CustomerVerificationModal';
import { useCustomerAuthStore, useWishlistStore, useCartStore, AuthProvidersStatus } from '../store';
import { Order, Address, Product } from '../types';
import { BANGLADESH_DISTRICTS, DISTRICT_NAMES, getThanasForDistrict } from '../data/bangladeshLocations';

interface CustomerAccountPageProps {
  onNavigate: (route: string, param?: string) => void;
}

type DashboardSection = 'overview' | 'orders' | 'profile' | 'addresses' | 'wishlist' | 'security';

export const CustomerAccountPage: React.FC<CustomerAccountPageProps> = ({ onNavigate }) => {
  const {
    currentCustomer,
    isCustomerAuthenticated,
    checkCustomerAuth,
    getProvidersStatus,
    providersStatus,
    login,
    register,
    sendOtp,
    verifyOtp,
    logout,
    fetchMyOrders,
    updateProfile,
    fetchAddresses,
    addAddress,
    updateAddress,
    deleteAddress,
    setDefaultAddress,
    getSecurityInfo,
    changePassword,
    isLoading,
    error: storeError
  } = useCustomerAuthStore();

  const { wishlistProducts, loadWishlist, removeFromWishlist } = useWishlistStore();
  const { addItem: addToCart } = useCartStore();

  const [authChecked, setAuthChecked] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authMethod, setAuthMethod] = useState<'password' | 'otp'>('password');
  const [activeSection, setActiveSection] = useState<DashboardSection>('overview');

  // Form states for login/register
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const [regName, setRegName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');

  // Phone OTP states
  const [otpPhone, setOtpPhone] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpCountdown, setOtpCountdown] = useState(0);
  const [otpFeedback, setOtpFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // URL Feedback & Alert states
  const [urlMessage, setUrlMessage] = useState<{ type: 'success' | 'error' | 'info'; title: string; text: string } | null>(null);

  // Unconfigured provider setup dialog state
  const [setupNotice, setSetupNotice] = useState<{
    provider: string;
    title: string;
    message: string;
    envKeys: string[];
  } | null>(null);

  // Orders state & filters
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('all');
  const [orderSearchTerm, setOrderSearchTerm] = useState<string>('');

  // Verification & CAPTCHA states
  const [verificationModalOpen, setVerificationModalOpen] = useState(false);
  const [verificationMethod, setVerificationMethod] = useState<'email' | 'phone'>('phone');
  const [isNoticeDismissed, setIsNoticeDismissed] = useState(false);
  const [loginCaptchaToken, setLoginCaptchaToken] = useState('');
  const [registerCaptchaToken, setRegisterCaptchaToken] = useState('');
  const [otpCaptchaToken, setOtpCaptchaToken] = useState('');

  // Profile Edit state
  const [editName, setEditName] = useState('');
  const [editCompanyName, setEditCompanyName] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileFeedback, setProfileFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Address Modal state
  const [addressModalOpen, setAddressModalOpen] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [addrLabel, setAddrLabel] = useState('Home');
  const [addrRecipientName, setAddrRecipientName] = useState('');
  const [addrRecipientPhone, setAddrRecipientPhone] = useState('');
  const [addrLine, setAddrLine] = useState('');
  const [addrDistrict, setAddrDistrict] = useState('Dhaka');
  const [addrThana, setAddrThana] = useState('');
  const [addrArea, setAddrArea] = useState('');
  const [addrPostalCode, setAddrPostalCode] = useState('');
  const [addrIsDefault, setAddrIsDefault] = useState(false);
  const [addressSaving, setAddressSaving] = useState(false);
  const [addressError, setAddressError] = useState('');

  // Security & Password state
  const [securityInfo, setSecurityInfo] = useState<{ hasPassword: boolean; googleLinked: boolean; googleEmail: string | null } | null>(null);
  const [currPassword, setCurrPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordFeedback, setPasswordFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const isCustomerVerified = Boolean(
    currentCustomer?.email_verified ||
    currentCustomer?.phone_verified ||
    currentCustomer?.emailVerified ||
    currentCustomer?.phoneVerified
  );

  const availableMethodText = currentCustomer?.email && currentCustomer?.phone
    ? 'Email Code & SMS OTP'
    : currentCustomer?.email
    ? 'Email Verification Code'
    : currentCustomer?.phone
    ? 'SMS OTP'
    : 'Provide phone or email to verify';

  const loadOrders = useCallback(async () => {
    setLoadingOrders(true);
    try {
      const myOrders = await fetchMyOrders();
      setOrders(Array.isArray(myOrders) ? myOrders : []);
    } catch (e) {
      console.error('Failed to load customer orders:', e);
    } finally {
      setLoadingOrders(false);
    }
  }, [fetchMyOrders]);

  // Initial authentication & URL state check
  useEffect(() => {
    checkCustomerAuth().finally(() => setAuthChecked(true));
    getProvidersStatus();

    // Check URL parameters for OAuth callbacks or error states
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const err = params.get('error');
      const loginSuccess = params.get('login_success');
      const linked = params.get('linked');
      const newAccount = params.get('new_account');
      const emailVerified = params.get('email_verified');
      const tabParam = params.get('tab') as DashboardSection | null;

      if (tabParam && ['overview', 'orders', 'profile', 'addresses', 'wishlist', 'security'].includes(tabParam)) {
        setActiveSection(tabParam);
      }

      if (emailVerified === '1') {
        setUrlMessage({
          type: 'success',
          title: 'Email Address Verified',
          text: 'Your email address has been successfully verified! You are now eligible for instant order checkout.'
        });
      } else if (err) {
        if (err === 'google_not_configured') {
          setUrlMessage({
            type: 'info',
            title: 'Google Sign-In Requires Setup',
            text: 'Google OAuth is not configured on this server yet. The site owner needs to supply GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET. Please sign in with your email or phone and password.'
          });
        } else if (err === 'apple_not_configured') {
          setUrlMessage({
            type: 'info',
            title: 'Apple Sign-In Deferred',
            text: 'Apple Sign-In is currently deferred and not enabled. Please sign in with your email or phone and password.'
          });
        } else if (err === 'oauth_cancelled') {
          setUrlMessage({
            type: 'info',
            title: 'Sign-In Cancelled',
            text: 'Sign-in with your external account was cancelled. You can try again or use your password.'
          });
        } else if (err === 'oauth_email_unverified') {
          setUrlMessage({
            type: 'error',
            title: 'Unverified Email Address',
            text: 'Your social account email is not verified by the provider. For your security, CamneX does not link unverified accounts.'
          });
        } else if (err === 'oauth_invalid_state') {
          setUrlMessage({
            type: 'error',
            title: 'Session Expired',
            text: 'The authentication session timed out or was invalid. Please try signing in again.'
          });
        } else {
          setUrlMessage({
            type: 'error',
            title: 'Authentication Notice',
            text: `Sign-in could not be completed (${err}). Please try again or use email/password.`
          });
        }
      } else if (loginSuccess === '1') {
        if (linked) {
          setUrlMessage({
            type: 'success',
            title: 'Account Linked Successfully',
            text: `Your ${linked === 'google' ? 'Google' : 'Apple'} account has been safely connected to your verified CamneX profile.`
          });
        } else if (newAccount === '1') {
          setUrlMessage({
            type: 'success',
            title: 'Welcome to CamneX Bangladesh!',
            text: 'Your new customer account has been created successfully.'
          });
        }
      }

      // Clean URL params without page reload
      if (err || loginSuccess || emailVerified) {
        const cleanUrl = window.location.pathname;
        window.history.replaceState({}, document.title, cleanUrl);
      }
    }
  }, [checkCustomerAuth, getProvidersStatus]);

  // Load customer data when authenticated
  useEffect(() => {
    if (isCustomerAuthenticated) {
      loadOrders();
      fetchAddresses();
      loadWishlist(true);
      getSecurityInfo().then(info => setSecurityInfo(info));
    }
  }, [isCustomerAuthenticated, loadOrders, fetchAddresses, loadWishlist, getSecurityInfo]);

  // Sync profile form when currentCustomer changes
  useEffect(() => {
    if (currentCustomer) {
      setEditName(currentCustomer.name || '');
      setEditCompanyName(currentCustomer.companyName || '');
    }
  }, [currentCustomer]);

  // Countdown timer for OTP resend
  useEffect(() => {
    if (otpCountdown <= 0) return;
    const timer = setInterval(() => {
      setOtpCountdown((c) => Math.max(0, c - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [otpCountdown]);

  // Available thanas for selected district in address modal
  const availableThanas = useMemo(() => {
    return getThanasForDistrict(addrDistrict);
  }, [addrDistrict]);

  // Filtered orders
  const filteredOrders = useMemo(() => {
    return orders.filter(ord => {
      const matchesStatus = orderStatusFilter === 'all' || ord.status.toLowerCase() === orderStatusFilter.toLowerCase();
      const matchesSearch = !orderSearchTerm.trim() ||
        ord.orderNumber.toLowerCase().includes(orderSearchTerm.toLowerCase()) ||
        ord.items.some(it => it.name.toLowerCase().includes(orderSearchTerm.toLowerCase()));
      return matchesStatus && matchesSearch;
    });
  }, [orders, orderStatusFilter, orderSearchTerm]);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginIdentifier || !loginPassword) return;
    if (!loginCaptchaToken) {
      setUrlMessage({
        type: 'error',
        title: 'Security Verification Required',
        text: 'Please complete the Cloudflare security verification challenge before signing in.'
      });
      return;
    }
    const ok = await login(loginIdentifier, loginPassword, loginCaptchaToken);
    if (ok) {
      setLoginPassword('');
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName.trim() || !regPassword.trim()) return;
    if (!regPhone.trim() && !regEmail.trim()) {
      setUrlMessage({
        type: 'error',
        title: 'Contact Required',
        text: 'Please provide either a phone number or an email address to register.'
      });
      return;
    }
    if (!registerCaptchaToken) {
      setUrlMessage({
        type: 'error',
        title: 'Security Verification Required',
        text: 'Please complete the Cloudflare security verification challenge before creating an account.'
      });
      return;
    }
    const ok = await register(regName.trim(), regPhone.trim(), regPassword.trim(), regEmail.trim(), registerCaptchaToken);
    if (ok) {
      setRegPassword('');
    }
  };

  const handleGoogleClick = () => {
    if (providersStatus?.google?.configured) {
      window.location.href = '/api/auth/oauth/google';
    } else {
      setSetupNotice({
        provider: 'Google',
        title: 'Google Sign-In Requires Setup',
        message: 'Google OAuth credentials (GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET) have not been configured on this server yet. Once the site owner supplies these in the server environment (.env), customers will be able to sign in seamlessly with one click.',
        envKeys: ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET']
      });
    }
  };

  const handleAppleClick = () => {
    setSetupNotice({
      provider: 'Apple',
      title: 'Apple Sign-In is Deferred',
      message: 'Apple Sign-In is planned for a future update and is currently deferred. Please sign in with your email or mobile phone and password.',
      envKeys: ['APPLE_CLIENT_ID', 'APPLE_TEAM_ID', 'APPLE_KEY_ID', 'APPLE_PRIVATE_KEY']
    });
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpPhone.trim()) return;
    setOtpFeedback(null);

    const res = await sendOtp(otpPhone.trim(), otpCaptchaToken);
    if (res.success) {
      setOtpSent(true);
      setOtpCountdown(60);
      setOtpFeedback({
        type: 'success',
        message: res.message || 'Verification code sent to your phone.'
      });
    } else {
      setOtpFeedback({
        type: 'error',
        message: res.error || 'Failed to send OTP code.'
      });
      if (res.configured === false) {
        setSetupNotice({
          provider: 'SMS Gateway',
          title: 'SMS Gateway Not Configured',
          message: 'Phone number OTP verification requires SMS gateway credentials in the server environment (.env). The site owner must supply SMS_GATEWAY_PROVIDER and SMS_API_KEY to dispatch live verification text messages in Bangladesh.',
          envKeys: ['SMS_GATEWAY_PROVIDER', 'SMS_API_KEY', 'SMS_SENDER_ID']
        });
      }
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpPhone.trim() || !otpCode.trim()) return;
    setOtpFeedback(null);

    const ok = await verifyOtp(otpPhone.trim(), otpCode.trim());
    if (!ok) {
      setOtpFeedback({
        type: 'error',
        message: storeError || 'Invalid or expired verification code. Please check and try again.'
      });
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) {
      setProfileFeedback({ type: 'error', message: 'Full name cannot be empty.' });
      return;
    }
    setProfileSaving(true);
    setProfileFeedback(null);
    const res = await updateProfile({
      name: editName.trim(),
      companyName: editCompanyName.trim()
    });
    setProfileSaving(false);
    if (res.success) {
      setProfileFeedback({ type: 'success', message: 'Profile information updated successfully.' });
    } else {
      setProfileFeedback({ type: 'error', message: res.error || 'Failed to update profile.' });
    }
  };

  const openAddressModal = (address?: Address) => {
    setAddressError('');
    if (address) {
      setEditingAddressId(address.id);
      setAddrLabel(address.label || 'Home');
      setAddrRecipientName(address.recipientName || currentCustomer?.name || '');
      setAddrRecipientPhone(address.recipientPhone || currentCustomer?.phone || '');
      setAddrLine(address.addressLine || '');
      setAddrDistrict(address.district || 'Dhaka');
      setAddrThana(address.thana || '');
      setAddrArea(address.area || '');
      setAddrPostalCode(address.postalCode || '');
      setAddrIsDefault(Boolean(address.isDefault));
    } else {
      setEditingAddressId(null);
      setAddrLabel('Home');
      setAddrRecipientName(currentCustomer?.name || '');
      setAddrRecipientPhone(currentCustomer?.phone || '');
      setAddrLine('');
      setAddrDistrict('Dhaka');
      setAddrThana('');
      setAddrArea('');
      setAddrPostalCode('');
      setAddrIsDefault((currentCustomer?.addresses || []).length === 0);
    }
    setAddressModalOpen(true);
  };

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addrLine.trim() || !addrDistrict.trim() || !addrRecipientName.trim() || !addrRecipientPhone.trim()) {
      setAddressError('Please fill in all required address and recipient fields.');
      return;
    }
    setAddressSaving(true);
    setAddressError('');

    const payload: Partial<Address> = {
      label: addrLabel,
      recipientName: addrRecipientName.trim(),
      recipientPhone: addrRecipientPhone.trim(),
      addressLine: addrLine.trim(),
      district: addrDistrict.trim(),
      thana: addrThana.trim(),
      area: addrArea.trim(),
      city: addrDistrict.trim(),
      postalCode: addrPostalCode.trim(),
      isDefault: addrIsDefault
    };

    let res;
    if (editingAddressId) {
      res = await updateAddress(editingAddressId, payload);
    } else {
      res = await addAddress(payload);
    }
    setAddressSaving(false);

    if (res.success) {
      setAddressModalOpen(false);
    } else {
      setAddressError(res.error || 'Failed to save address.');
    }
  };

  const handleDeleteAddress = async (id: string) => {
    if (!confirm('Are you sure you want to delete this delivery address?')) return;
    await deleteAddress(id);
  };

  const handleSetDefaultAddress = async (id: string) => {
    await setDefaultAddress(id);
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      setPasswordFeedback({ type: 'error', message: 'New password must be at least 6 characters.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordFeedback({ type: 'error', message: 'New passwords do not match.' });
      return;
    }
    if (securityInfo?.hasPassword && !currPassword) {
      setPasswordFeedback({ type: 'error', message: 'Please enter your current password.' });
      return;
    }

    setPasswordSaving(true);
    setPasswordFeedback(null);
    const res = await changePassword(currPassword, newPassword);
    setPasswordSaving(false);

    if (res.success) {
      setPasswordFeedback({ type: 'success', message: 'Your password has been changed securely.' });
      setCurrPassword('');
      setNewPassword('');
      setConfirmPassword('');
      getSecurityInfo().then(info => setSecurityInfo(info));
    } else {
      setPasswordFeedback({ type: 'error', message: res.error || 'Failed to update password.' });
    }
  };

  const triggerVerification = (method: 'email' | 'phone') => {
    setVerificationMethod(method);
    setVerificationModalOpen(true);
  };

  if (!authChecked) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center p-6">
        <div className="flex items-center gap-3 text-slate-500 text-sm font-medium">
          <div className="w-5 h-5 border-2 border-[#F15A24] border-t-transparent rounded-full animate-spin" />
          <span>Connecting to your CamneX account...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF7F2] pb-16">
      <SEO
        title={isCustomerAuthenticated ? 'Customer Dashboard | CamneX Bangladesh' : 'Customer Sign In & Registration | CamneX Bangladesh'}
        description="Manage your CamneX Bangladesh security and surveillance hardware orders, addresses, and verified profile."
        noIndex={true}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <Breadcrumbs
          items={[
            { label: 'Home', href: '/' },
            { label: 'Customer Account', href: '/account' },
            ...(isCustomerAuthenticated ? [{ label: activeSection.charAt(0).toUpperCase() + activeSection.slice(1) }] : [])
          ]}
        />

        {/* Global Feedback Banner */}
        {urlMessage && (
          <div
            className={`mt-4 p-4 rounded-2xl border flex items-start justify-between gap-3 shadow-xs animate-in fade-in duration-200 ${
              urlMessage.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                : urlMessage.type === 'error'
                ? 'bg-rose-50 border-rose-200 text-rose-950'
                : 'bg-sky-50 border-sky-200 text-sky-950'
            }`}
          >
            <div className="flex items-start gap-3">
              {urlMessage.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />}
              {urlMessage.type === 'error' && <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />}
              {urlMessage.type === 'info' && <Info className="w-5 h-5 text-sky-600 shrink-0 mt-0.5" />}
              <div>
                <h4 className="text-sm font-bold">{urlMessage.title}</h4>
                <p className="text-xs mt-0.5 leading-relaxed opacity-90">{urlMessage.text}</p>
              </div>
            </div>
            <button
              onClick={() => setUrlMessage(null)}
              className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              aria-label="Dismiss alert"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {!isCustomerAuthenticated ? (
          /* ================================================================= */
          /* UNAUTHENTICATED: LOGIN & REGISTRATION CARD                        */
          /* ================================================================= */
          <div className="mt-8 max-w-md mx-auto bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xl">
            {/* Header branding */}
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-orange-50 text-[#F15A24] mb-3 border border-orange-100">
                <Lock className="w-6 h-6" />
              </div>
              <h1 className="text-xl font-bold font-heading text-[#111827]">
                {authMode === 'login' ? 'Sign In to Your Account' : 'Create Customer Account'}
              </h1>
              <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                {authMode === 'login'
                  ? 'Access your private orders, saved delivery addresses, and verified warranty tracking.'
                  : 'Register for priority dispatch, automated invoices, and verified hardware coverage.'}
              </p>
            </div>

            {/* Mode Switcher Tabs */}
            <div className="flex p-1 bg-slate-100 rounded-xl mb-6">
              <button
                type="button"
                onClick={() => {
                  setAuthMode('login');
                  setAuthMethod('password');
                }}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                  authMode === 'login' ? 'bg-white text-[#111827] shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => setAuthMode('register')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                  authMode === 'register' ? 'bg-white text-[#111827] shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Register
              </button>
            </div>

            {/* Social OAuth Providers */}
            <div className="space-y-2.5 mb-6">
              <button
                type="button"
                onClick={handleGoogleClick}
                className="w-full flex items-center justify-center gap-3 px-4 py-2.5 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 transition shadow-xs cursor-pointer"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>Continue with Google</span>
              </button>

              <button
                type="button"
                onClick={handleAppleClick}
                className="w-full flex items-center justify-center gap-3 px-4 py-2.5 bg-black hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer opacity-90"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 170 170">
                  <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.7-3.04-7.58-7.71-11.65-14-5.32-8.36-9.67-17.76-13.06-28.18-3.38-10.42-5.08-20.47-5.08-30.15 0-13.88 3.55-25.5 10.66-34.85 7.1-9.35 16.03-14.12 26.79-14.32 4.47 0 9.4 1.13 14.78 3.39 5.39 2.26 9.24 3.45 11.55 3.58 2.53-.13 6.64-1.39 12.33-3.77 5.69-2.38 10.45-3.41 14.28-3.09 10.87.67 19.53 4.54 25.98 11.6-9.52 5.76-14.16 13.8-13.91 24.12.25 8.1 3.27 14.86 9.07 20.27 5.8 5.41 12.63 8.37 20.49 8.89-2.31 7.21-5.39 14.36-9.24 21.44zM119.22 31.84c0-6.19 2.22-12.02 6.65-17.51 4.44-5.49 9.87-8.99 16.3-10.51.78 6.41-1.18 12.28-5.88 17.62-4.7 5.34-10.4 8.78-17.07 10.4z" />
                </svg>
                <span>Continue with Apple (Deferred)</span>
              </button>
            </div>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-white px-3 text-slate-400 font-medium">Or continue with</span>
              </div>
            </div>

            {/* Error Message */}
            {storeError && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{storeError}</span>
              </div>
            )}

            {authMode === 'login' ? (
              authMethod === 'password' ? (
                /* Password Login Form */
                <form onSubmit={handleLoginSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Mobile Phone or Email</label>
                    <input
                      type="text"
                      required
                      data-testid="login-identifier-input"
                      value={loginIdentifier}
                      onChange={(e) => setLoginIdentifier(e.target.value)}
                      placeholder="e.g. 01711000000 or name@example.com"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-[#F15A24] focus:bg-white transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Password</label>
                    <input
                      type="password"
                      required
                      data-testid="login-password-input"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-[#F15A24] focus:bg-white transition-all"
                    />
                  </div>

                  <TurnstileWidget
                    action="login"
                    onVerify={(token) => setLoginCaptchaToken(token)}
                    onError={() => setLoginCaptchaToken('')}
                    onExpire={() => setLoginCaptchaToken('')}
                    className="py-1"
                  />

                  <Button
                    type="submit"
                    variant="primary"
                    fullWidth
                    loading={isLoading}
                    data-testid="login-submit-button"
                    className="mt-2"
                  >
                    Sign In to Account
                  </Button>

                  <div className="pt-2 flex items-center justify-between text-xs">
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMethod('otp');
                        setOtpPhone(loginIdentifier);
                        setOtpFeedback(null);
                      }}
                      className="text-slate-600 hover:text-[#F15A24] font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Smartphone className="w-3.5 h-3.5 text-[#F15A24]" />
                      <span>Sign in with Phone SMS OTP</span>
                    </button>
                  </div>
                </form>
              ) : (
                /* Phone OTP Login Form */
                <form onSubmit={otpSent ? handleVerifyOtp : handleSendOtp} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Mobile Phone Number</label>
                    <input
                      type="tel"
                      required
                      disabled={otpSent}
                      value={otpPhone}
                      onChange={(e) => setOtpPhone(e.target.value)}
                      placeholder="e.g. 01711000000"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-[#F15A24] focus:bg-white transition-all disabled:opacity-60"
                    />
                  </div>

                  {!otpSent && (
                    <TurnstileWidget
                      action="otp_send"
                      onVerify={(token) => setOtpCaptchaToken(token)}
                      onError={() => setOtpCaptchaToken('')}
                      onExpire={() => setOtpCaptchaToken('')}
                      className="py-1"
                    />
                  )}

                  {otpSent && (
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-bold text-slate-700">6-Digit Verification Code</label>
                        {otpCountdown > 0 ? (
                          <span className="text-[11px] text-slate-400 font-mono">Resend in {otpCountdown}s</span>
                        ) : (
                          <button
                            type="button"
                            onClick={handleSendOtp}
                            className="text-[11px] text-[#F15A24] font-bold hover:underline"
                          >
                            Resend Code
                          </button>
                        )}
                      </div>
                      <input
                        type="text"
                        required
                        maxLength={6}
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                        placeholder="123456"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-center text-lg font-mono font-bold tracking-widest focus:outline-none focus:border-[#F15A24] focus:bg-white transition-all"
                      />
                    </div>
                  )}

                  {otpFeedback && (
                    <div className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                      otpFeedback.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
                    }`}>
                      {otpFeedback.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" /> : <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />}
                      <span>{otpFeedback.message}</span>
                    </div>
                  )}

                  <Button
                    type="submit"
                    variant="primary"
                    fullWidth
                    loading={isLoading}
                    className="mt-2"
                  >
                    {otpSent ? 'Verify Code & Sign In' : 'Send Verification OTP'}
                  </Button>

                  <div className="pt-2 flex items-center justify-between text-xs">
                    <button
                      type="button"
                      onClick={() => setAuthMethod('password')}
                      className="text-slate-600 hover:text-[#F15A24] font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Lock className="w-3.5 h-3.5 text-slate-500" />
                      <span>Use Password Instead</span>
                    </button>
                  </div>
                </form>
              )
            ) : (
              /* Registration Form */
              <form onSubmit={handleRegisterSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    data-testid="register-name-input"
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
                    data-testid="register-phone-input"
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
                    data-testid="register-email-input"
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
                    data-testid="register-password-input"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Minimum 6 characters"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-[#F15A24] focus:bg-white transition-all"
                  />
                </div>

                <TurnstileWidget
                  action="register"
                  onVerify={(token) => setRegisterCaptchaToken(token)}
                  onError={() => setRegisterCaptchaToken('')}
                  onExpire={() => setRegisterCaptchaToken('')}
                  className="py-1"
                />

                <Button
                  type="submit"
                  variant="primary"
                  fullWidth
                  loading={isLoading}
                  data-testid="register-submit-button"
                  className="mt-2"
                >
                  Create Account
                </Button>
              </form>
            )}

            {/* Guest order tracking link */}
            <div className="mt-6 pt-5 border-t border-slate-100 text-center">
              <span className="text-xs text-slate-500">Already placed an order as guest? </span>
              <button
                onClick={() => onNavigate('tracking')}
                className="text-xs text-[#F15A24] font-bold hover:underline cursor-pointer"
              >
                Track by Order Number
              </button>
            </div>
          </div>
        ) : (
          /* ================================================================= */
          /* AUTHENTICATED: COMPLETE CUSTOMER ACCOUNT DASHBOARD               */
          /* ================================================================= */
          <div className="mt-6">
            {/* Top Verification Alert Banner if unverified */}
            {!isCustomerVerified && !isNoticeDismissed && (
              <div
                className="mb-6 bg-amber-50 border border-amber-200 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                data-testid="profile-verification-card"
              >
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 border border-amber-200">
                    <ShieldAlert className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-amber-950 text-sm">Account Verification Required</h3>
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-amber-200/80 text-amber-900 rounded-md">
                        Action Required
                      </span>
                    </div>
                    <p className="text-xs text-amber-800 mt-0.5">
                      Verify your mobile phone or email address to finalize orders and activate hardware warranty registration.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 self-end sm:self-auto shrink-0">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => triggerVerification(currentCustomer?.phone ? 'phone' : 'email')}
                    className="bg-[#F15A24] hover:bg-[#D94D1C] text-xs font-bold shadow-xs"
                    data-testid="profile-verify-now-btn"
                  >
                    Verify Now <ArrowRight className="w-3.5 h-3.5 ml-1 inline" />
                  </Button>
                  <button
                    type="button"
                    onClick={() => setIsNoticeDismissed(true)}
                    className="text-amber-600 hover:text-amber-900 p-1.5 rounded-lg cursor-pointer"
                    title="Dismiss notification"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Mobile Navigation Tabs */}
            <div className="lg:hidden mb-6 flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
              {[
                { id: 'overview' as const, label: 'Overview', icon: <Home className="w-4 h-4" /> },
                { id: 'orders' as const, label: `Orders (${orders.length})`, icon: <Package className="w-4 h-4" /> },
                { id: 'profile' as const, label: 'Profile', icon: <User className="w-4 h-4" /> },
                { id: 'addresses' as const, label: `Addresses (${(currentCustomer?.addresses || []).length})`, icon: <MapPin className="w-4 h-4" /> },
                { id: 'wishlist' as const, label: `Wishlist (${wishlistProducts.length})`, icon: <Heart className="w-4 h-4" /> },
                { id: 'security' as const, label: 'Security', icon: <Lock className="w-4 h-4" /> }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveSection(tab.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                    activeSection === tab.id
                      ? 'bg-[#F15A24] text-white shadow-xs'
                      : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Desktop Dashboard Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left Sidebar Navigation */}
              <div className="hidden lg:block lg:col-span-3 space-y-4 sticky top-24">
                {/* Profile Card */}
                <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
                  <div className="flex items-center gap-3.5 pb-4 border-b border-slate-100">
                    <div className="w-12 h-12 rounded-2xl bg-[#0F172A] text-white flex items-center justify-center font-bold text-lg shadow-xs shrink-0">
                      {currentCustomer?.name ? currentCustomer.name[0].toUpperCase() : 'C'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h2 className="font-bold text-sm text-[#111827] truncate">
                        {currentCustomer?.name || 'Customer'}
                      </h2>
                      <p className="text-[11px] text-slate-500 font-mono truncate">
                        {currentCustomer?.phone || currentCustomer?.email || 'CamneX Member'}
                      </p>
                    </div>
                  </div>

                  <div className="pt-3 flex items-center justify-between text-[11px]">
                    <span className="text-slate-500 font-medium">Verification Status:</span>
                    {isCustomerVerified ? (
                      <span className="text-emerald-700 font-bold flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Verified
                      </span>
                    ) : (
                      <span className="text-amber-700 font-bold flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                        <AlertCircle className="w-3 h-3 text-amber-600" /> Action Required
                      </span>
                    )}
                  </div>
                </div>

                {/* Navigation Menu */}
                <nav className="bg-white p-2.5 rounded-3xl border border-slate-200 shadow-xs space-y-1">
                  {[
                    { id: 'overview' as const, label: 'Overview', icon: <Home className="w-4 h-4" /> },
                    { id: 'orders' as const, label: 'My Orders', icon: <Package className="w-4 h-4" />, badge: orders.length },
                    { id: 'profile' as const, label: 'Profile Information', icon: <User className="w-4 h-4" /> },
                    { id: 'addresses' as const, label: 'Saved Addresses', icon: <MapPin className="w-4 h-4" />, badge: (currentCustomer?.addresses || []).length },
                    { id: 'wishlist' as const, label: 'Saved Wishlist', icon: <Heart className="w-4 h-4" />, badge: wishlistProducts.length },
                    { id: 'security' as const, label: 'Security & Login', icon: <Lock className="w-4 h-4" /> }
                  ].map((item) => {
                    const isActive = activeSection === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => setActiveSection(item.id)}
                        className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold transition cursor-pointer ${
                          isActive
                            ? 'bg-orange-50 text-[#F15A24] border border-orange-200 shadow-2xs'
                            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-transparent'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span className={isActive ? 'text-[#F15A24]' : 'text-slate-400'}>{item.icon}</span>
                          <span>{item.label}</span>
                        </div>
                        {typeof item.badge === 'number' && item.badge > 0 && (
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            isActive ? 'bg-[#F15A24] text-white' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {item.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}

                  <div className="pt-2 border-t border-slate-100 mt-2">
                    <button
                      type="button"
                      data-testid="logout-button"
                      onClick={async () => {
                        await logout();
                        setAuthMode('login');
                      }}
                      className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl text-xs font-bold text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </nav>
              </div>

              {/* Main Content Area */}
              <div className="lg:col-span-9 space-y-6">

                {/* =========================================================== */}
                {/* 1. OVERVIEW SECTION                                         */}
                {/* =========================================================== */}
                {activeSection === 'overview' && (
                  <div className="space-y-6 animate-in fade-in duration-150">
                    {/* Welcome Banner */}
                    <div className="bg-gradient-to-r from-[#0F172A] to-slate-800 rounded-3xl p-6 sm:p-8 text-white shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-[#F15A24]" />
                          <span className="text-xs uppercase font-bold tracking-wider text-orange-400 font-mono">
                            Verified Customer Account
                          </span>
                        </div>
                        <h1 className="text-xl sm:text-2xl font-bold font-heading mt-1">
                          Welcome back, {currentCustomer?.name?.split(' ')[0] || 'Valued Customer'}!
                        </h1>
                        <p className="text-xs text-slate-300 mt-1 max-w-lg leading-relaxed">
                          Monitor dispatch timelines, review warranty coverage, update verified contact methods, and organize job site delivery addresses.
                        </p>
                      </div>

                      <div className="flex items-center gap-3 self-start sm:self-center shrink-0">
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => onNavigate('catalog')}
                          className="bg-[#F15A24] hover:bg-[#D94D1C] text-xs font-bold shadow-md"
                        >
                          <ShoppingBag className="w-3.5 h-3.5 mr-1.5" />
                          Explore Products
                        </Button>
                      </div>
                    </div>

                    {/* KPI Summary Cards */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <div
                        onClick={() => setActiveSection('orders')}
                        className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs hover:border-orange-300 transition cursor-pointer group"
                      >
                        <div className="w-9 h-9 rounded-xl bg-orange-50 text-[#F15A24] flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                          <Package className="w-4 h-4" />
                        </div>
                        <span className="text-2xl font-black text-[#111827] block font-heading">{orders.length}</span>
                        <span className="text-xs text-slate-500 font-medium">Total Orders</span>
                      </div>

                      <div
                        onClick={() => setActiveSection('addresses')}
                        className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs hover:border-orange-300 transition cursor-pointer group"
                      >
                        <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                          <MapPin className="w-4 h-4" />
                        </div>
                        <span className="text-2xl font-black text-[#111827] block font-heading">
                          {(currentCustomer?.addresses || []).length}
                        </span>
                        <span className="text-xs text-slate-500 font-medium">Saved Addresses</span>
                      </div>

                      <div
                        onClick={() => setActiveSection('wishlist')}
                        className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs hover:border-orange-300 transition cursor-pointer group"
                      >
                        <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                          <Heart className="w-4 h-4" />
                        </div>
                        <span className="text-2xl font-black text-[#111827] block font-heading">
                          {wishlistProducts.length}
                        </span>
                        <span className="text-xs text-slate-500 font-medium">Wishlist Items</span>
                      </div>

                      <div
                        onClick={() => setActiveSection('profile')}
                        className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs hover:border-orange-300 transition cursor-pointer group"
                      >
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 group-hover:scale-105 transition-transform ${
                          isCustomerVerified ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                        }`}>
                          {isCustomerVerified ? <ShieldCheck className="w-4 h-4" /> : <ShieldAlert className="w-4 h-4" />}
                        </div>
                        <span className={`text-xs font-bold block ${isCustomerVerified ? 'text-emerald-700' : 'text-amber-700'}`}>
                          {isCustomerVerified ? 'Account Verified' : 'Action Required'}
                        </span>
                        <span className="text-xs text-slate-500 font-medium">Order Clearance</span>
                      </div>
                    </div>

                    {/* Quick Actions Bar */}
                    <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
                      <span className="text-xs font-bold text-slate-700">Quick Dashboard Actions:</span>
                      <div className="flex flex-wrap items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setActiveSection('orders')}
                          className="text-xs"
                        >
                          <Package className="w-3.5 h-3.5 mr-1" />
                          View All Orders
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setActiveSection('profile')}
                          className="text-xs"
                        >
                          <User className="w-3.5 h-3.5 mr-1" />
                          Edit Profile
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openAddressModal()}
                          className="text-xs"
                        >
                          <Plus className="w-3.5 h-3.5 mr-1" />
                          Add Address
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onNavigate('tracking')}
                          className="text-xs"
                        >
                          <Truck className="w-3.5 h-3.5 mr-1" />
                          Live Tracking
                        </Button>
                      </div>
                    </div>

                    {/* Recent Orders Preview */}
                    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
                      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                        <div>
                          <h3 className="font-bold text-sm text-[#111827]">Recent Order Timeline</h3>
                          <p className="text-xs text-slate-500">Latest equipment orders associated with your profile</p>
                        </div>
                        {orders.length > 0 && (
                          <button
                            onClick={() => setActiveSection('orders')}
                            className="text-xs text-[#F15A24] font-bold hover:underline flex items-center gap-1 cursor-pointer"
                          >
                            <span>View All ({orders.length})</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      {loadingOrders ? (
                        <div className="py-8 text-center text-slate-400 text-xs">
                          <div className="w-5 h-5 border-2 border-[#F15A24] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                          Loading recent activity...
                        </div>
                      ) : orders.length === 0 ? (
                        <div className="py-8 text-center space-y-2">
                          <Package className="w-8 h-8 text-slate-300 mx-auto" />
                          <h4 className="text-xs font-bold text-slate-700">No Orders Placed Yet</h4>
                          <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                            When you order security cameras or access control systems, real-time invoices and tracking links appear here.
                          </p>
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => onNavigate('catalog')}
                            className="mt-2 text-xs"
                          >
                            Browse Products
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {orders.slice(0, 3).map((ord) => (
                            <div
                              key={ord.id}
                              className="p-4 rounded-2xl border border-slate-200/80 hover:border-slate-300 transition-colors bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                            >
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-mono font-bold text-slate-900">{ord.orderNumber}</span>
                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                                    ord.status === 'delivered'
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : ord.status === 'dispatched'
                                      ? 'bg-blue-100 text-blue-800'
                                      : 'bg-orange-100 text-orange-800'
                                  }`}>
                                    {ord.status}
                                  </span>
                                </div>
                                <p className="text-slate-500 text-[11px]">
                                  {new Date(ord.createdAt).toLocaleDateString()} · {ord.items.length} {ord.items.length === 1 ? 'item' : 'items'} · ৳{(ord.total || 0).toLocaleString()}
                                </p>
                              </div>

                              <div className="flex items-center gap-2 self-end sm:self-auto">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => onNavigate('tracking', ord.orderNumber)}
                                  className="text-xs py-1 h-8"
                                >
                                  <Truck className="w-3.5 h-3.5 mr-1 text-[#F15A24]" />
                                  Live Track
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* =========================================================== */}
                {/* 2. MY ORDERS SECTION                                        */}
                {/* =========================================================== */}
                {activeSection === 'orders' && (
                  <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-6 animate-in fade-in duration-150">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                      <div>
                        <h2 className="text-lg font-bold font-heading text-[#111827]">Order History & Dispatch</h2>
                        <p className="text-xs text-slate-500">Hardware orders, official invoices, and live courier tracking</p>
                      </div>
                      <span className="text-xs font-bold text-slate-400 font-mono">
                        {orders.length} {orders.length === 1 ? 'Total Order' : 'Total Orders'}
                      </span>
                    </div>

                    {/* Filter & Search Bar */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                        {['all', 'pending', 'confirmed', 'dispatched', 'delivered'].map((st) => (
                          <button
                            key={st}
                            type="button"
                            onClick={() => setOrderStatusFilter(st)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition capitalize cursor-pointer ${
                              orderStatusFilter === st
                                ? 'bg-[#0F172A] text-white'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            {st}
                          </button>
                        ))}
                      </div>

                      <div className="relative">
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={orderSearchTerm}
                          onChange={(e) => setOrderSearchTerm(e.target.value)}
                          placeholder="Search order number or item..."
                          className="w-full sm:w-60 pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-[#F15A24] focus:bg-white"
                        />
                      </div>
                    </div>

                    {loadingOrders ? (
                      <div className="py-12 text-center text-slate-400 text-xs">
                        <div className="w-6 h-6 border-2 border-[#F15A24] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                        Loading verified order records...
                      </div>
                    ) : filteredOrders.length === 0 ? (
                      <div className="py-12 text-center space-y-3">
                        <Package className="w-10 h-10 text-slate-300 mx-auto" />
                        <h3 className="text-sm font-bold text-slate-800">
                          {orders.length === 0 ? 'No orders placed yet' : 'No orders matching filter'}
                        </h3>
                        <p className="text-xs text-slate-500 max-w-sm mx-auto">
                          {orders.length === 0
                            ? 'When you finalize orders through checkout, your equipment records, delivery timeline, and warranty badges will be listed here.'
                            : 'Try adjusting your search criteria or status filter to locate your order.'}
                        </p>
                        {orders.length === 0 && (
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => onNavigate('catalog')}
                            className="mt-2"
                          >
                            Browse Storefront
                          </Button>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {filteredOrders.map((ord) => (
                          <div
                            key={ord.id}
                            className="p-5 sm:p-6 rounded-2xl border border-slate-200 hover:border-slate-300 transition-colors bg-slate-50/50 space-y-4"
                          >
                            {/* Card Header */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200/80">
                              <div className="flex items-center gap-3">
                                <div>
                                  <span className="text-[11px] text-slate-500 uppercase tracking-wider block font-medium">Invoice Number</span>
                                  <span className="font-mono font-bold text-sm text-[#111827]">{ord.orderNumber}</span>
                                </div>
                                <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                                  ord.status === 'delivered'
                                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                    : ord.status === 'dispatched'
                                    ? 'bg-blue-100 text-blue-800 border border-blue-200'
                                    : 'bg-orange-100 text-orange-800 border border-orange-200'
                                }`}>
                                  {ord.status}
                                </span>
                              </div>

                              <div className="flex items-center gap-3 text-xs text-slate-500">
                                <span className="flex items-center gap-1 font-mono">
                                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                  {new Date(ord.createdAt).toLocaleDateString()}
                                </span>
                                <span>·</span>
                                <span className="flex items-center gap-1">
                                  <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                                  <span className="font-semibold uppercase">{ord.paymentMethod?.replace('_', ' ')}</span>
                                  <span className={`font-bold ml-1 ${ord.paymentStatus === 'paid' ? 'text-emerald-600' : 'text-amber-600'}`}>
                                    ({ord.paymentStatus})
                                  </span>
                                </span>
                              </div>
                            </div>

                            {/* Itemized Hardware List */}
                            <div className="divide-y divide-slate-100 py-1">
                              {ord.items.map((it, idx) => (
                                <div key={idx} className="py-2.5 flex items-center justify-between text-xs">
                                  <div className="flex items-center gap-3 min-w-0 pr-4">
                                    <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center shrink-0">
                                      <Package className="w-4 h-4" />
                                    </div>
                                    <div className="truncate">
                                      <span className="font-semibold text-slate-900 block truncate">{it.name}</span>
                                      <span className="text-[11px] text-slate-500">
                                        Qty: {it.quantity} × ৳{it.unitPrice.toLocaleString()} {it.model ? `· Model: ${it.model}` : ''}
                                      </span>
                                    </div>
                                  </div>
                                  <span className="font-bold text-slate-900 shrink-0 font-mono">
                                    ৳{it.totalPrice.toLocaleString()}
                                  </span>
                                </div>
                              ))}
                            </div>

                            {/* Logistics & Courier Section (shown only when assigned) */}
                            {(ord.courierName || ord.trackingNumber) && (
                              <div className="p-3.5 bg-slate-100/80 rounded-xl border border-slate-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                <div className="flex items-center gap-2.5">
                                  <Truck className="w-4 h-4 text-[#F15A24] shrink-0" />
                                  <div>
                                    <span className="font-bold text-slate-800">
                                      {ord.courierName || 'Assigned Courier'}:
                                    </span>
                                    <span className="font-mono text-slate-600 ml-1.5 font-bold">
                                      {ord.trackingNumber}
                                    </span>
                                    {ord.shipmentStatus && (
                                      <span className="ml-2 text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded font-bold uppercase">
                                        {ord.shipmentStatus}
                                      </span>
                                    )}
                                  </div>
                                </div>

                                {ord.courierTrackingUrl && (
                                  <a
                                    href={ord.courierTrackingUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-[11px] text-[#F15A24] font-bold hover:underline flex items-center gap-1"
                                  >
                                    <span>External Courier Portal</span>
                                    <ExternalLink className="w-3 h-3" />
                                  </a>
                                )}
                              </div>
                            )}

                            {/* Card Footer: Delivery Destination & Tracking Action */}
                            <div className="pt-3 border-t border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                              <div className="text-slate-500 text-[11px] flex items-center gap-1.5">
                                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                <span>Destination: <strong className="text-slate-700">{ord.deliveryAddress}, {ord.deliveryCity}</strong></span>
                              </div>

                              <div className="flex items-center gap-4 self-end sm:self-auto">
                                <div>
                                  <span className="text-slate-500 text-xs mr-1.5">Grand Total:</span>
                                  <span className="font-extrabold text-base text-[#111827] font-mono">
                                    ৳{(ord.total || 0).toLocaleString()}
                                  </span>
                                </div>

                                <Button
                                  variant="primary"
                                  size="sm"
                                  onClick={() => onNavigate('tracking', ord.orderNumber)}
                                  className="text-xs py-1 h-8 bg-[#F15A24] hover:bg-[#D94D1C] shadow-xs"
                                >
                                  <Truck className="w-3.5 h-3.5 mr-1" />
                                  Live Tracking
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* =========================================================== */}
                {/* 3. PROFILE INFORMATION SECTION                              */}
                {/* =========================================================== */}
                {activeSection === 'profile' && (
                  <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-6 animate-in fade-in duration-150">
                    <div className="pb-4 border-b border-slate-100">
                      <h2 className="text-lg font-bold font-heading text-[#111827]">Customer Profile Information</h2>
                      <p className="text-xs text-slate-500">Update your verified identification and commercial details</p>
                    </div>

                    {profileFeedback && (
                      <div className={`p-4 rounded-2xl text-xs flex items-center gap-2.5 ${
                        profileFeedback.type === 'success'
                          ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                          : 'bg-rose-50 text-rose-900 border border-rose-200'
                      }`}>
                        {profileFeedback.type === 'success' ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                        )}
                        <span>{profileFeedback.message}</span>
                      </div>
                    )}

                    <form onSubmit={handleProfileSubmit} className="space-y-4 max-w-xl">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Full Customer Name</label>
                        <input
                          type="text"
                          required
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-[#F15A24] focus:bg-white"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Company / Organization (Optional)</label>
                        <input
                          type="text"
                          value={editCompanyName}
                          onChange={(e) => setEditCompanyName(e.target.value)}
                          placeholder="e.g. Acme Tech Solutions Ltd."
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-[#F15A24] focus:bg-white"
                        />
                      </div>

                      <div className="pt-2">
                        <Button
                          type="submit"
                          variant="primary"
                          size="sm"
                          loading={profileSaving}
                          className="bg-[#F15A24] hover:bg-[#D94D1C] text-xs font-bold shadow-xs"
                        >
                          Save Profile Changes
                        </Button>
                      </div>
                    </form>

                    {/* Contact Methods & Verification Card */}
                    <div className="pt-6 border-t border-slate-100">
                      <h3 className="text-sm font-bold text-slate-900 mb-1">Verified Contact Methods</h3>
                      <p className="text-xs text-slate-500 mb-4">
                        To maintain order integrity and warranty validation, contact verification is tracked separately for each channel.
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Phone Card */}
                        <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                              <PhoneIcon className="w-3.5 h-3.5 text-[#F15A24]" />
                              Mobile Phone
                            </span>
                            {(currentCustomer?.phone_verified || currentCustomer?.phoneVerified) ? (
                              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100/70 border border-emerald-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Verified
                              </span>
                            ) : (
                              <span className="text-[11px] font-bold text-amber-700 bg-amber-100/70 border border-amber-300 px-2 py-0.5 rounded-full">
                                ⚠️ Not Verified
                              </span>
                            )}
                          </div>

                          <div className="font-mono text-xs font-bold text-slate-800">
                            {currentCustomer?.phone || 'No phone number registered'}
                          </div>

                          {!(currentCustomer?.phone_verified || currentCustomer?.phoneVerified) && currentCustomer?.phone && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => triggerVerification('phone')}
                              className="w-full text-xs py-1"
                            >
                              Verify Phone via SMS OTP
                            </Button>
                          )}
                        </div>

                        {/* Email Card */}
                        <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                              <Mail className="w-3.5 h-3.5 text-[#F15A24]" />
                              Email Address
                            </span>
                            {(currentCustomer?.email_verified || currentCustomer?.emailVerified) ? (
                              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100/70 border border-emerald-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Verified
                              </span>
                            ) : (
                              <span className="text-[11px] font-bold text-amber-700 bg-amber-100/70 border border-amber-300 px-2 py-0.5 rounded-full">
                                ⚠️ Not Verified
                              </span>
                            )}
                          </div>

                          <div className="font-mono text-xs font-bold text-slate-800 truncate">
                            {currentCustomer?.email || 'No email registered'}
                          </div>

                          {!(currentCustomer?.email_verified || currentCustomer?.emailVerified) && currentCustomer?.email && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => triggerVerification('email')}
                              className="w-full text-xs py-1"
                            >
                              Verify Email Address
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Account System Records */}
                    <div className="pt-6 border-t border-slate-100 text-xs text-slate-500 space-y-1">
                      <span className="font-bold text-slate-700 block mb-1">System Account Metadata:</span>
                      <p>Customer ID: <code className="font-mono text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded">{currentCustomer?.id}</code></p>
                      <p>Account Type: <strong className="text-slate-800 capitalize">{currentCustomer?.customerType || 'individual'}</strong></p>
                      <p>Registration Timestamp: <span className="font-mono">{currentCustomer?.createdAt ? new Date(currentCustomer.createdAt).toLocaleString() : 'Active Member'}</span></p>
                    </div>
                  </div>
                )}

                {/* =========================================================== */}
                {/* 4. SAVED ADDRESSES SECTION                                  */}
                {/* =========================================================== */}
                {activeSection === 'addresses' && (
                  <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-6 animate-in fade-in duration-150">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                      <div>
                        <h2 className="text-lg font-bold font-heading text-[#111827]">Saved Delivery Addresses</h2>
                        <p className="text-xs text-slate-500">Manage destination addresses for fast one-click hardware checkout</p>
                      </div>

                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => openAddressModal()}
                        className="bg-[#F15A24] hover:bg-[#D94D1C] text-xs font-bold shadow-xs self-start sm:self-auto"
                      >
                        <Plus className="w-3.5 h-3.5 mr-1" />
                        Add New Address
                      </Button>
                    </div>

                    {(currentCustomer?.addresses || []).length === 0 ? (
                      <div className="py-12 text-center space-y-3">
                        <MapPin className="w-10 h-10 text-slate-300 mx-auto" />
                        <h3 className="text-sm font-bold text-slate-800">No Saved Delivery Addresses</h3>
                        <p className="text-xs text-slate-500 max-w-sm mx-auto">
                          Save your office, home, or client installation site addresses to autocomplete shipping details during checkout.
                        </p>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => openAddressModal()}
                          className="mt-2 text-xs"
                        >
                          <Plus className="w-3.5 h-3.5 mr-1" />
                          Add First Delivery Address
                        </Button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {(currentCustomer?.addresses || []).map((addr) => (
                          <div
                            key={addr.id}
                            className={`p-5 rounded-2xl border transition-all relative flex flex-col justify-between ${
                              addr.isDefault
                                ? 'bg-orange-50/30 border-orange-200 shadow-2xs'
                                : 'bg-slate-50/50 border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-xs text-[#0F172A] flex items-center gap-1.5 uppercase tracking-wider">
                                  <MapPin className="w-3.5 h-3.5 text-[#F15A24]" />
                                  {addr.label || 'Delivery Address'}
                                </span>
                                {addr.isDefault && (
                                  <span className="text-[10px] font-bold text-[#F15A24] bg-orange-100 border border-orange-200 px-2 py-0.5 rounded-full">
                                    Default Delivery
                                  </span>
                                )}
                              </div>

                              <div className="text-xs text-slate-800">
                                <span className="font-bold block">{addr.recipientName}</span>
                                <span className="font-mono text-slate-600 block">{addr.recipientPhone}</span>
                                <p className="text-slate-700 mt-1 leading-relaxed">
                                  {addr.addressLine}
                                  {addr.area ? `, ${addr.area}` : ''}
                                  {addr.thana ? `, ${addr.thana}` : ''}
                                  {addr.district ? `, ${addr.district}` : ''}
                                  {addr.postalCode ? ` - ${addr.postalCode}` : ''}
                                </p>
                              </div>
                            </div>

                            <div className="pt-4 border-t border-slate-200/80 mt-4 flex items-center justify-between text-xs">
                              {!addr.isDefault ? (
                                <button
                                  type="button"
                                  onClick={() => handleSetDefaultAddress(addr.id)}
                                  className="text-[11px] font-bold text-slate-500 hover:text-[#F15A24] transition cursor-pointer"
                                >
                                  Set as Default
                                </button>
                              ) : (
                                <span className="text-[11px] text-slate-400 font-medium">Primary Destination</span>
                              )}

                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => openAddressModal(addr)}
                                  className="p-1.5 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-200/60 transition cursor-pointer"
                                  title="Edit address"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteAddress(addr.id)}
                                  className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition cursor-pointer"
                                  title="Delete address"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* =========================================================== */}
                {/* 5. WISHLIST SECTION                                         */}
                {/* =========================================================== */}
                {activeSection === 'wishlist' && (
                  <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-6 animate-in fade-in duration-150">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                      <div>
                        <h2 className="text-lg font-bold font-heading text-[#111827]">Saved Products & Wishlist</h2>
                        <p className="text-xs text-slate-500">Security hardware bookmarked for your future installations</p>
                      </div>
                      <span className="text-xs font-bold text-slate-400 font-mono">
                        {wishlistProducts.length} {wishlistProducts.length === 1 ? 'Product' : 'Products'}
                      </span>
                    </div>

                    {wishlistProducts.length === 0 ? (
                      <div className="py-12 text-center space-y-3">
                        <Heart className="w-10 h-10 text-slate-300 mx-auto" />
                        <h3 className="text-sm font-bold text-slate-800">Your Wishlist is Empty</h3>
                        <p className="text-xs text-slate-500 max-w-sm mx-auto">
                          Click the heart icon on any camera, NVR, access terminal, or networking switch to save equipment for comparison.
                        </p>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => onNavigate('catalog')}
                          className="mt-2 text-xs"
                        >
                          Explore Security Hardware
                        </Button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {wishlistProducts.map((prod) => (
                          <div
                            key={prod.id}
                            className="p-4 rounded-2xl border border-slate-200 hover:border-slate-300 transition-all bg-slate-50/50 flex flex-col justify-between space-y-3"
                          >
                            <div className="space-y-2">
                              <div className="h-32 bg-white rounded-xl border border-slate-100 flex items-center justify-center p-2 relative overflow-hidden">
                                {prod.primaryImage ? (
                                  <img
                                    src={prod.primaryImage}
                                    alt={prod.name}
                                    className="max-h-full max-w-full object-contain"
                                  />
                                ) : (
                                  <Package className="w-8 h-8 text-slate-300" />
                                )}
                                <button
                                  type="button"
                                  onClick={() => removeFromWishlist(prod.id, true)}
                                  className="absolute top-2 right-2 p-1.5 bg-white/90 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-full shadow-2xs transition cursor-pointer"
                                  title="Remove from wishlist"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>

                              <div>
                                <span className="text-[10px] text-slate-400 font-mono font-bold block">{prod.brand} · {prod.modelNumber}</span>
                                <h4
                                  onClick={() => onNavigate('product', prod.id)}
                                  className="text-xs font-bold text-slate-900 line-clamp-2 hover:text-[#F15A24] cursor-pointer transition"
                                >
                                  {prod.name}
                                </h4>
                              </div>

                              <div className="flex items-center gap-2">
                                <span className="text-sm font-extrabold text-[#111827] font-mono">
                                  ৳{(prod.pricing?.salePrice || prod.pricing?.regularPrice || 0).toLocaleString()}
                                </span>
                                {prod.pricing?.salePrice && prod.pricing?.regularPrice && prod.pricing.salePrice < prod.pricing.regularPrice && (
                                  <span className="text-xs text-slate-400 line-through font-mono">
                                    ৳{prod.pricing.regularPrice.toLocaleString()}
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="pt-2 border-t border-slate-200/80 flex items-center gap-2">
                              <Button
                                variant="primary"
                                size="sm"
                                fullWidth
                                onClick={() => addToCart(prod, 1)}
                                className="text-xs py-1.5"
                              >
                                Add to Cart
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => onNavigate('product', prod.id)}
                                className="text-xs py-1.5 px-3"
                              >
                                View
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* =========================================================== */}
                {/* 6. SECURITY & LOGIN METHODS SECTION                         */}
                {/* =========================================================== */}
                {activeSection === 'security' && (
                  <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-6 animate-in fade-in duration-150">
                    <div className="pb-4 border-b border-slate-100">
                      <h2 className="text-lg font-bold font-heading text-[#111827]">Security & Authentication Methods</h2>
                      <p className="text-xs text-slate-500">Manage credentials, password safety, and connected identity providers</p>
                    </div>

                    {/* Password Management */}
                    <div className="space-y-4 max-w-xl">
                      <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        <Lock className="w-4 h-4 text-[#F15A24]" />
                        <span>{securityInfo?.hasPassword ? 'Change Account Password' : 'Create Account Password'}</span>
                      </h3>

                      {passwordFeedback && (
                        <div className={`p-4 rounded-2xl text-xs flex items-center gap-2.5 ${
                          passwordFeedback.type === 'success'
                            ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                            : 'bg-rose-50 text-rose-900 border border-rose-200'
                        }`}>
                          {passwordFeedback.type === 'success' ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          ) : (
                            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                          )}
                          <span>{passwordFeedback.message}</span>
                        </div>
                      )}

                      <form onSubmit={handlePasswordSubmit} className="space-y-3.5">
                        {securityInfo?.hasPassword && (
                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">Current Password</label>
                            <input
                              type="password"
                              required
                              value={currPassword}
                              onChange={(e) => setCurrPassword(e.target.value)}
                              placeholder="••••••••••••"
                              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-[#F15A24] focus:bg-white"
                            />
                          </div>
                        )}

                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">New Password (Min 6 Characters)</label>
                          <input
                            type="password"
                            required
                            minLength={6}
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="••••••••••••"
                            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-[#F15A24] focus:bg-white"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">Confirm New Password</label>
                          <input
                            type="password"
                            required
                            minLength={6}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="••••••••••••"
                            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-[#F15A24] focus:bg-white"
                          />
                        </div>

                        <Button
                          type="submit"
                          variant="primary"
                          size="sm"
                          loading={passwordSaving}
                          className="bg-[#F15A24] hover:bg-[#D94D1C] text-xs font-bold shadow-xs mt-2"
                        >
                          {securityInfo?.hasPassword ? 'Update Password' : 'Set Account Password'}
                        </Button>
                      </form>
                    </div>

                    {/* Connected Social Accounts */}
                    <div className="pt-6 border-t border-slate-100 space-y-3">
                      <h3 className="text-sm font-bold text-slate-900">Connected Social & Single Sign-On</h3>
                      <p className="text-xs text-slate-500">
                        External authentication providers connected to this CamneX account.
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl">
                        {/* Google */}
                        <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                            </svg>
                            <div>
                              <span className="text-xs font-bold text-slate-800 block">Google Account</span>
                              <span className="text-[11px] text-slate-500 font-mono">
                                {securityInfo?.googleLinked ? securityInfo.googleEmail || 'Linked' : 'Not linked'}
                              </span>
                            </div>
                          </div>

                          {securityInfo?.googleLinked ? (
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                              Connected
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={handleGoogleClick}
                              className="text-xs font-bold text-[#F15A24] hover:underline"
                            >
                              Link Google
                            </button>
                          )}
                        </div>

                        {/* Apple (Deferred) */}
                        <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 flex items-center justify-between opacity-80">
                          <div className="flex items-center gap-3">
                            <svg className="w-5 h-5 fill-current text-slate-800 shrink-0" viewBox="0 0 170 170">
                              <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.7-3.04-7.58-7.71-11.65-14-5.32-8.36-9.67-17.76-13.06-28.18-3.38-10.42-5.08-20.47-5.08-30.15 0-13.88 3.55-25.5 10.66-34.85 7.1-9.35 16.03-14.12 26.79-14.32 4.47 0 9.4 1.13 14.78 3.39 5.39 2.26 9.24 3.45 11.55 3.58 2.53-.13 6.64-1.39 12.33-3.77 5.69-2.38 10.45-3.41 14.28-3.09 10.87.67 19.53 4.54 25.98 11.6-9.52 5.76-14.16 13.8-13.91 24.12.25 8.1 3.27 14.86 9.07 20.27 5.8 5.41 12.63 8.37 20.49 8.89-2.31 7.21-5.39 14.36-9.24 21.44zM119.22 31.84c0-6.19 2.22-12.02 6.65-17.51 4.44-5.49 9.87-8.99 16.3-10.51.78 6.41-1.18 12.28-5.88 17.62-4.7 5.34-10.4 8.78-17.07 10.4z" />
                            </svg>
                            <div>
                              <span className="text-xs font-bold text-slate-800 block">Apple ID</span>
                              <span className="text-[11px] text-slate-400">Deferred / Not Configured</span>
                            </div>
                          </div>

                          <span className="text-[10px] font-bold text-slate-500 bg-slate-200/80 px-2 py-0.5 rounded-full">
                            Deferred
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Session Management */}
                    <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
                      <div>
                        <span className="text-xs font-bold text-slate-800 block">Active Login Session</span>
                        <p className="text-[11px] text-slate-500">Sign out from this device to terminate your authenticated session.</p>
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={async () => {
                          await logout();
                          setAuthMode('login');
                        }}
                        className="text-rose-600 hover:text-white hover:bg-rose-600 border-rose-200"
                      >
                        <LogOut className="w-3.5 h-3.5 mr-1" />
                        Sign Out
                      </Button>
                    </div>
                  </div>
                )}

              </div>
            </div>
          </div>
        )}
      </div>

      {/* ===================================================================== */}
      {/* ADDRESS MODAL (ADD / EDIT)                                            */}
      {/* ===================================================================== */}
      {addressModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-[#F15A24]" />
                <h3 className="font-bold text-base text-slate-900">
                  {editingAddressId ? 'Edit Delivery Address' : 'Add New Delivery Address'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setAddressModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {addressError && (
              <div className="p-3 bg-rose-50 text-rose-800 border border-rose-200 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{addressError}</span>
              </div>
            )}

            <form onSubmit={handleSaveAddress} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Address Label</label>
                  <select
                    value={addrLabel}
                    onChange={(e) => setAddrLabel(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#F15A24] focus:bg-white"
                  >
                    <option value="Home">Home</option>
                    <option value="Office">Office</option>
                    <option value="Warehouse">Warehouse</option>
                    <option value="Job Site">Job Site</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Postal Code (Optional)</label>
                  <input
                    type="text"
                    value={addrPostalCode}
                    onChange={(e) => setAddrPostalCode(e.target.value)}
                    placeholder="e.g. 1207"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-[#F15A24] focus:bg-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Recipient Name *</label>
                  <input
                    type="text"
                    required
                    value={addrRecipientName}
                    onChange={(e) => setAddrRecipientName(e.target.value)}
                    placeholder="Full name"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-[#F15A24] focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Recipient Phone *</label>
                  <input
                    type="tel"
                    required
                    value={addrRecipientPhone}
                    onChange={(e) => setAddrRecipientPhone(e.target.value)}
                    placeholder="e.g. 01711000000"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-[#F15A24] focus:bg-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Street Address, Flat / Building Details *</label>
                <textarea
                  required
                  rows={2}
                  value={addrLine}
                  onChange={(e) => setAddrLine(e.target.value)}
                  placeholder="House 22, Road 06, Block A, Chandrima Model Town"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-[#F15A24] focus:bg-white resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">District (Zila) *</label>
                  <select
                    value={addrDistrict}
                    onChange={(e) => {
                      setAddrDistrict(e.target.value);
                      setAddrThana('');
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#F15A24] focus:bg-white"
                  >
                    {DISTRICT_NAMES.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Thana / Upazila</label>
                  {availableThanas.length > 0 ? (
                    <select
                      value={addrThana}
                      onChange={(e) => setAddrThana(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#F15A24] focus:bg-white"
                    >
                      <option value="">Select Thana / Upazila</option>
                      {availableThanas.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={addrThana}
                      onChange={(e) => setAddrThana(e.target.value)}
                      placeholder="Enter Thana / Upazila"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-[#F15A24] focus:bg-white"
                    />
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Area / Landmark / Sector (Optional)</label>
                <input
                  type="text"
                  value={addrArea}
                  onChange={(e) => setAddrArea(e.target.value)}
                  placeholder="e.g. Near Chandrima Mosque"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-[#F15A24] focus:bg-white"
                />
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
                  <input
                    type="checkbox"
                    checked={addrIsDefault}
                    onChange={(e) => setAddrIsDefault(e.target.checked)}
                    className="rounded text-[#F15A24] focus:ring-[#F15A24] w-4 h-4 cursor-pointer"
                  />
                  <span>Set as primary default delivery destination</span>
                </label>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setAddressModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  loading={addressSaving}
                  className="bg-[#F15A24] hover:bg-[#D94D1C] text-xs font-bold shadow-xs"
                >
                  {editingAddressId ? 'Update Address' : 'Save Address'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* PROVIDER SETUP NOTICE MODAL                                           */}
      {/* ===================================================================== */}
      {setupNotice && (
        <div
          data-testid="provider-setup-modal"
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">{setupNotice.title}</h3>
                  <Badge variant="outline" className="text-[10px] text-amber-700 border-amber-300 bg-amber-50">
                    Configuration Required
                  </Badge>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSetupNotice(null)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                aria-label="Close dialog"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              {setupNotice.message}
            </p>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <span className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Required Server Environment Variables:
              </span>
              <ul className="space-y-1">
                {setupNotice.envKeys.map((k) => (
                  <li key={k} className="text-xs font-mono font-semibold text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200">
                    {k}
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex justify-end gap-2.5 pt-2">
              <Button
                variant="primary"
                size="sm"
                data-testid="close-setup-modal-button"
                onClick={() => setSetupNotice(null)}
              >
                Understood, return to sign in
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* CUSTOMER VERIFICATION MODAL                                           */}
      {/* ===================================================================== */}
      <CustomerVerificationModal
        isOpen={verificationModalOpen}
        onClose={() => setVerificationModalOpen(false)}
        onSuccess={async () => {
          await checkCustomerAuth();
          await loadOrders();
          setUrlMessage({
            type: 'success',
            title: 'Contact Method Verified',
            text: 'Your contact verification is complete! Your account is now cleared for instantaneous order placement and warranty issuance.'
          });
        }}
        initialMethod={verificationMethod}
        defaultPhone={currentCustomer?.phone || ''}
        defaultEmail={currentCustomer?.email || ''}
        title="Verify Your Contact"
        subtitle="Verify your mobile phone number or email address before placing an order."
      />

    </div>
  );
};
