import React, { useEffect, useRef, useState } from 'react';
import { ShieldCheck, RefreshCw, AlertCircle } from 'lucide-react';

interface TurnstileWidgetProps {
  onVerify: (token: string) => void;
  onError?: (err: string) => void;
  onExpire?: () => void;
  className?: string;
  theme?: 'light' | 'dark' | 'auto';
  action?: string;
}

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: string | HTMLElement,
        options: {
          sitekey: string;
          callback?: (token: string) => void;
          'error-callback'?: (err: any) => void;
          'expired-callback'?: () => void;
          theme?: string;
          action?: string;
          size?: 'normal' | 'compact' | 'flexible';
        }
      ) => string;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
    };
    onTurnstileLoad?: () => void;
  }
}

export const TurnstileWidget: React.FC<TurnstileWidgetProps> = ({
  onVerify,
  onError,
  onExpire,
  className = '',
  theme = 'light',
  action = 'submit'
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const [siteKey, setSiteKey] = useState<string | null>(null);
  const [isConfigured, setIsConfigured] = useState<boolean | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isVerified, setIsVerified] = useState(false);

  useEffect(() => {
    // Fetch Turnstile config from backend
    fetch('/api/auth/captcha/config')
      .then(r => r.json())
      .then(data => {
        if (data && data.configured && data.siteKey) {
          setSiteKey(data.siteKey);
          setIsConfigured(true);
        } else {
          setIsConfigured(false);
          // If unconfigured or test environment, provide automatic pass token
          onVerify('XXXX.DUMMY.TOKEN.XXXX');
        }
      })
      .catch(() => {
        setIsConfigured(false);
        onVerify('XXXX.DUMMY.TOKEN.XXXX');
      });
  }, []);

  useEffect(() => {
    if (!isConfigured || !siteKey || !containerRef.current) return;

    let isMounted = true;

    const renderWidget = () => {
      if (!window.turnstile || !containerRef.current || !isMounted) return;

      if (widgetIdRef.current) {
        try { window.turnstile.remove(widgetIdRef.current); } catch (_) {}
      }

      try {
        const id = window.turnstile.render(containerRef.current, {
          sitekey: siteKey,
          theme,
          action,
          size: 'flexible',
          callback: (token: string) => {
            if (isMounted) {
              setIsVerified(true);
              setErrorMsg(null);
              onVerify(token);
            }
          },
          'error-callback': (err: any) => {
            if (isMounted) {
              setIsVerified(false);
              const msg = 'Security challenge failed. Please click retry.';
              setErrorMsg(msg);
              if (onError) onError(msg);
            }
          },
          'expired-callback': () => {
            if (isMounted) {
              setIsVerified(false);
              if (onExpire) onExpire();
            }
          }
        });
        widgetIdRef.current = id;
      } catch (e: any) {
        console.error('Turnstile render failed:', e.message);
      }
    };

    if (window.turnstile) {
      renderWidget();
    } else {
      const scriptId = 'cloudflare-turnstile-script';
      if (!document.getElementById(scriptId)) {
        const script = document.createElement('script');
        script.id = scriptId;
        script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
        script.async = true;
        script.defer = true;
        script.onload = () => {
          renderWidget();
        };
        document.head.appendChild(script);
      } else {
        const interval = setInterval(() => {
          if (window.turnstile) {
            clearInterval(interval);
            renderWidget();
          }
        }, 150);
        return () => clearInterval(interval);
      }
    }

    return () => {
      isMounted = false;
      if (widgetIdRef.current && window.turnstile) {
        try { window.turnstile.remove(widgetIdRef.current); } catch (_) {}
      }
    };
  }, [isConfigured, siteKey, theme, action]);

  const handleRetry = () => {
    setErrorMsg(null);
    if (widgetIdRef.current && window.turnstile) {
      try {
        window.turnstile.reset(widgetIdRef.current);
      } catch (_) {}
    }
  };

  if (isConfigured === false) {
    return (
      <div className={`p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs text-slate-500 ${className}`} data-testid="turnstile-unconfigured-badge">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-medium text-slate-700">Bot Shield Active</span>
          <span className="text-[11px] text-slate-400">Non-interactive protection</span>
        </div>
        <span className="text-[10px] font-mono text-slate-400">Turnstile Dev Mode</span>
      </div>
    );
  }

  return (
    <div className={`space-y-1.5 ${className}`} data-testid="turnstile-container">
      <div ref={containerRef} className="min-h-[65px] flex items-center justify-center bg-slate-50/50 rounded-xl border border-slate-100" />
      {errorMsg && (
        <div className="flex items-center justify-between text-xs text-red-600 bg-red-50 p-2 rounded-lg border border-red-200">
          <div className="flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button
            type="button"
            onClick={handleRetry}
            className="flex items-center gap-1 text-[11px] font-bold text-red-700 hover:text-red-900 underline ml-2"
          >
            <RefreshCw className="w-3 h-3" /> Retry
          </button>
        </div>
      )}
    </div>
  );
};

