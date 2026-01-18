// Competitor Scanner Component - UI for scanning competitor websites

'use client';

import { useState, useCallback } from 'react';
import type { CompetitorData, CompetitorAnalysis } from '@/src/types/seo';
import { analyzeCompetitorWebsite } from '@/src/services/competitorAnalyzer';

export interface CompetitorScannerProps {
  onCompetitorScanned: (analysis: CompetitorAnalysis) => void;
  onError?: (error: string) => void;
}

export function CompetitorScanner({ onCompetitorScanned, onError }: CompetitorScannerProps) {
  const [url, setUrl] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [scannedCompetitors, setScannedCompetitors] = useState<CompetitorAnalysis[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleScan = useCallback(async () => {
    if (!url.trim()) {
      setError('Please enter a valid URL');
      return;
    }

    // Validate URL format
    try {
      new URL(url);
    } catch {
      setError('Invalid URL format. Please include http:// or https://');
      return;
    }

    setIsScanning(true);
    setError(null);

    try {
      // Fetch competitor website via API
      const response = await fetch('/api/competitor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to fetch website: ${response.status}`);
      }

      const data = await response.json();

      // Analyze the competitor website
      const competitorData = analyzeCompetitorWebsite(data.html, url);

      // Generate insights
      const analysis: CompetitorAnalysis = {
        competitor: competitorData,
        insights: generateInsights(competitorData),
      };

      setScannedCompetitors((prev) => [...prev, analysis]);
      onCompetitorScanned(analysis);
      setUrl(''); // Clear input after successful scan
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to scan competitor website';
      setError(errorMessage);
      if (onError) {
        onError(errorMessage);
      }
    } finally {
      setIsScanning(false);
    }
  }, [url, onCompetitorScanned, onError]);

  const handleRemove = useCallback((index: number) => {
    setScannedCompetitors((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleKeyPress = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !isScanning) {
      handleScan();
    }
  }, [handleScan, isScanning]);

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h3 style={styles.title}>🔍 Competitor Analysis</h3>
        <p style={styles.subtitle}>
          Scan competitor websites to get content and SEO insights
        </p>
      </div>

      {/* URL Input */}
      <div style={styles.inputSection}>
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="https://example.com"
          disabled={isScanning}
          style={{
            ...styles.input,
            ...(isScanning ? styles.inputDisabled : {}),
          }}
        />
        <button
          onClick={handleScan}
          disabled={isScanning || !url.trim()}
          style={{
            ...styles.button,
            ...styles.buttonPrimary,
            ...((isScanning || !url.trim()) ? styles.buttonDisabled : {}),
          }}
        >
          {isScanning ? (
            <>
              <span style={styles.spinner}>⏳</span>
              Scanning...
            </>
          ) : (
            'Scan Competitor'
          )}
        </button>
        {error && (
          <div style={styles.error}>
            ⚠️ {error}
          </div>
        )}
      </div>

      {/* Scanned Competitors List */}
      {scannedCompetitors.length > 0 && (
        <div style={styles.competitorsList}>
          <h4 style={styles.listTitle}>Scanned Competitors ({scannedCompetitors.length})</h4>
          {scannedCompetitors.map((analysis, index) => (
            <CompetitorCard
              key={index}
              analysis={analysis}
              onRemove={() => handleRemove(index)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface CompetitorCardProps {
  analysis: CompetitorAnalysis;
  onRemove: () => void;
}

function CompetitorCard({ analysis, onRemove }: CompetitorCardProps) {
  const { competitor, insights } = analysis;

  return (
    <div style={styles.card}>
      <div style={styles.cardHeader}>
        <div style={styles.cardTitle}>
          <span style={styles.cardIcon}>🌐</span>
          <a
            href={competitor.url}
            target="_blank"
            rel="noopener noreferrer"
            style={styles.cardLink}
          >
            {competitor.url}
          </a>
        </div>
        <button onClick={onRemove} style={styles.removeButton}>
          ✕
        </button>
      </div>

      <div style={styles.cardContent}>
        {/* Metadata Summary */}
        <div style={styles.summary}>
          <div style={styles.summaryItem}>
            <strong>Title:</strong> {competitor.metadata.title || 'N/A'}
            {competitor.metadata.title && (
              <span style={styles.metaInfo}>
                ({competitor.metadata.title.length} chars)
              </span>
            )}
          </div>
          <div style={styles.summaryItem}>
            <strong>Description:</strong> {competitor.metadata.description || 'N/A'}
            {competitor.metadata.description && (
              <span style={styles.metaInfo}>
                ({competitor.metadata.description.length} chars)
              </span>
            )}
          </div>
          <div style={styles.summaryItem}>
            <strong>Word Count:</strong> {competitor.wordCount.toLocaleString()} words
          </div>
          <div style={styles.summaryItem}>
            <strong>Headings:</strong> {competitor.headings.all.length} total
            {competitor.headings.h1 && ` (H1: "${competitor.headings.h1}")`}
          </div>
        </div>

        {/* Insights */}
        {insights.strengths.length > 0 && (
          <div style={styles.insightSection}>
            <div style={styles.insightTitle}>✅ Strengths</div>
            <ul style={styles.insightList}>
              {insights.strengths.map((strength, i) => (
                <li key={i} style={styles.insightItem}>{strength}</li>
              ))}
            </ul>
          </div>
        )}

        {insights.opportunities.length > 0 && (
          <div style={styles.insightSection}>
            <div style={styles.insightTitle}>💡 Opportunities</div>
            <ul style={styles.insightList}>
              {insights.opportunities.map((opp, i) => (
                <li key={i} style={styles.insightItem}>{opp}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Generate insights from competitor data
 */
function generateInsights(competitor: CompetitorData): CompetitorAnalysis['insights'] {
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  const opportunities: string[] = [];
  const recommendations: string[] = [];

  // Analyze metadata
  if (competitor.metadata.title) {
    if (competitor.metadata.title.length <= 60) {
      strengths.push(`Title is optimized (${competitor.metadata.title.length} chars)`);
    } else {
      weaknesses.push(`Title is too long (${competitor.metadata.title.length} chars, should be ≤60)`);
    }
  } else {
    weaknesses.push('Missing page title');
  }

  if (competitor.metadata.description) {
    if (competitor.metadata.description.length <= 165) {
      strengths.push(`Meta description is optimized (${competitor.metadata.description.length} chars)`);
    } else {
      weaknesses.push(`Meta description is too long (${competitor.metadata.description.length} chars, should be ≤165)`);
    }
  } else {
    weaknesses.push('Missing meta description');
  }

  // Analyze content
  if (competitor.wordCount >= 500) {
    strengths.push(`Good content length (${competitor.wordCount} words)`);
  } else if (competitor.wordCount < 250) {
    weaknesses.push(`Content is too short (${competitor.wordCount} words, aim for 250+)`);
  }

  if (competitor.headings.h1) {
    strengths.push('Has H1 heading');
  } else {
    weaknesses.push('Missing H1 heading');
  }

  if (competitor.headings.h2 && competitor.headings.h2.length >= 3) {
    strengths.push(`Good heading structure (${competitor.headings.h2.length} H2 headings)`);
  }

  // Analyze images
  const imagesWithAlt = competitor.images.filter(img => img.alt && img.alt.length >= 5);
  const altCoverage = competitor.images.length > 0
    ? (imagesWithAlt.length / competitor.images.length) * 100
    : 0;

  if (altCoverage >= 80) {
    strengths.push(`Good image alt text coverage (${Math.round(altCoverage)}%)`);
  } else if (competitor.images.length > 0) {
    weaknesses.push(`Low image alt text coverage (${Math.round(altCoverage)}%)`);
  }

  // Analyze structured data
  if (competitor.structuredData && competitor.structuredData.length > 0) {
    strengths.push(`Uses structured data (${competitor.structuredData.length} schema(s))`);
  } else {
    opportunities.push('Consider adding structured data (JSON-LD)');
  }

  // Analyze Open Graph
  if (competitor.openGraph && Object.keys(competitor.openGraph).length > 0) {
    strengths.push('Uses Open Graph tags for social sharing');
  } else {
    opportunities.push('Consider adding Open Graph tags');
  }

  // Generate recommendations
  if (competitor.metaKeywords && competitor.metaKeywords.length > 0) {
    recommendations.push(`Keywords used: ${competitor.metaKeywords.slice(0, 5).join(', ')}`);
  }

  if (competitor.headings.h1) {
    recommendations.push(`H1 strategy: "${competitor.headings.h1}"`);
  }

  return {
    strengths,
    weaknesses,
    opportunities,
    recommendations,
  };
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    padding: '20px',
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    border: '1px solid #e5e7eb',
    width: '100%',
    maxWidth: '100%',
    boxSizing: 'border-box',
    overflow: 'hidden',
  },
  header: {
    marginBottom: '8px',
  },
  title: {
    margin: '0 0 8px 0',
    fontSize: '18px',
    fontWeight: 600,
    color: '#111827',
  },
  subtitle: {
    margin: 0,
    fontSize: '14px',
    color: '#6b7280',
  },
  inputSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    width: '100%',
  },
  input: {
    width: '100%',
    padding: '12px 16px',
    borderRadius: '8px',
    border: '1px solid #d1d5db',
    fontSize: '14px',
    fontFamily: 'inherit',
    outline: 'none',
    transition: 'border-color 0.2s',
    boxSizing: 'border-box',
  },
  inputDisabled: {
    backgroundColor: '#f3f4f6',
    cursor: 'not-allowed',
  },
  button: {
    padding: '12px 24px',
    borderRadius: '8px',
    border: 'none',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    width: '100%',
    whiteSpace: 'nowrap',
  },
  buttonPrimary: {
    backgroundColor: '#8629FF',
    color: '#ffffff',
  },
  buttonDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
  spinner: {
    display: 'inline-block',
    animation: 'spin 1s linear infinite',
  },
  error: {
    padding: '12px',
    backgroundColor: '#fef2f2',
    border: '1px solid #fecaca',
    borderRadius: '8px',
    color: '#dc2626',
    fontSize: '14px',
  },
  competitorsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  listTitle: {
    margin: 0,
    fontSize: '16px',
    fontWeight: 600,
    color: '#111827',
  },
  card: {
    padding: '16px',
    backgroundColor: '#f9fafb',
    borderRadius: '8px',
    border: '1px solid #e5e7eb',
    width: '100%',
    maxWidth: '100%',
    boxSizing: 'border-box',
    overflow: 'hidden',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
    gap: '12px',
    width: '100%',
  },
  cardTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flex: 1,
    minWidth: 0,
  },
  cardIcon: {
    fontSize: '18px',
  },
  cardLink: {
    color: '#8629FF',
    textDecoration: 'none',
    fontSize: '14px',
    fontWeight: 500,
    wordBreak: 'break-all',
    overflowWrap: 'break-word',
    maxWidth: '100%',
  },
  removeButton: {
    padding: '4px 8px',
    backgroundColor: 'transparent',
    border: 'none',
    color: '#6b7280',
    cursor: 'pointer',
    fontSize: '18px',
    borderRadius: '4px',
    transition: 'all 0.2s',
  },
  cardContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  summary: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    fontSize: '14px',
    color: '#374151',
    width: '100%',
    wordWrap: 'break-word',
    overflowWrap: 'break-word',
  },
  summaryItem: {
    lineHeight: '1.5',
    wordWrap: 'break-word',
    overflowWrap: 'break-word',
  },
  metaInfo: {
    color: '#6b7280',
    fontSize: '12px',
    marginLeft: '8px',
  },
  insightSection: {
    marginTop: '8px',
  },
  insightTitle: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#111827',
    marginBottom: '8px',
  },
  insightList: {
    margin: 0,
    paddingLeft: '20px',
    fontSize: '13px',
    color: '#374151',
  },
  insightItem: {
    marginBottom: '4px',
    lineHeight: '1.5',
  },
};

// Add CSS animations
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = `
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(styleSheet);
}
