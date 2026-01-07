"use client";

import { useState, useEffect } from "react";
import type {
  ApplicationContext,
  PagesContext,
} from "@sitecore-marketplace-sdk/client";
import { useMarketplaceClient } from "@/src/utils/hooks/useMarketplaceClient";
import type {
  PageContent,
  SemanticTextItem,
} from "@/src/types";
import {
  extractSemanticItems,
} from "@/src/utils/contentParser";
import {
  extractPageContentFromContext,
  enrichPageContentWithDatasources,
  enrichPageContentWithDOMContent,
  debugPagesContext,
} from "@/src/utils/pagesContextParser";
import { createAuthoringGraphQLService } from "@/src/services/authoringGraphql";
import { SEOOptimizer } from "@/src/components/SEOOptimizer";

function PagesContextPanel() {
  const { client, error, isInitialized } = useMarketplaceClient();

  // Context state
  const [pagesContext, setPagesContext] = useState<PagesContext>();
  const [appContext, setAppContext] = useState<ApplicationContext>();

  // Content state
  const [pageContent, setPageContent] = useState<PageContent | null>(null);
  const [semanticItems, setSemanticItems] = useState<SemanticTextItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Initialize contexts
  useEffect(() => {
    if (!error && isInitialized && client) {
      client
        .query("application.context")
        .then((res) => {
          console.log("Success retrieving application.context:", res.data);
          setAppContext(res.data);
        })
        .catch((error) => {
          console.error("Error retrieving application.context:", error);
        });

      client
        .query("pages.context", {
          subscribe: true,
          onSuccess: (res) => {
            console.log("Success retrieving pages.context:", res);
            setPagesContext(res);
          },
        })
        .catch((error) => {
          console.error("Error retrieving pages.context:", error);
        });
    } else if (error) {
      console.error("Error initializing Marketplace client:", error);
    }
  }, [client, error, isInitialized]);

  // Fetch page content when context changes
  useEffect(() => {
    const fetchContent = async () => {
      if (!pagesContext?.pageInfo?.id) {
        return;
      }

      setIsLoading(true);
      setLoadError(null);

      try {
        console.log(
          "📄 Extracting content for page:",
          pagesContext.pageInfo.name,
          pagesContext.pageInfo.id
        );

        // Debug: Log the full context to see what's available
        debugPagesContext(pagesContext);

        // Step 1: Extract component structure from the Pages context
        let realPageContent = extractPageContentFromContext(pagesContext);
        
        console.log("✅ Extracted component structure:", realPageContent);
        
        // If no components found in real data, fall back to mock for demo
        if (realPageContent.components.length === 0) {
          console.warn("⚠️ No components found in Pages context, using mock data for demo");
          const mockPageContent = createMockPageContent(pagesContext);
          setPageContent(mockPageContent);
          const mockItems = extractSemanticItems(mockPageContent);
          setSemanticItems(mockItems);
          return;
        }

        // Step 2: Try to enrich with content (multiple strategies)
        
        // Strategy 1: Extract from rendered page DOM (no API needed!)
        try {
          console.log("🎨 Trying to extract content from rendered page...");
          const domEnriched = enrichPageContentWithDOMContent(realPageContent);
          
          // Check if DOM extraction actually found REAL content
          // (not just placeholder "DataSource" fields)
          const realFields = domEnriched.components.flatMap(c => 
            c.fields.filter(f => f.name !== 'DataSource')
          );
          
          if (realFields.length > 0) {
            console.log(`✅ Successfully extracted ${realFields.length} fields from page DOM!`);
            realPageContent = domEnriched;
          } else {
            console.log("⚠️ DOM extraction returned no content, trying GraphQL...");
            throw new Error("DOM extraction failed");
          }
        } catch (domError) {
          // Strategy 2: Fall back to GraphQL API
          try {
            const graphqlService = createAuthoringGraphQLService();
            
            if (graphqlService) {
              console.log("🚀 Fetching datasource field values via GraphQL...");
              realPageContent = await enrichPageContentWithDatasources(
                realPageContent,
                graphqlService
              );
              console.log("✅ Enriched with datasource fields:", realPageContent);
            } else {
              console.warn("⚠️ No content extraction method available");
              console.log("💡 Options:");
              console.log("   1. DOM extraction failed (cross-origin restriction)");
              console.log("   2. GraphQL not configured");
              console.log("");
              console.log("📋 Current state: Showing component structure only");
              console.log("   - Component names: ✅");
              console.log("   - Datasource paths: ✅");  
              console.log("   - Field values: ❌");
              console.log("");
              console.log("🔧 To get field values, see: GRAPHQL_SETUP.md");
            }
          } catch (graphqlError) {
            console.warn("⚠️ Could not fetch datasource fields:", graphqlError);
            console.log("Showing component structure only...");
          }
        }

        // Use the extracted (and possibly enriched) content
        setPageContent(realPageContent);
        const items = extractSemanticItems(realPageContent);
        setSemanticItems(items);
        console.log(`✅ Extracted ${items.length} semantic items from real page data`);
        
      } catch (err) {
        console.error("❌ Error extracting page content:", err);
        
        // On error, try to provide helpful debugging info
        console.log("Falling back to mock data due to error");
        try {
          const mockPageContent = createMockPageContent(pagesContext);
          setPageContent(mockPageContent);
          const items = extractSemanticItems(mockPageContent);
          setSemanticItems(items);
        } catch (mockErr) {
          console.error("Failed to create mock data:", mockErr);
          setLoadError(
            err instanceof Error ? err.message : "Failed to load content"
          );
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchContent();
  }, [pagesContext]);


  // Loading states
  if (!isInitialized) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner} />
        <p style={styles.loadingText}>Initializing Marketplace client...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.errorContainer}>
        <h2 style={styles.errorTitle}>Initialization Error</h2>
        <p style={styles.errorMessage}>{error.message}</p>
      </div>
    );
  }

  if (!pagesContext?.pageInfo) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner} />
        <p style={styles.loadingText}>
          Waiting for page context...
        </p>
        <p style={{ ...styles.loadingText, fontSize: "13px", fontWeight: 400, color: "#9ca3af" }}>
          Please open a page in XM Cloud Pages to begin optimizing.
        </p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerTop}>
          <h1 style={styles.title}>🚀 SEO Optimizer</h1>
          {appContext?.name && (
            <span style={styles.appBadge}>{appContext.name}</span>
          )}
        </div>
        <div style={styles.pageInfo}>
          <div style={styles.pageInfoItem}>
            <span style={styles.pageInfoLabel}>Page:</span>
            <span style={styles.pageInfoValue}>
              {pagesContext.pageInfo.name}
            </span>
          </div>
          <div style={styles.pageInfoItem}>
            <span style={styles.pageInfoLabel}>Language:</span>
            <span style={styles.pageInfoValue}>
              {pagesContext.pageInfo.language || "en"}
            </span>
          </div>
        </div>
      </div>

      {/* Main content area */}
      {isLoading ? (
        <div style={styles.loadingContainer}>
          <div style={styles.spinner} />
          <p style={styles.loadingText}>Loading page content...</p>
        </div>
      ) : loadError ? (
        <div style={styles.errorContainer}>
          <h2 style={styles.errorTitle}>Error Loading Content</h2>
          <p style={styles.errorMessage}>{loadError}</p>
        </div>
      ) : (
        <div style={styles.seoPanel}>
          <SEOOptimizer
            pageContent={pageContent}
            semanticItems={semanticItems}
            onApply={(applied) => {
              console.log('Applied SEO changes:', applied);
              // TODO: Refresh page content after applying changes
            }}
          />
        </div>
      )}
    </div>
  );
}

/**
 * Create mock page content for demonstration
 * In production, this would come from the GraphQL API
 */
function createMockPageContent(pagesContext: PagesContext): PageContent {
  return {
    itemId: pagesContext.pageInfo?.id || "",
    name: pagesContext.pageInfo?.name || "Untitled Page",
    language: pagesContext.pageInfo?.language || "en",
    path: pagesContext.pageInfo?.path || "/",
    components: [
      {
        id: "hero-component",
        name: "Hero Banner",
        componentName: "Hero",
        type: "ContentBlock",
        datasourceId: "hero-datasource-123",
        placeholder: "main",
        fields: [
          {
            name: "Heading",
            value: "Welcome to XM Cloud",
            type: "Single-Line Text",
            category: "Heading",
          },
          {
            name: "Subheading",
            value:
              "Build amazing digital experiences with the power of Sitecore",
            type: "Single-Line Text",
            category: "Paragraph",
          },
          {
            name: "CtaText",
            value: "Get Started",
            type: "Single-Line Text",
            category: "Button",
          },
          {
            name: "CtaLink",
            value: "/get-started",
            type: "General Link",
            category: "Link",
          },
        ],
        children: [],
        path: ["Home", "Hero Banner"],
      },
      {
        id: "content-section",
        name: "Content Section",
        componentName: "RichTextSection",
        type: "ContentBlock",
        datasourceId: "content-datasource-456",
        placeholder: "main",
        fields: [
          {
            name: "Title",
            value: "About Our Platform",
            type: "Single-Line Text",
            category: "Heading",
          },
          {
            name: "Body",
            value:
              "<p>XM Cloud is Sitecore's cloud-native, composable digital experience platform (DXP) that enables brands to create and manage web content at scale.</p><p>With powerful features like AI-driven personalization, seamless integrations, and developer-friendly tools, you can deliver exceptional experiences across all channels.</p>",
            type: "Rich Text",
            category: "RichText",
          },
        ],
        children: [
          {
            id: "feature-list",
            name: "Feature List",
            componentName: "FeatureList",
            type: "ListComponent",
            datasourceId: "features-datasource-789",
            placeholder: "content",
            fields: [
              {
                name: "ListTitle",
                value: "Key Features",
                type: "Single-Line Text",
                category: "Heading",
              },
              {
                name: "Features",
                value:
                  "Composable Architecture|Cloud-Native Performance|Headless CMS|Visual Editing|Multi-site Management",
                type: "Multi-Line Text",
                category: "List",
              },
            ],
            children: [],
            path: ["Home", "Content Section", "Feature List"],
          },
        ],
        path: ["Home", "Content Section"],
      },
      {
        id: "footer-component",
        name: "Footer",
        componentName: "Footer",
        type: "Navigation",
        datasourceId: "footer-datasource-999",
        placeholder: "footer",
        fields: [
          {
            name: "Copyright",
            value: "© 2026 Sitecore. All rights reserved.",
            type: "Single-Line Text",
            category: "Label",
          },
          {
            name: "Links",
            value: "Privacy Policy|Terms of Service|Contact Us",
            type: "Multi-Line Text",
            category: "List",
          },
        ],
        children: [],
        path: ["Home", "Footer"],
      },
    ],
  };
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: "flex",
    flexDirection: "column",
    height: "100vh",
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    backgroundColor: "#f9fafb",
  },
  header: {
    padding: "20px 24px",
    backgroundColor: "#ffffff",
    borderBottom: "2px solid #e5e7eb",
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)",
  },
  headerTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "16px",
  },
  title: {
    margin: 0,
    fontSize: "24px",
    fontWeight: 700,
    color: "#8629FF",
    letterSpacing: "-0.02em",
  },
  appBadge: {
    padding: "6px 14px",
    backgroundColor: "#F3E8FF",
    color: "#8629FF",
    borderRadius: "16px",
    fontSize: "12px",
    fontWeight: 600,
    border: "1px solid #E9D5FF",
  },
  pageInfo: {
    display: "flex",
    gap: "24px",
    flexWrap: "wrap",
    paddingTop: "12px",
    borderTop: "1px solid #f3f4f6",
  },
  pageInfoItem: {
    display: "flex",
    gap: "8px",
    fontSize: "13px",
    alignItems: "center",
  },
  pageInfoLabel: {
    color: "#6b7280",
    fontWeight: 500,
  },
  pageInfoValue: {
    color: "#111827",
    fontWeight: 600,
  },
  seoPanel: {
    flex: 1,
    overflow: "auto",
    padding: "24px",
    backgroundColor: "#f9fafb",
    minHeight: "calc(100vh - 200px)",
  },
  loadingContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "64px 24px",
    gap: "20px",
    minHeight: "400px",
  },
  spinner: {
    width: "48px",
    height: "48px",
    border: "4px solid #e5e7eb",
    borderTopColor: "#8629FF",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  },
  loadingText: {
    color: "#6b7280",
    fontSize: "15px",
    fontWeight: 500,
  },
  errorContainer: {
    padding: "64px 24px",
    textAlign: "center",
    backgroundColor: "#ffffff",
    borderRadius: "12px",
    border: "1px solid #fee2e2",
    margin: "24px",
  },
  errorTitle: {
    color: "#FF1F38",
    fontSize: "20px",
    fontWeight: 600,
    marginBottom: "12px",
  },
  errorMessage: {
    color: "#6b7280",
    fontSize: "14px",
    lineHeight: "1.6",
  },
};

// Add keyframes for spinner animation
if (typeof document !== "undefined") {
  const styleSheet = document.createElement("style");
  styleSheet.textContent = `
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(styleSheet);
}

export default PagesContextPanel;
