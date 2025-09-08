

import { useState, useEffect } from 'react';
import { UserIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import DemographicsForm from './DemographicsForm';

export default function DemographicsCheck({ children, onDemographicsComplete }) {
  const [demographics, setDemographics] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if we're in the browser
    if (typeof window === 'undefined') {
      setIsLoading(false);
      return;
    }
    
    // Check for demographic data
    const savedData = localStorage.getItem('benehab_demographics');
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        if (parsed.name && parsed.gender && parsed.weight && parsed.height && parsed.age) {
          setDemographics(parsed);
          if (onDemographicsComplete) {
            onDemographicsComplete(parsed);
          }
        }
      } catch (e) {
        console.error('Error loading demographic data:', e);
      }
    }
    setIsLoading(false);
  }, [onDemographicsComplete]);

  const handleDemographicsComplete = (data) => {
    setDemographics(data);
    setShowForm(false);
    if (onDemographicsComplete) {
      onDemographicsComplete(data);
    }
  };

  const openForm = () => {
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // If demographic data is not filled, show warning
  if (!demographics) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6 text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-yellow-100 mb-4">
            <ExclamationTriangleIcon className="h-8 w-8 text-yellow-600" />
          </div>
          
          <h2 className="text-xl font-semibold text-gray-900 mb-3">
            Tell us about yourself first
          </h2>
          
          <p className="text-gray-600 mb-6">
            To start working with the system, you need to fill in basic information about yourself. 
            This will help Tatiana, your personal agent, better understand you and adapt her communication style.
          </p>
          
          <button
            onClick={openForm}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors flex items-center justify-center"
          >
            <UserIcon className="h-5 w-5 mr-2" />
            Fill in Data
          </button>
        </div>

        {/* Demographic data form */}
        <DemographicsForm
          isOpen={showForm}
          onClose={closeForm}
          onComplete={handleDemographicsComplete}
        />
      </div>
    );
  }

  // If data is filled, show main content
  return (
    <>
      {children}
      
      {/* Form for editing (if needed) */}
      <DemographicsForm
        isOpen={showForm}
        onClose={closeForm}
        onComplete={handleDemographicsComplete}
      />
    </>
  );
}
