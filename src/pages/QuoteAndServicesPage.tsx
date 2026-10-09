import React, { useState } from 'react';
import { Wrench, CheckCircle2, MessageSquare, ArrowRight, ShieldCheck, MapPin, Phone, Upload, Sparkles } from 'lucide-react';
import { SEO } from '../components/common/SEO';
import { Breadcrumbs, Button, Input, Select, Badge, Alert } from '../components/common/UI';
import { quoteService } from '../services';
import { ServiceType, QuoteRequest } from '../types';

interface QuoteAndServicesPageProps {
  onNavigate: (route: string, param?: string) => void;
  defaultService?: ServiceType;
}

export const QuoteAndServicesPage: React.FC<QuoteAndServicesPageProps> = ({
  onNavigate,
  defaultService = 'cctv_installation'
}) => {
  const [serviceType, setServiceType] = useState<ServiceType>(defaultService);
  const [customerName, setCustomerName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [propertyType, setPropertyType] = useState<'home' | 'office' | 'shop' | 'warehouse' | 'factory' | 'other'>('home');
  const [siteAddress, setSiteAddress] = useState('');
  const [cameraCount, setCameraCount] = useState<number>(4);
  const [preferredDate, setPreferredDate] = useState('');
  const [notes, setNotes] = useState('');
  const [fileName, setFileName] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedQuote, setSubmittedQuote] = useState<QuoteRequest | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !phone.trim() || !siteAddress.trim()) {
      setErrorMessage('Please fill in your name, contact phone, and site address.');
      return;
    }

    setErrorMessage('');
    setIsSubmitting(true);

    try {
      const q = await quoteService.createQuote({
        customerName,
        companyName,
        phone,
        email,
        serviceType,
        propertyType,
        siteAddress,
        cameraCount,
        preferredDate,
        notes,
        attachmentName: fileName
      });
      setSubmittedQuote(q);
    } catch (err: any) {
      setErrorMessage('Failed to submit quote inquiry. Please try WhatsApp directly.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const servicesList: Array<{ type: ServiceType; title: string; desc: string }> = [
    { type: 'cctv_installation', title: 'CCTV Camera Installation', desc: 'Cabling and installation, camera mounting, DVR/NVR configuration' },
    { type: 'site_survey', title: 'Premises Survey in Dhaka', desc: 'Premises assessment, camera placement mapping, exact cable assessment' },
    { type: 'networking_wifi', title: 'Enterprise Networking & Wi-Fi', desc: 'Server racks, patch panels, Cat6 cabling, ceiling mesh Wi-Fi APs' },
    { type: 'access_control_biometric', title: 'Biometrics & Door Access Control', desc: 'ZKTeco facial recognition, magnetic door locks, payroll attendance' },
    { type: 'it_infrastructure', title: 'Complete IT Infrastructure', desc: 'Turnkey surveillance + networking + biometrics for corporate offices' },
    { type: 'maintenance_amc', title: 'Preventive Maintenance & AMC', desc: 'Regular camera cleaning and scheduled maintenance visits' }
  ];

  return (
    <div className="bg-[#F8FAFC] min-h-screen py-6 sm:py-10">
      <SEO
        title="Request a Quote & Consultation | CamneX Bangladesh"
        description="Schedule a technical consultation in Dhaka or request a custom bill of materials."
        canonicalPath="/quote"
      />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <Breadcrumbs
          items={[
            { label: 'Home', onClick: () => onNavigate('home') },
            { label: 'Services & Quotations' }
          ]}
        />

        {submittedQuote ? (
          <div className="bg-white p-8 sm:p-12 rounded-2xl border border-slate-200 shadow-xl max-w-2xl mx-auto my-10 text-center space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <Badge variant="success">Quotation Inquiry Logged</Badge>

            <h1 className="text-2xl sm:text-3xl font-black text-[#111827] font-heading">
              Inquiry Ref: {submittedQuote.quoteNumber}
            </h1>

            <p className="text-sm text-slate-600">
              Thank you, <strong className="text-[#111827]">{submittedQuote.customerName}</strong>. Our engineering team has received your site survey request for <strong className="text-[#111827]">{submittedQuote.siteAddress}</strong>.
            </p>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-left space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500">Service:</span>
                <span className="font-bold text-[#111827]">{submittedQuote.serviceType.replace(/_/g, ' ').toUpperCase()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Contact:</span>
                <span className="font-medium text-slate-700">{submittedQuote.phone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Estimated Cameras:</span>
                <span className="font-medium text-slate-700">{submittedQuote.cameraCount}</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <a
                href={`https://wa.me/8801540535150?text=Hello%20CamneX%20Engineering,%20I%20have%20submitted%20Quote%20Ref:%20${submittedQuote.quoteNumber}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20ba59] text-white font-bold text-sm px-6 py-3 rounded-xl shadow-md transition-colors"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Chat on WhatsApp Now</span>
              </a>

              <Button variant="outline" size="md" onClick={() => setSubmittedQuote(null)}>
                Submit Another Request
              </Button>
            </div>
          </div>
        ) : (
          <div className="my-6 space-y-8">
            
            {/* Header */}
            <div className="text-center max-w-2xl mx-auto">
              <Badge variant="orange" className="mb-2">Dhaka Engineering Desk</Badge>
              <h1 className="text-2xl sm:text-4xl font-black text-[#111827] font-heading mb-2">
                Request a Custom Quote or Site Survey
              </h1>
              <p className="text-xs sm:text-sm text-slate-600">
                Receive an itemized bill of materials with genuine hardware models, transparent labor fees, and zero hidden cable charges.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              
              {/* Form (8-col) */}
              <div className="lg:col-span-8 bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
                
                {errorMessage && <Alert type="danger">{errorMessage}</Alert>}

                <form onSubmit={handleSubmit} className="space-y-6">
                  
                  {/* Service Selection */}
                  <div>
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2">
                      1. What service do you require? *
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {servicesList.map((srv) => (
                        <div
                          key={srv.type}
                          onClick={() => setServiceType(srv.type)}
                          className={`p-3 rounded-xl border cursor-pointer transition-all ${
                            serviceType === srv.type
                              ? 'border-[#F15A24] bg-orange-50/20 ring-1 ring-[#F15A24]'
                              : 'border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <div className="font-bold text-xs text-[#111827] mb-0.5">{srv.title}</div>
                          <div className="text-[11px] text-slate-500 line-clamp-1">{srv.desc}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Customer Information */}
                  <div className="pt-4 border-t border-slate-100">
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-3">
                      2. Contact & Site Details
                    </span>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Input
                        label="Full Name *"
                        required
                        placeholder="e.g. Tanvir Ahmed"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                      />
                      <Input
                        label="Mobile Phone *"
                        required
                        placeholder="e.g. 01712-XXXXXX"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                      />
                      <Input
                        label="Company / Organization (Optional)"
                        placeholder="e.g. Apex Textiles / Home Residence"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                      />
                      <Input
                        label="Email Address (Optional)"
                        type="email"
                        placeholder="e.g. name@domain.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Site Address & Property Type */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Select
                      label="Property Environment *"
                      value={propertyType}
                      onChange={(e) => setPropertyType(e.target.value as any)}
                      options={[
                        { value: 'home', label: 'Residential Home / Villa' },
                        { value: 'office', label: 'Corporate Office' },
                        { value: 'shop', label: 'Retail Shop / Showroom' },
                        { value: 'warehouse', label: 'Warehouse / Logistics' },
                        { value: 'factory', label: 'Manufacturing Factory' },
                        { value: 'other', label: 'Other Facility' }
                      ]}
                    />

                    <Input
                      label="Estimated Camera / Device Count"
                      type="number"
                      min={1}
                      max={64}
                      value={cameraCount}
                      onChange={(e) => setCameraCount(parseInt(e.target.value) || 1)}
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                      Site Address / Location in Dhaka *
                    </label>
                    <textarea
                      rows={2}
                      required
                      placeholder="e.g. House 22, Road 6, Chandrima Model Town, Mohammadpur, Dhaka"
                      value={siteAddress}
                      onChange={(e) => setSiteAddress(e.target.value)}
                      className="w-full bg-white border border-slate-300 text-sm text-slate-900 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-[#F15A24]"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                      Project Notes / Special Requirements
                    </label>
                    <textarea
                      rows={3}
                      placeholder="e.g. Need 4 outdoor waterproof cameras with night vision and concealed conduit cabling inside false ceiling..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full bg-white border border-slate-300 text-sm text-slate-900 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-[#F15A24]"
                    />
                  </div>

                  {/* Attachment Simulation */}
                  <div className="p-4 bg-slate-50 rounded-xl border border-dashed border-slate-300 text-center">
                    <Upload className="w-5 h-5 text-slate-400 mx-auto mb-1" />
                    <span className="text-xs text-slate-600 block">
                      Floor Plan or BOQ Attachment (Optional PDF/JPG)
                    </span>
                    <input
                      type="file"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setFileName(e.target.files[0].name);
                        }
                      }}
                      className="text-xs text-slate-500 mt-2"
                    />
                    {fileName && <span className="text-xs font-bold text-emerald-600 block mt-1">Attached: {fileName}</span>}
                  </div>

                  <Button
                    size="lg"
                    type="submit"
                    isLoading={isSubmitting}
                    className="w-full"
                  >
                    <span>Submit Inquiry for Free Site Survey</span>
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>

                </form>

              </div>

              {/* Sidebar Info (4-col) */}
              <div className="lg:col-span-4 space-y-6">
                <div className="bg-[#111827] text-white p-6 rounded-2xl border border-slate-800 space-y-4">
                  <Badge variant="orange">Direct Engineering Desk</Badge>
                  <h3 className="text-lg font-bold font-heading">Need Urgent Assistance?</h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Speak directly with a certified surveillance engineer to discuss layout feasibility or emergency camera replacement.
                  </p>

                  <div className="pt-2 space-y-2">
                    <a
                      href="tel:+8801540535150"
                      className="flex items-center gap-2 p-3 bg-slate-900 rounded-xl border border-slate-800 text-xs font-bold text-white hover:border-[#F15A24]"
                    >
                      <Phone className="w-4 h-4 text-[#F15A24]" />
                      <span>+880 1540-535150</span>
                    </a>

                    <a
                      href="https://wa.me/8801540535150?text=Hello%20CamneX%20Engineering%20Desk"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 p-3 bg-emerald-950/40 rounded-xl border border-emerald-800 text-xs font-bold text-emerald-400 hover:border-emerald-600"
                    >
                      <MessageSquare className="w-4 h-4" />
                      <span>WhatsApp Engineering Desk</span>
                    </a>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-3 text-xs text-slate-600">
                  <span className="font-bold text-[#111827] uppercase tracking-wider block">
                    Our Installation Standard:
                  </span>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#F15A24] flex-shrink-0 mt-0.5" />
                    <span>Concealed PVC pipe and casing cabling standard (no messy dangling wires).</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#F15A24] flex-shrink-0 mt-0.5" />
                    <span>Genuine brand hardware with official verifiable serial numbers.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#F15A24] flex-shrink-0 mt-0.5" />
                    <span>Free Hik-Connect phone app configuration and usage training.</span>
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
