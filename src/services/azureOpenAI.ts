// Azure OpenAI Service for SEO Suggestions

import type { PageContext, PageData, SEOSuggestions } from '@/src/types/seo';

export interface AzureOpenAIConfig {
  endpoint: string;
  apiKey: string;
  deployment: string;
}

export class AzureOpenAIService {
  private endpoint: string;
  private apiKey: string;
  private deployment: string;

  constructor(config: AzureOpenAIConfig) {
    this.endpoint = config.endpoint;
    this.apiKey = config.apiKey;
    this.deployment = config.deployment;
  }

  /**
   * Generate SEO suggestions using Azure OpenAI
   */
  async generateSuggestions(
    context: PageContext,
    pageData: PageData
  ): Promise<SEOSuggestions> {
    const prompt = this.buildPrompt(context, pageData);

    try {
      const response = await fetch(
        `${this.endpoint}/openai/deployments/${this.deployment}/chat/completions?api-version=2024-02-15-preview`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'api-key': this.apiKey,
          },
          body: JSON.stringify({
            messages: [
              {
                role: 'system',
                content: this.getSystemPrompt(),
              },
              {
                role: 'user',
                content: prompt,
              },
            ],
            temperature: 0.2,
            max_tokens: 4000,
            response_format: { type: 'json_object' },
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Azure OpenAI API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content;

      if (!content) {
        throw new Error('No content in OpenAI response');
      }

      const suggestions = JSON.parse(content) as SEOSuggestions;
      return this.validateAndCleanSuggestions(suggestions, pageData);
    } catch (error) {
      console.error('Error generating SEO suggestions:', error);
      throw error;
    }
  }

  /**
   * Build the prompt for OpenAI - Comprehensive page analysis
   */
  private buildPrompt(context: PageContext, pageData: PageData): string {
    const parts: string[] = [];

    parts.push(`=== CONTEXT & BUSINESS INFORMATION ===`);
    parts.push(`Locale: ${context.locale}`);
    parts.push(`Page Goal: ${context.pageGoal}`);
    parts.push(`Tone: ${context.tone}`);
    
    // Enhanced context information
    if (context.sitePurpose) {
      parts.push(`\nSite Purpose: ${context.sitePurpose}`);
    }
    if (context.pagePurpose) {
      parts.push(`Page Purpose: ${context.pagePurpose}`);
    }
    if (context.targetAudience) {
      parts.push(`Target Audience: ${context.targetAudience}`);
    }
    if (context.businessGoals) {
      parts.push(`Business Goals: ${context.businessGoals}`);
    }
    if (context.keywordsRequired && context.keywordsRequired.length > 0) {
      parts.push(`\nRequired Keywords (must prioritize these): ${context.keywordsRequired.join(', ')}`);
      parts.push(`IMPORTANT: These keywords are specifically requested. Use them naturally throughout suggestions, but avoid keyword stuffing.`);
    }

    parts.push(`\n=== CURRENT PAGE CONTENT ===`);

    // Metadata
    parts.push(`\nMetadata:`);
    parts.push(`- Title: ${pageData.metadata.title || '(missing)'} ${pageData.metadata.title ? `(${pageData.metadata.title.length} chars)` : ''}`);
    parts.push(`- Description: ${pageData.metadata.description || '(missing)'} ${pageData.metadata.description ? `(${pageData.metadata.description.length} chars)` : ''}`);

    // Headings
    parts.push(`\nHeadings:`);
    if (pageData.headings.h1) {
      parts.push(`- H1: ${pageData.headings.h1}`);
    } else {
      parts.push(`- H1: (missing)`);
    }
    if (pageData.headings.h2 && pageData.headings.h2.length > 0) {
      parts.push(`- H2: ${pageData.headings.h2.join(' | ')}`);
    }
    if (pageData.headings.h3 && pageData.headings.h3.length > 0) {
      parts.push(`- H3: ${pageData.headings.h3.join(' | ')}`);
    }
    if (pageData.headings.all.length > 0) {
      parts.push(`- All headings: ${pageData.headings.all.slice(0, 10).join(', ')}${pageData.headings.all.length > 10 ? '...' : ''}`);
    }

    // Content
    parts.push(`\nContent:`);
    parts.push(`- Word count: ${pageData.wordCount || 0} words`);
    const contentPreview = pageData.text.substring(0, 500);
    parts.push(`- Content preview: ${contentPreview}${pageData.text.length > 500 ? '...' : ''}`);

    // Component-level content
    if (pageData.components && pageData.components.length > 0) {
      parts.push(`\n=== COMPONENT-BY-COMPONENT BREAKDOWN ===`);
      pageData.components.forEach((component, idx) => {
        parts.push(`\nComponent ${idx + 1}: ${component.componentName}`);
        parts.push(`  ID: ${component.componentId}`);
        parts.push(`  Path: ${component.path.join(' > ')}`);
        
        if (component.headings.all.length > 0) {
          parts.push(`  Headings:`);
          if (component.headings.h1) parts.push(`    - H1: ${component.headings.h1}`);
          if (component.headings.h2 && component.headings.h2.length > 0) {
            component.headings.h2.forEach((h2) => parts.push(`    - H2: ${h2}`));
          }
          if (component.headings.h3 && component.headings.h3.length > 0) {
            component.headings.h3.forEach((h3) => parts.push(`    - H3: ${h3}`));
          }
        }
        
        if (component.paragraphs.length > 0) {
          parts.push(`  Paragraphs:`);
          component.paragraphs.forEach((para) => {
            const preview = para.text.substring(0, 100);
            parts.push(`    - Field "${para.fieldName}": ${preview}${para.text.length > 100 ? '...' : ''}`);
          });
        }
        
        if (component.images.length > 0) {
          parts.push(`  Images:`);
          component.images.forEach((img) => {
            parts.push(`    - Field "${img.fieldName}" (${img.id}): alt="${img.alt || '(no alt text)'}"`);
          });
        }
        
        if (component.links.length > 0) {
          parts.push(`  Links:`);
          component.links.forEach((link) => {
            const status = link.isPlaceholder ? '[PLACEHOLDER]' : '[OK]';
            parts.push(`    - Field "${link.fieldName}": text="${link.text || '(no text)'}" href="${link.href || '(no href)'}" ${status}`);
          });
        }
      });
    } else {
      // Fallback to flat structure if components not available
      if (pageData.images.length > 0) {
        parts.push(`\nImages (${pageData.images.length}):`);
        pageData.images.forEach((img, idx) => {
          parts.push(`- Image ${img.id || idx + 1}: alt="${img.alt || '(no alt text)'}" src="${img.src.substring(0, 60)}${img.src.length > 60 ? '...' : ''}"`);
        });
      }

      if (pageData.links.length > 0) {
        parts.push(`\nLinks (${pageData.links.length}):`);
        pageData.links.forEach((link, idx) => {
          const status = link.isPlaceholder ? '[PLACEHOLDER]' : link.isBroken ? '[BROKEN]' : '[OK]';
          parts.push(`- Link ${idx + 1}: text="${link.text || '(no text)'}" href="${link.href || '(no href)'}" ${status}`);
        });
      }
    }

    parts.push(`\n=== YOUR TASKS ===`);
    parts.push(`Analyze the entire page and provide comprehensive SEO optimization suggestions ORGANIZED BY COMPONENT:`);
    parts.push(`1. Page-level: Optimize metadata (title ≤60 chars, description ≤165 chars)`);
    parts.push(`2. For EACH component, provide suggestions for:`);
    parts.push(`   - Headings: optimize H1-H3 for SEO and clarity (suggest improvements for existing, compose if missing)`);
    parts.push(`   - Content: suggest paragraph improvements for clarity, SEO, and readability (include field name)`);
    parts.push(`   - Images: suggest descriptive alt text for ALL images (≥5 chars, include field name)`);
    parts.push(`   - Links: fix placeholder links, suggest better anchor text (include field name)`);
    parts.push(`3. Page-level analysis: keyword optimization, structure suggestions, readability score`);
    parts.push(`\n=== KEYWORD STRATEGY ===`);
    if (context.sitePurpose || context.pagePurpose || context.targetAudience) {
      parts.push(`Based on the site/page purpose and target audience provided above:`);
      parts.push(`- Suggest relevant, context-aware keywords that match the business and audience`);
      parts.push(`- Avoid generic or repetitive keywords - focus on specific, meaningful terms`);
      parts.push(`- Consider the target audience's search intent and language`);
      if (context.keywordsRequired && context.keywordsRequired.length > 0) {
        parts.push(`- Integrate required keywords naturally, but also suggest complementary keywords`);
      }
    } else {
      parts.push(`- Suggest relevant keywords based on page content`);
      if (context.keywordsRequired && context.keywordsRequired.length > 0) {
        parts.push(`- Prioritize the required keywords provided`);
      }
    }
    
    parts.push(`\n=== IMPORTANT GUIDELINES ===`);
    parts.push(`- Organize ALL suggestions by component. Include componentId, componentName, and path for each component suggestion.`);
    parts.push(`- Respect the page goal (${context.pageGoal}), tone (${context.tone}), and locale (${context.locale}).`);
    if (context.sitePurpose || context.pagePurpose) {
      parts.push(`- Keep suggestions aligned with: ${context.sitePurpose || ''} ${context.pagePurpose || ''}`);
    }
    if (context.targetAudience) {
      parts.push(`- Tailor language and keywords for: ${context.targetAudience}`);
    }
    parts.push(`- Provide actionable, specific suggestions that improve SEO while maintaining readability.`);
    parts.push(`- Avoid keyword stuffing - use keywords naturally and contextually.`);

    return parts.join('\n');
  }

  /**
   * Get system prompt - Comprehensive page optimization
   */
  private getSystemPrompt(): string {
    return `You are an On-Page SEO assistant for Sitecore XM Cloud. Analyze the entire page and provide comprehensive optimization suggestions.

Your response must be valid JSON with this structure:
{
  "metadata": {
    "title": "optimized title ≤60 chars",
    "description": "optimized description ≤165 chars"
  },
  "components": [
    {
      "componentId": "component-id-1",
      "componentName": "HeroST 1",
      "path": ["Home", "HeroST 1"],
      "headings": {
        "h1": "optimized H1 (if missing or needs improvement)",
        "h2": ["improved H2 1"],
        "improvements": [
          {
            "fieldName": "Title",
            "current": "current heading text",
            "suggested": "improved heading text",
            "reason": "why this improves SEO"
          }
        ]
      },
      "content": {
        "paragraphs": [
          {
            "fieldName": "Description",
            "original": "current paragraph text",
            "suggested": "improved paragraph text",
            "reason": "improvement reason"
          }
        ]
      },
      "images": [
        {
          "id": "image-id",
          "fieldName": "Image1",
          "alt": "descriptive alt text ≥5 chars",
          "currentAlt": "current alt if exists"
        }
      ],
      "links": [
        {
          "fieldName": "Link1",
          "currentText": "current link text",
          "suggestedText": "better anchor text",
          "href": "link-url",
          "reason": "improvement reason"
        }
      ]
    }
  ],
  "keywords": {
    "suggested": ["keyword1", "keyword2"],
    "usage": [
      {
        "keyword": "keyword1",
        "currentCount": 2,
        "suggestedCount": 5,
        "locations": ["title", "H1", "first paragraph"]
      }
    ]
  },
  "structure": {
    "suggestions": ["add FAQ section", "add CTA section"],
    "missing": ["meta keywords", "schema markup"]
  },
  "readability": {
    "score": 75,
    "grade": "B",
    "suggestions": ["suggestion 1", "suggestion 2"]
  }
}

Guidelines:
- Optimize ALL content, not just missing items
- Respect locale, tone, and page goal
- Use context information (site purpose, page purpose, target audience) to generate relevant, non-repetitive keywords
- Avoid keyword stuffing and PII
- Provide specific, actionable suggestions tailored to the business context
- Maintain readability and user experience
- For keywords: Suggest diverse, contextually relevant terms that match the business and audience, not generic repetitive terms
- Return ONLY valid JSON, no markdown or explanations outside JSON`;
  }

  /**
   * Validate and clean suggestions - Comprehensive validation
   */
  private validateAndCleanSuggestions(
    suggestions: SEOSuggestions,
    pageData: PageData
  ): SEOSuggestions {
    const cleaned: SEOSuggestions = {};

    // Validate metadata
    if (suggestions.metadata) {
      cleaned.metadata = {};
      
      if (suggestions.metadata.title) {
        const title = suggestions.metadata.title.trim();
        if (title.length > 0 && title.length <= 60) {
          cleaned.metadata.title = title;
        }
      }

      if (suggestions.metadata.description) {
        const desc = suggestions.metadata.description.trim();
        if (desc.length > 0 && desc.length <= 165) {
          cleaned.metadata.description = desc;
        }
      }
    }

    // Validate component-level suggestions
    if (suggestions.components && suggestions.components.length > 0) {
      cleaned.components = suggestions.components
        .filter((comp) => comp.componentId && comp.componentName)
        .map((comp) => {
          const cleanedComp: ComponentSuggestion = {
            componentId: comp.componentId,
            componentName: comp.componentName,
            path: comp.path || [],
          };

          // Validate metadata
          if (comp.metadata) {
            cleanedComp.metadata = {};
            if (comp.metadata.title && comp.metadata.title.trim().length > 0 && comp.metadata.title.length <= 60) {
              cleanedComp.metadata.title = comp.metadata.title.trim();
            }
            if (comp.metadata.description && comp.metadata.description.trim().length > 0 && comp.metadata.description.length <= 165) {
              cleanedComp.metadata.description = comp.metadata.description.trim();
            }
          }

          // Validate headings
          if (comp.headings) {
            cleanedComp.headings = {};
            if (comp.headings.h1 && comp.headings.h1.trim().length > 0) {
              cleanedComp.headings.h1 = comp.headings.h1.trim();
            }
            if (comp.headings.h2 && comp.headings.h2.length > 0) {
              cleanedComp.headings.h2 = comp.headings.h2.map((h) => h.trim()).filter((h) => h.length > 0);
            }
            if (comp.headings.h3 && comp.headings.h3.length > 0) {
              cleanedComp.headings.h3 = comp.headings.h3.map((h) => h.trim()).filter((h) => h.length > 0);
            }
            if (comp.headings.improvements && comp.headings.improvements.length > 0) {
              cleanedComp.headings.improvements = comp.headings.improvements.filter(
                (imp) => imp.fieldName && imp.current && imp.suggested && imp.reason
              );
            }
          }

          // Validate content
          if (comp.content?.paragraphs && comp.content.paragraphs.length > 0) {
            cleanedComp.content = {
              paragraphs: comp.content.paragraphs.filter(
                (p) => p.fieldName && p.original && p.suggested && p.reason
              ),
            };
          }

          // Validate images
          if (comp.images && comp.images.length > 0) {
            cleanedComp.images = comp.images
              .filter((img) => {
                const originalImg = pageData.images.find((i) => i.id === img.id);
                return originalImg && img.alt && img.alt.trim().length >= 5 && img.fieldName;
              })
              .map((img) => {
                const originalImg = pageData.images.find((i) => i.id === img.id);
                return {
                  id: img.id,
                  fieldName: img.fieldName,
                  alt: img.alt.trim(),
                  currentAlt: img.currentAlt || originalImg?.alt,
                };
              });
          }

          // Validate links
          if (comp.links && comp.links.length > 0) {
            cleanedComp.links = comp.links.filter(
              (link) => link.fieldName && link.href && link.reason
            );
          }

          return cleanedComp;
        })
        .filter((comp) => {
          // Only include components that have at least one suggestion
          return (
            comp.metadata ||
            (comp.headings && (comp.headings.h1 || comp.headings.h2 || comp.headings.h3 || comp.headings.improvements?.length)) ||
            comp.content?.paragraphs?.length ||
            comp.images?.length ||
            comp.links?.length
          );
        });
    }

    // Validate keywords
    if (suggestions.keywords) {
      cleaned.keywords = {};
      
      if (suggestions.keywords.suggested && suggestions.keywords.suggested.length > 0) {
        cleaned.keywords.suggested = suggestions.keywords.suggested
          .map((k) => k.trim())
          .filter((k) => k.length > 0);
      }

      if (suggestions.keywords.usage && suggestions.keywords.usage.length > 0) {
        cleaned.keywords.usage = suggestions.keywords.usage.filter(
          (u) => u.keyword && u.currentCount !== undefined
        );
      }
    }

    // Validate structure
    if (suggestions.structure) {
      cleaned.structure = {};
      
      if (suggestions.structure.suggestions && suggestions.structure.suggestions.length > 0) {
        cleaned.structure.suggestions = suggestions.structure.suggestions.filter(
          (s) => s.trim().length > 0
        );
      }

      if (suggestions.structure.missing && suggestions.structure.missing.length > 0) {
        cleaned.structure.missing = suggestions.structure.missing.filter(
          (m) => m.trim().length > 0
        );
      }
    }

    // Validate readability
    if (suggestions.readability) {
      cleaned.readability = suggestions.readability;
    }

    return cleaned;
  }

  /**
   * Check if service is configured
   */
  isConfigured(): boolean {
    return !!(this.endpoint && this.apiKey && this.deployment);
  }
}

/**
 * Create Azure OpenAI service from environment variables
 */
export function createAzureOpenAIService(): AzureOpenAIService | null {
  const endpoint = process.env.NEXT_PUBLIC_AZURE_OPENAI_ENDPOINT || '';
  const apiKey = process.env.NEXT_PUBLIC_AZURE_OPENAI_API_KEY || '';
  const deployment = process.env.NEXT_PUBLIC_AZURE_OPENAI_DEPLOYMENT || 'gpt-4';

  if (!endpoint || !apiKey) {
    console.warn('⚠️ Azure OpenAI not configured. Set NEXT_PUBLIC_AZURE_OPENAI_ENDPOINT and NEXT_PUBLIC_AZURE_OPENAI_API_KEY');
    return null;
  }

  return new AzureOpenAIService({
    endpoint: endpoint.replace(/\/$/, ''), // Remove trailing slash
    apiKey,
    deployment,
  });
}
