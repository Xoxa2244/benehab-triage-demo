import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';

export default function TypologySurvey() {
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(1);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);
  const [progress, setProgress] = useState(0);
  const [validationErrors, setValidationErrors] = useState({});

  const itemsPerPage = 5;
  const questionMap = useMemo(() => {
    return items.reduce((acc, q) => {
      acc[q.id] = q;
      acc[String(q.id)] = q;
      return acc;
    }, {});
  }, [items]);

  useEffect(() => {
    loadItems();
    loadProgress();
  }, []);

  useEffect(() => {
    updateProgress();
  }, [answers, currentPage]);

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
    const answeredCount = Object.keys(answers).length;
    const totalQuestions = items.length;
    setProgress(Math.min((answeredCount / totalQuestions) * 100, 100));
  };

  // Pagination functions
  const totalPages = Math.ceil(items.length / itemsPerPage);
  const currentItems = items.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  
  const goToNextPage = () => {
    if (currentPage < totalPages) {
      if (validateCurrentPage()) {
        setCurrentPage(currentPage + 1);
        setValidationErrors({});
      }
    }
  };
  
  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };
  
  const getAnswerArray = (questionId) => {
    return answers[questionId] || answers[String(questionId)] || [];
  };

  const canGoToNextPage = () => {
    if (currentPage >= totalPages) return false;
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, items.length);
    const pageItems = items.slice(startIndex, endIndex);
    return pageItems.every(item => getAnswerArray(item.id).length > 0);
  };
  
  const canGoToPreviousPage = () => {
    return currentPage > 1;
  };
  
  const isLastPage = () => {
    return currentPage === totalPages;
  };

  const validateCurrentPage = () => {
    const errors = {};
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, items.length);
    const pageItems = items.slice(startIndex, endIndex);
    
    pageItems.forEach(item => {
      const arr = getAnswerArray(item.id);
      if (!arr || arr.length === 0) {
        errors[item.id] = true;
      }
    });
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAnswer = (questionId, optionId) => {
    const question = questionMap[questionId];
    if (!question) return;

    const currentAnswers = getAnswerArray(questionId);
      const optionObj = question.options.find((o) => String(o.option_id) === String(optionId));
    if (!optionObj) return;

    const exists = currentAnswers.some(
      (a) => a === optionId || a?.option_id === optionId
    );

    let newAnswers;
    if (exists) {
      // Remove if already selected
      newAnswers = currentAnswers.filter(
        (a) => (a?.option_id ?? a) !== optionId
      );
    } else if (currentAnswers.length < 3) {
      // Add if less than 3 selected
      newAnswers = [...currentAnswers, { option_id: optionObj.option_id, ptype: optionObj.ptype }];
    } else {
      // Replace first if 3 already selected
      const [, ...rest] = currentAnswers;
      newAnswers = [{ option_id: optionObj.option_id, ptype: optionObj.ptype }, ...rest];
    }

    setAnswers((prev) => ({
      ...prev,
      [questionId]: newAnswers,
    }));

    // Clear validation error for this question
    setValidationErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[questionId];
      return newErrors;
    });

    saveProgress();
  };

  const getSelectedCount = (questionId) => {
    const arr = getAnswerArray(questionId);
    return arr ? arr.length : 0;
  };

  const canSubmit = () => {
    return items.every((item) => getAnswerArray(item.id).length > 0);
  };

  const submitSurvey = async () => {
    if (!canSubmit()) return;

    setLoading(true);
    try {
      const userId = localStorage.getItem('benehab_user_id');
    const payloadAnswers = buildPayloadAnswers();

    if (!Object.keys(payloadAnswers).length) {
      throw new Error('No answers selected');
    }
      const response = await fetch('/api/profiling/typology/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ answers: payloadAnswers, userId }),
      });

      if (response.ok) {
        const result = await response.json();
        localStorage.setItem('benehab_typology_profile', JSON.stringify(result.profile));
        
        // Generate PIB
        await generatePIB();
        
        // Redirect to results page
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
          typology_profile: JSON.parse(localStorage.getItem('benehab_typology_profile') || '{}'),
          values_profile: JSON.parse(localStorage.getItem('benehab_values_profile') || '{}')
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

  const buildPayloadAnswers = () => {
    const payload = {};
    Object.entries(answers).forEach(([questionId, optionObjs]) => {
      const question = questionMap[questionId];
      if (!question || !Array.isArray(optionObjs)) return;

      const normalized = optionObjs
        .map((a) => {
          const id = a?.option_id ?? a;
          const opt = question.options.find((o) => String(o.option_id) === String(id));
          if (!opt) return null;
          return { optionId: opt.option_id, ptype: opt.ptype };
        })
        .filter(Boolean);

      if (normalized.length) {
        payload[questionId] = normalized;
      }
    });
    return payload;
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto p-4">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-3xl p-8 mb-6 shadow-lg text-white">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-6">
              <div>
                <h1 className="text-4xl font-bold mb-2">Communication Style Survey</h1>
                <p className="text-blue-100 text-lg">
                  Discover your communication preferences and personality type
                </p>
              </div>
              {/* Progress circle */}
              <div className="relative w-20 h-20">
                <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-blue-200"
                    stroke="currentColor"
                    strokeWidth="3"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="text-white"
                    stroke="currentColor"
                    strokeWidth="3"
                    fill="none"
                    strokeDasharray={`${progress}, 100`}
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-white font-bold text-lg">{Math.round(progress)}%</span>
                </div>
              </div>
            </div>
            <Link 
              href="/" 
              className="px-6 py-3 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-2xl transition-all duration-300 font-medium"
            >
              ← Back to Chat
            </Link>
          </div>
          
          <div className="mb-6">
            <div className="flex justify-between text-blue-100 mb-3">
              <span className="font-medium">Overall Progress: {Math.round(progress)}%</span>
              <span className="font-medium">Page {currentPage} of {totalPages}</span>
            </div>
            <div className="w-full bg-white bg-opacity-20 rounded-full h-3">
              <div 
                className="bg-white h-3 rounded-full transition-all duration-500 shadow-lg"
                style={{ width: `${Math.min(progress, 100)}%` }}
              ></div>
            </div>
          </div>

          <div className="text-center">
            <p className="text-xl text-blue-100">
              Mark 1 to 3 statements that best describe you
            </p>
          </div>
        </div>

        {/* Questions */}
        <div className="bg-white rounded-3xl p-8 mb-6 shadow-lg border border-gray-100">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Communication Style Questions
            </h2>
            <p className="text-gray-600 text-lg">
              Select the statements that best describe your personality
            </p>
          </div>
          
          {/* Page indicator */}
          <div className="flex justify-center mb-8">
            <div className="flex items-center space-x-2 bg-gray-100 rounded-full px-4 py-2">
              <span className="text-sm font-medium text-gray-600">
                Page {currentPage} of {totalPages}
              </span>
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            </div>
          </div>
          
          <div className="space-y-6">
            {currentItems.map((item, index) => (
              <div key={item.id} className="group relative">
                <div className={`
                  bg-gradient-to-br from-white to-gray-50 rounded-2xl p-6 border-2 transition-all duration-300
                  ${validationErrors[item.id]
                    ? 'border-red-400 shadow-lg shadow-red-100 bg-red-50'
                    : getSelectedCount(item.id) > 0 
                      ? 'border-blue-300 shadow-lg shadow-blue-100' 
                      : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                  }
                `}>
                  {/* Question number and text */}
                  <div className="mb-6">
                    <div className="flex items-start space-x-4">
                      <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-2xl font-bold text-lg">
                        {(currentPage - 1) * itemsPerPage + index + 1}
                      </div>
                      <div className="flex-1">
                        <p className="text-lg text-gray-900 leading-relaxed">{item.question_text}</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Answer options */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {item.options.map((option) => {
                      const isSelected = answers[item.id]?.includes(option.option_id) || false;
                      return (
                        <button
                          key={option.option_id}
                          onClick={() => handleAnswer(item.id, option.option_id)}
                          className={`
                            px-6 py-4 rounded-2xl font-medium transition-all duration-300 transform text-left
                            ${isSelected
                              ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg scale-105'
                              : 'bg-gradient-to-br from-gray-50 to-gray-100 text-gray-700 border-2 border-gray-200 hover:border-blue-300 hover:bg-blue-50 hover:scale-105'
                            }
                          `}
                        >
                          {option.option_text}
                        </button>
                      );
                    })}
                  </div>
                  
                  {/* Selection indicator */}
                  {getSelectedCount(item.id) > 0 && (
                    <div className="mt-4 text-center">
                      <div className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                        <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                        Selected: {getSelectedCount(item.id)} of 3
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          {/* Progress and navigation */}
          <div className="flex flex-col items-center space-y-6 mt-8">
            {/* Progress bar */}
            <div className="w-full max-w-md">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Progress: {Object.keys(answers).length} of {items.length}</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-gradient-to-r from-blue-400 to-blue-600 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(progress, 100)}%` }}
                ></div>
              </div>
            </div>
            
            {/* Navigation buttons */}
            <div className="flex items-center space-x-4">
              <button
                onClick={goToPreviousPage}
                disabled={!canGoToPreviousPage()}
                className={`
                  px-6 py-3 rounded-xl font-medium transition-all duration-300
                  ${!canGoToPreviousPage()
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300 hover:shadow-md'
                  }
                `}
              >
                ← Previous
              </button>
              
              {isLastPage() ? (
                <button
                  onClick={submitSurvey}
                  disabled={!canSubmit() || loading}
                  className={`
                    px-8 py-3 rounded-xl font-medium transition-all duration-300 transform
                    ${canSubmit() && !loading
                      ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 hover:shadow-lg hover:scale-105'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }
                  `}
                >
                  {loading ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Completing...
                    </div>
                  ) : (
                    'Complete Survey'
                  )}
                </button>
              ) : (
                <button
                  onClick={goToNextPage}
                  className="px-8 py-3 rounded-xl font-medium transition-all duration-300 transform bg-gradient-to-r from-emerald-500 to-emerald-600 text-white hover:from-emerald-600 hover:to-emerald-700 hover:shadow-lg hover:scale-105"
                >
                  Next Page →
                </button>
              )}
            </div>
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
