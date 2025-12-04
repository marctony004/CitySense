import React, { useEffect, useState, useMemo } from 'react';
import { EventItem, UserProfile } from '../types';
import { EventCard } from './EventCard';
import { ChatPlanner } from './ChatPlanner';
import { MapView } from './MapView';
import { getInitialRecommendations, identifyCityFromCoords, searchEvents } from '../services/geminiService';

interface DashboardProps {
  userProfile: UserProfile;
  updateCity: (city: string) => void;
  userEvents?: EventItem[];
}

const CATEGORY_ICONS: Record<string, string> = {
    'All': '📅',
    'Music': '🎵',
    'Nightlife': '🥂',
    'Food': '🍽️',
    'Arts': '🎭',
    'Health': '🧘',
    'Business': '💼',
    'Free': '🎟️'
};

export const Dashboard: React.FC<DashboardProps> = ({ userProfile, updateCity, userEvents = [] }) => {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingStep, setLoadingStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Filter & Sort State
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');

  // Scanning animation steps
  useEffect(() => {
    if (loading) {
      const interval = setInterval(() => {
        setLoadingStep(prev => (prev + 1) % 4);
      }, 800);
      return () => clearInterval(interval);
    }
  }, [loading]);

  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        let currentCity = userProfile.currentCity;

        // Try geolocation if no city set or default
        if (!currentCity) {
          if ("geolocation" in navigator) {
            try {
                const position = await new Promise<GeolocationPosition>((resolve, reject) => {
                    navigator.geolocation.getCurrentPosition(resolve, reject);
                });
                const { latitude, longitude } = position.coords;
                currentCity = await identifyCityFromCoords(latitude, longitude);
                updateCity(currentCity);
            } catch (geoError) {
                console.warn("Geolocation failed or denied", geoError);
                currentCity = "New York, USA"; // Fallback
                updateCity(currentCity);
            }
          } else {
             currentCity = "New York, USA"; // Fallback
             updateCity(currentCity);
          }
        }

        const recommendedEvents = await getInitialRecommendations(currentCity, userProfile);
        setEvents(recommendedEvents);
      } catch (err) {
        setError("Failed to load events. Please try refreshing.");
      } finally {
        setLoading(false);
      }
    };

    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); 

  const handleSearch = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!searchQuery.trim()) return;
      
      setLoading(true);
      setCategoryFilter('All');
      try {
          const results = await searchEvents(userProfile.currentCity, searchQuery);
          setEvents(results);
      } catch (err) {
          setError("Search failed. Please try again.");
      } finally {
          setLoading(false);
      }
  };

  // Combine AI events with User events for display
  const allEvents = useMemo(() => {
    // We prioritize user events at the top if they match the city, 
    // but for this demo we'll just prepend all user events since we want to see them immediately.
    // In a real app, filtering userEvents by currentCity would be better.
    return [...userEvents, ...events];
  }, [events, userEvents]);

  // Derived state for available categories logic (combining static important ones with dynamic)
  const availableCategories = useMemo(() => {
      const dynamicCats = new Set(allEvents.map(e => e.category).filter(Boolean));
      // Ensure specific ones exist if we have data for them, but for the main UI we use static list
      return ['All', 'Music', 'Nightlife', 'Food', 'Arts', ...Array.from(dynamicCats)].filter((v, i, a) => a.indexOf(v) === i);
  }, [allEvents]);

  // Filtering Logic
  const filteredEvents = useMemo(() => {
    let result = [...allEvents];
    if (categoryFilter !== 'All') {
        // Loose matching for cleaner UX (e.g. "Live Music" matches "Music")
        result = result.filter(e => e.category?.includes(categoryFilter) || e.category === categoryFilter);
    }
    return result;
  }, [allEvents, categoryFilter]);

  const topPicks = useMemo(() => {
      return allEvents.filter(e => e.recommendationLevel === 'Highly Recommended' || e.isUserCreated);
  }, [allEvents]);

  return (
    <div className="min-h-screen bg-white pb-12">
        {/* Loading Overlay */}
        {loading && (
            <div className="fixed inset-0 bg-white/95 z-50 flex flex-col items-center justify-center p-4 text-center backdrop-blur-sm">
                <div className="w-16 h-16 bg-indigo-600 rounded-full flex items-center justify-center mb-6 shadow-xl animate-pulse">
                    <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">CitySense Agent</h2>
                <div className="h-6 overflow-hidden relative">
                    <p className="text-gray-500 font-medium transition-all duration-300 transform">
                        {loadingStep === 0 && `Connecting to ${userProfile.currentCity} network...`}
                        {loadingStep === 1 && "Scanning for trending events..."}
                        {loadingStep === 2 && "Analyzing matches for your profile..."}
                        {loadingStep === 3 && "Curating your dashboard..."}
                    </p>
                </div>
            </div>
        )}

      {/* Hero Section */}
      <div className="relative bg-[#1e0a3c] text-white overflow-hidden">
        <div className="absolute inset-0">
             <img 
                src="https://images.unsplash.com/photo-1459749411177-287ce3288784?q=80&w=2070&auto=format&fit=crop" 
                alt="Event background" 
                className="w-full h-full object-cover opacity-30"
            />
             <div className="absolute inset-0 bg-gradient-to-r from-[#1e0a3c] via-[#1e0a3c]/80 to-transparent"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6 max-w-3xl">
                Find your next experience in <span className="text-indigo-400">{userProfile.currentCity}</span>.
            </h1>
            
            {/* Functional Search Bar */}
            <form onSubmit={handleSearch} className="bg-white p-2 rounded-lg shadow-2xl max-w-4xl flex items-center gap-2 transform transition-transform focus-within:scale-[1.01]">
                <div className="flex-1 px-4 py-2 border-r border-gray-200">
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Looking for</label>
                    <input 
                        type="text" 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Jazz, Art Basel, Food Festivals..." 
                        className="w-full text-gray-900 font-bold text-lg focus:outline-none placeholder-gray-300" 
                    />
                </div>
                <div className="hidden md:block w-1/3 px-4 py-2">
                     <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">In</label>
                     <div className="text-gray-900 font-bold text-lg truncate">{userProfile.currentCity}</div>
                </div>
                <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white p-4 rounded-md transition-colors shadow-md">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </button>
            </form>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-10 pb-12">
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            
            <div className="lg:col-span-3 space-y-12">
                
                {/* Trending Categories (Circles) */}
                <section className="bg-white pt-8">
                    <h3 className="text-lg font-bold text-gray-900 mb-6">Check out trending categories</h3>
                    <div className="flex overflow-x-auto gap-8 pb-4 scrollbar-hide">
                        {['Music', 'Nightlife', 'Food', 'Arts', 'Health', 'Free', 'All'].map(cat => (
                             <button 
                                key={cat}
                                onClick={() => setCategoryFilter(cat)}
                                className="flex flex-col items-center gap-3 group min-w-[80px]"
                            >
                                <div className={`w-20 h-20 rounded-full flex items-center justify-center text-3xl shadow-sm border border-gray-100 transition-all group-hover:shadow-md ${categoryFilter === cat ? 'bg-indigo-50 border-indigo-200 ring-2 ring-indigo-500 ring-offset-2' : 'bg-white hover:bg-gray-50'}`}>
                                    {CATEGORY_ICONS[cat] || '📅'}
                                </div>
                                <span className={`text-sm font-semibold ${categoryFilter === cat ? 'text-indigo-600' : 'text-gray-700'}`}>
                                    {cat}
                                </span>
                            </button>
                        ))}
                    </div>
                </section>

                {/* View Toggle */}
                <div className="flex justify-between items-center border-b border-gray-100 pb-4">
                    <h2 className="text-2xl font-bold text-gray-900">
                        {categoryFilter === 'All' ? `Events in ${userProfile.currentCity}` : `${categoryFilter} Events`}
                    </h2>
                    <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
                        <button 
                            onClick={() => setViewMode('list')}
                            className={`p-2 rounded-md transition-all ${viewMode === 'list' ? 'bg-white shadow text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            <span className="sr-only">List View</span>
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>
                        </button>
                        <button 
                             onClick={() => setViewMode('map')}
                             className={`p-2 rounded-md transition-all ${viewMode === 'map' ? 'bg-white shadow text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                             <span className="sr-only">Map View</span>
                             <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg>
                        </button>
                    </div>
                </div>

                {/* Main Content Area */}
                {viewMode === 'list' ? (
                    <div className="space-y-12">
                        {/* Best Matches Collection (Carousel style) */}
                        {topPicks.length > 0 && categoryFilter === 'All' && (
                            <section>
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-xl font-bold text-gray-900">Best Matches & Local Picks</h3>
                                    <span className="text-sm font-medium text-indigo-600 cursor-pointer hover:underline">See all</span>
                                </div>
                                <div className="flex gap-6 overflow-x-auto pb-6 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
                                    {topPicks.map(event => (
                                        <div key={event.id} className="min-w-[280px] w-[280px] h-full">
                                            <EventCard event={event} />
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* All Events Grid */}
                        <section>
                            <h3 className="text-xl font-bold text-gray-900 mb-6">
                                {categoryFilter === 'All' ? 'Upcoming Events' : 'Results'}
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-10">
                                {filteredEvents.map(event => (
                                    <div key={event.id}>
                                        <EventCard event={event} />
                                    </div>
                                ))}
                            </div>
                             {filteredEvents.length === 0 && !loading && (
                                <div className="text-center py-24 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                                    <div className="text-4xl mb-4">🔍</div>
                                    <h3 className="text-lg font-bold text-gray-900">No events found</h3>
                                    <p className="text-gray-500 mb-4">Try adjusting your filters or search query.</p>
                                    <button onClick={() => {setCategoryFilter('All'); setSearchQuery('')}} className="text-indigo-600 font-medium hover:underline">Clear all filters</button>
                                </div>
                            )}
                        </section>
                    </div>
                ) : (
                    <MapView events={filteredEvents} />
                )}
            </div>

            {/* Sidebar (Promo) */}
            <div className="hidden lg:block lg:col-span-1 pt-8">
                 <div className="sticky top-24 space-y-6">
                    {/* Promo Box */}
                    <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-6 text-indigo-900 shadow-sm">
                        <h3 className="font-bold text-lg mb-2 flex items-center gap-2">
                            <span>✨</span> 
                            Trip Planner
                        </h3>
                        <p className="text-indigo-700/80 text-sm mb-4">
                            Need a full itinerary? Ask CitySense to plan your entire weekend. Click the icon in the bottom right corner to start chatting.
                        </p>
                    </div>
                 </div>
            </div>
        </div>
      </div>
      
      {/* Floating Chat Planner */}
      <ChatPlanner userProfile={userProfile} />
    </div>
  );
};