

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';

export default function ValuesSurvey() {
  const router = useRouter();
  const [currentStage, setCurrentStage] = useState(1); // 1 - colors, 2 - color ranking
  const [items, setItems] = useState([]);
  const [colorAssociations, setColorAssociations] = useState({});
  const [colorRankings, setColorRankings] = useState([]); // Color ranking
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const colors = [
    { name: 'red', label: 'Red', class: 'bg-red-500' },
    { name: 'blue', label: 'Blue', class: 'bg-blue-500' },
    { name: 'green', label: 'Green', class: 'bg-green-500' },
    { name: 'yellow', label: 'Yellow', class: 'bg-yellow-400' },
    { name: 'purple', label: 'Purple', class: 'bg-purple-500' },
    { name: 'orange', label: 'Orange', class: 'bg-orange-500' },
    { name: 'pink', label: 'Pink', class: 'bg-pink-500' },
    { name: 'brown', label: 'Brown', class: 'bg-yellow-800' },
    { name: 'gray', label: 'Gray', class: 'bg-gray-500' },
    { name: 'black', label: 'Black', class: 'bg-gray-900' },
    { name: 'white', label: 'White', class: 'bg-white border-2 border-gray-300' }
  ];

  useEffect(() => {
    loadItems();
    loadProgress();
  }, []);

  useEffect(() => {
    updateProgress();
  }, [currentStage, colorAssociations, colorRankings]);

  const loadItems = async () => {
    try {
      const response = await fetch('/api/profiling/values/items');
      const data = await response.json();
      
      if (data.success) {
        setItems(data.items || []);
        console.log('✅ Concepts loaded successfully:', data.items?.length);
      } else {
        console.error('❌ API returned error:', data.error);
        setItems([]);
      }
    } catch (error) {
      console.error('❌ Error loading concepts:', error);
      setItems([]);
    }
  };

  const loadProgress = () => {
    if (typeof window !== 'undefined') {
      const savedColors = localStorage.getItem('benehab_values_colors');
      const savedColorRankings = localStorage.getItem('benehab_values_color_rankings');
      
      if (savedColors) {
        try {
          setColorAssociations(JSON.parse(savedColors));
        } catch (error) {
          console.error('Error loading colors:', error);
        }
      }
      
      if (savedColorRankings) {
        try {
          setColorRankings(JSON.parse(savedColorRankings));
        } catch (error) {
          console.error('Error loading color rankings:', error);
        }
      }
    }
  };

  const saveProgress = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('benehab_values_colors', JSON.stringify(colorAssociations));
      localStorage.setItem('benehab_values_color_rankings', JSON.stringify(colorRankings));
    }
  };

  const updateProgress = () => {
    const totalStages = 2;
    let stageProgress = 0;
    
    if (currentStage === 1) {
      const coloredCount = Object.keys(colorAssociations).length;
      stageProgress = (coloredCount / items.length) * 50;
    } else if (currentStage === 2) {
      stageProgress = 50 + (colorRankings.length / colors.length) * 50;
    }
    
    setProgress(Math.min(Math.max(stageProgress, 0), 100));
  };

  // Pagination functions
  const totalPages = Math.ceil(items.length / itemsPerPage);
  const currentItems = items.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  
  const goToNextPage = () => {
    console.log('goToNextPage called:', { currentPage, totalPages, canGoToNextPage: canGoToNextPage() });
    if (currentPage < totalPages && canGoToNextPage()) {
      setCurrentPage(currentPage + 1);
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
    const allSelected = pageItems.every(item => colorAssociations[item.concept]);
    console.log('canGoToNextPage:', { 
      currentPage, 
      totalPages, 
      startIndex, 
      endIndex, 
      pageItems: pageItems.map(p => p.concept),
      colorAssociations: Object.keys(colorAssociations),
      allSelected 
    });
    return allSelected;
  };
  
  const canGoToPreviousPage = () => {
    return currentPage > 1;
  };

  const handleColorSelect = (concept, color) => {
    setColorAssociations(prev => ({
      ...prev,
      [concept]: color
    }));
    saveProgress();
  };

  const handleColorRankingChange = (color, newIndex) => {
    let newColorRankings = [...colorRankings];
    
    // Remove color from current position
    const currentIndex = newColorRankings.indexOf(color);
    if (currentIndex !== -1) {
      newColorRankings.splice(currentIndex, 1);
    }
    
    // Insert at new position
    newColorRankings.splice(newIndex, 0, color);
    
    setColorRankings(newColorRankings);
    saveProgress();
  };

  const canGoToStage2 = () => {
    return Object.keys(colorAssociations).length === items.length;
  };
  
  const isLastPage = () => {
    return currentPage === totalPages;
  };

  const canSubmit = () => {
    return colorRankings.length === colors.length;
  };

  const goToStage2 = () => {
    if (canGoToStage2()) {
      setCurrentStage(2);
    }
  };

  const goBackToStage1 = () => {
    setCurrentStage(1);
  };

  const submitSurvey = async () => {
    if (!canSubmit()) return;

    setLoading(true);
    try {
      const response = await fetch('/api/profiling/values/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ colorAssociations, colorRankings }),
      });

      if (response.ok) {
        const result = await response.json();
        localStorage.setItem('benehab_values_profile', JSON.stringify(result.profile));
        
        // Generate PIB
        await generatePIB();
        
        // Redirect to results page
        router.push('/profiling/values-results');
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

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p>Loading concepts...</p>
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
              <h1 className="text-4xl font-bold mb-2">Values Model</h1>
              <p className="text-emerald-100 text-lg">
                Discover your personal value system through color associations
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
              <span className="font-medium">Stage {currentStage} of 2</span>
            </div>
            <div className="w-full bg-white bg-opacity-20 rounded-full h-3">
              <div 
                className="bg-white h-3 rounded-full transition-all duration-500 shadow-lg"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>

          <div className="text-center">
            <p className="text-xl text-emerald-100">
              {currentStage === 1 
                ? 'Choose colors that best represent each concept to you'
                : 'Arrange your selected colors from most to least pleasant'
              }
            </p>
          </div>
        </div>

        {/* Stage 1: Color associations */}
        {currentStage === 1 && (
          <div className="bg-white rounded-3xl p-8 mb-6 shadow-lg border border-gray-100">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Stage 1: Color Associations
              </h2>
              <p className="text-gray-600 text-lg">
                Choose a color that best represents each concept
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
            
            {/* Concepts grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {currentItems.map((item) => (
                <div key={item.id} className="group relative">
                  <div className={`
                    bg-gradient-to-br from-white to-gray-50 rounded-2xl p-6 border-2 transition-all duration-300
                    ${colorAssociations[item.concept] 
                      ? 'border-emerald-300 shadow-lg shadow-emerald-100' 
                      : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                    }
                  `}>
                    {/* Concept name */}
                    <div className="text-center mb-6">
                      <h3 className="text-2xl font-bold text-gray-900 mb-2">
                        {item.concept}
                      </h3>
                      <div className="w-12 h-1 bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full mx-auto"></div>
                    </div>
                    
                    {/* Color selection */}
                    <div className="grid grid-cols-4 gap-3 mb-4">
                      {colors.map((color) => (
                        <button
                          key={color.name}
                          onClick={() => handleColorSelect(item.concept, color.name)}
                          className={`
                            w-12 h-12 rounded-2xl transition-all duration-300 transform
                            ${color.class}
                            ${colorAssociations[item.concept] === color.name 
                              ? 'ring-4 ring-emerald-300 scale-110 shadow-lg' 
                              : 'hover:scale-105 hover:shadow-md'
                            }
                          `}
                          title={color.label}
                        />
                      ))}
                    </div>
                    
                    {/* Selection indicator */}
                    {colorAssociations[item.concept] && (
                      <div className="text-center">
                        <div className="inline-flex items-center px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium">
                          <div className={`w-3 h-3 rounded-full mr-2 ${colors.find(c => c.name === colorAssociations[item.concept])?.class}`}></div>
                          {colors.find(c => c.name === colorAssociations[item.concept])?.label}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            {/* Progress and navigation */}
            <div className="flex flex-col items-center space-y-6">
              {/* Progress bar */}
              <div className="w-full max-w-md">
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>Progress: {Object.keys(colorAssociations).length} of {items.length}</span>
                  <span>{Math.round((Object.keys(colorAssociations).length / items.length) * 100)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-gradient-to-r from-emerald-400 to-emerald-600 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min((Object.keys(colorAssociations).length / items.length) * 100, 100)}%` }}
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
                    onClick={goToStage2}
                    disabled={!canGoToStage2()}
                    className={`
                      px-8 py-3 rounded-xl font-medium transition-all duration-300 transform
                      ${canGoToStage2()
                        ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white hover:from-emerald-600 hover:to-emerald-700 hover:shadow-lg hover:scale-105'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }
                    `}
                  >
                    Complete Stage 1 →
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
        )}

        {/* Stage 2: Color ranking */}
        {currentStage === 2 && (
          <div className="bg-white rounded-3xl p-8 mb-6 shadow-lg border border-gray-100">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Stage 2: Color Ranking
              </h2>
              <p className="text-gray-600 text-lg">
                Arrange colors from most pleasant to least pleasant
              </p>
            </div>
            
            {/* Current ranking */}
            <div className="mb-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-6 text-center">
                Your Color Ranking
              </h3>
              
              <div className="space-y-3">
                {colorRankings.map((color, index) => (
                  <div key={color} className="group flex items-center p-4 bg-gradient-to-r from-gray-50 to-white rounded-2xl border border-gray-200 hover:border-emerald-300 transition-all duration-300">
                    <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-2xl font-bold text-lg mr-4">
                      {index + 1}
                    </div>
                    <div className={`w-12 h-12 rounded-2xl mr-4 shadow-md ${colors.find(c => c.name === color)?.class}`}></div>
                    <div className="flex-1">
                      <span className="text-lg font-semibold text-gray-900">
                        {colors.find(c => c.name === color)?.label || color}
                      </span>
                      <div className="text-sm text-gray-500">
                        {Object.keys(colorAssociations).filter(concept => colorAssociations[concept] === color).length} concepts associated
                      </div>
                    </div>
                    <button
                      onClick={() => handleColorRankingChange(color, colorRankings.length)}
                      className="opacity-0 group-hover:opacity-100 p-2 text-gray-400 hover:text-red-500 transition-all duration-300"
                      title="Remove from ranking"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
              
              {colorRankings.length < colors.length && (
                <div className="mt-6 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-2xl">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center mr-3">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <p className="text-yellow-800 font-medium">
                      Choose colors from the list below to complete your ranking
                    </p>
                  </div>
                </div>
              )}
            </div>
            
            {/* Available colors */}
            <div className="mb-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-6 text-center">
                Available Colors
              </h3>
              <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
                {colors
                  .filter(color => !colorRankings.includes(color.name))
                  .map((color) => (
                    <button
                      key={color.name}
                      onClick={() => handleColorRankingChange(color.name, colorRankings.length)}
                      className="group flex flex-col items-center p-4 border-2 border-gray-200 rounded-2xl hover:border-emerald-300 hover:bg-emerald-50 transition-all duration-300 transform hover:scale-105"
                    >
                      <div className={`w-12 h-12 rounded-2xl mb-3 shadow-md ${color.class}`}></div>
                      <span className="text-sm font-medium text-gray-700 text-center group-hover:text-emerald-700">
                        {color.label}
                      </span>
                    </button>
                  ))}
              </div>
            </div>
            
            {/* Navigation */}
            <div className="flex justify-between items-center">
              <button
                onClick={goBackToStage1}
                className="px-8 py-3 border-2 border-gray-300 text-gray-700 rounded-2xl hover:border-emerald-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all duration-300 font-medium"
              >
                ← Back to Colors
              </button>
              
              <button
                onClick={submitSurvey}
                disabled={!canSubmit() || loading}
                className={`
                  px-8 py-3 rounded-2xl font-medium transition-all duration-300 transform
                  ${canSubmit() && !loading
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
            </div>
          </div>
        )}

        {/* Hint */}
        <div className="text-center text-sm text-gray-500 mt-4">
          Your answers are automatically saved. After completion, you will be able to communicate with Tatiana in a personalized mode.
        </div>
      </div>
    </div>
  );
}
