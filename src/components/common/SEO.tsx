import React, { useEffect } from 'react';

interface SeoProps {
  title: string;
  description: string;
  canonicalPath?: string;
  ogType?: 'website' | 'article' | 'product';
  ogImage?: string;
  noIndex?: boolean;
  jsonLd?: Record<string, any> | Array<Record<string, any>>;
}

export const SEO: React.FC<SeoProps> = ({
  title,
  description,
  canonicalPath = '',
  ogType = 'website',
  ogImage = 'https://camnexbd.com/og-image.jpg',
  noIndex = false,
  jsonLd
}) => {
  useEffect(() => {
    // 1. Page Title template
    const isHome = canonicalPath === '/' || title === 'CamneX Bangladesh' || title === 'Home';
    const cleanTitle = title.replace(/\s*\|\s*CamneX Bangladesh.*$/i, '').trim();
    const formattedTitle = isHome ? 'CamneX Bangladesh' : `${cleanTitle} | CamneX Bangladesh`;
    document.title = formattedTitle;

    // 2. Helper to set or create meta tag
    const setMeta = (nameAttr: 'name' | 'property', attrValue: string, content: string) => {
      let el = document.querySelector(`meta[${nameAttr}="${attrValue}"]`) as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(nameAttr, attrValue);
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
    };

    // 3. Meta description & robots
    setMeta('name', 'description', description);
    if (noIndex) {
      setMeta('name', 'robots', 'noindex, follow');
    } else {
      setMeta('name', 'robots', 'index, follow');
    }

    // 4. OpenGraph
    setMeta('property', 'og:title', formattedTitle);
    setMeta('property', 'og:description', description);
    setMeta('property', 'og:type', ogType);
    setMeta('property', 'og:image', ogImage);
    setMeta('property', 'og:site_name', 'CamneX Bangladesh');

    const canonicalUrl = `https://camnexbd.com${canonicalPath}`;
    setMeta('property', 'og:url', canonicalUrl);

    // 5. Canonical Link tag
    let linkCanonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!linkCanonical) {
      linkCanonical = document.createElement('link');
      linkCanonical.setAttribute('rel', 'canonical');
      document.head.appendChild(linkCanonical);
    }
    linkCanonical.setAttribute('href', canonicalUrl);

    // 6. Twitter Card
    setMeta('name', 'twitter:card', 'summary_large_image');
    setMeta('name', 'twitter:title', formattedTitle);
    setMeta('name', 'twitter:description', description);
    setMeta('name', 'twitter:image', ogImage);

    // 7. JSON-LD Structured Data
    const existingLd = document.getElementById('per-route-jsonld');
    if (existingLd) existingLd.remove();

    if (jsonLd) {
      const script = document.createElement('script');
      script.id = 'per-route-jsonld';
      script.type = 'application/ld+json';
      script.textContent = JSON.stringify(jsonLd);
      document.head.appendChild(script);
    }

    return () => {
      const ld = document.getElementById('per-route-jsonld');
      if (ld) ld.remove();
    };
  }, [title, description, canonicalPath, ogType, ogImage, noIndex, jsonLd]);

  return null;
};
