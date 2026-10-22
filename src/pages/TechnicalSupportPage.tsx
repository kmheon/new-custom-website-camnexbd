import React, { useState, useEffect } from 'react';
import {
  Wrench,
  Phone,
  Mail,
  MapPin,
  MessageSquare,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Shield,
  Truck,
  ArrowRight,
  ExternalLink,
  Clock,
  Send,
  Cpu,
  Monitor
} from 'lucide-react';
import { SEO } from '../components/common/SEO';
import { Breadcrumbs, Button, Input, Textarea, Badge, Alert } from '../components/common/UI';
import { apiClient } from '../shared/apiClient';
import { cmsService } from '../services';
import { SiteSettings } from '../types';
import { TurnstileWidget } from '../components/common/TurnstileWidget';

interface TechnicalSupportPageProps {
  onNavigate: (route: string, param?: string) => void;
}

export const TechnicalSupportPage: React.FC<TechnicalSupportPageProps> = ({ onNavigate }) => {
  const [settings, setSettings] = useState<SiteSettings | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    systemType: 'CCTV & IP Surveillance',
    modelNumber: '',
    serialNumber: '',
    description: '',
    website_url: '' // Honeypot
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [supportCaptchaToken, setSupportCaptchaToken] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState<{ referenceNumber: string; createdAt: string } | null>(null);

  useEffect(() => {
    cmsService.getSiteSettings().then(setSettings).catch(() => {});
  }, []);

  const phone = settings?.phone || '+880 1540-535150';
  const secondaryPhone = '+880 1410-085848';
  const email = settings?.supportEmail || 'support@camnexbd.com';
  const address = settings?.address || 'Block A, Chandrima Model Town, Shop 01, 1st Floor, House 22, Road 06 Main Rd, Dhaka 1207';

  const validateForm = () => {
    const errs: Record<string, string> = {};
    const cleanName = formData.name.trim();
    const cleanPhone = formData.phone.replace(/[\s-]/g, '');
    const cleanDesc = formData.description.trim();

    if (!cleanName || cleanName.length < 2) {
      errs.name = 'Please provide your full name or company contact person.';
    }
    if (!cleanPhone || !/^(\+?880|0)?1[3-9]\d{8}$/.test(cleanPhone)) {
      errs.phone = 'Please provide a valid 11-digit Bangladesh mobile number (e.g. 017XXXXXXXX).';
    }
    if (formData.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errs.email = 'Please provide a valid email address.';
    }
    if (!cleanDesc || cleanDesc.length < 10) {
      errs.description = 'Please describe the technical issue or error code (at least 10 characters).';
    }
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setSubmitError(null);

    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const detailedMessage = `[Technical Support Inquiry]
System Type: ${formData.systemType}
Hardware Model: ${formData.modelNumber || 'Not specified'}
Serial Number: ${formData.serialNumber || 'Not specified'}

Issue Description:
${formData.description.trim()}`;

      const res = await apiClient.post<{
        success: boolean;
        referenceNumber: string;
        createdAt: string;
      }>('/contact', {
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim() || undefined,
        subject: 'Technical Support & Troubleshooting',
        message: detailedMessage,
        website_url: formData.website_url,
        captchaToken: supportCaptchaToken
      });

      if (res && res.referenceNumber) {
        setSubmitSuccess({
          referenceNumber: res.referenceNumber,
          createdAt: res.createdAt || new Date().toISOString()
        });
        setFormErrors({});
      } else {
        throw new Error('Unexpected response from server. Please try again.');
      }
    } catch (err: any) {
      setSubmitError(
        err?.message || 'Unable to submit your support inquiry right now. Please call our hotline directly.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-[#FAF7F2] min-h-screen py-8 sm:py-12 text-[#111827]">
      <SEO
        title="Technical Support & Engineering Desk | CamneX Bangladesh"
        description="Official technical support, device troubleshooting, mobile viewing (Hik-Connect / DMSS) setup, and firmware assistance for CamneX clients in Dhaka."
        canonicalPath="/support"
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <Breadcrumbs
          items={[
            { label: 'Home', onClick: () => onNavigate('home') },
            { label: 'Technical Support' }
          ]}
        />

        {/* Hero Header */}
        <div className="bg-white p-6 sm:p-10 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Badge variant="orange">Engineering Support Desk</Badge>
            <span className="text-xs text-slate-400 font-medium">Dhaka Operations Center</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-[#111827] font-heading leading-tight">
            Technical Support & Service Desk
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-2xl">
            Official technical service, system troubleshooting, and remote mobile viewing guidance for residential, commercial, and enterprise clients in Bangladesh.
          </p>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 leading-relaxed flex items-start gap-3">
            <Clock className="w-5 h-5 text-[#F15A24] shrink-0 mt-0.5" />
            <div>
              <strong className="text-[#111827] block font-bold mb-0.5">Realistic Engineering Support Hours</strong>
              <span>
                Our technical support desk operates <strong>Saturday through Thursday, 9:30 AM to 7:30 PM</strong>. Friday is reserved for critical corporate enterprise emergency on-call support. We believe in setting honest expectations rather than advertising artificial 24/7 promises.
              </span>
            </div>
          </div>
        </div>

        {/* Support Channel Quick Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
            <div className="w-10 h-10 rounded-xl bg-orange-100 text-[#F15A24] flex items-center justify-center">
              <Phone className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-[#111827]">Direct Hotlines</h3>
            <p className="text-xs text-slate-600">
              Primary: <a href={`tel:${phone.replace(/\s+/g, '')}`} className="font-bold text-[#F15A24]">{phone}</a><br />
              Secondary: <a href={`tel:${secondaryPhone.replace(/\s+/g, '')}`} className="font-bold text-slate-800">{secondaryPhone}</a>
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <MessageSquare className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-[#111827]">WhatsApp Live Chat</h3>
            <p className="text-xs text-slate-600">
              Direct diagnostic messaging for sending error screenshots and video clips.
            </p>
            <a
              href="https://wa.me/8801540535150"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 hover:underline pt-1"
            >
              <span>Open WhatsApp Chat</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
              <Mail className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-[#111827]">Email Support</h3>
            <p className="text-xs text-slate-600">
              For corporate tickets, network topologies, and formal service orders.
            </p>
            <a
              href={`mailto:${email}`}
              className="inline-flex items-center gap-1 text-xs font-bold text-[#F15A24] hover:underline pt-1"
            >
              <span>{email}</span>
            </a>
          </div>
        </div>

        {/* Before You Call / Troubleshooting Checklist */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-orange-100 text-[#F15A24] flex items-center justify-center font-bold">
              <Cpu className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-[#111827] font-heading">
              Before You Contact Technical Support
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            To help our engineers diagnose and resolve your issue rapidly, please check the following information if available:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-xs">
            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-1">
              <strong className="text-[#111827] font-bold block">1. Device Model & Serial Number</strong>
              <p className="text-slate-500">
                Found on the silver barcode sticker on the physical camera body, recorder underside, or in the NVR system menu.
              </p>
            </div>
            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-1">
              <strong className="text-[#111827] font-bold block">2. Front Panel LED Indicator Lights</strong>
              <p className="text-slate-500">
                Check whether Power, HDD (Hard Disk), and Network status LEDs on the front of your recorder are solid, flashing, or dark.
              </p>
            </div>
            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-1">
              <strong className="text-[#111827] font-bold block">3. Mobile App Error Prompt</strong>
              <p className="text-slate-500">
                Note the exact error prompt displayed in Hik-Connect or DMSS (e.g. "Device Offline", "Network Exception", or "Stream Encrypted").
              </p>
            </div>
            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-1">
              <strong className="text-[#111827] font-bold block">4. Internet & Cable Check</strong>
              <p className="text-slate-500">
                Confirm your broadband router has an active internet connection and the ethernet cable into the NVR LAN port shows blinking amber/green lights.
              </p>
            </div>
          </div>
        </div>

        {/* Technical Support Inquiry Form */}
        <div className="bg-white p-6 sm:p-10 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <div className="space-y-1">
            <h2 className="text-xl sm:text-2xl font-bold text-[#111827] font-heading">
              Submit a Technical Support Ticket
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Fill in your hardware details below. An engineer will review your ticket and contact you by phone or WhatsApp.
            </p>
          </div>

          {submitSuccess ? (
            <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg text-emerald-900 font-heading">
                Support Ticket Logged Successfully
              </h3>
              <p className="text-xs sm:text-sm text-emerald-800 max-w-md mx-auto">
                Your technical service inquiry has been registered with reference code:
              </p>
              <div className="font-mono font-black text-lg text-emerald-700 bg-white py-2 px-4 rounded-xl border border-emerald-200 inline-block">
                {submitSuccess.referenceNumber}
              </div>
              <p className="text-[11px] text-emerald-700">
                Logged at: {new Date(submitSuccess.createdAt).toLocaleString()}<br />
                Our engineering desk will contact your registered phone number shortly.
              </p>
              <div className="pt-3">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setSubmitSuccess(null);
                    setFormData({
                      name: '',
                      phone: '',
                      email: '',
                      systemType: 'CCTV & IP Surveillance',
                      modelNumber: '',
                      serialNumber: '',
                      description: '',
                      website_url: ''
                    });
                  }}
                >
                  Log Another Inquiry
                </Button>
              </div>
            </div>
          ) : (
            <form noValidate onSubmit={handleSubmit} className="space-y-4">
              {submitError && <Alert type="warning">{submitError}</Alert>}

              {/* Honeypot field */}
              <div className="hidden" aria-hidden="true">
                <input
                  type="text"
                  name="website_url"
                  tabIndex={-1}
                  value={formData.website_url}
                  onChange={(e) => setFormData({ ...formData, website_url: e.target.value })}
                  autoComplete="off"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Input
                    label="Full Name or Contact Person *"
                    placeholder="e.g. Heon Khondokar"
                    data-testid="support-input-name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                  {formErrors.name && (
                    <span className="text-[11px] text-red-600 font-semibold mt-1 block">
                      {formErrors.name}
                    </span>
                  )}
                </div>

                <div>
                  <Input
                    label="Mobile Phone Number *"
                    placeholder="e.g. 017XXXXXXXX"
                    data-testid="support-input-phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                  {formErrors.phone && (
                    <span className="text-[11px] text-red-600 font-semibold mt-1 block">
                      {formErrors.phone}
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#111827] mb-1.5">
                    System / Equipment Type *
                  </label>
                  <select
                    value={formData.systemType}
                    onChange={(e) => setFormData({ ...formData, systemType: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#F15A24]/30 focus:border-[#F15A24] bg-white"
                  >
                    <option value="CCTV & IP Surveillance">CCTV & IP Surveillance</option>
                    <option value="DVR / NVR Recorder">DVR / NVR Recorder</option>
                    <option value="Biometric & Access Control">Biometric & Access Control</option>
                    <option value="Wi-Fi 6 & Enterprise Networking">Wi-Fi 6 & Enterprise Networking</option>
                    <option value="Mobile App (Hik-Connect / DMSS)">Mobile App (Hik-Connect / DMSS)</option>
                    <option value="Other Hardware">Other Hardware</option>
                  </select>
                </div>

                <div>
                  <Input
                    label="Device Model (Optional)"
                    placeholder="e.g. DS-2CD1023G0E"
                    value={formData.modelNumber}
                    onChange={(e) => setFormData({ ...formData, modelNumber: e.target.value })}
                  />
                </div>

                <div>
                  <Input
                    label="Serial Number (Optional)"
                    placeholder="e.g. C12345678"
                    value={formData.serialNumber}
                    onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Input
                  label="Email Address (Optional)"
                  placeholder="contact@yourcompany.com"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
                {formErrors.email && (
                  <span className="text-[11px] text-red-600 font-semibold mt-1 block">
                    {formErrors.email}
                  </span>
                )}
              </div>

              <div>
                <Textarea
                  label="Problem Description & Error Details *"
                  placeholder="Please describe what happens: e.g. camera offline in mobile app, NVR beep sound, no video signal on monitor, or password forgotten..."
                  rows={4}
                  data-testid="support-input-description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
                {formErrors.description && (
                  <span className="text-[11px] text-red-600 font-semibold mt-1 block">
                    {formErrors.description}
                  </span>
                )}
              </div>

              <TurnstileWidget
                action="support"
                onVerify={(token) => setSupportCaptchaToken(token)}
                onError={() => setSupportCaptchaToken('')}
                onExpire={() => setSupportCaptchaToken('')}
                className="py-1"
              />

              <div className="pt-2">
                <Button
                  size="md"
                  type="submit"
                  isLoading={isSubmitting}
                  data-testid="support-submit-btn"
                  className="w-full sm:w-auto min-w-[200px]"
                >
                  <Send className="w-4 h-4 mr-2" />
                  <span>Submit Support Request</span>
                </Button>
              </div>
            </form>
          )}
        </div>

        {/* Quick Resource Links Bar */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="font-bold text-slate-700">Quick Support Resources:</div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => onNavigate('faq')}
              className="text-[#F15A24] font-semibold hover:underline flex items-center gap-1"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Read FAQs</span>
            </button>
            <span className="text-slate-300">·</span>
            <button
              type="button"
              onClick={() => onNavigate('warranty')}
              className="text-slate-700 font-semibold hover:text-[#F15A24] flex items-center gap-1"
            >
              <Shield className="w-3.5 h-3.5 text-emerald-600" />
              <span>Warranty Terms</span>
            </button>
            <span className="text-slate-300">·</span>
            <button
              type="button"
              onClick={() => onNavigate('tracking')}
              className="text-slate-700 font-semibold hover:text-[#F15A24] flex items-center gap-1"
            >
              <Truck className="w-3.5 h-3.5 text-blue-600" />
              <span>Track Order</span>
            </button>
            <span className="text-slate-300">·</span>
            <button
              type="button"
              onClick={() => onNavigate('contact')}
              className="text-slate-700 font-semibold hover:text-[#F15A24] flex items-center gap-1"
            >
              <Phone className="w-3.5 h-3.5 text-[#F15A24]" />
              <span>Company Contact</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
