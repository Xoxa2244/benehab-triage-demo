import { useState, useEffect } from 'react';
import Head from 'next/head';

export default function DebugPrompts() {
  const [pibData, setPibData] = useState(null);
  const [attitudeProfile, setAttitudeProfile] = useState(null);
  const [typologyProfile, setTypologyProfile] = useState(null);
  const [valuesProfile, setValuesProfile] = useState(null);
  const [demographics, setDemographics] = useState(null);
  const [generatedPrompt, setGeneratedPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [basePrompt, setBasePrompt] = useState('Base prompt not configured');
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    loadData();
  }, []);

  const loadData = () => {
    if (!isClient) return;
    
    try {
      // Load all data from localStorage
      const pib = localStorage.getItem('benehab.pib');
      const attitude = localStorage.getItem('benehab_attitude_profile');
      const typology = localStorage.getItem('benehab_typology_profile');
      const values = localStorage.getItem('benehab_values_profile');
      const demo = localStorage.getItem('benehab_demographics');
      const base = localStorage.getItem('benehab_base_prompt');

      if (pib) setPibData(JSON.parse(pib));
      if (attitude) setAttitudeProfile(JSON.parse(attitude));
      if (typology) setTypologyProfile(JSON.parse(typology));
      if (values) setValuesProfile(JSON.parse(values));
      if (demo) setDemographics(JSON.parse(demo));
      if (base) setBasePrompt(base);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const generatePrompt = async () => {
    setLoading(true);
    try {
      // Debug information on client
      console.log('🔍 DEBUG: Sending data to API:');
      console.log('Attitude Profile:', attitudeProfile);
      console.log('Typology Profile:', typologyProfile);
      console.log('Values Profile:', valuesProfile);
      console.log('Demographics:', demographics);

      const response = await fetch('/api/profiling/pib', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          attitude_profile: attitudeProfile,
          accentuation_profile: typologyProfile, // Use correct name
          values_profile: valuesProfile,
          demographics: demographics
        }),
      });

      const data = await response.json();
      console.log('🔍 DEBUG: API Response:', data);

      if (data.success) {
        setPibData(data.pib);
        setGeneratedPrompt(data.prompt || 'Prompt not generated');
        
        // Additional debugging
        if (data.prompt) {
          console.log('✅ Prompt generated:', data.prompt);
        } else {
          console.log('❌ Prompt not generated');
        }
      } else {
        console.error('❌ API Error:', data.error);
        setGeneratedPrompt(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('❌ Error generating prompt:', error);
      setGeneratedPrompt(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const clearAllData = () => {
    if (!isClient) return;
    
    localStorage.clear();
    setPibData(null);
    setAttitudeProfile(null);
    setTypologyProfile(null);
    setValuesProfile(null);
    setDemographics(null);
    setGeneratedPrompt('');
    setBasePrompt('Base prompt not configured');
  };

  // Don't render content until loaded on client
  if (!isClient) {
    return (
      <>
        <Head>
          <title>Prompt Debug - Benehab</title>
        </Head>
        <div className="min-h-screen bg-gray-50 p-6">
          <div className="max-w-6xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">
              🔍 Benehab Prompt Debug
            </h1>
            <div className="text-center py-8">
              <p>Loading...</p>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Prompt Debug - Benehab</title>
      </Head>
      
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            🔍 Benehab Prompt Debug
          </h1>

          {/* Control buttons */}
          <div className="flex gap-4 mb-6">
            <button
              onClick={loadData}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              🔄 Refresh Data
            </button>
            <button
              onClick={generatePrompt}
              disabled={loading}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? '⏳ Generating...' : '🚀 Generate Prompt'}
            </button>
            <button
              onClick={clearAllData}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              🗑️ Clear All Data
            </button>
          </div>

          {/* Data status */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
            <div className={`p-4 rounded-lg ${attitudeProfile ? 'bg-green-100 border-green-300' : 'bg-red-100 border-red-300'} border`}>
              <h3 className="font-semibold">Attitude Profile</h3>
              <p className={attitudeProfile ? 'text-green-700' : 'text-red-700'}>
                {attitudeProfile ? '✅ Loaded' : '❌ Missing'}
              </p>
            </div>
            
            <div className={`p-4 rounded-lg ${typologyProfile ? 'bg-green-100 border-green-300' : 'bg-red-100 border-red-300'} border`}>
              <h3 className="font-semibold">Typology Profile</h3>
              <p className={typologyProfile ? 'text-green-700' : 'text-red-700'}>
                {typologyProfile ? '✅ Loaded' : '❌ Missing'}
              </p>
            </div>
            
            <div className={`p-4 rounded-lg ${valuesProfile ? 'bg-green-100 border-green-300' : 'bg-red-100 border-red-300'} border`}>
              <h3 className="font-semibold">Values Profile</h3>
              <p className={valuesProfile ? 'text-green-700' : 'text-red-700'}>
                {valuesProfile ? '✅ Loaded' : '❌ Missing'}
              </p>
            </div>
            
            <div className={`p-4 rounded-lg ${demographics ? 'bg-green-100 border-green-300' : 'bg-red-100 border-red-300'} border`}>
              <h3 className="font-semibold">Demographics</h3>
              <p className={demographics ? 'text-green-700' : 'text-red-700'}>
                {demographics ? '✅ Loaded' : '❌ Missing'}
              </p>
            </div>
            
            <div className={`p-4 rounded-lg ${pibData ? 'bg-green-100 border-green-300' : 'bg-red-100 border-red-300'} border`}>
              <h3 className="font-semibold">PIB</h3>
              <p className={pibData ? 'text-green-700' : 'text-red-700'}>
                {pibData ? '✅ Generated' : '❌ Not Generated'}
              </p>
            </div>
          </div>

          {/* Base prompt */}
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-3">⚙️ Tatiana's Base Prompt:</h2>
            <div className="bg-white p-4 rounded-lg border border-gray-300">
              <pre className="whitespace-pre-wrap text-sm text-gray-800 overflow-x-auto">
                {basePrompt}
              </pre>
            </div>
          </div>

          {/* Generated prompt */}
          {generatedPrompt && (
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-3">🎯 Generated Prompt:</h2>
              <div className="bg-white p-4 rounded-lg border border-gray-300">
                <pre className="whitespace-pre-wrap text-sm text-gray-800 overflow-x-auto">
                  {generatedPrompt}
                </pre>
              </div>
            </div>
          )}

          {/* Profile details */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Attitude Profile */}
            <div className="bg-white p-6 rounded-lg border border-gray-300">
              <h2 className="text-xl font-semibold mb-4">📊 Attitude Profile</h2>
              {attitudeProfile ? (
                <pre className="text-sm text-gray-700 overflow-x-auto">
                  {JSON.stringify(attitudeProfile, null, 2)}
                </pre>
              ) : (
                <p className="text-gray-500">No data available</p>
              )}
            </div>

            {/* Typology Profile */}
            <div className="bg-white p-6 rounded-lg border border-gray-300">
              <h2 className="text-xl font-semibold mb-4">🧠 Typology Profile</h2>
              {typologyProfile ? (
                <pre className="text-sm text-gray-700 overflow-x-auto">
                  {JSON.stringify(typologyProfile, null, 2)}
                </pre>
              ) : (
                <p className="text-gray-500">No data available</p>
              )}
            </div>

            {/* Values Profile */}
            <div className="bg-white p-6 rounded-lg border border-gray-300">
              <h2 className="text-xl font-semibold mb-4">🎨 Values Profile</h2>
              {valuesProfile ? (
                <pre className="text-sm text-gray-700 overflow-x-auto">
                  {JSON.stringify(valuesProfile, null, 2)}
                </pre>
              ) : (
                <p className="text-gray-500">No data available</p>
              )}
            </div>

            {/* Demographics */}
            <div className="bg-white p-6 rounded-lg border border-gray-300">
              <h2 className="text-xl font-semibold mb-4">👤 Demographics</h2>
              {demographics ? (
                <pre className="text-sm text-gray-700 overflow-x-auto">
                  {JSON.stringify(demographics, null, 2)}
                </pre>
              ) : (
                <p className="text-gray-500">No data available</p>
              )}
            </div>
          </div>

          {/* PIB Data */}
          {pibData && (
            <div className="mt-6">
              <h2 className="text-xl font-semibold mb-4">📋 PIB Data</h2>
              <div className="bg-white p-6 rounded-lg border border-gray-300">
                <pre className="text-sm text-gray-700 overflow-x-auto">
                  {JSON.stringify(pibData, null, 2)}
                </pre>
              </div>
            </div>
          )}

          {/* Instructions */}
          <div className="mt-8 bg-blue-50 p-6 rounded-lg border border-blue-300">
            <h2 className="text-xl font-semibold mb-3 text-blue-900">📖 Usage Instructions:</h2>
            <ul className="text-blue-800 space-y-2">
              <li>• Complete surveys on the main page</li>
              <li>• Click "Refresh Data" to load results</li>
              <li>• Click "Generate Prompt" to create AI prompt</li>
              <li>• Use "Clear All Data" to reset</li>
              <li>• This page is available at: <code className="bg-blue-200 px-2 py-1 rounded">/debug-prompts</code></li>
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}
