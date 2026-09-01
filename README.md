##WEBPERSONA 2.0

## What this is
WebPersona 2.0 is an AI-powered autonomous browsing extension that injects a conversational AI widget into any website. It accepts natural language research directives, autonomously navigates the web using Selenium, and synthesizes multi-modal reports with markdown, sources, generated images, audio, and sign language videos using Google's Gemini API.

### Stack
- **Language(s):** TypeScript (92.5%), HTML, JavaScript
- **Framework / runtime:** React 19 + Vite (browser-based extension)
- **Notable libraries:** Google Gemini 2.5 Flash (LLM), Selenium WebDriver (web automation), FAISS (vector database for semantic search), face-api.js (biometric auth), react-markdown, lucide-react (icons)

## How it's organized
```
App.tsx              Main React component: state management, UI orchestration
index.tsx            React DOM entry point; mounts app in fixed overlay
types.ts             TypeScript interfaces: AppState, LogEntry, ResearchResult, UserProfile
constants.tsx        Tech stack display icons
index.html           HTML entry; loads Tailwind, Face API, ES modules
manifest.json        Chrome extension v3 config; content script injection
content.js           Content script bootstrap; injects built bundle
services/            (empty directory, likely for geminiService imports)
components/          (empty directory, likely for FaceAuth, LogTerminal, etc.)
vite.config.ts       Vite bundler config; IIFE output for extension, env vars for API key
package.json         Dependencies: React, Google Genai SDK, Markdown, Lucide icons
```

**How it fits together:** The extension injects a fixed-position React widget (`index.tsx`) onto any page. Users authenticate via facial recognition (`FaceAuth` component). Once authenticated, they enter a research directive into a textarea. The app calls `planResearch()` (via Gemini) to generate search queries, then `executeResearch()` to run web queries and synthesize results. Results are displayed in a `ResearchReport` component with markdown, source citations, and optional media. Session history is stored per-user in localStorage. A "Deep Think" toggle passes reasoning directives to Gemini for more thorough analysis.

## How to run it
```bash
# Install dependencies
npm install

# Set Gemini API key in .env.local
echo "GEMINI_API_KEY=your-key-here" > .env.local

# Run dev server (local testing)
npm run dev

# Build for production/extension
npm run build
```

The extension expects built assets at `dist/assets/index-*.js` (injected by `content.js`). After building, load the extension into Chrome via `chrome://extensions` → "Load unpacked" → point to repo root.

## Try asking
- What do the `FaceAuth`, `LogTerminal`, and `ResearchReport` components do?
- How does the Gemini service integration handle search planning and web scraping?
- How is session history persisted and restored from localStorage?
