
# System Architecture

## Design Philosophy
PlexPicker is designed as a **Zero-Backend** application (excluding the hosting of static assets). It acts as a bridge between two APIs: The User's Plex Server and Google's Gemini API. The browser performs all logic, data aggregation, and prompt construction.

## Directory Structure
*   `src/index.tsx`: Entry point, wraps App in ErrorBoundary.
*   `src/App.tsx`: Main controller. Manages global `AppState` and service instantiation.
*   `src/components/`: UI logic.
    *   `Setup.tsx`: Auth and Server selection.
    *   `Decoder.tsx`: The primary configuration UI (Wheel components).
    *   `Results.tsx`: Displays AI recommendations.
    *   `Wheel.tsx`: Custom physics-based scroll selector.
*   `src/services/`: Business logic.
    *   `plexService.ts`: Handles Plex.tv and PMS API calls.
    *   `geminiService.ts`: Handles AI interaction.
*   `src/types.ts`: Shared TypeScript interfaces.

## State Management (`AppState`)
The application flows through a linear state machine defined in `types.ts`:

1.  **SETUP**: 
    *   User is not authenticated or has no valid server config.
    *   Renders `Setup.tsx`.
    *   Outputs: `PlexServerConfig` (URL, Token, MachineID).
2.  **LOADING**:
    *   Transitional state while validating the connection to the selected Plex Server.
3.  **DECODER**:
    *   Main interactive state. User selects filters.
    *   **Background Process:** Triggers `loadLibraryData` to fetch and index content from the Plex Server. The UI displays a "Scanning Library..." state until this completes.
    *   Renders `Decoder.tsx`.
4.  **RESULTS**:
    *   AI has returned recommendations.
    *   Renders `Results.tsx`.
5.  **ERROR**:
    *   Global error state (though `ErrorBoundary` handles critical crashes).

## Data Flow Diagram

1.  **Init:** `App.tsx` checks `localStorage` for `plex_config`.
    *   *If found:* Validates connection -> `DECODER`.
    *   *If missing:* -> `SETUP`.
2.  **Fetch:** `plexService` retrieves metadata from user's server.
    *   *Endpoint:* `/library/sections/{id}/all`
    *   *Data:* flattened into `PlexMediaItem[]`.
3.  **Filter:** User selects params in `Decoder.tsx`.
    *   App filters `libraryItems` locally (by Type/Watch History) to create `candidates`.
4.  **Reasoning:** `candidates` + `Selection` sent to `geminiService`.
    *   AI selects top 7 matches using specific criteria.
5.  **Render:** Results displayed. User clicks to watch (Deep Link to Plex Web).

## Security & Privacy
*   **Tokens:** Plex Auth Tokens (`X-Plex-Token`) are stored in `localStorage`. They are never sent to any server other than the user's specific Plex Server or `plex.tv`.
*   **AI Privacy:** Only metadata (Title, Year, Genre, Summary) is sent to Google Gemini. No user watch history or personal identifiers are transmitted to Google.

## Development & Deployment

### Versioning Strategy
We utilize a **Calendar Versioning (CalVer)** system to track builds and deployments visible in the UI.

*   **Format:** `YYMMDD.NN`
    *   `YYMMDD`: The date of the build (e.g., `251215` for Dec 15, 2025).
    *   `NN`: Daily revision number (starting at `01`).
*   **Directives:** 
    1.  The `BUILD_NUMBER` constant in `src/App.tsx` is the source of truth for the UI.
    2.  The `README.md` header must be manually updated to match the code before deployment.
    3.  `package.json` version tracks major semantic releases (e.g., 1.0.0, 2.0.0) rather than daily builds.
