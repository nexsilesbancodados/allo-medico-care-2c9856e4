import { useEffect } from "react";

interface SEOHeadProps {
  title?: string;
  description?: string;
  canonical?: string;
}

/**
 * Lightweight component to update document <title> and meta description
 * without adding a new dependency (react-helmet).
 */
const SEOHead = ({ title, description, canonical }: SEOHeadProps) => {
  useEffect(() => {
    const suffix = "AloClinica – Telemedicina Online";
    document.title = title ? `${title} | ${suffix}` : suffix;

    if (description) {
      let meta = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
      if (!meta) {
        meta = document.createElement("meta");
        meta.name = "description";
        document.head.appendChild(meta);
      }
      meta.content = description;
    }

    if (canonical) {
      let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
      if (!link) {
        link = document.createElement("link");
        link.rel = "canonical";
        document.head.appendChild(link);
      }
      link.href = canonical;
    }

    return () => {
      document.title = suffix;
    };
  }, [title, description, canonical]);

  return null;
};

export default SEOHead;
