import React, { useState, useEffect } from 'react';
import {
  Settings,
  CreditCard,
  Truck,
  Wrench,
  Receipt,
  Bell,
  LayoutTemplate,
  ShieldAlert,
  Save,
  Plus,
  Trash2,
  RefreshCw,
  Eye,
  Send,
  CheckCircle2,
  AlertCircle,
  Lock,
  Tag,
  DollarSign,
  Clock,
  Globe,
  FileText,
  ExternalLink,
  X,
  Radio
} from 'lucide-react';
import { ImagePickerField } from './ImagePickerField';
import { useSettingsStore, useAdminAuthStore } from '../../store';
import {
  SiteSettings,
  DeliveryZone,
  CourierAdapterConfig,
  InstallationRateSetting,
  TaxRuleConfig,
  LocalizationConfig,
  NotificationTemplate,
  LetterheadTemplateConfig,
  Product
} from '../../types';
import { PERMISSIONS } from '../../shared/permissions';
import { FormShell } from './framework/FormShell';
import { ConfirmDialog } from './framework/ConfirmDialog';
import { Badge, Button } from '../common/UI';
import { apiFetch } from '../../services/apiClient';

interface SettingsModuleProps {
  products?: Product[];
  onOpenProductEdit?: (product: Product) => void;
  onOpenProductCreate?: () => void;
  onClearDemo?: () => void;
  onResetSeeds?: () => void;
}

export const SettingsModule: React.FC<SettingsModuleProps> = ({
  products = [],
  onOpenProductEdit,
  onOpenProductCreate,
  onClearDemo,
  onResetSeeds
}) => {
  const { settings, loadSettings, updateSettings } = useSettingsStore();
  const { currentUser } = useAdminAuthStore();

  const [activeTab, setActiveTab] = useState<
    'general' | 'payment' | 'delivery' | 'installation' | 'tax' | 'notifications' | 'storefront' | 'letterhead' | 'maintenance'
  >('general');


  const [formData, setFormData] = useState<Partial<SiteSettings>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  // Notification Test Modal State
  const [testNotifOpen, setTestNotifOpen] = useState(false);
  const [testRecipient, setTestRecipient] = useState('');
  const [activeTestTemplate, setActiveTestTemplate] = useState<NotificationTemplate | null>(null);
  const [testSending, setTestSending] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; jobId?: string } | null>(null);

  // Maintenance confirmation dialogs
  const [clearDemoConfirmOpen, setClearDemoConfirmOpen] = useState(false);
  const [resetSeedsConfirmOpen, setResetSeedsConfirmOpen] = useState(false);

  // Quick Offer state for storefront tab
  const [quickOfferProductId, setQuickOfferProductId] = useState('');
  const [quickOfferSalePrice, setQuickOfferSalePrice] = useState('');
  const [quickOfferError, setQuickOfferError] = useState('');

  // Extensible Courier State & Testing
  const [testingCourier, setTestingCourier] = useState<string | null>(null);
  const [courierTestResults, setCourierTestResults] = useState<Record<string, { success: boolean; message: string; details?: any } | null>>({});
  const [addCourierModalOpen, setAddCourierModalOpen] = useState(false);
  const [courierCatalog, setCourierCatalog] = useState<any[]>([
    {
      id: 'steadfast',
      name: 'Steadfast Courier',
      status: 'integrated',
      description: 'Nationwide next-day parcel delivery and COD across all 64 districts of Bangladesh.',
      website: 'https://steadfast.com.bd',
      trackingUrlPattern: 'https://steadfast.com.bd/t/{consignment_id}',
      fields: [
        { key: 'apiKey', label: 'API Key', type: 'text', secret: false, required: true },
        { key: 'secretKey', label: 'Secret Key', type: 'password', secret: true, required: true },
        { key: 'testMode', label: 'Sandbox / Test Mode', type: 'boolean', defaultValue: true }
      ]
    },
    {
      id: 'pathao',
      name: 'Pathao Logistics',
      status: 'integrated',
      description: 'Express door-to-door deliveries, fast intra-Dhaka transit, and automated consignment tracking.',
      website: 'https://merchant.pathao.com',
      trackingUrlPattern: 'https://merchant.pathao.com/tracking?consignment_id={consignment_id}',
      fields: [
        { key: 'clientId', label: 'Client ID', type: 'text', secret: false, required: true },
        { key: 'clientSecret', label: 'Client Secret', type: 'password', secret: true, required: true },
        { key: 'storeId', label: 'Store ID', type: 'text', secret: false, required: false },
        { key: 'testMode', label: 'Sandbox / Test Mode', type: 'boolean', defaultValue: true }
      ]
    },
    {
      id: 'redx',
      name: 'RedX Logistics',
      status: 'development_required',
      description: 'Doorstep parcel pickup, sub-district coverage, and reverse logistics in Bangladesh.',
      website: 'https://redx.com.bd',
      trackingUrlPattern: 'https://redx.com.bd/track/{consignment_id}',
      fields: [
        { key: 'apiKey', label: 'API Token', type: 'password', secret: true, required: true },
        { key: 'storeId', label: 'Pickup Store ID', type: 'text', secret: false, required: false },
        { key: 'testMode', label: 'Sandbox / Test Mode', type: 'boolean', defaultValue: true }
      ],
      devNotes: 'Requires implementing server/modules/courier/adapters/redx.adapter.js using RedX Open API v1.0.0.'
    },
    {
      id: 'paperfly',
      name: 'Paperfly Delivery Network',
      status: 'development_required',
      description: 'Extensive doorstep delivery network with coverage for non-metropolitan thana and upazilas.',
      website: 'https://paperfly.com.bd',
      trackingUrlPattern: 'https://paperfly.com.bd/tracking?tracking_id={consignment_id}',
      fields: [
        { key: 'username', label: 'API Username', type: 'text', secret: false, required: true },
        { key: 'password', label: 'API Password', type: 'password', secret: true, required: true },
        { key: 'paperflyKey', label: 'Paperfly Key', type: 'password', secret: true, required: true },
        { key: 'testMode', label: 'Sandbox / Test Mode', type: 'boolean', defaultValue: true }
      ],
      devNotes: 'Requires implementing server/modules/courier/adapters/paperfly.adapter.js using Wings API.'
    },
    {
      id: 'ecourier',
      name: 'eCourier',
      status: 'development_required',
      description: 'Full-service logistics provider with tech-enabled tracking and air/surface options.',
      website: 'https://ecourier.com.bd',
      trackingUrlPattern: 'https://ecourier.com.bd/tracking/?tracking_id={consignment_id}',
      fields: [
        { key: 'apiKey', label: 'API Key', type: 'text', secret: false, required: true },
        { key: 'apiSecret', label: 'API Secret', type: 'password', secret: true, required: true },
        { key: 'userId', label: 'User ID', type: 'text', secret: false, required: true },
        { key: 'testMode', label: 'Sandbox / Test Mode', type: 'boolean', defaultValue: true }
      ],
      devNotes: 'Requires implementing server/modules/courier/adapters/ecourier.adapter.js.'
    },
    {
      id: 'sundarban',
      name: 'Sundarban Courier Service',
      status: 'development_required',
      description: 'Largest traditional courier network in Bangladesh with extensive regional branch offices.',
      website: 'https://sundarbancourierltd.com',
      trackingUrlPattern: 'https://sundarbancourierltd.com/track/{consignment_id}',
      fields: [
        { key: 'corporateCode', label: 'Corporate Client Code', type: 'text', secret: false, required: true },
        { key: 'apiKey', label: 'Branch / API Key', type: 'password', secret: true, required: true }
      ],
      devNotes: 'Requires implementing Sundarban corporate dispatch adapter.'
    },
    {
      id: 'custom',
      name: 'Custom Logistics / Dedicated Fleet',
      status: 'development_required',
      description: 'Connect internal delivery vans or third-party freight API via customized webhook endpoint.',
      website: '',
      trackingUrlPattern: '',
      fields: [
        { key: 'webhookUrl', label: 'Webhook / Dispatch URL', type: 'text', secret: false, required: true },
        { key: 'authHeader', label: 'Authorization Header', type: 'password', secret: true, required: false }
      ],
      devNotes: 'Custom fleet adapter can be configured to push dispatch webhooks to internal fleet tracking.'
    }
  ]);

  // Default values helper
  useEffect(() => {
    if (settings) {
      setFormData({
        ...settings,
        deliveryZones: settings.deliveryZones && settings.deliveryZones.length > 0
          ? settings.deliveryZones
          : [
              { id: 'zone-1', name: 'Inside Dhaka City', code: 'DHAKA_IN', standardFee: 60, expressFee: 120, estimatedDelivery: '24-48 Hours', freeDeliveryThreshold: 50000, enabled: true },
              { id: 'zone-2', name: 'Outside Dhaka (Nationwide)', code: 'DHAKA_OUT', standardFee: 120, expressFee: 220, estimatedDelivery: '48-72 Hours', freeDeliveryThreshold: 75000, enabled: true },
              { id: 'zone-3', name: 'Dhaka Suburbs (Savar, Gazipur, Narayanganj)', code: 'DHAKA_SUB', standardFee: 100, expressFee: 180, estimatedDelivery: '24-48 Hours', freeDeliveryThreshold: 60000, enabled: true }
            ],
        courierIntegrations: settings.courierIntegrations || {
          steadfast: { provider: 'steadfast', enabled: false, testMode: true, apiKey: '', secretKey: '' },
          pathao: { provider: 'pathao', enabled: false, testMode: true, clientId: '', clientSecret: '', username: '', password: '', storeId: '' }
        },
        installationOptions: settings.installationOptions && settings.installationOptions.length > 0
          ? settings.installationOptions
          : [
              { id: 'inst-1', name: 'Analog / HD CCTV Camera Setup', description: 'Mounting, aiming, focal adjustment and BNC termination', fee: 350, unit: 'per camera', enabled: true },
              { id: 'inst-2', name: 'IP Security Camera & PoE Drop', description: 'Mounting, Cat6 termination, IP configuration and NVR pairing', fee: 500, unit: 'per camera', enabled: true },
              { id: 'inst-3', name: 'Cat6 Structured Cabling & Conduit', description: 'Per meter cable pulling, PVC casing/conduit laying, label tagging', fee: 35, unit: 'per meter', enabled: true },
              { id: 'inst-4', name: 'Biometric Attendance / Access Control Terminal', description: 'Wall bracket mount, door lock wiring, Ethernet link and admin sync', fee: 1500, unit: 'per terminal', enabled: true },
              { id: 'inst-5', name: 'Rack, Switch & Server Headend Setup', description: 'Patch panel punching, switch mounting, UPS linking and cable dressing', fee: 2500, unit: 'per headend', enabled: true }
            ],
        taxRules: settings.taxRules || {
          vatEnabled: false,
          defaultVatRate: 5,
          pricesIncludeVat: true,
          binNumber: '',
          tinNumber: '',
          invoicePrefix: 'CNX-INV-',
          nextInvoiceNumber: 1001
        },
        localization: settings.localization || {
          currencyCode: 'BDT',
          currencySymbol: '৳',
          timezone: 'Asia/Dhaka',
          businessHours: settings.businessHours || 'Saturday – Thursday: 9:30 AM – 7:30 PM (Friday On-Call)'
        },
        notificationTemplates: settings.notificationTemplates && settings.notificationTemplates.length > 0
          ? settings.notificationTemplates
          : [
              {
                id: 'tmpl-ord-placed',
                name: 'Order Placed (Customer Email)',
                trigger: 'order_placed',
                channel: 'email',
                subject: 'Your CamneX Order #{order_number} has been received',
                body: 'Dear {customer_name},\n\nThank you for choosing CamneX Bangladesh. We have received your order #{order_number} totaling {total_amount}.\n\nOur engineering team is reviewing your hardware requirements. We will notify you once dispatched.\n\nBest regards,\nCamneX Bangladesh Engineering Team',
                enabled: true,
                variables: ['{customer_name}', '{order_number}', '{total_amount}', '{company_name}']
              },
              {
                id: 'tmpl-ord-placed-sms',
                name: 'Order Placed (Customer SMS)',
                trigger: 'order_placed',
                channel: 'sms',
                body: 'CamneX: Dear {customer_name}, your order #{order_number} for {total_amount} is confirmed. Hotline: +880 1712-345678.',
                enabled: true,
                variables: ['{customer_name}', '{order_number}', '{total_amount}']
              },
              {
                id: 'tmpl-ord-dispatched',
                name: 'Order Dispatched with Courier Tracking',
                trigger: 'order_dispatched',
                channel: 'email',
                subject: 'Your CamneX Order #{order_number} is on the way!',
                body: 'Dear {customer_name},\n\nYour equipment for order #{order_number} has been carefully tested and handed over to {courier_name}.\nTracking Reference: {tracking_number}\n\nPlease inspect package seals upon delivery.\n\nThank you,\nCamneX Support',
                enabled: true,
                variables: ['{customer_name}', '{order_number}', '{courier_name}', '{tracking_number}']
              },
              {
                id: 'tmpl-quote-received',
                name: 'Commercial Quote Acknowledgment',
                trigger: 'quote_received',
                channel: 'email',
                subject: 'CamneX Project Quote Request #{quote_id}',
                body: 'Dear {customer_name},\n\nThank you for requesting an engineering quotation from CamneX Bangladesh. Reference: #{quote_id}.\n\nA surveillance systems specialist has been assigned to prepare your technical bill of materials.\n\nRegards,\nCamneX Sales Engineering',
                enabled: true,
                variables: ['{customer_name}', '{quote_id}', '{company_name}']
              }
            ]
      });
      setHasChanges(false);
    }
  }, [settings]);

  useEffect(() => {
    // Load dynamic courier providers from backend
    apiFetch('/api/admin/couriers')
      .then((res: any) => {
        if (res?.providers && Array.isArray(res.providers)) {
          setCourierCatalog(res.providers);
        }
      })
      .catch(() => {});
  }, []);

  const handleTestCourier = async (providerId: string) => {
    setTestingCourier(providerId);
    setCourierTestResults(prev => ({ ...prev, [providerId]: null }));
    try {
      const providerConfig = formData.courierIntegrations?.[providerId] || {};
      const res: any = await apiFetch(`/api/admin/couriers/${providerId}/test-connection`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(providerConfig)
      });
      setCourierTestResults(prev => ({
        ...prev,
        [providerId]: {
          success: Boolean(res?.success),
          message: res?.message || (res?.success ? 'Connection verified successfully.' : 'Connection test failed.'),
          details: res?.details
        }
      }));
    } catch (err: any) {
      setCourierTestResults(prev => ({
        ...prev,
        [providerId]: {
          success: false,
          message: err?.message || 'Failed to connect to courier API.'
        }
      }));
    } finally {
      setTestingCourier(null);
    }
  };

  const updateField = (field: keyof SiteSettings, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
    setSaveSuccess(false);
    setSaveError(null);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(false);
    try {
      await updateSettings(formData);
      setHasChanges(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      setSaveError(err.message || 'Failed to save settings. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSendTestNotification = async () => {
    if (!testRecipient || !activeTestTemplate) return;
    setTestSending(true);
    setTestResult(null);
    try {
      const res = await apiFetch<{ success: boolean; jobId: string; message: string }>('/admin/notifications/test', {
        method: 'POST',
        body: JSON.stringify({
          channel: activeTestTemplate.channel,
          trigger: activeTestTemplate.trigger,
          recipient: testRecipient,
          templateSubject: activeTestTemplate.subject,
          templateBody: activeTestTemplate.body,
          sampleData: {
            customer_name: 'Tanvir Hossain',
            order_number: 'CNX-ORD-9021',
            total_amount: '৳48,500',
            courier_name: 'Steadfast Courier',
            tracking_number: 'STDF-8839210',
            quote_id: 'QT-2026-081',
            company_name: formData.companyName || 'CamneX Bangladesh'
          }
        })
      });
      setTestResult({ success: true, message: res.message || 'Test notification enqueued in background jobs worker!', jobId: res.jobId });
    } catch (err: any) {
      setTestResult({ success: false, message: err.message || 'Failed to dispatch test notification.' });
    } finally {
      setTestSending(false);
    }
  };

  const hasPerm = (p: string) => {
    if (!currentUser) return false;
    if (currentUser.role === 'admin' || currentUser.role === 'super-admin') return true;
    const perms = (currentUser as any).permissions || [];
    return perms.includes('*') || perms.includes(p);
  };

  // Helper for quick offers
  const activeSpecialOffers = products.filter(
    p => p.status === 'active' && p.websiteVisible !== false && p.pricing?.salePrice && p.pricing?.regularPrice && p.pricing.salePrice < p.pricing.regularPrice
  );
  const productsEligibleForOffer = products.filter(
    p => p.status === 'active' && p.pricing?.regularPrice && (!p.pricing?.salePrice || p.pricing.salePrice >= p.pricing.regularPrice)
  );

  const getTaxRules = (): TaxRuleConfig => ({
    vatEnabled: false,
    defaultVatRate: 5,
    pricesIncludeVat: true,
    binNumber: '',
    tinNumber: '',
    invoicePrefix: 'CNX-INV-',
    nextInvoiceNumber: 1001,
    ...(formData.taxRules || {})
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold font-heading text-white flex items-center gap-2">
            <Settings className="w-5 h-5 text-[#F15A24]" />
            Website Manager — Settings & Configuration
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage company identity, payment methods, delivery charges, courier integrations, taxes, and notification templates.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {saveSuccess && (
            <div className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Settings saved & cache revalidated
            </div>
          )}
          {saveError && (
            <div className="flex items-center gap-1.5 text-xs text-rose-400 bg-rose-500/10 px-3 py-1.5 rounded-lg border border-rose-500/20">
              <AlertCircle className="w-3.5 h-3.5" />
              {saveError}
            </div>
          )}
          <Button
            onClick={handleSave}
            disabled={isSaving || !hasChanges}
            size="sm"
            className="bg-[#F15A24] hover:bg-[#D94D1C] text-white flex items-center gap-1.5 shadow-md disabled:opacity-50"
          >
            {isSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            Save Configuration
          </Button>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex items-center gap-1 bg-slate-950 p-1.5 rounded-xl border border-slate-800 overflow-x-auto scrollbar-none">
        {[
          { id: 'general', label: 'General & Localization', icon: <Globe className="w-3.5 h-3.5" /> },
          { id: 'payment', label: 'Payment Methods & MFS', icon: <CreditCard className="w-3.5 h-3.5" /> },
          { id: 'delivery', label: 'Delivery & Couriers', icon: <Truck className="w-3.5 h-3.5" /> },
          { id: 'installation', label: 'Installation Rates', icon: <Wrench className="w-3.5 h-3.5" /> },
          { id: 'tax', label: 'Tax & Invoicing', icon: <Receipt className="w-3.5 h-3.5" /> },
          { id: 'notifications', label: 'Notification Templates', icon: <Bell className="w-3.5 h-3.5" /> },
          { id: 'storefront', label: 'Storefront CMS & SEO', icon: <LayoutTemplate className="w-3.5 h-3.5" /> },
          { id: 'letterhead', label: 'BOM Letterhead & Templates', icon: <FileText className="w-3.5 h-3.5" /> },
          { id: 'maintenance', label: 'System Maintenance', icon: <ShieldAlert className="w-3.5 h-3.5" /> }
        ].map(t => (

          <button
            key={t.id}
            type="button"
            onClick={() => setActiveTab(t.id as any)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
              activeTab === t.id
                ? 'bg-[#F15A24] text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {/* TAB CONTENT */}
      <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800">
        {/* 1. GENERAL & LOCALIZATION */}
        {activeTab === 'general' && (
          <div className="space-y-6 max-w-4xl">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Company Identity & Contact Info</h3>
              <p className="text-xs text-slate-400">Values entered here populate the header, footer, contact drawer, and official order invoices.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1">Company Registered Name</label>
                <input
                  type="text"
                  value={formData.companyName || ''}
                  onChange={(e) => updateField('companyName', e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 text-white p-2.5 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1">Primary Phone / Hotline</label>
                <input
                  type="text"
                  value={formData.phone || ''}
                  onChange={(e) => updateField('phone', e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 text-white p-2.5 rounded-lg text-xs font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1">Customer Support Email</label>
                <input
                  type="email"
                  value={formData.email || ''}
                  onChange={(e) => updateField('email', e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 text-white p-2.5 rounded-lg text-xs font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1">Secondary / Sales Email</label>
                <input
                  type="email"
                  value={formData.secondaryEmail || ''}
                  onChange={(e) => updateField('secondaryEmail', e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 text-white p-2.5 rounded-lg text-xs font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1">WhatsApp Business Number</label>
                <input
                  type="text"
                  value={formData.whatsappNumber || ''}
                  onChange={(e) => updateField('whatsappNumber', e.target.value)}
                  placeholder="e.g. +880 1712-345678"
                  className="w-full bg-slate-900 border border-slate-700 text-white p-2.5 rounded-lg text-xs font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1">Facebook Official Page URL</label>
                <input
                  type="text"
                  value={formData.facebookUrl || ''}
                  onChange={(e) => updateField('facebookUrl', e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 text-white p-2.5 rounded-lg text-xs font-mono"
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-xs font-bold text-slate-400 block mb-1">Physical Office & Facility Address</label>
                <input
                  type="text"
                  value={formData.address || ''}
                  onChange={(e) => updateField('address', e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 text-white p-2.5 rounded-lg text-xs"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-2">Regional Localization & Currency</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-400 block mb-1">Currency Code</label>
                  <input
                    type="text"
                    value={formData.localization?.currencyCode || 'BDT'}
                    onChange={(e) => updateField('localization', { ...(formData.localization || {}), currencyCode: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 text-white p-2 rounded-lg text-xs font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 block mb-1">Currency Symbol</label>
                  <input
                    type="text"
                    value={formData.localization?.currencySymbol || '৳'}
                    onChange={(e) => updateField('localization', { ...(formData.localization || {}), currencySymbol: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 text-white p-2 rounded-lg text-xs font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 block mb-1">Operating Timezone</label>
                  <input
                    type="text"
                    value={formData.localization?.timezone || 'Asia/Dhaka'}
                    onChange={(e) => updateField('localization', { ...(formData.localization || {}), timezone: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 text-white p-2 rounded-lg text-xs font-mono"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-400 block mb-1">
                Official Business Hours <span className="text-slate-500 font-normal">(only renders on storefront if entered)</span>
              </label>
              <input
                type="text"
                value={formData.businessHours || ''}
                onChange={(e) => {
                  updateField('businessHours', e.target.value);
                  updateField('localization', { ...(formData.localization || {}), businessHours: e.target.value });
                }}
                placeholder="e.g. Saturday – Thursday: 9:30 AM – 7:30 PM (Friday On-Call)"
                className="w-full bg-slate-900 border border-slate-700 text-white p-2.5 rounded-lg text-xs"
              />
            </div>
          </div>
        )}

        {/* 2. PAYMENT METHODS & MFS */}
        {activeTab === 'payment' && (
          <div className="space-y-6 max-w-4xl">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Configured Payment Methods</h3>
              <p className="text-xs text-slate-400">Empty payment methods are completely hidden from checkout to avoid misleading customers.</p>
            </div>

            {/* Cash on Delivery Toggle */}
            <div className="flex items-center justify-between p-4 bg-slate-900/80 rounded-xl border border-slate-800">
              <div>
                <span className="font-bold text-white block text-sm">Cash on Delivery (COD)</span>
                <span className="text-xs text-slate-400">Allow customers to pay in cash upon hardware delivery. Strictly controlled by admin.</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={Boolean(formData.enableCashOnDelivery)}
                  onChange={(e) => updateField('enableCashOnDelivery', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#F15A24]"></div>
              </label>
            </div>

            {/* Mobile Financial Services (bKash & Nagad) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-pink-400 text-xs">bKash Merchant / Personal Account</span>
                  <Badge variant={formData.bkashMerchantNumber ? 'success' : 'gray'}>
                    {formData.bkashMerchantNumber ? 'Active at Checkout' : 'Hidden'}
                  </Badge>
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">bKash Account / Counter Number</label>
                  <input
                    type="text"
                    value={formData.bkashMerchantNumber || ''}
                    onChange={(e) => updateField('bkashMerchantNumber', e.target.value)}
                    placeholder="Leave blank to hide bKash at checkout"
                    className="w-full bg-slate-950 border border-slate-700 text-white p-2 rounded text-xs font-mono"
                  />
                  <span className="text-[10px] text-slate-500 block mt-1">Requires customer to enter TrxID during manual verification.</span>
                </div>
              </div>

              <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-orange-400 text-xs">Nagad Merchant / Personal Account</span>
                  <Badge variant={formData.nagadMerchantNumber ? 'success' : 'gray'}>
                    {formData.nagadMerchantNumber ? 'Active at Checkout' : 'Hidden'}
                  </Badge>
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Nagad Account Number</label>
                  <input
                    type="text"
                    value={formData.nagadMerchantNumber || ''}
                    onChange={(e) => updateField('nagadMerchantNumber', e.target.value)}
                    placeholder="Leave blank to hide Nagad at checkout"
                    className="w-full bg-slate-950 border border-slate-700 text-white p-2 rounded text-xs font-mono"
                  />
                  <span className="text-[10px] text-slate-500 block mt-1">Customers submit deposit TrxID for admin verification.</span>
                </div>
              </div>
            </div>

            {/* Corporate Bank Deposit Details */}
            <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sky-400 text-xs">Corporate Bank Transfer / Deposit</span>
                <Badge variant={formData.bankDetails?.accountNumber ? 'success' : 'gray'}>
                  {formData.bankDetails?.accountNumber ? 'Active at Checkout' : 'Hidden'}
                </Badge>
              </div>
              <p className="text-xs text-slate-400">Institutional buyers and enterprise customers can transfer funds directly to this commercial account.</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Bank Name</label>
                  <input
                    type="text"
                    value={formData.bankDetails?.bankName || ''}
                    onChange={(e) => updateField('bankDetails', { ...(formData.bankDetails || {}), bankName: e.target.value })}
                    placeholder="e.g. City Bank Ltd"
                    className="w-full bg-slate-950 border border-slate-700 text-white p-2 rounded text-xs"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Account Name</label>
                  <input
                    type="text"
                    value={formData.bankDetails?.accountName || ''}
                    onChange={(e) => updateField('bankDetails', { ...(formData.bankDetails || {}), accountName: e.target.value })}
                    placeholder="e.g. CamneX Bangladesh Ltd"
                    className="w-full bg-slate-950 border border-slate-700 text-white p-2 rounded text-xs"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Account Number</label>
                  <input
                    type="text"
                    value={formData.bankDetails?.accountNumber || ''}
                    onChange={(e) => updateField('bankDetails', { ...(formData.bankDetails || {}), accountNumber: e.target.value })}
                    placeholder="e.g. 1540535150001"
                    className="w-full bg-slate-950 border border-slate-700 text-white p-2 rounded text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Branch Name</label>
                  <input
                    type="text"
                    value={formData.bankDetails?.branch || formData.bankDetails?.branchName || ''}
                    onChange={(e) => updateField('bankDetails', { ...(formData.bankDetails || {}), branch: e.target.value, branchName: e.target.value })}
                    placeholder="e.g. Mirpur-1 Branch, Dhaka"
                    className="w-full bg-slate-950 border border-slate-700 text-white p-2 rounded text-xs"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Routing Number</label>
                  <input
                    type="text"
                    value={formData.bankDetails?.routingNumber || ''}
                    onChange={(e) => updateField('bankDetails', { ...(formData.bankDetails || {}), routingNumber: e.target.value })}
                    placeholder="e.g. 225272635"
                    className="w-full bg-slate-950 border border-slate-700 text-white p-2 rounded text-xs font-mono"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 3. DELIVERY & COURIERS */}
        {activeTab === 'delivery' && (
          <div className="space-y-6 max-w-4xl">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Delivery Methods, Zones & Charges</h3>
              <p className="text-xs text-slate-400">Configure regional shipping tariffs and courier integration adapters.</p>
            </div>

            {/* Delivery Zones Table */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white text-xs">Configured Delivery Zones</span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const zones = [...(formData.deliveryZones || [])];
                    zones.push({
                      id: `zone-${Date.now()}`,
                      name: 'New Custom Zone',
                      code: 'CUSTOM_ZONE',
                      standardFee: 100,
                      expressFee: 180,
                      estimatedDelivery: '2-3 Business Days',
                      freeDeliveryThreshold: 50000,
                      enabled: true
                    });
                    updateField('deliveryZones', zones);
                  }}
                  className="text-xs"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  Add Zone
                </Button>
              </div>

              <div className="divide-y divide-slate-800 border border-slate-800 rounded-xl overflow-hidden bg-slate-900/40">
                {(formData.deliveryZones || []).map((zone, zIdx) => (
                  <div key={zone.id} className="p-4 grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                    <div className="md:col-span-4">
                      <input
                        type="text"
                        value={zone.name}
                        onChange={(e) => {
                          const zones = [...(formData.deliveryZones || [])];
                          zones[zIdx] = { ...zones[zIdx], name: e.target.value };
                          updateField('deliveryZones', zones);
                        }}
                        className="w-full bg-slate-950 border border-slate-700 text-white p-1.5 rounded text-xs font-bold"
                        placeholder="Zone Name"
                      />
                      <input
                        type="text"
                        value={zone.estimatedDelivery}
                        onChange={(e) => {
                          const zones = [...(formData.deliveryZones || [])];
                          zones[zIdx] = { ...zones[zIdx], estimatedDelivery: e.target.value };
                          updateField('deliveryZones', zones);
                        }}
                        className="w-full bg-transparent text-[11px] text-slate-400 mt-1 border-b border-slate-800 focus:outline-none"
                        placeholder="Estimated Delivery (e.g. 24-48 Hours)"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="text-[10px] text-slate-400 block">Standard (৳)</label>
                      <input
                        type="number"
                        value={zone.standardFee}
                        onChange={(e) => {
                          const zones = [...(formData.deliveryZones || [])];
                          zones[zIdx] = { ...zones[zIdx], standardFee: parseInt(e.target.value) || 0 };
                          updateField('deliveryZones', zones);
                        }}
                        className="w-full bg-slate-950 border border-slate-700 text-white p-1.5 rounded text-xs font-mono font-bold"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="text-[10px] text-slate-400 block">Express (৳)</label>
                      <input
                        type="number"
                        value={zone.expressFee || 0}
                        onChange={(e) => {
                          const zones = [...(formData.deliveryZones || [])];
                          zones[zIdx] = { ...zones[zIdx], expressFee: parseInt(e.target.value) || 0 };
                          updateField('deliveryZones', zones);
                        }}
                        className="w-full bg-slate-950 border border-slate-700 text-white p-1.5 rounded text-xs font-mono font-bold"
                      />
                    </div>

                    <div className="md:col-span-3">
                      <label className="text-[10px] text-slate-400 block">Free Threshold (৳)</label>
                      <input
                        type="number"
                        value={zone.freeDeliveryThreshold || 0}
                        onChange={(e) => {
                          const zones = [...(formData.deliveryZones || [])];
                          zones[zIdx] = { ...zones[zIdx], freeDeliveryThreshold: parseInt(e.target.value) || 0 };
                          updateField('deliveryZones', zones);
                        }}
                        placeholder="0 = Disabled"
                        className="w-full bg-slate-950 border border-slate-700 text-white p-1.5 rounded text-xs font-mono"
                      />
                    </div>

                    <div className="md:col-span-1 flex items-center justify-end gap-2">
                      <input
                        type="checkbox"
                        checked={zone.enabled}
                        onChange={(e) => {
                          const zones = [...(formData.deliveryZones || [])];
                          zones[zIdx] = { ...zones[zIdx], enabled: e.target.checked };
                          updateField('deliveryZones', zones);
                        }}
                        className="w-4 h-4 rounded text-[#F15A24] focus:ring-[#F15A24] cursor-pointer"
                        title="Enable/disable zone"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const zones = (formData.deliveryZones || []).filter((_, i) => i !== zIdx);
                          updateField('deliveryZones', zones);
                        }}
                        className="text-slate-500 hover:text-rose-400 p-1"
                        title="Remove zone"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Courier Integration Slots & Extensible Logistics Catalog */}
            <div className="pt-4 border-t border-slate-800 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <Truck className="w-4 h-4 text-[#F15A24]" />
                    <span>Courier API Integrations & Logistics Pipeline</span>
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    AES-256-GCM encrypted credentials. Steadfast and Pathao adapters are production-ready. Additional providers can be configured with clear developer status.
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setAddCourierModalOpen(true)}
                  className="text-xs self-start sm:self-auto"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  Add Courier Provider
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 1. Steadfast Courier Slot (Integrated) */}
                <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-xs flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5 text-amber-400" />
                        Steadfast Courier
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20">
                        Integrated
                      </span>
                    </div>
                    <Badge variant={formData.courierIntegrations?.steadfast?.enabled ? 'success' : 'gray'}>
                      {formData.courierIntegrations?.steadfast?.enabled ? 'Active at Dispatch' : 'Disabled'}
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-0.5">API Key</label>
                      <input
                        type="text"
                        value={formData.courierIntegrations?.steadfast?.apiKey || ''}
                        onChange={(e) => {
                          const c = { ...(formData.courierIntegrations || {}) };
                          c.steadfast = { ...(c.steadfast || { provider: 'steadfast', enabled: false }), apiKey: e.target.value };
                          updateField('courierIntegrations', c);
                        }}
                        placeholder="Steadfast API Key"
                        className="w-full bg-slate-950 border border-slate-700 text-white p-2 rounded text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-0.5">Secret Key</label>
                      <input
                        type="password"
                        value={formData.courierIntegrations?.steadfast?.secretKey || ''}
                        onChange={(e) => {
                          const c = { ...(formData.courierIntegrations || {}) };
                          c.steadfast = { ...(c.steadfast || { provider: 'steadfast', enabled: false }), secretKey: e.target.value };
                          updateField('courierIntegrations', c);
                        }}
                        placeholder="••••••••••••••••"
                        className="w-full bg-slate-950 border border-slate-700 text-white p-2 rounded text-xs font-mono"
                      />
                    </div>
                    <div className="flex items-center justify-between pt-1">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.courierIntegrations?.steadfast?.testMode !== false}
                          onChange={(e) => {
                            const c = { ...(formData.courierIntegrations || {}) };
                            c.steadfast = { ...(c.steadfast || { provider: 'steadfast', enabled: false }), testMode: e.target.checked };
                            updateField('courierIntegrations', c);
                          }}
                          className="rounded text-[#F15A24] focus:ring-[#F15A24] w-3.5 h-3.5"
                        />
                        <span className="text-[11px] text-slate-300">Sandbox / Test Mode</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={Boolean(formData.courierIntegrations?.steadfast?.enabled)}
                          onChange={(e) => {
                            const c = { ...(formData.courierIntegrations || {}) };
                            c.steadfast = { ...(c.steadfast || { provider: 'steadfast', enabled: false }), enabled: e.target.checked };
                            updateField('courierIntegrations', c);
                          }}
                          className="rounded text-[#F15A24] focus:ring-[#F15A24] w-3.5 h-3.5"
                        />
                        <span className="text-[11px] text-white font-bold">Enable Adapter</span>
                      </label>
                    </div>

                    {/* Test Connection Button */}
                    <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                      <span className="text-[10px] text-slate-500">Endpoint: portal.steadfast.com.bd</span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleTestCourier('steadfast')}
                        disabled={testingCourier === 'steadfast'}
                        className="text-[11px] py-1 h-7"
                      >
                        {testingCourier === 'steadfast' ? (
                          <>
                            <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                            Testing...
                          </>
                        ) : (
                          <>
                            <Radio className="w-3 h-3 mr-1 text-[#F15A24]" />
                            Test Connection
                          </>
                        )}
                      </Button>
                    </div>

                    {/* Test Result Message */}
                    {courierTestResults['steadfast'] && (
                      <div className={`p-2 rounded text-xs flex items-start gap-2 ${
                        courierTestResults['steadfast']?.success
                          ? 'bg-emerald-950/60 border border-emerald-800 text-emerald-300'
                          : 'bg-rose-950/60 border border-rose-800 text-rose-300'
                      }`}>
                        {courierTestResults['steadfast']?.success ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                        ) : (
                          <AlertCircle className="w-3.5 h-3.5 text-rose-400 mt-0.5 shrink-0" />
                        )}
                        <span className="leading-tight">{courierTestResults['steadfast']?.message}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* 2. Pathao Logistics Slot (Integrated) */}
                <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-xs flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5 text-amber-400" />
                        Pathao Logistics
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20">
                        Integrated
                      </span>
                    </div>
                    <Badge variant={formData.courierIntegrations?.pathao?.enabled ? 'success' : 'gray'}>
                      {formData.courierIntegrations?.pathao?.enabled ? 'Active at Dispatch' : 'Disabled'}
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-slate-400 block mb-0.5">Client ID</label>
                        <input
                          type="text"
                          value={formData.courierIntegrations?.pathao?.clientId || ''}
                          onChange={(e) => {
                            const c = { ...(formData.courierIntegrations || {}) };
                            c.pathao = { ...(c.pathao || { provider: 'pathao', enabled: false }), clientId: e.target.value };
                            updateField('courierIntegrations', c);
                          }}
                          placeholder="Client ID"
                          className="w-full bg-slate-950 border border-slate-700 text-white p-2 rounded text-xs font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400 block mb-0.5">Store ID</label>
                        <input
                          type="text"
                          value={formData.courierIntegrations?.pathao?.storeId || ''}
                          onChange={(e) => {
                            const c = { ...(formData.courierIntegrations || {}) };
                            c.pathao = { ...(c.pathao || { provider: 'pathao', enabled: false }), storeId: e.target.value };
                            updateField('courierIntegrations', c);
                          }}
                          placeholder="Store ID"
                          className="w-full bg-slate-950 border border-slate-700 text-white p-2 rounded text-xs font-mono"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-0.5">Client Secret</label>
                      <input
                        type="password"
                        value={formData.courierIntegrations?.pathao?.clientSecret || ''}
                        onChange={(e) => {
                          const c = { ...(formData.courierIntegrations || {}) };
                          c.pathao = { ...(c.pathao || { provider: 'pathao', enabled: false }), clientSecret: e.target.value };
                          updateField('courierIntegrations', c);
                        }}
                        placeholder="••••••••••••••••"
                        className="w-full bg-slate-950 border border-slate-700 text-white p-2 rounded text-xs font-mono"
                      />
                    </div>
                    <div className="flex items-center justify-between pt-1">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.courierIntegrations?.pathao?.testMode !== false}
                          onChange={(e) => {
                            const c = { ...(formData.courierIntegrations || {}) };
                            c.pathao = { ...(c.pathao || { provider: 'pathao', enabled: false }), testMode: e.target.checked };
                            updateField('courierIntegrations', c);
                          }}
                          className="rounded text-[#F15A24] focus:ring-[#F15A24] w-3.5 h-3.5"
                        />
                        <span className="text-[11px] text-slate-300">Sandbox / Test Mode</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={Boolean(formData.courierIntegrations?.pathao?.enabled)}
                          onChange={(e) => {
                            const c = { ...(formData.courierIntegrations || {}) };
                            c.pathao = { ...(c.pathao || { provider: 'pathao', enabled: false }), enabled: e.target.checked };
                            updateField('courierIntegrations', c);
                          }}
                          className="rounded text-[#F15A24] focus:ring-[#F15A24] w-3.5 h-3.5"
                        />
                        <span className="text-[11px] text-white font-bold">Enable Adapter</span>
                      </label>
                    </div>

                    {/* Test Connection Button */}
                    <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                      <span className="text-[10px] text-slate-500">OAuth: courier-api-sandbox.pathao.com</span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleTestCourier('pathao')}
                        disabled={testingCourier === 'pathao'}
                        className="text-[11px] py-1 h-7"
                      >
                        {testingCourier === 'pathao' ? (
                          <>
                            <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                            Testing...
                          </>
                        ) : (
                          <>
                            <Radio className="w-3 h-3 mr-1 text-[#F15A24]" />
                            Test Connection
                          </>
                        )}
                      </Button>
                    </div>

                    {/* Test Result Message */}
                    {courierTestResults['pathao'] && (
                      <div className={`p-2 rounded text-xs flex items-start gap-2 ${
                        courierTestResults['pathao']?.success
                          ? 'bg-emerald-950/60 border border-emerald-800 text-emerald-300'
                          : 'bg-rose-950/60 border border-rose-800 text-rose-300'
                      }`}>
                        {courierTestResults['pathao']?.success ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                        ) : (
                          <AlertCircle className="w-3.5 h-3.5 text-rose-400 mt-0.5 shrink-0" />
                        )}
                        <span className="leading-tight">{courierTestResults['pathao']?.message}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Additional Configured Courier Providers (Dynamic Extensibility) */}
                {Object.entries(formData.courierIntegrations || {})
                  .filter(([k]) => k !== 'steadfast' && k !== 'pathao')
                  .map(([provKey, provVal]: [string, any]) => {
                    const catalogItem = courierCatalog.find(c => c.id === provKey);
                    const isIntegrated = catalogItem?.status === 'integrated';

                    return (
                      <div key={provKey} className="p-4 bg-slate-900/60 rounded-xl border border-slate-800 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white text-xs flex items-center gap-1.5">
                              <Lock className="w-3.5 h-3.5 text-amber-400" />
                              {catalogItem?.name || provKey.toUpperCase()}
                            </span>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold border ${
                              isIntegrated
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                            }`}>
                              {isIntegrated ? 'Integrated' : 'Adapter Dev Required'}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              const c = { ...(formData.courierIntegrations || {}) };
                              delete c[provKey];
                              updateField('courierIntegrations', c);
                            }}
                            className="text-slate-500 hover:text-rose-400 text-xs p-1"
                            title="Remove courier slot"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {!isIntegrated && (
                          <div className="p-2 bg-amber-950/40 border border-amber-800/60 rounded text-[11px] text-amber-300/90 leading-relaxed">
                            <strong>Adapter Development Required:</strong> Saved credentials will be encrypted and stored safely. Automatic booking and live tracking require implementing <code className="text-amber-200">server/modules/courier/adapters/{provKey}.adapter.js</code>.
                          </div>
                        )}

                        <div className="space-y-2">
                          {(catalogItem?.fields || [{ key: 'apiKey', label: 'API Key / Secret', type: 'password' }]).map((field: any) => (
                            <div key={field.key}>
                              <label className="text-[10px] text-slate-400 block mb-0.5">{field.label}</label>
                              <input
                                type={field.type || 'text'}
                                value={provVal[field.key] || ''}
                                onChange={(e) => {
                                  const c = { ...(formData.courierIntegrations || {}) };
                                  c[provKey] = { ...(c[provKey] || {}), [field.key]: e.target.value };
                                  updateField('courierIntegrations', c);
                                }}
                                placeholder={field.secret ? '••••••••••••••••' : `Enter ${field.label}`}
                                className="w-full bg-slate-950 border border-slate-700 text-white p-2 rounded text-xs font-mono"
                              />
                            </div>
                          ))}

                          <div className="flex items-center justify-between pt-1">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={provVal.testMode !== false}
                                onChange={(e) => {
                                  const c = { ...(formData.courierIntegrations || {}) };
                                  c[provKey] = { ...(c[provKey] || {}), testMode: e.target.checked };
                                  updateField('courierIntegrations', c);
                                }}
                                className="rounded text-[#F15A24] focus:ring-[#F15A24] w-3.5 h-3.5"
                              />
                              <span className="text-[11px] text-slate-300">Sandbox Mode</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={Boolean(provVal.enabled)}
                                onChange={(e) => {
                                  const c = { ...(formData.courierIntegrations || {}) };
                                  c[provKey] = { ...(c[provKey] || {}), enabled: e.target.checked };
                                  updateField('courierIntegrations', c);
                                }}
                                className="rounded text-[#F15A24] focus:ring-[#F15A24] w-3.5 h-3.5"
                              />
                              <span className="text-[11px] text-white font-bold">Enable Slot</span>
                            </label>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        )}

        {/* 4. INSTALLATION & CHARGES */}
        {activeTab === 'installation' && (
          <div className="space-y-6 max-w-4xl">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Installation Options & Standard Charges</h3>
              <p className="text-xs text-slate-400">Define standard engineering rates for on-site camera installation, structured cabling, and biometric terminals.</p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white text-xs">Standard Service Charges</span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const list = [...(formData.installationOptions || [])];
                    list.push({
                      id: `inst-${Date.now()}`,
                      name: 'Custom Technical Service',
                      description: 'On-site installation and testing',
                      fee: 500,
                      unit: 'per device',
                      enabled: true
                    });
                    updateField('installationOptions', list);
                  }}
                  className="text-xs"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  Add Installation Option
                </Button>
              </div>

              <div className="divide-y divide-slate-800 border border-slate-800 rounded-xl overflow-hidden bg-slate-900/40">
                {(formData.installationOptions || []).map((opt, oIdx) => (
                  <div key={opt.id} className="p-4 grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                    <div className="md:col-span-5">
                      <input
                        type="text"
                        value={opt.name}
                        onChange={(e) => {
                          const list = [...(formData.installationOptions || [])];
                          list[oIdx] = { ...list[oIdx], name: e.target.value };
                          updateField('installationOptions', list);
                        }}
                        className="w-full bg-slate-950 border border-slate-700 text-white p-1.5 rounded text-xs font-bold"
                        placeholder="Service Title"
                      />
                      <input
                        type="text"
                        value={opt.description}
                        onChange={(e) => {
                          const list = [...(formData.installationOptions || [])];
                          list[oIdx] = { ...list[oIdx], description: e.target.value };
                          updateField('installationOptions', list);
                        }}
                        className="w-full bg-transparent text-[11px] text-slate-400 mt-1 border-b border-slate-800 focus:outline-none"
                        placeholder="Description of engineering work included"
                      />
                    </div>

                    <div className="md:col-span-3">
                      <label className="text-[10px] text-slate-400 block">Base Charge (৳)</label>
                      <input
                        type="number"
                        value={opt.fee}
                        onChange={(e) => {
                          const list = [...(formData.installationOptions || [])];
                          list[oIdx] = { ...list[oIdx], fee: parseInt(e.target.value) || 0 };
                          updateField('installationOptions', list);
                        }}
                        className="w-full bg-slate-950 border border-slate-700 text-white p-1.5 rounded text-xs font-mono font-bold"
                      />
                    </div>

                    <div className="md:col-span-3">
                      <label className="text-[10px] text-slate-400 block">Unit / Billing Basis</label>
                      <input
                        type="text"
                        value={opt.unit}
                        onChange={(e) => {
                          const list = [...(formData.installationOptions || [])];
                          list[oIdx] = { ...list[oIdx], unit: e.target.value };
                          updateField('installationOptions', list);
                        }}
                        className="w-full bg-slate-950 border border-slate-700 text-white p-1.5 rounded text-xs"
                        placeholder="e.g. per camera"
                      />
                    </div>

                    <div className="md:col-span-1 flex items-center justify-end gap-2">
                      <input
                        type="checkbox"
                        checked={opt.enabled}
                        onChange={(e) => {
                          const list = [...(formData.installationOptions || [])];
                          list[oIdx] = { ...list[oIdx], enabled: e.target.checked };
                          updateField('installationOptions', list);
                        }}
                        className="w-4 h-4 rounded text-[#F15A24] focus:ring-[#F15A24] cursor-pointer"
                        title="Enable/disable option"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const list = (formData.installationOptions || []).filter((_, i) => i !== oIdx);
                          updateField('installationOptions', list);
                        }}
                        className="text-slate-500 hover:text-rose-400 p-1"
                        title="Remove option"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 5. TAX & INVOICING */}
        {activeTab === 'tax' && (
          <div className="space-y-6 max-w-4xl">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Tax Rules & Invoice Numbering</h3>
              <p className="text-xs text-slate-400">Configure value-added tax rates, BIN/TIN compliance numbers, and invoice sequence counters.</p>
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-900/80 rounded-xl border border-slate-800">
              <div>
                <span className="font-bold text-white block text-sm">Value Added Tax (VAT) Calculation</span>
                <span className="text-xs text-slate-400">Compute official government VAT on printable invoices and checkout receipts.</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={Boolean(formData.taxRules?.vatEnabled)}
                  onChange={(e) => {
                    const t = getTaxRules();
                    t.vatEnabled = e.target.checked;
                    updateField('taxRules', t);
                  }}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#F15A24]"></div>
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1">Default VAT Rate (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.taxRules?.defaultVatRate ?? 5}
                  onChange={(e) => {
                    const t = getTaxRules();
                    t.defaultVatRate = parseFloat(e.target.value) || 0;
                    updateField('taxRules', t);
                  }}
                  className="w-full bg-slate-900 border border-slate-700 text-white p-2.5 rounded-lg text-xs font-mono font-bold"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1">Pricing Display Mode</label>
                <select
                  value={formData.taxRules?.pricesIncludeVat ? 'inclusive' : 'exclusive'}
                  onChange={(e) => {
                    const t = getTaxRules();
                    t.pricesIncludeVat = e.target.value === 'inclusive';
                    updateField('taxRules', t);
                  }}
                  className="w-full bg-slate-900 border border-slate-700 text-white p-2.5 rounded-lg text-xs"
                >
                  <option value="inclusive">Prices are VAT Inclusive (Standard for Bangladesh)</option>
                  <option value="exclusive">Prices are VAT Exclusive (VAT added on top at checkout)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1">Business Identification Number (BIN)</label>
                <input
                  type="text"
                  value={formData.taxRules?.binNumber || ''}
                  onChange={(e) => {
                    const t = getTaxRules();
                    t.binNumber = e.target.value;
                    updateField('taxRules', t);
                  }}
                  placeholder="e.g. 002345678-0101"
                  className="w-full bg-slate-900 border border-slate-700 text-white p-2.5 rounded-lg text-xs font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1">Taxpayer Identification Number (TIN)</label>
                <input
                  type="text"
                  value={formData.taxRules?.tinNumber || ''}
                  onChange={(e) => {
                    const t = getTaxRules();
                    t.tinNumber = e.target.value;
                    updateField('taxRules', t);
                  }}
                  placeholder="e.g. 5432198760"
                  className="w-full bg-slate-900 border border-slate-700 text-white p-2.5 rounded-lg text-xs font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1">Invoice Number Prefix</label>
                <input
                  type="text"
                  value={formData.taxRules?.invoicePrefix || 'CNX-INV-'}
                  onChange={(e) => {
                    const t = getTaxRules();
                    t.invoicePrefix = e.target.value;
                    updateField('taxRules', t);
                  }}
                  className="w-full bg-slate-900 border border-slate-700 text-white p-2.5 rounded-lg text-xs font-mono font-bold"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1">Next Sequential Invoice Number</label>
                <input
                  type="number"
                  value={formData.taxRules?.nextInvoiceNumber ?? 1001}
                  onChange={(e) => {
                    const t = getTaxRules();
                    t.nextInvoiceNumber = parseInt(e.target.value) || 1001;
                    updateField('taxRules', t);
                  }}
                  className="w-full bg-slate-900 border border-slate-700 text-white p-2.5 rounded-lg text-xs font-mono font-bold"
                />
              </div>
            </div>
          </div>
        )}

        {/* 6. NOTIFICATION TEMPLATES */}
        {activeTab === 'notifications' && (
          <div className="space-y-6 max-w-4xl">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Automated Notification Templates (Email & SMS)</h3>
              <p className="text-xs text-slate-400">
                Templates are queued through the transactional background jobs worker. Click any token chip to insert dynamic variables.
              </p>
            </div>

            <div className="space-y-4">
              {(formData.notificationTemplates || []).map((tmpl, tIdx) => {
                // Live sample substitution for preview
                let previewText = tmpl.body;
                let previewSubject = tmpl.subject || '';
                const sampleVars: Record<string, string> = {
                  '{customer_name}': 'Tanvir Hossain',
                  '{order_number}': 'CNX-ORD-9021',
                  '{total_amount}': '৳48,500',
                  '{quote_id}': 'QT-2026-081',
                  '{courier_name}': 'Steadfast Courier',
                  '{tracking_number}': 'STDF-8839210',
                  '{company_name}': formData.companyName || 'CamneX Bangladesh'
                };
                Object.entries(sampleVars).forEach(([k, v]) => {
                  previewText = previewText.split(k).join(v);
                  previewSubject = previewSubject.split(k).join(v);
                });

                return (
                  <div key={tmpl.id} className="p-4 bg-slate-900/60 rounded-xl border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <Badge variant={tmpl.channel === 'email' ? 'orange' : 'info'}>
                          {tmpl.channel.toUpperCase()}
                        </Badge>
                        <span className="font-bold text-white text-xs">{tmpl.name}</span>
                        <span className="text-[10px] font-mono text-slate-500">({tmpl.trigger})</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setActiveTestTemplate(tmpl);
                            setTestRecipient(tmpl.channel === 'email' ? 'admin@camnexbd.com' : '+8801700000000');
                            setTestResult(null);
                            setTestNotifOpen(true);
                          }}
                          className="text-[11px] h-7 px-2 flex items-center gap-1"
                        >
                          <Send className="w-3 h-3 text-[#F15A24]" />
                          Test Queue
                        </Button>

                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={tmpl.enabled}
                            onChange={(e) => {
                              const list = [...(formData.notificationTemplates || [])];
                              list[tIdx] = { ...list[tIdx], enabled: e.target.checked };
                              updateField('notificationTemplates', list);
                            }}
                            className="sr-only peer"
                          />
                          <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#F15A24]"></div>
                        </label>
                      </div>
                    </div>

                    {tmpl.channel === 'email' && (
                      <div>
                        <label className="text-[10px] text-slate-400 block mb-0.5">Subject Line</label>
                        <input
                          type="text"
                          value={tmpl.subject || ''}
                          onChange={(e) => {
                            const list = [...(formData.notificationTemplates || [])];
                            list[tIdx] = { ...list[tIdx], subject: e.target.value };
                            updateField('notificationTemplates', list);
                          }}
                          className="w-full bg-slate-950 border border-slate-700 text-white p-2 rounded text-xs"
                        />
                      </div>
                    )}

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[10px] text-slate-400 block">Template Message Body</label>
                        <div className="flex items-center gap-1 flex-wrap">
                          {tmpl.variables.map(v => (
                            <button
                              key={v}
                              type="button"
                              onClick={() => {
                                const list = [...(formData.notificationTemplates || [])];
                                list[tIdx] = { ...list[tIdx], body: list[tIdx].body + ' ' + v };
                                updateField('notificationTemplates', list);
                              }}
                              className="text-[10px] font-mono bg-slate-800 hover:bg-[#F15A24]/20 hover:text-[#F15A24] text-slate-300 px-1.5 py-0.5 rounded cursor-pointer transition"
                              title="Click to insert at end"
                            >
                              +{v}
                            </button>
                          ))}
                        </div>
                      </div>
                      <textarea
                        rows={3}
                        value={tmpl.body}
                        onChange={(e) => {
                          const list = [...(formData.notificationTemplates || [])];
                          list[tIdx] = { ...list[tIdx], body: e.target.value };
                          updateField('notificationTemplates', list);
                        }}
                        className="w-full bg-slate-950 border border-slate-700 text-white p-2 rounded text-xs font-mono leading-relaxed"
                      />
                    </div>

                    {/* Live Preview Box */}
                    <div className="p-3 bg-slate-950/80 rounded-lg border border-slate-800/80">
                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                        <Eye className="w-3 h-3 text-[#F15A24]" />
                        Simulated Visitor View
                      </div>
                      {tmpl.subject && (
                        <div className="text-xs font-bold text-white mb-1">
                          Subject: <span className="font-normal text-slate-300">{previewSubject}</span>
                        </div>
                      )}
                      <div className="text-xs text-slate-300 whitespace-pre-line font-mono bg-slate-900/60 p-2.5 rounded border border-slate-800">
                        {previewText}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 7. STOREFRONT CMS & SEO */}
        {activeTab === 'storefront' && (
          <div className="space-y-6 max-w-4xl">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Storefront CMS & SEO Defaults</h3>
              <p className="text-xs text-slate-400">Control promotional banners, homepage special offers slider, top bar highlights, and global SEO meta defaults.</p>
            </div>

            {/* Special Offers Slider */}
            <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-bold text-white text-xs">Homepage Special Offer Slider</span>
                  <p className="text-[11px] text-slate-400">Controls rotation interval and maximum cards displayed.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.specialOfferSlider?.enabled !== false}
                    onChange={(e) => updateField('specialOfferSlider', {
                      ...(formData.specialOfferSlider || { enabled: true, interval: 5, maxOffers: 5 }),
                      enabled: e.target.checked
                    })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#F15A24]"></div>
                </label>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Slide Interval (Seconds)</label>
                  <input
                    type="number"
                    min={1}
                    max={60}
                    value={formData.specialOfferSlider?.interval ?? 5}
                    onChange={(e) => updateField('specialOfferSlider', {
                      ...(formData.specialOfferSlider || { enabled: true, maxOffers: 5 }),
                      interval: Math.max(1, parseInt(e.target.value) || 5)
                    })}
                    className="w-full bg-slate-950 border border-slate-700 text-white p-2 rounded text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Maximum Cards in Slider</label>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={formData.specialOfferSlider?.maxOffers ?? 5}
                    onChange={(e) => updateField('specialOfferSlider', {
                      ...(formData.specialOfferSlider || { enabled: true, interval: 5 }),
                      maxOffers: Math.max(1, parseInt(e.target.value) || 5)
                    })}
                    className="w-full bg-slate-950 border border-slate-700 text-white p-2 rounded text-xs font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Top Announcement Banner */}
            <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-bold text-white text-xs">Top Header Announcement Bar</span>
                  <p className="text-[11px] text-slate-400">Displays a dismissible promotional pill banner above navigation.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(formData.promoBanner?.enabled)}
                    onChange={(e) => updateField('promoBanner', {
                      enabled: e.target.checked,
                      text: formData.promoBanner?.text || 'Official Hikvision & ZKTeco Partner in Bangladesh. Genuine Warranty.',
                      link: formData.promoBanner?.link || ''
                    })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#F15A24]"></div>
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Banner Text</label>
                  <input
                    type="text"
                    value={formData.promoBanner?.text || ''}
                    onChange={(e) => updateField('promoBanner', {
                      enabled: Boolean(formData.promoBanner?.enabled),
                      text: e.target.value,
                      link: formData.promoBanner?.link || ''
                    })}
                    placeholder="e.g. Authorized Hikvision & Dahua Support Partner in Bangladesh"
                    className="w-full bg-slate-950 border border-slate-700 text-white p-2 rounded text-xs"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Action Link (Optional)</label>
                  <input
                    type="text"
                    value={formData.promoBanner?.link || ''}
                    onChange={(e) => updateField('promoBanner', {
                      enabled: Boolean(formData.promoBanner?.enabled),
                      text: formData.promoBanner?.text || '',
                      link: e.target.value
                    })}
                    placeholder="/packages or /quote"
                    className="w-full bg-slate-950 border border-slate-700 text-white p-2 rounded text-xs font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Global SEO Meta Defaults */}
            <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800 space-y-3">
              <span className="font-bold text-white text-xs block">Global SEO & Social Share Defaults</span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Default Title Template</label>
                  <input
                    type="text"
                    value={formData.seoTitle || ''}
                    onChange={(e) => updateField('seoTitle', e.target.value)}
                    placeholder="e.g. CamneX Bangladesh | Security & Surveillance"
                    className="w-full bg-slate-950 border border-slate-700 text-white p-2 rounded text-xs"
                  />
                </div>
                <ImagePickerField
                  label="Open Graph Social Image (OG URL)"
                  value={formData.seoOgImage || ''}
                  onChange={(url) => updateField('seoOgImage', url)}
                  placeholder="/images/og-share.png"
                  helperText="Default 1200x630 share preview banner for Facebook, LinkedIn, Twitter, and WhatsApp previews."
                  theme="dark"
                  modalTitle="Select Open Graph Social Image"
                />
                <div className="md:col-span-2">
                  <label className="text-[11px] text-slate-400 block mb-1">Default Meta Description</label>
                  <textarea
                    rows={2}
                    value={formData.seoDescription || ''}
                    onChange={(e) => updateField('seoDescription', e.target.value)}
                    placeholder="Official Hikvision, Dahua, ZKTeco and Ruijie enterprise partner in Bangladesh..."
                    className="w-full bg-slate-950 border border-slate-700 text-white p-2 rounded text-xs"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 8. BOM & QUOTATION LETTERHEAD TEMPLATES */}
        {activeTab === 'letterhead' && (
          <div className="space-y-6 max-w-4xl">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Official Letterhead & Document Templates</h3>
              <p className="text-xs text-slate-400">
                Manage the company letterhead, branding accents, contact coordinates, and legal disclaimers applied to all exported Bills of Materials (BOM) and client quotations.
              </p>
            </div>

            <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <h4 className="font-bold text-white text-xs">Default Letterhead Template</h4>
                  <p className="text-[11px] text-slate-400">Applied automatically to PDF and DOCX exports generated from the Package Builder.</p>
                </div>
                <Badge variant="orange" className="text-[10px]">Active Default</Badge>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Company Display Name</label>
                  <input
                    type="text"
                    value={formData.letterheadTemplate?.companyName || formData.companyName || 'CamneX Bangladesh'}
                    onChange={(e) => updateField('letterheadTemplate', {
                      ...(formData.letterheadTemplate || {}),
                      companyName: e.target.value
                    })}
                    placeholder="CamneX Bangladesh"
                    className="w-full bg-slate-950 border border-slate-700 text-white p-2 rounded text-xs focus:ring-1 focus:ring-[#F15A24]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Tagline / Engineering Subtitle</label>
                  <input
                    type="text"
                    value={formData.letterheadTemplate?.tagline || 'Certified Security Systems Integrator & Authorized Hikvision Partner'}
                    onChange={(e) => updateField('letterheadTemplate', {
                      ...(formData.letterheadTemplate || {}),
                      tagline: e.target.value
                    })}
                    placeholder="Certified Security Systems Integrator"
                    className="w-full bg-slate-950 border border-slate-700 text-white p-2 rounded text-xs focus:ring-1 focus:ring-[#F15A24]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Direct Hotline / Support Phone</label>
                  <input
                    type="text"
                    value={formData.letterheadTemplate?.phone || formData.phone || '+880 1317-251000'}
                    onChange={(e) => updateField('letterheadTemplate', {
                      ...(formData.letterheadTemplate || {}),
                      phone: e.target.value
                    })}
                    placeholder="+880 1317-251000"
                    className="w-full bg-slate-950 border border-slate-700 text-white p-2 rounded text-xs focus:ring-1 focus:ring-[#F15A24]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Official Quotation Email</label>
                  <input
                    type="email"
                    value={formData.letterheadTemplate?.email || formData.email || 'info@camnexbd.com'}
                    onChange={(e) => updateField('letterheadTemplate', {
                      ...(formData.letterheadTemplate || {}),
                      email: e.target.value
                    })}
                    placeholder="info@camnexbd.com"
                    className="w-full bg-slate-950 border border-slate-700 text-white p-2 rounded text-xs focus:ring-1 focus:ring-[#F15A24]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Official Website URL</label>
                  <input
                    type="text"
                    value={formData.letterheadTemplate?.website || formData.website || 'https://camnexbd.com'}
                    onChange={(e) => updateField('letterheadTemplate', {
                      ...(formData.letterheadTemplate || {}),
                      website: e.target.value
                    })}
                    placeholder="https://camnexbd.com"
                    className="w-full bg-slate-950 border border-slate-700 text-white p-2 rounded text-xs focus:ring-1 focus:ring-[#F15A24]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Quotation Validity Window (Calendar Days)</label>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={formData.letterheadTemplate?.validityDays || 7}
                    onChange={(e) => updateField('letterheadTemplate', {
                      ...(formData.letterheadTemplate || {}),
                      validityDays: parseInt(e.target.value, 10) || 7
                    })}
                    className="w-full bg-slate-950 border border-slate-700 text-white p-2 rounded text-xs focus:ring-1 focus:ring-[#F15A24]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Physical Corporate Address</label>
                <input
                  type="text"
                  value={formData.letterheadTemplate?.address || formData.address || 'Block A, Chandrima Model Town, Main Rd, Dhaka 1207, Bangladesh'}
                  onChange={(e) => updateField('letterheadTemplate', {
                    ...(formData.letterheadTemplate || {}),
                    address: e.target.value
                  })}
                  className="w-full bg-slate-950 border border-slate-700 text-white p-2 rounded text-xs focus:ring-1 focus:ring-[#F15A24]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Terms, Cable Rules & Engineering Disclaimer</label>
                <textarea
                  rows={3}
                  value={formData.letterheadTemplate?.disclaimerText || 'All prices are in BDT and valid for 7 calendar days from issue date. Cable allocations are based on 10m/camera engineering standards. Site installation, conduit piping, and commissioning quoted separately.'}
                  onChange={(e) => updateField('letterheadTemplate', {
                    ...(formData.letterheadTemplate || {}),
                    disclaimerText: e.target.value
                  })}
                  className="w-full bg-slate-950 border border-slate-700 text-white p-2 rounded text-xs focus:ring-1 focus:ring-[#F15A24]"
                />
              </div>
            </div>
          </div>
        )}

        {/* 9. SYSTEM MAINTENANCE */}
        {activeTab === 'maintenance' && (
          <div className="space-y-6 max-w-4xl">
            <div>

              <h3 className="text-sm font-bold text-rose-400 uppercase tracking-wider">System & Database Maintenance</h3>
              <p className="text-xs text-slate-400">
                Guarded actions for cleaning demo records or resetting baseline catalog seeds. Strictly blocked in production environments.
              </p>
            </div>

            <div className="p-4 bg-slate-900/60 rounded-xl border border-rose-500/30 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="font-bold text-white text-xs">Remove All Sample Demo Records</h4>
                  <p className="text-[11px] text-slate-400">
                    Permanently deletes sample demonstration products, packages, projects, and testimonials while preserving real customer records.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="danger"
                  size="sm"
                  disabled={!hasPerm(PERMISSIONS.SYSTEM_MAINTENANCE) && !hasPerm(PERMISSIONS.ROLES_MANAGE)}
                  onClick={() => setClearDemoConfirmOpen(true)}
                  className="shrink-0"
                >
                  <Trash2 className="w-3.5 h-3.5 mr-1" />
                  Clear Demo Content
                </Button>
              </div>

              <div className="pt-3 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="font-bold text-white text-xs">Reset Database to Initial Baseline Seeds</h4>
                  <p className="text-[11px] text-slate-400">
                    Re-seeds default authorized brands and spec templates. Strictly blocked when running in production mode.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={!hasPerm(PERMISSIONS.SYSTEM_MAINTENANCE) && !hasPerm(PERMISSIONS.ROLES_MANAGE)}
                  onClick={() => setResetSeedsConfirmOpen(true)}
                  className="!border-rose-500/40 text-rose-400 hover:bg-rose-500/10 shrink-0"
                >
                  <RefreshCw className="w-3.5 h-3.5 mr-1" />
                  Reset Sample Seeds
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* MODAL: SEND TEST NOTIFICATION */}
      {testNotifOpen && activeTestTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Send className="w-4 h-4 text-[#F15A24]" />
                Dispatch Test {activeTestTemplate.channel.toUpperCase()} Notification
              </h3>
              <button
                type="button"
                onClick={() => setTestNotifOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-400">
              This will enqueue a <code>notification_dispatch</code> job in the SQLite background worker. Variables will be dynamically rendered.
            </p>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">
                Recipient {activeTestTemplate.channel === 'email' ? 'Email Address' : 'Mobile Number'}
              </label>
              <input
                type={activeTestTemplate.channel === 'email' ? 'email' : 'text'}
                value={testRecipient}
                onChange={(e) => setTestRecipient(e.target.value)}
                placeholder={activeTestTemplate.channel === 'email' ? 'engineering@camnexbd.com' : '+880 1712-345678'}
                className="w-full bg-slate-950 border border-slate-700 text-white p-2.5 rounded-lg text-xs font-mono"
              />
            </div>

            {testResult && (
              <div className={`p-3 rounded-lg border text-xs ${testResult.success ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300' : 'bg-rose-500/10 border-rose-500/20 text-rose-300'}`}>
                {testResult.message}
                {testResult.jobId && (
                  <span className="block font-mono text-[10px] text-slate-400 mt-1">Job ID: {testResult.jobId}</span>
                )}
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setTestNotifOpen(false)}
              >
                Close
              </Button>
              <Button
                size="sm"
                onClick={handleSendTestNotification}
                disabled={testSending || !testRecipient}
                className="bg-[#F15A24] hover:bg-[#D94D1C] text-white flex items-center gap-1.5"
              >
                {testSending ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                Enqueue Test Dispatch
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ADD COURIER PROVIDER MODAL */}
      {addCourierModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 space-y-5 max-h-[85vh] flex flex-col shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Truck className="w-4 h-4 text-[#F15A24]" />
                  <span>Add Courier Provider Integration</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Expand CamneX logistics capabilities. Choose from supported adapters or configure roadmap slots.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setAddCourierModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto space-y-3 pr-1 divide-y divide-slate-800/60">
              {courierCatalog.map((prov) => {
                const isConfigured = Boolean(formData.courierIntegrations?.[prov.id]);
                const isIntegrated = prov.status === 'integrated';

                return (
                  <div key={prov.id} className="pt-3 first:pt-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1 max-w-md">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-xs">{prov.name}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded font-bold border ${
                          isIntegrated
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        }`}>
                          {isIntegrated ? 'Integrated & Available' : 'Adapter Development Required'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-snug">{prov.description}</p>
                      {prov.devNotes && (
                        <div className="text-[10px] text-amber-300/80 bg-amber-950/30 p-1.5 rounded border border-amber-900/40">
                          {prov.devNotes}
                        </div>
                      )}
                      {prov.website && (
                        <a
                          href={prov.website}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[10px] text-[#F15A24] hover:underline inline-flex items-center gap-1"
                        >
                          <span>Partner Portal</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      )}
                    </div>

                    <div className="shrink-0">
                      {isConfigured ? (
                        <span className="text-xs text-slate-500 font-bold px-3 py-1.5 rounded bg-slate-800/80 border border-slate-700 block text-center">
                          ✓ Configured
                        </span>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => {
                            const c = { ...(formData.courierIntegrations || {}) };
                            c[prov.id] = {
                              provider: prov.id,
                              enabled: false,
                              testMode: true
                            };
                            updateField('courierIntegrations', c);
                            setAddCourierModalOpen(false);
                          }}
                          className={`text-xs ${
                            isIntegrated
                              ? 'bg-[#F15A24] hover:bg-[#D94D1C] text-white'
                              : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                          }`}
                        >
                          <Plus className="w-3.5 h-3.5 mr-1" />
                          <span>Add Slot</span>
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setAddCourierModalOpen(false)}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM DIALOG: CLEAR DEMO RECORDS */}
      <ConfirmDialog
        isOpen={clearDemoConfirmOpen}
        title="Clear All Sample Demo Records"
        message="This operation will permanently delete all demo products, packages, testimonials, and projects tagged as demonstration data. Real customer orders, quotes, and registered users will remain completely untouched."
        confirmPhrase="CLEAR DEMO"
        confirmLabel="Permanently Delete Demo Records"
        variant="danger"
        onConfirm={async () => {
          setClearDemoConfirmOpen(false);
          if (onClearDemo) onClearDemo();
        }}
        onCancel={() => setClearDemoConfirmOpen(false)}
      />

      {/* CONFIRM DIALOG: RESET SEEDS */}
      <ConfirmDialog
        isOpen={resetSeedsConfirmOpen}
        title="Reset Baseline Seeds"
        message="This will re-initialize default authorized brands and spec templates. This action is blocked when NODE_ENV is set to production."
        confirmPhrase="RESET SEEDS"
        confirmLabel="Rebuild Sample Seeds"
        variant="danger"
        onConfirm={async () => {
          setResetSeedsConfirmOpen(false);
          if (onResetSeeds) onResetSeeds();
        }}
        onCancel={() => setResetSeedsConfirmOpen(false)}
      />
    </div>
  );
};
