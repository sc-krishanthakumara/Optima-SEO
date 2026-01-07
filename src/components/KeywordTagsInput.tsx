// Keyword Tags Input Component - Tag-based UI for keywords

'use client';

import { useState, useRef, useEffect, KeyboardEvent } from 'react';

export interface KeywordTagsInputProps {
  keywords: string[];
  onChange: (keywords: string[]) => void;
  placeholder?: string;
}

export function KeywordTagsInput({ keywords, onChange, placeholder = 'Type keywords and press comma...' }: KeywordTagsInputProps) {
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleInputKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    // Add tag on comma or Enter
    if (e.key === ',' || e.key === 'Enter') {
      e.preventDefault();
      addTag(inputValue.trim());
    }
    // Remove last tag on Backspace if input is empty
    else if (e.key === 'Backspace' && inputValue === '' && keywords.length > 0) {
      removeTag(keywords.length - 1);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleInputBlur = () => {
    // Add tag if there's text when input loses focus
    if (inputValue.trim()) {
      addTag(inputValue.trim());
    }
  };

  const addTag = (tag: string) => {
    if (tag && !keywords.includes(tag)) {
      onChange([...keywords, tag]);
      setInputValue('');
    } else if (tag && keywords.includes(tag)) {
      // Tag already exists, just clear input
      setInputValue('');
    }
  };

  const removeTag = (index: number) => {
    const newKeywords = keywords.filter((_, i) => i !== index);
    onChange(newKeywords);
  };

  return (
    <div style={styles.container}>
      <div style={styles.tagsContainer}>
        {keywords.map((keyword, index) => (
          <div key={index} style={styles.tag}>
            <span style={styles.tagText}>{keyword}</span>
            <button
              type="button"
              onClick={() => removeTag(index)}
              style={styles.tagRemove}
              aria-label={`Remove ${keyword}`}
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M9 3L3 9M3 3L9 9"
                  stroke="#6b7280"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        ))}
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleInputKeyDown}
          onBlur={handleInputBlur}
          placeholder={keywords.length === 0 ? placeholder : ''}
          style={styles.input}
        />
      </div>
      <div style={styles.helpText}>
        Type keywords and press <strong>comma</strong> or <strong>Enter</strong> to add them as tags
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  tagsContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
    padding: '8px',
    minHeight: '44px',
    border: '1px solid #d1d5db',
    borderRadius: '12px',
    backgroundColor: '#ffffff',
    alignItems: 'center',
    transition: 'all 0.2s ease',
  },
  tag: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 10px',
    backgroundColor: '#F3E8FF',
    color: '#8629FF',
    borderRadius: '16px',
    fontSize: '13px',
    fontWeight: 500,
    border: '1px solid #E9D5FF',
  },
  tagText: {
    lineHeight: 1,
  },
  tagRemove: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '2px',
    backgroundColor: 'transparent',
    border: 'none',
    cursor: 'pointer',
    borderRadius: '4px',
    transition: 'all 0.2s ease',
    lineHeight: 1,
  },
  input: {
    flex: 1,
    minWidth: '120px',
    border: 'none',
    outline: 'none',
    fontSize: '14px',
    fontFamily: 'inherit',
    padding: '4px 0',
    backgroundColor: 'transparent',
  },
  helpText: {
    fontSize: '12px',
    color: '#6b7280',
    fontStyle: 'italic',
  },
};

// Add hover effect for remove button
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = `
    button[style*="tagRemove"]:hover {
      background-color: #E9D5FF !important;
    }
    button[style*="tagRemove"]:hover svg path {
      stroke: #8629FF !important;
    }
    div[style*="tagsContainer"]:focus-within {
      border-color: #8629FF !important;
      box-shadow: 0 0 0 3px rgba(134, 41, 255, 0.1) !important;
    }
  `;
  document.head.appendChild(styleSheet);
}
