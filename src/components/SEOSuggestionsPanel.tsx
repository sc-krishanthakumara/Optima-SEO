// SEO Suggestions Panel with Diff Preview

'use client';

import { useState } from 'react';
import type { SEOSuggestions, PageData, ApplySelection } from '@/src/types/seo';
import { SEOComponentSuggestions } from './SEOComponentSuggestions';

// Copy button component with fallback for clipboard permissions
function CopyButton({ text, label }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      // Try modern Clipboard API first
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        return;
      }
    } catch (err) {
      console.warn('Clipboard API failed, trying fallback:', err);
    }

    // Fallback: Use textarea method (works even with permissions restrictions)
    try {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.left = '-999999px';
      textarea.style.top = '-999999px';
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      
      const successful = document.execCommand('copy');
      document.body.removeChild(textarea);
      
      if (successful) {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } else {
        throw new Error('execCommand copy failed');
      }
    } catch (err) {
      console.error('Failed to copy text:', err);
      // Show user-friendly error
      alert(`Failed to copy text. Please select and copy manually:\n\n${text.substring(0, 100)}${text.length > 100 ? '...' : ''}`);
    }
  };

  return (
    <button
      onClick={handleCopy}
      style={styles.copyButton}
      type="button"
      title={`Copy ${label || 'text'}`}
      aria-label={`Copy ${label || 'text'}`}
    >
      {copied ? (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M11.6667 3.5L5.25 9.91667L2.33334 7" stroke="#8629FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ) : (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="4.66667" y="4.66667" width="7" height="7" rx="1" stroke="#6b7280" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M9.33333 2.33333H4.66667C3.93029 2.33333 3.33333 2.93029 3.33333 3.66667V8.33333" stroke="#6b7280" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )}
    </button>
  );
}

export interface SEOSuggestionsPanelProps {
  suggestions: SEOSuggestions;
  originalData: PageData;
  selection: ApplySelection;
  onSelectionChange: (selection: ApplySelection) => void;
}

export function SEOSuggestionsPanel({
  suggestions,
  originalData,
  selection,
  onSelectionChange,
}: SEOSuggestionsPanelProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['metadata', 'components', 'keywords', 'structure', 'readability'])
  );

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
      return next;
    });
  };

  const updateSelection = (field: string, value: boolean) => {
    const newSelection = { ...selection };

    if (field.startsWith('metadata.')) {
      const subField = field.split('.')[1];
      newSelection.metadata = newSelection.metadata || {};
      (newSelection.metadata as any)[subField] = value;
    } else if (field.startsWith('headings.')) {
      const subField = field.split('.')[1];
      newSelection.headings = newSelection.headings || {};
      (newSelection.headings as any)[subField] = value;
    } else if (field.startsWith('images.')) {
      const imageId = field.split('.')[1];
      newSelection.images = newSelection.images || [];
      const existing = newSelection.images.findIndex((img) => img.id === imageId);
      if (value && existing === -1) {
        newSelection.images.push({ id: imageId, alt: true });
      } else if (!value && existing !== -1) {
        newSelection.images.splice(existing, 1);
      }
    }

    onSelectionChange(newSelection);
  };

  return (
    <div style={styles.panel}>
      <h3 style={styles.title}>AI Suggestions</h3>
      <p style={styles.subtitle}>Review and select suggestions to apply</p>

      {/* Page-level Metadata */}
      {suggestions.metadata && (
        <Section
          title="Metadata"
          expanded={expandedSections.has('metadata')}
          onToggle={() => toggleSection('metadata')}
        >
          {suggestions.metadata.title && (
            <DiffItem
              label="Title"
              original={originalData.metadata.title || '(missing)'}
              suggested={suggestions.metadata.title}
              selected={selection.metadata?.title || false}
              onSelect={(selected) => updateSelection('metadata.title', selected)}
              maxLength={60}
            />
          )}
          {suggestions.metadata.description && (
            <DiffItem
              label="Meta Description"
              original={originalData.metadata.description || '(missing)'}
              suggested={suggestions.metadata.description}
              selected={selection.metadata?.description || false}
              onSelect={(selected) => updateSelection('metadata.description', selected)}
              maxLength={165}
            />
          )}
        </Section>
      )}



      {/* Component-based Suggestions */}
      {suggestions.components && suggestions.components.length > 0 && (
        <Section
          title={`Component Suggestions (${suggestions.components.length})`}
          expanded={expandedSections.has('components')}
          onToggle={() => toggleSection('components')}
        >
          <div style={styles.componentsList}>
            {suggestions.components.map((component) => (
              <SEOComponentSuggestions
                key={component.componentId}
                component={component}
                selection={selection}
                onSelectionChange={onSelectionChange}
              />
            ))}
          </div>
        </Section>
      )}

      {/* Keywords Suggestions */}
      {suggestions.keywords && (
        <Section
          title="Keyword Optimization"
          expanded={expandedSections.has('keywords')}
          onToggle={() => toggleSection('keywords')}
        >
          {suggestions.keywords.suggested && suggestions.keywords.suggested.length > 0 && (
            <div style={styles.keywordsSection}>
              <div style={styles.keywordsLabel}>Suggested Keywords:</div>
              <div style={styles.keywordsList}>
                {suggestions.keywords.suggested.map((kw, idx) => (
                  <span key={idx} style={styles.keywordTag}>
                    {kw}
                  </span>
                ))}
              </div>
            </div>
          )}
          {suggestions.keywords.usage && suggestions.keywords.usage.length > 0 && (
            <div style={styles.keywordsUsage}>
              <div style={styles.keywordsLabel}>Keyword Usage Recommendations:</div>
              {suggestions.keywords.usage.map((usage, idx) => (
                <div key={idx} style={styles.usageItem}>
                  <strong>{usage.keyword}</strong>: Currently used {usage.currentCount}x, 
                  suggest {usage.suggestedCount}x. 
                  {usage.locations && usage.locations.length > 0 && (
                    <span> Add to: {usage.locations.join(', ')}</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </Section>
      )}

      {/* Structure Suggestions */}
      {suggestions.structure && (
        <Section
          title="Structure & Missing Elements"
          expanded={expandedSections.has('structure')}
          onToggle={() => toggleSection('structure')}
        >
          {suggestions.structure.suggestions && suggestions.structure.suggestions.length > 0 && (
            <div style={styles.structureSection}>
              <div style={styles.structureLabel}>Suggestions:</div>
              <ul style={styles.structureList}>
                {suggestions.structure.suggestions.map((suggestion, idx) => (
                  <li key={idx}>{suggestion}</li>
                ))}
              </ul>
            </div>
          )}
          {suggestions.structure.missing && suggestions.structure.missing.length > 0 && (
            <div style={styles.structureSection}>
              <div style={styles.structureLabel}>Missing Elements:</div>
              <ul style={styles.structureList}>
                {suggestions.structure.missing.map((missing, idx) => (
                  <li key={idx} style={styles.missingItem}>{missing}</li>
                ))}
              </ul>
            </div>
          )}
        </Section>
      )}

      {/* Readability */}
      {suggestions.readability && (
        <Section
          title="Readability Analysis"
          expanded={expandedSections.has('readability')}
          onToggle={() => toggleSection('readability')}
        >
          <div style={styles.readabilitySection}>
            {suggestions.readability.score && (
              <div style={styles.readabilityScore}>
                Score: {suggestions.readability.score}/100
                {suggestions.readability.grade && (
                  <span style={styles.readabilityGrade}> ({suggestions.readability.grade})</span>
                )}
              </div>
            )}
            {suggestions.readability.suggestions && suggestions.readability.suggestions.length > 0 && (
              <ul style={styles.readabilitySuggestions}>
                {suggestions.readability.suggestions.map((suggestion, idx) => (
                  <li key={idx}>{suggestion}</li>
                ))}
              </ul>
            )}
          </div>
        </Section>
      )}
    </div>
  );
}

interface SectionProps {
  title: string;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

function Section({ title, expanded, onToggle, children }: SectionProps) {
  return (
    <div style={styles.section}>
      <button onClick={onToggle} style={styles.sectionHeader} type="button">
        <span style={styles.sectionTitle}>{title}</span>
        <span style={styles.expandIcon}>{expanded ? '▼' : '▶'}</span>
      </button>
      {expanded && <div style={styles.sectionContent}>{children}</div>}
    </div>
  );
}

interface DiffItemProps {
  label: string;
  original: string;
  suggested: string;
  selected: boolean;
  onSelect: (selected: boolean) => void;
  maxLength?: number;
  minLength?: number;
  reason?: string;
}

function DiffItem({
  label,
  original,
  suggested,
  selected,
  onSelect,
  maxLength,
  minLength,
  reason,
}: DiffItemProps) {
  const originalLength = original.length;
  const suggestedLength = suggested.length;
  const originalValid = maxLength ? originalLength <= maxLength : true;
  const suggestedValid = maxLength ? suggestedLength <= maxLength : true;

  return (
    <div style={styles.diffItem}>
      <div style={styles.diffHeader}>
        <label style={styles.diffLabel}>
          <input
            type="checkbox"
            checked={selected}
            onChange={(e) => onSelect(e.target.checked)}
            style={styles.checkbox}
          />
          {label}
        </label>
        {maxLength && (
          <span
            style={{
              ...styles.lengthBadge,
              ...(suggestedValid ? {} : styles.lengthBadgeError),
            }}
          >
            {suggestedLength}/{maxLength}
          </span>
        )}
      </div>
      <div style={styles.diffContent}>
        <div style={styles.diffSide}>
          <div style={styles.diffSideHeader}>
            <div style={styles.diffSideLabel}>Original</div>
            <CopyButton text={original} label="original text" />
          </div>
          <div
            style={{
              ...styles.diffText,
              ...(originalValid ? {} : styles.diffTextError),
            }}
          >
            {original}
          </div>
        </div>
        <div style={styles.diffSide}>
          <div style={styles.diffSideHeader}>
            <div style={styles.diffSideLabel}>Suggested</div>
            <CopyButton text={suggested} label="suggested text" />
          </div>
          <div
            style={{
              ...styles.diffText,
              ...styles.diffTextSuggested,
              ...(suggestedValid ? {} : styles.diffTextError),
            }}
          >
            {suggested}
          </div>
        </div>
        {reason && (
          <div style={styles.reason}>
            <strong>Reason:</strong> {reason}
          </div>
        )}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  panel: {
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    border: '1px solid #e5e7eb',
    padding: '16px',
  },
  title: {
    margin: '0 0 8px 0',
    fontSize: '18px',
    fontWeight: 600,
    color: '#111827',
  },
  subtitle: {
    margin: '0 0 16px 0',
    fontSize: '13px',
    color: '#6b7280',
  },
  section: {
    marginBottom: '16px',
    border: '1px solid #e5e7eb',
    borderRadius: '6px',
    overflow: 'hidden',
  },
  sectionHeader: {
    width: '100%',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 16px',
    backgroundColor: '#f9fafb',
    border: 'none',
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  sectionTitle: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#111827',
  },
  expandIcon: {
    fontSize: '12px',
    color: '#6b7280',
  },
  sectionContent: {
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  diffItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  diffHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  diffLabel: {
    fontSize: '13px',
    fontWeight: 500,
    color: '#374151',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  checkbox: {
    width: '16px',
    height: '16px',
  },
  lengthBadge: {
    padding: '2px 8px',
    backgroundColor: '#F3E8FF',
    color: '#8629FF',
    borderRadius: '12px',
    fontSize: '11px',
    fontWeight: 500,
  },
  lengthBadgeError: {
    backgroundColor: '#f3f4f6',
    color: '#6b7280',
  },
  diffContent: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px',
  },
  diffSide: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  diffSideHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  diffSideLabel: {
    fontSize: '11px',
    fontWeight: 600,
    color: '#6b7280',
    textTransform: 'uppercase',
  },
  copyButton: {
    padding: '6px',
    backgroundColor: 'transparent',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '24px',
    height: '24px',
    color: '#6b7280',
  },
  diffText: {
    padding: '10px',
    backgroundColor: '#f9fafb',
    borderRadius: '4px',
    fontSize: '13px',
    lineHeight: '1.5',
    color: '#374151',
    border: '1px solid #e5e7eb',
    position: 'relative',
    wordBreak: 'break-word',
  },
  diffTextSuggested: {
    backgroundColor: '#eff6ff',
    borderColor: '#3b82f6',
  },
  diffTextError: {
    borderColor: '#ef4444',
    backgroundColor: '#fef2f2',
  },
  reason: {
    marginTop: '8px',
    padding: '8px',
    backgroundColor: '#f0f9ff',
    borderRadius: '4px',
    fontSize: '12px',
    color: '#1e40af',
    lineHeight: '1.5',
  },
  linkImprovement: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    padding: '12px',
    backgroundColor: '#f9fafb',
    borderRadius: '4px',
    border: '1px solid #e5e7eb',
  },
  linkHeader: {
    display: 'flex',
    alignItems: 'center',
  },
  linkLabel: {
    fontSize: '12px',
    fontWeight: 600,
    color: '#374151',
  },
  keywordsSection: {
    marginBottom: '16px',
  },
  keywordsLabel: {
    fontSize: '13px',
    fontWeight: 600,
    color: '#374151',
    marginBottom: '8px',
  },
  keywordsList: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '6px',
  },
  keywordTag: {
    padding: '4px 10px',
    backgroundColor: '#dbeafe',
    color: '#1e40af',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: 500,
  },
  keywordsUsage: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  usageItem: {
    padding: '8px',
    backgroundColor: '#f9fafb',
    borderRadius: '4px',
    fontSize: '12px',
    color: '#374151',
    lineHeight: '1.6',
  },
  structureSection: {
    marginBottom: '16px',
  },
  structureLabel: {
    fontSize: '13px',
    fontWeight: 600,
    color: '#374151',
    marginBottom: '8px',
  },
  structureList: {
    margin: 0,
    paddingLeft: '20px',
    fontSize: '13px',
    color: '#6b7280',
    lineHeight: '1.8',
  },
  missingItem: {
    color: '#dc2626',
  },
  readabilitySection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  readabilityScore: {
    fontSize: '16px',
    fontWeight: 600,
    color: '#111827',
  },
  readabilityGrade: {
    color: '#3b82f6',
  },
  readabilitySuggestions: {
    margin: 0,
    paddingLeft: '20px',
    fontSize: '13px',
    color: '#6b7280',
    lineHeight: '1.8',
  },
  componentsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
};

// Add hover effect for copy button
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = `
    button[style*="copyButton"]:hover {
      background-color: #f3f4f6 !important;
      color: #374151 !important;
    }
    button[style*="copyButton"]:active {
      background-color: #e5e7eb !important;
      transform: scale(0.95);
    }
    button[style*="copyButton"] svg {
      transition: all 0.2s ease;
    }
    button[style*="copyButton"]:hover svg {
      stroke: #374151 !important;
    }
  `;
  document.head.appendChild(styleSheet);
}
