import { GoogleGenAI } from "@google/genai";
import { EventItem, RecommendationLevel, UserProfile } from "../types";

// Helper to ensure API key exists
const getAIClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key not found");
  }
  return new GoogleGenAI({ apiKey });
};

const CACHE_KEY_PREFIX = 'CITYSENSE_EVENTS_CACHE_';

// Helper to generate a cache key based on context (City + Interests + Date)
const generateCacheKey = (city: string, userProfile: UserProfile): string => {
  const dateStr = new Date().toDateString(); // e.g. "Fri Oct 27 2023"
  const interestsStr = [...userProfile.interests].sort().join('-');
  // Sanitize city string to ensure key consistency
  const cityClean = city.replace(/\s+/g, '').toLowerCase();
  
  // We include interests in the key so if the user changes interests, we re-fetch
  return `${CACHE_KEY_PREFIX}${dateStr}_${cityClean}_${interestsStr}`;
};

// Helper to parse JSON from potential markdown code blocks
const cleanAndParseJSON = (text: string | undefined): any[] => {
  if (!text) return [];
  try {
    let clean = text.trim();
    // Remove markdown wrapping if present
    if (clean.startsWith('```json')) clean = clean.slice(7);
    if (clean.startsWith('```')) clean = clean.slice(3);
    if (clean.endsWith('```')) clean = clean.slice(0, -3);
    return JSON.parse(clean);
  } catch (e) {
    console.error("Failed to parse JSON from Gemini response:", text, e);
    return [];
  }
};

export const identifyCityFromCoords = async (lat: number, lng: number): Promise<string> => {
  try {
    const ai = getAIClient();
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `I am at latitude ${lat} and longitude ${lng}. What city and state/country is this? Return only the City, Country string (e.g. "Miami, USA").`,
    });
    return response.text?.trim() || "Unknown Location";
  } catch (error) {
    console.error("Error identifying city:", error);
    return "Unknown Location";
  }
};

const EVENT_STRUCTURE_HINT = `
RETURN ONLY A RAW JSON ARRAY. Do not use Markdown.
Each object in the array must strictly follow this structure:
{
  "id": "string",
  "title": "string",
  "description": "string",
  "date": "string (format: 'Mon, Oct 25 • 7:00 PM')",
  "location": "string (Venue name)",
  "category": "string (e.g., Music, Food, Arts)",
  "price": "string (e.g., 'Free', '$20')",
  "recommendationLevel": "Highly Recommended" | "Consider" | "Not Recommended",
  "justification": "string",
  "link": "string (URL to buy tickets or view event info)",
  "imageUrl": "string (URL to an image of the event/venue if found)",
  "coordinates": { "lat": number, "lng": number }
}
`;

export const searchEvents = async (city: string, query: string): Promise<EventItem[]> => {
  try {
    const ai = getAIClient();
    const prompt = `
      Act as a local event discovery agent for ${city}.
      User Search Query: "${query}".
      
      Search for 6 to 10 distinct, real events happening in ${city} coming up soon that match the search query.
      
      Requirements:
      1. Relevance: Strictly match the query (e.g., if "Jazz", only Jazz events).
      2. Data Quality:
         - Date: Format as "Mon, Oct 25 • 7:00 PM".
         - Price: "Free", "$20", etc.
         - Location: Venue name.
         - Link: Provide a real URL to the event page if found.
      3. Coordinates: Provide estimated lat/lng.
      
      ${EVENT_STRUCTURE_HINT}
    `;
    
    // Note: When using googleSearch tool, we CANNOT use responseSchema or responseMimeType.
    // We must rely on the prompt to format the JSON.
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      }
    });

    let events = cleanAndParseJSON(response.text) as EventItem[];
    
    // Add stable random IDs and placeholder images if missing
    events = events.map((ev, idx) => ({
      ...ev,
      id: ev.id || `search-${city.substring(0,3)}-${idx}-${Date.now()}`,
      // Fallback logic handled in component, but provide a seed here just in case
      imageUrl: ev.imageUrl || `https://picsum.photos/seed/${ev.title.replace(/\s/g, '')}${idx}/800/600`,
      // Fallback link to Google Search if the model didn't find a direct link
      link: ev.link || `https://www.google.com/search?q=${encodeURIComponent(ev.title + ' ' + city + ' tickets')}`
    }));

    return events;
  } catch (error) {
    console.error("Search error:", error);
    return [];
  }
};

export const getInitialRecommendations = async (city: string, userProfile: UserProfile): Promise<EventItem[]> => {
  // 1. Check Cache
  const cacheKey = generateCacheKey(city, userProfile);
  const cachedData = localStorage.getItem(cacheKey);
  
  if (cachedData) {
    try {
      const parsedEvents = JSON.parse(cachedData);
      console.log("LOG: Using cached events for today.");
      return parsedEvents;
    } catch (e) {
      console.warn("LOG: Cache corrupted, fetching fresh data.");
      localStorage.removeItem(cacheKey);
    }
  }

  // 2. Clean up old caches to save space (remove any key starting with prefix that isn't today's key)
  Object.keys(localStorage).forEach(key => {
    if (key.startsWith(CACHE_KEY_PREFIX) && key !== cacheKey) {
      localStorage.removeItem(key);
    }
  });

  // 3. Fetch Fresh Data
  try {
    const ai = getAIClient();
    // Prompt engineered to mimic an event aggregator like Eventbrite
    const prompt = `
      Act as a local event discovery agent for ${city}.
      User Interests: ${userProfile.interests.join(", ")}.
      ${userProfile.spotifyConnected ? `User's Top Artists: ${userProfile.topArtists.join(", ")}.` : ""}
      
      Scan for 8 to 12 distinct, real, or realistic events happening in ${city} today or this upcoming weekend.
      
      Requirements:
      1. Variety: Include a mix of Music, Nightlife, Food, Arts, and Workshops.
      2. Relevance: Prioritize events matching the user's interests (${userProfile.interests.join(", ")}), but also include popular general events.
      3. Data Quality:
         - Date: Format as "Mon, Oct 25 • 7:00 PM" (Day, Month Date • Time).
         - Price: "Free", "Starts at $20", or "$50".
         - Location: Venue name and neighborhood (e.g. "The Fillmore, South Beach").
         - Link: Provide a real URL to the event page or ticket site.
      4. Coordinates: Provide estimated lat/lng for mapping.
      
      Rank them based on the user's profile.

      ${EVENT_STRUCTURE_HINT}
    `;

    // Note: When using googleSearch tool, we CANNOT use responseSchema or responseMimeType.
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }], // Enable grounding to find real events
      }
    });

    let events = cleanAndParseJSON(response.text) as EventItem[];
    
    // Add stable random IDs and placeholder images if missing
    events = events.map((ev, idx) => ({
      ...ev,
      // Use a stable ID structure so saving events works across reloads if data is cached
      id: ev.id || `evt-${city.substring(0,3)}-${idx}-${Date.now()}`,
      imageUrl: ev.imageUrl || `https://picsum.photos/seed/${ev.title.replace(/\s/g, '')}${idx}/800/600`,
      // Fallback link to Google Search if the model didn't find a direct link
      link: ev.link || `https://www.google.com/search?q=${encodeURIComponent(ev.title + ' ' + city + ' tickets')}`
    }));

    // 4. Save to Cache
    if (events.length > 0) {
        localStorage.setItem(cacheKey, JSON.stringify(events));
    }

    return events;

  } catch (error) {
    console.error("Error fetching recommendations:", error);
    return [];
  }
};

export const chatWithCitySense = async (
  history: { role: 'user' | 'model'; text: string }[],
  currentMessage: string,
  userProfile: UserProfile
): Promise<{ text: string; events?: EventItem[] }> => {
  try {
    const ai = getAIClient();
    
    const systemInstruction = `
      You are CitySense, an expert AI travel planner and concierge.
      User Profile:
      - Interests: ${userProfile.interests.join(", ")}
      - Current City: ${userProfile.currentCity}
      ${userProfile.spotifyConnected ? `- Top Artists: ${userProfile.topArtists.join(", ")}` : ""}

      Your goal is to provide curated, context-aware recommendations.
      When suggesting specific venues, events, or restaurants, ALWAYS try to rank them as "Highly Recommended", "Consider", or "Not Recommended" with a brief justification.
      Be conversational, helpful, and concise. 
      If the user asks about specific music genres (like Afrobeats, R&B), prioritize those.
      If the user asks about their favorite artists, check if they are in town using search.
    `;

    // Construct the history for the API
    const chat = ai.chats.create({
      model: 'gemini-2.5-flash',
      config: {
        systemInstruction,
        tools: [{ googleSearch: {} }]
      },
      history: history.map(h => ({
        role: h.role,
        parts: [{ text: h.text }]
      }))
    });

    const result = await chat.sendMessage({ message: currentMessage });
    
    // Check for grounding metadata (sources) and append them
    let responseText = result.text || "";
    
    const groundingChunks = result.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    if (groundingChunks.length > 0) {
      const sourcesList = groundingChunks
        .map((chunk: any) => {
          if (chunk.web?.uri && chunk.web?.title) {
            return `- [${chunk.web.title}](${chunk.web.uri})`;
          }
          return null;
        })
        .filter((item: string | null) => item !== null);

      if (sourcesList.length > 0) {
        // Deduplicate sources
        const uniqueSources = Array.from(new Set(sourcesList));
        responseText += `\n\n**Sources:**\n${uniqueSources.join('\n')}`;
      }
    }

    return {
      text: responseText
    };

  } catch (error) {
    console.error("Chat error:", error);
    return { text: "I'm having trouble connecting to the city network right now. Please try again." };
  }
};