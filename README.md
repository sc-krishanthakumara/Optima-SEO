# SEO Optimizer for Sitecore XM Cloud

An AI-powered SEO optimization extension for Sitecore XM Cloud Pages that helps content authors improve their page's search engine optimization through intelligent analysis and suggestions.

![SEO Optimizer](https://img.shields.io/badge/Sitecore-XM%20Cloud-FF1F38?style=flat&logo=sitecore)
![Next.js](https://img.shields.io/badge/Next.js-15+-000000?style=flat&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?style=flat&logo=typescript)

## 🚀 Features

### Core Capabilities

- **📊 Comprehensive SEO Analysis**: Automatically scans pages for SEO issues including missing metadata, broken links, readability scores, and content quality metrics
- **🤖 AI-Powered Suggestions**: Uses Azure OpenAI to generate context-aware, non-repetitive keyword suggestions and content improvements
- **🎯 Context-Aware Optimization**: Configure your site's purpose, target audience, and business goals for personalized suggestions
- **📝 Multi-Step Workflow**: Clean, guided interface with Configure → Scan → Optimize → Apply workflow
- **🔗 Broken Link Detection**: Identifies placeholder links, invalid URLs, and broken references
- **📈 Readability Scoring**: Calculates Flesch Reading Ease scores and provides readability recommendations
- **✨ Component-Level Suggestions**: Get granular suggestions for headings, paragraphs, images, and links at the component level
- **📋 Copy-to-Clipboard**: Easy copy functionality for suggested and original content

### UI/UX Highlights

- **🎨 Sitecore Theme Integration**: Uses official Sitecore brand colors (`#8629FF` purple, `#FF1F38` red)
- **🏷️ Tag-Based Keywords**: Visual keyword tags with easy add/remove functionality
- **⚡ Interactive Loading States**: Animated progress indicators during AI processing
- **📱 Responsive Design**: Optimized for the Pages context panel
- **🎯 Focused Interface**: Streamlined UI without unnecessary features

## 📋 Prerequisites

- **Node.js** 18+ and npm
- **Sitecore XM Cloud** tenant with Marketplace access
- **Azure OpenAI** service (for AI suggestions)
- **Experience Edge Preview API** credentials (optional, for enhanced content extraction)

## 🛠️ Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd marketplace-starter
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env.local` file in the root directory:

```env
# Azure OpenAI Configuration (Required for AI suggestions)
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com
AZURE_OPENAI_API_KEY=your-api-key
AZURE_OPENAI_DEPLOYMENT_NAME=your-deployment-name
AZURE_OPENAI_API_VERSION=2024-02-15-preview

# Experience Edge Preview API (Optional, for enhanced content extraction)
NEXT_PUBLIC_EDGE_ENDPOINT=https://edge.sitecorecloud.io/api/graphql/v1
NEXT_PUBLIC_EDGE_API_KEY=your-edge-api-key
NEXT_PUBLIC_SITE_NAME=your-site-name

# Authoring API (Optional, for write-back functionality)
AUTHORING_API_ENDPOINT=https://your-instance.sitecorecloud.io
AUTHORING_API_KEY=your-authoring-api-key
```

### 4. Run Development Server

```bash
npm run dev
```

The application will start on `http://localhost:3000`.

## 📦 Building for Production

```bash
# Build the application
npm run build

# Start production server
npm start
```

## 🎯 Usage

### As a Marketplace Extension

1. **Build the Extension**: Run `npm run build` to create a production build
2. **Package for Marketplace**: Follow [Sitecore Marketplace guidelines](https://doc.sitecore.com/xmc/en/developers/xm-cloud/marketplace.html) to package your extension
3. **Install in XM Cloud**: Install as a XM CLud Marketplace plugin
4. **Open in Pages**: Navigate to XM Cloud Pages and open the context panel
5. **Start Optimizing**: The SEO Optimizer will automatically load when you select a page

### Workflow

#### Step 1: Configure
- **Site & Page Context**: Describe what your site and page are about
- **Target Audience**: Specify your ideal visitors
- **Business Goals**: Define what you want to achieve
- **Content Style**: Set page goal, tone, and locale
- **Keywords**: Add required keywords using the tag-based input (press comma or Enter to add tags)

#### Step 2: Scan
- Click "Scan Page" to analyze the current page
- Review comprehensive metrics:
  - Content analysis (word count, paragraphs, headings, images, links)
  - Readability analysis (Flesch Reading Ease score, grade level)
  - Detected issues (metadata, content, accessibility, links)
  - Broken links details

#### Step 3: Optimize
- Click "Generate AI Suggestions" to get AI-powered recommendations
- Review suggestions organized by:
  - **Metadata**: Title and meta description improvements
  - **Components**: Component-level suggestions for headings, content, images, and links
- Use copy buttons to copy original or suggested content

#### Step 4: Apply
- Select which suggestions to apply
- Review the summary of changes
- Note: Currently shows preview of what would be applied (write-back functionality requires Authoring API setup)

## 🏗️ Architecture

### Technology Stack

- **Framework**: Next.js 15+ with React 19
- **Language**: TypeScript (strict mode)
- **SDK**: Sitecore Marketplace SDK (`@sitecore-marketplace-sdk/client`)
- **AI Service**: Azure OpenAI (GPT-4)
- **Data Fetching**: GraphQL (Experience Edge Preview API)
- **Testing**: Jest + React Testing Library
- **Linting**: ESLint

### Project Structure

```
marketplace-starter/
├── src/
│   ├── app/
│   │   ├── pages-contextpanel-extension/
│   │   │   └── page.tsx              # Main extension entry point
│   │   └── layout.tsx                # Root layout
│   ├── components/
│   │   ├── SEOOptimizer.tsx          # Main SEO optimizer component
│   │   ├── SEOContextForm.tsx        # Configuration form
│   │   ├── SEOComprehensiveResults.tsx  # Scan results display
│   │   ├── SEOSuggestionsPanel.tsx   # AI suggestions display
│   │   ├── SEOComponentSuggestions.tsx   # Component-level suggestions
│   │   ├── SEOApplyPanel.tsx         # Apply changes panel
│   │   ├── KeywordTagsInput.tsx     # Tag-based keyword input
│   │   └── __tests__/                # Component tests
│   ├── services/
│   │   ├── azureOpenAI.ts            # Azure OpenAI integration
│   │   ├── graphql.ts                # Experience Edge GraphQL client
│   │   └── authoringGraphql.ts       # Authoring API client
│   ├── utils/
│   │   ├── seoScanner.ts             # Page content scanning
│   │   ├── seoScorer.ts              # SEO scoring logic
│   │   ├── contentParser.ts          # Content parsing utilities
│   │   └── hooks/
│   │       └── useMarketplaceClient.ts  # SDK initialization hook
│   └── types/
│       ├── seo.ts                    # SEO-related type definitions
│       └── index.ts                  # General type definitions
├── jest.config.js                    # Jest configuration
├── jest.setup.js                     # Jest setup
├── tsconfig.json                     # TypeScript config
└── package.json                      # Dependencies & scripts
```

## 🔧 Configuration

### Azure OpenAI Setup

1. **Create Azure OpenAI Resource**: Follow [Azure OpenAI documentation](https://learn.microsoft.com/azure/ai-services/openai/)
2. **Deploy a Model**: Deploy GPT-4 or GPT-3.5-turbo model
3. **Get Credentials**: Retrieve endpoint, API key, and deployment name
4. **Add to Environment**: Add credentials to `.env.local`

### Experience Edge Preview API (Optional)

The extension can work without GraphQL API, but it provides enhanced content extraction:

1. **Get API Key**: From XM Cloud Deploy → API Keys
2. **Configure Endpoint**: Use your Experience Edge endpoint
3. **Add to Environment**: Add credentials to `.env.local`

### Authoring API (Optional)

For write-back functionality (applying changes to Sitecore):

1. **Get API Key**: From XM Cloud Deploy → API Keys
2. **Configure Endpoint**: Use your XM Cloud instance endpoint
3. **Add to Environment**: Add credentials to `.env.local`

**Note**: Write-back functionality requires additional GraphQL mutation implementation.

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## 🐛 Troubleshooting

### Extension Not Loading

- Verify Marketplace SDK initialization in browser console
- Check that the extension is properly registered in XM Cloud
- Ensure you're opening the context panel in XM Cloud Pages

### AI Suggestions Not Generating

- Verify Azure OpenAI credentials in `.env.local`
- Check browser console for API errors
- Ensure deployment name matches your Azure OpenAI deployment
- Verify API version is correct (default: `2024-02-15-preview`)

### No Content Displayed

- Check browser console for errors
- Verify page has published/preview content
- Try refreshing the page in XM Cloud Pages

### Keywords Input Issues

- Use comma or Enter to add keywords as tags
- Click the X icon on tags to remove them
- Keywords are saved when you blur the input field

## 📝 Development

### Adding New SEO Checks

1. **Update Scanner**: Add detection logic in `src/utils/seoScanner.ts`
2. **Update Scorer**: Add scoring logic in `src/utils/seoScorer.ts`
3. **Update Types**: Add issue types in `src/types/seo.ts`
4. **Update UI**: Display new issues in `src/components/SEOComprehensiveResults.tsx`

### Customizing AI Prompts

Edit `src/services/azureOpenAI.ts`:
- `getSystemPrompt()`: System-level instructions
- `buildPrompt()`: User prompt construction

### Styling

All styles use inline TypeScript style objects. To customize:
1. Edit the `styles` constant in component files
2. Update theme colors: `#8629FF` (purple), `#FF1F38` (red), `#6b7280` (gray)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Write tests for new functionality
4. Ensure all tests pass (`npm test`)
5. Lint your code (`npm run lint`)
6. Commit your changes (`git commit -m 'Add amazing feature'`)
7. Push to the branch (`git push origin feature/amazing-feature`)
8. Open a Pull Request

## 📚 Additional Resources

- [Sitecore Marketplace Documentation](https://doc.sitecore.com/xmc/en/developers/xm-cloud/marketplace.html)
- [XM Cloud Developer Portal](https://developers.sitecore.com/xm-cloud)
- [Experience Edge GraphQL API](https://doc.sitecore.com/xmc/en/developers/xm-cloud/the-experience-edge-for-xm-graphql-schema.html)
- [Azure OpenAI Documentation](https://learn.microsoft.com/azure/ai-services/openai/)
- [Next.js Documentation](https://nextjs.org/docs)

## 💡 Features Roadmap

- [ ] Full write-back functionality via Authoring API
- [ ] Bulk page optimization
- [ ] SEO score history tracking
- [ ] Custom SEO rule configuration
- [ ] Integration with Sitecore Analytics
- [ ] Export optimization reports

## 🆘 Support

For issues, questions, or contributions:
- Open an issue on GitHub
- Contact the Sitecore community forums
- Refer to the official Sitecore Marketplace documentation

---

**Built with ❤️ for the Sitecore XM Cloud community**
