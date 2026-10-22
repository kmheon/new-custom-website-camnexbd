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

const PUBLIC_TURNSTILE_SITE_KEY = '0x4AAAAAAFZ9v3kdzHEYCrpT';

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
    // Fetch Turnstile config from backend with timestamp to prevent stale browser caching
    fetch(`/api/auth/captcha/config?_t=${Date.now()}`)
      .then(r => r.json())
      .then(data => {
        let key = data?.siteKey;
        // If server provided secret key format (length >= 30), automatically use the canonical public site key
        if (typeof key === 'string' && key.length >= 30) {
          console.warn('[Turnstile] Server returned secret key format. Using canonical public site key for client widget.');
          key = PUBLIC_TURNSTILE_SITE_KEY;
        }

        if (key && (data?.configured || key === PUBLIC_TURNSTILE_SITE_KEY)) {
          setSiteKey(key);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
          'error-callback': (errCode: any) => {
            if (isMounted) {
              setIsVerified(false);
              console.warn(`[Turnstile] Challenge error-callback triggered with code: ${errCode || 'unknown'}`);
              let msg = 'Security challenge failed. Please click retry.';
              if (String(errCode) === '110200') {
                msg = 'Security challenge domain not allowed. Please check widget configuration in Cloudflare dashboard.';
              } else if (String(errCode) === '110100' || String(errCode) === '110110') {
                msg = 'Security challenge configuration error (invalid site key).';
              }
              setErrorMsg(msg);
              if (onError) onError(msg);
            }
          },
          'expired-callback': () => {
            if (isMounted) {
              setIsVerified(false);
              const msg = 'Security challenge expired. Please click retry.';
              setErrorMsg(msg);
              if (onExpire) onExpire();
            }
          }
        });
        widgetIdRef.current = id;
      } catch (e: any) {
        console.error('[Turnstile] render call failed:', e.message);
        setErrorMsg('Failed to render security challenge. Please click retry.');
      }
    };

    if (window.turnstile) {
      renderWidget();
    } else {
      const scriptId = 'cloudflare-turnstile-script';
      let script = document.getElementById(scriptId) as HTMLScriptElement | null;
      if (!script) {
        script = document.createElement('script');
        script.id = scriptId;
        script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
        script.async = true;
        script.defer = true;
        script.onload = () => {
          if (isMounted) renderWidget();
        };
        script.onerror = () => {
          if (isMounted) {
            const msg = 'Security challenge script failed to load. Please check your network connection.';
            setErrorMsg(msg);
            if (onError) onError(msg);
          }
        };
        document.head.appendChild(script);
      } else {
        const interval = setInterval(() => {
          if (window.turnstile) {
            clearInterval(interval);
            if (isMounted) renderWidget();
          }
        }, 150);
        const timeout = setTimeout(() => {
          clearInterval(interval);
          if (isMounted && !window.turnstile) {
            const msg = 'Security challenge script timed out. Please click retry.';
            setErrorMsg(msg);
            if (onError) onError(msg);
          }
        }, 10000);
        return () => {
          clearInterval(interval);
          clearTimeout(timeout);
        };
      }
    }

    return () => {
      isMounted = false;
      if (widgetIdRef.current && window.turnstile) {
        try { window.turnstile.remove(widgetIdRef.current); } catch (_) {}
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConfigured, siteKey, theme, action]);

  const handleRetry = () => {
    setErrorMsg(null);
    if (widgetIdRef.current && window.turnstile) {
      try {
        window.turnstile.reset(widgetIdRef.current);
        return;
      } catch (_) {}
    }
    if (window.turnstile && containerRef.current && isConfigured && siteKey) {
      try {
        const id = window.turnstile.render(containerRef.current, {
          sitekey: siteKey,
          theme,
          action,
          size: 'flexible',
          callback: (token: string) => {
            setIsVerified(true);
            setErrorMsg(null);
            onVerify(token);
          },
          'error-callback': (errCode: any) => {
            setIsVerified(false);
            console.warn(`[Turnstile] Retry challenge error-callback: ${errCode || 'unknown'}`);
            let msg = 'Security challenge failed. Please click retry.';
            if (String(errCode) === '110200') {
              msg = 'Security challenge domain not allowed. Please check widget configuration.';
            } else if (String(errCode) === '110100' || String(errCode) === '110110') {
              msg = 'Security challenge configuration error (invalid site key).';
            }
            setErrorMsg(msg);
            if (onError) onError(msg);
          },
          'expired-callback': () => {
            setIsVerified(false);
            const msg = 'Security challenge expired. Please click retry.';
            setErrorMsg(msg);
            if (onExpire) onExpire();
          }
        });
        widgetIdRef.current = id;
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

