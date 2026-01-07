// SEO Apply Panel Component

'use client';

import type { ApplySelection } from '@/src/types/seo';

export interface SEOApplyPanelProps {
  selection: ApplySelection;
  onApply: () => void;
}

export function SEOApplyPanel({ selection, onApply }: SEOApplyPanelProps) {
  const countSelected = () => {
    let count = 0;
    
    // Page-level selections
    if (selection.metadata?.title) count++;
    if (selection.metadata?.description) count++;
    if (selection.headings?.h1) count++;
    if (selection.images) {
      count += selection.images.filter((img) => img.alt).length;
    }
    
    // Component-level selections
    if (selection.components) {
      for (const compSelection of Object.values(selection.components)) {
        if (compSelection.headings?.h1) count++;
        if (compSelection.headings?.improvements) {
          count += compSelection.headings.improvements.length;
        }
        if (compSelection.images) {
          count += compSelection.images.filter((img) => img.alt).length;
        }
        if (compSelection.links) {
          count += compSelection.links.filter((link) => link.apply).length;
        }
      }
    }
    
    return count;
  };

  const selectedCount = countSelected();

  if (selectedCount === 0) {
    return (
      <div style={styles.panel}>
        <p style={styles.message}>Select suggestions above to apply changes</p>
      </div>
    );
  }

  return (
    <div style={styles.panel}>
      <div style={styles.summary}>
        <h3 style={styles.title}>Ready to Apply</h3>
        <p style={styles.count}>
          {selectedCount} {selectedCount === 1 ? 'change' : 'changes'} selected
        </p>
        <ul style={styles.list}>
          {selection.metadata?.title && <li>Update page title</li>}
          {selection.metadata?.description && <li>Update meta description</li>}
          {selection.headings?.h1 && <li>Add/update H1 heading</li>}
          {selection.images &&
            selection.images
              .filter((img) => img.alt)
              .map((img) => <li key={img.id}>Update alt text for image {img.id}</li>)}
          {selection.components &&
            Object.entries(selection.components).flatMap(([componentId, compSelection]) => {
              const items: React.ReactNode[] = [];
              if (compSelection.headings?.h1) {
                items.push(<li key={`${componentId}-h1`}>Update H1 in {componentId}</li>);
              }
              if (compSelection.images && compSelection.images.length > 0) {
                compSelection.images
                  .filter((img) => img.alt)
                  .forEach((img) => {
                    items.push(
                      <li key={`${componentId}-${img.id}`}>
                        Update alt text in {componentId} (image {img.id})
                      </li>
                    );
                  });
              }
              return items;
            })}
        </ul>
      </div>
      <button onClick={onApply} style={styles.applyButton} type="button">
        ✅ Apply {selectedCount} {selectedCount === 1 ? 'Change' : 'Changes'}
      </button>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  panel: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    border: '1px solid #e5e7eb',
    padding: '24px',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
  },
  message: {
    margin: 0,
    fontSize: '14px',
    color: '#6b7280',
    textAlign: 'center',
    padding: '20px',
  },
  summary: {
    marginBottom: '20px',
  },
  title: {
    margin: '0 0 12px 0',
    fontSize: '18px',
    fontWeight: 600,
    color: '#111827',
  },
  count: {
    margin: '0 0 16px 0',
    fontSize: '15px',
    color: '#374151',
    fontWeight: 600,
  },
  list: {
    margin: 0,
    paddingLeft: '24px',
    fontSize: '14px',
    color: '#6b7280',
    lineHeight: '2',
  },
  applyButton: {
    width: '100%',
    padding: '14px 24px',
    backgroundColor: '#8629FF',
    color: '#ffffff',
    border: 'none',
    borderRadius: '24px',
    fontSize: '15px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
  },
};

// Add hover effect for apply button
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = `
    button[style*="applyButton"]:not(:disabled):hover {
      background-color: #6B1FD6 !important;
      transform: translateY(-2px);
      box-shadow: 0 4px 8px rgba(134, 41, 255, 0.3) !important;
    }
  `;
  document.head.appendChild(styleSheet);
}
