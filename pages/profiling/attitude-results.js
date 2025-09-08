

import { useState, useEffect } from 'react';
import Link from 'next/link';
import TatianaMessage from '../../components/TatianaMessage';

export default function AttitudeResults() {
  const [profile, setProfile] = useState(null);
  const [demographics, setDemographics] = useState(null);
  const [showTatianaMessage, setShowTatianaMessage] = useState(false);

  useEffect(() => {
    // Check that we are in browser
    if (typeof window === 'undefined') return;
    
    // Load health attitude profile
    const savedProfile = localStorage.getItem('benehab_attitude_profile');
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

    // Debug information
    console.log('🚨 === ATTITUDE RESULTS DEBUG === 🚨');
    console.log('Profile loaded from localStorage:', profile);
    if (profile) {
      console.log('Profile keys:', Object.keys(profile));
      if (profile.levels) {
        console.log('Levels keys:', Object.keys(profile.levels));
        console.log('Levels values:', profile.levels);
      }
      if (profile.risk_tags) {
        console.log('Risk tags:', profile.risk_tags);
      }
      if (profile.comm_flags) {
        console.log('Communication flags:', profile.comm_flags);
      }
    }
    console.log('🚨 === END ATTITUDE RESULTS DEBUG === 🚨');
  }, []);

  const closeTatianaMessage = () => {
    setShowTatianaMessage(false);
  };

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">📋</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Profile Not Found</h1>
          <p className="text-gray-600 mb-6">Please complete the health attitude survey first</p>
          <Link
            href="/profiling/attitude"
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Take Survey
          </Link>
        </div>
      </div>
    );
  }

  const getScaleColor = (value) => {
    if (value >= 7) return 'text-red-600';
    if (value >= 4) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getScaleLabel = (value) => {
    if (value >= 7) return 'High';
    if (value >= 4) return 'Medium';
    return 'Low';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Survey Results: Health Attitude
          </h1>
          <p className="text-lg text-gray-600">
            Your psychological profile analysis is complete
          </p>
        </div>

        {/* Main results */}
        <div className="bg-white rounded-lg shadow-lg border p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Key Indicators</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(profile.scales || {}).map(([scale, value]) => (
              <div key={scale} className="p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700 capitalize">
                    {scale.replace(/_/g, ' ')}
                  </span>
                  <span className={`text-lg font-bold ${getScaleColor(value)}`}>
                    {value}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      value >= 7 ? 'bg-red-500' : value >= 4 ? 'bg-yellow-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${(value / 10) * 100}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {getScaleLabel(value)} level
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Dominant type */}
        {profile.dominant_type && (
          <div className="bg-white rounded-lg shadow-lg border p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Dominant Type</h2>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-lg font-medium text-blue-900 mb-2">
                {profile.dominant_type.replace(/_/g, ' ').toUpperCase()}
              </h3>
              <p className="text-blue-800">
                {profile.dominant_type === 'severity' && 'You take your health seriously and are deeply concerned about it.'}
                {profile.dominant_type === 'secondary_gain' && 'Illness may bring certain benefits, such as attention and care from loved ones.'}
                {profile.dominant_type === 'hide_resist' && 'You tend to hide your illness and resist treatment.'}
                {profile.dominant_type === 'work_escape' && 'You strive to escape into work or sports to distract from health problems.'}
                {profile.dominant_type === 'low_selfesteem' && 'You have low self-esteem and often blame yourself for the illness.'}
                {profile.dominant_type === 'alt_med' && 'You believe in alternative medicine and strive for self-treatment.'}
                {profile.dominant_type === 'addictions' && 'You have harmful habits or chemical dependencies.'}
                {profile.dominant_type === 'ignore' && 'You tend to ignore the illness and not take risks seriously.'}
                {profile.dominant_type === 'anxiety' && 'You are prone to anxiety disorders and health concerns.'}
              </p>
            </div>
          </div>
        )}

        {/* Recommendations */}
        <div className="bg-white rounded-lg shadow-lg border p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Recommendations</h2>
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                <span className="text-green-600 text-sm">✓</span>
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Communication Style</h3>
                <p className="text-gray-600">
                  Tatiana will adapt her communication style to your individual characteristics, 
                  taking into account the results of this survey.
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
                  Continue profiling by taking the psychotype and values surveys to get 
                  a complete picture of your personality.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/profiling/typology"
            className="inline-flex items-center justify-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <span className="mr-2">🧠</span>
            Next Survey: Psychotype
          </Link>
          <Link
            href="/communication-instructions"
            className="inline-flex items-center justify-center px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
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
        surveyType="attitude"
        surveyResults={profile}
        isVisible={showTatianaMessage}
        onClose={closeTatianaMessage}
      />
    </div>
  );
}
