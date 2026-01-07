// SEO Page Content Scanner - Extracts all SEO-relevant data from page content

import type { PageContent, SemanticTextItem } from '@/src/types';
import type { PageData, PageImage, PageLink, ComponentContent, ReadabilityMetrics, ContentMetrics, BrokenLinkInfo } from '@/src/types/seo';
import { extractPlainText } from './semanticClassifier';

/**
 * Scan page content and extract SEO-relevant data
 */
export function scanPageContent(
  pageContent: PageContent,
  semanticItems: SemanticTextItem[]
): PageData {
  // Extract metadata
  const metadata = extractMetadata(pageContent, semanticItems);

  // Extract headings
  const headings = extractHeadings(semanticItems);

  // Extract text content
  const text = extractTextContent(semanticItems);

  // Extract images
  const images = extractImages(semanticItems);

  // Extract links
  const links = extractLinks(semanticItems);

  // Count words
  const wordCount = countWords(text);

  // Extract component-level content
  const components = extractComponentContent(semanticItems);

  // Calculate comprehensive metrics
  const metrics = calculateContentMetrics(text, headings, links, images);

  return {
    metadata,
    headings,
    text,
    images,
    links,
    wordCount,
    components,
    metrics,
  };
}

/**
 * Extract content organized by component
 */
function extractComponentContent(semanticItems: SemanticTextItem[]): ComponentContent[] {
  const componentMap = new Map<string, ComponentContent>();

  for (const item of semanticItems) {
    const componentId = item.metadata.componentId;
    const componentName = item.metadata.componentName;
    const path = item.path;

    if (!componentMap.has(componentId)) {
      componentMap.set(componentId, {
        componentId,
        componentName,
        path,
        headings: {
          all: [],
        },
        paragraphs: [],
        images: [],
        links: [],
      });
    }

    const component = componentMap.get(componentId)!;

    // Categorize items by type
    if (item.category === 'Heading') {
      const text = extractPlainText(item.text).trim();
      if (text) {
        component.headings.all.push(text);
        
        // Try to detect heading level
        const fieldName = item.metadata.fieldName.toLowerCase();
        if (fieldName.includes('h1') || fieldName === 'title' || fieldName === 'heading') {
          if (!component.headings.h1) {
            component.headings.h1 = text;
          }
        } else if (fieldName.includes('h2')) {
          component.headings.h2 = component.headings.h2 || [];
          component.headings.h2.push(text);
        } else if (fieldName.includes('h3')) {
          component.headings.h3 = component.headings.h3 || [];
          component.headings.h3.push(text);
        }
      }
    } else if (item.category === 'Paragraph' || item.category === 'RichText') {
      const text = extractPlainText(item.text).trim();
      if (text.length > 10) {
        component.paragraphs.push({
          fieldName: item.metadata.fieldName,
          text,
        });
      }
    } else if (item.category === 'Image') {
      const altMatch = item.text.match(/Alt:\s*([^|]+)/);
      const srcMatch = item.text.match(/Src:\s*(.+)$/);
      const alt = altMatch ? altMatch[1].trim() : '';
      const src = srcMatch ? srcMatch[1].trim() : '';
      
      if (src) {
        component.images.push({
          id: item.id,
          alt,
          src,
          componentId: item.metadata.componentId,
          componentName: item.metadata.componentName,
          fieldName: item.metadata.fieldName,
          path: item.path,
        });
      }
    } else if (item.category === 'Link') {
      const urlMatch = item.text.match(/\[([^\]]+)\]$/);
      const textMatch = item.text.match(/^([^\[(]+)/);
      const href = urlMatch ? urlMatch[1].trim() : '';
      const linkText = textMatch ? textMatch[1].trim() : '';
      
      if (href) {
        component.links.push({
          text: linkText,
          href,
          isPlaceholder: href === 'http://#' || href === '#',
          componentId: item.metadata.componentId,
          componentName: item.metadata.componentName,
          fieldName: item.metadata.fieldName,
          path: item.path,
        });
      }
    }
  }

  return Array.from(componentMap.values());
}

/**
 * Extract metadata (title, description) from page content
 */
function extractMetadata(
  pageContent: PageContent,
  semanticItems: SemanticTextItem[]
): PageData['metadata'] {
  const metadata: PageData['metadata'] = {};

  // Try to find title and description from semantic items
  // Look for fields named "title", "metaTitle", "pageTitle", etc.
  const titleFields = semanticItems.filter(
    (item) =>
      item.metadata.fieldName.toLowerCase().includes('title') &&
      (item.category === 'Heading' || item.category === 'Label')
  );

  if (titleFields.length > 0) {
    // Prefer metaTitle or pageTitle over regular title
    const metaTitle = titleFields.find((item) =>
      item.metadata.fieldName.toLowerCase().includes('meta')
    );
    metadata.title = (metaTitle || titleFields[0]).text.trim();
  } else {
    // Fallback to page name
    metadata.title = pageContent.name;
  }

  // Look for description fields
  const descriptionFields = semanticItems.filter(
    (item) =>
      (item.metadata.fieldName.toLowerCase().includes('description') ||
        item.metadata.fieldName.toLowerCase().includes('meta') ||
        item.metadata.fieldName.toLowerCase().includes('summary')) &&
      (item.category === 'Paragraph' || item.category === 'RichText')
  );

  if (descriptionFields.length > 0) {
    // Prefer metaDescription
    const metaDesc = descriptionFields.find((item) =>
      item.metadata.fieldName.toLowerCase().includes('meta')
    );
    if (metaDesc) {
      metadata.description = extractPlainText(metaDesc.text).trim();
    } else {
      // Use first paragraph as description (limited to 165 chars)
      const firstDesc = extractPlainText(descriptionFields[0].text).trim();
      metadata.description = firstDesc.substring(0, 165);
    }
  }

  return metadata;
}

/**
 * Extract headings hierarchy
 */
function extractHeadings(semanticItems: SemanticTextItem[]): PageData['headings'] {
  const headings: PageData['headings'] = {
    all: [],
    h2: [],
    h3: [],
  };

  const headingItems = semanticItems.filter((item) => item.category === 'Heading');

  for (const item of headingItems) {
    const text = extractPlainText(item.text).trim();
    if (!text) continue;

    // Try to detect heading level from field name or text
    const fieldName = item.metadata.fieldName.toLowerCase();
    const textLower = text.toLowerCase();

    if (
      fieldName.includes('h1') ||
      fieldName === 'title' ||
      fieldName === 'heading' ||
      (!headings.h1 && !fieldName.includes('h2') && !fieldName.includes('h3'))
    ) {
      if (!headings.h1) {
        headings.h1 = text;
      }
    } else if (fieldName.includes('h2') || headings.h1) {
      headings.h2 = headings.h2 || [];
      headings.h2.push(text);
    } else if (fieldName.includes('h3')) {
      headings.h3 = headings.h3 || [];
      headings.h3.push(text);
    }

    headings.all.push(text);
  }

  return headings;
}

/**
 * Extract text content (paragraphs)
 */
function extractTextContent(semanticItems: SemanticTextItem[]): string {
  const paragraphs: string[] = [];

  const textItems = semanticItems.filter(
    (item) =>
      item.category === 'Paragraph' ||
      item.category === 'RichText' ||
      (item.category === 'Other' && item.text.length > 50)
  );

  for (const item of textItems) {
    const text = extractPlainText(item.text).trim();
    if (text.length > 10) {
      // Skip very short text
      paragraphs.push(text);
    }
  }

  return paragraphs.join(' ');
}

/**
 * Extract images with alt text
 */
function extractImages(semanticItems: SemanticTextItem[]): PageImage[] {
  const images: PageImage[] = [];

  const imageItems = semanticItems.filter((item) => item.category === 'Image');

  for (const item of imageItems) {
    // Parse image data from text (format: "Alt: xxx | Src: yyy")
    const altMatch = item.text.match(/Alt:\s*([^|]+)/);
    const srcMatch = item.text.match(/Src:\s*(.+)$/);

    const alt = altMatch ? altMatch[1].trim() : '';
    const src = srcMatch ? srcMatch[1].trim() : '';

    if (src) {
      images.push({
        id: item.id,
        alt,
        src,
        componentId: item.metadata.componentId,
        componentName: item.metadata.componentName,
        fieldName: item.metadata.fieldName,
        path: item.path,
      });
    }
  }

  return images;
}

/**
 * Extract links with enhanced detection
 */
function extractLinks(semanticItems: SemanticTextItem[]): PageLink[] {
  const links: PageLink[] = [];

  const linkItems = semanticItems.filter((item) => item.category === 'Link');

  for (const item of linkItems) {
    // Parse link data (format: "text [url]" or just "[url]")
    const urlMatch = item.text.match(/\[([^\]]+)\]$/);
    const textMatch = item.text.match(/^([^\[(]+)/);

    const href = urlMatch ? urlMatch[1].trim() : '';
    const text = textMatch ? textMatch[1].trim() : '';

    if (href) {
      const isPlaceholder =
        href === 'http://#' ||
        href === '#' ||
        href.startsWith('http://#') ||
        href.trim().length === 0;

      // Detect broken/invalid links
      const isBroken = detectBrokenLink(href);

      links.push({
        text,
        href,
        isPlaceholder,
        isBroken,
        componentId: item.metadata.componentId,
        componentName: item.metadata.componentName,
        fieldName: item.metadata.fieldName,
        path: item.path,
      });
    }
  }

  return links;
}

/**
 * Detect if a link is broken based on URL patterns
 */
function detectBrokenLink(href: string): boolean {
  if (!href || href.trim().length === 0) return true;
  
  // Placeholder patterns
  if (href === 'http://#' || href === '#' || href.startsWith('http://#')) {
    return true;
  }

  // Invalid URL patterns
  if (href.includes('javascript:void(0)') || href.includes('javascript:;')) {
    return true;
  }

  // Check for malformed URLs (basic validation)
  try {
    // Relative URLs are fine
    if (href.startsWith('/') || href.startsWith('./') || href.startsWith('../')) {
      return false;
    }
    
    // Try to parse as URL
    new URL(href);
    return false;
  } catch {
    // If it's not a relative path and not a valid URL, it might be broken
    // But be lenient - could be a valid relative path without leading slash
    return href.includes(' ') || href.includes('\n') || href.includes('\t');
  }
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
 * Calculate comprehensive content metrics including readability
 */
function calculateContentMetrics(
  text: string,
  headings: PageData['headings'],
  links: PageLink[],
  images: PageImage[]
): ContentMetrics {
  const cleanText = text.replace(/<[^>]+>/g, ' ').trim();
  const words = cleanText.split(/\s+/).filter((w) => w.length > 0);
  const sentences = cleanText.split(/[.!?]+/).filter((s) => s.trim().length > 0);
  const paragraphs = cleanText.split(/\n\s*\n/).filter((p) => p.trim().length > 0);
  
  const wordCount = words.length;
  const characterCount = cleanText.length;
  const paragraphCount = paragraphs.length;
  const headingCount = headings.all.length;
  const linkCount = links.length;
  const imageCount = images.length;

  // Calculate readability (Flesch Reading Ease)
  const readability = calculateReadability(cleanText, words, sentences);

  return {
    wordCount,
    characterCount,
    paragraphCount,
    headingCount,
    linkCount,
    imageCount,
    readability,
  };
}

/**
 * Calculate Flesch Reading Ease score
 * Formula: 206.835 - (1.015 × ASL) - (84.6 × ASW)
 * ASL = Average Sentence Length (words per sentence)
 * ASW = Average Syllables per Word
 */
function calculateReadability(
  text: string,
  words: string[],
  sentences: string[]
): ReadabilityMetrics {
  if (words.length === 0 || sentences.length === 0) {
    return {
      score: 0,
      grade: 'N/A',
      sentences: 0,
      words: 0,
      syllables: 0,
      averageWordsPerSentence: 0,
      averageSyllablesPerWord: 0,
    };
  }

  // Count syllables
  let totalSyllables = 0;
  for (const word of words) {
    totalSyllables += countSyllables(word);
  }

  const averageWordsPerSentence = words.length / sentences.length;
  const averageSyllablesPerWord = totalSyllables / words.length;

  // Flesch Reading Ease formula
  const score = Math.round(
    206.835 - (1.015 * averageWordsPerSentence) - (84.6 * averageSyllablesPerWord)
  );
  
  // Clamp score between 0 and 100
  const clampedScore = Math.max(0, Math.min(100, score));

  // Determine grade level
  const grade = getReadabilityGrade(clampedScore);

  return {
    score: clampedScore,
    grade,
    sentences: sentences.length,
    words: words.length,
    syllables: totalSyllables,
    averageWordsPerSentence: Math.round(averageWordsPerSentence * 10) / 10,
    averageSyllablesPerWord: Math.round(averageSyllablesPerWord * 100) / 100,
  };
}

/**
 * Count syllables in a word (simplified algorithm)
 */
function countSyllables(word: string): number {
  const lowerWord = word.toLowerCase().trim();
  
  if (lowerWord.length <= 3) return 1;
  
  // Remove silent 'e' at the end
  let modified = lowerWord.replace(/e$/, '');
  
  // Count vowel groups
  const vowelGroups = modified.match(/[aeiouy]+/g);
  if (!vowelGroups) return 1;
  
  let syllables = vowelGroups.length;
  
  // Adjust for common patterns
  if (lowerWord.endsWith('le') && lowerWord.length > 2) {
    syllables += 1;
  }
  
  return Math.max(1, syllables);
}

/**
 * Get readability grade level from Flesch score
 */
function getReadabilityGrade(score: number): string {
  if (score >= 90) return '5th grade';
  if (score >= 80) return '6th grade';
  if (score >= 70) return '7th grade';
  if (score >= 60) return '8th-9th grade';
  if (score >= 50) return '10th-12th grade';
  if (score >= 30) return 'College';
  return 'College graduate';
}
