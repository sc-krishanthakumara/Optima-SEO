// SEO Optimizer Type Definitions

export type PageGoal = 'Inform' | 'Convert' | 'Navigate';
export type Tone = 'Professional' | 'Friendly' | 'Technical' | 'Conversational';

export interface PageContext {
  pageGoal: PageGoal;
  tone: Tone;
  locale: string;
  keywordsRequired?: string[];
  sitePurpose?: string; // What is this site about?
  pagePurpose?: string; // What is this page about?
  targetAudience?: string; // Who is your target audience?
  businessGoals?: string; // What are your business goals?
}

export interface PageMetadata {
  title?: string;
  description?: string;
  keywords?: string[];
  canonical?: string;
  robots?: string;
}

export interface PageHeadings {
  h1?: string;
  h2?: string[];
  h3?: string[];
  all: string[];
}

export interface PageImage {
  id: string;
  alt?: string;
  src: string;
  componentId?: string;
  componentName?: string;
  fieldName?: string;
  path?: string[];
}

export interface PageLink {
  text?: string;
  href?: string;
  isPlaceholder?: boolean;
  isBroken?: boolean;
  componentId?: string;
  componentName?: string;
  fieldName?: string;
  path?: string[];
}

export interface ComponentContent {
  componentId: string;
  componentName: string;
  path: string[];
  headings: {
    h1?: string;
    h2?: string[];
    h3?: string[];
    all: string[];
  };
  paragraphs: {
    fieldName: string;
    text: string;
  }[];
  images: PageImage[];
  links: PageLink[];
}

export interface ReadabilityMetrics {
  score: number; // 0-100 (Flesch Reading Ease)
  grade: string; // e.g., "8th-9th grade"
  sentences: number;
  words: number;
  syllables: number;
  averageWordsPerSentence: number;
  averageSyllablesPerWord: number;
}

export interface ContentMetrics {
  wordCount: number;
  characterCount: number;
  paragraphCount: number;
  headingCount: number;
  linkCount: number;
  imageCount: number;
  readability?: ReadabilityMetrics;
}

export interface PageData {
  metadata: PageMetadata;
  headings: PageHeadings;
  text: string; // Concatenated paragraphs
  images: PageImage[];
  links: PageLink[];
  wordCount?: number;
  components?: ComponentContent[]; // Component-level content breakdown
  metrics?: ContentMetrics; // Comprehensive content metrics
}

export interface ScoreBreakdown {
  metadata: number; // 0-25
  content: number; // 0-25
  accessibility: number; // 0-25
  links: number; // 0-25
}

export interface SEOIssues {
  missingMetaDescription?: boolean;
  missingH1?: boolean;
  weakAltText?: string[]; // Image IDs
  placeholderLinks?: string[]; // Link hrefs
  brokenLinks?: string[]; // Link hrefs with details
  titleTooLong?: boolean;
  descriptionTooLong?: boolean;
  lowReadability?: boolean; // Readability score < 60
  shortContent?: boolean; // Word count < 250
  missingImages?: boolean; // No images found
  tooManyLinks?: boolean; // More than 100 links
  noInternalLinks?: boolean; // No internal links found
}

export interface BrokenLinkInfo {
  href: string;
  text?: string;
  componentId?: string;
  componentName?: string;
  reason: 'placeholder' | 'invalid-url' | 'empty' | 'suspected-broken';
}

export interface ScanResult {
  seoScore: number; // 0-100
  breakdown: ScoreBreakdown;
  issues: SEOIssues;
  pageData: PageData;
  brokenLinksDetails?: BrokenLinkInfo[]; // Detailed broken link information
}

export interface ComponentSuggestion {
  componentId: string;
  componentName: string;
  path: string[];
  metadata?: {
    title?: string;
    description?: string;
  };
  headings?: {
    h1?: string;
    h2?: string[];
    h3?: string[];
    improvements?: {
      fieldName: string;
      current: string;
      suggested: string;
      reason: string;
    }[];
  };
  content?: {
    paragraphs?: {
      fieldName: string;
      original: string;
      suggested: string;
      reason: string;
    }[];
  };
  images?: {
    id: string;
    fieldName: string;
    alt: string;
    currentAlt?: string;
  }[];
  links?: {
    fieldName: string;
    currentText?: string;
    suggestedText?: string;
    href: string;
    reason: string;
  }[];
}

export interface SEOSuggestions {
  // Page-level suggestions
  metadata?: {
    title?: string;
    description?: string;
  };
  headings?: {
    h1?: string;
    h2?: string[];
    h3?: string[];
  };
  
  // Component-level suggestions (organized by component)
  components?: ComponentSuggestion[];
  
  // Page-level analysis
  keywords?: {
    suggested: string[];
    usage?: {
      keyword: string;
      currentCount: number;
      suggestedCount: number;
      locations?: string[];
    }[];
  };
  structure?: {
    suggestions: string[];
    missing?: string[];
  };
  readability?: {
    score?: number;
    grade?: string;
    suggestions?: string[];
  };
}

export interface ApplySelection {
  metadata?: {
    title?: boolean;
    description?: boolean;
  };
  headings?: {
    h1?: boolean;
  };
  images?: {
    id: string;
    alt?: boolean;
  }[];
  components?: {
    [componentId: string]: {
      metadata?: {
        title?: boolean;
        description?: boolean;
      };
      headings?: {
        h1?: boolean;
        improvements?: string[]; // Field names
      };
      images?: {
        id: string;
        alt?: boolean;
      }[];
      links?: {
        fieldName: string;
        apply?: boolean;
      }[];
    };
  };
}

export interface ApplyResult {
  applied: string[];
  afterScore: number;
  breakdown: ScoreBreakdown;
  diffSummary: string[];
}

// Competitor Analysis Types
export interface CompetitorPageData {
  metadata: PageMetadata;
  headings: PageHeadings;
  text: string;
  images: {
    id: string;
    alt?: string;
    src: string;
  }[];
  links: {
    text?: string;
    href: string;
    isPlaceholder?: boolean;
    isBroken?: boolean;
  }[];
  wordCount: number;
  structuredData?: any[];
  metaKeywords?: string[];
  openGraph?: Record<string, string>;
  twitterCard?: Record<string, string>;
  metrics?: ContentMetrics;
}

export interface CompetitorData extends CompetitorPageData {
  url: string;
}

export interface CompetitorAnalysis {
  competitor: CompetitorData;
  insights: {
    strengths: string[];
    weaknesses: string[];
    opportunities: string[];
    recommendations: string[];
  };
  comparison?: {
    metadata: {
      titleLength: { current: number; competitor: number };
      descriptionLength: { current: number; competitor: number };
    };
    content: {
      wordCount: { current: number; competitor: number };
      headingCount: { current: number; competitor: number };
    };
    keywords: {
      competitorKeywords: string[];
      missingKeywords: string[];
    };
  };
}