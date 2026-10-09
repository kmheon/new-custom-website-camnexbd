import React, { useState } from 'react';
import { Calculator, CheckCircle2, MessageSquare, ArrowRight, Loader2, Sparkles, Phone, Calendar, MapPin, User, Building, ShieldCheck } from 'lucide-react';
import { QuoteFormData } from '../types';
import { apiFetch } from '../services/apiClient';

interface QuoteCalculatorProps {
  initialPremise?: string;
  initialCameras?: number;
  initialPackage?: string;
}

export const QuoteCalculator: React.FC<QuoteCalculatorProps> = ({
  initialPremise = 'Home',
  initialCameras = 4,
  initialPackage = ''
}) => {
  const [formData, setFormData] = useState<QuoteFormData>({
    propertyType: initialPremise,
    serviceNeeded: initialPackage ? 'CCTV' : 'CCTV',
    cameraCount: initialCameras,
    doorCount: 1,
    storageDays: '15 Days',
    name: '',
    phone: '',
    location: '',
    preferredDate: '',
    notes: '',
    packagePreselected: initialPackage
  });

  const [activeStep, setActiveStep] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [quoteSuccess, setQuoteSuccess] = useState<{ quoteNumber: string } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Dynamic Live Estimated Price calculation
  const getEstimatedPrice = () => {
    let base = 8500;
    if (formData.cameraCount === 2) base = 8500;
    else if (formData.cameraCount === 4) base = 14500;
    else if (formData.cameraCount === 8) base = 27500;
    else if (formData.cameraCount >= 16) base = 54000;
    else base = formData.cameraCount * 3200;

    if (formData.serviceNeeded === 'Wi-Fi & Networking') base = 12000;
    else if (formData.serviceNeeded === 'Access Control') base = 9500 + (formData.doorCount * 6500);
    else if (formData.serviceNeeded === 'All-in-one') base += 18000;

    if (formData.propertyType === 'Office') base += 2500;
    if (formData.propertyType === 'Warehouse' || formData.propertyType === 'Factory') base += 7000;

    const high = Math.round(base * 1.25);
    return `৳${base.toLocaleString()} - ৳${high.toLocaleString()}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.phone.trim()) {
      setErrorMessage('Please provide your full name and phone number.');
      return;
    }

    setErrorMessage('');
    setIsSubmitting(true);

    try {
      const payload = {
        name: formData.name,
        company: `${formData.propertyType} (${formData.location || 'Dhaka'})`,
        phone: formData.phone,
        email: '',
        address: formData.location || 'Dhaka, Bangladesh',
        serviceType: `${formData.serviceNeeded} - ${formData.propertyType} (${formData.cameraCount} Cams / ${formData.doorCount} Doors)`,
        notes: `Selected: ${formData.packagePreselected || 'Custom Builder'}. Storage: ${formData.storageDays}. Preferred Date: ${formData.preferredDate}. Notes: ${formData.notes}`,
        products: [
          { name: formData.serviceNeeded, qty: formData.cameraCount, type: formData.propertyType }
        ]
      };

      const data = await apiFetch<{ success: boolean; quoteNumber: string }>('/quotes', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      if (data && data.success) {
        setQuoteSuccess({ quoteNumber: data.quoteNumber });
      } else {
        setErrorMessage('Failed to submit quote request. Please try calling directly.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Network error occurred. Please call or WhatsApp us.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getWhatsAppMessageUrl = () => {
    const text = `Hello CamneX Bangladesh! I would like to request a site survey and quote:
- Quote Ref: ${quoteSuccess?.quoteNumber || 'NEW-QUOTE'}
- Property Type: ${formData.propertyType}
- Service Needed: ${formData.serviceNeeded}
- Scope: ${formData.cameraCount} Cameras, ${formData.doorCount} Doors
- Name: ${formData.name}
- Phone: ${formData.phone}
- Location: ${formData.location || 'Dhaka'}
- Preferred Date: ${formData.preferredDate || 'Earliest available'}`;
    return `https://wa.me/8801540535150?text=${encodeURIComponent(text)}`;
  };

  return (
    <section id="quote-calculator" className="py-20 lg:py-24 bg-[#0B1220] text-white scroll-mt-20 relative overflow-hidden border-b border-slate-800">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-[#F25C2A]/10 rounded-full blur-[140px] pointer-events-none"></div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-orange-400 text-xs font-bold uppercase tracking-wider mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            Instant Estimate & Site Survey
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold font-['Plus_Jakarta_Sans'] tracking-tight text-white">
            Interactive Quote Calculator
          </h2>
          <p className="mt-3 text-base text-slate-300">
            Tell us about your property to get an accurate estimate and book a certified engineer visit in Dhaka.
          </p>
        </div>

        {/* Success Modal / Card */}
        {quoteSuccess ? (
          <div className="bg-[#111A2E] border border-emerald-500/40 rounded-2xl p-8 sm:p-10 shadow-2xl text-center max-w-2xl mx-auto animate-fade-in">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-5 border border-emerald-500/30">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-1">
              Quotation Request Received
            </div>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-white mb-2 font-['Plus_Jakarta_Sans']">
              Thank You, {formData.name}!
            </h3>
            <p className="text-slate-300 text-sm mb-4">
              Your inquiry has been assigned to our Dhaka technical team.
            </p>

            <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 inline-block text-left mb-6 w-full max-w-md">
              <div className="flex justify-between items-center text-xs text-slate-400 mb-1">
                <span>Quote Reference Number:</span>
                <span className="font-mono font-bold text-[#F25C2A] text-sm">{quoteSuccess.quoteNumber}</span>
              </div>
              <div className="flex justify-between items-center text-xs text-slate-400 mb-1">
                <span>Configuration:</span>
                <span className="text-white font-medium">{formData.propertyType} · {formData.cameraCount} Cameras</span>
              </div>
              <div className="flex justify-between items-center text-xs text-slate-400">
                <span>Estimated Range:</span>
                <span className="text-emerald-400 font-bold">{getEstimatedPrice()}</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href={getWhatsAppMessageUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20ba59] text-white font-bold text-sm px-6 py-3.5 rounded-xl shadow-lg shadow-emerald-600/30 transition-all"
              >
                <MessageSquare className="w-5 h-5" />
                <span>Chat Instantly on WhatsApp</span>
              </a>

              <button
                type="button"
                onClick={() => {
                  setQuoteSuccess(null);
                  setActiveStep(1);
                }}
                className="w-full sm:w-auto px-5 py-3.5 bg-slate-800 hover:bg-slate-700 text-white font-semibold text-sm rounded-xl border border-slate-700"
              >
                Submit Another Request
              </button>
            </div>
          </div>
        ) : (
          
          /* Multi-step Interactive Form */
          <div className="bg-[#111A2E]/95 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-md">
            
            {/* Step Indicators */}
            <div className="grid grid-cols-4 border-b border-slate-800 bg-slate-900/60 text-xs font-bold text-center">
              <div className={`py-3.5 border-r border-slate-800 transition-colors ${activeStep >= 1 ? 'text-[#F25C2A] bg-orange-500/10' : 'text-slate-500'}`}>
                1. Property Type
              </div>
              <div className={`py-3.5 border-r border-slate-800 transition-colors ${activeStep >= 2 ? 'text-[#F25C2A] bg-orange-500/10' : 'text-slate-500'}`}>
                2. Service
              </div>
              <div className={`py-3.5 border-r border-slate-800 transition-colors ${activeStep >= 3 ? 'text-[#F25C2A] bg-orange-500/10' : 'text-slate-500'}`}>
                3. Scope
              </div>
              <div className={`py-3.5 transition-colors ${activeStep >= 4 ? 'text-[#F25C2A] bg-orange-500/10' : 'text-slate-500'}`}>
                4. Contact
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 sm:p-10">
              
              {/* STEP 1: Property Type */}
              {activeStep === 1 && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2 font-['Plus_Jakarta_Sans']">
                      Step 1: What type of property needs security?
                    </h3>
                    <p className="text-xs text-slate-400">
                      We calibrate camera models and cable enclosures to your environment.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    {[
                      { id: 'Home', label: 'Home / Villa', desc: 'Duplex, Apartment' },
                      { id: 'Shop', label: 'Retail Shop', desc: 'Store, Showroom' },
                      { id: 'Office', label: 'Corporate Office', desc: 'Floor, HQ' },
                      { id: 'Warehouse', label: 'Warehouse', desc: 'Depot, Logistics' },
                      { id: 'Factory', label: 'Factory', desc: 'Industrial Plant' }
                    ].map(prop => (
                      <button
                        key={prop.id}
                        type="button"
                        onClick={() => setFormData({ ...formData, propertyType: prop.id })}
                        className={`p-4 rounded-xl border text-left transition-all ${
                          formData.propertyType === prop.id
                            ? 'bg-[#F25C2A] border-[#F25C2A] text-white shadow-lg shadow-orange-500/30'
                            : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        <div className="font-bold text-sm mb-1">{prop.label}</div>
                        <div className={`text-[11px] ${formData.propertyType === prop.id ? 'text-white/80' : 'text-slate-500'}`}>
                          {prop.desc}
                        </div>
                      </button>
                    ))}
                  </div>

                  <div className="pt-4 flex justify-end">
                    <button
                      type="button"
                      onClick={() => setActiveStep(2)}
                      className="bg-[#F25C2A] hover:bg-[#D84818] text-white font-bold text-sm px-6 py-3 rounded-xl flex items-center gap-2"
                    >
                      <span>Continue to Service Needed</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 2: Service Needed */}
              {activeStep === 2 && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2 font-['Plus_Jakarta_Sans']">
                      Step 2: Which solution do you require?
                    </h3>
                    <p className="text-xs text-slate-400">
                      Choose single solutions or a complete turnkey package.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[
                      { id: 'CCTV', title: 'CCTV & Video Surveillance', desc: 'Hikvision / Dahua Cameras, DVR/NVR, mobile streaming' },
                      { id: 'Wi-Fi & Networking', title: 'Structured Cabling & Wi-Fi', desc: 'Cat6 cabling, server racks, mesh Wi-Fi APs' },
                      { id: 'Access Control', title: 'Biometric Access Control', desc: 'ZKTeco face recognition, magnetic door locks, attendance' },
                      { id: 'All-in-one', title: 'Complete All-in-One Package', desc: 'Surveillance + Access Control + Office Networking combined' }
                    ].map(srv => (
                      <button
                        key={srv.id}
                        type="button"
                        onClick={() => setFormData({ ...formData, serviceNeeded: srv.id })}
                        className={`p-5 rounded-xl border text-left transition-all ${
                          formData.serviceNeeded === srv.id
                            ? 'bg-[#F25C2A] border-[#F25C2A] text-white shadow-lg shadow-orange-500/30'
                            : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        <div className="font-bold text-base mb-1">{srv.title}</div>
                        <div className={`text-xs ${formData.serviceNeeded === srv.id ? 'text-white/80' : 'text-slate-400'}`}>
                          {srv.desc}
                        </div>
                      </button>
                    ))}
                  </div>

                  <div className="pt-4 flex justify-between">
                    <button
                      type="button"
                      onClick={() => setActiveStep(1)}
                      className="px-5 py-2.5 bg-slate-800 text-slate-300 hover:text-white rounded-xl text-sm font-semibold"
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveStep(3)}
                      className="bg-[#F25C2A] hover:bg-[#D84818] text-white font-bold text-sm px-6 py-3 rounded-xl flex items-center gap-2"
                    >
                      <span>Continue to Scope</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 3: Scope */}
              {activeStep === 3 && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2 font-['Plus_Jakarta_Sans']">
                      Step 3: Define installation scope & scale
                    </h3>
                    <p className="text-xs text-slate-400">
                      Adjust camera and door quantities for your property layout.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {/* Cameras */}
                    <div className="bg-slate-900 p-5 rounded-xl border border-slate-800">
                      <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-3">
                        Estimated Camera Count
                      </label>
                      <div className="grid grid-cols-4 gap-2 mb-3">
                        {[2, 4, 8, 16].map(count => (
                          <button
                            key={count}
                            type="button"
                            onClick={() => setFormData({ ...formData, cameraCount: count })}
                            className={`py-2 text-xs font-bold rounded-lg border transition-all ${
                              formData.cameraCount === count
                                ? 'bg-[#F25C2A] border-[#F25C2A] text-white'
                                : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                            }`}
                          >
                            {count === 16 ? '16+ Cams' : `${count} Cams`}
                          </button>
                        ))}
                      </div>
                      <span className="text-xs text-slate-400">
                        {formData.cameraCount <= 4 ? 'Single floor / small area' : 'Multi-room / commercial layout'}
                      </span>
                    </div>

                    {/* Storage preference */}
                    <div className="bg-slate-900 p-5 rounded-xl border border-slate-800">
                      <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-3">
                        Video Backup Storage Retention
                      </label>
                      <div className="grid grid-cols-3 gap-2 mb-3">
                        {['7 Days', '15 Days', '30+ Days'].map(storage => (
                          <button
                            key={storage}
                            type="button"
                            onClick={() => setFormData({ ...formData, storageDays: storage })}
                            className={`py-2 text-xs font-bold rounded-lg border transition-all ${
                              formData.storageDays === storage
                                ? 'bg-orange-600 border-orange-500 text-white'
                                : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                            }`}
                          >
                            {storage}
                          </button>
                        ))}
                      </div>
                      <span className="text-xs text-slate-400">
                        Surveillance-grade continuous recording HDD
                      </span>
                    </div>
                  </div>

                  <div className="pt-4 flex justify-between">
                    <button
                      type="button"
                      onClick={() => setActiveStep(2)}
                      className="px-5 py-2.5 bg-slate-800 text-slate-300 hover:text-white rounded-xl text-sm font-semibold"
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveStep(4)}
                      className="bg-[#F25C2A] hover:bg-[#D84818] text-white font-bold text-sm px-6 py-3 rounded-xl flex items-center gap-2"
                    >
                      <span>Continue to Contact Info</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 4: Contact Info & Submission */}
              {activeStep === 4 && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2 font-['Plus_Jakarta_Sans']">
                      Step 4: Contact details for free site survey
                    </h3>
                    <p className="text-xs text-slate-400">
                      Our Dhaka engineering coordinator will call to confirm timing.
                    </p>
                  </div>

                  {errorMessage && (
                    <div className="p-3 bg-red-500/20 border border-red-500/40 text-red-200 text-xs rounded-xl">
                      {errorMessage}
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1">
                        Your Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Tanvir Ahmed"
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 text-sm text-white px-3.5 py-2.5 rounded-xl focus:border-[#F25C2A] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1">
                        Phone Number (WhatsApp Active) *
                      </label>
                      <input
                        type="tel"
                        required
                        placeholder="e.g. 01712-XXXXXX"
                        value={formData.phone}
                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 text-sm text-white px-3.5 py-2.5 rounded-xl focus:border-[#F25C2A] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1">
                        Location / Area in Dhaka *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Gulshan-2, Dhanmondi, Uttara"
                        value={formData.location}
                        onChange={e => setFormData({ ...formData, location: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 text-sm text-white px-3.5 py-2.5 rounded-xl focus:border-[#F25C2A] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1">
                        Preferred Installation / Survey Date
                      </label>
                      <input
                        type="date"
                        value={formData.preferredDate}
                        onChange={e => setFormData({ ...formData, preferredDate: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 text-sm text-white px-3.5 py-2.5 rounded-xl focus:border-[#F25C2A] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">
                      Additional Notes or Specific Requirements
                    </label>
                    <textarea
                      rows={2}
                      placeholder="e.g. Need 2 cameras outside in rain, 2 indoor dome cameras..."
                      value={formData.notes}
                      onChange={e => setFormData({ ...formData, notes: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 text-sm text-white px-3.5 py-2.5 rounded-xl focus:border-[#F25C2A] focus:outline-none"
                    ></textarea>
                  </div>

                  {/* Live Cost Summary Bar */}
                  <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div>
                      <span className="text-xs text-slate-400 block">
                        Estimated Package Investment ({formData.propertyType} · {formData.cameraCount} Cams)
                      </span>
                      <span className="text-xl font-black text-white font-['Plus_Jakarta_Sans']">
                        {getEstimatedPrice()}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 text-right">
                      Includes hardware, cables, connectors & 1-year service SLA
                    </div>
                  </div>

                  <div className="pt-2 flex justify-between items-center">
                    <button
                      type="button"
                      onClick={() => setActiveStep(3)}
                      className="px-5 py-2.5 bg-slate-800 text-slate-300 hover:text-white rounded-xl text-sm font-semibold"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="bg-[#F25C2A] hover:bg-[#D84818] text-white font-bold text-base px-8 py-3.5 rounded-xl shadow-lg shadow-orange-500/30 flex items-center gap-2 disabled:opacity-50"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          <span>Submitting...</span>
                        </>
                      ) : (
                        <>
                          <span>Request Free Site Survey & Quote</span>
                          <ArrowRight className="w-5 h-5" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

            </form>
          </div>
        )}

      </div>
    </section>
  );
};
