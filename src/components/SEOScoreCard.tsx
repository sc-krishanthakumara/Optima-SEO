// SEO Score Card Component

'use client';

import type { ScoreBreakdown, SEOIssues } from '@/src/types/seo';
import { getSEOGrade, getScoreColor } from '@/src/utils/seoScorer';

export interface SEOScoreCardProps {
  score: number;
  breakdown: ScoreBreakdown;
  issues: SEOIssues;
}

export function SEOScoreCard({ score, breakdown, issues }: SEOScoreCardProps) {
  const grade = getSEOGrade(score);
  const color = getScoreColor(score);

  const issueCount = Object.values(issues).reduce((count, issue) => {
    if (typeof issue === 'boolean') return count + (issue ? 1 : 0);
    if (Array.isArray(issue)) return count + issue.length;
    return count;
  }, 0);

  return (
    <div style={styles.card}>
      <div style={styles.header}>
        <div style={styles.scoreSection}>
          <div style={{ ...styles.scoreCircle, borderColor: color }}>
            <span style={{ ...styles.scoreValue, color }}>{score}</span>
            <span style={styles.scoreLabel}>/100</span>
          </div>
          <div style={styles.gradeSection}>
            <span style={{ ...styles.grade, color }}>{grade}</span>
            <span style={styles.gradeLabel}>Grade</span>
          </div>
        </div>
        {issueCount > 0 && (
          <div style={styles.issuesBadge}>
            {issueCount} {issueCount === 1 ? 'issue' : 'issues'} found
          </div>
        )}
      </div>

      <div style={styles.breakdown}>
        <BreakdownItem
          label="Metadata"
          score={breakdown.metadata}
          max={25}
          issues={[
            issues.missingMetaDescription && 'Missing meta description',
            issues.titleTooLong && 'Title too long',
            issues.descriptionTooLong && 'Description too long',
          ].filter(Boolean) as string[]}
        />
        <BreakdownItem
          label="Content"
          score={breakdown.content}
          max={25}
          issues={[issues.missingH1 && 'Missing H1'].filter(Boolean) as string[]}
        />
        <BreakdownItem
          label="Accessibility"
          score={breakdown.accessibility}
          max={25}
          issues={
            issues.weakAltText
              ? [`${issues.weakAltText.length} image(s) missing alt text`]
              : []
          }
        />
        <BreakdownItem
          label="Links"
          score={breakdown.links}
          max={25}
          issues={
            issues.placeholderLinks
              ? [`${issues.placeholderLinks.length} placeholder link(s)`]
              : []
          }
        />
      </div>
    </div>
  );
}

interface BreakdownItemProps {
  label: string;
  score: number;
  max: number;
  issues: string[];
}

function BreakdownItem({ label, score, max, issues }: BreakdownItemProps) {
  const percentage = (score / max) * 100;
  // Use theme colors: purple for good, gray for moderate, red only for very poor
  const color = percentage >= 80 ? '#8629FF' : percentage >= 60 ? '#6b7280' : '#FF1F38';

  return (
    <div style={styles.breakdownItem}>
      <div style={styles.breakdownHeader}>
        <span style={styles.breakdownLabel}>{label}</span>
        <span style={{ ...styles.breakdownScore, color }}>
          {score}/{max}
        </span>
      </div>
      <div style={styles.progressBar}>
        <div
          style={{
            ...styles.progressFill,
            width: `${percentage}%`,
            backgroundColor: color,
          }}
        />
      </div>
      {issues.length > 0 && (
        <div style={styles.issuesList}>
          {issues.map((issue, idx) => (
            <span key={idx} style={styles.issueTag}>
              {issue}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  card: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    border: '1px solid #e5e7eb',
    padding: '24px',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
  },
  scoreSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  scoreCircle: {
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    border: '4px solid',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreValue: {
    fontSize: '28px',
    fontWeight: 700,
    lineHeight: 1,
  },
  scoreLabel: {
    fontSize: '12px',
    color: '#6b7280',
    marginTop: '2px',
  },
  gradeSection: {
    display: 'flex',
    flexDirection: 'column',
  },
  grade: {
    fontSize: '32px',
    fontWeight: 700,
    lineHeight: 1,
  },
  gradeLabel: {
    fontSize: '12px',
    color: '#6b7280',
    marginTop: '4px',
  },
  issuesBadge: {
    padding: '6px 12px',
    backgroundColor: '#f3f4f6',
    color: '#6b7280',
    borderRadius: '16px',
    fontSize: '12px',
    fontWeight: 500,
  },
  breakdown: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  breakdownItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  breakdownHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  breakdownLabel: {
    fontSize: '14px',
    fontWeight: 500,
    color: '#374151',
  },
  breakdownScore: {
    fontSize: '14px',
    fontWeight: 600,
  },
  progressBar: {
    height: '8px',
    backgroundColor: '#e5e7eb',
    borderRadius: '12px',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    transition: 'width 0.3s ease',
  },
  issuesList: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '6px',
  },
  issueTag: {
    padding: '4px 10px',
    backgroundColor: '#f3f4f6',
    color: '#6b7280',
    borderRadius: '12px',
    fontSize: '11px',
    fontWeight: 500,
  },
};
