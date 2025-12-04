import React, { useState, useEffect } from 'react';
import { EventItem, RecommendationLevel } from '../types';

interface EventCardProps {
  event: EventItem;
  variant?: 'vertical' | 'horizontal';
}

export const EventCard: React.FC<EventCardProps> = ({ event, variant = 'vertical' }) => {
  const [isSaved, setIsSaved] = useState(false);
  const [imgSrc, setImgSrc] = useState(event.imageUrl);

  useEffect(() => {
    try {
      const savedEvents = JSON.parse(localStorage.getItem('savedEvents') || '[]');
      if (Array.isArray(savedEvents) && savedEvents.includes(event.id)) {
        setIsSaved(true);
      }
    } catch (e) {
      console.error("Failed to parse saved events", e);
    }
  }, [event.id]);

  const toggleSave = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    try {
      const savedEvents = JSON.parse(localStorage.getItem('savedEvents') || '[]');
      let newSavedEvents: string[] = Array.isArray(savedEvents) ? savedEvents : [];
      
      if (isSaved) {
        newSavedEvents = newSavedEvents.filter((id: string) => id !== event.id);
      } else {
        if (!newSavedEvents.includes(event.id)) {
          newSavedEvents.push(event.id);
        }
      }
      
      localStorage.setItem('savedEvents', JSON.stringify(newSavedEvents));
      setIsSaved(!isSaved);
    } catch (e) {
      console.error("Failed to save event", e);
    }
  };

  const handleImageError = () => {
    // Fallback to a nice generic event placeholder if the AI provided image fails
    setImgSrc(`https://picsum.photos/seed/${event.title.replace(/\s/g, '')}backup/800/600`);
  };

  return (
    <a 
      href={event.link} 
      target="_blank" 
      rel="noopener noreferrer" 
      className="block bg-white group cursor-pointer h-full flex flex-col hover:shadow-lg transition-shadow rounded-xl"
    >
      {/* Image Section */}
      <div className="relative aspect-[3/2] overflow-hidden rounded-t-xl md:rounded-xl">
        <img 
          src={imgSrc} 
          onError={handleImageError}
          alt={event.title} 
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        
        {/* Badges Overlay */}
        <div className="absolute top-3 left-3 flex gap-2">
            {event.category && (
                <span className="bg-white/95 backdrop-blur-md px-2 py-1 rounded text-xs font-bold text-gray-700 shadow-sm">
                    {event.category}
                </span>
            )}
            {event.recommendationLevel === RecommendationLevel.HIGHLY_RECOMMENDED && (
                 <span className="bg-green-500 text-white px-2 py-1 rounded text-xs font-bold shadow-sm">
                    Best Match
                </span>
            )}
        </div>

        {/* Save Button Overlay */}
        <button
          onClick={toggleSave}
          className="absolute top-3 right-3 p-2 rounded-full bg-white/80 hover:bg-white text-gray-500 hover:text-red-500 transition-all shadow-sm z-10"
        >
           <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className={`w-5 h-5 transition-colors duration-200 ${isSaved ? 'text-red-500 fill-current' : ''}`}
            viewBox="0 0 24 24" 
            stroke="currentColor" 
            strokeWidth={isSaved ? "0" : "2"}
            fill={isSaved ? "currentColor" : "none"}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </button>
      </div>
      
      {/* Content Section */}
      <div className="pt-3 pb-4 px-1 flex flex-col flex-grow">
        <h3 className="text-lg font-bold text-gray-900 leading-tight group-hover:text-indigo-600 transition-colors mb-1 line-clamp-2">
            {event.title}
        </h3>
        
        <div className="text-sm font-semibold text-red-600 mb-1">
            {event.date}
        </div>
        
        <div className="text-sm text-gray-500 mb-2 truncate">
            {event.location}
        </div>
        
        <div className="mt-auto flex items-center justify-between">
            {event.price && (
                <span className="text-sm text-gray-700 font-medium">
                    {event.price}
                </span>
            )}
            <div className="flex items-center gap-2">
                {/* External Link Icon */}
                <span className="p-1 rounded-full bg-gray-50 text-gray-400 group-hover:text-indigo-600 transition-colors">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                </span>
                
                {event.recommendationLevel === RecommendationLevel.HIGHLY_RECOMMENDED && (
                    <div className="flex -space-x-1 overflow-hidden">
                        <div className="inline-block h-5 w-5 rounded-full ring-2 ring-white bg-indigo-100 flex items-center justify-center text-[10px]">🔥</div>
                    </div>
                )}
            </div>
        </div>
      </div>
    </a>
  );
};