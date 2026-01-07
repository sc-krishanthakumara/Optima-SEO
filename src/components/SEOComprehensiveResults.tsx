// SEO Comprehensive Results Component - Shows detailed scan analysis

'use client';

import type { ScanResult, BrokenLinkInfo } from '@/src/types/seo';

export interface SEOComprehensiveResultsProps {
  scanResult: ScanResult;
}

export function SEOComprehensiveResults({ scanResult }: SEOComprehensiveResultsProps) {
  const { pageData, issues, brokenLinksDetails } = scanResult;
  const metrics = pageData.metrics;

  return (
    <div style={styles.container}>
      {/* Content Metrics Section */}
      {metrics && (
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>📊 Content Analysis</h3>
          <div style={styles.metricsGrid}>
            <MetricCard
              label="Word Count"
              value={metrics.wordCount.toLocaleString()}
              status={metrics.wordCount >= 250 ? 'good' : 'warning'}
              helpText={metrics.wordCount >= 250 ? 'Good length' : 'Consider adding more content (target: 250+ words)'}
            />
            <MetricCard
              label="Character Count"
              value={metrics.characterCount.toLocaleString()}
              status="info"
            />
            <MetricCard
              label="Paragraphs"
              value={metrics.paragraphCount.toString()}
              status="info"
            />
            <MetricCard
              label="Headings"
              value={metrics.headingCount.toString()}
              status={metrics.headingCount >= 1 ? 'good' : 'warning'}
              helpText={metrics.headingCount >= 1 ? 'Good structure' : 'Add headings for better structure'}
            />
            <MetricCard
              label="Images"
              value={metrics.imageCount.toString()}
              status={metrics.imageCount > 0 ? 'good' : 'warning'}
              helpText={metrics.imageCount > 0 ? 'Images found' : 'Consider adding images'}
            />
            <MetricCard
              label="Links"
              value={metrics.linkCount.toString()}
              status={metrics.linkCount > 0 && metrics.linkCount <= 100 ? 'good' : 'warning'}
              helpText={
                metrics.linkCount === 0
                  ? 'No links found'
                  : metrics.linkCount > 100
                  ? 'Too many links (consider reducing)'
                  : 'Good link count'
              }
            />
          </div>
        </div>
      )}

      {/* Readability Section */}
      {metrics?.readability && (
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>📖 Readability Analysis</h3>
          <div style={styles.readabilityCard}>
            <div style={styles.readabilityScore}>
              <div style={styles.readabilityValue}>
                {metrics.readability.score}
                <span style={styles.readabilityMax}>/100</span>
              </div>
              <div style={styles.readabilityGrade}>
                Grade Level: {metrics.readability.grade}
              </div>
            </div>
            <div style={styles.readabilityDetails}>
              <div style={styles.readabilityDetail}>
                <span style={styles.detailLabel}>Sentences:</span>
                <span style={styles.detailValue}>{metrics.readability.sentences}</span>
              </div>
              <div style={styles.readabilityDetail}>
                <span style={styles.detailLabel}>Words:</span>
                <span style={styles.detailValue}>{metrics.readability.words}</span>
              </div>
              <div style={styles.readabilityDetail}>
                <span style={styles.detailLabel}>Avg. Words/Sentence:</span>
                <span style={styles.detailValue}>{metrics.readability.averageWordsPerSentence}</span>
              </div>
              <div style={styles.readabilityDetail}>
                <span style={styles.detailLabel}>Avg. Syllables/Word:</span>
                <span style={styles.detailValue}>{metrics.readability.averageSyllablesPerWord}</span>
              </div>
            </div>
            {issues.lowReadability && (
              <div style={styles.readabilityWarning}>
                ⚠️ Content readability is below recommended level (score &lt; 60). Consider simplifying language.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Issues Section */}
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>⚠️ Detected Issues</h3>
        <div style={styles.issuesContainer}>
          {/* Metadata Issues */}
          {(issues.missingMetaDescription || issues.titleTooLong || issues.descriptionTooLong) && (
            <IssueGroup title="Metadata Issues">
              {issues.missingMetaDescription && (
                <IssueItem severity="error">Missing meta description</IssueItem>
              )}
              {issues.titleTooLong && (
                <IssueItem severity="warning">
                  Title too long ({pageData.metadata.title?.length || 0} chars, recommended: ≤60)
                </IssueItem>
              )}
              {issues.descriptionTooLong && (
                <IssueItem severity="warning">
                  Description too long ({pageData.metadata.description?.length || 0} chars, recommended: ≤165)
                </IssueItem>
              )}
            </IssueGroup>
          )}

          {/* Content Issues */}
          {(issues.missingH1 || issues.shortContent) && (
            <IssueGroup title="Content Issues">
              {issues.missingH1 && (
                <IssueItem severity="error">Missing H1 heading</IssueItem>
              )}
              {issues.shortContent && (
                <IssueItem severity="warning">
                  Content too short ({pageData.wordCount || 0} words, recommended: ≥250)
                </IssueItem>
              )}
            </IssueGroup>
          )}

          {/* Accessibility Issues */}
          {(issues.weakAltText || issues.missingImages) && (
            <IssueGroup title="Accessibility Issues">
              {issues.weakAltText && issues.weakAltText.length > 0 && (
                <IssueItem severity="warning">
                  {issues.weakAltText.length} image(s) missing or have weak alt text
                </IssueItem>
              )}
              {issues.missingImages && (
                <IssueItem severity="info">No images found on page</IssueItem>
              )}
            </IssueGroup>
          )}

          {/* Link Issues */}
          {(issues.placeholderLinks || issues.brokenLinks || issues.tooManyLinks || issues.noInternalLinks) && (
            <IssueGroup title="Link Issues">
              {issues.placeholderLinks && issues.placeholderLinks.length > 0 && (
                <IssueItem severity="error">
                  {issues.placeholderLinks.length} placeholder link(s) found
                </IssueItem>
              )}
              {issues.brokenLinks && issues.brokenLinks.length > 0 && (
                <IssueItem severity="error">
                  {issues.brokenLinks.length} broken or invalid link(s) detected
                </IssueItem>
              )}
              {issues.tooManyLinks && (
                <IssueItem severity="warning">Too many links (over 100) - may impact SEO</IssueItem>
              )}
              {issues.noInternalLinks && (
                <IssueItem severity="info">No internal links detected - consider adding internal links</IssueItem>
              )}
            </IssueGroup>
          )}

          {/* Broken Links Details */}
          {brokenLinksDetails && brokenLinksDetails.length > 0 && (
            <IssueGroup title="Broken Links Details">
              <div style={styles.brokenLinksList}>
                {brokenLinksDetails.map((link, idx) => (
                  <div key={idx} style={styles.brokenLinkItem}>
                    <div style={styles.brokenLinkHeader}>
                      <span style={styles.brokenLinkUrl}>{link.href}</span>
                      <span style={styles.brokenLinkReason}>{getReasonLabel(link.reason)}</span>
                    </div>
                    {link.text && (
                      <div style={styles.brokenLinkText}>Link text: "{link.text}"</div>
                    )}
                    {link.componentName && (
                      <div style={styles.brokenLinkComponent}>
                        Component: {link.componentName}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </IssueGroup>
          )}

          {/* No Issues */}
          {Object.keys(issues).length === 0 && (
            <div style={styles.noIssues}>
              ✅ No issues detected! Your page looks good.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface MetricCardProps {
  label: string;
  value: string;
  status: 'good' | 'warning' | 'error' | 'info';
  helpText?: string;
}

function MetricCard({ label, value, status, helpText }: MetricCardProps) {
  // Use Sitecore theme colors - gray for warnings/info, red only for critical errors
  const statusColor =
    status === 'good' ? '#8629FF' : status === 'warning' ? '#6b7280' : status === 'error' ? '#FF1F38' : '#6b7280';

  return (
    <div style={styles.metricCard}>
      <div style={styles.metricLabel}>{label}</div>
      <div style={{ ...styles.metricValue, color: statusColor }}>{value}</div>
      {helpText && <div style={styles.metricHelp}>{helpText}</div>}
    </div>
  );
}

interface IssueGroupProps {
  title: string;
  children: React.ReactNode;
}

function IssueGroup({ title, children }: IssueGroupProps) {
  return (
    <div style={styles.issueGroup}>
      <h4 style={styles.issueGroupTitle}>{title}</h4>
      <div style={styles.issueGroupContent}>{children}</div>
    </div>
  );
}

interface IssueItemProps {
  severity: 'error' | 'warning' | 'info';
  children: React.ReactNode;
}

function IssueItem({ severity, children }: IssueItemProps) {
  // Use Sitecore theme colors - gray for warnings, red only for critical errors
  const severityColor =
    severity === 'error' ? '#FF1F38' : severity === 'warning' ? '#6b7280' : '#8629FF';

  return (
    <div style={{ ...styles.issueItem, borderLeftColor: severityColor }}>
      {children}
    </div>
  );
}

function getReasonLabel(reason: BrokenLinkInfo['reason']): string {
  switch (reason) {
    case 'placeholder':
      return 'Placeholder';
    case 'empty':
      return 'Empty URL';
    case 'invalid-url':
      return 'Invalid URL';
    case 'suspected-broken':
      return 'Suspected Broken';
    default:
      return 'Unknown';
  }
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  section: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    border: '1px solid #e5e7eb',
    padding: '20px',
  },
  sectionTitle: {
    margin: '0 0 16px 0',
    fontSize: '18px',
    fontWeight: 600,
    color: '#111827',
  },
  metricsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: '16px',
  },
  metricCard: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    padding: '12px',
    backgroundColor: '#f9fafb',
    borderRadius: '8px',
  },
  metricLabel: {
    fontSize: '12px',
    fontWeight: 500,
    color: '#6b7280',
  },
  metricValue: {
    fontSize: '24px',
    fontWeight: 700,
  },
  metricHelp: {
    fontSize: '11px',
    color: '#6b7280',
    fontStyle: 'italic',
  },
  readabilityCard: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    padding: '16px',
    backgroundColor: '#f9fafb',
    borderRadius: '8px',
  },
  readabilityScore: {
    display: 'flex',
    alignItems: 'center',
    gap: '24px',
  },
  readabilityValue: {
    fontSize: '48px',
    fontWeight: 700,
    color: '#111827',
  },
  readabilityMax: {
    fontSize: '24px',
    color: '#6b7280',
    marginLeft: '4px',
  },
  readabilityGrade: {
    fontSize: '16px',
    fontWeight: 500,
    color: '#374151',
  },
  readabilityDetails: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '12px',
  },
  readabilityDetail: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '8px',
    backgroundColor: '#ffffff',
    borderRadius: '6px',
  },
  detailLabel: {
    fontSize: '13px',
    color: '#6b7280',
  },
  detailValue: {
    fontSize: '13px',
    fontWeight: 600,
    color: '#111827',
  },
  readabilityWarning: {
    padding: '12px',
    backgroundColor: '#f3f4f6',
    color: '#6b7280',
    borderRadius: '8px',
    fontSize: '13px',
  },
  issuesContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  issueGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  issueGroupTitle: {
    margin: 0,
    fontSize: '14px',
    fontWeight: 600,
    color: '#374151',
  },
  issueGroupContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  issueItem: {
    padding: '12px',
    backgroundColor: '#f9fafb',
    borderLeft: '4px solid',
    borderRadius: '6px',
    fontSize: '13px',
    color: '#374151',
  },
  brokenLinksList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  brokenLinkItem: {
    padding: '12px',
    backgroundColor: '#f9fafb',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
  },
  brokenLinkHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
  },
  brokenLinkUrl: {
    fontSize: '13px',
    fontWeight: 600,
    color: '#374151',
    fontFamily: 'monospace',
  },
  brokenLinkReason: {
    padding: '4px 8px',
    backgroundColor: '#f3f4f6',
    color: '#6b7280',
    borderRadius: '12px',
    fontSize: '11px',
    fontWeight: 500,
  },
  brokenLinkText: {
    fontSize: '12px',
    color: '#6b7280',
    marginBottom: '4px',
  },
  brokenLinkComponent: {
    fontSize: '12px',
    color: '#6b7280',
    fontStyle: 'italic',
  },
  noIssues: {
    padding: '20px',
    textAlign: 'center',
    backgroundColor: '#F3E8FF',
    color: '#8629FF',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 500,
  },
};
