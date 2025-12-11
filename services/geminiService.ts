import { GoogleGenAI, Type } from "@google/genai";
import { PlexMediaItem, DecoderSelection, Recommendation } from '../types';

export class GeminiService {
  private ai: GoogleGenAI;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  async getRecommendations(
    candidates: PlexMediaItem[],
    selection: DecoderSelection
  ): Promise<Recommendation[]> {
    if (candidates.length === 0) return [];

    // Limit candidates to 200 to ensure we stay within reasonable latency/token limits
    const shuffled = [...candidates].sort(() => 0.5 - Math.random()).slice(0, 200);

    const candidateList = shuffled.map(c => ({
      id: c.ratingKey,
      title: c.title,
      year: c.year,
      genres: c.genre?.join(', '),
      summary: c.summary?.substring(0, 150)
    }));

    const prompt = `
      Act as a film curator for a user.
      
      User Preferences:
      - Format: ${selection.type === 'any' ? 'Movies or TV Shows' : selection.type}
      - Familiarity: ${selection.history === 'unwatched' ? 'Something I have NOT seen' : selection.history === 'favorite' ? 'Something I have seen and loved' : 'Anything'}
      - The Vibe: "${selection.vibe}"

      Below is a JSON list of available media in their library (ID, Title, Year, Genres, Summary).
      Select the SINGLE best match, and then select 6 strong alternative recommendations (Total 7 items).
      
      Candidates:
      ${JSON.stringify(candidateList)}

      Return a JSON array of 7 objects (if possible). Each object must have:
      - id: (string) The exact id from the candidate list.
      - reason: (string) A short, punchy, persuasive sentence explaining why this fits the "${selection.vibe}" vibe.
      - score: (number) A relevance score from 0-100.
      - imdbRating: (string) The IMDB rating (e.g. "8.2"). Estimate based on general knowledge if specific metadata is missing.
      - rottenTomatoesScore: (string) The Rotten Tomatoes percentage (e.g. "94%"). Estimate if needed.
    `;

    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                reason: { type: Type.STRING },
                score: { type: Type.NUMBER },
                imdbRating: { type: Type.STRING },
                rottenTomatoesScore: { type: Type.STRING }
              }
            }
          }
        }
      });
      
      const jsonStr = response.text;
      if (!jsonStr) return [];
      
      const parsed = JSON.parse(jsonStr) as {
        id: string, 
        reason: string, 
        score: number,
        imdbRating?: string,
        rottenTomatoesScore?: string
      }[];

      // Map back to full media items
      return parsed.map((p): Recommendation | null => {
        const original = candidates.find(c => c.ratingKey === p.id);
        if (!original) return null;
        return {
          item: original,
          reason: p.reason,
          score: p.score,
          imdbRating: p.imdbRating,
          rottenTomatoesScore: p.rottenTomatoesScore
        };
      }).filter((r): r is Recommendation => r !== null);

    } catch (e) {
      console.error("Gemini Error", e);
      return [];
    }
  }
}