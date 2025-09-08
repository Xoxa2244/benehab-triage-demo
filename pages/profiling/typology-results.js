

import { useState, useEffect } from 'react';
import Link from 'next/link';
import TatianaMessage from '../../components/TatianaMessage';

export default function TypologyResults() {
  const [profile, setProfile] = useState(null);
  const [demographics, setDemographics] = useState(null);
  const [showTatianaMessage, setShowTatianaMessage] = useState(false);

  useEffect(() => {
    // Check that we are in browser
    if (typeof window === 'undefined') return;
    
    // Load psychotype profile
    const savedProfile = localStorage.getItem('benehab_typology_profile');
    if (savedProfile) {
      try {
        setProfile(JSON.parse(savedProfile));
      } catch (e) {
        console.error('Error loading profile:', e);
      }
    }

    // Load demographic data
    const savedDemographics = localStorage.getItem('benehab_demographics');
    if (savedDemographics) {
      try {
        setDemographics(JSON.parse(savedDemographics));
      } catch (e) {
        console.error('Error loading demographics:', e);
      }
    }

    // Show Tatiana's message after a short delay
    setTimeout(() => {
      setShowTatianaMessage(true);
    }, 1000);
  }, []);

  const closeTatianaMessage = () => {
    setShowTatianaMessage(false);
  };

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🧠</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Profile Not Found</h1>
          <p className="text-gray-600 mb-6">Please complete the psychotype survey first</p>
          <Link
            href="/profiling/typology"
            className="inline-flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Take Survey
          </Link>
        </div>
      </div>
    );
  }

  const getTypeName = (type) => {
    const typeNames = {
      sensitive: 'Sensitive',
      dysthymic: 'Dysthymic',
      demonstrative: 'Demonstrative',
      excitable: 'Excitable',
      cyclothymic: 'Cyclothymic',
      stuck: 'Stuck',
      pedantic: 'Pedantic',
      anxious: 'Anxious',
      hyperthymic: 'Hyperthymic'
    };
    return typeNames[type] || type;
  };

  const getTypeDescription = (type) => {
    const descriptions = {
      sensitive: 'Vulnerability, high sensitivity, tendency to somatic complaints and fatigue.',
      dysthymic: 'Tendency to self-criticism, guilt feelings, low motivation.',
      demonstrative: 'Love of attention, desire to make an impression.',
      excitable: 'Impulsiveness, quick actions, emotional outbursts.',
      cyclothymic: 'Mood and activity variability.',
      stuck: 'Persistence, principledness, duration of experiences.',
      pedantic: 'Caution, love of order, detail-oriented.',
      anxious: 'Tendency to worry, suspiciousness.',
      hyperthymic: 'Energy, optimism, activity.'
    };
    return descriptions[type] || 'Type description not found.';
  };

  const getTypeColor = (type) => {
    const colors = {
      sensitive: 'bg-pink-100 text-pink-800 border-pink-200',
      dysthymic: 'bg-blue-100 text-blue-800 border-blue-200',
      demonstrative: 'bg-purple-100 text-purple-800 border-purple-200',
      excitable: 'bg-red-100 text-red-800 border-red-200',
      cyclothymic: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      stuck: 'bg-orange-100 text-orange-800 border-orange-200',
      pedantic: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      anxious: 'bg-gray-100 text-gray-800 border-gray-200',
      hyperthymic: 'bg-green-100 text-green-800 border-green-200'
    };
    return colors[type] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Survey Results: Psychotype
          </h1>
          <p className="text-lg text-gray-600">
            Your psychological type analysis is complete
          </p>
        </div>

        {/* Dominant type */}
        {profile.dominant_type && (
          <div className="bg-white rounded-lg shadow-lg border p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Dominant Psychotype</h2>
            <div className={`border rounded-lg p-6 ${getTypeColor(profile.dominant_type)}`}>
              <h3 className="text-2xl font-bold mb-3">
                {getTypeName(profile.dominant_type)}
              </h3>
              <p className="text-lg leading-relaxed">
                {getTypeDescription(profile.dominant_type)}
              </p>
            </div>
          </div>
        )}

        {/* All types with their values */}
        {profile.types && (
          <div className="bg-white rounded-lg shadow-lg border p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">All Psychotypes</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(profile.types).map(([type, value]) => (
                <div key={type} className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">
                      {getTypeName(type)}
                    </span>
                    <span className={`text-lg font-bold ${
                      value > 0.6 ? 'text-green-600' : value > 0.3 ? 'text-yellow-600' : 'text-gray-600'
                    }`}>
                      {Math.round(value * 100)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        value > 0.6 ? 'bg-green-500' : value > 0.3 ? 'bg-yellow-500' : 'bg-gray-400'
                      }`}
                      style={{ width: `${value * 100}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {value > 0.6 ? 'High' : value > 0.3 ? 'Medium' : 'Low'} level
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Communication recommendations */}
        <div className="bg-white rounded-lg shadow-lg border p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Communication Recommendations</h2>
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                <span className="text-green-600 text-sm">✓</span>
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Style Adaptation</h3>
                <p className="text-gray-600">
                  Tatiana will take into account the characteristics of your psychotype and adapt her communication style 
                  for maximum comfort and effectiveness.
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                <span className="text-blue-600 text-sm">💡</span>
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Next Steps</h3>
                <p className="text-gray-600">
                  Continue profiling by taking the values survey to get a complete picture 
                  of your personality and value system.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/profiling/values"
            className="inline-flex items-center justify-center px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <span className="mr-2">💎</span>
            Next Survey: Values
          </Link>
          <Link
            href="/communication-instructions"
            className="inline-flex items-center justify-center px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <span className="mr-2">📋</span>
            Communication Instructions
          </Link>
          <Link
            href="/"
            className="inline-flex items-center justify-center px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            <span className="mr-2">🏠</span>
            Home
          </Link>
        </div>
      </div>

      {/* Message from Tatiana */}
      <TatianaMessage
        demographics={demographics}
        surveyType="typology"
        surveyResults={profile}
        isVisible={showTatianaMessage}
        onClose={closeTatianaMessage}
      />
    </div>
  );
}
