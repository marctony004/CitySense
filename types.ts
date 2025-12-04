export interface UserProfile {
  name: string;
  hasOnboarded: boolean;
  interests: string[];
  spotifyConnected: boolean;
  topArtists: string[];
  currentCity: string;
}

export enum RecommendationLevel {
  HIGHLY_RECOMMENDED = 'Highly Recommended',
  CONSIDER = 'Consider',
  NOT_RECOMMENDED = 'Not Recommended'
}

export interface EventItem {
  id: string;
  title: string;
  description: string;
  date: string;
  location: string;
  category: string;
  imageUrl?: string;
  link?: string;
  recommendationLevel?: RecommendationLevel;
  justification?: string;
  price?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  isUserCreated?: boolean;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  isThinking?: boolean;
  suggestedEvents?: EventItem[];
}

export const INTEREST_OPTIONS = [
  "Live Music", "Techno & House", "Afrobeats", "R&B", "Jazz", "Opera",
  "Art Galleries", "Museums", "Thrifting", "Vintage Markets",
  "Fine Dining", "Street Food", "Brunch", "Cocktail Bars", "Clubs",
  "Comedy Shows", "Theater", "Sports", "Outdoor Activities", "Tech Meetups"
];

export const MOCK_TOP_ARTISTS = [
  "Burna Boy", "SZA", "Fred again..", "Kaytranada", "Beyoncé"
];