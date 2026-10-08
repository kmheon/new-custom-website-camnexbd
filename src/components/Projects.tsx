import React, { useState } from 'react';
import { MapPin, Camera, Quote, Filter, Layers } from 'lucide-react';
import { ImageWithFallback } from './ImageWithFallback';

export const Projects: React.FC = () => {
  const [filter, setFilter] = useState<'All' | 'Home' | 'Office' | 'Commercial'>('All');

  const projects = [
    {
      id: 1,
      title: '16-Camera ColorVu IP System for Luxury Residence',
      category: 'Home',
      location: 'Gulshan-2, Dhaka',
      systemType: 'Hikvision ColorVu IP Surveillance + NVR',
      cameraCount: '16 Cameras',
      image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80',
      clientSnippet: '“CamneX concealed every single cable behind interior wall panels. The ColorVu night vision gives full daytime-like colors in complete darkness.”',
      clientAuthor: 'Engr. Tanvir Ahmed, Homeowner'
    },
    {
      id: 2,
      title: '32-Cam + ZKTeco Biometric System for Corporate HQ',
      category: 'Office',
      location: 'Road 11, Banani, Dhaka',
      systemType: 'AcuSense AI CCTV + ZKTeco Facial Recognition Locks',
      cameraCount: '32 Cameras + 4 Doors',
      image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80',
      clientSnippet: '“Flawless integration between time-attendance payroll export and glass door access control. Extremely polite and technically certified technicians.”',
      clientAuthor: 'Nafis Chowdhury, Operations Director'
    },
    {
      id: 3,
      title: 'High-Density Wi-Fi 6 Mesh & Security for Dining Venue',
      category: 'Commercial',
      location: 'Satmasjid Road, Dhanmondi, Dhaka',
      systemType: 'Ruijie Reyee Wi-Fi 6 APs + 8x Dome CCTV',
      cameraCount: '8 Cameras + 4 APs',
      image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80',
      clientSnippet: '“Our 150+ dining guests enjoy uninterrupted fast Wi-Fi while our cash counter, kitchen, and entrance are securely recorded on my phone.”',
      clientAuthor: 'Dr. Farhana Yasmin, Cafe Bistro'
    },
    {
      id: 4,
      title: 'Perimeter Surveillance & Optical Fiber for Logistics Hub',
      category: 'Commercial',
      location: 'Tongi Industrial Zone, Gazipur',
      systemType: 'Long-Range IP Cameras + 1.2km Fiber Backbone',
      cameraCount: '24 Outdoor Cameras',
      image: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=800&q=80',
      clientSnippet: '“Heavy-duty outdoor cameras that stood resilient through multiple monsoon downpours. The central monitor wall setup was crisp and reliable.”',
      clientAuthor: 'Kazi Mahmudur Rahman, Logistics GM'
    }
  ];

  const filtered = filter === 'All' ? projects : projects.filter(p => p.category === filter);

  return (
    <section id="projects" className="py-20 lg:py-24 bg-[#F5F7FA] text-[#0B1220] scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-200 text-slate-800 text-xs font-bold uppercase tracking-wider mb-3">
              Case Studies & Deployments
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold font-['Plus_Jakarta_Sans'] tracking-tight text-[#0B1220]">
              Recent Deployments Across Dhaka
            </h2>
            <p className="mt-3 text-base text-slate-600">
              Real projects delivered on time with concealed cabling and guaranteed post-install SLAs.
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center bg-white border border-slate-200 p-1.5 rounded-xl shadow-sm self-start md:self-auto">
            {(['All', 'Home', 'Office', 'Commercial'] as const).map(cat => (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                  filter === cat
                    ? 'bg-[#0B1220] text-white shadow-sm'
                    : 'text-slate-600 hover:text-[#0B1220]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Project Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {filtered.map(proj => (
            <div
              key={proj.id}
              className="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                {/* Photo with Fallback */}
                <div className="relative h-60 w-full overflow-hidden bg-slate-800">
                  <ImageWithFallback
                    src={proj.image}
                    alt={proj.title}
                    className="w-full h-full object-cover filter brightness-95 hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-3 left-3 bg-[#0B1220]/80 backdrop-blur-md text-white text-xs font-bold px-3 py-1 rounded-lg">
                    {proj.category}
                  </div>
                  <div className="absolute top-3 right-3 bg-[#F25C2A] text-white text-xs font-extrabold px-3 py-1 rounded-lg shadow-md">
                    {proj.cameraCount}
                  </div>
                </div>

                {/* Content */}
                <div className="p-6 sm:p-7">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 mb-2">
                    <MapPin className="w-3.5 h-3.5 text-[#F25C2A]" />
                    <span>{proj.location}</span>
                  </div>

                  <h3 className="text-xl font-bold text-[#0B1220] mb-2 font-['Plus_Jakarta_Sans'] leading-snug">
                    {proj.title}
                  </h3>

                  <div className="inline-block text-xs font-medium text-slate-600 bg-slate-100 px-2.5 py-1 rounded-md mb-4">
                    {proj.systemType}
                  </div>

                  {/* Client Quote Snippet */}
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 relative">
                    <Quote className="w-4 h-4 text-[#F25C2A] mb-1 opacity-70" />
                    <p className="text-xs sm:text-sm text-slate-700 italic leading-relaxed">
                      {proj.clientSnippet}
                    </p>
                    <div className="text-[11px] font-bold text-slate-900 mt-2">
                      — {proj.clientAuthor}
                    </div>
                  </div>
                </div>
              </div>

              <div className="px-6 pb-6 pt-0">
                <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-[#F25C2A]">
                  <span>Concealed Wiring Certified</span>
                  <span className="text-slate-400">100% On-Time Handover</span>
                </div>
              </div>

            </div>
          ))}
        </div>

      </div>
    </section>
  );
};
