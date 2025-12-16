
# PlexPicker 🎬

**Current Build:** 251215.02  
**Tech Stack:** React 19, TypeScript, Vite, Tailwind CSS, Google Gemini API

## Overview
PlexPicker is a client-side Single Page Application (SPA) that acts as a "Cinematic Decoder Ring" for media libraries. It connects directly to a user's Plex Media Server, indexes their available content, and uses Generative AI (Google Gemini) to recommend movies or TV shows based on abstract "Vibes" rather than standard genres.

## Key Features
*   **Client-Side Architecture:** No backend database. All user data (tokens, server URLs) is stored in the browser's `localStorage`.
*   **Plex Authentication:** Implements the official Plex.tv PIN flow (OAuth2-like) to discover servers.
*   **Smart Connection Racing:** Automatically tests local, remote, and relay connections to find the fastest reachable route to the media server, handling mixed-content (HTTP/HTTPS) restrictions.
*   **AI-Powered Curation:** Uses `gemini-2.5-flash-lite` to analyze library metadata against complex mood definitions (e.g., "Mind Bending", "Nostalgia").
*   **Wheel Interface:** A custom touch-responsive scroll wheel component for selecting Format, History, and Vibe. On desktop, supports drag-to-scroll and click-above/below to step through options.

## Getting Started

### Prerequisites
*   Node.js 18+
*   A Google Cloud Project with the Gemini API enabled.
*   A Plex Media Server (Local or Remote).

### Installation
1.  Clone the repository.
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Create a `.env` file in the root:
    ```env
    API_KEY=your_google_gemini_api_key
    ```
4.  Run the development server:
    ```bash
    npm run dev
    ```

## Documentation Index
For detailed technical understanding, please refer to the `docs/` directory:

1.  [**Architecture & State**](./docs/ARCHITECTURE.md) - System design, data flow, and directory structure.
2.  [**Plex Integration Guide**](./docs/PLEX_INTEGRATION.md) - How we authenticate and bypass CORS issues.
3.  [**AI Specification**](./docs/AI_SPECIFICATION.md) - Prompt engineering, mood dictionaries, and LLM configuration.

## Deployment
The app is optimized for Vercel.
*   **Build Command:** `vite build`
*   **Output Directory:** `dist`
*   **Environment Variables:** Ensure `API_KEY` is set in the Vercel Project Settings.

## License
Private / Proprietary.
