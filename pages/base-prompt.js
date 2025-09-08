import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';

export default function BasePrompt() {
  const [basePrompt, setBasePrompt] = useState('');
  const [savedPrompt, setSavedPrompt] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState('');
  const [showJsonRules, setShowJsonRules] = useState(false);

  useEffect(() => {
    // Load saved base prompt
    const saved = localStorage.getItem('benehab_base_prompt');
    if (saved) {
      setBasePrompt(saved);
      setSavedPrompt(saved);
    } else {
      // Set default base prompt
      const defaultPrompt = `You are "Tatiana", a health assistant for Benehab.
Speak warmly and simply. Respect the person's choice.
Don't make diagnoses or prescribe medications.
Triage: if there are dangerous symptoms - immediately advise calling an ambulance/going to emergency care and don't continue normal conversation until the user confirms safety.
Mild typical symptoms - support, rest/fluids/self-monitoring.
Moderate symptoms requiring observation - suggest making an appointment with a doctor, but only provide slots if the person agrees.
Medications: factual information is allowed (indications, contraindications, precautions, common side effects) - WITHOUT dosages and without prescribing. If asked for dosage - remind that dosages are determined by a doctor.
Appointment slots: 13:00, 15:00, 17:00 - only after explicit consent. After selection say: "Thank you, you are registered".`;
      
      setBasePrompt(defaultPrompt);
      setSavedPrompt(defaultPrompt);
    }
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    setSaveStatus('');

    try {
      // Save to localStorage
      localStorage.setItem('benehab_base_prompt', basePrompt);
      setSavedPrompt(basePrompt);
      setSaveStatus('✅ Base prompt successfully saved!');
      
      // Clear status after 3 seconds
      setTimeout(() => setSaveStatus(''), 3000);
    } catch (error) {
      console.error('Save error:', error);
      setSaveStatus('❌ Error saving prompt');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setBasePrompt(savedPrompt);
    setSaveStatus('🔄 Prompt restored to last saved state');
    setTimeout(() => setSaveStatus(''), 3000);
  };

  const handleResetToDefault = () => {
    const defaultPrompt = `You are "Tatiana", a health assistant for Benehab.
Speak warmly and simply. Respect the person's choice.
Don't make diagnoses or prescribe medications.
Triage: if there are dangerous symptoms - immediately advise calling an ambulance/going to emergency care and don't continue normal conversation until the user confirms safety.
Mild typical symptoms - support, rest/fluids/self-monitoring.
Moderate symptoms requiring observation - suggest making an appointment with a doctor, but only provide slots if the person agrees.
Medications: factual information is allowed (indications, contraindications, precautions, common side effects) - WITHOUT dosages and without prescribing. If asked for dosage - remind that dosages are determined by a doctor.
Appointment slots: 13:00, 15:00, 17:00 - only after explicit consent. After selection say: "Thank you, you are registered".`;
    
    setBasePrompt(defaultPrompt);
    setSaveStatus('🔄 Prompt restored to default value');
    setTimeout(() => setSaveStatus(''), 3000);
  };

  const handleShowJsonRules = () => {
    setShowJsonRules(!showJsonRules);
  };

  return (
    <>
      <Head>
        <title>Base Prompt - Benehab</title>
      </Head>
      
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          {/* Header and navigation */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                ⚙️ Tatiana's Base Prompt
              </h1>
              <p className="text-gray-600 mt-2">
                This prompt is always applied but adjusted based on survey results
              </p>
            </div>
            <Link 
              href="/"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              ← Home
            </Link>
          </div>

          {/* Save status */}
          {saveStatus && (
            <div className={`mb-6 p-4 rounded-lg ${
              saveStatus.includes('✅') ? 'bg-green-100 border-green-300' : 
              saveStatus.includes('❌') ? 'bg-red-100 border-red-300' : 
              'bg-blue-100 border-blue-300'
            } border`}>
              <p className={saveStatus.includes('✅') ? 'text-green-700' : 
                           saveStatus.includes('❌') ? 'text-red-700' : 'text-blue-700'}>
                {saveStatus}
              </p>
            </div>
          )}

          {/* JSON rules */}
          <div className="mb-6">
            <button
              onClick={handleShowJsonRules}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 mb-4"
            >
              {showJsonRules ? '🔽 Hide' : '📋 Show'} JSON Rules
            </button>
            
            {showJsonRules && (
              <div className="bg-white p-6 rounded-lg border border-gray-300">
                <h3 className="text-lg font-semibold mb-4">📋 JSON Rules for Base Prompt</h3>
                <p className="text-gray-600 mb-4">
                  These rules automatically generate the base prompt and adjust it based on patient profiling.
                </p>
                <div className="bg-gray-100 p-4 rounded-lg">
                  <pre className="text-sm text-gray-800 overflow-x-auto">
                    {`{
  "version": "1.0",
  "description": "Universal communication rules for AI assistant Tatiana",
  "general_principles": {
    "communication_style": "respectful_supportive_no_pressure",
    "core_components": ["emotional", "cognitive", "behavioral"],
    "adaptation": "psychotype_based",
    "main_goals": ["reduce_anxiety", "support_motivation", "help_follow_medical_instructions"]
  },
  "emotional_work": { /* Emotional work */ },
  "cognitive_work": { /* Cognitive work */ },
  "behavioral_support": { /* Behavioral support */ },
  "motivation_work": { /* Motivation work */ },
  "safety_rules": { /* Safety rules */ },
  "communication_format": { /* Communication format */ }
}`}
                  </pre>
                </div>
                <div className="mt-4 text-sm text-gray-600">
                  <p>• <strong>Emotional work</strong> - adaptation to patient emotional state</p>
                  <p>• <strong>Cognitive work</strong> - working with attitudes and beliefs</p>
                  <p>• <strong>Behavioral support</strong> - directing behavior in the right direction</p>
                  <p>• <strong>Motivation</strong> - using patient values as motivators</p>
                  <p>• <strong>Safety</strong> - restrictions and rules for crisis situations</p>
                </div>
              </div>
            )}
          </div>

          {/* Prompt editor */}
          <div className="bg-white p-6 rounded-lg border border-gray-300 mb-6">
            <h2 className="text-xl font-semibold mb-4">📝 Editing Base Prompt</h2>
            
            <div className="mb-4">
              <label htmlFor="basePrompt" className="block text-sm font-medium text-gray-700 mb-2">
                Base prompt for AI assistant "Tatiana":
              </label>
              <textarea
                id="basePrompt"
                value={basePrompt}
                onChange={(e) => setBasePrompt(e.target.value)}
                className="w-full h-64 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                placeholder="Enter base prompt for Tatiana..."
              />
            </div>

            {/* Control buttons */}
            <div className="flex gap-4">
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {isSaving ? '⏳ Saving...' : '💾 Save'}
              </button>
              
              <button
                onClick={handleReset}
                className="px-6 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
              >
                🔄 Restore
              </button>
              
              <button
                onClick={handleResetToDefault}
                className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                🏠 Default
              </button>
            </div>
          </div>

          {/* Information */}
          <div className="bg-blue-50 p-6 rounded-lg border border-blue-300">
            <h2 className="text-xl font-semibold mb-3 text-blue-900">📖 How it works:</h2>
            <ul className="text-blue-800 space-y-2">
              <li>• <strong>JSON rules</strong> - universal foundation for all users</li>
              <li>• <strong>Base prompt</strong> - generated from rules and can be edited manually</li>
              <li>• <strong>Survey prompt</strong> - adjusts base based on profiling</li>
              <li>• <strong>Final prompt</strong> = Base + Survey (with survey priority)</li>
              <li>• <strong>Automatic adjustment</strong> - system enhances needed blocks based on profile</li>
              <li>• Changes are automatically saved in browser</li>
              <li>• Restart chat to apply changes</li>
            </ul>
          </div>

          {/* Links */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link 
              href="/debug-prompts"
              className="p-6 bg-white rounded-lg border border-gray-300 hover:border-blue-400 hover:shadow-md transition-all"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-2">🔍 Prompt Debug</h3>
              <p className="text-gray-600">View generated prompts and diagnostics</p>
            </Link>
            
            <Link 
              href="/"
              className="p-6 bg-white rounded-lg border border-gray-300 hover:border-blue-400 hover:shadow-md transition-all"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-2">💬 Chat with Tatiana</h3>
              <p className="text-gray-600">Test personalized responses</p>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
