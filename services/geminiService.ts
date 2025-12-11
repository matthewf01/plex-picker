
import { GoogleGenAI, Type } from "@google/genai";
import { PlexMediaItem, DecoderSelection, Recommendation } from '../types';

// Map UI labels to specific AI instructions to steer the "Vibe" correctly
const VIBE_DEFINITIONS: Record<string, string> = {
  "Date Night": "Romance, romantic comedy, or engaging drama suitable for a couple to watch together.",
  "Mind Bending": "Psychological thrillers, complex sci-fi, time travel, or non-linear narratives that require focus.",
  "Brain Off / Popcorn": "Action, comedy, or blockbuster entertainment that is easy to watch, exciting, and requires little mental effort.",
  "Scary": "Horror, thriller, suspense, monsters, ghosts, or psychological horror designed to frighten or unsettle.",
  "Dark & Gritty": "Serious themes, noir aesthetics, crime dramas, or morally ambiguous characters.",
  "Feel Good": "Uplifting, optimistic, happy, wholesome content that leaves the viewer in a good mood.",
  "Emotionally Moving": "Poignant, touching, and meaningful, focusing on human connection, catharsis, and personal growth. Avoid content that is excessively tragic, depressing, or hopeless (e.g. avoid 'Amour' or 'Requiem for a Dream').",
  "Edge of Seat": "High tension, suspense, racing against time, or intense action.",
  "Family Fun": "Animation, adventure, or comedy suitable for all ages, kids and parents alike.",
  "Nostalgia": "Evokes fond memories, retro aesthetics, 80s/90s classics, childhood favorites, or cult classics.",
  "The Holidays": "Features themes of Christmas, Hanukkah, Thanksgiving, New Year's Eve, Halloween, or general festive seasonal atmosphere.",
  "Dystopian": "Post-apocalyptic, cyberpunk, societal collapse, or survival scenarios.",
  "Short & Sweet": "Runtime under 90 minutes (if movie) or easy-to-digest episodes, tight pacing.",
  "Critically Acclaimed": "Award winners (Oscars, Emmys), high ratings, masterpiece cinema, or art-house quality.",
  "Hidden Gem": "Highly rated but lesser-known, under-appreciated, or cult films that might be overlooked.",
  "Slow Burn": "Atmosphere-heavy, gradual pacing, character study, tension building over action.",
  "Visual Masterpiece": "Stunning cinematography, unique art style, colorful, or visually arresting.",
  "Documentary": "Non-fiction, true stories, educational, nature, or biography."
};

export class GeminiService {
  private ai: GoogleGenAI | null = null;

  constructor() {
    const apiKey = process.env.API_KEY;
    if (apiKey) {
      try {
        this.ai = new GoogleGenAI({ apiKey });
      } catch (e) {
        console.error("Failed to initialize Gemini AI", e);
      }
    } else {
      console.warn("Gemini API Key is missing. AI features will be disabled until configured.");
    }
  }

  async getRecommendations(
    candidates: PlexMediaItem[],
    selection: DecoderSelection
  ): Promise<Recommendation[]> {
    if (!this.ai) {
      const msg = "Gemini API Key is missing. Please configure 'API_KEY' in your Vercel Project Settings.";
      console.error(msg);
      throw new Error(msg);
    }

    if (candidates.length === 0) return [];

    // OPTIMIZATION: Limit candidates to 60.
    const shuffled = [...candidates].sort(() => 0.5 - Math.random()).slice(0, 60);

    const candidateList = shuffled.map(c => ({
      id: c.ratingKey,
      title: c.title,
      year: c.year,
      genres: c.genre?.join(', '),
      summary: c.summary?.substring(0, 100)
    }));

    // Get the nuanced definition if it exists, otherwise use the label
    const vibeInstruction = VIBE_DEFINITIONS[selection.vibe] 
      ? `${selection.vibe} (${VIBE_DEFINITIONS[selection.vibe]})`
      : selection.vibe;

    const prompt = `
      Act as a film curator for a user.
      
      User Preferences:
      - Format: ${selection.type === 'any' ? 'Movies or TV Shows' : selection.type}
      - Familiarity: ${selection.history === 'unwatched' ? 'Something I have NOT seen' : selection.history === 'favorite' ? 'Something I have seen and loved' : 'Anything'}
      - The Vibe: "${vibeInstruction}"

      Below is a JSON list of available media in their library (ID, Title, Year, Genres, Summary).
      Select the SINGLE best match, and then select 6 strong alternative recommendations (Total 7 items).
      
      Candidates:
      ${JSON.stringify(candidateList)}

      Return a JSON array of 7 objects.
      
      IMPORTANT RULES:
      1. The first item in the array MUST be your absolute best recommendation (Top Pick).
      2. For "imdbRating" and "rottenTomatoesScore", provide the actual historical rating from your training data if possible.
      3. "score" must be a number between 0 and 100.
      
      Required Fields for each object:
      - id: (string) The exact id from the candidate list.
      - reason: (string) A short, punchy, persuasive sentence explaining why this fits the vibe.
      - score: (number) A relevance score from 0-100.
      - imdbRating: (string) The historical or estimated IMDB rating (e.g. "8.2").
      - rottenTomatoesScore: (string) The historical or estimated Rotten Tomatoes percentage (e.g. "94%").
    `;

    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash-lite',
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
              },
              required: ["id", "reason", "score", "imdbRating", "rottenTomatoesScore"]
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
          score: Math.round(p.score),
          imdbRating: p.imdbRating,
          rottenTomatoesScore: p.rottenTomatoesScore
        };
      }).filter((r): r is Recommendation => r !== null);

    } catch (e: any) {
      console.error("Gemini API Error Details:", JSON.stringify(e, null, 2));

      if (
        e.status === 503 || 
        e.code === 503 || 
        (e.message && e.message.toLowerCase().includes('overloaded'))
      ) {
        throw new Error("The AI service is currently at capacity. Please wait a moment and try again.");
      }
      
      throw e;
    }
  }
}
