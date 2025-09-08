

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
    
    setProgress(Math.min(stageProgress, 100));
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
        <div className="bg-white rounded-2xl p-6 mb-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-semibold text-gray-900">Values Model</h1>
            <Link href="/" className="text-emerald-600 hover:text-emerald-700">
              Back to Chat
            </Link>
          </div>
          
          <div className="mb-4">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Progress: {Math.round(progress)}%</span>
              <span>Stage {currentStage} of 2</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-emerald-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>

          <p className="text-gray-700">
            {currentStage === 1 
              ? 'Choose a color for each concept that best associates with your feelings.'
              : 'Arrange colors in order from most pleasant to least pleasant.'
            }
          </p>
        </div>

        {/* Stage 1: Color associations */}
        {currentStage === 1 && (
          <div className="bg-white rounded-2xl p-6 mb-6 shadow-sm">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                Stage 1: Color Associations
              </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {items.map((item) => (
                <div key={item.id} className="border-2 border-gray-200 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-2">{item.concept}</h3>
                  <p className="text-sm text-gray-600 mb-3">{item.description}</p>
                  
                  <div className="grid grid-cols-4 gap-2">
                    {colors.map((color) => (
                      <button
                        key={color.name}
                        onClick={() => handleColorSelect(item.concept, color.name)}
                        className={`
                          w-8 h-8 rounded-full transition-all
                          ${color.class}
                          ${colorAssociations[item.concept] === color.name 
                            ? 'ring-4 ring-emerald-300 scale-110' 
                            : 'hover:scale-105'
                          }
                        `}
                        title={color.label}
                      />
                    ))}
                  </div>
                  
                  {colorAssociations[item.concept] && (
                    <div className="mt-2 text-sm text-emerald-600">
                      ✓ Selected: {colors.find(c => c.name === colorAssociations[item.concept])?.label}
                    </div>
                  )}
                </div>
              ))}
            </div>
            
            <div className="mt-6 text-center">
              <div className="text-sm text-gray-600 mb-2">
                Colored: {Object.keys(colorAssociations).length} of {items.length}
              </div>
              <button
                onClick={goToStage2}
                disabled={!canGoToStage2()}
                className={`
                  px-6 py-2 rounded-xl transition-colors
                  ${canGoToStage2()
                    ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }
                `}
              >
                Go to Ranking →
              </button>
            </div>
          </div>
        )}

        {/* Stage 2: Color ranking */}
        {currentStage === 2 && (
          <div className="bg-white rounded-2xl p-6 mb-6 shadow-sm">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                Stage 2: Color Ranking by Attractiveness
              </h2>
            
            <div className="mb-6">
              <h3 className="font-medium text-gray-900 mb-3">From most pleasant to least pleasant:</h3>
              
              <div className="space-y-2">
                {colorRankings.map((color, index) => (
                  <div key={color} className="flex items-center p-3 bg-gray-50 rounded-lg">
                    <span className="text-lg font-bold text-emerald-600 w-8">{index + 1}</span>
                    <div className="w-8 h-8 rounded-full mr-3" style={{ backgroundColor: color }}></div>
                    <span className="flex-1 text-gray-900">{colors.find(c => c.name === color)?.label || color}</span>
                    <span className="text-sm text-gray-500">
                      {Object.keys(colorAssociations).filter(concept => colorAssociations[concept] === color).length} concepts
                    </span>
                  </div>
                ))}
              </div>
              
              {colorRankings.length < colors.length && (
                <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-yellow-800 text-sm">
                    Choose colors from the list below to complete the ranking
                  </p>
                </div>
              )}
            </div>
            
            <div className="mb-6">
              <h3 className="font-medium text-gray-900 mb-3">Available colors:</h3>
              <div className="grid grid-cols-4 md:grid-cols-6 gap-3">
                {colors
                  .filter(color => !colorRankings.includes(color.name))
                  .map((color) => (
                    <button
                      key={color.name}
                      onClick={() => handleColorRankingChange(color.name, colorRankings.length)}
                      className="flex flex-col items-center p-3 border border-gray-200 rounded-lg hover:border-emerald-300 hover:bg-emerald-50 transition-colors"
                    >
                      <div className={`w-8 h-8 rounded-full mb-2 ${color.class}`}></div>
                      <span className="text-xs text-gray-700 text-center">{color.label}</span>
                    </button>
                  ))}
              </div>
            </div>
            
            <div className="flex justify-between items-center">
              <button
                onClick={goBackToStage1}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-xl hover:border-emerald-400 hover:text-emerald-600 transition-colors"
              >
                ← Back to Colors
              </button>
              
              <button
                onClick={submitSurvey}
                disabled={!canSubmit() || loading}
                className={`
                  px-6 py-2 rounded-xl transition-colors
                  ${canSubmit() && !loading
                    ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }
                `}
              >
                {loading ? 'Completing...' : 'Complete Survey'}
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
