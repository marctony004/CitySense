import React, { useState } from 'react';
import { INTEREST_OPTIONS, UserProfile, MOCK_TOP_ARTISTS } from '../types';

interface OnboardingProps {
  onComplete: (profileData: Partial<UserProfile>) => void;
}

export const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [name, setName] = useState('');
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [spotifyConnected, setSpotifyConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  const toggleInterest = (interest: string) => {
    setSelectedInterests(prev => 
      prev.includes(interest) 
        ? prev.filter(i => i !== interest)
        : [...prev, interest]
    );
  };

  const handleSpotifyConnect = () => {
    setIsConnecting(true);
    // Simulate API delay
    setTimeout(() => {
      setSpotifyConnected(true);
      setIsConnecting(false);
    }, 1500);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedInterests.length === 0) return;
    
    onComplete({
      name,
      interests: selectedInterests,
      spotifyConnected,
      topArtists: spotifyConnected ? MOCK_TOP_ARTISTS : []
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-xl w-full bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-200">
             <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
             </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome to CitySense</h1>
          <p className="text-gray-500">Your AI-powered travel companion. Tell us what you love, and we'll tell you where to go.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Name Input */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">What should we call you?</label>
            <input
              type="text"
              id="name"
              required
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
              placeholder="e.g. Alex"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          {/* Interests Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Select your interests (pick at least 1)</label>
            <div className="flex flex-wrap gap-2 max-h-60 overflow-y-auto p-1">
              {INTEREST_OPTIONS.map(interest => (
                <button
                  key={interest}
                  type="button"
                  onClick={() => toggleInterest(interest)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    selectedInterests.includes(interest)
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200 transform scale-105'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {interest}
                </button>
              ))}
            </div>
          </div>

          {/* Spotify Integration */}
          <div className="border-t border-gray-100 pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">Connect Music</h3>
                <p className="text-sm text-gray-500">We'll find events matching your top artists.</p>
              </div>
              <button
                type="button"
                onClick={handleSpotifyConnect}
                disabled={spotifyConnected || isConnecting}
                className={`flex items-center px-4 py-2 rounded-full font-medium transition-colors ${
                  spotifyConnected
                    ? 'bg-green-100 text-green-700 cursor-default'
                    : 'bg-[#1DB954] text-white hover:bg-[#1ed760]'
                }`}
              >
                {isConnecting ? (
                  <span className="animate-pulse">Connecting...</span>
                ) : spotifyConnected ? (
                   <>
                    <svg className="w-5 h-5 mr-1" fill="currentColor" viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
                    Connected
                   </>
                ) : (
                  <>
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141 4.32-1.38 9.841-.719 13.56 1.56.42.24.6.839.18 1.26zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.46-1.02 15.66 1.44.539.3.66.96.359 1.5-.3.54-.96.66-1.5.36z"/></svg>
                    Connect Spotify
                  </>
                )}
              </button>
            </div>
            {spotifyConnected && (
              <div className="mt-3 flex flex-wrap gap-2 animate-fade-in">
                {MOCK_TOP_ARTISTS.map(artist => (
                  <span key={artist} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700">
                    {artist}
                  </span>
                ))}
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={selectedInterests.length === 0}
            className={`w-full py-4 rounded-xl font-bold text-lg text-white shadow-lg transition-all ${
              selectedInterests.length > 0 
                ? 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-xl hover:translate-y-[-2px]' 
                : 'bg-gray-300 cursor-not-allowed'
            }`}
          >
            Start Exploring
          </button>
        </form>
      </div>
    </div>
  );
};