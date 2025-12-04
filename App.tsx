import React, { useState, useEffect } from 'react';
import { Onboarding } from './components/Onboarding';
import { Dashboard } from './components/Dashboard';
import { Navbar } from './components/Navbar';
import { CreateEventModal } from './components/CreateEventModal';
import { UserProfile, EventItem } from './types';

function App() {
  // Initialize state from localStorage if available
  const [userProfile, setUserProfile] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem('citysense_user_profile');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      console.error("Failed to load profile", e);
      return null;
    }
  });

  // User created events state
  const [userEvents, setUserEvents] = useState<EventItem[]>(() => {
    try {
      const saved = localStorage.getItem('citysense_user_events');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Persist profile changes to localStorage
  useEffect(() => {
    if (userProfile) {
      localStorage.setItem('citysense_user_profile', JSON.stringify(userProfile));
    } else {
      localStorage.removeItem('citysense_user_profile');
    }
  }, [userProfile]);

  // Persist user events
  useEffect(() => {
    localStorage.setItem('citysense_user_events', JSON.stringify(userEvents));
  }, [userEvents]);

  const handleOnboardingComplete = (data: Partial<UserProfile>) => {
    setUserProfile({
      name: data.name || 'Traveler',
      hasOnboarded: true,
      interests: data.interests || [],
      spotifyConnected: data.spotifyConnected || false,
      topArtists: data.topArtists || [],
      currentCity: '' // Will be detected in Dashboard or set manually
    });
  };

  const handleReset = () => {
    setUserProfile(null);
    // Clear the daily cache as well if the user does a hard reset
    Object.keys(localStorage).forEach(key => {
        if(key.startsWith('CITYSENSE_EVENTS_CACHE_')) {
            localStorage.removeItem(key);
        }
    });
  };
  
  const handleUpdateCity = (city: string) => {
    if (userProfile && userProfile.currentCity !== city) {
        setUserProfile({ ...userProfile, currentCity: city });
    }
  };

  const handleCreateEvent = (event: EventItem) => {
    setUserEvents(prev => [event, ...prev]);
  };

  if (!userProfile) {
    return <Onboarding onComplete={handleOnboardingComplete} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar 
        onReset={handleReset} 
        city={userProfile.currentCity} 
        onCreateEvent={() => setIsCreateModalOpen(true)}
      />
      <main>
        <Dashboard 
          userProfile={userProfile} 
          updateCity={handleUpdateCity} 
          userEvents={userEvents}
        />
      </main>

      <CreateEventModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateEvent}
        currentCity={userProfile.currentCity || 'your city'}
      />
    </div>
  );
}

export default App;