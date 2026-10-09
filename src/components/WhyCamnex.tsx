import React from 'react';
import { ShieldCheck, Sparkles, MapPin, Smartphone, Receipt, Compass, CheckCircle } from 'lucide-react';

export const WhyCamnex: React.FC = () => {
  const points = [
    {
      title: 'No Gray Market Hardware',
      subtitle: 'Genuine Hardware with Serial Numbers',
      desc: 'Every CamneX unit is sourced from authorized Bangladesh channels with verified serial numbers and brand warranties.',
      icon: <ShieldCheck className="w-6 h-6 text-[#F25C2A]" />
    },
    {
      title: 'Concealed Wiring Standard',
      subtitle: 'Structured Cable Management',
      desc: 'No dangling wires across your room or office reception. We use neat PVC conduits, concealed wall channels, and waterproof junction boxes.',
      icon: <Sparkles className="w-6 h-6 text-blue-600" />
    },
    {
      title: 'Local Dhaka Support Desk',
      subtitle: 'Physically Based in Dhaka',
      desc: 'Our technical operations office is located in Dhaka with field support ready to service your installations.',
      icon: <MapPin className="w-6 h-6 text-emerald-600" />
    },
    {
      title: 'Mobile App Configuration',
      subtitle: 'Hik-Connect & DMSS Configured on All Devices',
      desc: 'We configure real-time streaming on your smartphone and PC, set up push notifications, and verify remote connectivity.',
      icon: <Smartphone className="w-6 h-6 text-purple-600" />
    },
    {
      title: 'Itemized Quotations',
      subtitle: 'Clear Bill of Materials',
      desc: 'CamneX provides comprehensive itemized quotes before installation begins. What we quote is what you pay.',
      icon: <Receipt className="w-6 h-6 text-amber-600" />
    },
    {
      title: 'On-Site Survey in Dhaka',
      subtitle: 'Engineer Premise Inspection',
      desc: 'An engineer visits your property in Dhaka to measure angles, evaluate lighting, and design the camera layout.',
      icon: <Compass className="w-6 h-6 text-teal-600" />
    }
  ];

  return (
    <section id="why-us" className="py-20 lg:py-24 bg-white text-[#0B1220] scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-100 text-[#F25C2A] text-xs font-bold uppercase tracking-wider mb-3">
            The CamneX Standard
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold font-['Plus_Jakarta_Sans'] tracking-tight text-[#0B1220]">
            Solving the Real Headaches of Security Installation in Bangladesh
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed">
            We built CamneX specifically to eliminate gray-market knockoffs, messy dangling wires, and disappearing contractors.
          </p>
        </div>

        {/* 6 Grid Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {points.map((p, idx) => (
            <div
              key={idx}
              className="p-7 sm:p-8 rounded-2xl bg-[#F5F7FA] border border-slate-200 hover:border-orange-300 hover:bg-white hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-center mb-6">
                  {p.icon}
                </div>

                <div className="text-xs font-bold text-[#F25C2A] uppercase tracking-wider mb-1">
                  {p.subtitle}
                </div>

                <h3 className="text-xl font-bold text-[#0B1220] mb-3 font-['Plus_Jakarta_Sans']">
                  {p.title}
                </h3>

                <p className="text-sm text-slate-600 leading-relaxed">
                  {p.desc}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-200/80 flex items-center gap-2 text-xs font-bold text-emerald-700">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                <span>CamneX Quality Guarantee</span>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};
