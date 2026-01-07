// SEO Scoring Module - Computes SEO score (0-100) with 4-part breakdown

import type {
  PageData,
  ScoreBreakdown,
  SEOIssues,
  ScanResult,
  BrokenLinkInfo,
} from '@/src/types/seo';

/**
 * Compute SEO score from page data
 */
export function computeSEOScore(pageData: PageData): ScanResult {
  const breakdown: ScoreBreakdown = {
    metadata: scoreMetadata(pageData.metadata),
    content: scoreContent(pageData.headings, pageData.text, pageData.wordCount),
    accessibility: scoreAccessibility(pageData.images),
    links: scoreLinks(pageData.links),
  };

  const seoScore = Math.round(
    breakdown.metadata + breakdown.content + breakdown.accessibility + breakdown.links
  );

  const { issues, brokenLinksDetails } = identifyIssues(pageData);

  return {
    seoScore,
    breakdown,
    issues,
    pageData,
    brokenLinksDetails,
  };
}

/**
 * Score metadata (0-25 points)
 * +10 if title present and ≤ 60 chars
 * +10 if description present and ≤ 165 chars
 * +5 if both non-empty after trim
 */
function scoreMetadata(metadata: PageData['metadata']): number {
  let score = 0;

  const title = metadata.title?.trim() || '';
  const description = metadata.description?.trim() || '';

  // Title scoring
  if (title.length > 0) {
    if (title.length <= 60) {
      score += 10;
    } else {
      score += Math.max(0, 10 - (title.length - 60) * 0.1); // Penalty for being too long
    }
  }

  // Description scoring
  if (description.length > 0) {
    if (description.length <= 165) {
      score += 10;
    } else {
      score += Math.max(0, 10 - (description.length - 165) * 0.1); // Penalty for being too long
    }
  }

  // Bonus for both present
  if (title.length > 0 && description.length > 0) {
    score += 5;
  }

  return Math.min(25, Math.round(score));
}

/**
 * Score content basics (0-25 points)
 * +15 if H1 present
 * +10 if body length ≥ 250 words
 */
function scoreContent(
  headings: PageData['headings'],
  text: string,
  wordCount?: number
): number {
  let score = 0;

  // H1 presence
  if (headings.h1 && headings.h1.trim().length > 0) {
    score += 15;
  }

  // Content length
  const words = wordCount || countWords(text);
  if (words >= 250) {
    score += 10;
  } else if (words > 0) {
    // Partial credit for shorter content
    score += Math.round((words / 250) * 10);
  }

  return Math.min(25, Math.round(score));
}

/**
 * Score accessibility (0-25 points)
 * Proportional to percentage of images with alt text length ≥ 5 characters
 */
function scoreAccessibility(images: PageData['images']): number {
  if (images.length === 0) {
    return 25; // No images = perfect accessibility score
  }

  const imagesWithAlt = images.filter(
    (img) => img.alt && img.alt.trim().length >= 5
  ).length;

  const percentage = imagesWithAlt / images.length;
  return Math.round(percentage * 25);
}

/**
 * Score links (0-25 points)
 * +25 if no placeholder/broken links
 * Else proportional to valid links
 */
function scoreLinks(links: PageData['links']): number {
  if (links.length === 0) {
    return 25; // No links = perfect score
  }

  const validLinks = links.filter(
    (link) =>
      link.href &&
      link.href.trim().length > 0 &&
      !link.isPlaceholder &&
      !link.isBroken &&
      link.href !== 'http://#' &&
      link.href !== '#'
  ).length;

  const percentage = validLinks / links.length;
  return Math.round(percentage * 25);
}

/**
 * Identify SEO issues with detailed broken link information
 */
function identifyIssues(pageData: PageData): { issues: SEOIssues; brokenLinksDetails: BrokenLinkInfo[] } {
  const issues: SEOIssues = {};
  const brokenLinksDetails: BrokenLinkInfo[] = [];

  // Metadata issues
  if (!pageData.metadata.description || pageData.metadata.description.trim().length === 0) {
    issues.missingMetaDescription = true;
  }

  const title = pageData.metadata.title?.trim() || '';
  if (title.length > 60) {
    issues.titleTooLong = true;
  }

  const description = pageData.metadata.description?.trim() || '';
  if (description.length > 165) {
    issues.descriptionTooLong = true;
  }

  // Content issues
  if (!pageData.headings.h1 || pageData.headings.h1.trim().length === 0) {
    issues.missingH1 = true;
  }

  // Content length check
  const wordCount = pageData.wordCount || countWords(pageData.text);
  if (wordCount < 250) {
    issues.shortContent = true;
  }

  // Readability check
  if (pageData.metrics?.readability && pageData.metrics.readability.score < 60) {
    issues.lowReadability = true;
  }

  // Accessibility issues
  const weakAltImages = pageData.images
    .filter((img) => !img.alt || img.alt.trim().length < 5)
    .map((img) => img.id);
  if (weakAltImages.length > 0) {
    issues.weakAltText = weakAltImages;
  }

  if (pageData.images.length === 0) {
    issues.missingImages = true;
  }

  // Link issues - comprehensive detection
  const brokenLinks: string[] = [];
  const placeholderLinks: string[] = [];

  for (const link of pageData.links) {
    if (!link.href || link.href.trim().length === 0) {
      brokenLinks.push(link.href || 'empty');
      brokenLinksDetails.push({
        href: link.href || 'empty',
        text: link.text,
        componentId: link.componentId,
        componentName: link.componentName,
        reason: 'empty',
      });
    } else if (
      link.isPlaceholder ||
      link.href === 'http://#' ||
      link.href === '#'
    ) {
      placeholderLinks.push(link.href);
      brokenLinksDetails.push({
        href: link.href,
        text: link.text,
        componentId: link.componentId,
        componentName: link.componentName,
        reason: 'placeholder',
      });
    } else if (link.isBroken) {
      brokenLinks.push(link.href);
      brokenLinksDetails.push({
        href: link.href,
        text: link.text,
        componentId: link.componentId,
        componentName: link.componentName,
        reason: 'suspected-broken',
      });
    }
  }

  if (placeholderLinks.length > 0) {
    issues.placeholderLinks = placeholderLinks;
  }

  if (brokenLinks.length > 0) {
    issues.brokenLinks = brokenLinks;
  }

  // Check for too many links
  if (pageData.links.length > 100) {
    issues.tooManyLinks = true;
  }

  // Check for internal links (basic heuristic: relative URLs or same domain)
  const hasInternalLinks = pageData.links.some(
    (link) =>
      link.href &&
      !link.isPlaceholder &&
      !link.isBroken &&
      (link.href.startsWith('/') || link.href.startsWith('./') || link.href.startsWith('../'))
  );
  if (pageData.links.length > 0 && !hasInternalLinks) {
    issues.noInternalLinks = true;
  }

  return { issues, brokenLinksDetails };
}

/**
 * Count words in text
 */
function countWords(text: string): number {
  if (!text || text.trim().length === 0) {
    return 0;
  }

  // Remove HTML tags
  const textOnly = text.replace(/<[^>]+>/g, ' ');
  
  // Split by whitespace and filter empty strings
  const words = textOnly.trim().split(/\s+/).filter((w) => w.length > 0);
  
  return words.length;
}

/**
 * Get SEO grade from score
 */
export function getSEOGrade(score: number): string {
  if (score >= 90) return 'A+';
  if (score >= 80) return 'A';
  if (score >= 70) return 'B';
  if (score >= 60) return 'C';
  if (score >= 50) return 'D';
  return 'F';
}

/**
 * Get color for score - using Sitecore theme colors
 */
export function getScoreColor(score: number): string {
  if (score >= 80) return '#8629FF'; // purple (theme) - good
  if (score >= 60) return '#6b7280'; // gray - moderate
  return '#FF1F38'; // red (theme) - poor
}
