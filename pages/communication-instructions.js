

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { getCommunicationInstructions } from '../lib/communication-instructions';

export default function CommunicationInstructions() {
  const router = useRouter();
  const [instructions, setInstructions] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profiles, setProfiles] = useState({});

  useEffect(() => {
    loadProfiles();
  }, []);

  const loadProfiles = () => {
    if (typeof window !== 'undefined') {
      const attitudeProfile = localStorage.getItem('benehab_attitude_profile');
      const typologyProfile = localStorage.getItem('benehab_typology_profile');
      const valuesProfile = localStorage.getItem('benehab_values_profile');
      const pib = localStorage.getItem('benehab.pib');

      const profilesData = {};
      
      if (attitudeProfile) {
        try {
          profilesData.attitude = JSON.parse(attitudeProfile);
        } catch (error) {
          console.error('Error parsing attitude profile:', error);
        }
      }
      
      if (typologyProfile) {
        try {
          profilesData.typology = JSON.parse(typologyProfile);
        } catch (error) {
          console.error('Error parsing typology profile:', error);
        }
      }
      
      if (valuesProfile) {
        try {
          profilesData.values = JSON.parse(valuesProfile);
        } catch (error) {
          console.error('Error parsing values profile:', error);
        }
      }
      
      if (pib) {
        try {
          profilesData.pib = JSON.parse(pib);
        } catch (error) {
          console.error('Error parsing PIB:', error);
        }
      }

      setProfiles(profilesData);
      
      // Generate instructions
      if (profilesData.attitude || profilesData.typology) {
        const commInstructions = getCommunicationInstructions(
          profilesData.attitude, 
          profilesData.typology
        );
        setInstructions(commInstructions);
      }
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p>Loading instructions...</p>
        </div>
      </div>
    );
  }

  if (!instructions) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-gray-900 mb-4">Instructions Not Found</h1>
          <p className="text-gray-600 mb-6">Please complete all surveys to get personalized instructions</p>
          <Link href="/" className="px-6 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700">
            Back to Chat
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto p-4">
        {/* Header */}
        <div className="bg-white rounded-2xl p-6 mb-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-semibold text-gray-900">Patient Communication Instructions</h1>
            <Link href="/" className="text-emerald-600 hover:text-emerald-700">
              Back to Chat
            </Link>
          </div>
          
          <p className="text-gray-700">
            Personalized communication recommendations based on patient psychological profiling
          </p>
        </div>

        {/* General communication principles */}
        <div className="bg-white rounded-2xl p-6 mb-6 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">General Communication Principles</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Tone and approach */}
            <div className="space-y-4">
              <h3 className="font-medium text-gray-900">Tone and Approach</h3>
              <div className="bg-emerald-50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                  <span className="font-medium">Tone: {instructions.general.tone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                  <span className="font-medium">Approach: {instructions.general.approach}</span>
                </div>
              </div>
            </div>

            {/* Key principles */}
            <div className="space-y-4">
              <h3 className="font-medium text-gray-900">Key Principles</h3>
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="text-sm text-blue-800">
                  {instructions.general.key_points.slice(0, 3).map((point, index) => (
                    <div key={index} className="flex items-start gap-2 mb-2">
                      <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 flex-shrink-0"></div>
                      <span>{point}</span>
                    </div>
                  ))}
                  {instructions.general.key_points.length > 3 && (
                    <div className="text-xs text-blue-600 mt-2">
                      And {instructions.general.key_points.length - 3} more principles...
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Health attitude profile */}
        {instructions.attitude && (
          <div className="bg-white rounded-2xl p-6 mb-6 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Health Attitude Profile</h2>
            
            <div className="space-y-6">
              {/* Main information */}
              <div className="bg-yellow-50 rounded-lg p-4">
                <h3 className="font-medium text-yellow-900 mb-2">{instructions.attitude.name}</h3>
                <p className="text-sm text-yellow-800 mb-3">{instructions.attitude.description}</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Communication challenges */}
                  <div>
                    <h4 className="font-medium text-yellow-900 text-sm mb-2">Communication Challenges:</h4>
                    <ul className="text-xs text-yellow-700 space-y-1">
                      {instructions.attitude.communication_challenges.map((challenge, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-yellow-600">•</span>
                          <span>{challenge}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Positive scenario */}
                  <div>
                    <h4 className="font-medium text-yellow-900 text-sm mb-2">Recommended Actions:</h4>
                    <ul className="text-xs text-yellow-700 space-y-1">
                      {instructions.attitude.positive_scenario.slice(0, 3).map((action, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-green-600">✓</span>
                          <span>{action}</span>
                        </li>
                      ))}
                      {instructions.attitude.positive_scenario.length > 3 && (
                        <li className="text-xs text-yellow-600 mt-1">
                          And {instructions.attitude.positive_scenario.length - 3} more actions...
                        </li>
                      )}
                    </ul>
                  </div>
                </div>
              </div>

              {/* What to avoid */}
              {instructions.attitude.negative_scenario && instructions.attitude.negative_scenario.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h4 className="font-medium text-red-900 text-sm mb-2">What to Avoid:</h4>
                  <ul className="text-xs text-red-700 space-y-1">
                    {instructions.attitude.negative_scenario.map((avoid, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-red-600">✗</span>
                        <span>{avoid}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Extreme actions */}
              {instructions.attitude.extreme_actions && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <h4 className="font-medium text-orange-900 text-sm mb-2">Special Cases:</h4>
                  <div className="text-xs text-orange-700 space-y-2">
                    {instructions.attitude.extreme_actions.low && (
                      <div>
                        <span className="font-medium">Low values:</span> {instructions.attitude.extreme_actions.low}
                      </div>
                    )}
                    {instructions.attitude.extreme_actions.high && (
                      <div>
                        <span className="font-medium">High values:</span> {instructions.attitude.extreme_actions.high}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Typological profile */}
        {instructions.typology && (
          <div className="bg-white rounded-2xl p-6 mb-6 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Typological Profile</h2>
            
            <div className="space-y-6">
              {/* Main information */}
              <div className="bg-purple-50 rounded-lg p-4">
                <h3 className="font-medium text-purple-900 mb-2">{instructions.typology.name}</h3>
                <p className="text-sm text-purple-800 mb-3">{instructions.typology.description}</p>
                
                <div className="bg-white rounded-lg p-3 mb-3">
                  <p className="text-sm text-purple-700 italic">"{instructions.typology.promise}"</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-purple-900 text-sm mb-2">Voice Type:</h4>
                    <p className="text-xs text-purple-700">{instructions.typology.voice_type}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-purple-900 text-sm mb-2">Interaction Frequency:</h4>
                    <p className="text-xs text-purple-700">{instructions.typology.interaction_frequency}</p>
                  </div>
                </div>
              </div>

              {/* Recommended actions */}
              <div className="bg-green-50 rounded-lg p-4">
                <h4 className="font-medium text-green-900 text-sm mb-2">Recommended Actions:</h4>
                <ul className="text-xs text-green-700 space-y-1">
                  {instructions.typology.positive_communication.map((action, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-green-600">✓</span>
                      <span>{action}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* What to avoid */}
              {instructions.typology.negative_communication && instructions.typology.negative_communication.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h4 className="font-medium text-red-900 text-sm mb-2">What to Avoid:</h4>
                  <ul className="text-xs text-red-700 space-y-1">
                    {instructions.typology.negative_communication.map((avoid, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-red-600">✗</span>
                        <span>{avoid}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Values profile */}
        {profiles.values && (
          <div className="bg-white rounded-2xl p-6 mb-6 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Values Profile</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Value indices */}
              <div>
                <h3 className="font-medium text-gray-900 mb-3">Value Indices</h3>
                <div className="space-y-3">
                  {Object.entries(profiles.values.value_indices || {}).map(([key, value]) => (
                    <div key={key} className="bg-gray-50 rounded-lg p-3">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-gray-700 capitalize">
                          {key.replace(/_/g, ' ')}
                        </span>
                        <span className="text-lg font-bold text-gray-900">{value}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full transition-all duration-500 ${
                            value > 70 ? 'bg-green-500' : 
                            value > 40 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${value}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Communication recommendations */}
              <div>
                <h3 className="font-medium text-gray-900 mb-3">Communication Recommendations</h3>
                <div className="space-y-3">
                  {profiles.values.communication_guidelines?.communication_style && (
                    <div className="bg-blue-50 rounded-lg p-3">
                      <h4 className="font-medium text-blue-900 text-sm mb-1">Communication Style:</h4>
                      <p className="text-xs text-blue-700">
                        {profiles.values.communication_guidelines.communication_style === 'optimistic' && 'Optimistic and encouraging'}
                        {profiles.values.communication_guidelines.communication_style === 'supportive' && 'Supportive and calm'}
                        {profiles.values.communication_guidelines.communication_style === 'balanced' && 'Balanced and neutral'}
                      </p>
                    </div>
                  )}

                  {profiles.values.communication_guidelines?.motivators && (
                    <div className="bg-green-50 rounded-lg p-3">
                      <h4 className="font-medium text-green-900 text-sm mb-1">Motivators:</h4>
                      <div className="flex flex-wrap gap-1">
                        {profiles.values.communication_guidelines.motivators.map((motivator, index) => (
                          <span key={index} className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                            {motivator}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {profiles.values.communication_guidelines?.avoid_topics && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                      <h4 className="font-medium text-red-900 text-sm mb-1">Avoid Topics:</h4>
                      <div className="flex flex-wrap gap-1">
                        {profiles.values.communication_guidelines.avoid_topics.map((topic, index) => (
                          <span key={index} className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">
                            {topic}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* PIB profile */}
        {profiles.pib && (
          <div className="bg-white rounded-2xl p-6 mb-6 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Communication Plan (PIB)</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Communication tone */}
              <div className="bg-indigo-50 rounded-lg p-4">
                <h3 className="font-medium text-indigo-900 mb-2">Communication Tone</h3>
                <p className="text-sm text-indigo-700">
                  {profiles.pib.communication_plan?.tone === 'calm_supportive' && 'Calm and supportive'}
                  {profiles.pib.communication_plan?.tone === 'energetic_motivational' && 'Energetic and motivational'}
                  {profiles.pib.communication_plan?.tone === 'professional_detailed' && 'Professional and detailed'}
                  {profiles.pib.communication_plan?.tone === 'gentle_empathetic' && 'Gentle and empathetic'}
                  {!profiles.pib.communication_plan?.tone && 'Standard'}
                </p>
              </div>

              {/* Session duration */}
              <div className="bg-teal-50 rounded-lg p-4">
                <h3 className="font-medium text-teal-900 mb-2">Session Duration</h3>
                <p className="text-sm text-teal-700">
                  {profiles.pib.communication_plan?.session_length === 'short' && 'Short (5-10 min)'}
                  {profiles.pib.communication_plan?.session_length === 'medium' && 'Medium (15-20 min)'}
                  {profiles.pib.communication_plan?.session_length === 'long' && 'Long (25-30 min)'}
                  {!profiles.pib.communication_plan?.session_length && 'Standard'}
                </p>
              </div>

              {/* What to avoid */}
              <div className="bg-amber-50 rounded-lg p-4">
                <h3 className="font-medium text-amber-900 mb-2">Avoid</h3>
                {profiles.pib.communication_plan?.avoid && profiles.pib.communication_plan.avoid.length > 0 ? (
                  <div className="space-y-1">
                    {profiles.pib.communication_plan.avoid.map((item, index) => (
                      <div key={index} className="text-sm text-amber-700 flex items-center gap-2">
                        <span className="text-amber-600">✗</span>
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-amber-700">No special restrictions</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex justify-center gap-4">
          <Link href="/" className="px-6 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors">
            Start Chatting with Tatiana
          </Link>
          <Link href="/profiling/values" className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:border-emerald-400 hover:text-emerald-600 transition-colors">
            Retake Surveys
          </Link>
        </div>

        {/* Hint */}
        <div className="text-center text-sm text-gray-500 mt-6">
          These instructions will help Tatiana communicate with you as comfortably and effectively as possible
        </div>
      </div>
    </div>
  );
}
