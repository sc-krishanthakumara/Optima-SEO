// Competitor Website Analyzer - Extracts SEO data from competitor websites

import type { CompetitorData, CompetitorPageData } from '@/src/types/seo';

/**
 * Analyze competitor website HTML and extract SEO-relevant data
 * Note: This function must be called in a browser environment (client-side)
 */
export function analyzeCompetitorWebsite(html: string, url: string): CompetitorData {
  // Check if DOMParser is available (browser environment)
  if (typeof DOMParser === 'undefined') {
    throw new Error('DOMParser is not available. This function must be called in a browser environment.');
  }

  // Create a DOM parser (works in browser environment)
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  // Extract metadata
  const metadata = extractCompetitorMetadata(doc);

  // Extract headings
  const headings = extractCompetitorHeadings(doc);

  // Extract text content
  const text = extractCompetitorText(doc);

  // Extract images
  const images = extractCompetitorImages(doc);

  // Extract links
  const links = extractCompetitorLinks(doc, url);

  // Extract structured data / schema
  const structuredData = extractStructuredData(doc);

  // Extract meta keywords and other SEO elements
  const metaKeywords = extractMetaKeywords(doc);
  const openGraph = extractOpenGraph(doc);
  const twitterCard = extractTwitterCard(doc);

  // Calculate metrics
  const wordCount = countWords(text);
  const metrics = calculateCompetitorMetrics(text, headings, links, images);

  return {
    url,
    metadata,
    headings,
    text,
    images,
    links,
    wordCount,
    structuredData,
    metaKeywords,
    openGraph,
    twitterCard,
    metrics,
  };
}

/**
 * Extract metadata from competitor page
 */
function extractCompetitorMetadata(doc: Document): CompetitorPageData['metadata'] {
  const metadata: CompetitorPageData['metadata'] = {};

  // Title
  const titleTag = doc.querySelector('title');
  if (titleTag) {
    metadata.title = titleTag.textContent?.trim() || '';
  }

  // Meta description
  const metaDesc = doc.querySelector('meta[name="description"]');
  if (metaDesc) {
    metadata.description = metaDesc.getAttribute('content')?.trim() || '';
  }

  // Canonical
  const canonical = doc.querySelector('link[rel="canonical"]');
  if (canonical) {
    metadata.canonical = canonical.getAttribute('href')?.trim() || '';
  }

  // Robots
  const robots = doc.querySelector('meta[name="robots"]');
  if (robots) {
    metadata.robots = robots.getAttribute('content')?.trim() || '';
  }

  // Meta keywords (legacy but some sites still use)
  const metaKeywords = doc.querySelector('meta[name="keywords"]');
  if (metaKeywords) {
    metadata.keywords = metaKeywords.getAttribute('content')?.split(',').map(k => k.trim()) || [];
  }

  return metadata;
}

/**
 * Extract headings hierarchy
 */
function extractCompetitorHeadings(doc: Document): CompetitorPageData['headings'] {
  const headings: CompetitorPageData['headings'] = {
    all: [],
    h2: [],
    h3: [],
  };

  // H1
  const h1 = doc.querySelector('h1');
  if (h1) {
    headings.h1 = h1.textContent?.trim() || '';
    headings.all.push(headings.h1);
  }

  // H2
  const h2Elements = doc.querySelectorAll('h2');
  h2Elements.forEach((h2) => {
    const text = h2.textContent?.trim();
    if (text) {
      headings.h2.push(text);
      headings.all.push(text);
    }
  });

  // H3
  const h3Elements = doc.querySelectorAll('h3');
  h3Elements.forEach((h3) => {
    const text = h3.textContent?.trim();
    if (text) {
      headings.h3.push(text);
      headings.all.push(text);
    }
  });

  return headings;
}

/**
 * Extract main text content
 */
function extractCompetitorText(doc: Document): string {
  // Remove script and style elements
  const scripts = doc.querySelectorAll('script, style, nav, header, footer, aside');
  scripts.forEach((el) => el.remove());

  // Try to find main content area
  const main = doc.querySelector('main, article, [role="main"], .content, #content');
  const contentElement = main || doc.body;

  // Extract text from paragraphs
  const paragraphs = contentElement.querySelectorAll('p');
  const texts: string[] = [];

  paragraphs.forEach((p) => {
    const text = p.textContent?.trim();
    if (text && text.length > 20) {
      texts.push(text);
    }
  });

  return texts.join(' ');
}

/**
 * Extract images with alt text
 */
function extractCompetitorImages(doc: Document): CompetitorPageData['images'] {
  const images: CompetitorPageData['images'] = [];
  const imgElements = doc.querySelectorAll('img');

  imgElements.forEach((img, index) => {
    const src = img.getAttribute('src') || img.getAttribute('data-src') || '';
    const alt = img.getAttribute('alt') || '';

    if (src) {
      images.push({
        id: `img-${index}`,
        alt,
        src: src.startsWith('http') ? src : new URL(src, doc.baseURI).href,
      });
    }
  });

  return images;
}

/**
 * Extract links
 */
function extractCompetitorLinks(doc: Document, baseUrl: string): CompetitorPageData['links'] {
  const links: CompetitorPageData['links'] = [];
  const linkElements = doc.querySelectorAll('a[href]');

  linkElements.forEach((link) => {
    const href = link.getAttribute('href');
    const text = link.textContent?.trim() || '';

    if (href) {
      // Resolve relative URLs
      let fullUrl = href;
      try {
        fullUrl = new URL(href, baseUrl).href;
      } catch {
        // Invalid URL, skip
        return;
      }

      links.push({
        text,
        href: fullUrl,
        isPlaceholder: href === '#' || href.startsWith('javascript:'),
        isBroken: false, // Would need to check separately
      });
    }
  });

  return links;
}

/**
 * Extract structured data (JSON-LD, microdata)
 */
function extractStructuredData(doc: Document): any[] {
  const structuredData: any[] = [];

  // JSON-LD
  const jsonLdScripts = doc.querySelectorAll('script[type="application/ld+json"]');
  jsonLdScripts.forEach((script) => {
    try {
      const data = JSON.parse(script.textContent || '{}');
      structuredData.push(data);
    } catch {
      // Invalid JSON, skip
    }
  });

  return structuredData;
}

/**
 * Extract meta keywords
 */
function extractMetaKeywords(doc: Document): string[] {
  const metaKeywords = doc.querySelector('meta[name="keywords"]');
  if (metaKeywords) {
    const content = metaKeywords.getAttribute('content');
    if (content) {
      return content.split(',').map(k => k.trim()).filter(k => k.length > 0);
    }
  }
  return [];
}

/**
 * Extract Open Graph data
 */
function extractOpenGraph(doc: Document): Record<string, string> {
  const og: Record<string, string> = {};
  const ogTags = doc.querySelectorAll('meta[property^="og:"]');

  ogTags.forEach((tag) => {
    const property = tag.getAttribute('property');
    const content = tag.getAttribute('content');
    if (property && content) {
      og[property] = content;
    }
  });

  return og;
}

/**
 * Extract Twitter Card data
 */
function extractTwitterCard(doc: Document): Record<string, string> {
  const twitter: Record<string, string> = {};
  const twitterTags = doc.querySelectorAll('meta[name^="twitter:"]');

  twitterTags.forEach((tag) => {
    const name = tag.getAttribute('name');
    const content = tag.getAttribute('content');
    if (name && content) {
      twitter[name] = content;
    }
  });

  return twitter;
}

/**
 * Count words in text
 */
function countWords(text: string): number {
  if (!text || text.trim().length === 0) {
    return 0;
  }
  const words = text.trim().split(/\s+/).filter((w) => w.length > 0);
  return words.length;
}

/**
 * Calculate competitor metrics
 */
function calculateCompetitorMetrics(
  text: string,
  headings: CompetitorPageData['headings'],
  links: CompetitorPageData['links'],
  images: CompetitorPageData['images']
): CompetitorPageData['metrics'] {
  const cleanText = text.replace(/<[^>]+>/g, ' ').trim();
  const words = cleanText.split(/\s+/).filter((w) => w.length > 0);
  const sentences = cleanText.split(/[.!?]+/).filter((s) => s.trim().length > 0);

  return {
    wordCount: words.length,
    characterCount: cleanText.length,
    paragraphCount: cleanText.split(/\n\s*\n/).filter((p) => p.trim().length > 0).length,
    headingCount: headings.all.length,
    linkCount: links.length,
    imageCount: images.length,
  };
}
