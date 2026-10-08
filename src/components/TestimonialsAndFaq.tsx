import React, { useState } from 'react';
import { Star, ChevronDown, ChevronUp, Quote, HelpCircle } from 'lucide-react';

export const TestimonialsAndFaq: React.FC = () => {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const testimonials = [
    {
      id: 1,
      name: 'Engr. Tanvir Ahmed',
      role: 'Residential Duplex Homeowner',
      location: 'Gulshan-2, Dhaka',
      comment: '“I was worried about messy cables ruining our new interior decor. The CamneX engineering crew took extra care, running concealed trunking through false ceilings and conduit. The ColorVu cameras are magnificent at night.”',
      rating: 5
    },
    {
      id: 2,
      name: 'Nafis Chowdhury',
      role: 'Head of Operations, Horizon Garments',
      location: 'Road 11, Banani, Dhaka',
      comment: '“We replaced our old biometric attendance machines with CamneX ZKTeco facial terminals. Time-theft was eliminated, and shift-wise attendance reports export directly into our payroll spreadsheet.”',
      rating: 5
    },
    {
      id: 3,
      name: 'Dr. Farhana Yasmin',
      role: 'Owner, Aroma Bistro & Cafe',
      location: 'Satmasjid Road, Dhanmondi',
      comment: '“Their dual deployment of guest Wi-Fi and CCTV was executed without closing our restaurant for even one hour. The mobile app lets me monitor cashier transactions and kitchen prep in real-time.”',
      rating: 5
    },
    {
      id: 4,
      name: 'Kazi Mahmudur Rahman',
      role: 'Supply Chain Director, Delta Logistics',
      location: 'Tongi Industrial Zone, Gazipur',
      comment: '“Our warehouse perimeter spans over 2 acres. CamneX laid an optical fiber backbone with long-range Hikvision bullet cameras that withstand rain and dust without a hitch. Outstanding technical SLA.”',
      rating: 5
    }
  ];

  const faqs = [
    {
      q: 'Are your Hikvision and ZKTeco products 100% genuine?',
      a: 'Yes, absolutely. CamneX is an authorized partner and verified installer in Bangladesh. Every camera, DVR/NVR, and biometric terminal carries an authentic factory serial number verifiable through official Hikvision and ZKTeco partner verification portals. You receive an official warranty card with replacement coverage.'
    },
    {
      q: 'Can I view my security cameras on my phone when traveling outside Bangladesh?',
      a: 'Yes. We configure the official Hik-Connect or DMSS mobile application with secure cloud P2P encryption on all your iPhones, Android phones, tablets, and laptops. As long as you have internet, you can view live video feeds, listen to two-way audio, and review playback recordings from anywhere in the world.'
    },
    {
      q: 'Do you provide security installation and services outside Dhaka?',
      a: 'While our central technical base and free on-site survey operations are in Dhaka, our certified engineering vans frequently deploy commercial, industrial, and villa projects across Narayanganj, Gazipur, Chattogram, Sylhet, and surrounding districts upon project consultation.'
    },
    {
      q: 'How long does a typical installation take?',
      a: 'A standard home or retail package (2 to 4 cameras) is typically completed within 4 to 6 hours on the same day. An 8-camera office installation takes 1 full day. Larger commercial or optical fiber deployments (16+ cameras) are scheduled with a clear phased delivery timetable agreed upon during the site survey.'
    },
    {
      q: 'What happens to the surveillance system during power cuts / load shedding?',
      a: 'We configure and supply dedicated online UPS and battery backup systems for the DVR/NVR and camera power distribution unit. This ensures uninterrupted video recording and continuous security monitoring even during prolonged local power outages or generator switchover delays.'
    }
  ];

  return (
    <>
      {/* SECTION 9: TESTIMONIALS */}
      <section className="py-20 lg:py-24 bg-white text-[#0B1220] border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-2xl mx-auto mb-16">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-100 text-[#F25C2A] text-xs font-bold uppercase tracking-wider mb-3">
              Client Feedback
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold font-['Plus_Jakarta_Sans'] tracking-tight text-[#0B1220]">
              Trusted by Dhaka Families & Businesses
            </h2>
            <p className="mt-3 text-base text-slate-600">
              Read authentic feedback from homeowners, corporate managers, and restaurant owners.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {testimonials.map(t => (
              <div
                key={t.id}
                className="bg-[#F5F7FA] p-7 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between hover:border-orange-300 hover:shadow-lg transition-all"
              >
                <div>
                  {/* Stars */}
                  <div className="flex items-center gap-1 mb-4 text-amber-500">
                    {[...Array(t.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-400 stroke-amber-400" />
                    ))}
                  </div>

                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed italic mb-6">
                    {t.comment}
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-200/80">
                  <div className="font-bold text-sm text-[#0B1220] font-['Plus_Jakarta_Sans']">
                    {t.name}
                  </div>
                  <div className="text-xs text-slate-500">{t.role}</div>
                  <div className="text-[11px] font-semibold text-[#F25C2A] mt-0.5">{t.location}</div>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* SECTION 10: FAQ */}
      <section id="faq" className="py-20 lg:py-24 bg-[#F5F7FA] text-[#0B1220] scroll-mt-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-2xl mx-auto mb-14">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-200 text-slate-800 text-xs font-bold uppercase tracking-wider mb-3">
              <HelpCircle className="w-3.5 h-3.5" />
              Frequently Asked Questions
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold font-['Plus_Jakarta_Sans'] tracking-tight text-[#0B1220]">
              Got Questions? We Have Honest Answers
            </h2>
            <p className="mt-3 text-base text-slate-600">
              Clear answers regarding genuine hardware warranty, mobile apps, and Dhaka site surveys.
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <div
                key={idx}
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm transition-all"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full p-5 sm:p-6 text-left flex items-center justify-between gap-4 font-bold text-base sm:text-lg text-[#0B1220] hover:text-[#F25C2A] transition-colors"
                >
                  <span className="font-['Plus_Jakarta_Sans']">{faq.q}</span>
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0 text-slate-600">
                    {openFaq === idx ? (
                      <ChevronUp className="w-4 h-4 text-[#F25C2A]" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </div>
                </button>

                {openFaq === idx && (
                  <div className="px-5 sm:px-6 pb-6 pt-0 text-sm text-slate-600 leading-relaxed border-t border-slate-100 mt-2 pt-4">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-12 text-center bg-white p-6 rounded-2xl border border-slate-200">
            <p className="text-sm text-slate-600 mb-3">
              Have a specific technical question or need an emergency repair in Dhaka?
            </p>
            <a
              href="https://wa.me/8801540535150?text=Hello%20CamneX%20Engineering%20Desk,%20I%20have%20a%20technical%20question"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm font-bold text-[#F25C2A] hover:text-[#D84818]"
            >
              <span>Ask our certified engineer on WhatsApp (+880 1540-535150)</span>
              <span>→</span>
            </a>
          </div>

        </div>
      </section>
    </>
  );
};
