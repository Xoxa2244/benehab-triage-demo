

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';

export default function AttitudeSurvey() {
  const router = useRouter();
  const [currentBatch, setCurrentBatch] = useState(0);
  const [answers, setAnswers] = useState(Array(41).fill(null));
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);
  const [progress, setProgress] = useState(0);

  const BATCH_SIZE = 8;

  useEffect(() => {
    loadItems();
    loadProgress();
  }, []);

  useEffect(() => {
    updateProgress();
  }, [answers]);

  const loadItems = async () => {
    try {
      const response = await fetch('/api/profiling/attitude/items');
      const data = await response.json();
      setItems(data.items || []);
    } catch (error) {
      console.error('Error loading questions:', error);
    }
  };

  const loadProgress = () => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('benehab_attitude_answers');
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
      localStorage.setItem('benehab_attitude_answers', JSON.stringify(answers));
    }
  };

  const updateProgress = () => {
    const answered = answers.filter(a => a !== null).length;
    setProgress((answered / 41) * 100);
  };

  const handleAnswer = (questionIndex, value) => {
    const newAnswers = [...answers];
    newAnswers[questionIndex] = value;
    setAnswers(newAnswers);
    saveProgress();
  };

  const nextBatch = () => {
    if (currentBatch < Math.ceil(41 / BATCH_SIZE) - 1) {
      setCurrentBatch(currentBatch + 1);
    }
  };

  const prevBatch = () => {
    if (currentBatch > 0) {
      setCurrentBatch(currentBatch - 1);
    }
  };

  const canSubmit = answers.filter(a => a !== null).length === 41;

  const submitSurvey = async () => {
    if (!canSubmit) return;

    setLoading(true);
    try {
      const response = await fetch('/api/profiling/attitude/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers })
      });

      if (response.ok) {
        const result = await response.json();
        
        // Debug information
        console.log('🚨 === ATTITUDE SURVEY DEBUG === 🚨');
        console.log('API Response:', result);
        console.log('Profile structure:', Object.keys(result.profile || {}));
        if (result.profile && result.profile.levels) {
          console.log('Levels found:', Object.keys(result.profile.levels));
          console.log('Levels values:', result.profile.levels);
        }
        if (result.profile && result.profile.risk_tags) {
          console.log('Risk tags:', result.profile.risk_tags);
        }
        if (result.profile && result.profile.comm_flags) {
          console.log('Communication flags:', result.profile.comm_flags);
        }
        console.log('🚨 === END ATTITUDE DEBUG === 🚨');
        
        // Save profile
        if (typeof window !== 'undefined') {
          localStorage.setItem('benehab_attitude_profile', JSON.stringify(result.profile));
          console.log('✅ Profile saved to localStorage');
        }

        // Navigate to results page
        router.push('/profiling/attitude-results');
      } else {
        throw new Error('Submission error');
      }
    } catch (error) {
      console.error('Error submitting survey:', error);
      alert('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const startIndex = currentBatch * BATCH_SIZE;
  const endIndex = Math.min(startIndex + BATCH_SIZE, 41);
  const currentItems = items.slice(startIndex, endIndex);

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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-4">
        {/* Header */}
        <div className="bg-white rounded-2xl p-6 mb-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-semibold text-gray-900">Survey: Health Attitude</h1>
            <Link href="/" className="text-emerald-600 hover:text-emerald-700">
              Back to Chat
            </Link>
          </div>
          
          <div className="mb-4">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Progress: {Math.round(progress)}%</span>
              <span>{answers.filter(a => a !== null).length} of 41</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-emerald-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>

          <p className="text-gray-700">
            Read each statement and choose how much it applies to you:
            <br />
            <strong>0</strong> — does not apply at all, <strong>1</strong> — partially applies, <strong>2</strong> — fully applies
          </p>
        </div>

        {/* Questions */}
        <div className="bg-white rounded-2xl p-6 shadow-sm mb-6">
          <div className="space-y-6">
            {currentItems.map((item, index) => {
              const questionIndex = startIndex + index;
              const questionNumber = questionIndex + 1;
              
              return (
                <div key={questionIndex} className="border-b border-gray-100 pb-4 last:border-b-0">
                  <p className="text-gray-900 mb-3">
                    <span className="font-medium text-emerald-600">{questionNumber}.</span> {item.text}
                  </p>
                  
                  <div className="flex gap-4">
                    {[0, 1, 2].map(value => (
                      <label key={value} className="flex items-center cursor-pointer">
                        <input
                          type="radio"
                          name={`question-${questionIndex}`}
                          value={value}
                          checked={answers[questionIndex] === value}
                          onChange={() => handleAnswer(questionIndex, value)}
                          className="sr-only"
                        />
                        <div className={`
                          w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-medium
                          ${answers[questionIndex] === value 
                            ? 'border-emerald-600 bg-emerald-600 text-white' 
                            : 'border-gray-300 text-gray-400 hover:border-emerald-400'
                          }
                        `}>
                          {value}
                        </div>
                        <span className="ml-2 text-sm text-gray-600">
                          {value === 0 ? 'Does not apply' : value === 1 ? 'Partially' : 'Fully'}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Navigation */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <div className="flex justify-between items-center">
            <button
              onClick={prevBatch}
              disabled={currentBatch === 0}
              className={`
                px-6 py-2 rounded-xl border transition-colors
                ${currentBatch === 0 
                  ? 'border-gray-200 text-gray-400 cursor-not-allowed' 
                  : 'border-gray-300 text-gray-700 hover:border-emerald-400 hover:text-emerald-600'
                }
              `}
            >
              ← Back
            </button>

            <div className="text-sm text-gray-500">
              Page {currentBatch + 1} of {Math.ceil(41 / BATCH_SIZE)}
            </div>

            {currentBatch < Math.ceil(41 / BATCH_SIZE) - 1 ? (
              <button
                onClick={nextBatch}
                className="px-6 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors"
              >
                Next →
              </button>
            ) : (
              <button
                onClick={submitSurvey}
                disabled={!canSubmit || loading}
                className={`
                  px-6 py-2 rounded-xl transition-colors
                  ${canSubmit && !loading
                    ? 'bg-emerald-600 text-white hover:bg-emerald-700' 
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }
                `}
              >
                {loading ? 'Submitting...' : 'Complete Survey'}
              </button>
            )}
          </div>
        </div>

        {/* Hint */}
        <div className="text-center text-sm text-gray-500 mt-4">
          Your answers are automatically saved. You can return to this survey later.
        </div>
      </div>
    </div>
  );
}
