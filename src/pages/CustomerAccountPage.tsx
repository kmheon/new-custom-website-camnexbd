import React, { useState, useEffect, useCallback } from 'react';
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
  ShieldAlert
} from 'lucide-react';
import { SEO } from '../components/common/SEO';
import { Breadcrumbs, Button, Badge } from '../components/common/UI';
import { TurnstileWidget } from '../components/common/TurnstileWidget';
import { CustomerVerificationModal } from '../components/common/CustomerVerificationModal';
import { useCustomerAuthStore, AuthProvidersStatus } from '../store';
import { Order } from '../types';

interface CustomerAccountPageProps {
  onNavigate: (route: string, param?: string) => void;
}

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
    isLoading,
    error: storeError
  } = useCustomerAuthStore();

  const [authChecked, setAuthChecked] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authMethod, setAuthMethod] = useState<'password' | 'otp'>('password');

  // Form states
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

  // Orders state
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  // Verification & CAPTCHA states
  const [verificationModalOpen, setVerificationModalOpen] = useState(false);
  const [isNoticeDismissed, setIsNoticeDismissed] = useState(false);
  const [registerCaptchaToken, setRegisterCaptchaToken] = useState('');

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
      setOrders(myOrders);
    } catch (e) {
      console.error(e);
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

      if (err) {
        if (err === 'google_not_configured') {
          setUrlMessage({
            type: 'info',
            title: 'Google Sign-In Requires Setup',
            text: 'Google OAuth is not configured on this server yet. The site owner needs to supply GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET. Please sign in with your email or phone and password.'
          });
        } else if (err === 'apple_not_configured') {
          setUrlMessage({
            type: 'info',
            title: 'Apple Sign-In Requires Setup',
            text: 'Apple Sign-In is not configured on this server yet. The site owner needs to supply APPLE_CLIENT_ID in the server environment. Please sign in with your email or phone and password.'
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
            title: 'Authentication Failed',
            text: `Sign-in could not be completed (${err}). Please try again or use email/password.`
          });
        }
      } else if (loginSuccess === '1') {
        if (linked) {
          setUrlMessage({
            type: 'success',
            title: 'Account Linked Successfully',
            text: `Your ${linked === 'google' ? 'Google' : 'Apple'} account has been safely connected to your existing verified CamneX profile.`
          });
        } else if (newAccount === '1') {
          setUrlMessage({
            type: 'success',
            title: 'Welcome to CamneX Bangladesh!',
            text: 'Your new customer account has been created successfully.'
          });
        }
      }

      // Clean URL params without reloading
      if (err || loginSuccess) {
        const cleanUrl = window.location.pathname;
        window.history.replaceState({}, document.title, cleanUrl);
      }
    }
  }, [checkCustomerAuth, getProvidersStatus]);

  useEffect(() => {
    if (isCustomerAuthenticated) {
      loadOrders();
    }
  }, [isCustomerAuthenticated, loadOrders]);

  // Countdown timer for OTP resend
  useEffect(() => {
    if (otpCountdown <= 0) return;
    const timer = setInterval(() => {
      setOtpCountdown((c) => Math.max(0, c - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [otpCountdown]);

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
    if (!regName.trim() || !regPassword.trim()) return;
    if (!regPhone.trim() && !regEmail.trim()) {
      setUrlMessage({
        type: 'error',
        title: 'Contact Required',
        text: 'Please provide either a phone number or an email address to register.'
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
    if (providersStatus?.apple?.configured) {
      window.location.href = '/api/auth/oauth/apple';
    } else {
      setSetupNotice({
        provider: 'Apple',
        title: 'Apple Sign-In Requires Setup',
        message: 'Apple Sign-In credentials (APPLE_CLIENT_ID, APPLE_TEAM_ID, APPLE_KEY_ID, and APPLE_PRIVATE_KEY) have not been configured on this server yet. Once the site owner supplies these in the server environment (.env), customers will be able to sign in with their Apple ID.',
        envKeys: ['APPLE_CLIENT_ID', 'APPLE_TEAM_ID', 'APPLE_KEY_ID', 'APPLE_PRIVATE_KEY']
      });
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpPhone.trim()) return;
    setOtpFeedback(null);

    const res = await sendOtp(otpPhone.trim());
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

  if (!authChecked) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center text-slate-500 py-12">
        <div className="flex items-center gap-3 text-sm font-semibold">
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
            
            {/* Header info */}
            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-orange-50 text-[#F15A24] rounded-2xl flex items-center justify-center mx-auto mb-3 border border-orange-100">
                <Lock className="w-6 h-6" />
              </div>
              <h1 className="text-2xl font-black text-[#111827] tracking-tight font-heading">
                {authMode === 'login' ? 'Customer Sign In' : 'Create Customer Account'}
              </h1>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                {authMode === 'login'
                  ? 'Access your private order history, quotations, and tracking'
                  : 'Register for fast checkout, warranty records, and order updates'}
              </p>

              {/* Mode Toggle (Sign In / Register) */}
              <div className="flex p-1 bg-slate-100 rounded-xl mt-5">
                <button
                  type="button"
                  data-testid="tab-sign-in"
                  onClick={() => {
                    setAuthMode('login');
                    setAuthMethod('password');
                    setOtpFeedback(null);
                  }}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                    authMode === 'login'
                      ? 'bg-white text-[#111827] shadow-sm'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  data-testid="tab-register"
                  onClick={() => {
                    setAuthMode('register');
                    setAuthMethod('password');
                    setOtpFeedback(null);
                  }}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                    authMode === 'register'
                      ? 'bg-white text-[#111827] shadow-sm'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  Register
                </button>
              </div>
            </div>

            {/* URL Status Banner (Error or Success) */}
            {urlMessage && (
              <div
                className={`mb-5 p-3.5 rounded-xl border flex items-start gap-2.5 text-xs ${
                  urlMessage.type === 'success'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : urlMessage.type === 'info'
                    ? 'bg-blue-50 border-blue-200 text-blue-900'
                    : 'bg-red-50 border-red-200 text-red-800'
                }`}
              >
                {urlMessage.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : urlMessage.type === 'info' ? (
                  <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                  <strong className="block font-bold">{urlMessage.title}</strong>
                  <p className="mt-0.5 text-[11px] leading-relaxed">{urlMessage.text}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setUrlMessage(null)}
                  className="text-slate-400 hover:text-slate-700 ml-1"
                  aria-label="Dismiss notice"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Store Error Banner */}
            {storeError && authMethod === 'password' && (
              <div className="mb-5 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{storeError}</span>
              </div>
            )}

            {/* Social Authentication Section */}
            <div className="space-y-2.5">
              {/* Continue with Google */}
              <button
                type="button"
                data-testid="google-auth-button"
                onClick={handleGoogleClick}
                className="w-full flex items-center justify-center py-2.5 px-4 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs sm:text-sm font-semibold rounded-xl transition-all shadow-xs active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-[#F15A24]/30"
              >
                <svg className="w-4 h-4 mr-2.5 shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z" />
                  <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.36 24 12 24z" />
                  <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z" />
                  <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.36 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z" />
                </svg>
                <span>Continue with Google</span>
              </button>

              {/* Continue with Apple */}
              <button
                type="button"
                data-testid="apple-auth-button"
                onClick={handleAppleClick}
                className="w-full flex items-center justify-center py-2.5 px-4 bg-black hover:bg-slate-900 text-white text-xs sm:text-sm font-semibold rounded-xl transition-all shadow-xs active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-slate-400"
              >
                <svg className="w-4 h-4 mr-2.5 shrink-0 fill-current" viewBox="0 0 170 170">
                  <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.69-3.08-7.66-7.85-11.9-14.33-6.22-9.47-11.04-20.19-14.46-32.14-3.42-11.96-5.13-23.01-5.13-33.16 0-14.28 3.51-26.04 10.53-35.29 7.02-9.24 16.03-13.98 27.03-14.2 4.93.13 10.42 1.34 16.48 3.64 6.06 2.29 9.87 3.49 11.44 3.59 1.35-.1 5.37-1.35 12.06-3.74 6.7-2.39 12.5-3.46 17.41-3.23 13.59.88 24.31 5.89 32.16 15.02-11.83 7.18-17.61 17.06-17.33 29.63.28 9.9 4.12 18.23 11.51 24.99 7.39 6.76 16.27 10.56 26.65 11.4-2.28 7.07-4.99 13.91-8.13 20.52zM119.22 33.15c0-7.39 2.65-14.54 7.94-21.46 5.3-6.92 11.87-11.13 19.7-12.63.59 1.62.91 3.29.97 5.01.12 7.72-2.58 14.93-8.09 21.63-5.52 6.7-12.19 10.74-20.02 12.11-.25-1.57-.42-3.13-.5-4.66z" />
                </svg>
                <span>Continue with Apple</span>
              </button>
            </div>

            {/* Clear Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-white px-3 text-slate-400 font-semibold uppercase text-[11px] tracking-wider select-none">
                  Or continue with
                </span>
              </div>
            </div>

            {/* Phone OTP Mode */}
            {authMethod === 'otp' ? (
              <div className="space-y-4">
                <div className="p-3 bg-orange-50/70 border border-orange-200 rounded-xl flex items-center gap-2.5 text-xs text-orange-950">
                  <Smartphone className="w-4 h-4 text-[#F15A24] shrink-0" />
                  <div>
                    <strong className="font-bold">Passwordless Sign In:</strong> Enter your Bangladesh mobile number to receive a 6-digit verification code.
                  </div>
                </div>

                {otpFeedback && (
                  <div
                    className={`p-3 text-xs rounded-xl border flex items-center gap-2 ${
                      otpFeedback.type === 'success'
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                        : 'bg-red-50 border-red-200 text-red-700'
                    }`}
                  >
                    {otpFeedback.type === 'success' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                    )}
                    <span>{otpFeedback.message}</span>
                  </div>
                )}

                {!otpSent ? (
                  <form onSubmit={handleSendOtp} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Mobile Phone Number
                      </label>
                      <input
                        type="tel"
                        required
                        data-testid="otp-phone-input"
                        value={otpPhone}
                        onChange={(e) => setOtpPhone(e.target.value)}
                        placeholder="e.g. 01711000000"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-[#F15A24] focus:bg-white transition-all font-mono"
                      />
                      <span className="block text-[11px] text-slate-400 mt-1">
                        Supports Grameenphone, Robi, Banglalink, Teletalk numbers
                      </span>
                    </div>

                    <Button
                      type="submit"
                      variant="primary"
                      fullWidth
                      loading={isLoading}
                      data-testid="send-otp-button"
                      className="mt-2"
                    >
                      <Smartphone className="w-4 h-4 mr-1.5" />
                      <span>Send Verification Code</span>
                    </Button>
                  </form>
                ) : (
                  <form onSubmit={handleVerifyOtp} className="space-y-4">
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-xs font-bold text-slate-700">Enter 6-Digit Code</label>
                        <button
                          type="button"
                          onClick={() => {
                            setOtpSent(false);
                            setOtpCode('');
                            setOtpFeedback(null);
                          }}
                          className="text-[11px] text-[#F15A24] hover:underline font-semibold"
                        >
                          Change Number
                        </button>
                      </div>
                      <input
                        type="text"
                        required
                        maxLength={6}
                        data-testid="otp-code-input"
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                        placeholder="••••••"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-center text-lg tracking-widest font-mono font-bold focus:outline-none focus:border-[#F15A24] focus:bg-white transition-all"
                      />
                      <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1.5">
                        <span>Sent to {otpPhone}</span>
                        {otpCountdown > 0 ? (
                          <span className="font-mono text-slate-500">Resend in {otpCountdown}s</span>
                        ) : (
                          <button
                            type="button"
                            onClick={handleSendOtp}
                            disabled={isLoading}
                            className="text-[#F15A24] font-semibold hover:underline flex items-center gap-1"
                          >
                            <RefreshCw className="w-3 h-3" />
                            <span>Resend Code</span>
                          </button>
                        )}
                      </div>
                    </div>

                    <Button
                      type="submit"
                      variant="primary"
                      fullWidth
                      loading={isLoading}
                      data-testid="verify-otp-button"
                      className="mt-2"
                    >
                      <span>Verify & Sign In</span>
                    </Button>
                  </form>
                )}

                <div className="pt-2 text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMethod('password');
                      setOtpFeedback(null);
                    }}
                    className="text-xs font-semibold text-slate-600 hover:text-[#F15A24] transition-colors"
                  >
                    ← Sign in with email or password instead
                  </button>
                </div>
              </div>
            ) : authMode === 'login' ? (
              /* Password Sign In Form */
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Phone Number or Email
                  </label>
                  <input
                    type="text"
                    required
                    data-testid="login-identifier-input"
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
                    data-testid="login-password-input"
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
                  data-testid="login-submit-button"
                  className="mt-2"
                >
                  Sign In to Account
                </Button>

                {/* Passwordless alternative link */}
                <div className="pt-2 flex items-center justify-between text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMethod('otp');
                      setOtpPhone(loginIdentifier);
                      setOtpFeedback(null);
                    }}
                    className="text-slate-600 hover:text-[#F15A24] font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <Smartphone className="w-3.5 h-3.5 text-[#F15A24]" />
                    <span>Sign in with Phone SMS OTP</span>
                  </button>
                </div>
              </form>
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

                {/* Lightweight CAPTCHA / Bot Protection */}
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
                <div className="w-14 h-14 rounded-2xl bg-[#0F172A] text-white flex items-center justify-center font-bold text-xl shadow-xs">
                  {currentCustomer?.name ? currentCustomer.name[0].toUpperCase() : 'C'}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-xl font-bold text-[#111827]">
                      {currentCustomer?.name}
                    </h1>
                    {isCustomerVerified ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200" data-testid="badge-account-verified">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        Account Verified
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200" data-testid="badge-verification-required">
                        <AlertCircle className="w-3 h-3 text-amber-600" />
                        Verification Required
                      </span>
                    )}
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
                  data-testid="logout-button"
                  onClick={async () => {
                    await logout();
                    setAuthMode('login');
                  }}
                  className="text-slate-500 hover:text-red-600"
                >
                  <LogOut className="w-4 h-4 mr-1.5" />
                  Sign Out
                </Button>
              </div>
            </div>

            {/* Customer Profile Verification Notice */}
            {!isCustomerVerified ? (
              !isNoticeDismissed && (
                <div
                  className="bg-amber-50/90 border border-amber-200 rounded-2xl p-5 sm:p-6 shadow-xs relative"
                  data-testid="profile-verification-card"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-3.5">
                      <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 border border-amber-200">
                        <ShieldAlert className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-amber-950 text-base">Verify Your Account</h3>
                          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-amber-200/80 text-amber-900 rounded-md">Action Required</span>
                        </div>
                        <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                          Verify your email address or phone number before placing your first order.
                        </p>

                        {/* Contact Method Status Grid */}
                        <div className="mt-3 flex flex-wrap gap-4 text-xs">
                          <div className="flex items-center gap-1.5" data-testid="status-email-verification">
                            <span className="text-amber-900/70 font-medium">Email:</span>
                            <span className="font-medium text-slate-800">{currentCustomer?.email || 'None on file'}</span>
                            {(currentCustomer?.email_verified || currentCustomer?.emailVerified) ? (
                              <span className="text-emerald-700 font-bold flex items-center gap-0.5 text-[11px]">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Verified
                              </span>
                            ) : (
                              <span className="text-amber-700 font-bold text-[11px]">⚠️ Not Verified</span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5" data-testid="status-phone-verification">
                            <span className="text-amber-900/70 font-medium">Phone:</span>
                            <span className="font-medium text-slate-800 font-mono">{currentCustomer?.phone || 'None on file'}</span>
                            {(currentCustomer?.phone_verified || currentCustomer?.phoneVerified) ? (
                              <span className="text-emerald-700 font-bold flex items-center gap-0.5 text-[11px]">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Verified
                              </span>
                            ) : (
                              <span className="text-amber-700 font-bold text-[11px]">⚠️ Not Verified</span>
                            )}
                          </div>
                        </div>

                        <div className="mt-2 text-[11px] text-amber-900 font-medium">
                          Available verification method: <span className="font-bold text-[#F15A24]">{availableMethodText}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => setVerificationModalOpen(true)}
                        className="bg-[#F15A24] hover:bg-[#D94D1C] text-white font-bold text-xs px-4 py-2 rounded-xl shadow-xs"
                        data-testid="profile-verify-now-btn"
                      >
                        Verify Now <ArrowRight className="w-3.5 h-3.5 ml-1 inline" />
                      </Button>
                      <button
                        type="button"
                        onClick={() => setIsNoticeDismissed(true)}
                        className="text-amber-600 hover:text-amber-900 p-1.5 rounded-lg"
                        title="Dismiss notice for this visit"
                        data-testid="dismiss-verification-notice-btn"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )
            ) : (
              /* Verified Customer Status Card */
              <div
                className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center justify-between text-xs"
                data-testid="profile-verified-card"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-emerald-950 text-sm">Account Verified</span>
                    <p className="text-[11px] text-emerald-800 mt-0.5">
                      Your contact details are verified and eligible for instant order checkout and warranty registrations.
                    </p>
                  </div>
                </div>
                <div className="hidden sm:flex items-center gap-2 text-[11px] font-semibold text-emerald-800">
                  {(currentCustomer?.phone_verified || currentCustomer?.phoneVerified) && (
                    <span className="bg-emerald-100/70 px-2 py-0.5 rounded-md">✓ Phone Verified</span>
                  )}
                  {(currentCustomer?.email_verified || currentCustomer?.emailVerified) && (
                    <span className="bg-emerald-100/70 px-2 py-0.5 rounded-md">✓ Email Verified</span>
                  )}
                </div>
              </div>
            )}

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

      {/* Provider Setup Required Modal */}
      {setupNotice && (
        <div
          data-testid="provider-setup-modal"
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
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
                className="text-slate-400 hover:text-slate-600 p-1"
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
                Got it, sign in with password
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Customer Verification Modal */}
      <CustomerVerificationModal
        isOpen={verificationModalOpen}
        onClose={() => setVerificationModalOpen(false)}
        onSuccess={async () => {
          await checkCustomerAuth();
          await loadOrders();
        }}
        initialMethod={currentCustomer?.phone ? 'phone' : 'email'}
        defaultPhone={currentCustomer?.phone || ''}
        defaultEmail={currentCustomer?.email || ''}
        title="Verify Your Account"
        subtitle="Verify your email address or phone number before placing your first order."
      />

    </div>
  );
};
