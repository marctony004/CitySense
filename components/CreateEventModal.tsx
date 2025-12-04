import React, { useState } from 'react';
import { EventItem, INTEREST_OPTIONS } from '../types';

interface CreateEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (event: EventItem) => void;
  currentCity: string;
}

export const CreateEventModal: React.FC<CreateEventModalProps> = ({ isOpen, onClose, onSubmit, currentCity }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    location: '',
    category: INTEREST_OPTIONS[0],
    price: '',
    imageUrl: '',
    link: ''
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Format Date: "2023-10-25" -> "Wed, Oct 25"
    const dateObj = new Date(`${formData.date}T${formData.time || '00:00'}`);
    const dateString = dateObj.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
    
    // Format Time: "19:00" -> "7:00 PM"
    const timeString = dateObj.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });

    const formattedDate = `${dateString} • ${timeString}`;

    const newEvent: EventItem = {
      id: `user-${Date.now()}`,
      title: formData.title,
      description: formData.description,
      date: formattedDate,
      location: formData.location || currentCity,
      category: formData.category,
      price: formData.price ? (formData.price === '0' ? 'Free' : `$${formData.price}`) : 'Free',
      imageUrl: formData.imageUrl || `https://picsum.photos/seed/${formData.title.replace(/\s/g, '')}/800/600`,
      link: formData.link || '#',
      recommendationLevel: 'Highly Recommended' as any, // User created events are promoted by default in UI logic usually
      isUserCreated: true
    };

    onSubmit(newEvent);
    onClose();
    
    // Reset form
    setFormData({
      title: '',
      description: '',
      date: '',
      time: '',
      location: '',
      category: INTEREST_OPTIONS[0],
      price: '',
      imageUrl: '',
      link: ''
    });
  };

  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      {/* Background backdrop */}
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={onClose}></div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        <div className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg w-full">
          <div className="bg-indigo-600 px-4 py-4 sm:px-6">
            <h3 className="text-lg leading-6 font-bold text-white" id="modal-title">
              Create New Event
            </h3>
            <p className="text-indigo-100 text-sm">Share an experience with the {currentCity} community.</p>
          </div>

          <form onSubmit={handleSubmit} className="px-4 pt-5 pb-4 sm:p-6 sm:pb-4 space-y-4">
            
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Event Title</label>
              <input 
                type="text" 
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="e.g. Sunset Yoga by the Bay"
                value={formData.title}
                onChange={e => setFormData({...formData, title: e.target.value})}
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Category</label>
              <select 
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                value={formData.category}
                onChange={e => setFormData({...formData, category: e.target.value})}
              >
                {INTEREST_OPTIONS.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>

            {/* Date & Time */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Date</label>
                <input 
                  type="date" 
                  required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  value={formData.date}
                  onChange={e => setFormData({...formData, date: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Time</label>
                <input 
                  type="time" 
                  required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  value={formData.time}
                  onChange={e => setFormData({...formData, time: e.target.value})}
                />
              </div>
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Location (Venue)</label>
              <input 
                type="text" 
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder={`e.g. Central Park, ${currentCity}`}
                value={formData.location}
                onChange={e => setFormData({...formData, location: e.target.value})}
              />
            </div>

            {/* Price */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Price ($)</label>
              <input 
                type="number" 
                min="0"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="0 for Free"
                value={formData.price}
                onChange={e => setFormData({...formData, price: e.target.value})}
              />
            </div>
            
            {/* Image URL */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Image URL (Optional)</label>
              <input 
                type="url" 
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="https://..."
                value={formData.imageUrl}
                onChange={e => setFormData({...formData, imageUrl: e.target.value})}
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <textarea 
                rows={3}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Tell people what to expect..."
                value={formData.description}
                onChange={e => setFormData({...formData, description: e.target.value})}
              />
            </div>

          </form>

          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button 
              type="button" 
              onClick={handleSubmit}
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm"
            >
              Post Event
            </button>
            <button 
              type="button" 
              onClick={onClose}
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};