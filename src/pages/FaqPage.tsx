import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  X,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  Phone,
  MessageSquare,
  ArrowRight,
  ExternalLink,
  Shield,
  Layers,
  Wrench,
  Truck,
  CreditCard,
  FileText
} from 'lucide-react';
import { SEO } from '../components/common/SEO';
import { Breadcrumbs, Button, Badge } from '../components/common/UI';
import { cmsService } from '../services';
import { FaqItem } from '../types';
import { INITIAL_FAQS } from '../services/seedData';

interface FaqPageProps {
  onNavigate: (route: string, param?: string) => void;
}

const DEFAULT_FAQ_CATEGORIES = [
  'ALL',
  'Products & Compatibility',
  'CCTV & Surveillance Systems',
  'Networking & Wi-Fi',
  'Installation & Site Surveys',
  'Orders & Payments',
  'Warranty & After-Sales Support',
  'Quotations & Packages'
] as const;

export const FaqPage: React.FC<FaqPageProps> = ({ onNavigate }) => {
  const [faqs, setFaqs] = useState<FaqItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [openFaqIds, setOpenFaqIds] = useState<Set<string>>(new Set(['faq-pc-1']));

  useEffect(() => {
    cmsService
      .getFaqs()
      .then((data) => {
        // Intentionally configured smaller FAQ list (length > 0) is displayed as-is.
        // Empty ([]), null, undefined, or uninitialized datasets fall back to INITIAL_FAQS.
        const activeFaqs = Array.isArray(data) && data.length > 0 ? data : INITIAL_FAQS;
        setFaqs(activeFaqs);
        if (activeFaqs.length > 0 && activeFaqs[0]?.id) {
          setOpenFaqIds(new Set([activeFaqs[0].id]));
        }
        setLoading(false);
      })
      .catch(() => {
        setFaqs(INITIAL_FAQS);
        if (INITIAL_FAQS.length > 0 && INITIAL_FAQS[0]?.id) {
          setOpenFaqIds(new Set([INITIAL_FAQS[0].id]));
        }
        setLoading(false);
      });
  }, []);

  const toggleFaq = (id: string) => {
    setOpenFaqIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const expandAll = () => {
    setOpenFaqIds(new Set(effectiveFaqs.map((f) => f.id)));
  };

  const collapseAll = () => {
    setOpenFaqIds(new Set());
  };

  const effectiveFaqs = useMemo(() => {
    return faqs.length > 0 ? faqs : INITIAL_FAQS;
  }, [faqs]);

  const categories = useMemo(() => {
    const activeCategories = Array.from(
      new Set(effectiveFaqs.map((f) => f.category).filter(Boolean))
    );
    const hasDefaultCategories = DEFAULT_FAQ_CATEGORIES.some(
      (c) => c !== 'ALL' && activeCategories.includes(c)
    );

    if (hasDefaultCategories || activeCategories.length === 0) {
      const list = [...DEFAULT_FAQ_CATEGORIES];
      for (const cat of activeCategories) {
        if (!list.includes(cat as any)) {
          list.push(cat);
        }
      }
      return list;
    }
    return ['ALL', ...activeCategories];
  }, [effectiveFaqs]);

  const filteredFaqs = useMemo(() => {
    return effectiveFaqs.filter((f) => {
      const matchesCat = selectedCategory === 'ALL' || f.category === selectedCategory;
      if (!matchesCat) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      return (
        (f.question && f.question.toLowerCase().includes(q)) ||
        (f.answer && f.answer.toLowerCase().includes(q))
      );
    });
  }, [effectiveFaqs, selectedCategory, searchQuery]);

  // Helper to render text with clickable internal links
  const renderAnswerContent = (text: string) => {
    // Check if the answer references specific pages
    const hasCatalogLink = text.includes('Custom CCTV Package Builder') || text.includes('/package-builder');
    const hasWarrantyLink = text.includes('Warranty Policy page') || text.includes('/warranty');
    const hasTrackingLink = text.includes('Track Order page') || text.includes('/tracking');
    const hasQuoteLink = text.includes('Request Quotation page') || text.includes('/quote');
    const hasSupportLink = text.includes('+880 1540-535150') || text.includes('technical support');

    return (
      <div className="space-y-3">
        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{text}</p>
        
        {/* Contextual Action Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
          {hasCatalogLink && (
            <button
              type="button"
              onClick={() => onNavigate('package_builder')}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-orange-50 text-[#F15A24] font-semibold hover:bg-orange-100 transition-colors"
            >
              <span>Open Package Builder</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          )}
          {hasWarrantyLink && (
            <button
              type="button"
              onClick={() => onNavigate('warranty')}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 text-[#111827] font-semibold hover:bg-slate-200 transition-colors"
            >
              <span>View Warranty Policy</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          )}
          {hasTrackingLink && (
            <button
              type="button"
              onClick={() => onNavigate('tracking')}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 text-[#111827] font-semibold hover:bg-slate-200 transition-colors"
            >
              <span>Track Your Order</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          )}
          {hasQuoteLink && (
            <button
              type="button"
              onClick={() => onNavigate('quote')}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 text-[#111827] font-semibold hover:bg-slate-200 transition-colors"
            >
              <span>Request Site Survey</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          )}
          {hasSupportLink && (
            <button
              type="button"
              onClick={() => onNavigate('support')}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-orange-50 text-[#F15A24] font-semibold hover:bg-orange-100 transition-colors"
            >
              <span>Contact Technical Support</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-[#F8FAFC] min-h-screen py-8 sm:py-12">
      <SEO
        title="Frequently Asked Questions (FAQ) | CamneX Bangladesh"
        description="Clear technical answers regarding CCTV selection, IP cameras, Wi-Fi 6, site surveys, genuine serial warranties, and order fulfillment in Dhaka."
        canonicalPath="/faq"
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: effectiveFaqs.map((f) => ({
            '@type': 'Question',
            name: f.question,
            acceptedAnswer: {
              '@type': 'Answer',
              text: f.answer
            }
          }))
        }}
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <Breadcrumbs
          items={[
            { label: 'Home', onClick: () => onNavigate('home') },
            { label: 'Frequently Asked Questions' }
          ]}
        />

        {/* Page Header */}
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <Badge variant="orange">Knowledge & Support</Badge>
          <h1 className="text-2xl sm:text-4xl font-black text-[#111827] font-heading">
            Frequently Asked Questions
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Technical answers, system compatibility guidance, warranty standards, and ordering information for security and IT infrastructure in Bangladesh.
          </p>
        </div>

        {/* Search Bar & Quick Controls */}
        <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="relative">
            <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              data-testid="faq-search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by keyword, product name, or topic (e.g. storage, IP cameras, warranty)..."
              className="w-full pl-10 pr-10 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#F15A24]/30 focus:border-[#F15A24] text-xs sm:text-sm text-[#111827]"
            />
            {searchQuery && (
              <button
                type="button"
                data-testid="faq-clear-search"
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                aria-label="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Category Filter Pills */}
          <div className="flex flex-wrap gap-2 pt-1">
            {categories.map((cat) => {
              const isSelected = selectedCategory === cat;
              const count =
                cat === 'ALL'
                  ? effectiveFaqs.length
                  : effectiveFaqs.filter((f) => f.category === cat).length;

              return (
                <button
                  key={cat}
                  type="button"
                  data-testid={`faq-category-${cat.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#F15A24] text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <span>{cat === 'ALL' ? 'All Questions' : cat}</span>
                  <span
                    className={`ml-1.5 text-[10px] px-1.5 py-0.2 rounded-full ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-white text-slate-500'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Counter & Expand / Collapse All */}
          <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
            <div>
              Showing <span className="font-bold text-[#111827]">{filteredFaqs.length}</span> of{' '}
              <span className="font-bold text-[#111827]">{effectiveFaqs.length}</span> questions
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={expandAll}
                className="hover:text-[#F15A24] font-semibold transition-colors"
              >
                Expand All
              </button>
              <span>·</span>
              <button
                type="button"
                onClick={collapseAll}
                className="hover:text-[#F15A24] font-semibold transition-colors"
              >
                Collapse All
              </button>
            </div>
          </div>
        </div>

        {/* FAQs Accordion List */}
        {filteredFaqs.length > 0 ? (
          <div className="space-y-3">
            {filteredFaqs.map((faq) => {
              const isOpen = openFaqIds.has(faq.id);

              return (
                <div
                  key={faq.id}
                  data-testid="faq-accordion-item"
                  className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:border-slate-300 transition-colors"
                >
                  <button
                    type="button"
                    data-testid={`faq-toggle-${faq.id}`}
                    onClick={() => toggleFaq(faq.id)}
                    aria-expanded={isOpen}
                    className="w-full p-5 text-left flex items-start justify-between gap-4 font-bold text-sm sm:text-base text-[#111827] hover:text-[#F15A24] transition-colors cursor-pointer"
                  >
                    <div className="space-y-1">
                      {faq.category && (
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                          {faq.category}
                        </span>
                      )}
                      <span className="leading-snug">{faq.question}</span>
                    </div>
                    <div className="shrink-0 mt-1">
                      {isOpen ? (
                        <ChevronUp className="w-5 h-5 text-[#F15A24]" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-slate-400" />
                      )}
                    </div>
                  </button>

                  {isOpen && (
                    <div className="px-5 pb-5 pt-1 border-t border-slate-100">
                      {renderAnswerContent(faq.answer)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-orange-100 text-[#F15A24] flex items-center justify-center mx-auto">
              <HelpCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-base text-[#111827]">No questions found</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                We couldn't find any questions matching "{searchQuery}" in this category.
              </p>
            </div>
            <div className="flex justify-center gap-3 pt-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('ALL');
                }}
              >
                Reset Filters
              </Button>
              <Button size="sm" onClick={() => onNavigate('support')}>
                Contact Technical Support
              </Button>
            </div>
          </div>
        )}

        {/* Bottom Support Banner */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-6 sm:p-8 rounded-2xl shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-1 max-w-md">
            <h3 className="text-lg font-bold font-heading text-white">Have a specific technical inquiry?</h3>
            <p className="text-xs text-slate-300">
              Our Dhaka engineering team is on-call to review site layouts, verify model compatibility, or assist with troubleshooting.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button
              size="sm"
              onClick={() => onNavigate('support')}
              className="bg-[#F15A24] hover:bg-[#D94D1C] text-white"
            >
              Technical Support
            </Button>
            <a
              href="tel:+8801540535150"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition-colors"
            >
              <Phone className="w-3.5 h-3.5 text-[#F15A24]" />
              <span>+880 1540-535150</span>
            </a>
          </div>
        </div>

      </div>
    </div>
  );
};

