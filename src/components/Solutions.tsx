import React from 'react';
import { Camera, Wifi, Fingerprint, Check, ArrowRight, ShieldCheck } from 'lucide-react';
import { ImageWithFallback } from './ImageWithFallback';

interface SolutionsProps {
  onSelectSolution: (solutionName: string) => void;
}

export const Solutions: React.FC<SolutionsProps> = ({ onSelectSolution }) => {
  return (
    <section id="solutions" className="py-20 lg:py-24 bg-white text-[#0B1220] scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="max-w-3xl mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-100 text-[#F25C2A] text-xs font-bold uppercase tracking-wider mb-3">
            Core Engineering Solutions
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold font-['Plus_Jakarta_Sans'] tracking-tight text-[#0B1220]">
            Enterprise-Grade Security & Infrastructure Architecture
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed">
            Every solution is engineered with authentic hardware, concealed wiring standards, and dedicated after-sales SLA support.
          </p>
        </div>

        {/* Asymmetric Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          
          {/* Card 1: CCTV & Video Surveillance (Highlighted, larger 7-col card) */}
          <div className="lg:col-span-7 bg-[#0B1220] text-white rounded-2xl p-8 sm:p-10 shadow-xl relative overflow-hidden flex flex-col justify-between border border-slate-800">
            <div className="absolute top-0 right-0 w-80 h-80 bg-[#F25C2A]/10 rounded-full blur-3xl pointer-events-none"></div>

            <div className="relative z-10">
              <div className="flex items-center justify-between mb-6">
                <div className="w-14 h-14 rounded-2xl bg-[#F25C2A] flex items-center justify-center text-white shadow-lg shadow-orange-500/30">
                  <Camera className="w-7 h-7" />
                </div>
                <div className="text-right">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block">Starting At</span>
                  <span className="text-2xl font-black text-[#F25C2A] font-['Plus_Jakarta_Sans']">From ৳8,500</span>
                </div>
              </div>

              <div className="inline-block px-3 py-1 bg-orange-500/20 text-orange-400 border border-orange-500/30 rounded-lg text-xs font-bold uppercase tracking-wider mb-3">
                Flagship Offering · Hikvision & Dahua
              </div>

              <h3 className="text-2xl sm:text-3xl font-extrabold text-white mb-4 font-['Plus_Jakarta_Sans']">
                CCTV & Video Surveillance Systems
              </h3>

              <p className="text-slate-300 text-base leading-relaxed mb-6">
                Turnkey high-definition analog and IP surveillance engineered to eliminate blind spots. Features ColorVu 24/7 full-color night recording, AI human/vehicle detection, and encrypted cloud streaming on your smartphone.
              </p>

              {/* Image Preview with Fallback */}
              <div className="mb-6 rounded-xl overflow-hidden border border-slate-700/80 max-h-56">
                <ImageWithFallback
                  src="https://images.unsplash.com/photo-1557597774-9d273605dfa9?auto=format&fit=crop&w=1200&q=80"
                  alt="High Definition CCTV Camera with Night Vision"
                  className="w-full h-48 object-cover filter brightness-90 hover:scale-105 transition-transform duration-500"
                />
              </div>

              {/* What's Included */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                <div className="flex items-start gap-2 text-sm text-slate-200">
                  <Check className="w-4 h-4 text-[#F25C2A] mt-0.5 flex-shrink-0" />
                  <span>2MP / 4K Ultra HD Night Vision</span>
                </div>
                <div className="flex items-start gap-2 text-sm text-slate-200">
                  <Check className="w-4 h-4 text-[#F25C2A] mt-0.5 flex-shrink-0" />
                  <span>Surveillance-Grade WD Purple HDD</span>
                </div>
                <div className="flex items-start gap-2 text-sm text-slate-200">
                  <Check className="w-4 h-4 text-[#F25C2A] mt-0.5 flex-shrink-0" />
                  <span>Concealed PVC Pipe & Casing Cable</span>
                </div>
                <div className="flex items-start gap-2 text-sm text-slate-200">
                  <Check className="w-4 h-4 text-[#F25C2A] mt-0.5 flex-shrink-0" />
                  <span>Hik-Connect Mobile Phone Live View</span>
                </div>
              </div>

              {/* Typical Use Cases */}
              <div className="p-3.5 bg-slate-900/80 rounded-xl border border-slate-800 text-xs text-slate-300 mb-6">
                <strong className="text-white">Typical Use Cases:</strong> Residences, duplex villas, retail showrooms, corporate floors, and manufacturing plant perimeters.
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-4">
              <a
                href="#packages"
                className="inline-flex items-center gap-2 text-sm font-bold text-white hover:text-orange-400 transition-colors"
              >
                <span>Explore Packages</span>
                <ArrowRight className="w-4 h-4" />
              </a>

              <button
                onClick={() => onSelectSolution('CCTV Surveillance')}
                className="bg-[#F25C2A] hover:bg-[#D84818] text-white text-sm font-bold px-5 py-2.5 rounded-xl shadow-md transition-all"
              >
                Request CCTV Quote
              </button>
            </div>
          </div>

          {/* Right Column: 2 Stacked Solutions (5-col) */}
          <div className="lg:col-span-5 flex flex-col gap-8 justify-between">
            
            {/* Card 2: Structured Cabling & Business Wi-Fi */}
            <div className="bg-[#F5F7FA] rounded-2xl p-7 border border-slate-200 shadow-sm flex flex-col justify-between hover:border-slate-300 transition-all">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md">
                    <Wifi className="w-6 h-6" />
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] font-semibold uppercase text-slate-600 block">Starting At</span>
                    <span className="text-xl font-bold text-blue-600 font-['Plus_Jakarta_Sans']">From ৳12,000</span>
                  </div>
                </div>

                <h3 className="text-xl font-bold text-[#0B1220] mb-2 font-['Plus_Jakarta_Sans']">
                  Structured Cabling & Business Wi-Fi
                </h3>

                <p className="text-slate-600 text-sm leading-relaxed mb-4">
                  High-density Wi-Fi 6 mesh networks, enterprise server rack termination, patch panel labeling, and low-latency fiber backbones.
                </p>

                <div className="space-y-2 mb-4 text-xs text-slate-700">
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-blue-600" />
                    <span>Cat6 100% Copper & Optical Fiber Run</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-blue-600" />
                    <span>Ruijie & TP-Link Mesh Ceiling APs</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-blue-600" />
                    <span>Guest Portal & Seamless Room-to-Room Roaming</span>
                  </div>
                </div>

                <div className="text-xs text-slate-600 mb-4 bg-white p-2.5 rounded-lg border border-slate-200">
                  <strong>Use Cases:</strong> Multi-story corporate offices, restaurants, hotels, schools & clinics.
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
                <a
                  href="#quote-calculator"
                  onClick={() => onSelectSolution('Structured Cabling & Wi-Fi')}
                  className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1.5"
                >
                  <span>Learn more</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </a>
                <button
                  onClick={() => onSelectSolution('Structured Cabling & Wi-Fi')}
                  className="text-xs font-bold bg-[#0B1220] text-white px-3.5 py-1.5 rounded-lg hover:bg-slate-800 transition-colors"
                >
                  Configure
                </button>
              </div>
            </div>

            {/* Card 3: Biometric Access Control & Time Attendance */}
            <div className="bg-[#F5F7FA] rounded-2xl p-7 border border-slate-200 shadow-sm flex flex-col justify-between hover:border-slate-300 transition-all">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-md">
                    <Fingerprint className="w-6 h-6" />
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] font-semibold uppercase text-slate-600 block">Starting At</span>
                    <span className="text-xl font-bold text-emerald-600 font-['Plus_Jakarta_Sans']">From ৳9,500</span>
                  </div>
                </div>

                <h3 className="text-xl font-bold text-[#0B1220] mb-2 font-['Plus_Jakarta_Sans']">
                  Biometric Access Control & Attendance
                </h3>

                <p className="text-slate-600 text-sm leading-relaxed mb-4">
                  ZKTeco facial recognition, biometric fingerprint locks, magnetic glass door strikes, and automated shift-payroll software.
                </p>

                <div className="space-y-2 mb-4 text-xs text-slate-700">
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>ZKTeco Face + Fingerprint + RFID Terminals</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Heavy-Duty 280kg Magnetic Lock & Exit Switch</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Auto Excel Payroll Report & Mobile Cloud Check-In</span>
                  </div>
                </div>

                <div className="text-xs text-slate-600 mb-4 bg-white p-2.5 rounded-lg border border-slate-200">
                  <strong>Use Cases:</strong> Office main doors, server rooms, confidential archives, and apartment entrances.
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
                <a
                  href="#quote-calculator"
                  onClick={() => onSelectSolution('Access Control & Biometrics')}
                  className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1.5"
                >
                  <span>Learn more</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </a>
                <button
                  onClick={() => onSelectSolution('Access Control & Biometrics')}
                  className="text-xs font-bold bg-[#0B1220] text-white px-3.5 py-1.5 rounded-lg hover:bg-slate-800 transition-colors"
                >
                  Configure
                </button>
              </div>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
};
