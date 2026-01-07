// SEO Context Form Component

'use client';

import type { PageContext } from '@/src/types/seo';
import { KeywordTagsInput } from './KeywordTagsInput';

export interface SEOContextFormProps {
  context: PageContext;
  onChange: (context: PageContext) => void;
}

export function SEOContextForm({ context, onChange }: SEOContextFormProps) {
  const updateField = <K extends keyof PageContext>(
    field: K,
    value: PageContext[K]
  ) => {
    onChange({ ...context, [field]: value });
  };

  return (
    <div style={styles.card}>
      <h3 style={styles.title}>Configure SEO Context</h3>
      <p style={styles.subtitle}>
        Help us understand your site and page to generate better, context-aware suggestions
      </p>
      
      <div style={styles.form}>
        {/* Site & Page Context */}
        <div style={styles.section}>
          <h4 style={styles.sectionTitle}>About Your Site & Page</h4>
          
          <div style={styles.field}>
            <label style={styles.label}>
              What is this site about? <span style={styles.optional}>(optional)</span>
            </label>
            <textarea
              value={context.sitePurpose || ''}
              onChange={(e) => updateField('sitePurpose', e.target.value || undefined)}
              placeholder="e.g., E-commerce platform selling premium headphones and audio equipment"
              rows={2}
              style={styles.textarea}
            />
            <div style={styles.helpText}>
              Describe your website's main purpose or industry
            </div>
          </div>

          <div style={styles.field}>
            <label style={styles.label}>
              What is this page about? <span style={styles.optional}>(optional)</span>
            </label>
            <textarea
              value={context.pagePurpose || ''}
              onChange={(e) => updateField('pagePurpose', e.target.value || undefined)}
              placeholder="e.g., Product page for MONARCH II headphones showcasing features and benefits"
              rows={2}
              style={styles.textarea}
            />
            <div style={styles.helpText}>
              Describe what this specific page is for
            </div>
          </div>

          <div style={styles.field}>
            <label style={styles.label}>
              Who is your target audience? <span style={styles.optional}>(optional)</span>
            </label>
            <input
              type="text"
              value={context.targetAudience || ''}
              onChange={(e) => updateField('targetAudience', e.target.value || undefined)}
              placeholder="e.g., Audio enthusiasts, professionals, tech-savvy consumers"
              style={styles.input}
            />
            <div style={styles.helpText}>
              Describe your ideal visitors or customers
            </div>
          </div>

          <div style={styles.field}>
            <label style={styles.label}>
              What are your business goals? <span style={styles.optional}>(optional)</span>
            </label>
            <input
              type="text"
              value={context.businessGoals || ''}
              onChange={(e) => updateField('businessGoals', e.target.value || undefined)}
              placeholder="e.g., Increase sales, generate leads, build brand awareness"
              style={styles.input}
            />
            <div style={styles.helpText}>
              What do you want to achieve with this page?
            </div>
          </div>
        </div>

        {/* Content Style */}
        <div style={styles.section}>
          <h4 style={styles.sectionTitle}>Content Style</h4>
          
          <div style={styles.field}>
            <label style={styles.label}>Page Goal</label>
            <select
              value={context.pageGoal}
              onChange={(e) => updateField('pageGoal', e.target.value as PageContext['pageGoal'])}
              style={styles.select}
            >
              <option value="Inform">Inform</option>
              <option value="Convert">Convert</option>
              <option value="Navigate">Navigate</option>
            </select>
            <div style={styles.helpText}>
              What is the primary goal of this page?
            </div>
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Tone</label>
            <select
              value={context.tone}
              onChange={(e) => updateField('tone', e.target.value as PageContext['tone'])}
              style={styles.select}
            >
              <option value="Professional">Professional</option>
              <option value="Friendly">Friendly</option>
              <option value="Technical">Technical</option>
              <option value="Conversational">Conversational</option>
            </select>
            <div style={styles.helpText}>
              What tone should the content have?
            </div>
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Locale</label>
            <input
              type="text"
              value={context.locale}
              onChange={(e) => updateField('locale', e.target.value)}
              placeholder="en-US"
              style={styles.input}
            />
            <div style={styles.helpText}>
              Language and region code (e.g., en-US, en-GB)
            </div>
          </div>
        </div>

        {/* Keywords */}
        <div style={styles.section}>
          <h4 style={styles.sectionTitle}>Required Keywords</h4>
          <div style={styles.field}>
            <label style={styles.label}>
              Keywords to include <span style={styles.optional}>(optional)</span>
            </label>
            <KeywordTagsInput
              keywords={context.keywordsRequired || []}
              onChange={(keywords) => updateField('keywordsRequired', keywords.length > 0 ? keywords : undefined)}
              placeholder="Type keywords and press comma..."
            />
            <div style={styles.helpText}>
              These keywords will be prioritized in AI suggestions. Press comma or Enter to add each keyword.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  card: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    border: '1px solid #e5e7eb',
    padding: '24px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
  },
  title: {
    margin: '0 0 8px 0',
    fontSize: '20px',
    fontWeight: 600,
    color: '#111827',
  },
  subtitle: {
    margin: '0 0 24px 0',
    fontSize: '14px',
    color: '#6b7280',
    lineHeight: '1.5',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '32px',
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    padding: '20px',
    backgroundColor: '#f9fafb',
    borderRadius: '12px',
    border: '1px solid #e5e7eb',
  },
  sectionTitle: {
    margin: 0,
    fontSize: '16px',
    fontWeight: 600,
    color: '#111827',
    paddingBottom: '8px',
    borderBottom: '2px solid #e5e7eb',
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  label: {
    fontSize: '14px',
    fontWeight: 500,
    color: '#374151',
  },
  optional: {
    fontSize: '12px',
    fontWeight: 400,
    color: '#9ca3af',
    fontStyle: 'italic',
  },
  input: {
    padding: '10px 14px',
    border: '1px solid #d1d5db',
    borderRadius: '12px',
    fontSize: '14px',
    fontFamily: 'inherit',
    transition: 'all 0.2s ease',
    backgroundColor: '#ffffff',
  },
  textarea: {
    padding: '10px 14px',
    border: '1px solid #d1d5db',
    borderRadius: '12px',
    fontSize: '14px',
    fontFamily: 'inherit',
    transition: 'all 0.2s ease',
    resize: 'vertical',
    minHeight: '60px',
    backgroundColor: '#ffffff',
  },
  select: {
    padding: '10px 14px',
    border: '1px solid #d1d5db',
    borderRadius: '12px',
    fontSize: '14px',
    fontFamily: 'inherit',
    backgroundColor: '#ffffff',
    transition: 'all 0.2s ease',
  },
  helpText: {
    fontSize: '12px',
    color: '#6b7280',
    marginTop: '4px',
    fontStyle: 'italic',
  },
};
