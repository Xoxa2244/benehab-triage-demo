

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';

export default function TypologySurvey() {
  const router = useRouter();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    loadItems();
    loadProgress();
  }, []);

  useEffect(() => {
    updateProgress();
  }, [answers, currentQuestion]);

  const loadItems = async () => {
    try {
      const response = await fetch('/api/profiling/typology/items');
      const data = await response.json();
      
      if (data.success) {
        setItems(data.questions || []);
        console.log('✅ Questions loaded successfully:', data.questions?.length);
      } else {
        console.error('❌ API returned error:', data.error);
        setItems([]);
      }
    } catch (error) {
      console.error('❌ Error loading questions:', error);
      setItems([]);
    }
  };

  const loadProgress = () => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('benehab_typology_answers');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setAnswers(parsed);
        } catch (error) {
          console.error('Error loading progress:', error);
        }
      }
    }
  };

  const saveProgress = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('benehab_typology_answers', JSON.stringify(answers));
    }
  };

  const updateProgress = () => {
    const totalQuestions = items.length;
    if (totalQuestions > 0) {
      const progress = ((currentQuestion + 1) / totalQuestions) * 100;
      setProgress(progress);
    }
  };

  const handleOptionSelect = (questionId, optionId, ptype) => {
    const currentAnswers = answers[questionId] || [];
    
    // If option is already selected, remove it
    if (currentAnswers.some(ans => ans.optionId === optionId)) {
      const newAnswers = currentAnswers.filter(ans => ans.optionId !== optionId);
      setAnswers(prev => ({
        ...prev,
        [questionId]: newAnswers
      }));
    } else {
      // If 3 options are already selected, do not add
      if (currentAnswers.length >= 3) {
        return;
      }
      
      // Add new option
      const newAnswers = [...currentAnswers, { optionId, ptype }];
      setAnswers(prev => ({
        ...prev,
        [questionId]: newAnswers
      }));
    }
    
    saveProgress();
  };

  const canGoNext = () => {
    const currentAnswers = answers[items[currentQuestion]?.id] || [];
    return currentAnswers.length >= 1;
  };

  const canGoBack = () => {
    return currentQuestion > 0;
  };

  const goToNext = () => {
    if (canGoNext() && currentQuestion < items.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    }
  };

  const goToBack = () => {
    if (canGoBack()) {
      setCurrentQuestion(prev => prev - 1);
    }
  };

  const getSelectedCount = (questionId) => {
    return (answers[questionId] || []).length;
  };

  const isOptionSelected = (questionId, optionId) => {
    return (answers[questionId] || []).some(ans => ans.optionId === optionId);
  };

  const isOptionDisabled = (questionId, optionId) => {
    const selectedCount = getSelectedCount(questionId);
    const isSelected = isOptionSelected(questionId, optionId);
    return selectedCount >= 3 && !isSelected;
  };

  const submitSurvey = async () => {
    if (!canGoNext()) return;

    console.log('🚀 Submitting survey...', { answers });
    setLoading(true);
    
    try {
      const response = await fetch('/api/profiling/typology/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ answers }),
      });

      console.log('📡 API Response:', { status: response.status, ok: response.ok });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ API Result:', result);
        
        localStorage.setItem('benehab_typology_profile', JSON.stringify(result.profile));
        
        // Generate PIB
        console.log('🔄 Generating PIB...');
        await generatePIB();
        
        // Navigate to results page
        console.log('🔄 Navigating to results...');
        router.push('/profiling/typology-results');
      } else {
        const errorText = await response.text();
        console.error('❌ Error submitting answers:', response.status, errorText);
        alert(`Submission error: ${response.status}`);
      }
    } catch (error) {
      console.error('❌ Error submitting answers:', error);
      alert(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const generatePIB = async () => {
    try {
      const response = await fetch('/api/profiling/pib', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          demographics: JSON.parse(localStorage.getItem('benehab_demographics') || '{}'),
          attitude_profile: JSON.parse(localStorage.getItem('benehab_attitude_profile') || '{}'),
          typology_profile: JSON.parse(localStorage.getItem('benehab_typology_profile') || '{}')
        }),
      });

      if (response.ok) {
        const result = await response.json();
        localStorage.setItem('benehab.pib', JSON.stringify(result.pib));
      }
    } catch (error) {
      console.error('Error generating PIB:', error);
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p>Loading questions...</p>
        </div>
      </div>
    );
  }

  const currentItem = items[currentQuestion];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-4">
        {/* Header */}
        <div className="bg-white rounded-2xl p-6 mb-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-semibold text-gray-900">Survey: Communication Style</h1>
            <Link href="/" className="text-emerald-600 hover:text-emerald-700">
              Back to Chat
            </Link>
          </div>
          
          <div className="mb-4">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Progress: {Math.round(progress)}%</span>
              <span>Question {currentQuestion + 1} of {items.length}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-emerald-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>

          <p className="text-gray-700">
            Mark 1 to 3 statements that apply to you. There are no "right" or "wrong" answers — 
            this is simply about your communication style and information perception.
          </p>
        </div>

        {/* Current question */}
        {currentItem && (
          <div className="bg-white rounded-2xl p-6 mb-6 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              {currentItem.question_text}
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {currentItem.options.map((option) => (
                <label 
                  key={option.option_id} 
                  className={`
                    flex items-start cursor-pointer p-4 rounded-lg border-2 transition-all
                    ${isOptionSelected(currentItem.id, option.option_id)
                      ? 'border-emerald-500 bg-emerald-50'
                      : 'border-gray-200 hover:border-gray-300'
                    }
                    ${isOptionDisabled(currentItem.id, option.option_id)
                      ? 'opacity-50 cursor-not-allowed'
                      : ''
                    }
                  `}
                >
                  <input
                    type="checkbox"
                    checked={isOptionSelected(currentItem.id, option.option_id)}
                    onChange={() => handleOptionSelect(currentItem.id, option.option_id, option.ptype)}
                    disabled={isOptionDisabled(currentItem.id, option.option_id)}
                    className="mt-1 h-4 w-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                  />
                  <span className="ml-3 text-sm text-gray-700 leading-relaxed">
                    {option.option_text}
                  </span>
                </label>
              ))}
            </div>
            
            <div className="mt-4 text-sm text-gray-500 text-center">
              Selected: {getSelectedCount(currentItem.id)} of 3
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <div className="flex justify-between items-center">
            <button
              onClick={goToBack}
              disabled={!canGoBack()}
              className={`
                px-6 py-2 rounded-xl transition-colors
                ${canGoBack()
                  ? 'border border-gray-300 text-gray-700 hover:border-emerald-400 hover:text-emerald-600'
                  : 'border border-gray-200 text-gray-400 cursor-not-allowed'
                }
              `}
            >
              ← Back
            </button>

            {currentQuestion < items.length - 1 ? (
              <button
                onClick={goToNext}
                disabled={!canGoNext()}
                className={`
                  px-6 py-2 rounded-xl transition-colors
                  ${canGoNext()
                    ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }
                `}
              >
                Next →
              </button>
            ) : (
              <button
                onClick={submitSurvey}
                disabled={!canGoNext() || loading}
                className={`
                  px-6 py-2 rounded-xl transition-colors
                  ${canGoNext() && !loading
                    ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }
                `}
              >
                {loading ? 'Completing...' : 'Complete Survey'}
              </button>
            )}
          </div>
        </div>

        {/* Hint */}
        <div className="text-center text-sm text-gray-500 mt-4">
          Your answers are automatically saved. After completion, you will be able to communicate with Tatiana in a personalized mode.
        </div>
      </div>
    </div>
  );
}
