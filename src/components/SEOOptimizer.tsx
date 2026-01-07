// SEO Optimizer Component - Main UI for SEO optimization

'use client';

import { useState, useCallback, useEffect } from 'react';
import type { PageContext, ScanResult, SEOSuggestions, ApplySelection } from '@/src/types/seo';
import { scanPageContent } from '@/src/utils/seoScanner';
import { computeSEOScore } from '@/src/utils/seoScorer';
import { createAzureOpenAIService } from '@/src/services/azureOpenAI';
import type { PageContent, SemanticTextItem } from '@/src/types';
import { SEOScoreCard } from './SEOScoreCard';
import { SEOContextForm } from './SEOContextForm';
import { SEOSuggestionsPanel } from './SEOSuggestionsPanel';
import { SEOApplyPanel } from './SEOApplyPanel';
import { SEOComprehensiveResults } from './SEOComprehensiveResults';

export interface SEOOptimizerProps {
  pageContent: PageContent | null;
  semanticItems: SemanticTextItem[];
  onApply?: (applied: string[]) => void;
}

export function SEOOptimizer({
  pageContent,
  semanticItems,
  onApply,
}: SEOOptimizerProps) {
  const [context, setContext] = useState<PageContext>({
    pageGoal: 'Convert',
    tone: 'Professional',
    locale: 'en-US',
  });

  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [suggestions, setSuggestions] = useState<SEOSuggestions | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [applySelection, setApplySelection] = useState<ApplySelection>({});

  // Scan page content
  const handleScan = useCallback(() => {
    if (!pageContent) return;

    setIsScanning(true);
    try {
      const pageData = scanPageContent(pageContent, semanticItems);
      const result = computeSEOScore(pageData);
      setScanResult(result);
      setSuggestions(null); // Clear previous suggestions
      setApplySelection({}); // Clear selection
    } catch (error) {
      console.error('Error scanning page:', error);
    } finally {
      setIsScanning(false);
    }
  }, [pageContent, semanticItems]);

  // Generate AI suggestions
  const handleSuggest = useCallback(async () => {
    if (!scanResult) return;

    const openAIService = createAzureOpenAIService();
    if (!openAIService) {
      alert('Azure OpenAI not configured. Please set environment variables.');
      return;
    }

    setIsSuggesting(true);
    try {
      const newSuggestions = await openAIService.generateSuggestions(
        context,
        scanResult.pageData
      );
      setSuggestions(newSuggestions);
      
      // Auto-select suggestions
      const autoSelect: ApplySelection = {};
      if (newSuggestions.metadata) {
        autoSelect.metadata = {};
        if (newSuggestions.metadata.title) autoSelect.metadata.title = true;
        if (newSuggestions.metadata.description) autoSelect.metadata.description = true;
      }
      
      // Auto-select component suggestions
      if (newSuggestions.components && newSuggestions.components.length > 0) {
        autoSelect.components = {};
        for (const component of newSuggestions.components) {
          autoSelect.components[component.componentId] = {};
          
          if (component.headings?.h1) {
            autoSelect.components[component.componentId].headings = { h1: true };
          }
          
          if (component.images && component.images.length > 0) {
            autoSelect.components[component.componentId].images = component.images.map((img) => ({
              id: img.id,
              alt: true,
            }));
          }
        }
      }
      
      setApplySelection(autoSelect);
    } catch (error) {
      console.error('Error generating suggestions:', error);
      alert('Failed to generate suggestions. Check console for details.');
    } finally {
      setIsSuggesting(false);
    }
  }, [scanResult, context]);

  // Apply selected changes
  const handleApply = useCallback(async () => {
    if (!suggestions || !scanResult) return;

    // Collect what would be applied
    const applied: string[] = [];
    const changes: Array<{ type: string; field: string; value: string; componentId?: string }> = [];
    
    // Page-level metadata
    if (applySelection.metadata?.title && suggestions.metadata?.title) {
      applied.push('page.title');
      changes.push({
        type: 'metadata',
        field: 'title',
        value: suggestions.metadata.title,
      });
    }
    if (applySelection.metadata?.description && suggestions.metadata?.description) {
      applied.push('page.description');
      changes.push({
        type: 'metadata',
        field: 'description',
        value: suggestions.metadata.description,
      });
    }
    if (applySelection.headings?.h1 && suggestions.headings?.h1) {
      applied.push('page.h1');
      changes.push({
        type: 'heading',
        field: 'h1',
        value: suggestions.headings.h1,
      });
    }
    if (applySelection.images) {
      applied.push(...applySelection.images.filter((img) => img.alt).map((img) => `image.${img.id}.alt`));
    }

    // Component-level changes
    if (applySelection.components && suggestions.components) {
      for (const component of suggestions.components) {
        const compSelection = applySelection.components[component.componentId];
        if (!compSelection) continue;

        if (compSelection.headings?.h1 && component.headings?.h1) {
          applied.push(`component.${component.componentId}.h1`);
          changes.push({
            type: 'component-heading',
            field: 'h1',
            value: component.headings.h1,
            componentId: component.componentId,
          });
        }
        
        if (compSelection.images && component.images) {
          for (const img of component.images) {
            const imgSelected = compSelection.images.find((s) => s.id === img.id && s.alt);
            if (imgSelected && img.alt) {
              applied.push(`component.${component.componentId}.image.${img.id}.alt`);
              changes.push({
                type: 'component-image',
                field: 'alt',
                value: img.alt,
                componentId: component.componentId,
              });
            }
          }
        }
      }
    }

    // Log detailed information
    console.log('📝 Changes to apply:', changes);
    console.log('📋 Applied paths:', applied);
    console.log('💡 Suggestions:', suggestions);
    console.log('✅ Selection:', applySelection);

    // Show user-friendly message
    const message = `✅ Ready to apply ${applied.length} change${applied.length !== 1 ? 's' : ''}:\n\n` +
      changes.map((c, i) => `${i + 1}. ${c.type}: ${c.field} → "${c.value.substring(0, 50)}${c.value.length > 50 ? '...' : ''}"`).join('\n') +
      `\n\n⚠️ Note: Write-back to Sitecore requires:\n` +
      `• Authoring API (not Preview API)\n` +
      `• Proper authentication (Bearer token)\n` +
      `• Field path mapping to Sitecore items\n\n` +
      `Currently, this is a preview. Check the browser console for detailed change information.`;

    alert(message);

    // Callback for potential future implementation
    if (onApply) {
      onApply(applied);
    }
  }, [suggestions, scanResult, applySelection, onApply]);

  // Multi-step UI state
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);
  const hasScanned = scanResult !== null;
  const hasSuggestions = suggestions !== null;

  // Enhanced scan handler that advances to step 2
  const handleScanComplete = useCallback(async () => {
    if (!pageContent) return;

    setIsScanning(true);
    try {
      const pageData = scanPageContent(pageContent, semanticItems);
      const result = computeSEOScore(pageData);
      setScanResult(result);
      setSuggestions(null); // Clear previous suggestions
      setApplySelection({}); // Clear selection
      setCurrentStep(2); // Advance to results step
    } catch (error) {
      console.error('Error scanning page:', error);
    } finally {
      setIsScanning(false);
    }
  }, [pageContent, semanticItems]);

  // Loading progress state for suggestions
  const [loadingStep, setLoadingStep] = useState(0);

  // Enhanced suggest handler that advances to step 3
  const handleSuggestComplete = useCallback(async () => {
    if (!scanResult) return;

    const openAIService = createAzureOpenAIService();
    if (!openAIService) {
      alert('Azure OpenAI not configured. Please set environment variables.');
      return;
    }

    setIsSuggesting(true);
    setLoadingStep(0);

    try {
      // Simulate progress steps
      const progressSteps = [
        () => setLoadingStep(1), // Analyzing metadata
        () => setLoadingStep(2), // Reviewing content structure
        () => setLoadingStep(3), // Generating suggestions
      ];

      // Animate through progress steps
      for (let i = 0; i < progressSteps.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 800));
        progressSteps[i]();
      }

      const newSuggestions = await openAIService.generateSuggestions(
        context,
        scanResult.pageData
      );
      setSuggestions(newSuggestions);
      
      // Auto-select suggestions
      const autoSelect: ApplySelection = {};
      if (newSuggestions.metadata) {
        autoSelect.metadata = {};
        if (newSuggestions.metadata.title) autoSelect.metadata.title = true;
        if (newSuggestions.metadata.description) autoSelect.metadata.description = true;
      }
      
      // Auto-select component suggestions
      if (newSuggestions.components && newSuggestions.components.length > 0) {
        autoSelect.components = {};
        for (const component of newSuggestions.components) {
          autoSelect.components[component.componentId] = {};
          
          if (component.headings?.h1) {
            autoSelect.components[component.componentId].headings = { h1: true };
          }
          
          if (component.images && component.images.length > 0) {
            autoSelect.components[component.componentId].images = component.images.map((img) => ({
              id: img.id,
              alt: true,
            }));
          }
        }
      }
      
      setApplySelection(autoSelect);
      setCurrentStep(3); // Advance to suggestions step
    } catch (error) {
      console.error('Error generating suggestions:', error);
      alert('Failed to generate suggestions. Check console for details.');
    } finally {
      setIsSuggesting(false);
      setLoadingStep(0);
    }
  }, [scanResult, context]);

  const handleApplyComplete = useCallback(() => {
    handleApply();
    setCurrentStep(4); // Advance to final step
  }, [handleApply]);

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h2 style={styles.title}>🚀 SEO Optimizer</h2>
        <p style={styles.subtitle}>
          Optimize your page for better search engine visibility
        </p>
      </div>

      {/* Step Indicator */}
      <div style={styles.stepIndicator}>
        <StepIndicatorItem
          step={1}
          currentStep={currentStep}
          label="Configure"
          completed={currentStep > 1}
        />
        <StepIndicatorItem
          step={2}
          currentStep={currentStep}
          label="Scan"
          completed={currentStep > 2}
        />
        <StepIndicatorItem
          step={3}
          currentStep={currentStep}
          label="Optimize"
          completed={currentStep > 3}
        />
        <StepIndicatorItem
          step={4}
          currentStep={currentStep}
          label="Apply"
          completed={false}
        />
      </div>

      {/* Step 1: Configure Context */}
      {currentStep === 1 && (
        <div style={styles.stepContent}>
          <div style={styles.stepHeader}>
            <h3 style={styles.stepTitle}>Step 1: Configure Page Context</h3>
            <p style={styles.stepDescription}>
              Set your page goals, tone, and required keywords to help us optimize your content.
            </p>
          </div>
          <SEOContextForm context={context} onChange={setContext} />
          <div style={styles.stepActions}>
            {isScanning ? (
              <LoadingButton label="Analyzing page content" />
            ) : (
              <button
                onClick={handleScanComplete}
                disabled={!pageContent}
                style={{
                  ...styles.button,
                  ...styles.buttonPrimary,
                  ...(!pageContent ? styles.buttonDisabled : {}),
                }}
              >
                Continue to Scan →
              </button>
            )}
          </div>
        </div>
      )}

      {/* Step 2: Scan Results */}
      {currentStep === 2 && hasScanned && scanResult && (
        <div style={styles.stepContent}>
          <div style={styles.stepHeader}>
            <h3 style={styles.stepTitle}>Step 2: Scan Results</h3>
            <p style={styles.stepDescription}>
              Comprehensive analysis of your page's SEO performance.
            </p>
          </div>
          
          {/* Score Card */}
          <SEOScoreCard
            score={scanResult.seoScore}
            breakdown={scanResult.breakdown}
            issues={scanResult.issues}
          />

          {/* Comprehensive Results */}
          <SEOComprehensiveResults scanResult={scanResult} />

          {/* Loading Overlay for Suggestions */}
          {isSuggesting && (
            <div style={styles.loadingOverlay}>
              <div style={styles.loadingCard}>
                <div style={styles.loadingHeader}>
                  <div style={styles.loadingSpinnerLarge}>
                    <div style={styles.spinnerRing} />
                  </div>
                  <h4 style={styles.loadingTitle}>Generating AI Suggestions</h4>
                  <p style={styles.loadingSubtitle}>Analyzing your content and creating optimization recommendations...</p>
                </div>
                <div style={styles.loadingSteps}>
                  <LoadingStep label="Analyzing metadata" active={loadingStep >= 1} completed={loadingStep > 1} />
                  <LoadingStep label="Reviewing content structure" active={loadingStep >= 2} completed={loadingStep > 2} />
                  <LoadingStep label="Generating suggestions" active={loadingStep >= 3} completed={false} />
                </div>
              </div>
            </div>
          )}

          <div style={styles.stepActions}>
            <button
              onClick={() => setCurrentStep(1)}
              style={{
                ...styles.button,
                ...styles.buttonSecondary,
              }}
            >
              ← Back
            </button>
            <button
              onClick={handleSuggestComplete}
              disabled={isSuggesting}
              style={{
                ...styles.button,
                ...styles.buttonPrimary,
                ...(isSuggesting ? styles.buttonDisabled : {}),
              }}
            >
              {isSuggesting ? (
                <>
                  <span style={styles.buttonSpinner}>⏳</span>
                  Generating...
                </>
              ) : (
                'Generate AI Suggestions →'
              )}
            </button>
          </div>
        </div>
      )}

      {/* Step 3: AI Suggestions */}
      {currentStep === 3 && hasSuggestions && scanResult && (
        <div style={styles.stepContent}>
          <div style={styles.stepHeader}>
            <h3 style={styles.stepTitle}>Step 3: AI Optimization Suggestions</h3>
            <p style={styles.stepDescription}>
              Review and select the improvements you'd like to apply to your page.
            </p>
          </div>
          
          <SEOSuggestionsPanel
            suggestions={suggestions}
            originalData={scanResult.pageData}
            selection={applySelection}
            onSelectionChange={setApplySelection}
          />

          <div style={styles.stepActions}>
            <button
              onClick={() => setCurrentStep(2)}
              style={{
                ...styles.button,
                ...styles.buttonSecondary,
              }}
            >
              ← Back
            </button>
            <button
              onClick={handleApplyComplete}
              style={{
                ...styles.button,
                ...styles.buttonPrimary,
              }}
            >
              Apply Selected Changes →
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Apply Changes */}
      {currentStep === 4 && hasSuggestions && (
        <div style={styles.stepContent}>
          <div style={styles.stepHeader}>
            <h3 style={styles.stepTitle}>Step 4: Apply Changes</h3>
            <p style={styles.stepDescription}>
              Review your selections and apply the changes to your page.
            </p>
          </div>
          
          <SEOApplyPanel
            onApply={handleApplyComplete}
            selection={applySelection}
          />

          <div style={styles.stepActions}>
            <button
              onClick={() => setCurrentStep(3)}
              style={{
                ...styles.button,
                ...styles.buttonSecondary,
              }}
            >
              ← Back
            </button>
            <button
              onClick={() => {
                setCurrentStep(1);
                setScanResult(null);
                setSuggestions(null);
                setApplySelection({});
              }}
              style={{
                ...styles.button,
                ...styles.buttonTertiary,
              }}
            >
              Start Over
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

interface StepIndicatorItemProps {
  step: number;
  currentStep: number;
  label: string;
  completed: boolean;
}

function StepIndicatorItem({ step, currentStep, label, completed }: StepIndicatorItemProps) {
  const isActive = currentStep === step;
  const isCompleted = completed || currentStep > step;

  return (
    <div style={styles.stepItem}>
      <div
        style={{
          ...styles.stepCircle,
          ...(isActive ? styles.stepCircleActive : {}),
          ...(isCompleted ? styles.stepCircleCompleted : {}),
        }}
      >
        {isCompleted ? '✓' : step}
      </div>
      <span
        style={{
          ...styles.stepLabel,
          ...(isActive ? styles.stepLabelActive : {}),
        }}
      >
        {label}
      </span>
    </div>
  );
}

// Animated loading button component
function LoadingButton({ label = 'Analyzing...' }: { label?: string }) {
  const [dots, setDots] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => {
        if (prev === '...') return '';
        return prev + '.';
      });
    }, 500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div style={styles.loadingButton}>
      <div style={styles.loadingSpinner}>
        <div style={styles.spinnerDot} />
        <div style={{ ...styles.spinnerDot, animationDelay: '0.2s' }} />
        <div style={{ ...styles.spinnerDot, animationDelay: '0.4s' }} />
      </div>
      <span style={styles.loadingText}>{label}{dots}</span>
    </div>
  );
}

// Loading step component for progress indication
function LoadingStep({ label, active, completed }: { label: string; active: boolean; completed?: boolean }) {
  return (
    <div style={styles.loadingStep}>
      <div
        style={{
          ...styles.loadingStepDot,
          ...(active ? styles.loadingStepDotActive : {}),
          ...(completed ? styles.loadingStepDotCompleted : {}),
        }}
      >
        {completed ? (
          <svg width="8" height="8" viewBox="0 0 8 8" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M6.5 2L3.5 5L1.5 3" stroke="#8629FF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        ) : active ? (
          <div style={styles.loadingStepPulse} />
        ) : null}
      </div>
      <span
        style={{
          ...styles.loadingStepLabel,
          ...(active ? styles.loadingStepLabelActive : {}),
          ...(completed ? styles.loadingStepLabelCompleted : {}),
        }}
      >
        {label}
      </span>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
    padding: '24px',
  },
  header: {
    marginBottom: '8px',
  },
  title: {
    margin: 0,
    fontSize: '24px',
    fontWeight: 700,
    color: '#8629FF',
  },
  subtitle: {
    margin: '8px 0 0 0',
    fontSize: '14px',
    color: '#6b7280',
  },
  stepIndicator: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px',
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    border: '1px solid #e5e7eb',
    position: 'relative',
  },
  stepItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
    flex: 1,
    position: 'relative',
  },
  stepCircle: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '16px',
    fontWeight: 600,
    backgroundColor: '#f3f4f6',
    color: '#6b7280',
    border: '2px solid #e5e7eb',
    transition: 'all 0.3s ease',
  },
  stepCircleActive: {
    backgroundColor: '#FF1F38',
    color: '#ffffff',
    borderColor: '#FF1F38',
    transform: 'scale(1.1)',
  },
  stepCircleCompleted: {
    backgroundColor: '#8629FF',
    color: '#ffffff',
    borderColor: '#8629FF',
  },
  stepLabel: {
    fontSize: '12px',
    fontWeight: 500,
    color: '#6b7280',
    transition: 'all 0.3s ease',
  },
  stepLabelActive: {
    color: '#111827',
    fontWeight: 600,
  },
  stepContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  stepHeader: {
    marginBottom: '8px',
  },
  stepTitle: {
    margin: '0 0 8px 0',
    fontSize: '20px',
    fontWeight: 600,
    color: '#111827',
  },
  stepDescription: {
    margin: 0,
    fontSize: '14px',
    color: '#6b7280',
  },
  stepActions: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'flex-end',
    paddingTop: '16px',
    borderTop: '1px solid #e5e7eb',
  },
  button: {
    padding: '12px 24px',
    borderRadius: '24px',
    border: 'none',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
  },
  buttonPrimary: {
    backgroundColor: '#8629FF',
    color: '#ffffff',
  },
  buttonSecondary: {
    backgroundColor: '#f3f4f6',
    color: '#374151',
    border: '1px solid #e5e7eb',
  },
  buttonTertiary: {
    backgroundColor: '#ffffff',
    color: '#8629FF',
    border: '2px solid #8629FF',
  },
  buttonDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
    transform: 'none',
  },
  loadingButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 24px',
    backgroundColor: '#8629FF',
    color: '#ffffff',
    borderRadius: '24px',
    fontSize: '14px',
    fontWeight: 600,
    border: 'none',
    cursor: 'default',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
  },
  loadingSpinner: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  spinnerDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: '#ffffff',
    animation: 'pulse 1.4s ease-in-out infinite',
  },
  loadingText: {
    color: '#ffffff',
  },
  loadingOverlay: {
    position: 'relative',
    marginTop: '24px',
    animation: 'fadeIn 0.3s ease-in',
  },
  loadingCard: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    border: '1px solid #e5e7eb',
    padding: '32px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
  },
  loadingHeader: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '16px',
    marginBottom: '32px',
  },
  loadingSpinnerLarge: {
    width: '64px',
    height: '64px',
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  spinnerRing: {
    width: '64px',
    height: '64px',
    border: '4px solid #f3f4f6',
    borderTopColor: '#8629FF',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  loadingTitle: {
    margin: 0,
    fontSize: '20px',
    fontWeight: 600,
    color: '#111827',
  },
  loadingSubtitle: {
    margin: 0,
    fontSize: '14px',
    color: '#6b7280',
    textAlign: 'center',
  },
  loadingSteps: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  loadingStep: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  loadingStepDot: {
    width: '12px',
    height: '12px',
    borderRadius: '50%',
    backgroundColor: '#e5e7eb',
    position: 'relative',
    transition: 'all 0.3s ease',
  },
  loadingStepDotActive: {
    backgroundColor: '#8629FF',
    boxShadow: '0 0 0 4px rgba(134, 41, 255, 0.1)',
  },
  loadingStepDotCompleted: {
    backgroundColor: '#8629FF',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingStepPulse: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '12px',
    height: '12px',
    borderRadius: '50%',
    backgroundColor: '#8629FF',
    animation: 'pulse-ring 1.5s ease-out infinite',
  },
  loadingStepLabel: {
    fontSize: '14px',
    color: '#9ca3af',
    transition: 'color 0.3s ease',
  },
  loadingStepLabelActive: {
    color: '#374151',
    fontWeight: 500,
  },
  loadingStepLabelCompleted: {
    color: '#8629FF',
  },
  buttonSpinner: {
    display: 'inline-block',
    marginRight: '8px',
    animation: 'spin 1s linear infinite',
  },
};

// Add CSS animations
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = `
    @keyframes pulse {
      0%, 80%, 100% {
        opacity: 0.3;
        transform: scale(0.8);
      }
      40% {
        opacity: 1;
        transform: scale(1);
      }
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    @keyframes pulse-ring {
      0% {
        transform: translate(-50%, -50%) scale(1);
        opacity: 1;
      }
      100% {
        transform: translate(-50%, -50%) scale(2);
        opacity: 0;
      }
    }
    @keyframes fadeIn {
      from {
        opacity: 0;
        transform: translateY(-10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
  `;
  document.head.appendChild(styleSheet);
}

// Add hover effects via CSS
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = `
    button[style*="buttonPrimary"]:not(:disabled):hover {
      background-color: #6B1FD6 !important;
      transform: translateY(-2px);
      box-shadow: 0 4px 8px rgba(134, 41, 255, 0.3);
    }
    button[style*="buttonSecondary"]:not(:disabled):hover {
      background-color: #e5e7eb !important;
    }
    button[style*="buttonTertiary"]:not(:disabled):hover {
      background-color: #8629FF !important;
      color: #ffffff !important;
    }
  `;
  document.head.appendChild(styleSheet);
}
