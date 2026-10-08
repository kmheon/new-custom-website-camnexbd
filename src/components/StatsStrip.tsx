import React from 'react';
import { Award, CheckCircle, Clock, ShieldCheck } from 'lucide-react';

export const StatsStrip: React.FC = () => {
  return (
    <section className="bg-[#F5F7FA] py-14 border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* 4 Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 lg:gap-8 pb-12 border-b border-slate-200/80">
          
          <div className="text-center p-4 bg-white rounded-xl shadow-sm border border-slate-200">
            <div className="text-3xl sm:text-4xl font-extrabold text-[#0B1220] font-['Plus_Jakarta_Sans'] tracking-tight">
              500<span className="text-[#F25C2A]">+</span>
            </div>
            <div className="text-sm font-semibold text-slate-600 mt-1">
              Projects Completed
            </div>
            <div className="text-xs text-slate-600 mt-0.5">Homes, Offices & Factories</div>
          </div>

          <div className="text-center p-4 bg-white rounded-xl shadow-sm border border-slate-200">
            <div className="text-3xl sm:text-4xl font-extrabold text-[#0B1220] font-['Plus_Jakarta_Sans'] tracking-tight">
              98<span className="text-[#F25C2A]">%</span>
            </div>
            <div className="text-sm font-semibold text-slate-600 mt-1">
              Client Satisfaction
            </div>
            <div className="text-xs text-slate-600 mt-0.5">Verified 5-Star Reviews</div>
          </div>

          <div className="text-center p-4 bg-white rounded-xl shadow-sm border border-slate-200">
            <div className="text-3xl sm:text-4xl font-extrabold text-[#0B1220] font-['Plus_Jakarta_Sans'] tracking-tight">
              24<span className="text-[#F25C2A]">h</span>
            </div>
            <div className="text-sm font-semibold text-slate-600 mt-1">
              Response Time
            </div>
            <div className="text-xs text-slate-600 mt-0.5">On-Call Field Technicians</div>
          </div>

          <div className="text-center p-4 bg-white rounded-xl shadow-sm border border-slate-200">
            <div className="text-3xl sm:text-4xl font-extrabold text-[#0B1220] font-['Plus_Jakarta_Sans'] tracking-tight">
              100<span className="text-[#F25C2A]">%</span>
            </div>
            <div className="text-sm font-semibold text-slate-600 mt-1">
              Genuine Hardware
            </div>
            <div className="text-xs text-slate-600 mt-0.5">Direct Authorized Import</div>
          </div>

        </div>

        {/* Authorized Brand Badges */}
        <div className="pt-8">
          <div className="text-center text-xs font-bold uppercase tracking-wider text-slate-600 mb-6">
            Authorized Technology Partners & Genuine Hardware
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 items-center">
            
            <div className="flex items-center justify-center p-4 bg-white rounded-xl border border-slate-200 shadow-sm hover:border-orange-300 transition-all">
              <div className="text-center">
                <span className="text-lg font-black tracking-wider text-red-600 font-sans block">HIKVISION</span>
                <span className="text-[11px] font-semibold text-slate-600">Authorized Value Added Partner</span>
              </div>
            </div>

            <div className="flex items-center justify-center p-4 bg-white rounded-xl border border-slate-200 shadow-sm hover:border-orange-300 transition-all">
              <div className="text-center">
                <span className="text-lg font-black tracking-wider text-emerald-600 font-sans block">ZKTECO</span>
                <span className="text-[11px] font-semibold text-slate-600">Authorized Biometric Installer</span>
              </div>
            </div>

            <div className="flex items-center justify-center p-4 bg-white rounded-xl border border-slate-200 shadow-sm hover:border-orange-300 transition-all">
              <div className="text-center">
                <span className="text-lg font-black tracking-wider text-blue-600 font-sans block">DAHUA</span>
                <span className="text-[11px] font-semibold text-slate-600">Certified Surveillance Partner</span>
              </div>
            </div>

            <div className="flex items-center justify-center p-4 bg-white rounded-xl border border-slate-200 shadow-sm hover:border-orange-300 transition-all">
              <div className="text-center">
                <span className="text-lg font-black tracking-wider text-cyan-600 font-sans block">RUIJIE / TP-LINK</span>
                <span className="text-[11px] font-semibold text-slate-600">Enterprise Wi-Fi & Routing</span>
              </div>
            </div>

          </div>
        </div>

      </div>
    </section>
  );
};
