import React, { useState, useEffect } from 'react';
import { Mail, Phone, MapPin, Globe, CheckCircle2, MessageSquare, ChevronDown, ChevronUp, Star, Shield, ArrowRight } from 'lucide-react';
import { SEO } from '../components/common/SEO';
import { Breadcrumbs, Button, Badge } from '../components/common/UI';
import { cmsService } from '../services';
import { BlogPost, ProjectCaseStudy, Testimonial, FaqItem, SiteSettings } from '../types';

interface ContentPageProps {
  type: 'solutions' | 'projects' | 'testimonials' | 'faq' | 'contact' | 'blog' | 'blog_post' | 'about' | 'warranty' | 'terms' | 'privacy' | 'refund';
  param?: string;
  onNavigate: (route: string, param?: string) => void;
}

export const ContentPages: React.FC<ContentPageProps> = ({ type, param, onNavigate }) => {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [activePost, setActivePost] = useState<BlogPost | null>(null);
  const [projects, setProjects] = useState<ProjectCaseStudy[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [faqs, setFaqs] = useState<FaqItem[]>([]);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  useEffect(() => {
    cmsService.getSiteSettings().then(setSettings);

    if (type === 'blog' || type === 'blog_post') {
      cmsService.getBlogPosts().then(posts => {
        setBlogPosts(posts);
        if (param) {
          const found = posts.find(p => p.slug === param || p.id === param);
          setActivePost(found || posts[0]);
        }
      });
    }

    if (type === 'projects') {
      cmsService.getProjects().then(setProjects);
    }

    if (type === 'testimonials') {
      cmsService.getTestimonials().then(setTestimonials);
    }

    if (type === 'faq') {
      cmsService.getFaqs().then(setFaqs);
    }
  }, [type, param]);

  // --------------------------------------------------------------------------
  // SOLUTIONS PAGE
  // --------------------------------------------------------------------------
  if (type === 'solutions') {
    return (
      <div className="bg-[#F8FAFC] min-h-screen py-10">
        <SEO title="Engineering Solutions & SLA Services | CamneX Bangladesh" description="Professional security engineering, clean concealed cabling, and IT maintenance in Dhaka." />
        <div className="max-w-5xl mx-auto px-4 space-y-8">
          <Breadcrumbs items={[{ label: 'Home', onClick: () => onNavigate('home') }, { label: 'Solutions & Engineering' }]} />
          
          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <Badge variant="orange">Engineering Standard</Badge>
            <h1 className="text-3xl font-black text-[#111827] font-heading">
              Enterprise Security & Network Deployment
            </h1>
            <p className="text-sm text-slate-600 leading-relaxed max-w-3xl">
              CamneX delivers certified turnkey hardware and installation across Dhaka. We do not use substandard wiring or leave cables taped across walls.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-3">
              <h3 className="font-bold text-base text-[#111827]">Concealed Cabling Standard</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                All cables are run through heavy-duty PVC conduit pipes, interior casing trunking, or false ceilings with waterproof junction boxes.
              </p>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-3">
              <h3 className="font-bold text-base text-[#111827]">1-Year Free Service SLA</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Every turnkey setup includes dedicated Dhaka on-site service support. If a camera lens drifts or a cable degrades, our van responds within 24 hours.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // FAQ PAGE
  // --------------------------------------------------------------------------
  if (type === 'faq') {
    return (
      <div className="bg-[#F8FAFC] min-h-screen py-10">
        <SEO
          title="Frequently Asked Questions | CamneX Bangladesh"
          description="Common questions regarding hardware authenticity, phone apps, and site surveys in Dhaka."
          jsonLd={{
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": faqs.map(f => ({
              "@type": "Question",
              "name": f.question,
              "acceptedAnswer": {
                "@type": "Answer",
                "text": f.answer
              }
            }))
          }}
        />
        <div className="max-w-4xl mx-auto px-4 space-y-8">
          <Breadcrumbs items={[{ label: 'Home', onClick: () => onNavigate('home') }, { label: 'FAQ' }]} />
          
          <div className="text-center max-w-xl mx-auto">
            <h1 className="text-3xl font-black text-[#111827] font-heading mb-2">
              Frequently Asked Questions
            </h1>
            <p className="text-xs sm:text-sm text-slate-600">
              Clear technical answers regarding genuine serials, mobile viewing, and warranty.
            </p>
          </div>

          <div className="space-y-3">
            {faqs.map((f, idx) => (
              <div key={f.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                <button
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full p-5 text-left flex items-center justify-between font-bold text-sm sm:text-base text-[#111827] hover:text-[#F15A24]"
                >
                  <span>{f.question}</span>
                  {openFaq === idx ? <ChevronUp className="w-4 h-4 text-[#F15A24]" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                </button>
                {openFaq === idx && (
                  <div className="px-5 pb-5 text-xs sm:text-sm text-slate-600 border-t border-slate-100 pt-3 leading-relaxed">
                    {f.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // CONTACT PAGE
  // --------------------------------------------------------------------------
  if (type === 'contact') {
    return (
      <div className="bg-[#F8FAFC] min-h-screen py-10">
        <SEO title="Contact CamneX Bangladesh | Mohammadpur, Dhaka" description="Reach our engineering office for inquiries and site surveys." />
        <div className="max-w-4xl mx-auto px-4 space-y-8">
          <Breadcrumbs items={[{ label: 'Home', onClick: () => onNavigate('home') }, { label: 'Contact Us' }]} />
          
          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
            <h1 className="text-3xl font-black text-[#111827] font-heading">
              Contact CamneX Bangladesh
            </h1>

            <div className="space-y-4 text-sm text-slate-700">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-[#F15A24] flex-shrink-0 mt-0.5" />
                <span>{settings?.address || 'Block A, Chandrima Model Town, Shop 01, 1st Floor, House 22, Road 06 Main Rd, Dhaka 1207, Bangladesh'}</span>
              </div>

              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-[#F15A24] flex-shrink-0" />
                <a href={`tel:${settings?.phone || '+8801540535150'}`} className="font-bold text-[#111827] hover:text-[#F15A24]">
                  {settings?.phone || '+880 1540-535150'}
                </a>
              </div>

              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-[#F15A24] flex-shrink-0" />
                <a href={`mailto:${settings?.email || 'contact@camnexbd.com'}`} className="hover:text-[#F15A24]">
                  {settings?.email || 'contact@camnexbd.com'}
                </a>
              </div>

              <div className="pt-4 border-t border-slate-100">
                <a
                  href="https://wa.me/8801540535150?text=Hello%20CamneX%20Desk"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-[#25D366] text-white font-bold text-xs px-5 py-3 rounded-xl shadow-md"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>WhatsApp Engineering Chat</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // PROJECTS PAGE (Only renders if entered data exists)
  // --------------------------------------------------------------------------
  if (type === 'projects') {
    if (projects.length === 0) {
      return (
        <div className="bg-[#F8FAFC] min-h-screen py-16 text-center text-slate-500">
          <p>No project case studies currently published.</p>
        </div>
      );
    }
    return (
      <div className="bg-[#F8FAFC] min-h-screen py-10">
        <SEO title="Verified Security Deployments | CamneX Bangladesh" description="Case studies of CCTV and biometric deployments in Dhaka." />
        <div className="max-w-6xl mx-auto px-4 space-y-8">
          <Breadcrumbs items={[{ label: 'Home', onClick: () => onNavigate('home') }, { label: 'Projects & Case Studies' }]} />
          
          <div className="bg-white p-8 rounded-2xl border border-slate-200">
            <h1 className="text-3xl font-black text-[#111827] font-heading mb-2">Verified Case Studies</h1>
            <p className="text-xs sm:text-sm text-slate-600">Sample deployments across Dhaka residences and commercial offices.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {projects.map(proj => (
              <div key={proj.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                <img src={proj.image} alt={proj.title} className="w-full h-56 object-cover" />
                <div className="p-6 space-y-2">
                  <div className="text-xs font-bold text-[#F15A24]">{proj.location} · {proj.cameraCount}</div>
                  <h3 className="font-bold text-base text-[#111827] font-heading">{proj.title}</h3>
                  <p className="text-xs text-slate-600">{proj.systemSummary}</p>
                  {proj.clientQuote && (
                    <div className="p-3 bg-slate-50 rounded-xl text-xs italic text-slate-700 mt-2">
                      “{proj.clientQuote}” — <strong>{proj.clientAuthor}</strong>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // BLOG PAGES
  // --------------------------------------------------------------------------
  if (type === 'blog') {
    return (
      <div className="bg-[#F8FAFC] min-h-screen py-10">
        <SEO title="Technical Security & Networking Blog | CamneX Bangladesh" description="Guides on CCTV installation, Wi-Fi mesh, and access control." />
        <div className="max-w-5xl mx-auto px-4 space-y-8">
          <Breadcrumbs items={[{ label: 'Home', onClick: () => onNavigate('home') }, { label: 'Blog' }]} />
          
          <div className="bg-white p-8 rounded-2xl border border-slate-200">
            <h1 className="text-3xl font-black text-[#111827] font-heading mb-2">Technical Surveillance & IT Blog</h1>
            <p className="text-xs sm:text-sm text-slate-600">Objective engineering guides for property owners and IT administrators.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {blogPosts.map(post => (
              <div
                key={post.id}
                onClick={() => onNavigate('blog_post', post.slug)}
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md cursor-pointer transition-all"
              >
                <img src={post.featuredImage} alt={post.title} className="w-full h-48 object-cover" />
                <div className="p-6 space-y-2">
                  <div className="text-[11px] font-bold text-slate-400">{post.publishedAt} · {post.readTime}</div>
                  <h3 className="font-bold text-base text-[#111827] font-heading hover:text-[#F15A24]">{post.title}</h3>
                  <p className="text-xs text-slate-600 line-clamp-2">{post.excerpt}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (type === 'blog_post' && activePost) {
    return (
      <div className="bg-[#F8FAFC] min-h-screen py-10">
        <SEO title={`${activePost.title} | CamneX Blog`} description={activePost.excerpt} ogType="article" />
        <div className="max-w-3xl mx-auto px-4 space-y-6">
          <Breadcrumbs items={[{ label: 'Home', onClick: () => onNavigate('home') }, { label: 'Blog', onClick: () => onNavigate('blog') }, { label: activePost.title }]} />
          
          <article className="bg-white p-6 sm:p-10 rounded-2xl border border-slate-200 shadow-sm space-y-6">
            <div className="text-xs text-slate-400 font-bold">{activePost.publishedAt} · By {activePost.author}</div>
            <h1 className="text-2xl sm:text-3xl font-black text-[#111827] font-heading leading-tight">{activePost.title}</h1>
            <img src={activePost.featuredImage} alt="" className="w-full h-72 object-cover rounded-xl" />
            <div className="prose text-sm text-slate-700 leading-relaxed" dangerouslySetInnerHTML={{ __html: activePost.content }} />
          </article>
        </div>
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // ABOUT US PAGE
  // --------------------------------------------------------------------------
  if (type === 'about') {
    return (
      <div className="bg-[#F8FAFC] min-h-screen py-10">
        <SEO title="About Us | CamneX Bangladesh" description="Security, Surveillance, Networking and IT Solutions company in Dhaka, Bangladesh." />
        <div className="max-w-4xl mx-auto px-4 space-y-8">
          <Breadcrumbs items={[{ label: 'Home', onClick: () => onNavigate('home') }, { label: 'About Us' }]} />

          <div className="bg-white p-8 sm:p-10 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <Badge variant="orange">Company Profile</Badge>
            <h1 className="text-3xl font-black text-[#111827] font-heading">
              About CamneX Bangladesh
            </h1>
            <p className="text-sm text-slate-600 leading-relaxed">
              CamneX Bangladesh is a professional Security, Surveillance, Enterprise Networking, and IT Solutions engineering firm based in Dhaka, Bangladesh. We specialize in designing, deploying, and maintaining high-reliability technology infrastructure for residential properties, corporate headquarters, and commercial facilities.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-orange-100 text-[#F15A24] flex items-center justify-center font-bold">
                <Shield className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-[#111827]">Authorized Partnerships</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                We are a recognized <strong>Hikvision Authorized Partner</strong> and <strong>ZKTeco Authorized Installer</strong> in Bangladesh. All hardware supplied through our store and turnkey packages carries genuine manufacturer serial numbers with official warranty registration.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-orange-100 text-[#F15A24] flex items-center justify-center font-bold">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-[#111827]">Dhaka Engineering Standards</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Unlike informal traders, CamneX adheres to strict cabling standards. We use 100% pure copper Cat6 cabling run through heavy-duty PVC conduits or interior trunking with waterproof junction boxes, backed by an on-site 1-Year SLA service guarantee.
              </p>
            </div>
          </div>

          <div className="bg-slate-900 text-white p-8 rounded-2xl space-y-3">
            <h3 className="font-bold text-lg font-heading">Dhaka Engineering & Installation Center</h3>
            <p className="text-xs text-slate-400">
              {settings?.address || 'Block A, Chandrima Model Town, Shop 01, 1st Floor, House 22, Road 06 Main Rd, Dhaka 1207, Bangladesh'}
            </p>
            <div className="flex flex-wrap gap-4 pt-2 text-xs">
              <span>Phone: <strong className="text-[#F15A24]">{settings?.phone || '+880 1540-535150'}</strong></span>
              <span>Email: <strong className="text-slate-200">{settings?.email || 'contact@camnexbd.com'}</strong></span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // WARRANTY POLICY PAGE
  // --------------------------------------------------------------------------
  if (type === 'warranty') {
    return (
      <div className="bg-[#F8FAFC] min-h-screen py-10">
        <SEO title="Warranty & SLA Policy | CamneX Bangladesh" description="Official manufacturer warranty and service policy." />
        <div className="max-w-4xl mx-auto px-4 space-y-8">
          <Breadcrumbs items={[{ label: 'Home', onClick: () => onNavigate('home') }, { label: 'Warranty Policy' }]} />

          <div className="bg-white p-8 sm:p-10 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <Badge variant="success">Official Warranty Information</Badge>
            <h1 className="text-3xl font-black text-[#111827] font-heading">
              Warranty & Service SLA Policy
            </h1>
            <p className="text-sm text-slate-600 leading-relaxed">
              Every system supplied by CamneX Bangladesh carries official manufacturer hardware warranty coverage verifiable via authentic serial numbers.
            </p>
          </div>

          {settings?.warrantyPolicyText ? (
            <div className="bg-white p-8 rounded-2xl border border-slate-200 text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
              {settings.warrantyPolicyText}
            </div>
          ) : (
            <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center py-12 text-slate-600 space-y-3">
              <p className="font-semibold text-slate-800">Official warranty terms are established per equipment model upon quotation and delivery.</p>
              <p className="text-xs text-slate-500">Please reach our engineering desk directly at <a href={`tel:${settings?.phone || '+8801540535150'}`} className="text-[#F15A24] font-bold">{settings?.phone || '+880 1540-535150'}</a> or email <a href={`mailto:${settings?.email || 'contact@camnexbd.com'}`} className="text-[#F15A24] font-bold">{settings?.email || 'contact@camnexbd.com'}</a>.</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // TERMS & CONDITIONS PAGE
  // --------------------------------------------------------------------------
  if (type === 'terms') {
    return (
      <div className="bg-[#F8FAFC] min-h-screen py-10">
        <SEO title="Terms & Conditions | CamneX Bangladesh" description="Commercial and service terms for hardware orders and engineering installations." />
        <div className="max-w-4xl mx-auto px-4 space-y-8">
          <Breadcrumbs items={[{ label: 'Home', onClick: () => onNavigate('home') }, { label: 'Terms & Conditions' }]} />

          <div className="bg-white p-8 sm:p-10 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h1 className="text-3xl font-black text-[#111827] font-heading">
              Terms & Conditions
            </h1>
            <p className="text-xs text-slate-400">CamneX Bangladesh · Terms of Service</p>
            <p className="text-sm text-slate-600 leading-relaxed">
              These terms govern the purchase of hardware and engineering services from CamneX Bangladesh through camnexbd.com and our Dhaka operations center.
            </p>
          </div>

          {settings?.termsPolicyText ? (
            <div className="bg-white p-8 rounded-2xl border border-slate-200 text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
              {settings.termsPolicyText}
            </div>
          ) : (
            <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center py-12 text-slate-600 space-y-3">
              <p className="font-semibold text-slate-800">Official terms of service are currently being configured by administration.</p>
              <p className="text-xs text-slate-500">Please contact our official desk directly at <a href={`tel:${settings?.phone || '+8801540535150'}`} className="text-[#F15A24] font-bold">{settings?.phone || '+880 1540-535150'}</a> or <a href={`mailto:${settings?.email || 'contact@camnexbd.com'}`} className="text-[#F15A24] font-bold">{settings?.email || 'contact@camnexbd.com'}</a>.</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // PRIVACY POLICY PAGE
  // --------------------------------------------------------------------------
  if (type === 'privacy') {
    return (
      <div className="bg-[#F8FAFC] min-h-screen py-10">
        <SEO title="Privacy Policy | CamneX Bangladesh" description="Information protection and privacy standards for client data." />
        <div className="max-w-4xl mx-auto px-4 space-y-8">
          <Breadcrumbs items={[{ label: 'Home', onClick: () => onNavigate('home') }, { label: 'Privacy Policy' }]} />

          <div className="bg-white p-8 sm:p-10 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h1 className="text-3xl font-black text-[#111827] font-heading">
              Privacy Policy
            </h1>
            <p className="text-xs text-slate-400">CamneX Bangladesh · Data Protection Standard</p>
            <p className="text-sm text-slate-600 leading-relaxed">
              At CamneX Bangladesh, we respect the confidentiality of your premise details, contact information, and security setup.
            </p>
          </div>

          {settings?.privacyPolicyText ? (
            <div className="bg-white p-8 rounded-2xl border border-slate-200 text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
              {settings.privacyPolicyText}
            </div>
          ) : (
            <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center py-12 text-slate-600 space-y-3">
              <p className="font-semibold text-slate-800">CamneX Bangladesh does not sell, rent, or share customer contact lists or site engineering details.</p>
              <p className="text-xs text-slate-500">Our technicians configure mobile access directly on the client's own device; CamneX does not retain passwords or remote stream access post-handover.</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // RETURN & REFUND POLICY PAGE
  // --------------------------------------------------------------------------
  if (type === 'refund') {
    return (
      <div className="bg-[#F8FAFC] min-h-screen py-10">
        <SEO title="Return & Refund Policy | CamneX Bangladesh" description="Hardware replacement and refund standards." />
        <div className="max-w-4xl mx-auto px-4 space-y-8">
          <Breadcrumbs items={[{ label: 'Home', onClick: () => onNavigate('home') }, { label: 'Return & Refund Policy' }]} />

          <div className="bg-white p-8 sm:p-10 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h1 className="text-3xl font-black text-[#111827] font-heading">
              Return & Refund Policy
            </h1>
            <p className="text-xs text-slate-400">CamneX Bangladesh · Policy Standard</p>
            <p className="text-sm text-slate-600 leading-relaxed">
              We stand behind the authenticity and reliability of every product we supply.
            </p>
          </div>

          {settings?.returnPolicyText ? (
            <div className="bg-white p-8 rounded-2xl border border-slate-200 text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
              {settings.returnPolicyText}
            </div>
          ) : (
            <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center py-12 text-slate-600 space-y-3">
              <p className="font-semibold text-slate-800">Official return & refund terms will be published by administration.</p>
              <p className="text-xs text-slate-500">For return inquiries, please contact our support desk directly at <a href={`tel:${settings?.phone || '+8801540535150'}`} className="text-[#F15A24] font-bold">{settings?.phone || '+880 1540-535150'}</a> or email <a href={`mailto:${settings?.email || 'contact@camnexbd.com'}`} className="text-[#F15A24] font-bold">{settings?.email || 'contact@camnexbd.com'}</a>.</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return null;
};
