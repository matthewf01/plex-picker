
# AI Specification

## Model Configuration
*   **Provider:** Google GenAI SDK (`@google/genai`)
*   **Model:** `gemini-2.5-flash-lite`
    *   *Why Flash Lite?* We need extremely low latency and low cost. The task (selecting items from a list) is a reasoning task that does not require the massive knowledge base of Pro models.
*   **Response Format:** JSON Schema (Strict enforcement).

## The "Vibe" Dictionary
The UI presents simple, catchy labels (e.g., "Nostalgia"). The AI receives a hidden, highly detailed definition to ground the recommendation.

**Source:** `src/services/geminiService.ts` -> `VIBE_DEFINITIONS`

| UI Label | Hidden Context Prompt |
| :--- | :--- |
| **Emotionally Moving** | "Poignant, touching, and meaningful, focusing on human connection, catharsis, and personal growth. Avoid content that is excessively tragic, depressing, or hopeless." |
| **The Holidays** | "Features themes of Christmas, Hanukkah, Thanksgiving, New Year's Eve, Halloween, or general festive seasonal atmosphere." |
| **Mind Bending** | "Psychological thrillers, complex sci-fi, time travel, or non-linear narratives that require focus." |
| **Brain Off / Popcorn** | "Action, comedy, or blockbuster entertainment that is easy to watch, exciting, and requires little mental effort." |
| ... | (See `geminiService.ts` for full list) |

## Prompt Engineering
The prompt follows a "Curator Persona" strategy.

1.  **Persona:** "Act as a film curator."
2.  **Context:** User preferences are injected (Format, Familiarity, Vibe).
3.  **Dataset:** A JSON array of candidates (ID, Title, Year, Genre, Summary) is injected directly into the prompt.
    *   *Optimization:* We limit the candidate list to ~60 items (randomly shuffled from the full library) before sending to AI to prevent context window overflow and reduce latency.
4.  **Output Requirement:**
    *   Single Best Match (Top Pick).
    *   6 Alternatives.
    *   Must include a `score` (0-100) and a `reason` (punchy sentence).
    *   Must Hallucinate/Estimate `imdbRating` and `rottenTomatoesScore` based on its internal training data (since Plex doesn't always provide these).

## Error Handling
*   **Overload:** Specific handling for `503` errors (Service Overloaded) to prompt a user retry.
*   **Empty Result:** If the model returns no JSON, the UI prompts the user to broaden their search.
