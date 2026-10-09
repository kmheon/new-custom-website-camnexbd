import React from 'react';
import { Check, Star, Shield, HardDrive, Smartphone, Wrench, ArrowRight } from 'lucide-react';

interface PackagesProps {
  onBookPackage: (packageName: string) => void;
}

export const Packages: React.FC<PackagesProps> = ({ onBookPackage }) => {
  const packagesList = [
    {
      id: 'home-shop',
      name: 'Home / Small Shop Package',
      tier: '2 to 4 Cameras',
      popular: false,
      price: 'Dynamic BOM',
      priceSub: 'Calculated from live component SKUs',
      description: 'Ideal for apartments, small boutiques, personal garages, and residential duplexes.',
      specs: [
        { label: 'Camera Resolution', value: '2MP Full HD 1080p Crystal Clear' },
        { label: 'Night Vision', value: 'Smart IR Night Vision up to 20 Meters' },
        { label: 'Storage Included', value: 'Surveillance-Grade HDD' },
        { label: 'Mobile App Access', value: 'Hik-Connect (iOS & Android) with Push Alerts' },
        { label: 'Installation', value: 'Complete Clean Installation with Survey' },
        { label: 'Cables & Hardware', value: 'Cat6 Cable + Connectors' },
        { label: 'Warranty', value: '1-Year Warranty' }
      ]
    },
    {
      id: 'office-business',
      name: 'Office / Medium Business Package',
      tier: '8 Cameras (Most Popular)',
      popular: true,
      price: 'Dynamic BOM',
      priceSub: 'Complete 8-Cam Turnkey System',
      description: 'The preferred choice for corporate offices, clinics, retail shops, and multi-floor residences.',
      specs: [
        { label: 'Camera Resolution', value: '2MP Full HD 1080p Smart IR' },
        { label: 'Night Vision', value: 'Smart IR Night Vision up to 20 Meters' },
        { label: 'Storage Included', value: 'Continuous Recording (1TB Surveillance HDD)' },
        { label: 'Mobile App Access', value: 'Multi-User Smartphone App + PC Central CMS' },
        { label: 'Installation', value: 'Professional Installation with Concealed Runs' },
        { label: 'Cables & Hardware', value: 'Centralized 12V Power Unit + Cat6 Runs' },
        { label: 'Warranty', value: '1-Year Replacement Warranty' }
      ]
    },
    {
      id: 'commercial-factory',
      name: 'Commercial / Factory Package',
      tier: '16+ Cameras',
      popular: false,
      price: 'Custom Quote',
      priceSub: 'Industrial Scale Surveillance',
      description: 'Engineered for factories, warehouse perimeters, schools, and multi-story commercial buildings.',
      specs: [
        { label: 'Camera Resolution', value: 'Enterprise HD Surveillance' },
        { label: 'Night Vision', value: 'Smart IR / Long Distance Night Vision' },
        { label: 'Storage Included', value: 'Enterprise Multi-Terabyte Recording' },
        { label: 'Mobile App Access', value: 'Centralized Control Room Video Wall & Cloud Stream' },
        { label: 'Installation', value: 'Industrial Heavy-Duty Installation & Trunking' },
        { label: 'Cables & Hardware', value: 'Centralized Power Distribution & Rack Mounts' },
        { label: 'Warranty', value: 'Manufacturer Partner Warranty' }
      ]
    }
  ];

  return (
    <section id="packages" className="py-20 lg:py-24 bg-[#F5F7FA] text-[#0B1220] scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-100 text-[#F25C2A] text-xs font-bold uppercase tracking-wider mb-3">
            <Star className="w-3.5 h-3.5 fill-[#F25C2A]" />
            Turnkey CCTV Packages
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold font-['Plus_Jakarta_Sans'] tracking-tight text-[#0B1220]">
            Transparent Pricing with Zero Hidden Cable Fees
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed">
            All packages include authentic Hikvision hardware, genuine surveillance hard drives, professional installation, and 1-year service warranty.
          </p>
        </div>

        {/* 3 Clear Package Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
          {packagesList.map((pkg) => (
            <div
              key={pkg.id}
              className={`rounded-2xl flex flex-col justify-between transition-all duration-300 relative ${
                pkg.popular
                  ? 'bg-[#0B1220] text-white ring-4 ring-[#F25C2A] shadow-2xl scale-100 lg:-translate-y-2'
                  : 'bg-white text-[#0B1220] border border-slate-200 shadow-md hover:shadow-xl'
              }`}
            >
              {/* Popular Badge */}
              {pkg.popular && (
                <div className="absolute -top-3.5 left-1/2 transform -translate-x-1/2 bg-[#F25C2A] text-white text-xs font-extrabold uppercase px-4 py-1 rounded-full shadow-md tracking-wider">
                  ★ Most Popular in Dhaka
                </div>
              )}

              <div className="p-7 sm:p-8">
                <div className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-1">
                  {pkg.tier}
                </div>
                <h3 className={`text-xl sm:text-2xl font-black font-['Plus_Jakarta_Sans'] mb-2 ${pkg.popular ? 'text-white' : 'text-[#0B1220]'}`}>
                  {pkg.name}
                </h3>
                <p className={`text-xs sm:text-sm leading-relaxed mb-6 ${pkg.popular ? 'text-slate-300' : 'text-slate-600'}`}>
                  {pkg.description}
                </p>

                {/* Price */}
                <div className="pt-4 border-t border-slate-200/20 mb-6">
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl sm:text-4xl font-extrabold text-[#F25C2A] font-['Plus_Jakarta_Sans']">
                      {pkg.price}
                    </span>
                    <span className={`text-xs font-semibold ${pkg.popular ? 'text-slate-400' : 'text-slate-600'}`}>
                      Turnkey Price
                    </span>
                  </div>
                  <div className={`text-xs font-medium mt-1 ${pkg.popular ? 'text-slate-400' : 'text-slate-600'}`}>
                    {pkg.priceSub}
                  </div>
                </div>

                {/* Specs List */}
                <div className="space-y-3.5 mb-8">
                  {pkg.specs.map((item, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm">
                      <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                        pkg.popular ? 'bg-orange-500/20 text-[#F25C2A]' : 'bg-emerald-100 text-emerald-600'
                      }`}>
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                      <div>
                        <span className={`font-semibold block ${pkg.popular ? 'text-white' : 'text-[#0B1220]'}`}>
                          {item.label}
                        </span>
                        <span className={`text-xs ${pkg.popular ? 'text-slate-300' : 'text-slate-600'}`}>
                          {item.value}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Button */}
              <div className={`p-7 sm:p-8 pt-0 border-t ${pkg.popular ? 'border-slate-800' : 'border-slate-100'}`}>
                <button
                  type="button"
                  onClick={() => onBookPackage(pkg.name)}
                  className={`w-full py-3.5 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all transform hover:-translate-y-0.5 ${
                    pkg.popular
                      ? 'bg-[#F25C2A] hover:bg-[#D84818] text-white shadow-lg shadow-orange-500/30'
                      : 'border-2 border-[#0B1220] hover:bg-[#0B1220] text-[#0B1220] hover:text-white'
                  }`}
                >
                  <span>Book This Package</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

            </div>
          ))}
        </div>

        {/* Custom Configuration Note */}
        <div className="mt-12 text-center">
          <p className="text-sm text-slate-600">
            Need a custom mix of IP cameras, PTZ speed domes, or optical fiber cabling?{' '}
            <a href="#quote-calculator" className="font-bold text-[#F25C2A] underline hover:text-[#D84818]">
              Use our interactive quote builder
            </a>{' '}
            or call our engineering desk directly at <strong className="text-[#0B1220]">+880 1540-535150</strong>.
          </p>
        </div>

      </div>
    </section>
  );
};
