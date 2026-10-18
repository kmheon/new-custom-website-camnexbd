import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Mail,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  X,
  RefreshCw,
  ArrowRight,
  KeyRound,
  ExternalLink
} from 'lucide-react';
import { Button, Input, Modal, Badge } from './UI';
import { useCustomerAuthStore } from '../../store';

interface CustomerVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialMethod?: 'email' | 'phone';
  defaultPhone?: string;
  defaultEmail?: string;
  title?: string;
  subtitle?: string;
}

export const CustomerVerificationModal: React.FC<CustomerVerificationModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialMethod = 'phone',
  defaultPhone = '',
  defaultEmail = '',
  title = 'Verify Your Contact',
  subtitle = 'CamneX requires verification of your phone or email before placing an order.'
}) => {
  const {
    currentCustomer,
    sendOtp,
    verifyOtp,
    sendEmailVerification,
    verifyEmailVerification,
    getVerificationStatus
  } = useCustomerAuthStore();

  const [activeMethod, setActiveMethod] = useState<'phone' | 'email'>(initialMethod);
  const [phone, setPhone] = useState(defaultPhone || currentCustomer?.phone || '');
  const [email, setEmail] = useState(defaultEmail || currentCustomer?.email || '');
  const [code, setCode] = useState('');

  const [isSent, setIsSent] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [unconfiguredNotice, setUnconfiguredNotice] = useState<{ provider: string; message: string; envKeys: string[] } | null>(null);

  // Sync defaults when modal opens or customer changes
  useEffect(() => {
    if (isOpen) {
      if (defaultPhone || currentCustomer?.phone) {
        setPhone(defaultPhone || currentCustomer?.phone || '');
      }
      if (defaultEmail || currentCustomer?.email) {
        setEmail(defaultEmail || currentCustomer?.email || '');
      }
      setIsSent(false);
      setCode('');
      setFeedback(null);
      setUnconfiguredNotice(null);
    }
  }, [isOpen, defaultPhone, defaultEmail, currentCustomer]);

  // Cooldown timer
  useEffect(() => {
    if (countdown <= 0) return;
    const t = setInterval(() => {
      setCountdown(c => (c <= 1 ? 0 : c - 1));
    }, 1000);
    return () => clearInterval(t);
  }, [countdown]);

  if (!isOpen) return null;

  const handleSendCode = async () => {
    setFeedback(null);
    setUnconfiguredNotice(null);
    setIsSubmitting(true);

    try {
      if (activeMethod === 'phone') {
        const cleanPhone = phone.trim();
        if (!cleanPhone || cleanPhone.length < 11) {
          setFeedback({ type: 'error', message: 'Please enter a valid 11-digit mobile phone number.' });
          setIsSubmitting(false);
          return;
        }

        const res = await sendOtp(cleanPhone);
        if (res.success) {
          setIsSent(true);
          setCountdown(60);
          setFeedback({ type: 'success', message: res.message || 'SMS verification code sent.' });
        } else {
          setFeedback({ type: 'error', message: res.error || 'Failed to send SMS code.' });
          if (res.configured === false) {
            setUnconfiguredNotice({
              provider: 'SMS Gateway',
              message: 'SMS verification requires an active Bangladesh SMS Gateway (e.g., Greenweb, BulkSMSBD). The site owner must supply credentials in the server environment (.env).',
              envKeys: ['SMS_GATEWAY_PROVIDER', 'SMS_API_KEY', 'SMS_SENDER_ID']
            });
          }
        }
      } else {
        const cleanEmail = email.trim().toLowerCase();
        if (!cleanEmail || !cleanEmail.includes('@')) {
          setFeedback({ type: 'error', message: 'Please enter a valid email address.' });
          setIsSubmitting(false);
          return;
        }

        const res = await sendEmailVerification(cleanEmail);
        if (res.success) {
          setIsSent(true);
          setCountdown(60);
          setFeedback({ type: 'success', message: res.message || 'Email verification code sent.' });
        } else {
          setFeedback({ type: 'error', message: res.error || 'Failed to send email verification.' });
          if (res.configured === false) {
            setUnconfiguredNotice({
              provider: 'Email Delivery (SMTP)',
              message: 'Email verification requires SMTP credentials configured in the server environment (.env).',
              envKeys: ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS', 'SMTP_FROM']
            });
          }
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;

    setFeedback(null);
    setIsSubmitting(true);

    try {
      if (activeMethod === 'phone') {
        const ok = await verifyOtp(phone.trim(), code.trim());
        if (ok) {
          setFeedback({ type: 'success', message: 'Phone number verified successfully!' });
          await getVerificationStatus();
          setTimeout(() => {
            onSuccess();
            onClose();
          }, 600);
        } else {
          setFeedback({ type: 'error', message: 'Invalid or expired verification code. Please try again.' });
        }
      } else {
        const res = await verifyEmailVerification(code.trim(), email.trim().toLowerCase());
        if (res.success) {
          setFeedback({ type: 'success', message: 'Email address verified successfully!' });
          await getVerificationStatus();
          setTimeout(() => {
            onSuccess();
            onClose();
          }, 600);
        } else {
          setFeedback({ type: 'error', message: res.error || 'Invalid or expired verification code.' });
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs transition-opacity"
      data-testid="customer-verification-modal"
    >
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 sm:p-6 bg-slate-50 border-b border-slate-100 flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-100 text-[#F15A24] flex items-center justify-center shrink-0 border border-orange-200/60">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#111827]">{title}</h2>
              <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{subtitle}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
            data-testid="close-verification-modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 space-y-5">
          {/* Method Selector Tabs */}
          <div className="flex p-1 bg-slate-100 rounded-xl">
            <button
              type="button"
              data-testid="verify-method-phone"
              onClick={() => {
                setActiveMethod('phone');
                setIsSent(false);
                setCode('');
                setFeedback(null);
                setUnconfiguredNotice(null);
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-colors ${
                activeMethod === 'phone'
                  ? 'bg-white text-[#111827] shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5 text-[#F15A24]" />
              Phone (SMS OTP)
            </button>
            <button
              type="button"
              data-testid="verify-method-email"
              onClick={() => {
                setActiveMethod('email');
                setIsSent(false);
                setCode('');
                setFeedback(null);
                setUnconfiguredNotice(null);
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-colors ${
                activeMethod === 'email'
                  ? 'bg-white text-[#111827] shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Mail className="w-3.5 h-3.5 text-[#F15A24]" />
              Email Address
            </button>
          </div>

          {/* Feedback Banner */}
          {feedback && (
            <div
              className={`p-3 rounded-xl border flex items-start gap-2 text-xs ${
                feedback.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-red-50 border-red-200 text-red-800'
              }`}
              data-testid="verification-feedback-banner"
            >
              {feedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              )}
              <span>{feedback.message}</span>
            </div>
          )}

          {/* Unconfigured Provider Notice */}
          {unconfiguredNotice && (
            <div
              className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs space-y-2 text-amber-900"
              data-testid="verification-unconfigured-notice"
            >
              <div className="flex items-center gap-2 font-bold text-amber-950">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>{unconfiguredNotice.provider} Not Configured</span>
              </div>
              <p className="text-[11px] text-amber-800 leading-relaxed">
                {unconfiguredNotice.message}
              </p>
              <div className="bg-amber-100/60 p-2 rounded-lg font-mono text-[10px] text-amber-950 space-y-0.5">
                <span className="font-sans font-bold block text-slate-700 text-[10px]">Required .env Variables:</span>
                {unconfiguredNotice.envKeys.map(k => (
                  <div key={k}>• {k}</div>
                ))}
              </div>
            </div>
          )}

          {/* Contact Input & Send Button */}
          {!isSent ? (
            <div className="space-y-4">
              {activeMethod === 'phone' ? (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Bangladesh Mobile Number
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 font-medium text-xs">
                      +88
                    </div>
                    <input
                      type="tel"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      placeholder="01711000000"
                      data-testid="verification-phone-input"
                      className="w-full pl-12 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#F15A24]/20 focus:border-[#F15A24]"
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    We will dispatch a secure 6-digit SMS verification code to this phone number.
                  </p>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="user@example.com"
                    data-testid="verification-email-input"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#F15A24]/20 focus:border-[#F15A24]"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    We will send a 6-digit confirmation code valid for 15 minutes.
                  </p>
                </div>
              )}

              <Button
                type="button"
                variant="primary"
                className="w-full py-2.5 bg-[#F15A24] hover:bg-[#D94D1C] text-white font-bold text-xs rounded-xl shadow-xs"
                onClick={handleSendCode}
                disabled={isSubmitting}
                data-testid="send-verification-code-btn"
              >
                {isSubmitting ? (
                  <RefreshCw className="w-4 h-4 animate-spin mx-auto" />
                ) : (
                  <>
                    Send Verification Code <ArrowRight className="w-3.5 h-3.5 ml-1 inline" />
                  </>
                )}
              </Button>
            </div>
          ) : (
            /* Code Entry Form */
            <form onSubmit={handleVerifyCode} className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700">
                    Enter 6-Digit Code
                  </label>
                  <span className="text-[11px] text-slate-500 font-mono">
                    Sent to: {activeMethod === 'phone' ? phone : email}
                  </span>
                </div>
                <input
                  type="text"
                  maxLength={6}
                  value={code}
                  onChange={e => setCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="123456"
                  autoFocus
                  data-testid="verification-code-input"
                  className="w-full text-center tracking-widest text-lg font-mono py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#F15A24]/20 focus:border-[#F15A24]"
                />
              </div>

              <div className="flex items-center justify-between text-xs">
                <button
                  type="button"
                  onClick={handleSendCode}
                  disabled={countdown > 0 || isSubmitting}
                  className={`text-[11px] font-bold ${
                    countdown > 0 ? 'text-slate-400 cursor-not-allowed' : 'text-[#F15A24] hover:underline'
                  }`}
                  data-testid="resend-verification-code-btn"
                >
                  {countdown > 0 ? `Resend code in ${countdown}s` : 'Resend code'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsSent(false)}
                  className="text-[11px] text-slate-500 hover:text-slate-800 underline"
                >
                  Change {activeMethod === 'phone' ? 'phone' : 'email'}
                </button>
              </div>

              <Button
                type="submit"
                variant="primary"
                className="w-full py-2.5 bg-[#F15A24] hover:bg-[#D94D1C] text-white font-bold text-xs rounded-xl shadow-xs"
                disabled={isSubmitting || code.length !== 6}
                data-testid="submit-verification-code-btn"
              >
                {isSubmitting ? (
                  <RefreshCw className="w-4 h-4 animate-spin mx-auto" />
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4 mr-1.5 inline" />
                    Verify & Confirm
                  </>
                )}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

