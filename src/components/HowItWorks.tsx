import React from 'react';
import { ClipboardCheck, FileSpreadsheet, ShieldCheck, Sparkles, CheckCircle2 } from 'lucide-react';

export const HowItWorks: React.FC = () => {
  const steps = [
    {
      num: '01',
      title: 'Free On-Site Survey',
      subtitle: 'Free across Dhaka',
      desc: 'Our certified engineer visits your site to audit blind spots, measure exact cable lengths, and evaluate lighting & power requirements.',
      icon: <ClipboardCheck className="w-6 h-6 text-[#F25C2A]" />
    },
    {
      num: '02',
      title: 'Itemized Proposal',
      subtitle: 'Transparent Bill of Materials',
      desc: 'You receive an exact quotation detailing genuine camera models, storage days, and setup fees. Zero unexpected per-meter cable surprises.',
      icon: <FileSpreadsheet className="w-6 h-6 text-blue-600" />
    },
    {
      num: '03',
      title: 'Concealed Installation',
      subtitle: 'No Dangling Wires Standard',
      desc: 'Certified technicians install your system using clean PVC conduits, waterproof junction boxes, tidy crimping, and structured rack termination.',
      icon: <Sparkles className="w-6 h-6 text-emerald-600" />
    },
    {
      num: '04',
      title: 'Handover & Training',
      subtitle: '1-Year On-Site SLA',
      desc: 'We configure Hik-Connect / DMSS on your phones, hand over master passwords, provide usage training, and issue your official warranty card.',
      icon: <ShieldCheck className="w-6 h-6 text-purple-600" />
    }
  ];

  return (
    <section className="py-20 lg:py-24 bg-white text-[#0B1220] border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-800 text-xs font-bold uppercase tracking-wider mb-3">
            Predictable & Professional
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold font-['Plus_Jakarta_Sans'] tracking-tight text-[#0B1220]">
            How We Work: From Survey to Handover
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed">
            No guesswork, no missing parts, and no messy cables left behind.
          </p>
        </div>

        {/* 4-Step Horizontal Process */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative">
          
          {steps.map((step, idx) => (
            <div
              key={idx}
              className="bg-[#F5F7FA] rounded-2xl p-7 border border-slate-200/80 hover:border-orange-300 shadow-sm relative flex flex-col justify-between transition-all"
            >
              <div>
                <div className="flex items-center justify-between mb-5">
                  <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-center">
                    {step.icon}
                  </div>
                  <span className="text-2xl font-black text-slate-400 font-['Plus_Jakarta_Sans']">
                    {step.num}
                  </span>
                </div>

                <div className="text-xs font-bold text-[#F25C2A] uppercase tracking-wider mb-1">
                  {step.subtitle}
                </div>

                <h3 className="text-lg font-bold text-[#0B1220] mb-3 font-['Plus_Jakarta_Sans']">
                  {step.title}
                </h3>

                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  {step.desc}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-200/80 flex items-center gap-1.5 text-xs font-semibold text-slate-600">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Standardized Protocol</span>
              </div>
            </div>
          ))}

        </div>

      </div>
    </section>
  );
};
