import React, { useState, useEffect } from 'react';
import { AlertTriangle, X, Phone, Mail, ChevronRight, Info, ShieldAlert } from 'lucide-react';

interface DevelopmentNoticeProps {
  onNavigate?: (route: string) => void;
}

const STORAGE_KEY = 'camnex_dev_notice_dismissed';

export const DevelopmentNotice: React.FC<DevelopmentNoticeProps> = ({ onNavigate }) => {
  const [showModal, setShowModal] = useState<boolean>(false);
  const [isBannerDismissed, setIsBannerDismissed] = useState<boolean>(false);

  useEffect(() => {
    // Check if the user has already acknowledged the popup in this session
    try {
      const acknowledged = sessionStorage.getItem(STORAGE_KEY);
      if (!acknowledged) {
        // Small delay so page renders first, providing smooth entry
        const timer = setTimeout(() => setShowModal(true), 600);
        return () => clearTimeout(timer);
      }
    } catch (_) {}
  }, []);

  const handleAcknowledge = () => {
    setShowModal(false);
    try {
      sessionStorage.setItem(STORAGE_KEY, 'true');
    } catch (_) {}
  };

  const handleDismissBanner = () => {
    setIsBannerDismissed(true);
  };

  const handleReopenModal = () => {
    setShowModal(true);
  };

  return (
    <>
      {/* -------------------------------------------------------------------- */}
      {/* 1. Top Persistent Development Banner                                  */}
      {/* -------------------------------------------------------------------- */}
      {!isBannerDismissed && (
        <aside
          role="region"
          aria-label="Development site preview warning"
          data-testid="dev-notice-banner"
          className="relative bg-gradient-to-r from-amber-600 via-amber-500 to-orange-600 text-slate-950 shadow-md border-b border-amber-600/30 z-40 transition-all select-none"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between gap-3 text-xs sm:text-sm">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-950 text-amber-300 font-extrabold text-[10px] tracking-wider uppercase shrink-0 shadow-xs">
                <AlertTriangle className="w-3 h-3 text-amber-400" />
                <span>Notice</span>
              </span>
              <p className="font-semibold text-slate-950 truncate sm:whitespace-normal">
                <span className="font-bold underline decoration-slate-950/40">Website under development:</span>{' '}
                We advise customers <span className="font-extrabold underline decoration-red-700">not to place any orders or make payments yet</span>.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                data-testid="dev-banner-details-btn"
                onClick={handleReopenModal}
                className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-950/10 hover:bg-slate-950/20 text-slate-950 font-bold transition-colors cursor-pointer text-xs"
              >
                <span>Read Advisory</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                data-testid="dev-banner-close-btn"
                onClick={handleDismissBanner}
                className="p-1 rounded-lg hover:bg-slate-950/15 text-slate-950 transition-colors cursor-pointer"
                aria-label="Dismiss development notice banner"
                title="Dismiss banner"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </aside>
      )}

      {/* Re-open Pill if banner was dismissed */}
      {isBannerDismissed && (
        <button
          type="button"
          data-testid="dev-notice-reopen-pill"
          onClick={handleReopenModal}
          className="fixed bottom-4 left-4 z-40 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500 text-slate-950 text-xs font-bold shadow-lg hover:bg-amber-400 transition-all cursor-pointer border border-amber-600/40 animate-fade-in"
          title="Click to view development notice"
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>Site in Development</span>
        </button>
      )}

      {/* -------------------------------------------------------------------- */}
      {/* 2. Modal / Popup on Initial Visit or on Demand                       */}
      {/* -------------------------------------------------------------------- */}
      {showModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="dev-modal-title"
          data-testid="dev-notice-modal"
          className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
        >
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-amber-200 overflow-hidden">
            {/* Header with warm warning theme */}
            <div className="bg-gradient-to-r from-amber-500 via-amber-400 to-orange-500 p-6 text-slate-950 relative">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-slate-950 text-amber-400 flex items-center justify-center shadow-lg shrink-0">
                    <ShieldAlert className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="inline-block px-2 py-0.5 rounded-md bg-slate-950/15 text-slate-950 font-black text-[10px] tracking-wider uppercase mb-1">
                      Preview &amp; Testing Phase
                    </span>
                    <h2 id="dev-modal-title" className="text-xl sm:text-2xl font-black font-heading leading-tight">
                      Website Under Development
                    </h2>
                  </div>
                </div>

                <button
                  type="button"
                  data-testid="dev-modal-close-icon"
                  onClick={handleAcknowledge}
                  className="p-1.5 rounded-xl bg-slate-950/10 hover:bg-slate-950/20 text-slate-950 transition-colors"
                  aria-label="Close dialog"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="p-6 sm:p-7 space-y-5 text-slate-700 text-xs sm:text-sm">
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200/80 space-y-2">
                <p className="font-extrabold text-amber-950 text-sm flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Important Ordering Advisory</span>
                </p>
                <p className="text-amber-900 leading-relaxed">
                  The CamneX Bangladesh website is currently in private preview and system testing. <strong>We advise visitors and customers not to place any orders or make payments</strong> through this website yet.
                </p>
              </div>

              <div className="space-y-2.5">
                <p className="font-bold text-[#111827]">
                  Need hardware, installation, or a custom quotation today?
                </p>
                <p className="text-slate-600 leading-relaxed text-xs">
                  Our official sales and engineering desk is fully operational offline. Please contact us directly for genuine Hikvision and ZKTeco equipment:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                  <a
                    href="tel:+8801540535150"
                    className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 hover:bg-orange-50 border border-slate-200 hover:border-orange-200 transition-colors text-slate-800 hover:text-[#F15A24] font-semibold text-xs"
                  >
                    <Phone className="w-4 h-4 text-[#F15A24] shrink-0" />
                    <div>
                      <div className="text-[10px] text-slate-500 font-normal">Direct Hotline</div>
                      <div>+880 1540-535150</div>
                    </div>
                  </a>

                  <a
                    href="mailto:contact@camnexbd.com"
                    className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 hover:bg-orange-50 border border-slate-200 hover:border-orange-200 transition-colors text-slate-800 hover:text-[#F15A24] font-semibold text-xs"
                  >
                    <Mail className="w-4 h-4 text-[#F15A24] shrink-0" />
                    <div>
                      <div className="text-[10px] text-slate-500 font-normal">Email Inquiries</div>
                      <div className="truncate">contact@camnexbd.com</div>
                    </div>
                  </a>
                </div>
              </div>

              <p className="text-[11px] text-slate-500 italic text-center">
                Automated order checkout and fulfillment will be enabled once final launch verification is complete.
              </p>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
                <button
                  type="button"
                  data-testid="dev-modal-acknowledge-btn"
                  onClick={handleAcknowledge}
                  className="w-full sm:flex-1 py-3 px-5 rounded-xl bg-[#F15A24] hover:bg-[#D94D1C] active:bg-[#C2410C] text-white font-bold text-xs sm:text-sm shadow-md transition-all cursor-pointer text-center"
                >
                  I Understand / Browse Preview
                </button>
                {onNavigate && (
                  <button
                    type="button"
                    data-testid="dev-modal-contact-btn"
                    onClick={() => {
                      handleAcknowledge();
                      onNavigate('contact');
                    }}
                    className="w-full sm:w-auto py-3 px-5 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#111827] font-bold text-xs sm:text-sm transition-colors cursor-pointer text-center"
                  >
                    Contact Sales Desk
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

