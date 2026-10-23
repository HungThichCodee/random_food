import { useEffect, useRef, useState } from 'react';

type TurnstileApi = {
  render: (container: HTMLElement, options: {
    sitekey: string;
    theme: 'dark';
    callback: (token: string) => void;
    'expired-callback': () => void;
    'error-callback': () => void;
  }) => string;
  remove: (id: string) => void;
  reset: (id: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

interface Props {
  siteKey: string;
  onToken: (token: string | null) => void;
  resetKey: number;
}

export default function TurnstileWidget({ siteKey, onToken, resetKey }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const onTokenRef = useRef(onToken);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    onTokenRef.current = onToken;
  }, [onToken]);

  useEffect(() => {
    if (!siteKey) return;
    let disposed = false;
    const renderWidget = () => {
      if (disposed || widgetIdRef.current || !window.turnstile || !containerRef.current) return;
      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: siteKey,
        theme: 'dark',
        callback: (token) => onTokenRef.current(token),
        'expired-callback': () => onTokenRef.current(null),
        'error-callback': () => {
          onTokenRef.current(null);
          setLoadError(true);
        },
      });
    };

    let script = document.querySelector<HTMLScriptElement>('script[data-foodmatch-turnstile]');
    if (!script) {
      script = document.createElement('script');
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
      script.async = true;
      script.defer = true;
      script.dataset.foodmatchTurnstile = 'true';
      document.head.appendChild(script);
    }
    script.addEventListener('load', renderWidget);
    script.addEventListener('error', () => setLoadError(true), { once: true });
    renderWidget();

    return () => {
      disposed = true;
      script?.removeEventListener('load', renderWidget);
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    };
  }, [siteKey]);

  useEffect(() => {
    if (resetKey > 0 && widgetIdRef.current && window.turnstile) {
      window.turnstile.reset(widgetIdRef.current);
      onTokenRef.current(null);
    }
  }, [resetKey]);

  if (!siteKey) {
    return import.meta.env.DEV ? null :
      <p className="text-error text-body-sm">Chưa cấu hình xác minh bảo mật. Vui lòng thử lại sau.</p>;
  }

  return (
    <div className="flex flex-col items-center gap-2" aria-label="Xác minh bảo mật">
      <div ref={containerRef} />
      {loadError && <p className="text-error text-body-sm">Không tải được bước xác minh. Vui lòng thử lại.</p>}
    </div>
  );
}
