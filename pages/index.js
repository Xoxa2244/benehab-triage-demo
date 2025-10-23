// pages/index.js

import { useState, useEffect } from 'react';
import DemographicsCheck from '../components/DemographicsCheck';
import Link from 'next/link';

export default function Home() {
  const [demographics, setDemographics] = useState(null);
  const [completedSurveys, setCompletedSurveys] = useState({
    attitude: false,
    typology: false,
    values: false
  });
  const [chatMessages, setChatMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [activeAssignments, setActiveAssignments] = useState([]);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    // Check if we're in the browser
    if (typeof window === 'undefined') return;
    
    // Load demographic data on page load
    const savedData = localStorage.getItem('benehab_demographics');
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        setDemographics(parsed);
      } catch (e) {
        console.error('Error loading demographic data:', e);
      }
    }

    // Check completed surveys
    setCompletedSurveys({
      attitude: !!localStorage.getItem('benehab_attitude_profile'),
      typology: !!localStorage.getItem('benehab_typology_profile'),
      values: !!localStorage.getItem('benehab_values_profile')
    });

    // Load active assignments
    loadActiveAssignments();

    // Add personalized welcome message from May
    const completedCount = Object.values(completedSurveys).filter(Boolean).length;
    const remainingCount = 3 - completedCount;
    
    let welcomeText = `Hello ${demographics.name || 'there'}! I'm May, your personal health assistant. 👋\n\nI'm so glad to see you again! It's wonderful to reconnect with you.\n\nI'm here to help you with:\n• Doctor appointments\n• Medication reminders\n• Health questions\n• Personalized support\n\n`;
    
    if (completedCount === 0) {
      welcomeText += `Let's start by completing your profiling surveys so I can better understand you and provide more personalized assistance.`;
    } else if (completedCount === 1) {
      welcomeText += `I'm really pleased to see that you've completed one of your profiling surveys! You're making great progress. Let's continue with the remaining surveys so I can get a complete picture of your preferences and provide even better personalized support.`;
    } else if (completedCount === 2) {
      welcomeText += `I'm absolutely delighted that you've completed ${completedCount} out of 3 profiling surveys! You're doing fantastic work. Just one more survey to go - your values profile. Once you complete this final survey, I'll have a complete understanding of your preferences and will be able to motivate you much more effectively to stay engaged with your treatment process.`;
    } else {
      welcomeText += `Congratulations! You've completed all your profiling surveys. I now have a complete understanding of your preferences and can provide you with the most personalized support possible. I'm excited to help you stay motivated and engaged with your treatment journey!`;
    }
    
    const welcomeMessage = {
      id: Date.now(),
      type: 'may',
      text: welcomeText,
      timestamp: new Date().toISOString()
    };
    setChatMessages([welcomeMessage]);
  }, []);

  // Handle click outside menu to close it
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isMenuOpen && !event.target.closest('.menu-container')) {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);

  const loadActiveAssignments = () => {
    try {
      const assignments = JSON.parse(localStorage.getItem('benehab_assignments') || '[]');
      const now = new Date();
      const active = assignments.filter(assignment => {
        const dueDate = new Date(assignment.dueDate);
        return dueDate > now && !assignment.completed;
      });
      setActiveAssignments(active);
    } catch (error) {
      console.error('Error loading assignments:', error);
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      text: inputMessage,
      timestamp: new Date().toISOString()
    };

    setChatMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: inputMessage,
          demographics,
          completedSurveys,
          activeAssignments
        }),
        });

      const data = await response.json();
      
      const mayMessage = {
        id: Date.now() + 1,
        type: 'may',
        text: data.response || data.fallback || 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date().toISOString()
      };

      setChatMessages(prev => [...prev, mayMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = {
        id: Date.now() + 1,
        type: 'may',
        text: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date().toISOString()
      };
      setChatMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const quickQuestions = [
    "How can I improve my health?",
    "What should I do if I feel unwell?",
    "How to manage stress?",
    "Tell me about healthy lifestyle",
    "What are the benefits of regular exercise?",
    "How to maintain mental health?"
  ];

  const surveyData = [
    {
      id: 'attitude',
      title: 'Attitude',
      shortTitle: 'Attitude',
      description: 'Discover your attitude towards health and illness',
      link: '/profiling/attitude',
      completed: completedSurveys.attitude,
      color: 'emerald',
      icon: '💭'
    },
    {
      id: 'typology',
      title: 'Communication Style',
      shortTitle: 'Type',
      description: 'Understand your communication preferences',
      link: '/profiling/typology',
      completed: completedSurveys.typology,
      color: 'blue',
      icon: '💬'
    },
    {
      id: 'values',
      title: 'Values Model',
      shortTitle: 'Values',
      description: 'Explore your personal value system',
      link: '/profiling/values',
      completed: completedSurveys.values,
      color: 'purple',
      icon: '⭐'
    }
  ];

  const getSurveyColor = (color) => {
    const colors = {
      emerald: 'from-emerald-500 to-emerald-600',
      blue: 'from-blue-500 to-blue-600',
      purple: 'from-purple-500 to-purple-600'
    };
    return colors[color] || 'from-gray-500 to-gray-600';
  };

  const getSurveyHoverColor = (color) => {
    const colors = {
      emerald: 'hover:from-emerald-600 hover:to-emerald-700',
      blue: 'hover:from-blue-600 hover:to-blue-700',
      purple: 'hover:from-purple-600 hover:to-purple-700'
    };
    return colors[color] || 'hover:from-gray-600 hover:to-gray-700';
  };

  const getProfileProgress = () => {
    const completedCount = Object.values(completedSurveys).filter(Boolean).length;
    return Math.round((completedCount / 3) * 100);
  };

  const getSurveyProgress = (surveyId) => {
    if (typeof window === 'undefined') return 0;
    
    try {
      let progress = 0;
      switch (surveyId) {
        case 'attitude':
          const attitudeAnswers = JSON.parse(localStorage.getItem('benehab_attitude_answers') || '[]');
          const attitudeAnswered = attitudeAnswers.filter(a => a !== null).length;
          progress = Math.round((attitudeAnswered / 41) * 100);
          break;
        case 'typology':
          const typologyAnswers = JSON.parse(localStorage.getItem('benehab_typology_answers') || '{}');
          const typologyAnswered = Object.keys(typologyAnswers).length;
          // Assuming 9 questions for typology
          progress = Math.round((typologyAnswered / 9) * 100);
          break;
        case 'values':
          const valuesAnswers = JSON.parse(localStorage.getItem('benehab_values_answers') || '{}');
          const valuesAnswered = Object.keys(valuesAnswers).length;
          // Assuming 15 concepts for values
          progress = Math.round((valuesAnswered / 15) * 100);
          break;
      }
      return Math.min(progress, 100);
    } catch (error) {
      console.error('Error calculating survey progress:', error);
      return 0;
    }
  };

  const getProgressColor = (progress) => {
    if (progress < 25) return 'text-red-500';
    if (progress < 50) return 'text-orange-500';
    if (progress < 75) return 'text-yellow-500';
    return 'text-green-500';
  };

  const getProgressBgColor = (progress) => {
    if (progress < 25) return 'text-red-200';
    if (progress < 50) return 'text-orange-200';
    if (progress < 75) return 'text-yellow-200';
    return 'text-green-200';
  };

  if (!demographics) {
    return <DemographicsCheck onComplete={setDemographics} />;
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Desktop Layout - Unchanged */}
      <div className="hidden md:block min-h-screen bg-gray-50">
        {/* Profile Header */}
        <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white p-4">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                <span className="text-xl font-bold">{demographics.name?.charAt(0) || 'U'}</span>
              </div>
              <div className="flex items-center space-x-4">
                <div>
                  <h2 className="text-xl font-semibold">Welcome, {demographics.name || 'User'}!</h2>
                  <p className="text-emerald-100 text-sm">
                    {demographics.age} years old • {demographics.gender}
                  </p>
                </div>
                {/* Profile Progress Indicator */}
                <div className="flex items-center space-x-3">
                  <div className="relative w-12 h-12">
                    <svg className="w-12 h-12 transform -rotate-90" viewBox="0 0 36 36">
                      <path
                        className="text-emerald-200"
                        stroke="currentColor"
                        strokeWidth="2"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                      <path
                        className="text-white"
                        stroke="currentColor"
                        strokeWidth="2"
                        fill="none"
                        strokeDasharray={`${getProfileProgress()}, 100`}
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-white font-bold text-xs">{getProfileProgress()}%</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-emerald-100 text-xs font-medium">Profile Data</p>
                    <p className="text-white text-xs">
                      {Object.values(completedSurveys).filter(Boolean).length}/3 surveys
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Burger Menu */}
            <div className="relative menu-container">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2 rounded-lg bg-white bg-opacity-20 hover:bg-opacity-30 transition-all duration-300"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              
              {/* Dropdown Menu */}
              {isMenuOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-lg border border-gray-100 py-2 z-50">
                  <Link href="/assignments" className="flex items-center px-4 py-3 text-gray-700 hover:bg-gray-50 transition-colors">
                    <svg className="w-5 h-5 mr-3 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    Health Assignments
                  </Link>
                  <Link href="/communication-instructions" className="flex items-center px-4 py-3 text-gray-700 hover:bg-gray-50 transition-colors">
                    <svg className="w-5 h-5 mr-3 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    Communication Instructions
                  </Link>
                  <Link href="/debug-prompts" className="flex items-center px-4 py-3 text-gray-700 hover:bg-gray-50 transition-colors">
                    <svg className="w-5 h-5 mr-3 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Debug Prompts
                  </Link>
                  <Link href="/staff-console" className="flex items-center px-4 py-3 text-gray-700 hover:bg-gray-50 transition-colors">
                    <svg className="w-5 h-5 mr-3 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Staff Console
                  </Link>
                  <Link href="/admin" className="flex items-center px-4 py-3 text-gray-700 hover:bg-gray-50 transition-colors">
                    <svg className="w-5 h-5 mr-3 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Admin Panel
                  </Link>
                  <div className="border-t border-gray-100 my-2"></div>
                  <Link href="/base-prompt" className="flex items-center px-4 py-3 text-gray-700 hover:bg-gray-50 transition-colors">
                    <svg className="w-5 h-5 mr-3 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Base Prompt Editor
                  </Link>
                  </div>
                )}
              </div>
            </div>
          </div>

        <div className="max-w-6xl mx-auto p-4">
          {/* Welcome Banner */}
          <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-3xl p-8 mb-6 shadow-lg text-white">
            <div className="text-center">
              <h1 className="text-4xl font-bold mb-4">
                Welcome, {demographics.name}! 👋
              </h1>
              <p className="text-xl text-emerald-100 max-w-3xl mx-auto leading-relaxed">
                I'm May, your personal agent. Let's go through profiling together so I can better understand you and adapt my communication style to your individual characteristics.
              </p>
              </div>
            </div>

          {/* Survey Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {surveyData.map((survey) => (
              <Link key={survey.id} href={survey.link}>
                <div className={`
                  rounded-3xl p-5 shadow-lg border-2 transition-all duration-300 transform hover:scale-105 hover:shadow-xl h-56 flex flex-col relative overflow-hidden
                  ${survey.completed 
                    ? 'border-green-300 bg-gradient-to-br from-green-50 via-green-25 to-white' 
                    : survey.color === 'emerald'
                    ? 'border-emerald-200 bg-gradient-to-br from-emerald-50 via-emerald-25 to-white'
                    : survey.color === 'blue'
                    ? 'border-blue-200 bg-gradient-to-br from-blue-50 via-blue-25 to-white'
                    : 'border-purple-200 bg-gradient-to-br from-purple-50 via-purple-25 to-white'
                  }
                `}>
                  {/* Progress indicator */}
                  <div className="absolute top-4 right-4">
                    {survey.completed ? (
                      <div className="flex items-center text-green-600">
                        <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-sm font-medium">Completed</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <div className="relative w-8 h-8">
                          <svg className="w-8 h-8 transform -rotate-90" viewBox="0 0 36 36">
                            <path
                              className={getProgressBgColor(getSurveyProgress(survey.id))}
                              stroke="currentColor"
                              strokeWidth="2"
                              fill="none"
                              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            />
                            <path
                              className={getProgressColor(getSurveyProgress(survey.id))}
                              stroke="currentColor"
                              strokeWidth="2"
                              fill="none"
                              strokeDasharray={`${getSurveyProgress(survey.id)}, 100`}
                              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            />
                          </svg>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className={`font-bold text-xs ${getProgressColor(getSurveyProgress(survey.id))}`}>
                              {getSurveyProgress(survey.id)}%
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 flex flex-col">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      {survey.title}
                    </h3>
                    <p className="text-gray-600 mb-4 flex-1 leading-relaxed text-sm">
                      {survey.description}
                    </p>
                    
                    <div className={`
                      px-4 py-2.5 rounded-xl font-medium text-center transition-all duration-300 mt-auto text-sm
                      ${survey.completed
                        ? 'bg-green-100 text-green-700'
                        : survey.color === 'emerald'
                        ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white hover:from-emerald-600 hover:to-emerald-700'
                        : survey.color === 'blue'
                        ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700'
                        : 'bg-gradient-to-r from-purple-500 to-purple-600 text-white hover:from-purple-600 hover:to-purple-700'
                      }
                    `}>
                      {survey.completed ? 'View Results' : 'Start Survey'}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
                </div>

          {/* Chat Section */}
          <div className="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden">
            {/* Chat Header */}
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-lg">M</span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Chat with May</h3>
                  <p className="text-sm text-gray-600">Your personal health assistant</p>
                </div>
              </div>
            </div>

            {/* Chat Messages */}
            <div className="h-[28rem] overflow-y-auto p-6 space-y-4">
              {chatMessages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                    className={`
                      max-w-xs lg:max-w-md px-4 py-3 rounded-2xl
                      ${message.type === 'user'
                        ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white'
                        : 'bg-gray-100 text-gray-900'
                      }
                    `}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.text}</p>
                    <p className={`text-xs mt-1 ${message.type === 'user' ? 'text-emerald-100' : 'text-gray-500'}`}>
                      {new Date(message.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
              ))}
                
                {isTyping && (
                  <div className="flex justify-start">
                  <div className="bg-gray-100 text-gray-900 px-4 py-3 rounded-2xl">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

            {/* Quick Questions */}
            <div className="px-6 py-4 border-t border-gray-200">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Quick Questions:</h4>
              <div className="flex flex-wrap gap-2">
                {quickQuestions.map((question, index) => (
                  <button
                    key={index}
                    onClick={() => setInputMessage(question)}
                    className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm rounded-full transition-colors"
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>

            {/* Chat Input */}
            <div className="px-6 py-4 border-t border-gray-200">
              <div className="flex space-x-4">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message here..."
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
                <button
                  onClick={sendMessage}
                  disabled={!inputMessage.trim() || isTyping}
                  className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-2xl font-medium hover:from-emerald-600 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                >
                  Send
                </button>
              </div>
            </div>
            </div>

          {/* Footer */}
          <div className="text-center text-gray-500 text-sm mt-8 py-4">
            © {new Date().getFullYear()} Benehab. All rights reserved.
          </div>
        </div>
      </div>

      {/* Mobile Layout - ChatGPT-inspired design */}
      <div className="md:hidden flex flex-col h-screen bg-gradient-to-br from-gray-50 to-white">
        {/* Mobile Header - Professional */}
        <div className="flex items-center justify-between px-4 py-4 bg-white/80 backdrop-blur-sm border-b border-gray-200/50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-600 rounded-full flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-lg">{demographics.name?.charAt(0) || 'U'}</span>
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">{demographics.name || 'User'}</h1>
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs text-gray-500">online</span>
              </div>
            </div>
          </div>
          
          {/* Burger Menu */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 transition-all duration-200"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        {/* Mobile Menu Dropdown */}
        {isMenuOpen && (
          <div className="absolute top-16 right-4 w-64 bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 py-2 z-50">
            <Link href="/assignments" className="flex items-center px-4 py-3 text-gray-700 hover:bg-gray-50 transition-colors">
              <svg className="w-5 h-5 mr-3 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              Health Assignments
            </Link>
            <Link href="/staff-console" className="flex items-center px-4 py-3 text-gray-700 hover:bg-gray-50 transition-colors">
              <svg className="w-5 h-5 mr-3 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Staff Console
            </Link>
            <Link href="/admin" className="flex items-center px-4 py-3 text-gray-700 hover:bg-gray-50 transition-colors">
              <svg className="w-5 h-5 mr-3 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Admin Panel
            </Link>
          </div>
        )}

        {/* Mobile Progress Indicator - Beautiful */}
        <div className="px-4 py-3 bg-gradient-to-r from-gray-50/50 to-white/50 backdrop-blur-sm border-b border-gray-200/30">
          <div className="flex items-center justify-center space-x-3">
            <span className="text-sm font-medium text-gray-700">Profile Progress</span>
            <div className="flex items-center space-x-2">
              <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden shadow-inner">
                <div 
                  className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 transition-all duration-500 ease-out shadow-sm"
                  style={{ width: `${getProfileProgress()}%` }}
                ></div>
              </div>
              <span className="text-sm font-semibold text-emerald-600">{getProfileProgress()}%</span>
            </div>
          </div>
        </div>

        {/* Mobile Survey Buttons - Clean Design */}
        <div className="px-4 py-4 bg-white/60 backdrop-blur-sm border-b border-gray-200/30">
          <div className="flex justify-center space-x-2">
            {surveyData.map((survey) => (
              <Link key={survey.id} href={survey.link}>
                <div className={`
                  relative flex items-center justify-center w-24 h-12 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg
                  ${survey.completed
                    ? 'bg-gradient-to-r from-green-500 to-green-600 shadow-green-200'
                    : survey.color === 'emerald'
                    ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 shadow-emerald-200 hover:shadow-emerald-300'
                    : survey.color === 'blue'
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 shadow-blue-200 hover:shadow-blue-300'
                    : 'bg-gradient-to-r from-purple-500 to-purple-600 shadow-purple-200 hover:shadow-purple-300'
                  }
                `}>
                  {/* Completion Indicator */}
                  {survey.completed ? (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-white rounded-full flex items-center justify-center shadow-lg">
                      <svg className="w-3 h-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  ) : (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-white rounded-full flex items-center justify-center shadow-lg">
                      <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                    </div>
                  )}
                  
                  {/* Survey Title */}
                  <span className="text-white text-sm font-semibold text-center">
                    {survey.shortTitle}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Mobile Chat Interface - Professional */}
        <div className="flex-1 flex flex-col overflow-hidden bg-gradient-to-b from-white/80 to-gray-50/80">
          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
            {chatMessages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`
                    max-w-[85%] px-5 py-4 rounded-3xl shadow-sm
                    ${message.type === 'user'
                      ? 'bg-gradient-to-br from-emerald-500 to-emerald-600 text-white rounded-br-lg'
                      : 'bg-white/90 backdrop-blur-sm text-gray-900 rounded-bl-lg border border-gray-200/50'
                    }
                  `}
                >
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.text}</p>
                  <p className={`text-xs mt-2 ${message.type === 'user' ? 'text-emerald-100' : 'text-gray-500'}`}>
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}
            
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-white/90 backdrop-blur-sm text-gray-900 px-5 py-4 rounded-3xl rounded-bl-lg border border-gray-200/50 shadow-sm">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Mobile Quick Questions */}
          <div className="px-4 py-3 bg-white/60 backdrop-blur-sm border-t border-gray-200/30">
            <div className="flex justify-center space-x-2">
              {quickQuestions.slice(0, 3).map((question, index) => (
                <button
                  key={index}
                  onClick={() => setInputMessage(question)}
                  className="px-4 py-2 bg-white/80 hover:bg-white text-gray-700 text-xs rounded-full transition-all duration-200 whitespace-nowrap shadow-sm border border-gray-200/50 hover:shadow-md"
                >
                  {question}
                </button>
              ))}
            </div>
          </div>

          {/* Mobile Chat Input - Professional */}
          <div className="px-4 py-4 bg-white/80 backdrop-blur-sm border-t border-gray-200/50">
            <div className="flex items-end space-x-3">
              <div className="flex-1 relative">
                <textarea
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Message May..."
                  className="w-full px-5 py-4 pr-14 bg-white/90 backdrop-blur-sm border border-gray-200/50 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 resize-none text-sm shadow-sm"
                  rows={1}
                  style={{ minHeight: '48px', maxHeight: '120px' }}
                />
                <button
                  onClick={sendMessage}
                  disabled={!inputMessage.trim() || isTyping}
                  className="absolute right-3 bottom-3 w-9 h-9 bg-gradient-to-br from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 disabled:from-gray-300 disabled:to-gray-400 text-white rounded-full flex items-center justify-center transition-all duration-200 shadow-lg hover:shadow-xl disabled:shadow-none"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}