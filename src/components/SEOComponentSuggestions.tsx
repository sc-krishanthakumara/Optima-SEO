// Component-based SEO Suggestions Display

'use client';

import { useState } from 'react';
import type { ComponentSuggestion, ApplySelection } from '@/src/types/seo';

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

export interface SEOComponentSuggestionsProps {
  component: ComponentSuggestion;
  selection: ApplySelection;
  onSelectionChange: (selection: ApplySelection) => void;
}

export function SEOComponentSuggestions({
  component,
  selection,
  onSelectionChange,
}: SEOComponentSuggestionsProps) {
  const [expanded, setExpanded] = useState(true);

  const updateSelection = (field: string, value: boolean) => {
    const newSelection = { ...selection };

    // Ensure components object exists
    newSelection.components = newSelection.components || {};
    newSelection.components[component.componentId] = newSelection.components[component.componentId] || {};

    const compSelection = newSelection.components[component.componentId];

    if (field.startsWith('headings.')) {
      const subField = field.split('.')[1];
      compSelection.headings = compSelection.headings || {};
      (compSelection.headings as any)[subField] = value;
    } else if (field.startsWith('images.')) {
      const imageId = field.split('.')[1];
      compSelection.images = compSelection.images || [];
      const existing = compSelection.images.findIndex((img) => img.id === imageId);
      if (value && existing === -1) {
        compSelection.images.push({ id: imageId, alt: true });
      } else if (!value && existing !== -1) {
        compSelection.images.splice(existing, 1);
      }
    }

    onSelectionChange(newSelection);
  };

  const hasSuggestions =
    component.metadata ||
    component.headings ||
    component.content?.paragraphs?.length ||
    component.images?.length ||
    component.links?.length;

  if (!hasSuggestions) {
    return null;
  }

  return (
    <div style={styles.componentCard}>
      <button
        onClick={() => setExpanded(!expanded)}
        style={styles.componentHeader}
        type="button"
      >
        <div style={styles.componentHeaderLeft}>
          <span style={styles.expandIcon}>{expanded ? '▼' : '▶'}</span>
          <div>
            <div style={styles.componentName}>{component.componentName}</div>
            <div style={styles.componentPath}>{component.path.join(' › ')}</div>
          </div>
        </div>
        <div style={styles.suggestionCount}>
          {[
            component.metadata?.title ? 1 : 0,
            component.metadata?.description ? 1 : 0,
            component.headings?.h1 ? 1 : 0,
            component.headings?.improvements?.length || 0,
            component.content?.paragraphs?.length || 0,
            component.images?.length || 0,
            component.links?.length || 0,
          ].reduce((a, b) => a + b, 0)}{' '}
          suggestions
        </div>
      </button>

      {expanded && (
        <div style={styles.componentContent}>
          {/* Metadata */}
          {component.metadata && (
            <Section title="Metadata">
              {component.metadata.title && (
                <DiffItem
                  label="Title"
                  original="(current)"
                  suggested={component.metadata.title}
                  selected={false}
                  onSelect={() => {}}
                  maxLength={60}
                />
              )}
              {component.metadata.description && (
                <DiffItem
                  label="Description"
                  original="(current)"
                  suggested={component.metadata.description}
                  selected={false}
                  onSelect={() => {}}
                  maxLength={165}
                />
              )}
            </Section>
          )}

          {/* Headings */}
          {component.headings && (
            <Section title="Headings">
              {component.headings.h1 && (
                <DiffItem
                  label="H1"
                  original="(missing or needs improvement)"
                  suggested={component.headings.h1}
                  selected={selection.components?.[component.componentId]?.headings?.h1 || false}
                  onSelect={(selected) => updateSelection('headings.h1', selected)}
                />
              )}
              {component.headings.improvements &&
                component.headings.improvements.map((imp, idx) => (
                  <DiffItem
                    key={idx}
                    label={`${imp.fieldName} (H${idx + 2})`}
                    original={imp.current}
                    suggested={imp.suggested}
                    selected={false}
                    onSelect={() => {}}
                    reason={imp.reason}
                  />
                ))}
            </Section>
          )}

          {/* Content */}
          {component.content?.paragraphs && component.content.paragraphs.length > 0 && (
            <Section title={`Content (${component.content.paragraphs.length})`}>
              {component.content.paragraphs.map((para, idx) => (
                <DiffItem
                  key={idx}
                  label={`Field: ${para.fieldName}`}
                  original={para.original.substring(0, 150) + (para.original.length > 150 ? '...' : '')}
                  suggested={para.suggested.substring(0, 150) + (para.suggested.length > 150 ? '...' : '')}
                  selected={false}
                  onSelect={() => {}}
                  reason={para.reason}
                />
              ))}
            </Section>
          )}

          {/* Images */}
          {component.images && component.images.length > 0 && (
            <Section title={`Images (${component.images.length})`}>
              {component.images.map((img) => (
                <DiffItem
                  key={img.id}
                  label={`Field: ${img.fieldName}`}
                  original={img.currentAlt || '(no alt text)'}
                  suggested={img.alt}
                  selected={
                    selection.components?.[component.componentId]?.images?.some(
                      (s) => s.id === img.id && s.alt
                    ) || false
                  }
                  onSelect={(selected) => updateSelection(`images.${img.id}`, selected)}
                  minLength={5}
                />
              ))}
            </Section>
          )}

          {/* Links */}
          {component.links && component.links.length > 0 && (
            <Section title={`Links (${component.links.length})`}>
              {component.links.map((link, idx) => (
                <div key={idx} style={styles.linkItem}>
                  <div style={styles.linkFieldLabel}>Field: {link.fieldName}</div>
                  {link.currentText && link.suggestedText && (
                    <DiffItem
                      label="Anchor Text"
                      original={link.currentText}
                      suggested={link.suggestedText}
                      selected={false}
                      onSelect={() => {}}
                      reason={link.reason}
                    />
                  )}
                  <div style={styles.linkUrl}>URL: {link.href}</div>
                </div>
              ))}
            </Section>
          )}
        </div>
      )}
    </div>
  );
}

interface SectionProps {
  title: string;
  children: React.ReactNode;
}

function Section({ title, children }: SectionProps) {
  return (
    <div style={styles.section}>
      <div style={styles.sectionTitle}>{title}</div>
      <div style={styles.sectionContent}>{children}</div>
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
  const suggestedValid = maxLength ? suggestedLength <= maxLength : true;

  return (
    <div style={styles.diffItem}>
      <div style={styles.diffHeader}>
        <label style={styles.diffLabel}>
          {onSelect && (
            <input
              type="checkbox"
              checked={selected}
              onChange={(e) => onSelect(e.target.checked)}
              style={styles.checkbox}
            />
          )}
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
          <div style={styles.diffText}>{original}</div>
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
      </div>
      {reason && (
        <div style={styles.reason}>
          <strong>Reason:</strong> {reason}
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  componentCard: {
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    marginBottom: '12px',
    overflow: 'hidden',
    backgroundColor: '#ffffff',
  },
  componentHeader: {
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
  componentHeaderLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  expandIcon: {
    fontSize: '12px',
    color: '#6b7280',
    width: '16px',
  },
  componentName: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#111827',
  },
  componentPath: {
    fontSize: '12px',
    color: '#6b7280',
    marginTop: '2px',
  },
  suggestionCount: {
    fontSize: '12px',
    color: '#3b82f6',
    fontWeight: 500,
  },
  componentContent: {
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  sectionTitle: {
    fontSize: '13px',
    fontWeight: 600,
    color: '#374151',
    marginBottom: '4px',
  },
  sectionContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
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
    fontSize: '12px',
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
    fontSize: '12px',
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
    marginTop: '4px',
    padding: '8px',
    backgroundColor: '#f0f9ff',
    borderRadius: '4px',
    fontSize: '11px',
    color: '#1e40af',
    lineHeight: '1.5',
  },
  linkItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    padding: '12px',
    backgroundColor: '#f9fafb',
    borderRadius: '4px',
    border: '1px solid #e5e7eb',
  },
  linkFieldLabel: {
    fontSize: '12px',
    fontWeight: 600,
    color: '#374151',
  },
  linkUrl: {
    fontSize: '11px',
    color: '#6b7280',
    fontFamily: 'monospace',
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
