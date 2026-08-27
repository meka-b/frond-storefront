# AI-Powered Product Intelligence & Semantic Automation Pipeline

## 1. Project Overview & System Intent
You are tasked with building a full-stack, multimodal, retrieval-augmented product enrichment and semantic SEO pipeline for the E-commerce Admin Panel.

The system empowers store managers to either input a minimal product title or upload botanical photos (Cloudflare R2), triggering an end-to-end multi-agent workflow that:
- Identifies taxonomy and botanical specifics via computer vision and authority databases.
- Performs semantic retrieval over local curated knowledge (`cactus_species_chunks.json`) and cloud vector stores.
- Conducts real-time SERP and competitor research.
- Formats rich editorial content natively for the **Tiptap Rich Text Editor**.
- Automatically populates all admin tabs (General Information, Variants & Pricing, Media & Alt Texts, Care Guide, Complete the Look / Internal Linking, SEO & Structured Data).

---

## 2. API Key Management & Settings Module (`/admin/settings`)
Create a persistent, encrypted credentials management interface in `/admin/settings` to store and test the following service keys:

| Environment Key | Provider / Service | Primary Role in Pipeline |
| :--- | :--- | :--- |
| `EXA_API_KEY` | [exa.ai](https://exa.ai) | Neural & semantic web search, competitor analysis, topic expansion |
| `FIRECRAWL_API_KEY` | [firecrawl.dev](https://firecrawl.dev) | Deep web scraping, SERP knowledge extraction, authority crawling |
| `PLANTNET_API_KEY` | [plantnet.org](https://my.plantnet.org) | Visual botanical identification, genus/species taxonomy verification |
| `MISTRAL_API_KEY` | [mistral.ai](https://mistral.ai) | Multimodal orchestration, Pixtral vision analysis, Mistral-Large reasoning |
| `RAGFLOW_API_KEY` | [ragflow.io](https://ragflow.io) | Deep document chunking, hybrid keyword/vector search over literature |
| `LLAMAINDEX_CLOUD_API_KEY` | [cloud.llamaindex.ai](https://cloud.llamaindex.ai) | Managed RAG orchestration, document parsing, query indexing pipelines |

### Requirements for Settings View:
- Secure database storage (encrypted strings or server-side environment override).
- Individual **"Test Connection"** ping buttons with visual status indicators (HTTP 200 vs 401/403 alerts).
- Granular permissions: Ensure only authorized admin roles can view or modify API keys.

---

## 3. UI Component: React Aria Toolbar Integration
Implement a structured AI action toolbar above the product form tabs using `@react-aria/toolbar` (or `react-aria-components` Toolbar) with accessible keyboard navigation (`ArrowLeft`, `ArrowRight`, `Tab`).

```tsx
import { Toolbar, Button, Group, Separator } from 'react-aria-components';

export function AIProductToolbar({ onAction, isGenerating, progressStage }) {
  return (
    <Toolbar aria-label="AI Intelligence Actions" className="ai-product-toolbar">
      <Group aria-label="One-Click Actions">
        <Button onPress={() => onAction('ALL')} isDisabled={isGenerating}>
          ✨ Tüm Alanları Doldur (Master AI)
        </Button>
      </Group>
      <Separator orientation="vertical" />
      <Group aria-label="Modular Actions">
        <Button onPress={() => onAction('IDENTIFY_VISION')} isDisabled={isGenerating}>
          🌿 Görsel & Tür Analizi (PlantNet + Pixtral)
        </Button>
        <Button onPress={() => onAction('RAG_SEARCH')} isDisabled={isGenerating}>
          📚 RAG & Web Araştırması (Exa + Firecrawl)
        </Button>
        <Button onPress={() => onAction('CARE_GUIDE')} isDisabled={isGenerating}>
          💧 Bakım Rehberi Üret
        </Button>
        <Button onPress={() => onAction('SEO_SCHEMA')} isDisabled={isGenerating}>
          🎯 SEO & JSON-LD Üret
        </Button>
      </Group>
    </Toolbar>
  );
}
```

---

## 4. Multi-Agent & RAG Architecture Flow

```
                 ┌───────────────────────────────────────┐
                 │  Admin Input: Title & R2 Image URLs   │
                 └──────────────────┬────────────────────┘
                                    │
           ┌────────────────────────┴────────────────────────┐
           ▼                                                 ▼
┌────────────────────────┐                        ┌────────────────────────┐
│   Taxonomy & Vision    │                        │  Local & Cloud RAG     │
│ ────────────────────── │                        │ ────────────────────── │
│ • PlantNet API         │                        │ • cactus_species_      │
│ • Mistral Pixtral-Large│                        │   chunks.json          │
│ • Visual feature/color │                        │ • LlamaIndex Cloud     │
│   extraction           │                        │ • RAGFlow Retrieval    │
└──────────┬─────────────┘                        └───────────┬────────────┘
           │                                                 │
           └────────────────────────┬────────────────────────┘
                                    │
                                    ▼
                 ┌──────────────────────────────────────┐
                 │    Deep Semantic Web Exploration     │
                 │ ──────────────────────────────────── │
                 │ • Exa.ai: Neural semantic search     │
                 │ • Firecrawl: Markdown PDP scraping   │
                 │ • Search intent & Related questions  │
                 └──────────────────┬───────────────────┘
                                    │
                                    ▼
                 ┌──────────────────────────────────────┐
                 │ Mistral-Large Reasoning Engine       │
                 │ ──────────────────────────────────── │
                 │ • Strict JSON Schema Enforcement     │
                 │ • Tiptap HTML Semantic Synthesis     │
                 │ • Confidence Scoring & Audit Trails  │
                 └──────────────────┬───────────────────┘
                                    │
                                    ▼
                 ┌──────────────────────────────────────┐
                 │ Form Mapping & Tiptap Direct Fill    │
                 └──────────────────────────────────────┘
```

---

## 5. Structured Data Contract (TypeScript Schema)
The AI API route must return a strictly formatted JSON response adhering to this interface:

```typescript
export interface AIProductPayload {
  general: {
    title: string;
    slug: string;
    shortDescription: string;
    detailedDescriptionHtml: string; // Valid semantic HTML for Tiptap Editor
    badge: string; // e.g. "Bestseller", "Nadir Tür", "Koleksiyon"
    badgeStyle: 'default-brown' | 'moss-green' | 'terracotta' | 'amber';
    sku: string;
    searchTags: string; // Space-separated tags
    filterChips: string; // Comma-separated tags (e.g. "Nadir, Sukulent, Az Su")
    publishStorefront: boolean;
    isBestseller: boolean;
    isUgcCommunity: boolean;
  };
  careGuide: {
    light: string;
    water: string;
    petFriendly: string;
  };
  mediaAltTexts: Array<{
    imageUrl: string;
    altText: string;
    imageTitle: string;
  }>;
  variantsSuggestion?: Array<{
    name: string;
    hexColor: string;
    price: number;
    compareAtPrice: number;
    stock: number;
  }>;
  seoAndStructuredData: {
    seoTitle: string;
    metaDescription: string;
    searchIntent: 'informational' | 'commercial' | 'transactional';
    primaryKeywords: string[];
    longTailKeywords: string[];
    semanticKeywords: string[];
    jsonLdSchema: Record<string, any>; // Product, Plant, and FAQPage schemas
    faqItems: Array<{ question: string; answer: string }>;
    internalLinkingSuggestions: Array<{ anchorText: string; targetTopic: string }>;
    relatedProductQueries: string[];
  };
  audit: {
    confidenceScore: number; // 0.00 - 1.00
    missingInformationWarnings: string[];
    sourceReferences: string[];
  };
}
```

---

## 6. Tiptap Rich Editor Semantic HTML Specifications
When populating the `detailedDescriptionHtml` field for the Tiptap editor:
- Never return unstyled plain text or markdown blocks.
- Output clean, semantic HTML elements compatible with Tiptap extensions:
  - `<h2>` for primary section dividers.
  - `<h3>` for sub-attributes.
  - `<p>` for descriptive paragraphs.
  - `<ul>` and `<li>` for features, benefits, and key points.
  - `<strong>` for emphasized terminology and botanical names.

### Structural Flow of the PDP Content:
1. `<h2>Bitki Profili & Kökeni</h2>`: Engaging botanical background, natural habitat, growth habits.
2. `<h2>Öne Çıkan Özellikler & Avantajlar</h2>`: Bulleted list highlighting collector value and resilience.
3. `<h2>Detaylı Bakım & İklim Gereksinimleri</h2>`: Practical watering, lighting, soil, and potting instructions.
4. `<h2>Sıkça Sorulan Sorular (SSS)</h2>`: Structured Q&A addressing common customer questions.

---

## 7. Form Field Mapping Implementation
Map the API response to the admin form state and editor instances:

```typescript
export function applyAIPayloadToForm(payload: AIProductPayload, form: any, tiptapEditor: any) {
  // 1. Genel Bilgiler
  form.setValue('title', payload.general.title);
  form.setValue('slug', payload.general.slug);
  form.setValue('shortDescription', payload.general.shortDescription);
  form.setValue('badge', payload.general.badge);
  form.setValue('badgeStyle', payload.general.badgeStyle);
  form.setValue('sku', payload.general.sku);
  form.setValue('searchTags', payload.general.searchTags);
  form.setValue('filterChips', payload.general.filterChips);
  form.setValue('publishStorefront', payload.general.publishStorefront);
  form.setValue('isBestseller', payload.general.isBestseller);
  form.setValue('isUgcCommunity', payload.general.isUgcCommunity);

  // 2. Tiptap Rich Editor
  if (tiptapEditor && payload.general.detailedDescriptionHtml) {
    tiptapEditor.commands.setContent(payload.general.detailedDescriptionHtml);
  }

  // 3. Bakım Rehberi
  form.setValue('careGuide.light', payload.careGuide.light);
  form.setValue('careGuide.water', payload.careGuide.water);
  form.setValue('careGuide.petFriendly', payload.careGuide.petFriendly);

  // 4. Görseller (Alt-Text & Başlıklar)
  payload.mediaAltTexts.forEach((media, index) => {
    form.setValue(`media.${index}.altText`, media.altText);
    form.setValue(`media.${index}.title`, media.imageTitle);
  });

  // 5. SEO & Structured Data
  form.setValue('seo.title', payload.seoAndStructuredData.seoTitle);
  form.setValue('seo.metaDescription', payload.seoAndStructuredData.metaDescription);
  form.setValue('seo.jsonLd', JSON.stringify(payload.seoAndStructuredData.jsonLdSchema, null, 2));
}
```

---

## 8. Development & Implementation Checklist
- [ ] **Admin Settings View**: Build secure credential storage for all 6 API keys at `/admin/settings`.
- [ ] **RAG Chunks Setup**: Place `cactus_species_chunks.json` in the server data directory and bind to the retrieval engine.
- [ ] **API Endpoint**: Implement `/api/ai/enrich-product` orchestrating PlantNet, Exa, Firecrawl, LlamaIndex/RAGFlow, and Mistral.
- [ ] **UI Toolbar**: Embed the React Aria Toolbar with interactive action dispatchers on the Product Add/Edit page.
- [ ] **Form & Tiptap Binding**: Connect responses directly to React Hook Form and Tiptap editor commands.
- [ ] **Validation & Audit Alerts**: Display toast notifications for confidence scores (<0.80) and missing field warnings.