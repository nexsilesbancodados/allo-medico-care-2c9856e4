import { useEffect } from "react";
import { useLocation } from "react-router-dom";

// Configure these IDs when ready for production
const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID || "";
const META_PIXEL_ID = import.meta.env.VITE_META_PIXEL_ID || "";

// Track page views
export const usePageTracking = () => {
  const location = useLocation();

  useEffect(() => {
    // Google Analytics pageview
    if (GA_MEASUREMENT_ID && (window as any).gtag) {
      (window as any).gtag("config", GA_MEASUREMENT_ID, {
        page_path: location.pathname + location.search,
      });
    }

    // Meta Pixel pageview
    if (META_PIXEL_ID && (window as any).fbq) {
      (window as any).fbq("track", "PageView");
    }
  }, [location]);
};

// Track custom events
export const trackEvent = (eventName: string, params?: Record<string, any>) => {
  // Google Analytics
  if (GA_MEASUREMENT_ID && (window as any).gtag) {
    (window as any).gtag("event", eventName, params);
  }

  // Meta Pixel
  if (META_PIXEL_ID && (window as any).fbq) {
    (window as any).fbq("track", eventName, params);
  }
};

// Common event helpers
export const trackPurchase = (value: number, currency = "BRL", itemName?: string) => {
  trackEvent("Purchase", { value, currency, content_name: itemName });
};

export const trackLead = (source?: string) => {
  trackEvent("Lead", { content_name: source });
};

export const trackSignUp = (method?: string) => {
  trackEvent("CompleteRegistration", { content_name: method });
};

const AnalyticsScripts = () => {
  useEffect(() => {
    // Only load if IDs are configured
    if (GA_MEASUREMENT_ID) {
      // Google Analytics (gtag.js)
      const gaScript = document.createElement("script");
      gaScript.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
      gaScript.async = true;
      document.head.appendChild(gaScript);

      const gaInline = document.createElement("script");
      gaInline.innerHTML = `
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', '${GA_MEASUREMENT_ID}');
      `;
      document.head.appendChild(gaInline);
    }

    if (META_PIXEL_ID) {
      // Meta Pixel
      const fbScript = document.createElement("script");
      fbScript.innerHTML = `
        !function(f,b,e,v,n,t,s)
        {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
        n.callMethod.apply(n,arguments):n.queue.push(arguments)};
        if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
        n.queue=[];t=b.createElement(e);t.async=!0;
        t.src=v;s=b.getElementsByTagName(e)[0];
        s.parentNode.insertBefore(t,s)}(window, document,'script',
        'https://connect.facebook.net/en_US/fbevents.js');
        fbq('init', '${META_PIXEL_ID}');
        fbq('track', 'PageView');
      `;
      document.head.appendChild(fbScript);

      // Noscript fallback
      const noscript = document.createElement("noscript");
      const img = document.createElement("img");
      img.height = 1;
      img.width = 1;
      img.style.display = "none";
      img.src = `https://www.facebook.com/tr?id=${META_PIXEL_ID}&ev=PageView&noscript=1`;
      noscript.appendChild(img);
      document.body.appendChild(noscript);
    }
  }, []);

  return null;
};

export default AnalyticsScripts;
