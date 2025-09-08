import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';

export default function AttitudeSurvey() {
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(1);
  const [answers, setAnswers] = useState(Array(41).fill(null));
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);
  const [progress, setProgress] = useState(0);
  const [validationErrors, setValidationErrors] = useState({});

  const itemsPerPage = 5;

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
    setProgress(Math.min((answered / 41) * 100, 100));
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
  
  const canGoToNextPage = () => {
    if (currentPage >= totalPages) return false;
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, items.length);
    const pageItems = items.slice(startIndex, endIndex);
    return pageItems.every(item => answers[item.id - 1] !== null);
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
      if (answers[item.id - 1] === null) {
        errors[item.id] = true;
      }
    });
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAnswer = (questionIndex, value) => {
    const newAnswers = [...answers];
    newAnswers[questionIndex] = value;
    setAnswers(newAnswers);
    
    // Clear validation error for this question
    setValidationErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[questionIndex + 1];
      return newErrors;
    });
    
    saveProgress();
  };

  const canSubmit = answers.filter(a => a !== null).length === 41;

  const submitSurvey = async () => {
    if (!canSubmit) return;

    setLoading(true);
    try {
      const response = await fetch('/api/profiling/attitude/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ answers }),
      });

      if (response.ok) {
        const result = await response.json();
        localStorage.setItem('benehab_attitude_profile', JSON.stringify(result.profile));
        
        // Generate PIB
        await generatePIB();
        
        // Redirect to results page
        router.push('/profiling/attitude-results');
      } else {
        const errorText = await response.text();
        console.error('Error submitting answers:', response.status, errorText);
        alert(`Submission error: ${response.status}`);
      }
    } catch (error) {
      console.error('Error submitting survey:', error);
      alert('An error occurred. Please try again.');
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
        <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-3xl p-8 mb-6 shadow-lg text-white">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold mb-2">Health Attitude Survey</h1>
              <p className="text-emerald-100 text-lg">
                Discover your attitude towards health and illness
              </p>
            </div>
            <Link 
              href="/" 
              className="px-6 py-3 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-2xl transition-all duration-300 font-medium"
            >
              ← Back to Chat
            </Link>
          </div>
          
          <div className="mb-6">
            <div className="flex justify-between text-emerald-100 mb-3">
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
            <p className="text-xl text-emerald-100">
              Read each statement and indicate how much it applies to you
            </p>
          </div>
        </div>

        {/* Questions */}
        <div className="bg-white rounded-3xl p-8 mb-6 shadow-lg border border-gray-100">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Health Attitude Questions
            </h2>
            <p className="text-gray-600 text-lg">
              Choose the option that best describes your situation
            </p>
          </div>
          
          {/* Page indicator */}
          <div className="flex justify-center mb-8">
            <div className="flex items-center space-x-2 bg-gray-100 rounded-full px-4 py-2">
              <span className="text-sm font-medium text-gray-600">
                Page {currentPage} of {totalPages}
              </span>
              <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
            </div>
          </div>
          
          <div className="space-y-6">
            {currentItems.map((item, index) => (
              <div key={item.id} className="group relative">
                <div className={`
                  bg-gradient-to-br from-white to-gray-50 rounded-2xl p-6 border-2 transition-all duration-300
                  ${validationErrors[item.id]
                    ? 'border-red-400 shadow-lg shadow-red-100 bg-red-50'
                    : answers[item.id - 1] !== null 
                      ? 'border-emerald-300 shadow-lg shadow-emerald-100' 
                      : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                  }
                `}>
                  {/* Question number and text */}
                  <div className="mb-6">
                    <div className="flex items-start space-x-4">
                      <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-2xl font-bold text-lg">
                        {(currentPage - 1) * itemsPerPage + index + 1}
                      </div>
                      <div className="flex-1">
                        <p className="text-lg text-gray-900 leading-relaxed">{item.text}</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Answer options */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {[
                      { value: 0, label: 'Does not apply', color: 'red' },
                      { value: 1, label: 'Partially applies', color: 'yellow' },
                      { value: 2, label: 'Fully applies', color: 'green' }
                    ].map((option) => (
                      <button
                        key={option.value}
                        onClick={() => handleAnswer(item.id - 1, option.value)}
                        className={`
                          px-6 py-4 rounded-2xl font-medium transition-all duration-300 transform
                          ${answers[item.id - 1] === option.value
                            ? option.value === 0 
                              ? 'bg-red-500 text-white shadow-lg scale-105'
                              : option.value === 1
                              ? 'bg-yellow-500 text-white shadow-lg scale-105'
                              : 'bg-green-500 text-white shadow-lg scale-105'
                            : option.value === 0
                            ? 'bg-red-50 text-red-700 border-2 border-red-200 hover:bg-red-100 hover:scale-105'
                            : option.value === 1
                            ? 'bg-yellow-50 text-yellow-700 border-2 border-yellow-200 hover:bg-yellow-100 hover:scale-105'
                            : 'bg-green-50 text-green-700 border-2 border-green-200 hover:bg-green-100 hover:scale-105'
                          }
                        `}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                  
                  {/* Selection indicator */}
                  {answers[item.id - 1] !== null && (
                    <div className="mt-4 text-center">
                      <div className={`
                        inline-flex items-center px-4 py-2 rounded-full text-sm font-medium
                        ${answers[item.id - 1] === 0 
                          ? 'bg-red-100 text-red-700'
                          : answers[item.id - 1] === 1
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-green-100 text-green-700'
                        }
                      `}>
                        <div className={`
                          w-3 h-3 rounded-full mr-2
                          ${answers[item.id - 1] === 0 
                            ? 'bg-red-500'
                            : answers[item.id - 1] === 1
                            ? 'bg-yellow-500'
                            : 'bg-green-500'
                          }
                        `}></div>
                        {answers[item.id - 1] === 0 ? 'Does not apply' : 
                         answers[item.id - 1] === 1 ? 'Partially applies' : 'Fully applies'}
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
                <span>Progress: {answers.filter(a => a !== null).length} of 41</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-gradient-to-r from-emerald-400 to-emerald-600 h-3 rounded-full transition-all duration-500"
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
                  disabled={!canSubmit || loading}
                  className={`
                    px-8 py-3 rounded-xl font-medium transition-all duration-300 transform
                    ${canSubmit && !loading
                      ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white hover:from-emerald-600 hover:to-emerald-700 hover:shadow-lg hover:scale-105'
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
                  disabled={!canGoToNextPage()}
                  className={`
                    px-8 py-3 rounded-xl font-medium transition-all duration-300 transform
                    ${canGoToNextPage()
                      ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 hover:shadow-lg hover:scale-105'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }
                  `}
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