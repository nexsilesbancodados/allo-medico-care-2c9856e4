import { useEffect } from "react";

interface SEOHeadProps {
  title?: string;
  description?: string;
  canonical?: string;
  ogImage?: string;
}

const SITE_NAME = "AloClinica – Telemedicina Online";
const DEFAULT_OG_IMAGE = "https://storage.googleapis.com/gpt-engineer-file-uploads/0XILPRqqUbSOh99ow53X5OBDOCC3/social-images/social-1771223927717-mascot-wave-DmAVveg6-removebg-preview.webp";
const BASE_URL = "https://allo-medico-care.lovable.app";

const upsertMeta = (attr: string, key: string, content: string) => {
  let el = document.querySelector(`meta[${attr}="${key}"]`) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.content = content;
};

const upsertLink = (rel: string, href: string) => {
  let el = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null;
  if (!el) {
    el = document.createElement("link");
    el.rel = rel;
    document.head.appendChild(el);
  }
  el.href = href;
};

const SEOHead = ({ title, description, canonical, ogImage }: SEOHeadProps) => {
  useEffect(() => {
    const fullTitle = title ? `${title} | ${SITE_NAME}` : SITE_NAME;
    document.title = fullTitle;

    if (description) {
      upsertMeta("name", "description", description);
      upsertMeta("property", "og:description", description);
      upsertMeta("name", "twitter:description", description);
    }

    // OG tags
    upsertMeta("property", "og:title", fullTitle);
    upsertMeta("name", "twitter:title", fullTitle);
    upsertMeta("property", "og:image", ogImage || DEFAULT_OG_IMAGE);
    upsertMeta("name", "twitter:image", ogImage || DEFAULT_OG_IMAGE);
    upsertMeta("property", "og:url", canonical || `${BASE_URL}${window.location.pathname}`);

    if (canonical) {
      upsertLink("canonical", canonical);
    }

    return () => {
      document.title = SITE_NAME;
    };
  }, [title, description, canonical, ogImage]);

  return null;
};

export default SEOHead;
